import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';

// Event weights for scoring (companion booking platform - no swipe gestures)
const EVENT_WEIGHTS: Record<string, number> = {
  VIEW: 0.1, // Profile appeared in feed
  PROFILE_OPEN: 0.3, // User tapped to view details
  BOOKMARK: 0.7, // Saved for later (strong interest signal)
  UNBOOKMARK: -0.3, // Removed from saved
  MESSAGE_SENT: 0.8, // Initiated contact
  BOOKING_STARTED: 0.9, // Entered booking flow
  BOOKING_COMPLETED: 1.0, // Strongest positive signal
  BOOKING_CANCELLED: -0.5, // Negative signal
};

// Scoring weights for different factors
const SCORING_WEIGHTS = {
  preferenceMatch: 0.35,
  profileQuality: 0.2,
  availability: 0.15,
  popularity: 0.15,
  behavioralAffinity: 0.15,
};

export interface CompanionData {
  id: string;
  userId: string;
  displayName: string;
  age?: number | null;
  bio?: string | null;
  avatar?: string | null;
  heightCm?: number | null;
  gender?: string | null;
  languages: string[];
  hourlyRate: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isActive: boolean;
  photos: { id: string; url: string; isPrimary: boolean; position: number }[];
  services: { occasionId: string; occasion?: { id: string; nameEn: string; nameVi: string; emoji: string } }[];
}

