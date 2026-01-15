import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('FavoritesService', () => {
  let service: FavoritesService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    favoriteCompanion: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addFavorite', () => {
    it('should add a companion to favorites', async () => {
      const mockCompanion = {
        id: 'companion-1',
        fullName: 'Test Companion',
        companionProfile: { id: 'profile-1' },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockCompanion);
      mockPrismaService.favoriteCompanion.findUnique.mockResolvedValue(null);
      mockPrismaService.favoriteCompanion.create.mockResolvedValue({
        id: 'fav-1',
        hirerId: 'hirer-1',
        companionId: 'companion-1',
        notes: 'Great companion',
      });

      const result = await service.addFavorite('hirer-1', {
        companionId: 'companion-1',
        notes: 'Great companion',
      });

      expect(result.id).toBe('fav-1');
      expect(result.message).toBe('Companion added to favorites');
      expect(mockPrismaService.favoriteCompanion.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when companion not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.addFavorite('hirer-1', { companionId: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when favoriting self', async () => {
      const mockUser = {
        id: 'user-1',
        fullName: 'Test User',
        companionProfile: { id: 'profile-1' },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.addFavorite('user-1', { companionId: 'user-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when already favorited', async () => {
      const mockCompanion = {
        id: 'companion-1',
        fullName: 'Test Companion',
        companionProfile: { id: 'profile-1' },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockCompanion);
      mockPrismaService.favoriteCompanion.findUnique.mockResolvedValue({
        id: 'existing-fav',
      });

      await expect(
        service.addFavorite('hirer-1', { companionId: 'companion-1' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('removeFavorite', () => {
    it('should remove a companion from favorites', async () => {
      mockPrismaService.favoriteCompanion.findUnique.mockResolvedValue({
        id: 'fav-1',
        hirerId: 'hirer-1',
        companionId: 'companion-1',
      });
      mockPrismaService.favoriteCompanion.delete.mockResolvedValue({});

      const result = await service.removeFavorite('hirer-1', 'companion-1');

      expect(result.message).toBe('Companion removed from favorites');
      expect(mockPrismaService.favoriteCompanion.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when favorite not found', async () => {
      mockPrismaService.favoriteCompanion.findUnique.mockResolvedValue(null);

      await expect(
        service.removeFavorite('hirer-1', 'companion-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFavorites', () => {
    it('should return list of favorite companions', async () => {
      const mockFavorites = [
        {
          id: 'fav-1',
          companionId: 'companion-1',
          notes: 'Great companion',
          createdAt: new Date('2025-01-15'),
          companion: {
            id: 'companion-1',
            fullName: 'Test Companion',
            avatarUrl: 'avatar.jpg',
            companionProfile: {
              ratingAvg: 4.5,
              hourlyRate: 500000,
              isActive: true,
              verificationStatus: 'VERIFIED',
              photos: [{ url: 'photo1.jpg' }],
            },
          },
        },
      ];

      mockPrismaService.favoriteCompanion.findMany.mockResolvedValue(mockFavorites);

      const result = await service.getFavorites('hirer-1');

      expect(result.favorites).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.favorites[0].companion.displayName).toBe('Test Companion');
      expect(result.favorites[0].companion.isVerified).toBe(true);
    });

    it('should return empty list when no favorites', async () => {
      mockPrismaService.favoriteCompanion.findMany.mockResolvedValue([]);

      const result = await service.getFavorites('hirer-1');

      expect(result.favorites).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('updateNotes', () => {
    it('should update notes for a favorite', async () => {
      mockPrismaService.favoriteCompanion.findUnique.mockResolvedValue({
        id: 'fav-1',
        hirerId: 'hirer-1',
        companionId: 'companion-1',
      });
      mockPrismaService.favoriteCompanion.update.mockResolvedValue({});

      const result = await service.updateNotes('hirer-1', 'companion-1', {
        notes: 'Updated notes',
      });

      expect(result.message).toBe('Notes updated successfully');
      expect(mockPrismaService.favoriteCompanion.update).toHaveBeenCalledWith({
        where: { id: 'fav-1' },
        data: { notes: 'Updated notes' },
      });
    });

    it('should throw NotFoundException when favorite not found', async () => {
      mockPrismaService.favoriteCompanion.findUnique.mockResolvedValue(null);

      await expect(
        service.updateNotes('hirer-1', 'companion-1', { notes: 'New notes' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('isFavorite', () => {
    it('should return true when companion is favorited', async () => {
      mockPrismaService.favoriteCompanion.findUnique.mockResolvedValue({
        id: 'fav-1',
      });

      const result = await service.isFavorite('hirer-1', 'companion-1');

      expect(result.isFavorite).toBe(true);
    });

    it('should return false when companion is not favorited', async () => {
      mockPrismaService.favoriteCompanion.findUnique.mockResolvedValue(null);

      const result = await service.isFavorite('hirer-1', 'companion-1');

      expect(result.isFavorite).toBe(false);
    });
  });

  describe('toggleFavorite', () => {
    it('should remove favorite if already exists', async () => {
      mockPrismaService.favoriteCompanion.findUnique.mockResolvedValue({
        id: 'fav-1',
      });
      mockPrismaService.favoriteCompanion.delete.mockResolvedValue({});

      const result = await service.toggleFavorite('hirer-1', 'companion-1');

      expect(result.isFavorite).toBe(false);
      expect(result.message).toBe('Companion removed from favorites');
    });

    it('should add favorite if not exists', async () => {
      const mockCompanion = {
        id: 'companion-1',
        fullName: 'Test Companion',
        companionProfile: { id: 'profile-1' },
      };

      mockPrismaService.favoriteCompanion.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(mockCompanion);
      mockPrismaService.favoriteCompanion.create.mockResolvedValue({
        id: 'fav-1',
      });

      const result = await service.toggleFavorite('hirer-1', 'companion-1');

      expect(result.isFavorite).toBe(true);
      expect(result.message).toBe('Companion added to favorites');
    });

    it('should throw NotFoundException when toggling non-existent companion', async () => {
      mockPrismaService.favoriteCompanion.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.toggleFavorite('hirer-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
