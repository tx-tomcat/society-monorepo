# For You TikTok-Style Feed Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the For You scrollable card list with a full-screen TikTok-style vertical pager with photo auto-advance, richer behavioral signals, and explore/exploit algorithm.

**Architecture:** Backend-first approach. Extend Prisma schema with new event types, add feed endpoint with explore/exploit scoring, then build the mobile pager UI with batched signal tracking and photo preloading.

**Tech Stack:** NestJS + Prisma (backend), React Native + Expo + react-native-pager-view + Reanimated (mobile)

**Design Doc:** `docs/plans/2026-02-24-for-you-tiktok-redesign.md`

---

## Task 1: Extend Prisma Schema with New Event Types

**Files:**
- Modify: `society-backend/prisma/schema.prisma:1388-1397`

**Step 1: Add new event types to InteractionEventType enum**

In `society-backend/prisma/schema.prisma`, find the `InteractionEventType` enum at line 1388 and add the new event types:

```prisma
enum InteractionEventType {
  VIEW              // Profile card appeared in viewport
  PROFILE_OPEN      // Tapped to view full profile
  BOOKMARK          // Added to favorites
  UNBOOKMARK        // Removed from favorites
  MESSAGE_SENT      // Sent first message
  BOOKING_STARTED   // Entered booking flow
  BOOKING_COMPLETED // Completed booking
  BOOKING_CANCELLED // Cancelled booking
  // Feed-specific signals
  SKIP              // Swiped away in < 2 seconds
  DWELL_VIEW        // Stayed on companion 2-10 seconds
  DWELL_PAUSE       // Tapped to pause photo auto-advance
  PHOTO_BROWSE      // Manually browsed through 2+ photos
  REVISIT           // Swiped back to previous companion
  NOT_INTERESTED    // Long-press "Not interested"
  SHARE             // Shared companion profile
}
```

**Step 2: Generate Prisma client**

Run: `cd society-backend && npx prisma generate`
Expected: "Generated Prisma Client" success message

**Step 3: Create migration**

Run: `cd society-backend && npx prisma migrate dev --name add-feed-interaction-events`
Expected: Migration created and applied

**Step 4: Commit**

```bash
git add society-backend/prisma/
git commit -m "feat(backend): add feed interaction event types to schema"
```

---

## Task 2: Extend Backend DTOs and Event Weights

**Files:**
- Modify: `society-backend/src/modules/recommendations/dto/track-interaction.dto.ts`
- Modify: `society-backend/src/modules/recommendations/dto/get-recommendations.dto.ts`
- Modify: `society-backend/src/modules/recommendations/services/scoring.service.ts:5-14`

**Step 1: Update InteractionEventType enum in DTO**

In `society-backend/src/modules/recommendations/dto/track-interaction.dto.ts`, add the new enum values:

```typescript
export enum InteractionEventType {
  VIEW = 'VIEW',
  PROFILE_OPEN = 'PROFILE_OPEN',
  BOOKMARK = 'BOOKMARK',
  UNBOOKMARK = 'UNBOOKMARK',
  MESSAGE_SENT = 'MESSAGE_SENT',
  BOOKING_STARTED = 'BOOKING_STARTED',
  BOOKING_COMPLETED = 'BOOKING_COMPLETED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  // Feed-specific signals
  SKIP = 'SKIP',
  DWELL_VIEW = 'DWELL_VIEW',
  DWELL_PAUSE = 'DWELL_PAUSE',
  PHOTO_BROWSE = 'PHOTO_BROWSE',
  REVISIT = 'REVISIT',
  NOT_INTERESTED = 'NOT_INTERESTED',
  SHARE = 'SHARE',
}
```

**Step 2: Add BatchTrackInteractionDto**

In the same file, add below the existing `TrackInteractionDto`:

```typescript
export class BatchTrackInteractionDto {
  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackInteractionDto)
  events: TrackInteractionDto[];
}
```

Add imports: `IsArray, ValidateNested` from `class-validator`, `Type` from `class-transformer`.

**Step 3: Add GetFeedDto**

In `society-backend/src/modules/recommendations/dto/get-recommendations.dto.ts`, add:

```typescript
export class GetFeedDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  excludeIds?: string; // comma-separated companion IDs
}
```

Add `IsString` to imports from `class-validator`.

**Step 4: Update EVENT_WEIGHTS in scoring.service.ts**

In `society-backend/src/modules/recommendations/services/scoring.service.ts`, update `EVENT_WEIGHTS` at line 5:

```typescript
const EVENT_WEIGHTS: Record<string, number> = {
  VIEW: 0.1,
  PROFILE_OPEN: 0.3,
  BOOKMARK: 0.7,
  UNBOOKMARK: -0.3,
  MESSAGE_SENT: 0.8,
  BOOKING_STARTED: 0.9,
  BOOKING_COMPLETED: 1.0,
  BOOKING_CANCELLED: -0.5,
  // Feed-specific signals
  SKIP: -0.2,
  DWELL_VIEW: 0.3,       // Average of 0.2-0.5 range; actual value scaled by dwellTimeMs
  DWELL_PAUSE: 0.4,
  PHOTO_BROWSE: 0.3,
  REVISIT: 0.6,
  NOT_INTERESTED: -0.8,
  SHARE: 0.5,
};
```

**Step 5: Update SCORING_WEIGHTS**

In the same file, update `SCORING_WEIGHTS` at line 17:

```typescript
const SCORING_WEIGHTS = {
  preferenceMatch: 0.25,  // was 0.35
  profileQuality: 0.20,
  availability: 0.10,     // was 0.15
  popularity: 0.15,
  behavioralAffinity: 0.30, // was 0.15
};
```

**Step 6: Commit**

```bash
git add society-backend/src/modules/recommendations/
git commit -m "feat(backend): add feed DTOs and update scoring weights"
```

---

## Task 3: Add Feed Endpoint and Batch Tracking

**Files:**
- Modify: `society-backend/src/modules/recommendations/services/recommendations.service.ts`
- Modify: `society-backend/src/modules/recommendations/controllers/recommendations.controller.ts`

**Step 1: Add getFeed method to RecommendationsService**

In `society-backend/src/modules/recommendations/services/recommendations.service.ts`, add after the `getTeaser` method (after line 114):

```typescript
/**
 * Get feed recommendations with explore/exploit balance
 * Used by the TikTok-style vertical pager
 */
async getFeed(
  userId: string,
  limit: number = 10,
  excludeIds: string[] = [],
): Promise<RecommendationsResult> {
  // Determine strategy
  const interactionCount = await this.prisma.userInteraction.count({
    where: { userId },
  });
  const strategy: 'cold_start' | 'hybrid' =
    interactionCount < COLD_START_THRESHOLD ? 'cold_start' : 'hybrid';

  // Get candidates excluding already-seen IDs
  const [allCandidates, boostMultipliers] = await Promise.all([
    this.getCandidateCompanions(userId),
    this.getActiveBoostMultipliers(),
  ]);

  // Filter out excluded (already-seen) IDs
  const excludeSet = new Set(excludeIds);
  const candidates = allCandidates.filter((id) => !excludeSet.has(id));

  if (candidates.length === 0) {
    return { companions: [], hasMore: false, total: 0, strategy };
  }

  // Score all candidates
  let scored: ScoredCompanion[];
  if (strategy === 'cold_start') {
    scored = await this.getColdStartRecommendations(candidates, boostMultipliers);
  } else {
    scored = await this.scoringService.calculateScores(
      userId,
      candidates,
      boostMultipliers,
    );
  }

  // Apply freshness penalty — companions seen by user in last 24h score 0.8x
  const recentlyViewed = await this.prisma.userInteraction.findMany({
    where: {
      userId,
      createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    select: { companionId: true },
    distinct: ['companionId'],
  });
  const recentSet = new Set(recentlyViewed.map((r) => r.companionId));

  scored = scored.map((s) => {
    // Check by both companionId and companion.userId since recentSet has userIds
    if (recentSet.has(s.companion.userId) || recentSet.has(s.companionId)) {
      return { ...s, score: s.score * 0.8 };
    }
    return s;
  });

  // Separate boosted from regular
  const boosted = scored.filter((s) => boostMultipliers.has(s.companionId));
  const regular = scored.filter((s) => !boostMultipliers.has(s.companionId));

  // Sort each group by score
  boosted.sort((a, b) => b.score - a.score);
  regular.sort((a, b) => b.score - a.score);

  // Explore/exploit split on regular pool
  const exploitCount = Math.max(1, Math.floor(limit * 0.7));
  const exploreCount = limit - exploitCount;

  const exploit = regular.slice(0, exploitCount);

  // Explore: random sample from remaining candidates
  const remaining = regular.slice(exploitCount);
  const explore: ScoredCompanion[] = [];
  const remainingCopy = [...remaining];
  for (let i = 0; i < Math.min(exploreCount, remainingCopy.length); i++) {
    const randomIdx = Math.floor(Math.random() * remainingCopy.length);
    explore.push(remainingCopy.splice(randomIdx, 1)[0]);
  }

  // Interleave: boosted first, then exploit with explore mixed in at every 4th position
  const merged: ScoredCompanion[] = [...boosted.slice(0, 2)]; // max 2 boosted per batch
  const exploitAndExplore = [...exploit];

  // Insert explore items at positions 3, 7 (relative to exploit list)
  let exploreIdx = 0;
  for (let i = 0; i < exploitAndExplore.length; i++) {
    merged.push(exploitAndExplore[i]);
    if ((merged.length) % 4 === 0 && exploreIdx < explore.length) {
      merged.push(explore[exploreIdx++]);
    }
  }
  // Append any remaining explore items
  while (exploreIdx < explore.length) {
    merged.push(explore[exploreIdx++]);
  }

  // Apply diversity: avoid 3+ consecutive same gender
  const diversified = this.applyDiversity(merged);

  const result = diversified.slice(0, limit);

  return {
    companions: result,
    hasMore: candidates.length > excludeIds.length + result.length,
    total: candidates.length - excludeIds.length,
    strategy,
  };
}

/**
 * Track a batch of interactions
 */
async trackBatch(
  userId: string,
  sessionId: string | undefined,
  events: { companionId: string; eventType: string; dwellTimeMs?: number }[],
): Promise<void> {
  for (const event of events) {
    await this.trackInteraction(userId, {
      companionId: event.companionId,
      eventType: event.eventType as any,
      dwellTimeMs: event.dwellTimeMs,
      sessionId,
    });
  }
}

/**
 * Apply diversity: avoid 3+ consecutive companions with same gender
 */
private applyDiversity(companions: ScoredCompanion[]): ScoredCompanion[] {
  if (companions.length <= 2) return companions;

  const result: ScoredCompanion[] = [companions[0]];
  const remaining = companions.slice(1);

  for (let i = 0; i < remaining.length; i++) {
    const candidate = remaining[i];
    const last2 = result.slice(-2);

    // Check if adding this would create 3 consecutive same gender
    if (
      last2.length === 2 &&
      last2[0].companion.gender === last2[1].companion.gender &&
      last2[1].companion.gender === candidate.companion.gender
    ) {
      // Find the next companion with a different gender and swap
      const swapIdx = remaining.slice(i + 1).findIndex(
        (c) => c.companion.gender !== candidate.companion.gender,
      );
      if (swapIdx !== -1) {
        const actualIdx = i + 1 + swapIdx;
        result.push(remaining[actualIdx]);
        remaining[actualIdx] = candidate;
        continue;
      }
    }
    result.push(candidate);
  }

  return result;
}
```