export interface ScoredCompanion {
  companionId: string;
  score: number;
  reason: string;
  breakdown: {
    preferenceMatch: number;
    profileQuality: number;
    availability: number;
    popularity: number;
    behavioralAffinity: number;
  };
  companion: CompanionData;
}

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get the weight for an interaction event type
   */
  getEventWeight(eventType: string): number {
    return EVENT_WEIGHTS[eventType] ?? 0;
  }

  /**
   * Calculate recommendation scores for a user
   * candidateCompanionIds are CompanionProfile IDs (not User IDs)
   * boostMultipliers maps CompanionProfile.id to their active boost multiplier
   */
  async calculateScores(
    userId: string,
    candidateCompanionIds: string[],
    boostMultipliers: Map<string, number> = new Map(),
  ): Promise<ScoredCompanion[]> {
    if (candidateCompanionIds.length === 0) {
      return [];
    }

    // Get companion profiles with full data for embedding in response
    const companions = await this.prisma.companionProfile.findMany({
      where: {
        id: { in: candidateCompanionIds }, // Query by CompanionProfile.id
        isActive: true,
        isHidden: false,
      },
      include: {
        user: {
          select: {
            id: true,
            avatarUrl: true,
            dateOfBirth: true,
            gender: true,
            isVerified: true,
          },
        },
        photos: {
          select: { id: true, url: true, isPrimary: true, position: true },
          orderBy: [{ isPrimary: 'desc' }, { position: 'asc' }],
        },
        services: {
          where: { isEnabled: true },
          select: {
            occasionId: true,
            occasion: { select: { id: true, nameEn: true, nameVi: true, emoji: true } },
          },
        },
      },
    });

    // Get userIds for querying related data
    const companionUserIds = companions.map((c) => c.userId);

    // Get user's interaction history (uses userId for companion lookup)
    const interactions = await this.prisma.userInteraction.groupBy({
      by: ['companionId', 'eventType'],
      where: {
        userId,
        companionId: { in: companionUserIds },
      },
      _count: true,
    });

    // Get user's favorites (uses userId for companion lookup)
    const favorites = await this.prisma.favoriteCompanion.findMany({
      where: { hirerId: userId },
      select: { companionId: true },
    });
    const favoriteIds = new Set(favorites.map((f) => f.companionId));

    // Get user's booking history for preference extraction
    const bookings = await this.prisma.booking.findMany({
      where: {
        hirerId: userId,
        status: 'COMPLETED',
      },
      select: {
        companionId: true,
        occasionId: true,
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    // Extract preferred occasions from booking history
    const preferredOccasions = new Set(bookings.map((b) => b.occasionId).filter(Boolean));

    // Build interaction score map
    const interactionScoreMap = new Map<string, number>();
    for (const interaction of interactions) {
      const weight = this.getEventWeight(interaction.eventType);
      const current = interactionScoreMap.get(interaction.companionId) ?? 0;
      interactionScoreMap.set(
        interaction.companionId,
        current + weight * interaction._count,
      );
    }

    // Score each companion
    const scoredCompanions: ScoredCompanion[] = companions.map((companion) => {
      // 1. Preference Match (occasion overlap)
      const companionOccasions = new Set(
        companion.services.map((s) => s.occasionId),
      );
      const occasionOverlap =
        preferredOccasions.size > 0
          ? [...preferredOccasions].filter((o) => companionOccasions.has(o))
              .length / preferredOccasions.size
          : 0.5; // Default for new users
      const preferenceMatch = occasionOverlap;

      // 2. Profile Quality
      const hasVerifiedPhotos = companion.photos.length >= 3;
      const isVerified = companion.user.isVerified;
      const hasBio = !!companion.bio && companion.bio.length > 50;
      const profileQuality =
        (hasVerifiedPhotos ? 0.4 : 0) +
        (isVerified ? 0.4 : 0) +
        (hasBio ? 0.2 : 0);

      // 3. Availability (simplified - active status)
      const availability = companion.isActive ? 1.0 : 0.3;

      // 4. Popularity (normalized rating and booking count)
      const ratingScore = Number(companion.ratingAvg) / 5;
      const bookingScore = Math.min(companion.completedBookings / 50, 1);
      const popularity = ratingScore * 0.7 + bookingScore * 0.3;

      // 5. Behavioral Affinity
      const interactionScore = interactionScoreMap.get(companion.userId) ?? 0;
      const isFavorite = favoriteIds.has(companion.userId);
      const behavioralAffinity = Math.min(
        (interactionScore / 5) * 0.6 + (isFavorite ? 0.4 : 0),
        1,
      );

      // Calculate weighted total
      const baseScore =
        SCORING_WEIGHTS.preferenceMatch * preferenceMatch +
        SCORING_WEIGHTS.profileQuality * profileQuality +
        SCORING_WEIGHTS.availability * availability +
        SCORING_WEIGHTS.popularity * popularity +
        SCORING_WEIGHTS.behavioralAffinity * behavioralAffinity;

      // Apply boost multiplier if companion has an active boost
      const boostMultiplier = boostMultipliers.get(companion.id) ?? 0;
      const score = boostMultiplier > 0 ? baseScore * boostMultiplier : baseScore;

      // Determine primary reason
      const reasons = [
        ...(boostMultiplier > 0
          ? [{ key: 'boosted', value: 1.0, label: 'Featured profile' }]
          : []),
        {
          key: 'preference',
          value: preferenceMatch,
          label: 'Matches your preferences',
        },
        { key: 'quality', value: profileQuality, label: 'Highly rated profile' },
        { key: 'popular', value: popularity, label: 'Popular choice' },
        {
          key: 'behavioral',
          value: behavioralAffinity,
          label: 'Based on your activity',
        },
      ].sort((a, b) => b.value - a.value);

      // Calculate age from dateOfBirth
      const age = companion.user.dateOfBirth
        ? Math.floor(
            (Date.now() - new Date(companion.user.dateOfBirth).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000),
          )
        : null;

      return {
        companionId: companion.id, // Use CompanionProfile.id, not userId
        score,
        reason: reasons[0].label,
        breakdown: {
          preferenceMatch,
          profileQuality,
          availability,
          popularity,
          behavioralAffinity,
        },
        companion: {
          id: companion.id,
          userId: companion.userId,
          displayName: companion.displayName || 'Anonymous',
          age,
          bio: companion.bio,
          avatar: companion.photos[0]?.url || companion.user.avatarUrl,
          heightCm: companion.heightCm,
          gender: companion.user.gender,
          languages: companion.languages || [],
          hourlyRate: Number(companion.hourlyRate),
          rating: Number(companion.ratingAvg) || 0,
          reviewCount: companion.ratingCount || 0,
          isVerified: companion.user.isVerified,
          isActive: companion.isActive,
          photos: companion.photos,
          services: companion.services,
        },
      };
    });

    // Sort by score descending
    return scoredCompanions.sort((a, b) => b.score - a.score);
  }
}
