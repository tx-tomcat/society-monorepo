import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CompanionsService } from './companions.service';
import { PrismaService } from '@/prisma/prisma.service';
import { BoostTierEnum } from '../dto/companion.dto';

describe('CompanionsService', () => {
  let service: CompanionsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    companionProfile: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    companionAvailability: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    companionPhoto: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
    },
    companionService: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    review: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    booking: {
      findMany: jest.fn(),
    },
    profileBoost: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CompanionsService>(CompanionsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('browseCompanions', () => {
    beforeEach(() => {
      // Default: no active boosts
      mockPrismaService.profileBoost.findMany.mockResolvedValue([]);
    });

    it('should return paginated list of companions', async () => {
      const mockCompanions = [
        {
          id: 'comp-1',
          userId: 'user-1',
          bio: 'A friendly companion',
          hourlyRate: 500000,
          halfDayRate: 2000000,
          fullDayRate: 3500000,
          ratingAvg: 4.5,
          ratingCount: 10,
          verificationStatus: 'VERIFIED',
          isFeatured: false,
          isActive: true,
          isHidden: false,
          totalBookings: 25,
          user: {
            id: 'user-1',
            fullName: 'Test Companion',
            avatarUrl: 'avatar.jpg',
            dateOfBirth: new Date('1995-01-15'),
            gender: 'FEMALE',
            isVerified: true,
          },
          photos: [{ id: 'photo-1', url: 'photo1.jpg', position: 0 }],
          services: [{ serviceType: 'FAMILY_INTRODUCTION', isEnabled: true }],
        },
      ];

      mockPrismaService.companionProfile.findMany.mockResolvedValue(mockCompanions);
      mockPrismaService.companionProfile.count.mockResolvedValue(1);

      const result = await service.browseCompanions({ page: 1, limit: 20 });

      expect(result.companions).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.companions[0].displayName).toBe('Test Companion');
      expect(result.companions[0].isVerified).toBe(true);
    });

    it('should filter by service type', async () => {
      mockPrismaService.companionProfile.findMany.mockResolvedValue([]);
      mockPrismaService.companionProfile.count.mockResolvedValue(0);

      await service.browseCompanions({ serviceType: 'FAMILY_INTRODUCTION' });

      expect(mockPrismaService.companionProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            services: {
              some: {
                serviceType: 'FAMILY_INTRODUCTION',
                isEnabled: true,
              },
            },
          }),
        }),
      );
    });

    it('should filter by price range', async () => {
      mockPrismaService.companionProfile.findMany.mockResolvedValue([]);
      mockPrismaService.companionProfile.count.mockResolvedValue(0);

      await service.browseCompanions({ minPrice: 300000, maxPrice: 1000000 });

      expect(mockPrismaService.companionProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            hourlyRate: { gte: 300000, lte: 1000000 },
          }),
        }),
      );
    });

    it('should prioritize boosted companions in popular sort', async () => {
      const mockCompanions = [
        {
          id: 'comp-1',
          userId: 'user-1',
          bio: 'First companion',
          hourlyRate: 500000,
          halfDayRate: null,
          fullDayRate: null,
          ratingAvg: 4.5,
          ratingCount: 10,
          verificationStatus: 'VERIFIED',
          isFeatured: false,
          isActive: true,
          isHidden: false,
          totalBookings: 50,
          user: { id: 'user-1', fullName: 'Companion 1', avatarUrl: null, dateOfBirth: null, gender: null, isVerified: true },
          photos: [],
          services: [],
        },
        {
          id: 'comp-2',
          userId: 'user-2',
          bio: 'Boosted companion',
          hourlyRate: 400000,
          halfDayRate: null,
          fullDayRate: null,
          ratingAvg: 4.0,
          ratingCount: 5,
          verificationStatus: 'VERIFIED',
          isFeatured: false,
          isActive: true,
          isHidden: false,
          totalBookings: 10,
          user: { id: 'user-2', fullName: 'Companion 2', avatarUrl: null, dateOfBirth: null, gender: null, isVerified: true },
          photos: [],
          services: [],
        },
      ];

      // comp-2 has an active boost
      mockPrismaService.profileBoost.findMany.mockResolvedValue([
        { companionId: 'comp-2', multiplier: 2.0 },
      ]);
      mockPrismaService.companionProfile.findMany.mockResolvedValue(mockCompanions);
      mockPrismaService.companionProfile.count.mockResolvedValue(2);

      const result = await service.browseCompanions({ page: 1, limit: 20, sort: 'popular' });

      expect(result.companions).toHaveLength(2);
      // Boosted companion should appear first
      expect(result.companions[0].id).toBe('comp-2');
      expect(result.companions[0].isBoosted).toBe(true);
      expect(result.companions[0].boostMultiplier).toBe(2.0);
      expect(result.companions[1].id).toBe('comp-1');
      expect(result.companions[1].isBoosted).toBe(false);
    });
  });

  describe('getCompanionProfile', () => {
    it('should return companion profile', async () => {
      const mockCompanion = {
        id: 'comp-1',
        userId: 'user-1',
        bio: 'A friendly companion',
        heightCm: 165,
        languages: ['vi', 'en'],
        hourlyRate: 500000,
        halfDayRate: 2000000,
        fullDayRate: 3500000,
        ratingAvg: 4.5,
        ratingCount: 10,
        responseRate: 95,
        acceptanceRate: 98,
        completedBookings: 20,
        verificationStatus: 'VERIFIED',
        isFeatured: false,
        isActive: true,
        isHidden: false,
        createdAt: new Date(),
        user: {
          id: 'user-1',
          fullName: 'Test Companion',
          avatarUrl: 'avatar.jpg',
          dateOfBirth: new Date('1995-01-15'),
          gender: 'FEMALE',
          isVerified: true,
          createdAt: new Date(),
        },
        photos: [{ id: 'photo-1', url: 'photo1.jpg', position: 0 }],
        services: [{ serviceType: 'FAMILY_INTRODUCTION', description: null, priceAdjustment: 0 }],
        availability: [],
      };

      mockPrismaService.companionProfile.findUnique.mockResolvedValue(mockCompanion);
      mockPrismaService.review.findMany.mockResolvedValue([]);

      const result = await service.getCompanionProfile('comp-1');

      expect(result.id).toBe('comp-1');
      expect(result.displayName).toBe('Test Companion');
      expect(result.isVerified).toBe(true);
    });

    it('should throw NotFoundException when companion not found', async () => {
      mockPrismaService.companionProfile.findUnique.mockResolvedValue(null);

      await expect(service.getCompanionProfile('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when companion is inactive', async () => {
      mockPrismaService.companionProfile.findUnique.mockResolvedValue({
        id: 'comp-1',
        isActive: false,
        isHidden: false,
      });

      await expect(service.getCompanionProfile('comp-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCompanionProfile', () => {
    it('should update companion profile', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'COMPANION',
        companionProfile: { id: 'comp-1' },
      });
      mockPrismaService.companionProfile.update.mockResolvedValue({
        id: 'comp-1',
        bio: 'Updated bio',
      });

      const result = await service.updateCompanionProfile('user-1', { bio: 'Updated bio' });

      expect(result.bio).toBe('Updated bio');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.updateCompanionProfile('user-1', { bio: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when user is not a companion', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'HIRER',
        companionProfile: null,
      });

      await expect(service.updateCompanionProfile('user-1', { bio: 'Test' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getCompanionReviews', () => {
    it('should return paginated reviews', async () => {
      const mockCompanion = { id: 'comp-1', userId: 'user-1', ratingAvg: 4.5, ratingCount: 10 };
      const mockReviews = [
        {
          id: 'rev-1',
          rating: 5,
          comment: 'Great experience',
          tags: ['friendly', 'punctual'],
          createdAt: new Date(),
          reviewer: { fullName: 'John Doe', avatarUrl: null },
          booking: { occasionType: 'FAMILY_INTRODUCTION' },
        },
      ];

      mockPrismaService.companionProfile.findUnique.mockResolvedValue(mockCompanion);
      mockPrismaService.review.findMany.mockResolvedValue(mockReviews);
      mockPrismaService.review.count.mockResolvedValue(1);
      mockPrismaService.review.groupBy.mockResolvedValue([{ rating: 5, _count: { rating: 1 } }]);

      const result = await service.getCompanionReviews('comp-1');

      expect(result.reviews).toHaveLength(1);
      expect(result.averageRating).toBe(4.5);
      expect(result.reviews[0].reviewer.name).toBe('John Doe');
    });

    it('should throw NotFoundException when companion not found', async () => {
      mockPrismaService.companionProfile.findUnique.mockResolvedValue(null);

      await expect(service.getCompanionReviews('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMyCompanionProfile', () => {
    it('should return own companion profile with stats', async () => {
      const mockUser = {
        id: 'user-1',
        fullName: 'Test Companion',
        companionProfile: {
          id: 'comp-1',
          userId: 'user-1',
          bio: 'A friendly companion',
          heightCm: 165,
          languages: ['vi', 'en'],
          hourlyRate: 500000,
          halfDayRate: 2000000,
          fullDayRate: 3500000,
          ratingAvg: 4.5,
          ratingCount: 10,
          responseRate: 95,
          acceptanceRate: 98,
          totalBookings: 25,
          completedBookings: 20,
          verificationStatus: 'VERIFIED',
          isFeatured: false,
          isActive: true,
          isHidden: false,
          photos: [],
          services: [],
          availability: [],
          bankAccounts: [],
        },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getMyCompanionProfile('user-1');

      expect(result.id).toBe('comp-1');
      expect(result.displayName).toBe('Test Companion');
      expect(result.stats.rating).toBe(4.5);
      expect(result.stats.totalBookings).toBe(25);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getMyCompanionProfile('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when no companion profile', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        fullName: 'Test User',
        companionProfile: null,
      });

      await expect(service.getMyCompanionProfile('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateAvailability', () => {
    it('should update recurring availability', async () => {
      mockPrismaService.companionProfile.findUnique.mockResolvedValue({ id: 'comp-1' });
      mockPrismaService.companionAvailability.deleteMany.mockResolvedValue({ count: 5 });
      mockPrismaService.companionAvailability.createMany.mockResolvedValue({ count: 3 });

      const result = await service.updateAvailability('user-1', {
        recurring: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
          { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
          { dayOfWeek: 3, startTime: '09:00', endTime: '18:00' },
        ],
      });

      expect(result.success).toBe(true);
      expect(mockPrismaService.companionAvailability.deleteMany).toHaveBeenCalled();
      expect(mockPrismaService.companionAvailability.createMany).toHaveBeenCalled();
    });

    it('should throw NotFoundException when profile not found', async () => {
      mockPrismaService.companionProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.updateAvailability('user-1', { recurring: [] }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // Profile Boost Tests
  // ============================================

  describe('getBoostPricing', () => {
    it('should return all boost pricing tiers', () => {
      const pricing = service.getBoostPricing();

      expect(pricing).toHaveLength(3);
      expect(pricing.find(p => p.tier === 'STANDARD')).toBeDefined();
      expect(pricing.find(p => p.tier === 'PREMIUM')).toBeDefined();
      expect(pricing.find(p => p.tier === 'SUPER')).toBeDefined();
    });

    it('should have correct pricing structure', () => {
      const pricing = service.getBoostPricing();

      for (const tier of pricing) {
        expect(tier).toHaveProperty('tier');
        expect(tier).toHaveProperty('name');
        expect(tier).toHaveProperty('durationHours');
        expect(tier).toHaveProperty('price');
        expect(tier).toHaveProperty('multiplier');
        expect(tier).toHaveProperty('description');
        expect(tier.price).toBeGreaterThan(0);
        expect(tier.multiplier).toBeGreaterThan(1);
        expect(tier.durationHours).toBeGreaterThan(0);
      }
    });
  });

  describe('getActiveBoost', () => {
    it('should return active boost for companion', async () => {
      const mockProfile = { id: 'comp-1', userId: 'user-1' };
      const mockBoost = {
        id: 'boost-1',
        companionId: 'comp-1',
        tier: 'PREMIUM',
        status: 'ACTIVE',
        multiplier: 2.0,
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      };

      mockPrismaService.companionProfile.findUnique.mockResolvedValue(mockProfile);
      mockPrismaService.profileBoost.findFirst.mockResolvedValue(mockBoost);

      const result = await service.getActiveBoost('user-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('boost-1');
      expect(result?.tier).toBe('PREMIUM');
    });

    it('should return null when no active boost', async () => {
      const mockProfile = { id: 'comp-1', userId: 'user-1' };

      mockPrismaService.companionProfile.findUnique.mockResolvedValue(mockProfile);
      mockPrismaService.profileBoost.findFirst.mockResolvedValue(null);

      const result = await service.getActiveBoost('user-1');

      expect(result).toBeNull();
    });

    it('should throw NotFoundException when companion profile not found', async () => {
      mockPrismaService.companionProfile.findUnique.mockResolvedValue(null);

      await expect(service.getActiveBoost('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getBoostHistory', () => {
    it('should return boost history for companion', async () => {
      const mockProfile = { id: 'comp-1', userId: 'user-1' };
      const mockBoosts = [
        {
          id: 'boost-1',
          tier: 'PREMIUM',
          status: 'EXPIRED',
          price: 179000,
          startedAt: new Date('2024-01-01'),
          expiresAt: new Date('2024-01-03'),
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'boost-2',
          tier: 'STANDARD',
          status: 'ACTIVE',
          price: 99000,
          startedAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        },
      ];

      mockPrismaService.companionProfile.findUnique.mockResolvedValue(mockProfile);
      mockPrismaService.profileBoost.findMany.mockResolvedValue(mockBoosts);

      const result = await service.getBoostHistory('user-1', 10);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('boost-1');
      expect(result[1].id).toBe('boost-2');
    });

    it('should throw NotFoundException when companion profile not found', async () => {
      mockPrismaService.companionProfile.findUnique.mockResolvedValue(null);

      await expect(service.getBoostHistory('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('purchaseBoost', () => {
    it('should create pending boost for valid tier', async () => {
      const mockProfile = { id: 'comp-1', userId: 'user-1' };
      const mockBoost = {
        id: 'boost-1',
        companionId: 'comp-1',
        tier: 'STANDARD',
        status: 'PENDING',
        multiplier: 1.5,
        price: 99000,
      };

      mockPrismaService.companionProfile.findUnique.mockResolvedValue(mockProfile);
      mockPrismaService.profileBoost.findFirst.mockResolvedValue(null); // No active or pending boost
      mockPrismaService.profileBoost.create.mockResolvedValue(mockBoost);

      const result = await service.purchaseBoost('user-1', { tier: BoostTierEnum.STANDARD });

      expect(result.boostId).toBe('boost-1');
      expect(result.tier).toBe('STANDARD');
      expect(result.price).toBe(99000);
      expect(mockPrismaService.profileBoost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PENDING',
            multiplier: 1.5,
            price: 99000,
          }),
        }),
      );
    });

    it('should throw BadRequestException when active boost exists', async () => {
      const mockProfile = { id: 'comp-1', userId: 'user-1' };
      const existingBoost = {
        id: 'boost-existing',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      mockPrismaService.companionProfile.findUnique.mockResolvedValue(mockProfile);
      mockPrismaService.profileBoost.findFirst.mockResolvedValue(existingBoost);

      await expect(
        service.purchaseBoost('user-1', { tier: BoostTierEnum.STANDARD }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when pending boost exists', async () => {
      const mockProfile = { id: 'comp-1', userId: 'user-1' };

      mockPrismaService.companionProfile.findUnique.mockResolvedValue(mockProfile);
      // First call returns null (no active boost)
      // Second call returns pending boost
      mockPrismaService.profileBoost.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'pending-boost',
          status: 'PENDING',
          createdAt: new Date(),
        });

      await expect(
        service.purchaseBoost('user-1', { tier: BoostTierEnum.STANDARD }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when companion profile not found', async () => {
      mockPrismaService.companionProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.purchaseBoost('non-existent', { tier: BoostTierEnum.STANDARD }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('activateBoost', () => {
    it('should activate pending boost', async () => {
      const mockBoost = {
        id: 'boost-1',
        tier: 'PREMIUM',
        status: 'PENDING',
      };

      mockPrismaService.profileBoost.findUnique.mockResolvedValue(mockBoost);
      mockPrismaService.profileBoost.update.mockResolvedValue({
        ...mockBoost,
        status: 'ACTIVE',
        startedAt: expect.any(Date),
        expiresAt: expect.any(Date),
      });

      await service.activateBoost('boost-1');

      expect(mockPrismaService.profileBoost.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'boost-1' },
          data: expect.objectContaining({
            status: 'ACTIVE',
          }),
        }),
      );
    });

    it('should not activate non-pending boost', async () => {
      const mockBoost = {
        id: 'boost-1',
        tier: 'PREMIUM',
        status: 'ACTIVE', // Already active
      };

      mockPrismaService.profileBoost.findUnique.mockResolvedValue(mockBoost);

      await service.activateBoost('boost-1');

      expect(mockPrismaService.profileBoost.update).not.toHaveBeenCalled();
    });

    it('should handle non-existent boost gracefully', async () => {
      mockPrismaService.profileBoost.findUnique.mockResolvedValue(null);

      await service.activateBoost('non-existent');

      expect(mockPrismaService.profileBoost.update).not.toHaveBeenCalled();
    });
  });

  describe('cancelBoost', () => {
    it('should cancel active boost', async () => {
      const mockProfile = { id: 'comp-1', userId: 'user-1' };
      const mockBoost = {
        id: 'boost-1',
        companionId: 'comp-1',
        status: 'ACTIVE',
      };

      mockPrismaService.companionProfile.findUnique.mockResolvedValue(mockProfile);
      mockPrismaService.profileBoost.findFirst.mockResolvedValue(mockBoost);
      mockPrismaService.profileBoost.update.mockResolvedValue({
        ...mockBoost,
        status: 'CANCELLED',
      });

      const result = await service.cancelBoost('user-1', 'boost-1');

      expect(result.success).toBe(true);
      expect(mockPrismaService.profileBoost.update).toHaveBeenCalledWith({
        where: { id: 'boost-1' },
        data: { status: 'CANCELLED' },
      });
    });

    it('should throw NotFoundException when boost not found', async () => {
      const mockProfile = { id: 'comp-1', userId: 'user-1' };

      mockPrismaService.companionProfile.findUnique.mockResolvedValue(mockProfile);
      mockPrismaService.profileBoost.findFirst.mockResolvedValue(null);

      await expect(service.cancelBoost('user-1', 'non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when companion profile not found', async () => {
      mockPrismaService.companionProfile.findUnique.mockResolvedValue(null);

      await expect(service.cancelBoost('non-existent', 'boost-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('expireOldBoosts', () => {
    it('should expire active boosts past expiration', async () => {
      mockPrismaService.profileBoost.updateMany
        .mockResolvedValueOnce({ count: 3 }) // Active boosts expired
        .mockResolvedValueOnce({ count: 1 }); // Pending boosts expired

      const result = await service.expireOldBoosts();

      expect(result.count).toBe(4);
      expect(mockPrismaService.profileBoost.updateMany).toHaveBeenCalledTimes(2);
    });

    it('should return zero when no boosts to expire', async () => {
      mockPrismaService.profileBoost.updateMany
        .mockResolvedValueOnce({ count: 0 })
        .mockResolvedValueOnce({ count: 0 });

      const result = await service.expireOldBoosts();

      expect(result.count).toBe(0);
    });
  });
});
