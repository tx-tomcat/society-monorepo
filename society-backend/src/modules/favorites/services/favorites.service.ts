import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  AddFavoriteDto,
  UpdateFavoriteNotesDto,
  FavoriteCompanionItem,
  FavoritesListResponse,
} from '../dto/favorites.dto';

@Injectable()
export class FavoritesService {
  private readonly logger = new Logger(FavoritesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate that companionId is a valid User with a companion profile
   */
  private async validateCompanionUserId(companionId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: companionId },
      include: { companionProfile: true },
    });

    return !!user?.companionProfile;
  }

  /**
   * Add a companion to favorites
   * companionId must be User.id (not CompanionProfile.id)
   */
  async addFavorite(hirerId: string, dto: AddFavoriteDto): Promise<{ id: string; message: string }> {
    const companionId = dto.companionId;

    // Validate that companionId is a valid companion user
    const isValid = await this.validateCompanionUserId(companionId);
    if (!isValid) {
      throw new NotFoundException('Companion not found');
    }

    // Check if user is trying to favorite themselves
    if (hirerId === companionId) {
      throw new BadRequestException('You cannot add yourself to favorites');
    }

    // Check if already favorited
    const existing = await this.prisma.favoriteCompanion.findUnique({
      where: {
        hirerId_companionId: {
          hirerId,
          companionId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Companion is already in your favorites');
    }

    const favorite = await this.prisma.favoriteCompanion.create({
      data: {
        hirerId,
        companionId,
        notes: dto.notes,
      },
    });

    this.logger.log(`User ${hirerId} added companion ${companionId} to favorites`);

    return {
      id: favorite.id,
      message: 'Companion added to favorites',
    };
  }

  /**
   * Remove a companion from favorites
   * companionId must be User.id (not CompanionProfile.id)
   */
  async removeFavorite(hirerId: string, companionId: string): Promise<{ message: string }> {
    // Validate that companionId is a valid companion user
    const isValid = await this.validateCompanionUserId(companionId);
    if (!isValid) {
      throw new NotFoundException('Companion not found');
    }

    // Use deleteMany to avoid race condition issues
    const result = await this.prisma.favoriteCompanion.deleteMany({
      where: {
        hirerId,
        companionId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Favorite not found');
    }

    this.logger.log(`User ${hirerId} removed companion ${companionId} from favorites`);

    return {
      message: 'Companion removed from favorites',
    };
  }

  /**
   * Get user's favorite companions
   */
  async getFavorites(hirerId: string): Promise<FavoritesListResponse> {
    const favorites = await this.prisma.favoriteCompanion.findMany({
      where: { hirerId },
      include: {
        companion: {
          include: {
            companionProfile: {
              include: {
                photos: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const items: FavoriteCompanionItem[] = favorites.map((fav) => ({
      id: fav.id,
      companionId: fav.companionId,
      notes: fav.notes,
      addedAt: fav.createdAt.toISOString(),
      companion: {
        userId: fav.companion.id,
        displayName: fav.companion.fullName,
        avatar: fav.companion.companionProfile?.photos[0]?.url || fav.companion.avatarUrl,
        rating: Number(fav.companion.companionProfile?.ratingAvg || 0),
        hourlyRate: fav.companion.companionProfile?.hourlyRate || 0,
        isActive: fav.companion.companionProfile?.isActive || false,
        isVerified: fav.companion.companionProfile?.verificationStatus === 'VERIFIED',
      },
    }));

    return {
      favorites: items,
      total: items.length,
    };
  }

  /**
   * Update notes for a favorite companion
   * companionId must be User.id (not CompanionProfile.id)
   */
  async updateNotes(
    hirerId: string,
    companionId: string,
    dto: UpdateFavoriteNotesDto,
  ): Promise<{ message: string }> {
    // Validate that companionId is a valid companion user
    const isValid = await this.validateCompanionUserId(companionId);
    if (!isValid) {
      throw new NotFoundException('Companion not found');
    }

    const favorite = await this.prisma.favoriteCompanion.findUnique({
      where: {
        hirerId_companionId: {
          hirerId,
          companionId,
        },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.prisma.favoriteCompanion.update({
      where: { id: favorite.id },
      data: { notes: dto.notes },
    });

    return {
      message: 'Notes updated successfully',
    };
  }

  /**
   * Check if a companion is in user's favorites
   * companionId must be User.id (not CompanionProfile.id)
   */
  async isFavorite(hirerId: string, companionId: string): Promise<{ isFavorite: boolean }> {
    // Validate that companionId is a valid companion user
    const isValid = await this.validateCompanionUserId(companionId);
    if (!isValid) {
      return { isFavorite: false };
    }

    const favorite = await this.prisma.favoriteCompanion.findUnique({
      where: {
        hirerId_companionId: {
          hirerId,
          companionId,
        },
      },
    });

    return {
      isFavorite: !!favorite,
    };
  }

  /**
   * Toggle favorite status (add if not exists, remove if exists)
   * companionId must be User.id (not CompanionProfile.id)
   */
  async toggleFavorite(
    hirerId: string,
    companionId: string,
  ): Promise<{ isFavorite: boolean; message: string }> {
    // Validate that companionId is a valid companion user
    const isValid = await this.validateCompanionUserId(companionId);
    if (!isValid) {
      throw new NotFoundException('Companion not found');
    }

    if (hirerId === companionId) {
      throw new BadRequestException('You cannot add yourself to favorites');
    }

    const existing = await this.prisma.favoriteCompanion.findUnique({
      where: {
        hirerId_companionId: {
          hirerId,
          companionId,
        },
      },
    });

    if (existing) {
      // Use deleteMany to avoid "record not found" errors from race conditions
      await this.prisma.favoriteCompanion.deleteMany({
        where: {
          hirerId,
          companionId,
        },
      });
      return {
        isFavorite: false,
        message: 'Companion removed from favorites',
      };
    }

    await this.prisma.favoriteCompanion.create({
      data: {
        hirerId,
        companionId,
      },
    });

    return {
      isFavorite: true,
      message: 'Companion added to favorites',
    };
  }
}
