# Companion Recommendations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a personalized "For You" recommendation system for hirers that suggests companions based on booking history, favorites, browsing patterns, and similar users' preferences.

**Architecture:** Hybrid recommendation system using weighted heuristics (no ML). Backend NestJS module with Redis caching (5-min TTL). Mobile displays recommendations in two places: home teaser (top 5) and full "For You" tab in browse screen. Interaction tracking captures user behavior for future scoring improvements.

**Tech Stack:** NestJS, Prisma, Redis (via existing CacheService), React Native, React Query, FlashList

---

## Phase 1: Database Schema

### Task 1: Add UserInteraction Model to Prisma Schema

**Files:**
- Modify: `society-backend/prisma/schema.prisma` (append after line 1239)

**Step 1: Add the UserInteraction model**

Add this to the end of `schema.prisma`:

```prisma
// ============================================
// RECOMMENDATIONS
// ============================================

enum InteractionEventType {
  VIEW              // Profile card appeared in viewport
  PROFILE_OPEN      // Tapped to view full profile
  SWIPE_RIGHT       // Liked in swipe mode
  SWIPE_LEFT        // Passed in swipe mode
  BOOKMARK          // Added to favorites
  UNBOOKMARK        // Removed from favorites
  MESSAGE_SENT      // Sent first message
  BOOKING_STARTED   // Entered booking flow
  BOOKING_COMPLETED // Completed booking
  BOOKING_CANCELLED // Cancelled booking
}

model UserInteraction {
  id          String               @id @default(uuid()) @db.Uuid
  userId      String               @map("user_id") @db.Uuid
  companionId String               @map("companion_id") @db.Uuid
  eventType   InteractionEventType @map("event_type")
  eventValue  Decimal              @default(0) @map("event_value") @db.Decimal(4, 2) // Weighted score
  dwellTimeMs Int?                 @map("dwell_time_ms") // Time spent viewing (for profile_open)
  sessionId   String?              @map("session_id")
  metadata    Json                 @default("{}")
  createdAt   DateTime             @default(now()) @map("created_at")

  @@index([userId, createdAt(sort: Desc)])
  @@index([companionId, createdAt(sort: Desc)])
  @@index([userId, companionId, eventType])
  @@map("user_interactions")
}

model RecommendationCache {
  id           String   @id @default(uuid()) @db.Uuid
  userId       String   @unique @map("user_id") @db.Uuid
  companions   Json     // Array of { companionId, score, reason }
  algorithmVer String   @map("algorithm_ver") @default("v1")
  expiresAt    DateTime @map("expires_at")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@index([expiresAt])
  @@map("recommendation_cache")
}
```

**Step 2: Generate Prisma client**

Run:
```bash
cd society-backend && pnpm prisma generate
```
Expected: "Generated Prisma Client"

**Step 3: Create migration**

Run:
```bash
cd society-backend && pnpm prisma migrate dev --name add_recommendations_tables
```
Expected: Migration created and applied successfully

**Step 4: Commit**

```bash
git add society-backend/prisma/
git commit -m "$(cat <<'EOF'
feat(db): add UserInteraction and RecommendationCache models

Adds database tables for tracking user interactions with companions
and caching recommendation results.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2: Backend Recommendations Module

### Task 2: Create Recommendations Module Structure

**Files:**
- Create: `society-backend/src/modules/recommendations/recommendations.module.ts`
- Create: `society-backend/src/modules/recommendations/controllers/recommendations.controller.ts`
- Create: `society-backend/src/modules/recommendations/services/recommendations.service.ts`
- Create: `society-backend/src/modules/recommendations/services/scoring.service.ts`
- Create: `society-backend/src/modules/recommendations/dto/get-recommendations.dto.ts`
- Create: `society-backend/src/modules/recommendations/dto/track-interaction.dto.ts`

**Step 1: Create the DTOs**

Create `society-backend/src/modules/recommendations/dto/get-recommendations.dto.ts`:

```typescript
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class GetRecommendationsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number = 0;
}