**Step 2: Add controller endpoints**

In `society-backend/src/modules/recommendations/controllers/recommendations.controller.ts`, add after the existing `trackInteraction` method (after line 96):

Import `GetFeedDto` alongside existing DTO imports at line 16:

```typescript
import {
  GetFeedDto,
  GetRecommendationsDto,
  GetTeaserDto,
} from '../dto/get-recommendations.dto';
import { BatchTrackInteractionDto, TrackInteractionDto } from '../dto/track-interaction.dto';
```

Add the feed endpoint before the existing `@Get('for-you')`:

```typescript
@Get('feed')
async getFeed(
  @CurrentUser('id') userId: string,
  @Query() query: GetFeedDto,
): Promise<RecommendationsResult> {
  const benefits = await this.membershipService.getUserBenefits(userId);
  const photoLimit = benefits.forYouLimit;

  const excludeIds = query.excludeIds
    ? query.excludeIds.split(',').filter(Boolean)
    : [];

  const result = await this.recommendationsService.getFeed(
    userId,
    query.limit,
    excludeIds,
  );

  return {
    ...result,
    companions: result.companions.map((c) => ({
      ...c,
      companion: {
        ...c.companion,
        photos: c.companion.photos?.slice(0, photoLimit) ?? [],
      },
    })),
  };
}

@Post('interactions/batch')
trackBatchInteractions(
  @CurrentUser('id') userId: string,
  @Body() dto: BatchTrackInteractionDto,
) {
  this.recommendationsService
    .trackBatch(userId, dto.sessionId, dto.events)
    .catch((error) => {
      this.logger.warn(
        `Failed to track batch interaction: userId=${userId}`,
        error.stack,
      );
    });
  return { success: true };
}
```

**Step 3: Verify build**

Run: `cd society-backend && pnpm build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add society-backend/src/modules/recommendations/
git commit -m "feat(backend): add feed endpoint with explore/exploit and batch tracking"
```

---

## Task 4: Install react-native-pager-view

**Files:**
- Modify: `society-mobile/package.json` (via expo install)

**Step 1: Install the package**

Run: `cd society-mobile && npx expo install react-native-pager-view`
Expected: Package added to package.json and installed

**Step 2: Commit**

```bash
git add society-mobile/package.json society-mobile/pnpm-lock.yaml
git commit -m "chore(mobile): add react-native-pager-view dependency"
```

---

## Task 5: Extend Mobile API Service and Hooks

**Files:**
- Modify: `society-mobile/src/lib/api/services/recommendations.service.ts`
- Modify: `society-mobile/src/lib/hooks/use-recommendations.ts`

**Step 1: Add new types and API methods**

In `society-mobile/src/lib/api/services/recommendations.service.ts`, add the new event types to the existing `InteractionEventType` union (line 3-11):

