import { PrismaService } from '@/prisma/prisma.service';
import { MembershipStatus, MembershipTier } from '@generated/client';
import { BadRequestException, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from '../wallet/wallet.service';
import { MembershipPaymentCompletedEvent } from './events/membership.events';
import { MembershipService } from './membership.service';

// Suppress logger output during tests
Logger.overrideLogger([]);

describe('MembershipService', () => {
  let service: MembershipService;
  let prismaService: PrismaService;

  const mockUserId = 'user-123';

  const mockPrismaService = {
    membershipPricingTier: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    hirerMembership: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockWalletService = {
    createMembershipPaymentRequest: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: WalletService, useValue: mockWalletService },
      ],
    }).compile();

    service = module.get<MembershipService>(MembershipService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPricing', () => {
    const mockTiers = [
      {
        tier: 'SILVER',
        name: 'Silver',
        durationDays: 30,
        price: 500000,
        forYouLimit: 3,
        maxPendingBookings: 5,
        freeCancellationHours: 48,
        priorityBooking: false,
        nearbySearch: true,
        earlyAccess: false,
        dedicatedSupport: false,
        description: 'Basic tier',
      },
      {
        tier: 'GOLD',
        name: 'Gold',
        durationDays: 30,
        price: 1000000,
        forYouLimit: 5,
        maxPendingBookings: 10,
        freeCancellationHours: 72,
        priorityBooking: true,
        nearbySearch: true,
        earlyAccess: true,
        dedicatedSupport: false,
        description: 'Premium tier',
      },
      {
        tier: 'PLATINUM',
        name: 'Platinum',
        durationDays: 30,
        price: 2000000,
        forYouLimit: 10,
        maxPendingBookings: 20,
        freeCancellationHours: 168,
        priorityBooking: true,
        nearbySearch: true,
        earlyAccess: true,
        dedicatedSupport: true,
        description: 'Elite tier',
      },
    ];

    it('should return all pricing tiers ordered by price', async () => {
      mockPrismaService.membershipPricingTier.findMany.mockResolvedValue(mockTiers);

      const result = await service.getPricing();

      expect(result).toHaveLength(3);
      expect(result[0].tier).toBe('SILVER');
      expect(result[1].tier).toBe('GOLD');
      expect(result[2].tier).toBe('PLATINUM');
      expect(result[0]).toEqual({
        tier: 'SILVER',
        name: 'Silver',
        durationDays: 30,
        price: 500000,
        forYouLimit: 3,
        maxPendingBookings: 5,
        freeCancellationHours: 48,
        priorityBooking: false,
        nearbySearch: true,
        earlyAccess: false,
        dedicatedSupport: false,
        description: 'Basic tier',
      });
      expect(mockPrismaService.membershipPricingTier.findMany).toHaveBeenCalledWith({
        orderBy: { price: 'asc' },
      });
    });

    it('should return empty array when no tiers exist', async () => {
      mockPrismaService.membershipPricingTier.findMany.mockResolvedValue([]);

      const result = await service.getPricing();

      expect(result).toEqual([]);
    });
  });

  describe('getActiveMembership', () => {
    const mockActiveMembership = {
      id: 'membership-123',
      tier: 'GOLD',
      status: MembershipStatus.ACTIVE,
      price: 1000000,
      startedAt: new Date('2024-01-01'),
      expiresAt: new Date('2024-02-01'),
      createdAt: new Date('2024-01-01'),
    };

    it('should return active membership when one exists', async () => {
      mockPrismaService.hirerMembership.findFirst.mockResolvedValue(mockActiveMembership);

      const result = await service.getActiveMembership(mockUserId);

      expect(result).toEqual({
        id: 'membership-123',
        tier: 'GOLD',
        status: MembershipStatus.ACTIVE,
        price: 1000000,
        startedAt: mockActiveMembership.startedAt.toISOString(),
        expiresAt: mockActiveMembership.expiresAt.toISOString(),
        createdAt: mockActiveMembership.createdAt.toISOString(),
      });

      expect(mockPrismaService.hirerMembership.findFirst).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          status: MembershipStatus.ACTIVE,
          expiresAt: { gt: expect.any(Date) },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return null when no active membership', async () => {
      mockPrismaService.hirerMembership.findFirst.mockResolvedValue(null);

      const result = await service.getActiveMembership(mockUserId);

      expect(result).toBeNull();
    });

    it('should return null when membership is expired', async () => {
      // The query uses expiresAt: { gt: new Date() }, so expired ones won't match
      mockPrismaService.hirerMembership.findFirst.mockResolvedValue(null);

      const result = await service.getActiveMembership(mockUserId);

      expect(result).toBeNull();
      expect(mockPrismaService.hirerMembership.findFirst).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          status: MembershipStatus.ACTIVE,
          expiresAt: { gt: expect.any(Date) },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should handle membership with null startedAt and expiresAt', async () => {
      const membershipWithNulls = {
        ...mockActiveMembership,
        startedAt: null,
        expiresAt: null,
      };
      mockPrismaService.hirerMembership.findFirst.mockResolvedValue(membershipWithNulls);

      const result = await service.getActiveMembership(mockUserId);

      expect(result).toEqual({
        id: 'membership-123',
        tier: 'GOLD',
        status: MembershipStatus.ACTIVE,
        price: 1000000,
        startedAt: null,
        expiresAt: null,
        createdAt: mockActiveMembership.createdAt.toISOString(),
      });
    });
  });

  describe('getUserTier', () => {
    it('should return tier string for active membership', async () => {
      mockPrismaService.hirerMembership.findFirst.mockResolvedValue({ tier: 'GOLD' });

      const result = await service.getUserTier(mockUserId);

      expect(result).toBe('GOLD');
      expect(mockPrismaService.hirerMembership.findFirst).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          status: MembershipStatus.ACTIVE,
          expiresAt: { gt: expect.any(Date) },
        },
        select: { tier: true },
      });
    });

    it('should return null when no active membership', async () => {
      mockPrismaService.hirerMembership.findFirst.mockResolvedValue(null);

      const result = await service.getUserTier(mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('getUserBenefits', () => {
    const freeDefaults = {
      tier: null,
      forYouLimit: 1,
      maxPendingBookings: 3,
      freeCancellationHours: 24,
      priorityBooking: false,
      nearbySearch: false,
      earlyAccess: false,
      dedicatedSupport: false,
    };

    it('should return free defaults when no active membership', async () => {
      mockPrismaService.hirerMembership.findFirst.mockResolvedValue(null);

      const result = await service.getUserBenefits(mockUserId);

      expect(result).toEqual(freeDefaults);
    });

    it('should return tier benefits when active membership exists', async () => {
      mockPrismaService.hirerMembership.findFirst.mockResolvedValue({ tier: 'GOLD' });
      mockPrismaService.membershipPricingTier.findUnique.mockResolvedValue({
        tier: 'GOLD',
        forYouLimit: 5,
        maxPendingBookings: 10,
        freeCancellationHours: 72,
        priorityBooking: true,
        nearbySearch: true,
        earlyAccess: true,
        dedicatedSupport: false,
      });

      const result = await service.getUserBenefits(mockUserId);

      expect(result).toEqual({
        tier: 'GOLD',
        forYouLimit: 5,
        maxPendingBookings: 10,
        freeCancellationHours: 72,
        priorityBooking: true,
        nearbySearch: true,
        earlyAccess: true,
        dedicatedSupport: false,
      });

      expect(mockPrismaService.hirerMembership.findFirst).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          status: MembershipStatus.ACTIVE,
          expiresAt: { gt: expect.any(Date) },
        },
        select: { tier: true },
      });
      expect(mockPrismaService.membershipPricingTier.findUnique).toHaveBeenCalledWith({
        where: { tier: 'GOLD' },
      });
    });

    it('should return free defaults when pricing tier not found for active membership', async () => {
      mockPrismaService.hirerMembership.findFirst.mockResolvedValue({ tier: 'GOLD' });
      mockPrismaService.membershipPricingTier.findUnique.mockResolvedValue(null);

      const result = await service.getUserBenefits(mockUserId);

      expect(result).toEqual(freeDefaults);
    });
  });

  describe('purchaseMembership', () => {
    const mockPricing = {
      tier: 'GOLD',
      name: 'Gold',
      durationDays: 30,
      price: 1000000,
    };

    const mockCreatedMembership = {
      id: 'membership-new',
      userId: mockUserId,
      tier: 'GOLD' as MembershipTier,
      status: MembershipStatus.PENDING,
      price: 1000000,
    };

    const mockPaymentData = {
      id: 'payment-123',
      code: 'HMABC1234',
      qrUrl: 'https://qr.sepay.vn/img?test',
      deeplinks: [
        {
          appId: 'tpbank',
          name: 'TPBank',
          logo: 'https://logo.test/tpb.png',
          deeplink: 'https://link.tpb.vn/transfer?test',
        },
      ],
      accountInfo: {
        bankCode: 'TPB',
        accountNumber: '1234567890',
        accountName: 'hireme VN',
      },
      expiresAt: '2024-01-15T00:30:00.000Z',
    };

    it('should create PENDING membership and return QR payment data', async () => {
      mockPrismaService.hirerMembership.findFirst.mockResolvedValue(null);
      mockPrismaService.membershipPricingTier.findUnique.mockResolvedValue(mockPricing);
      mockPrismaService.hirerMembership.create.mockResolvedValue(mockCreatedMembership);
      mockWalletService.createMembershipPaymentRequest.mockResolvedValue(mockPaymentData);

      const result = await service.purchaseMembership(mockUserId, MembershipTier.GOLD);

      expect(result).toEqual({
        membershipId: 'membership-new',
        tier: 'GOLD',
        price: 1000000,
        paymentRequestId: 'payment-123',
        code: 'HMABC1234',
        qrUrl: 'https://qr.sepay.vn/img?test',
        deeplinks: mockPaymentData.deeplinks,
        accountInfo: mockPaymentData.accountInfo,
        expiresAt: '2024-01-15T00:30:00.000Z',
      });

      expect(mockPrismaService.hirerMembership.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          tier: MembershipTier.GOLD,
          status: MembershipStatus.PENDING,
          price: mockPricing.price,
        },
      });

      expect(mockWalletService.createMembershipPaymentRequest).toHaveBeenCalledWith(
        mockUserId,
        'membership-new',
        1000000,
      );
    });

    it('should reject if user already has active membership of same tier', async () => {
      mockPrismaService.hirerMembership.findFirst.mockResolvedValue({
        id: 'existing-membership',
        tier: 'GOLD' as MembershipTier,
        status: MembershipStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      await expect(
        service.purchaseMembership(mockUserId, MembershipTier.GOLD),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.purchaseMembership(mockUserId, MembershipTier.GOLD),
      ).rejects.toThrow('You already have an active GOLD membership. You can only upgrade to a higher tier.');
    });

    it('should reject if user already has higher tier', async () => {
      mockPrismaService.hirerMembership.findFirst.mockResolvedValue({
        id: 'existing-membership',
        tier: 'GOLD' as MembershipTier,
        status: MembershipStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      await expect(
        service.purchaseMembership(mockUserId, MembershipTier.SILVER),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.purchaseMembership(mockUserId, MembershipTier.SILVER),
      ).rejects.toThrow('You already have an active GOLD membership. You can only upgrade to a higher tier.');
    });

    it('should allow purchasing higher tier when lower is active', async () => {
      mockPrismaService.hirerMembership.findFirst.mockResolvedValue({
        id: 'existing-membership',
        tier: 'SILVER' as MembershipTier,
        status: MembershipStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      mockPrismaService.membershipPricingTier.findUnique.mockResolvedValue(mockPricing);
      mockPrismaService.hirerMembership.create.mockResolvedValue(mockCreatedMembership);
      mockWalletService.createMembershipPaymentRequest.mockResolvedValue(mockPaymentData);

      const result = await service.purchaseMembership(mockUserId, MembershipTier.GOLD);

      expect(result.membershipId).toBe('membership-new');
      expect(result.tier).toBe('GOLD');
      expect(mockPrismaService.hirerMembership.create).toHaveBeenCalled();
    });

    it('should throw if pricing tier not found', async () => {
      mockPrismaService.hirerMembership.findFirst.mockResolvedValue(null);
      mockPrismaService.membershipPricingTier.findUnique.mockResolvedValue(null);

      await expect(
        service.purchaseMembership(mockUserId, MembershipTier.GOLD),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.purchaseMembership(mockUserId, MembershipTier.GOLD),
      ).rejects.toThrow('Invalid membership tier: GOLD');
    });
  });

  describe('activateMembership', () => {
    const mockEvent = new MembershipPaymentCompletedEvent('membership-123');

    const mockPendingMembership = {
      id: 'membership-123',
      userId: mockUserId,
      tier: 'GOLD' as MembershipTier,
      status: MembershipStatus.PENDING,
      price: 1000000,
      startedAt: null,
      expiresAt: null,
    };

    const mockPricingTier = {
      tier: 'GOLD',
      durationDays: 30,
    };

    it('should set status to ACTIVE with startedAt and expiresAt', async () => {
      mockPrismaService.hirerMembership.findUnique.mockResolvedValue(mockPendingMembership);
      mockPrismaService.hirerMembership.findFirst.mockResolvedValue(null);
      mockPrismaService.membershipPricingTier.findUnique.mockResolvedValue(mockPricingTier);
      mockPrismaService.hirerMembership.update.mockResolvedValue({});

      await service.activateMembership(mockEvent);

      expect(mockPrismaService.hirerMembership.update).toHaveBeenCalledWith({
        where: { id: 'membership-123' },
        data: {
          status: MembershipStatus.ACTIVE,
          startedAt: expect.any(Date),
          expiresAt: expect.any(Date),
        },
      });

      // Verify expiry is approximately 30 days from now
      const updateCall = mockPrismaService.hirerMembership.update.mock.calls[0][0];
      const expiresAt = updateCall.data.expiresAt as Date;
      const startedAt = updateCall.data.startedAt as Date;
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const diff = expiresAt.getTime() - startedAt.getTime();
      expect(diff).toBeGreaterThanOrEqual(thirtyDaysMs - 1000);
      expect(diff).toBeLessThanOrEqual(thirtyDaysMs + 1000);
    });

    it('should handle extending from existing active membership expiresAt', async () => {
      const existingExpiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days from now

      mockPrismaService.hirerMembership.findUnique.mockResolvedValue(mockPendingMembership);
      mockPrismaService.hirerMembership.findFirst.mockResolvedValue({
        id: 'existing-membership',
        userId: mockUserId,
        tier: 'SILVER' as MembershipTier,
        status: MembershipStatus.ACTIVE,
        expiresAt: existingExpiresAt,
      });
      mockPrismaService.membershipPricingTier.findUnique.mockResolvedValue(mockPricingTier);
      mockPrismaService.hirerMembership.update.mockResolvedValue({});

      await service.activateMembership(mockEvent);

      // Should expire the old membership
      expect(mockPrismaService.hirerMembership.update).toHaveBeenCalledWith({
        where: { id: 'existing-membership' },
        data: { status: MembershipStatus.EXPIRED },
      });

      // Should activate the new membership with expiresAt based on old expiresAt + 30 days
      expect(mockPrismaService.hirerMembership.update).toHaveBeenCalledWith({
        where: { id: 'membership-123' },
        data: {
          status: MembershipStatus.ACTIVE,
          startedAt: expect.any(Date),
          expiresAt: expect.any(Date),
        },
      });

      // Verify the expiresAt is 30 days from the existing membership's expiresAt
      const activateCall = mockPrismaService.hirerMembership.update.mock.calls[1][0];
      const newExpiresAt = activateCall.data.expiresAt as Date;
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const expectedExpiry = existingExpiresAt.getTime() + thirtyDaysMs;
      expect(Math.abs(newExpiresAt.getTime() - expectedExpiry)).toBeLessThan(1000);
    });

    it('should expire old active membership when activating new one', async () => {
      const existingExpiresAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

      mockPrismaService.hirerMembership.findUnique.mockResolvedValue(mockPendingMembership);
      mockPrismaService.hirerMembership.findFirst.mockResolvedValue({
        id: 'old-membership',
        userId: mockUserId,
        tier: 'SILVER' as MembershipTier,
        status: MembershipStatus.ACTIVE,
        expiresAt: existingExpiresAt,
      });
      mockPrismaService.membershipPricingTier.findUnique.mockResolvedValue(mockPricingTier);
      mockPrismaService.hirerMembership.update.mockResolvedValue({});

      await service.activateMembership(mockEvent);

      expect(mockPrismaService.hirerMembership.update).toHaveBeenCalledWith({
        where: { id: 'old-membership' },
        data: { status: MembershipStatus.EXPIRED },
      });
    });

    it('should handle membership not found gracefully', async () => {
      mockPrismaService.hirerMembership.findUnique.mockResolvedValue(null);

      // Should not throw
      await service.activateMembership(mockEvent);

      expect(mockPrismaService.hirerMembership.update).not.toHaveBeenCalled();
      expect(mockPrismaService.hirerMembership.findFirst).not.toHaveBeenCalled();
    });

    it('should skip activation if membership is already active', async () => {
      mockPrismaService.hirerMembership.findUnique.mockResolvedValue({
        ...mockPendingMembership,
        status: MembershipStatus.ACTIVE,
      });

      await service.activateMembership(mockEvent);

      // Should only call findUnique, not update
      expect(mockPrismaService.hirerMembership.update).not.toHaveBeenCalled();
    });

    it('should fallback to 30 days duration when pricing tier not found', async () => {
      mockPrismaService.hirerMembership.findUnique.mockResolvedValue(mockPendingMembership);
      mockPrismaService.hirerMembership.findFirst.mockResolvedValue(null);
      mockPrismaService.membershipPricingTier.findUnique.mockResolvedValue(null);
      mockPrismaService.hirerMembership.update.mockResolvedValue({});

      await service.activateMembership(mockEvent);

      const updateCall = mockPrismaService.hirerMembership.update.mock.calls[0][0];
      const expiresAt = updateCall.data.expiresAt as Date;
      const startedAt = updateCall.data.startedAt as Date;
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const diff = expiresAt.getTime() - startedAt.getTime();
      expect(diff).toBeGreaterThanOrEqual(thirtyDaysMs - 1000);
      expect(diff).toBeLessThanOrEqual(thirtyDaysMs + 1000);
    });
  });

  describe('expireMemberships', () => {
    it('should mark expired memberships as EXPIRED', async () => {
      mockPrismaService.hirerMembership.updateMany.mockResolvedValue({ count: 3 });

      await service.expireMemberships();

      expect(mockPrismaService.hirerMembership.updateMany).toHaveBeenCalledWith({
        where: {
          status: MembershipStatus.ACTIVE,
          expiresAt: { lt: expect.any(Date) },
        },
        data: {
          status: MembershipStatus.EXPIRED,
        },
      });
    });

    it('should not affect non-expired active memberships', async () => {
      mockPrismaService.hirerMembership.updateMany.mockResolvedValue({ count: 0 });

      await service.expireMemberships();

      // The where clause ensures only memberships with expiresAt < now are updated
      expect(mockPrismaService.hirerMembership.updateMany).toHaveBeenCalledWith({
        where: {
          status: MembershipStatus.ACTIVE,
          expiresAt: { lt: expect.any(Date) },
        },
        data: {
          status: MembershipStatus.EXPIRED,
        },
      });
    });
  });

  describe('getMembershipHistory', () => {
    const mockMemberships = [
      {
        id: 'membership-3',
        tier: 'GOLD',
        status: MembershipStatus.ACTIVE,
        price: 1000000,
        startedAt: new Date('2024-03-01'),
        expiresAt: new Date('2024-04-01'),
        createdAt: new Date('2024-03-01'),
      },
      {
        id: 'membership-2',
        tier: 'SILVER',
        status: MembershipStatus.EXPIRED,
        price: 500000,
        startedAt: new Date('2024-02-01'),
        expiresAt: new Date('2024-03-01'),
        createdAt: new Date('2024-02-01'),
      },
      {
        id: 'membership-1',
        tier: 'SILVER',
        status: MembershipStatus.EXPIRED,
        price: 500000,
        startedAt: new Date('2024-01-01'),
        expiresAt: new Date('2024-02-01'),
        createdAt: new Date('2024-01-01'),
      },
    ];

    it('should return memberships ordered by createdAt desc', async () => {
      mockPrismaService.hirerMembership.findMany.mockResolvedValue(mockMemberships);

      const result = await service.getMembershipHistory(mockUserId);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('membership-3');
      expect(result[1].id).toBe('membership-2');
      expect(result[2].id).toBe('membership-1');
      expect(result[0]).toEqual({
        id: 'membership-3',
        tier: 'GOLD',
        status: MembershipStatus.ACTIVE,
        price: 1000000,
        startedAt: new Date('2024-03-01').toISOString(),
        expiresAt: new Date('2024-04-01').toISOString(),
        createdAt: new Date('2024-03-01').toISOString(),
      });

      expect(mockPrismaService.hirerMembership.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    });

    it('should respect the limit parameter', async () => {
      mockPrismaService.hirerMembership.findMany.mockResolvedValue([mockMemberships[0]]);

      await service.getMembershipHistory(mockUserId, 1);

      expect(mockPrismaService.hirerMembership.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });
    });

    it('should use default limit of 10', async () => {
      mockPrismaService.hirerMembership.findMany.mockResolvedValue([]);

      await service.getMembershipHistory(mockUserId);

      expect(mockPrismaService.hirerMembership.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    });

    it('should handle memberships with null startedAt and expiresAt', async () => {
      const pendingMembership = {
        id: 'membership-pending',
        tier: 'GOLD',
        status: MembershipStatus.PENDING,
        price: 1000000,
        startedAt: null,
        expiresAt: null,
        createdAt: new Date('2024-03-15'),
      };
      mockPrismaService.hirerMembership.findMany.mockResolvedValue([pendingMembership]);

      const result = await service.getMembershipHistory(mockUserId);

      expect(result[0].startedAt).toBeNull();
      expect(result[0].expiresAt).toBeNull();
    });
  });
});