export class GetTeaserDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  limit?: number = 5;
}
```

Create `society-backend/src/modules/recommendations/dto/track-interaction.dto.ts`:

```typescript
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export enum InteractionEventType {
  VIEW = 'VIEW',
  PROFILE_OPEN = 'PROFILE_OPEN',
  SWIPE_RIGHT = 'SWIPE_RIGHT',
  SWIPE_LEFT = 'SWIPE_LEFT',
  BOOKMARK = 'BOOKMARK',
  UNBOOKMARK = 'UNBOOKMARK',
  MESSAGE_SENT = 'MESSAGE_SENT',
  BOOKING_STARTED = 'BOOKING_STARTED',
  BOOKING_COMPLETED = 'BOOKING_COMPLETED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
}

export class TrackInteractionDto {
  @IsUUID()
  companionId: string;

  @IsEnum(InteractionEventType)
  eventType: InteractionEventType;

  @IsOptional()
  @IsInt()
  @Min(0)
  dwellTimeMs?: number;

  @IsOptional()
  @IsString()
  sessionId?: string;
}
```

**Step 2: Create the Scoring Service**

Create `society-backend/src/modules/recommendations/services/scoring.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

// Event weights for scoring
const EVENT_WEIGHTS: Record<string, number> = {
  VIEW: 0.1,
  PROFILE_OPEN: 0.3,
  SWIPE_RIGHT: 0.5,
  SWIPE_LEFT: -0.2,
  BOOKMARK: 0.7,
  UNBOOKMARK: -0.3,
  MESSAGE_SENT: 0.8,
  BOOKING_STARTED: 0.9,
  BOOKING_COMPLETED: 1.0,
  BOOKING_CANCELLED: -0.5,
};

// Scoring weights for different factors
const SCORING_WEIGHTS = {
  preferenceMatch: 0.35,
  profileQuality: 0.20,
  availability: 0.15,
  popularity: 0.15,
  behavioralAffinity: 0.15,
};

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
   */
  async calculateScores(
    userId: string,
    candidateCompanionIds: string[],
  ): Promise<ScoredCompanion[]> {
    if (candidateCompanionIds.length === 0) {
      return [];
    }

    // Get user's interaction history
    const interactions = await this.prisma.userInteraction.groupBy({
      by: ['companionId', 'eventType'],
      where: {
        userId,
        companionId: { in: candidateCompanionIds },
      },
      _count: true,
    });

    // Get user's favorites
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
        occasionType: true,
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    // Extract preferred service types from booking history
    const preferredServices = new Set(bookings.map((b) => b.occasionType));

    // Get companion profiles
    const companions = await this.prisma.companionProfile.findMany({
      where: {
        userId: { in: candidateCompanionIds },
        isActive: true,
        isHidden: false,
      },
      include: {
        user: { select: { isVerified: true } },
        photos: { where: { isVerified: true }, select: { id: true } },
        services: { where: { isEnabled: true }, select: { serviceType: true } },
      },
    });

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
      // 1. Preference Match (service type overlap)
      const companionServices = new Set(
        companion.services.map((s) => s.serviceType),
      );
      const serviceOverlap =
        preferredServices.size > 0
          ? [...preferredServices].filter((s) => companionServices.has(s))
              .length / preferredServices.size
          : 0.5; // Default for new users
      const preferenceMatch = serviceOverlap;

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
      const score =
        SCORING_WEIGHTS.preferenceMatch * preferenceMatch +
        SCORING_WEIGHTS.profileQuality * profileQuality +
        SCORING_WEIGHTS.availability * availability +
        SCORING_WEIGHTS.popularity * popularity +
        SCORING_WEIGHTS.behavioralAffinity * behavioralAffinity;

      // Determine primary reason
      const reasons = [
        { key: 'preference', value: preferenceMatch, label: 'Matches your preferences' },
        { key: 'quality', value: profileQuality, label: 'Highly rated profile' },
        { key: 'popular', value: popularity, label: 'Popular choice' },
        { key: 'behavioral', value: behavioralAffinity, label: 'Based on your activity' },
      ].sort((a, b) => b.value - a.value);

      return {
        companionId: companion.userId,
        score,
        reason: reasons[0].label,
        breakdown: {
          preferenceMatch,
          profileQuality,
          availability,
          popularity,
          behavioralAffinity,
        },
      };
    });

    // Sort by score descending
    return scoredCompanions.sort((a, b) => b.score - a.score);
  }
}
```

**Step 3: Create the Recommendations Service**

Create `society-backend/src/modules/recommendations/services/recommendations.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import { ScoringService, ScoredCompanion } from './scoring.service';
import { TrackInteractionDto } from '../dto/track-interaction.dto';