```typescript
export type InteractionEventType =
  | 'VIEW'
  | 'PROFILE_OPEN'
  | 'BOOKMARK'
  | 'UNBOOKMARK'
  | 'MESSAGE_SENT'
  | 'BOOKING_STARTED'
  | 'BOOKING_COMPLETED'
  | 'BOOKING_CANCELLED'
  | 'SKIP'
  | 'DWELL_VIEW'
  | 'DWELL_PAUSE'
  | 'PHOTO_BROWSE'
  | 'REVISIT'
  | 'NOT_INTERESTED'
  | 'SHARE';
```

Add `BatchTrackInteractionInput` type and new API methods after the existing `refresh` method (after line 101):

```typescript
export interface BatchTrackInteractionInput {
  sessionId?: string;
  events: TrackInteractionInput[];
}

export const recommendationsService = {
  // ... existing methods stay ...

  /**
   * Get feed recommendations (TikTok-style pager)
   */
  async getFeed(params?: {
    limit?: number;
    sessionId?: string;
    excludeIds?: string[];
  }): Promise<RecommendationsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.sessionId) queryParams.append('sessionId', params.sessionId);
    if (params?.excludeIds?.length) {
      queryParams.append('excludeIds', params.excludeIds.join(','));
    }
    const query = queryParams.toString();
    return apiClient.get(`/recommendations/feed${query ? `?${query}` : ''}`);
  },

  /**
   * Track batch of interactions (fire-and-forget)
   */
  async trackBatchInteractions(
    data: BatchTrackInteractionInput,
  ): Promise<{ success: boolean }> {
    return apiClient.post('/recommendations/interactions/batch', data);
  },
};
```

**Step 2: Add useFeedRecommendations hook**

In `society-mobile/src/lib/hooks/use-recommendations.ts`, add after the existing `useRecommendationsTeaser` hook (after line 67):

```typescript
import { useCallback, useMemo, useRef, useState } from 'react';
import uuid from 'react-native-uuid';

const FEED_PAGE_SIZE = 10;

/**
 * Hook for TikTok-style feed with session tracking and infinite loading
 */
export function useFeedRecommendations() {
  const sessionId = useMemo(() => String(uuid.v4()), []);
  const [seenIds, setSeenIds] = useState<string[]>([]);

  const query = useInfiniteQuery<RecommendationsResponse>({
    queryKey: ['recommendations', 'feed', sessionId],
    queryFn: async ({ pageParam = [] }) => {
      return recommendationsService.getFeed({
        limit: FEED_PAGE_SIZE,
        sessionId,
        excludeIds: pageParam as string[],
      });
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined;
      return seenIds;
    },
    initialPageParam: [] as string[],
    staleTime: Infinity, // Feed doesn't go stale within a session
  });

  const markSeen = useCallback((companionId: string) => {
    setSeenIds((prev) => {
      if (prev.includes(companionId)) return prev;
      return [...prev, companionId];
    });
  }, []);

  const resetSession = useCallback(() => {
    setSeenIds([]);
    query.refetch();
  }, [query]);

  return { ...query, sessionId, seenIds, markSeen, resetSession };
}
```

Also add `BatchTrackInteractionInput` to the imports from the service file.

**Step 3: Verify type check**

Run: `cd society-mobile && pnpm type-check`
Expected: Only pre-existing `@gorhom/bottom-sheet` error

**Step 4: Commit**

```bash
git add society-mobile/src/lib/
git commit -m "feat(mobile): add feed API service and useFeedRecommendations hook"
```

---

## Task 6: Create Photo Progress Bar Component

**Files:**
- Create: `society-mobile/src/components/feed/photo-progress-bar.tsx`

**Step 1: Create the component**

Stories-style progress bars that animate linearly for each photo. Reuses the concept from the existing `PhotoIndicator` dots but as animated bars.

```typescript
import * as React from 'react';
import { View as RNView } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type PhotoProgressBarProps = {
  total: number;
  current: number;
  isPaused: boolean;
  duration: number; // ms per photo
};

export const PhotoProgressBar = React.memo(function PhotoProgressBar({
  total,
  current,
  isPaused,
  duration,
}: PhotoProgressBarProps) {
  if (total <= 1) return null;

  return (
    <RNView className="absolute left-0 right-0 top-4 flex-row gap-1 px-4" style={{ zIndex: 10 }}>
      {Array.from({ length: Math.min(total, 6) }).map((_, index) => (
        <ProgressSegment
          key={index}
          index={index}
          current={current}
          isPaused={isPaused}
          duration={duration}
        />
      ))}
    </RNView>
  );
});

function ProgressSegment({
  index,
  current,
  isPaused,
  duration,
}: {
  index: number;
  current: number;
  isPaused: boolean;
  duration: number;
}) {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    if (index < current) {
      // Completed segments: full width
      progress.value = 1;
    } else if (index > current) {
      // Future segments: empty
      progress.value = 0;
    } else {
      // Current segment: animate
      progress.value = 0;
      if (!isPaused) {
        progress.value = withTiming(1, {
          duration,
          easing: Easing.linear,
        });
      }
    }
  }, [index, current, isPaused, duration, progress]);

  // Pause: keep current progress position
  React.useEffect(() => {
    if (index === current && isPaused) {
      // Cancel animation by setting to current value (Reanimated handles this)
      progress.value = progress.value;
    } else if (index === current && !isPaused) {
      // Resume from current position
      const remaining = (1 - progress.value) * duration;
      progress.value = withTiming(1, {
        duration: remaining,
        easing: Easing.linear,
      });
    }
  }, [isPaused, index, current, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <RNView className="h-[3px] flex-1 overflow-hidden rounded-sm bg-white/30">
      <Animated.View
        className="h-full rounded-sm bg-white"
        style={animatedStyle}
      />
    </RNView>
  );
}
```

