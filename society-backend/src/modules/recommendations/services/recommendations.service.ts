import { CacheService } from '@/modules/cache/cache.service';
import { PrismaService } from '@/prisma/prisma.service';
import { InteractionEventType } from '@generated/client';
import { Injectable, Logger } from '@nestjs/common';
import { TrackInteractionDto } from '../dto/track-interaction.dto';
import { ScoredCompanion, ScoringService } from './scoring.service';

const CACHE_TTL = 300; // 5 minutes
const CACHE_PREFIX = 'rec:';
const COLD_START_THRESHOLD = 10; // Minimum interactions for hybrid mode

export interface RecommendationsResult {
  companions: ScoredCompanion[];
  hasMore: boolean;
  total: number;
  strategy: 'cold_start' | 'hybrid';
}

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private scoringService: ScoringService,
  ) { }

  /**
   * Get personalized recommendations for a user
   */
  async getForYou(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<RecommendationsResult> {
    const cacheKey = `${CACHE_PREFIX}${userId}`;

    // Check cache first (only for first page)
    if (offset === 0) {
      const cached = await this.cacheService.get<ScoredCompanion[]>(cacheKey);
      if (cached) {
        const paginated = cached.slice(offset, offset + limit);
        return {
          companions: paginated,
          hasMore: offset + limit < cached.length,
          total: cached.length,
          strategy: 'hybrid',
        };
      }
    }

    // Determine strategy based on user's interaction count
    const interactionCount = await this.prisma.userInteraction.count({
      where: { userId },
    });
    const strategy: 'cold_start' | 'hybrid' =
      interactionCount < COLD_START_THRESHOLD ? 'cold_start' : 'hybrid';

    // Get candidate companions (exclude blocked, self, already booked today)
    const candidates = await this.getCandidateCompanions(userId);

    let scoredCompanions: ScoredCompanion[];

    if (strategy === 'cold_start') {
      // Cold start: Use popularity + profile quality
      scoredCompanions = await this.getColdStartRecommendations(candidates);
    } else {
      // Hybrid: Use full scoring
      scoredCompanions = await this.scoringService.calculateScores(
        userId,
        candidates,
      );
    }

    // Cache full results
    if (scoredCompanions.length > 0) {
      await this.cacheService.set(cacheKey, scoredCompanions, CACHE_TTL);
    }

    // Paginate
    const paginated = scoredCompanions.slice(offset, offset + limit);

    return {
      companions: paginated,
      hasMore: offset + limit < scoredCompanions.length,
      total: scoredCompanions.length,
      strategy,
    };
  }

  /**
   * Get teaser recommendations for home dashboard
   */
  async getTeaser(
    userId: string,
    limit: number = 5,
  ): Promise<ScoredCompanion[]> {
    const result = await this.getForYou(userId, limit, 0);
    return result.companions;
  }

  /**
   * Track a user interaction (async database write)
   *
   * @remarks
   * This method performs async database writes. HTTP endpoints should use fire-and-forget
   * pattern (don't await, catch errors) for optimal UX. Background jobs can await.
   *
   * Note: dto.companionId is CompanionProfile.id, but UserInteraction stores User.id
   *
   * @example
   * // HTTP endpoint (fire-and-forget)
   * this.service.trackInteraction(userId, dto).catch(err => logger.warn(err));
   *
   * // Background job (await completion)
   * await this.service.trackInteraction(userId, dto);
   */
  async trackInteraction(
    userId: string,
    dto: TrackInteractionDto,
  ): Promise<void> {
    // Convert CompanionProfile.id to User.id for storage
    // The schema stores User.id for consistency with FavoriteCompanion and Booking tables
    const companion = await this.prisma.companionProfile.findUnique({
      where: { id: dto.companionId },
      select: { userId: true },
    });

    if (!companion) {
      this.logger.warn(`Companion profile not found: ${dto.companionId}`);
      return; // Silently ignore invalid companion IDs
    }

    const eventValue = this.scoringService.getEventWeight(dto.eventType);

    await this.prisma.userInteraction.create({
      data: {
        userId,
        companionId: companion.userId, // Store User.id, not CompanionProfile.id
        eventType: dto.eventType as InteractionEventType,
        eventValue,
        dwellTimeMs: dto.dwellTimeMs,
        sessionId: dto.sessionId,
      },
    });

    // Invalidate cache on high-signal interactions
    const highSignalEvents = [
      'BOOKMARK',
      'UNBOOKMARK',
      'BOOKING_COMPLETED',
      'BOOKING_CANCELLED',
    ];
    if (highSignalEvents.includes(dto.eventType)) {
      await this.invalidateCache(userId);
    }
  }

  /**
   * Force refresh recommendations
   */
  async refresh(userId: string): Promise<void> {
    await this.invalidateCache(userId);
  }

  /**
   * Invalidate user's recommendation cache
   */
  private async invalidateCache(userId: string): Promise<void> {
    const cacheKey = `${CACHE_PREFIX}${userId}`;
    await this.cacheService.del(cacheKey);
  }

  /**
   * Get candidate companions for recommendations
   * Returns CompanionProfile IDs (not User IDs) for use with /companions/:id endpoint
   */
  private async getCandidateCompanions(userId: string): Promise<string[]> {
    // Get blocked users
    const blocked = await this.prisma.userBlock.findMany({
      where: {
        OR: [{ blockerId: userId }, { blockedId: userId }],
      },
      select: { blockerId: true, blockedId: true },
    });
    const blockedIds = new Set(
      blocked.flatMap((b) => [b.blockerId, b.blockedId]),
    );
    blockedIds.delete(userId);

    // Get active, visible companions
    const companions = await this.prisma.companionProfile.findMany({
      where: {
        isActive: true,
        isHidden: false,
        verificationStatus: 'VERIFIED',
        userId: { notIn: [...blockedIds, userId] },
      },
      select: { id: true }, // Return CompanionProfile.id, not userId
      take: 100, // Limit candidates for performance
    });

    return companions.map((c) => c.id);
  }

  /**
   * Cold start recommendations (new users)
   * candidateIds are CompanionProfile IDs
   */
  private async getColdStartRecommendations(
    candidateIds: string[],
  ): Promise<ScoredCompanion[]> {
    if (candidateIds.length === 0) return [];

    const companions = await this.prisma.companionProfile.findMany({
      where: {
        id: { in: candidateIds }, // Query by CompanionProfile.id
      },
      include: {
        user: { select: { isVerified: true } },
        photos: { where: { isVerified: true }, select: { id: true } },
      },
      orderBy: [{ ratingAvg: 'desc' }, { completedBookings: 'desc' }],
    });

    return companions.map((c) => {
      const quality =
        (c.photos.length >= 3 ? 0.3 : 0) +
        (c.user.isVerified ? 0.3 : 0) +
        (c.bio && c.bio.length > 50 ? 0.2 : 0) +
        (Number(c.ratingAvg) / 5) * 0.2;

      return {
        companionId: c.id, // Use CompanionProfile.id, not userId
        score: quality,
        reason: 'Popular in your area',
        breakdown: {
          preferenceMatch: 0.5,
          profileQuality: quality,
          availability: c.isActive ? 1.0 : 0.3,
          popularity: Number(c.ratingAvg) / 5,
          behavioralAffinity: 0,
        },
      };
    });
  }
}