const CACHE_TTL = 300; // 5 minutes
const CACHE_PREFIX = 'rec:';
const COLD_START_THRESHOLD = 10; // Minimum interactions for hybrid mode

interface RecommendationsResult {
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
  ) {}

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
  async getTeaser(userId: string, limit: number = 5): Promise<ScoredCompanion[]> {
    const result = await this.getForYou(userId, limit, 0);
    return result.companions;
  }

  /**
   * Track a user interaction
   */
  async trackInteraction(
    userId: string,
    dto: TrackInteractionDto,
  ): Promise<void> {
    const eventValue = this.scoringService.getEventWeight(dto.eventType);

    await this.prisma.userInteraction.create({
      data: {
        userId,
        companionId: dto.companionId,
        eventType: dto.eventType as any,
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
      select: { userId: true },
      take: 100, // Limit candidates for performance
    });

    return companions.map((c) => c.userId);
  }

  /**
   * Cold start recommendations (new users)
   */
  private async getColdStartRecommendations(
    candidateIds: string[],
  ): Promise<ScoredCompanion[]> {
    if (candidateIds.length === 0) return [];

    const companions = await this.prisma.companionProfile.findMany({
      where: {
        userId: { in: candidateIds },
      },
      include: {
        user: { select: { isVerified: true } },
        photos: { where: { isVerified: true }, select: { id: true } },
      },
      orderBy: [
        { ratingAvg: 'desc' },
        { completedBookings: 'desc' },
      ],
    });

    return companions.map((c) => {
      const quality =
        (c.photos.length >= 3 ? 0.3 : 0) +
        (c.user.isVerified ? 0.3 : 0) +
        (c.bio && c.bio.length > 50 ? 0.2 : 0) +
        (Number(c.ratingAvg) / 5) * 0.2;

      return {
        companionId: c.userId,
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
```

**Step 4: Create the Controller**

Create `society-backend/src/modules/recommendations/controllers/recommendations.controller.ts`:

```typescript
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { RecommendationsService } from '../services/recommendations.service';
import { GetRecommendationsDto, GetTeaserDto } from '../dto/get-recommendations.dto';
import { TrackInteractionDto } from '../dto/track-interaction.dto';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(private recommendationsService: RecommendationsService) {}

  @Get('for-you')
  async getForYou(
    @CurrentUser('id') userId: string,
    @Query() query: GetRecommendationsDto,
  ) {
    return this.recommendationsService.getForYou(
      userId,
      query.limit,
      query.offset,
    );
  }

  @Get('for-you/teaser')
  async getTeaser(
    @CurrentUser('id') userId: string,
    @Query() query: GetTeaserDto,
  ) {
    const companions = await this.recommendationsService.getTeaser(
      userId,
      query.limit,
    );
    return { companions };
  }

  @Post('interactions')
  async trackInteraction(
    @CurrentUser('id') userId: string,
    @Body() dto: TrackInteractionDto,
  ) {
    await this.recommendationsService.trackInteraction(userId, dto);
    return { success: true };
  }

  @Post('refresh')
  async refresh(@CurrentUser('id') userId: string) {
    await this.recommendationsService.refresh(userId);
    return { success: true };
  }
}
```

**Step 5: Create the Module**

Create `society-backend/src/modules/recommendations/recommendations.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { RecommendationsController } from './controllers/recommendations.controller';
import { RecommendationsService } from './services/recommendations.service';
import { ScoringService } from './services/scoring.service';

@Module({
  controllers: [RecommendationsController],
  providers: [RecommendationsService, ScoringService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
```

**Step 6: Register module in AppModule**

Modify `society-backend/src/app.module.ts` to add the import:

```typescript
import { RecommendationsModule } from './modules/recommendations/recommendations.module';

// Add to imports array:
RecommendationsModule,
```

**Step 7: Run type-check**

Run:
```bash
cd society-backend && pnpm type-check
```
Expected: No errors

**Step 8: Commit**

```bash
git add society-backend/src/modules/recommendations/ society-backend/src/app.module.ts
git commit -m "$(cat <<'EOF'
feat(api): add recommendations module

Implements personalized companion recommendations with:
- Hybrid scoring (preference match, profile quality, popularity, behavioral)
- Cold start fallback for new users
- Redis caching (5-min TTL)
- Interaction tracking endpoint
- Force refresh capability

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3: Mobile API Service & Hooks

### Task 3: Create Mobile Recommendations Service

**Files:**
- Create: `society-mobile/src/lib/api/services/recommendations.service.ts`
- Modify: `society-mobile/src/lib/api/services/index.ts` (add export)

**Step 1: Create the service**

Create `society-mobile/src/lib/api/services/recommendations.service.ts`:

```typescript
import { apiClient } from '../client';

export type InteractionEventType =
  | 'VIEW'
  | 'PROFILE_OPEN'
  | 'SWIPE_RIGHT'
  | 'SWIPE_LEFT'
  | 'BOOKMARK'
  | 'UNBOOKMARK'
  | 'MESSAGE_SENT'
  | 'BOOKING_STARTED'
  | 'BOOKING_COMPLETED'
  | 'BOOKING_CANCELLED';

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
}

export interface RecommendationsResponse {
  companions: ScoredCompanion[];
  hasMore: boolean;
  total: number;
  strategy: 'cold_start' | 'hybrid';
}

export interface TeaserResponse {
  companions: ScoredCompanion[];
}

export interface TrackInteractionInput {
  companionId: string;
  eventType: InteractionEventType;
  dwellTimeMs?: number;
  sessionId?: string;
}

export const recommendationsService = {
  /**
   * Get full paginated recommendations for "For You" tab
   */
  async getForYou(params?: {
    limit?: number;
    offset?: number;
  }): Promise<RecommendationsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.offset) queryParams.append('offset', String(params.offset));
    const query = queryParams.toString();
    return apiClient.get(`/recommendations/for-you${query ? `?${query}` : ''}`);
  },

  /**
   * Get teaser recommendations for home dashboard
   */
  async getTeaser(limit?: number): Promise<TeaserResponse> {
    const query = limit ? `?limit=${limit}` : '';
    return apiClient.get(`/recommendations/for-you/teaser${query}`);
  },

  /**
   * Track user interaction with a companion
   */
  async trackInteraction(data: TrackInteractionInput): Promise<{ success: boolean }> {
    return apiClient.post('/recommendations/interactions', data);
  },

  /**
   * Force refresh recommendations
   */
  async refresh(): Promise<{ success: boolean }> {
    return apiClient.post('/recommendations/refresh', {});
  },
};
```

**Step 2: Add export to index**

Modify `society-mobile/src/lib/api/services/index.ts` to add:

```typescript
export * from './recommendations.service';
```

**Step 3: Commit**

```bash
git add society-mobile/src/lib/api/services/
git commit -m "$(cat <<'EOF'
feat(mobile): add recommendations API service

Adds client methods for:
- getForYou (paginated recommendations)
- getTeaser (home dashboard)
- trackInteraction (event tracking)
- refresh (force cache invalidation)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Create Mobile Recommendations Hooks

**Files:**
- Create: `society-mobile/src/lib/hooks/use-recommendations.ts`
- Modify: `society-mobile/src/lib/hooks/index.tsx` (add export)

**Step 1: Create the hooks**

Create `society-mobile/src/lib/hooks/use-recommendations.ts`:

```typescript
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import type {
  InteractionEventType,
  RecommendationsResponse,
  ScoredCompanion,
  TeaserResponse,
  TrackInteractionInput,
} from '../api/services/recommendations.service';
import { recommendationsService } from '../api/services/recommendations.service';

const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const PAGE_SIZE = 20;

/**
 * Hook for fetching paginated recommendations with infinite scroll
 */
export function useRecommendations() {
  return useInfiniteQuery<RecommendationsResponse>({
    queryKey: ['recommendations', 'for-you'],
    queryFn: ({ pageParam = 0 }) =>
      recommendationsService.getForYou({
        limit: PAGE_SIZE,
        offset: pageParam as number,
      }),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length * PAGE_SIZE : undefined,
    initialPageParam: 0,
    staleTime: STALE_TIME,
  });
}

/**
 * Hook for fetching teaser recommendations (home dashboard)
 */
export function useRecommendationsTeaser(limit: number = 5) {
  return useQuery<TeaserResponse>({
    queryKey: ['recommendations', 'teaser', limit],
    queryFn: () => recommendationsService.getTeaser(limit),
    staleTime: STALE_TIME,
  });
}

/**
 * Hook for tracking user interactions (fire-and-forget)
 */
export function useTrackInteraction() {
  return useMutation({
    mutationFn: (data: TrackInteractionInput) =>
      recommendationsService.trackInteraction(data),
    onError: (error) => {
      // Silent fail - interaction tracking is best-effort
      console.warn('Failed to track interaction:', error);
    },
    retry: false,
  });
}

/**
 * Hook for refreshing recommendations
 */
export function useRefreshRecommendations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => recommendationsService.refresh(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
}

/**
 * Helper hook to track profile view interactions
 * Call this when a companion card enters the viewport
 */
export function useTrackProfileView() {
  const trackInteraction = useTrackInteraction();

  return (companionId: string) => {
    trackInteraction.mutate({
      companionId,
      eventType: 'VIEW',
    });
  };
}

/**
 * Helper hook to track profile open interactions
 * Call this when user taps on a companion card
 */
export function useTrackProfileOpen() {
  const trackInteraction = useTrackInteraction();

  return (companionId: string, dwellTimeMs?: number) => {
    trackInteraction.mutate({
      companionId,
      eventType: 'PROFILE_OPEN',
      dwellTimeMs,
    });
  };
}
```

**Step 2: Add export to index**

Modify `society-mobile/src/lib/hooks/index.tsx` to add:

```typescript
export * from './use-recommendations';
```

**Step 3: Run type-check**

Run:
```bash
cd society-mobile && pnpm type-check
```
Expected: No errors

**Step 4: Commit**

```bash
git add society-mobile/src/lib/hooks/
git commit -m "$(cat <<'EOF'
feat(mobile): add recommendations React Query hooks

Adds hooks for:
- useRecommendations (infinite scroll)
- useRecommendationsTeaser (home dashboard)
- useTrackInteraction (event tracking)
- useRefreshRecommendations (force refresh)
- Helper hooks for view/open tracking

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4: Mobile UI - For You Tab

### Task 5: Create For You Tab in Browse Screen

**Files:**
- Create: `society-mobile/src/app/hirer/browse/for-you.tsx`
- Modify: `society-mobile/src/translations/en.json` (add translations)
- Modify: `society-mobile/src/translations/vi.json` (add translations)

**Step 1: Create the For You screen**

Create `society-mobile/src/app/hirer/browse/for-you.tsx`:

```typescript
import { FlashList } from '@shopify/flash-list';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
} from 'react-native';

import { CompanionCard, type CompanionData } from '@/components/companion-card';
import {
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { ArrowLeft, Heart } from '@/components/ui/icons';
import {
  useRecommendations,
  useRefreshRecommendations,
  useTrackInteraction,
} from '@/lib/hooks';
import { useCompanions } from '@/lib/hooks/use-companions';

export default function ForYouScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const trackInteraction = useTrackInteraction();
  const refreshRecommendations = useRefreshRecommendations();

  // Fetch recommendations
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useRecommendations();

  // Flatten pages into single array
  const recommendations = React.useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.companions);
  }, [data]);

  // Get companion IDs to fetch full profiles
  const companionIds = React.useMemo(
    () => recommendations.map((r) => r.companionId),
    [recommendations],
  );

  // Fetch full companion data
  const { data: companionsData } = useCompanions(
    { userIds: companionIds },
    { enabled: companionIds.length > 0 },
  );

  // Create a map for quick lookup
  const companionMap = React.useMemo(() => {
    if (!companionsData?.companions) return new Map();
    return new Map(
      companionsData.companions.map((c) => [c.userId || c.id, c]),
    );
  }, [companionsData]);

  // Transform to CompanionData with recommendation reason
  const companions = React.useMemo((): (CompanionData & { reason: string })[] => {
    return recommendations
      .map((rec) => {
        const c = companionMap.get(rec.companionId);
        if (!c) return null;
        return {
          id: c.id,
          name: c.user?.fullName || '',
          age: 0,
          image:
            c.photos?.[0]?.url ||
            c.user?.avatarUrl ||
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
          rating: c.ratingAvg || 0,
          reviewCount: c.ratingCount || 0,
          location: c.languages?.join(', ') || t('hirer.home.default_location'),
          pricePerHour: c.hourlyRate || 0,
          isVerified: c.user?.isVerified ?? c.verificationStatus === 'verified',
          isOnline: c.isActive,
          isPremium: c.isFeatured,
          specialties: c.services?.map((s) => s.type) || [],
          reason: rec.reason,
        };
      })
      .filter(Boolean) as (CompanionData & { reason: string })[];
  }, [recommendations, companionMap, t]);

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleCompanionPress = React.useCallback(
    (companion: CompanionData) => {
      // Track profile open
      trackInteraction.mutate({
        companionId: companion.id,
        eventType: 'PROFILE_OPEN',
      });
      router.push(`/hirer/companion/${companion.id}` as Href);
    },
    [router, trackInteraction],
  );

  const handleBookPress = React.useCallback(
    (companion: CompanionData) => {
      // Track booking started
      trackInteraction.mutate({
        companionId: companion.id,
        eventType: 'BOOKING_STARTED',
      });
      router.push(`/booking/${companion.id}` as Href);
    },
    [router, trackInteraction],
  );

  const handleRefresh = React.useCallback(async () => {
    await refreshRecommendations.mutateAsync();
    await refetch();
  }, [refreshRecommendations, refetch]);

  const handleEndReached = React.useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderCompanion = React.useCallback(
    ({ item }: { item: CompanionData & { reason: string } }) => (
      <View className="px-4 pb-3">
        <View className="mb-1 flex-row items-center gap-1">
          <Heart
            color={colors.rose[400]}
            width={12}
            height={12}
            fill={colors.rose[400]}
          />
          <Text className="text-xs text-text-secondary">{item.reason}</Text>
        </View>
        <CompanionCard
          companion={item}
          variant="compact"
          onPress={() => handleCompanionPress(item)}
          onBookPress={() => handleBookPress(item)}
          testID={`for-you-card-${item.id}`}
        />
      </View>
    ),
    [handleCompanionPress, handleBookPress],
  );

  const renderFooter = React.useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View className="items-center py-4">
        <ActivityIndicator size="small" color={colors.teal[400]} />
      </View>
    );
  }, [isFetchingNextPage]);

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable onPress={handleBack}>
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text
            style={styles.headerTitle}
            className="flex-1 text-center text-lg text-midnight"
          >
            {t('hirer.browse.for_you.title')}
          </Text>
          <View className="w-6" />
        </View>
      </SafeAreaView>

      {/* Loading State */}
      {isLoading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.teal[400]} />
          <Text className="mt-4 text-text-secondary">
            {t('hirer.browse.for_you.loading')}
          </Text>
        </View>
      )}

      {/* Empty State */}
      {!isLoading && companions.length === 0 && (
        <View className="flex-1 items-center justify-center px-8">
          <View className="mb-4 size-20 items-center justify-center rounded-full bg-softpink">
            <Heart color={colors.rose[400]} width={32} height={32} />
          </View>
          <Text
            style={styles.emptyTitle}
            className="text-center text-lg text-midnight"
          >
            {t('hirer.browse.for_you.empty_title')}
          </Text>
          <Text className="mt-2 text-center text-text-secondary">
            {t('hirer.browse.for_you.empty_subtitle')}
          </Text>
        </View>
      )}

      {/* Recommendations List */}
      {!isLoading && companions.length > 0 && (
        <FlashList
          data={companions}
          renderItem={renderCompanion}
          estimatedItemSize={100}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 20 }}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching || refreshRecommendations.isPending}
              onRefresh={handleRefresh}
              tintColor={colors.teal[400]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontFamily: 'Urbanist_600SemiBold',
  },
  emptyTitle: {
    fontFamily: 'Urbanist_700Bold',
  },
});
```

**Step 2: Add English translations**

Add to `society-mobile/src/translations/en.json` under `hirer.browse`:

```json
"for_you": {
  "title": "For You",
  "loading": "Finding your perfect matches...",
  "empty_title": "No recommendations yet",
  "empty_subtitle": "Browse and interact with companions to get personalized suggestions",
  "reason_prefix": "Recommended because"
}
```

**Step 3: Add Vietnamese translations**

Add to `society-mobile/src/translations/vi.json` under `hirer.browse`:

```json
"for_you": {
  "title": "Dành cho bạn",
  "loading": "Đang tìm kiếm người phù hợp...",
  "empty_title": "Chưa có gợi ý",
  "empty_subtitle": "Duyệt và tương tác với người đồng hành để nhận gợi ý cá nhân hóa",
  "reason_prefix": "Được đề xuất vì"
}
```

**Step 4: Run type-check**

Run:
```bash
cd society-mobile && pnpm type-check
```
Expected: No errors

**Step 5: Commit**

```bash
git add society-mobile/src/app/hirer/browse/for-you.tsx society-mobile/src/translations/
git commit -m "$(cat <<'EOF'
feat(mobile): add For You recommendations screen

Implements personalized companion recommendations with:
- Infinite scroll pagination
- Pull-to-refresh with cache invalidation
- Recommendation reason badges
- Interaction tracking on card press
- Loading and empty states

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Add For You Teaser to Home Dashboard

**Files:**
- Modify: `society-mobile/src/app/hirer/browse/index.tsx`

**Step 1: Add teaser section to browse index**

Add imports at top of `society-mobile/src/app/hirer/browse/index.tsx`:

```typescript
import { useRecommendationsTeaser, useTrackInteraction } from '@/lib/hooks';
```

Add the teaser section after the filter chips (around line 215), before the loading state:

```typescript
{/* For You Teaser Section */}
{!isLoading && (
  <ForYouTeaser
    onCompanionPress={handleCompanionPress}
    onSeeAll={() => router.push('/hirer/browse/for-you' as Href)}
  />
)}
```

Add the ForYouTeaser component at the bottom of the file (before styles):

```typescript
function ForYouTeaser({
  onCompanionPress,
  onSeeAll,
}: {
  onCompanionPress: (companion: CompanionData) => void;
  onSeeAll: () => void;
}) {
  const { t } = useTranslation();
  const { data, isLoading } = useRecommendationsTeaser(5);
  const { data: companionsData } = useCompanions(
    { userIds: data?.companions.map((c) => c.companionId) || [] },
    { enabled: !!data?.companions.length },
  );
  const trackInteraction = useTrackInteraction();

  const companionMap = React.useMemo(() => {
    if (!companionsData?.companions) return new Map();
    return new Map(
      companionsData.companions.map((c) => [c.userId || c.id, c]),
    );
  }, [companionsData]);

  const companions = React.useMemo((): CompanionData[] => {
    if (!data?.companions) return [];
    return data.companions
      .map((rec) => {
        const c = companionMap.get(rec.companionId);
        if (!c) return null;
        return {
          id: c.id,
          name: c.user?.fullName || '',
          age: 0,
          image: c.photos?.[0]?.url || c.user?.avatarUrl || '',
          rating: c.ratingAvg || 0,
          reviewCount: c.ratingCount || 0,
          location: c.languages?.join(', ') || '',
          pricePerHour: c.hourlyRate || 0,
          isVerified: c.user?.isVerified ?? false,
          isOnline: c.isActive,
          isPremium: c.isFeatured,
          specialties: [],
        };
      })
      .filter(Boolean) as CompanionData[];
  }, [data, companionMap]);

  const handlePress = React.useCallback(
    (companion: CompanionData) => {
      trackInteraction.mutate({
        companionId: companion.id,
        eventType: 'PROFILE_OPEN',
      });
      onCompanionPress(companion);
    },
    [trackInteraction, onCompanionPress],
  );

  if (isLoading || companions.length === 0) return null;

  return (
    <View className="border-b border-border-light bg-white py-4">
      <View className="flex-row items-center justify-between px-4">
        <Text style={styles.sectionTitle} className="text-base text-midnight">
          {t('hirer.browse.for_you_section')}
        </Text>
        <Pressable onPress={onSeeAll}>
          <Text className="text-sm text-teal-500">
            {t('hirer.browse.see_all')}
          </Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-3"
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      >
        {companions.map((companion) => (
          <Pressable
            key={companion.id}
            onPress={() => handlePress(companion)}
            className="w-32"
          >
            <View className="aspect-[3/4] overflow-hidden rounded-xl">
              <Image
                source={{ uri: companion.image }}
                className="size-full"
                contentFit="cover"
              />
              {companion.isVerified && (
                <View className="absolute right-1 top-1 rounded-full bg-teal-500 p-0.5">
                  <CheckCircle
                    color="white"
                    width={12}
                    height={12}
                    fill="white"
                  />
                </View>
              )}
            </View>
            <Text
              style={styles.teaserName}
              className="mt-1 text-sm text-midnight"
              numberOfLines={1}
            >
              {companion.name}
            </Text>
            <Text className="text-xs text-text-secondary">
              {formatPrice(companion.pricePerHour)}/h
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
```

Add to imports:

```typescript
import { Image } from 'expo-image';
import { CheckCircle } from '@/components/ui/icons';
import { formatPrice } from '@/lib/utils';
```

Add to styles:

```typescript
sectionTitle: {
  fontFamily: 'Urbanist_600SemiBold',
},
teaserName: {
  fontFamily: 'Urbanist_500Medium',
},
```

**Step 2: Add translations**

Add to English translations (`hirer.browse`):

```json
"for_you_section": "For You",
"see_all": "See all"
```

Add to Vietnamese translations (`hirer.browse`):

```json
"for_you_section": "Dành cho bạn",
"see_all": "Xem tất cả"
```

**Step 3: Run type-check**

Run:
```bash
cd society-mobile && pnpm type-check
```
Expected: No errors

**Step 4: Commit**

```bash
git add society-mobile/src/app/hirer/browse/index.tsx society-mobile/src/translations/
git commit -m "$(cat <<'EOF'
feat(mobile): add For You teaser to browse home

Adds horizontal scroll section showing top 5 personalized
recommendations with "See all" link to full For You tab.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 5: Testing & Verification

### Task 7: Manual Testing Checklist

**Step 1: Backend verification**

Run:
```bash
cd society-backend && pnpm dev
```

Test endpoints with curl or Postman:
- `GET /recommendations/for-you` - Should return recommendations
- `GET /recommendations/for-you/teaser?limit=5` - Should return 5 items
- `POST /recommendations/interactions` - Should track interaction
- `POST /recommendations/refresh` - Should invalidate cache

**Step 2: Mobile verification**

Run:
```bash
cd society-mobile && pnpm ios
```

Manual test cases:
1. Open browse screen - should see "For You" teaser section
2. Tap "See all" - should navigate to For You tab
3. Scroll down - should load more recommendations
4. Pull to refresh - should refresh recommendations
5. Tap on companion card - should track interaction and navigate

**Step 3: Final commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore: complete companion recommendations feature

Feature includes:
- Backend recommendations module with scoring service
- Redis caching with 5-min TTL
- Mobile API service and React Query hooks
- For You tab with infinite scroll
- Home teaser section with horizontal scroll
- Interaction tracking for future improvements

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Summary

| Phase | Tasks | Files Created | Files Modified |
|-------|-------|---------------|----------------|
| 1. Database | 1 | 0 | 1 (schema.prisma) |
| 2. Backend | 1 | 6 | 1 (app.module.ts) |
| 3. Mobile API | 2 | 2 | 2 (index exports) |
| 4. Mobile UI | 2 | 1 | 3 (browse/index, translations) |
| 5. Testing | 1 | 0 | 0 |

**Total: 7 tasks, ~9 new files, ~7 modified files**