**Step 2: Commit**

```bash
git add society-mobile/src/components/feed/
git commit -m "feat(mobile): add Stories-style photo progress bar component"
```

---

## Task 7: Create Photo Auto-Advance Hook

**Files:**
- Create: `society-mobile/src/components/feed/use-photo-auto-advance.ts`

**Step 1: Create the hook**

```typescript
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

const DEFAULT_INTERVAL = 3500; // 3.5 seconds per photo

type UsePhotoAutoAdvanceOptions = {
  totalPhotos: number;
  interval?: number;
  isActive: boolean; // only run when this card is the current page
};

export function usePhotoAutoAdvance({
  totalPhotos,
  interval = DEFAULT_INTERVAL,
  isActive,
}: UsePhotoAutoAdvanceOptions) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check reduced motion preference
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => subscription.remove();
  }, []);

  // Reset when becoming active
  useEffect(() => {
    if (isActive) {
      setCurrentIndex(0);
      setIsPaused(false);
    } else {
      clearTimer();
    }
  }, [isActive]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Auto-advance timer
  useEffect(() => {
    clearTimer();

    if (!isActive || isPaused || reduceMotion || totalPhotos <= 1) {
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalPhotos);
    }, interval);

    return clearTimer;
  }, [isActive, isPaused, reduceMotion, totalPhotos, interval, clearTimer]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const goToPhoto = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalPhotos) {
        setCurrentIndex(index);
      }
    },
    [totalPhotos],
  );

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, totalPhotos - 1));
  }, [totalPhotos]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  return {
    currentIndex,
    isPaused,
    reduceMotion,
    togglePause,
    goToPhoto,
    goNext,
    goPrev,
    totalPhotos,
    interval,
  };
}
```

**Step 2: Commit**

```bash
git add society-mobile/src/components/feed/use-photo-auto-advance.ts
git commit -m "feat(mobile): add photo auto-advance hook with reduced-motion support"
```

---

## Task 8: Create Interaction Tracker Hook

**Files:**
- Create: `society-mobile/src/components/feed/use-interaction-tracker.ts`

**Step 1: Create the batched event tracker**

```typescript
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import type { TrackInteractionInput } from '@/lib/api/services/recommendations.service';
import { recommendationsService } from '@/lib/api/services/recommendations.service';

const FLUSH_INTERVAL = 5000; // Flush every 5 seconds

export function useInteractionTracker(sessionId: string) {
  const queueRef = useRef<TrackInteractionInput[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const flush = useCallback(async () => {
    if (queueRef.current.length === 0) return;

    const events = [...queueRef.current];
    queueRef.current = [];

    try {
      await recommendationsService.trackBatchInteractions({
        sessionId,
        events,
      });
    } catch {
      // Best-effort: log and discard on failure
      if (__DEV__) {
        console.warn('[InteractionTracker] Batch flush failed, discarding', events.length, 'events');
      }
    }
  }, [sessionId]);

  // Periodic flush
  useEffect(() => {
    timerRef.current = setInterval(flush, FLUSH_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      flush(); // Flush remaining on unmount
    };
  }, [flush]);

  // Flush on app background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        flush();
      }
    });
    return () => subscription.remove();
  }, [flush]);

  const track = useCallback(
    (event: Omit<TrackInteractionInput, 'sessionId'>) => {
      queueRef.current.push({ ...event, sessionId });
    },
    [sessionId],
  );

  const trackDwell = useCallback(
    (companionId: string, dwellTimeMs: number) => {
      if (dwellTimeMs < 2000) {
        track({ companionId, eventType: 'SKIP', dwellTimeMs });
      } else {
        track({ companionId, eventType: 'DWELL_VIEW', dwellTimeMs });
      }
    },
    [track],
  );

  return { track, trackDwell, flush };
}
```

**Step 2: Commit**

```bash
git add society-mobile/src/components/feed/use-interaction-tracker.ts
git commit -m "feat(mobile): add batched interaction tracker hook"
```

---

## Task 9: Create Feed Action Buttons Component

**Files:**
- Create: `society-mobile/src/components/feed/feed-action-buttons.tsx`

**Step 1: Create the right-side action stack**

```typescript
import * as React from 'react';
import { Pressable, View as RNView } from 'react-native';

import { Text } from '@/components/ui';
import { Calendar, Heart, MessageCircle } from '@/components/ui/icons';
import { useTierTheme } from '@/lib/theme';

type FeedActionButtonsProps = {
  companionId: string;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
  onMessage: () => void;
  onBook: () => void;
};

export const FeedActionButtons = React.memo(function FeedActionButtons({
  isFavorite,
  onFavoriteToggle,
  onMessage,
  onBook,
}: FeedActionButtonsProps) {
  const theme = useTierTheme();

  return (
    <RNView className="absolute bottom-44 right-4 items-center gap-4" style={{ zIndex: 20 }}>
      {/* Favorite */}
      <Pressable
        onPress={onFavoriteToggle}
        className="items-center justify-center rounded-full"
        style={{
          width: 48,
          height: 48,
          backgroundColor: 'rgba(0,0,0,0.3)',
        }}
      >
        <Heart
          color={isFavorite ? theme.primary : '#FFFFFF'}
          width={24}
          height={24}
          fill={isFavorite ? theme.primary : 'transparent'}
        />
      </Pressable>

      {/* Message */}
      <Pressable
        onPress={onMessage}
        className="items-center justify-center rounded-full"
        style={{
          width: 48,
          height: 48,
          backgroundColor: 'rgba(0,0,0,0.3)',
        }}
      >
        <MessageCircle color="#FFFFFF" width={24} height={24} />
      </Pressable>

      {/* Book */}
      <Pressable
        onPress={onBook}
        className="items-center justify-center overflow-hidden rounded-full"
        style={{
          width: 48,
          height: 48,
          backgroundColor: theme.primary,
        }}
      >
        <Calendar color="#FFFFFF" width={22} height={22} />
      </Pressable>
    </RNView>
  );
});
```

**Step 2: Commit**

```bash
git add society-mobile/src/components/feed/feed-action-buttons.tsx
git commit -m "feat(mobile): add right-side feed action buttons component"
```

---

## Task 10: Create Feed Card Component

**Files:**
- Create: `society-mobile/src/components/feed/feed-card.tsx`

**Step 1: Create the full-screen feed card**

This extracts and reuses the info overlay pattern from `CompanionCard` in `swipeable-companion-card.tsx`. Same gradient, same layout, adapted for full-screen.

```typescript
import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Platform, Pressable, View as RNView } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Badge } from '@/components/ui/badge';
import { colors, Image, Text } from '@/components/ui';
import {
  Heart,
  MessageCircle,
  OnlineDot,
  ShieldCheck,
  Star,
} from '@/components/ui/icons';
import type { ScoredCompanion } from '@/lib/api/services/recommendations.service';
import { useTierTheme } from '@/lib/theme';
import { formatLanguages, formatVND, getOccasionName } from '@/lib/utils';

import { FeedActionButtons } from './feed-action-buttons';
import { PhotoProgressBar } from './photo-progress-bar';
import { usePhotoAutoAdvance } from './use-photo-auto-advance';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type FeedCardProps = {
  recommendation: ScoredCompanion;
  isActive: boolean;
  isFavorite: boolean;
  onFavoriteToggle: (companionId: string) => void;
  onBook: (companionId: string) => void;
  onPhotoBrowse: (companionId: string) => void;
  onDwellPause: (companionId: string) => void;
};

export const FeedCard = React.memo(function FeedCard({
  recommendation,
  isActive,
  isFavorite,
  onFavoriteToggle,
  onBook,
  onPhotoBrowse,
  onDwellPause,
}: FeedCardProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTierTheme();
  const companion = recommendation.companion;

  const photos = React.useMemo(() => {
    if (!companion?.photos?.length) {
      return companion?.avatar
        ? [companion.avatar]
        : ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800'];
    }
    return companion.photos.map((p) => p.url);
  }, [companion]);

  const {
    currentIndex,
    isPaused,
    togglePause,
    goNext,
    goPrev,
    interval,
  } = usePhotoAutoAdvance({
    totalPhotos: photos.length,
    isActive,
  });

  // Track manual photo browsing
  const photoBrowseCount = React.useRef(0);
  const handleLeftTap = React.useCallback(() => {
    goPrev();
    photoBrowseCount.current++;
    if (photoBrowseCount.current >= 2) {
      onPhotoBrowse(recommendation.companionId);
    }
  }, [goPrev, onPhotoBrowse, recommendation.companionId]);

  const handleRightTap = React.useCallback(() => {
    goNext();
    photoBrowseCount.current++;
    if (photoBrowseCount.current >= 2) {
      onPhotoBrowse(recommendation.companionId);
    }
  }, [goNext, onPhotoBrowse, recommendation.companionId]);

  const handleCenterTap = React.useCallback(() => {
    togglePause();
    if (!isPaused) {
      onDwellPause(recommendation.companionId);
    }
  }, [togglePause, isPaused, onDwellPause, recommendation.companionId]);

  const handleViewProfile = React.useCallback(() => {
    router.push(`/hirer/companion/${recommendation.companionId}` as Href);
  }, [router, recommendation.companionId]);

  const handleMessage = React.useCallback(() => {
    router.push(`/hirer/chat/${recommendation.companionId}` as Href);
  }, [router, recommendation.companionId]);

  const handleBook = React.useCallback(() => {
    onBook(recommendation.companionId);
  }, [onBook, recommendation.companionId]);

  const handleFavorite = React.useCallback(() => {
    onFavoriteToggle(recommendation.companionId);
  }, [onFavoriteToggle, recommendation.companionId]);

  // Reset photo browse count when card becomes active
  React.useEffect(() => {
    if (isActive) {
      photoBrowseCount.current = 0;
    }
  }, [isActive]);

  if (!companion) return <RNView style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }} />;

  return (
    <RNView style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }} className="bg-black">
      {/* Photo */}
      <Animated.View
        entering={FadeIn.duration(300)}
        className="absolute inset-0"
      >
        <Image
          source={{ uri: photos[currentIndex] }}
          className="size-full"
          contentFit="cover"
        />
      </Animated.View>

      {/* Photo progress bar */}
      <PhotoProgressBar
        total={photos.length}
        current={currentIndex}
        isPaused={isPaused}
        duration={interval}
      />

      {/* Gradient overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
        locations={[0, 0.15, 0.5, 1]}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '100%',
        }}
        pointerEvents="none"
      />

      {/* Photo tap zones: left (1/3), center (1/3), right (1/3) */}
      <RNView className="absolute inset-0 flex-row" style={{ zIndex: 5 }}>
        <Pressable className="flex-1" onPress={handleLeftTap} />
        <Pressable className="flex-1" onPress={handleCenterTap} />
        <Pressable className="flex-1" onPress={handleRightTap} />
      </RNView>

      {/* Top badges */}
      <RNView className="absolute left-4 top-14 flex-row gap-2" style={{ zIndex: 10 }}>
        {companion.isActive && (
          <Badge
            label={t('hirer.companion_card.online')}
            variant="online"
            size="sm"
            icon={<OnlineDot color="#FFFFFF" width={8} height={8} />}
          />
        )}
        {companion.isVerified && (
          <Badge
            label={t('hirer.companion_card.verified')}
            variant="verified"
            size="sm"
            icon={<ShieldCheck color="#FFFFFF" width={12} height={12} />}
          />
        )}
      </RNView>

      {/* Right-side action buttons */}
      <FeedActionButtons
        companionId={recommendation.companionId}
        isFavorite={isFavorite}
        onFavoriteToggle={handleFavorite}
        onMessage={handleMessage}
        onBook={handleBook}
      />

      {/* Bottom info overlay — same layout as CompanionCard */}
      <Pressable
        onPress={handleViewProfile}
        className="absolute inset-x-0 bottom-0 p-5"
        style={{
          paddingBottom: Platform.OS === 'ios' ? 100 : 80,
          zIndex: 15,
        }}
      >
        {/* Recommendation reason */}
        <RNView className="mb-3 flex-row items-center gap-1.5 self-start rounded-full bg-white/15 px-3 py-1.5">
          <Heart
            color={theme.primary}
            width={12}
            height={12}
            fill={theme.primary}
          />
          <Text className="font-urbanist-medium text-xs text-white">
            {recommendation.reason}
          </Text>
        </RNView>

        {/* Name and age */}
        <RNView className="mb-2 flex-row items-center gap-2">
          <Text className="font-urbanist-bold text-3xl tracking-tight text-white">
            {companion.displayName}
            {companion.age && (
              <Text className="font-urbanist text-2xl text-white/90">
                , {companion.age}
              </Text>
            )}
          </Text>
          {companion.isVerified && (
            <ShieldCheck color={colors.teal[400]} width={24} height={24} />
          )}
        </RNView>

        {/* Rating and languages */}
        <RNView className="mb-3 flex-row items-center gap-4">
          <RNView className="flex-row items-center gap-1">
            <Star color="#FFD93D" width={16} height={16} filled />
            <Text className="font-urbanist-medium text-sm text-white/90">
              {companion.rating?.toFixed(1) || '5.0'} ({companion.reviewCount || 0})
            </Text>
          </RNView>
          {companion.languages?.length > 0 && (
            <RNView className="flex-row items-center gap-1">
              <MessageCircle color="#FFFFFF" width={14} height={14} />
              <Text className="font-urbanist-medium text-sm text-white/90">
                {formatLanguages(companion.languages, 2)}
              </Text>
            </RNView>
          )}
        </RNView>

        {/* Services */}
        {companion.services?.length > 0 && (
          <RNView className="mb-4 flex-row flex-wrap gap-2">
            {companion.services.slice(0, 3).map((service) => (
              <RNView
                key={service.occasionId}
                className="rounded-2xl bg-white/20 px-3 py-1.5"
              >
                <Text className="font-urbanist-medium text-xs text-white">
                  {getOccasionName(service.occasion, i18n.language) || service.occasionId}
                </Text>
              </RNView>
            ))}
          </RNView>
        )}

        {/* Price */}
        <RNView>
          <Text className="mb-0.5 font-urbanist text-xs text-white/70">
            {t('hirer.companion_card.starting_from')}
          </Text>
          <Text className="font-urbanist-bold text-2xl" style={{ color: theme.secondary }}>
            {formatVND(companion.hourlyRate)}
            <Text className="font-urbanist-medium text-base text-white/70">
              /hr
            </Text>
          </Text>
        </RNView>
      </Pressable>
    </RNView>
  );
});
```

**Step 2: Commit**

```bash
git add society-mobile/src/components/feed/feed-card.tsx
git commit -m "feat(mobile): add full-screen feed card with photo auto-advance"
```

---

## Task 11: Rewrite For You Tab with Vertical Pager

**Files:**
- Modify: `society-mobile/src/app/(app)/for-you.tsx`

**Step 1: Rewrite the For You tab**

Replace the entire content of `society-mobile/src/app/(app)/for-you.tsx` with the PagerView-based feed. This reuses the existing empty state component and loading state pattern.

The key elements:
- `PagerView` with `orientation="vertical"` for TikTok-style swiping
- Dwell time tracking: start timer on page select, flush on page change
- Preload next companions' photos via `Image.prefetch()`
- Session-based dedup via `useFeedRecommendations`
- Skeleton loading state for initial load

Reference the existing `for-you.tsx` (lines 109-167) for the empty state component pattern — reuse the same gradient icon + refresh button layout.

The new file should:
1. Import `PagerView` from `react-native-pager-view`
2. Use `useFeedRecommendations()` instead of `useRecommendations()`
3. Use `useInteractionTracker(sessionId)` for batched event tracking
4. Render a `PagerView` with `FeedCard` per page
5. Track dwell time via `useRef<number>` timestamping on `onPageSelected`
6. Preload photos of N+1 and N+2 companions when page changes
7. Call `markSeen(companionId)` on each page view
8. Load more when reaching `total - 3` from end

**Step 2: Verify it builds**

Run: `cd society-mobile && pnpm type-check`
Expected: Only pre-existing `@gorhom/bottom-sheet` error

**Step 3: Commit**

```bash
git add society-mobile/src/app/(app)/for-you.tsx
git commit -m "feat(mobile): rewrite For You tab with TikTok-style vertical pager"
```

---

## Task 12: Add Barrel Export and Translations

**Files:**
- Create: `society-mobile/src/components/feed/index.ts`
- Modify: `society-mobile/src/translations/en.json`
- Modify: `society-mobile/src/translations/vi.json`

**Step 1: Create barrel export**

```typescript
export { FeedCard } from './feed-card';
export { FeedActionButtons } from './feed-action-buttons';
export { PhotoProgressBar } from './photo-progress-bar';
export { usePhotoAutoAdvance } from './use-photo-auto-advance';
export { useInteractionTracker } from './use-interaction-tracker';
```

**Step 2: Add any new translation keys**

Check if the feed needs any new keys (paused indicator, not interested menu, etc.). Add under `hirer.browse.for_you`:

```json
{
  "hirer": {
    "browse": {
      "for_you": {
        "paused": "Paused",
        "tap_to_resume": "Tap to resume",
        "not_interested": "Not interested",
        "swipe_hint": "Swipe up for next"
      }
    }
  }
}
```

Add equivalent Vietnamese translations to `vi.json`.

**Step 3: Final type check**

Run: `cd society-mobile && pnpm type-check`
Expected: Only pre-existing `@gorhom/bottom-sheet` error

**Step 4: Commit**

```bash
git add society-mobile/src/components/feed/ society-mobile/src/translations/
git commit -m "feat(mobile): add feed barrel export and translations"
```

---

## Task 13: Backend Build and Test Verification

**Files:** None (verification only)

**Step 1: Build backend**

Run: `cd society-backend && pnpm build`
Expected: Build succeeds

**Step 2: Run existing tests**

Run: `cd society-backend && npx jest --no-coverage`
Expected: All tests pass (existing tests should not be broken)

**Step 3: Run mobile type check**

Run: `cd society-mobile && pnpm type-check`
Expected: Only pre-existing `@gorhom/bottom-sheet` error

**Step 4: Final commit if any fixes needed**

```bash
git commit -m "fix: address build/test issues from feed implementation"
```
