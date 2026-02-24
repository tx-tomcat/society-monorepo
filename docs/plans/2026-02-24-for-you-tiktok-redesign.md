# For You Feed Redesign: TikTok-Style Vertical Pager

**Date:** 2026-02-24
**Status:** Approved
**Approach:** A — Full rewrite of For You tab + algorithm enhancements

## Overview

Redesign the For You feed from a scrollable card list into a full-screen, one-companion-at-a-time vertical pager inspired by TikTok. Photos auto-advance like Instagram Stories to create temporal engagement on static images. Backend algorithm gains richer behavioral signals, explore/exploit balancing, and session-aware deduplication.

## 1. Mobile UI — Full-Screen Vertical Pager

### Screen Layout

```
+----------------------------+
| [==------ ] progress bars  |  <- Stories-style per-photo
|                            |
|  [Online] [Verified]       |  <- Reuse Badge component
|                            |
|                            |
|     FULL BLEED PHOTO       |  <- Auto-crossfade 3.5s
|     9:16 ratio             |     Tap L/R to manual browse
|                            |     Tap center to pause
|                            |
|                            |  +----+
|                            |  | <3 |  <- 44x44 actions
|  +-- gradient overlay --+  |  +----+     Right-side stack
|  | <3 Matches your       |  |  | [] |
|  |    preferences        |  |  +----+
|  |                       |  |  | cal|
|  | Minh Anh, 22  check   |  |  +----+
|  | star 4.8 (23)  Vi,En  |  |
|  |                       |  |
|  | [Coffee] [Dining]     |  |
|  |                       |  |
|  | 650,000d /hr           |  |
|  +-----------------------+  |
|         ^ Swipe up          |
+----------------------------+
```

### Component Reuse

| Component | Status | Notes |
|-----------|--------|-------|
| `PhotoIndicator` | Evolve | Dots -> animated progress bars (Stories-style) |
| `Badge` (Online/Verified) | Reuse as-is | From `swipeable-companion-card.tsx` |
| `LinearGradient` overlay | Reuse | Same gradient with same locations |
| Info overlay (name, rating, services, price) | Extract & reuse | Lift from `CompanionCard` |
| Action buttons | New | Right-side vertical stack, 44x44px, glass bg |
| Vertical pager | New | `react-native-pager-view` |
| Photo auto-advance | New | 3.5s crossfade + progress bar animation |
| Preloader | New | Prefetch next 2 companions' primary photos |

### Photo Auto-Advance

- Crossfade photos every 3.5 seconds (`Animated.timing`, 600ms fade)
- Progress bars animate linearly at top (Stories-style)
- Tap center: pause/resume (generates `DWELL_PAUSE` signal)
- Tap left/right: manual photo browse (generates `PHOTO_BROWSE` signal)
- Loops back to first photo after last
- Respects `prefers-reduced-motion`: disable auto-advance, show static

### UX Rules

- 44x44px minimum touch targets on all action buttons
- 8px minimum gap between adjacent touch targets
- Skeleton shimmer placeholder while first companion loads
- Vertical swipe = primary gesture (no system gesture conflicts)
- Photo navigation uses tap zones (not horizontal swipe)

## 2. Backend Algorithm

### New Interaction Event Types

| Event | Weight | Trigger |
|-------|--------|---------|
| `SKIP` | -0.2 | Swiped to next in < 2 seconds |
| `DWELL_VIEW` | 0.2-0.5 | Stayed 2-10s (scaled linearly by duration) |
| `DWELL_PAUSE` | 0.4 | Tapped to pause auto-advance |
| `PHOTO_BROWSE` | 0.3 | Manually tapped through 2+ photos |
| `REVISIT` | 0.6 | Swiped back to previous companion |
| `NOT_INTERESTED` | -0.8 | Long-press "Not interested" |
| `SHARE` | 0.5 | Shared companion profile |

Existing events (VIEW, PROFILE_OPEN, BOOKMARK, etc.) remain unchanged.

### Scoring Weight Changes

```
Current:  preference=0.35  quality=0.20  availability=0.15  popularity=0.15  behavioral=0.15
New:      preference=0.25  quality=0.20  availability=0.10  popularity=0.15  behavioral=0.30
```

### New Scoring Features

**Freshness penalty:** Companions seen by this user in last 24h get 0.8x multiplier.

**Diversity injection:** Post-scoring reorder to avoid 3+ consecutive companions of same gender or price tier.

**Explore/exploit split** per batch of 20:
- 14 (70%): highest-scored (exploit)
- 4 (20%): random unseen (explore)
- 2 (10%): boosted/featured (monetization)
- Interleaved at positions 4, 8, 12, 16

### New Endpoint

```
GET /recommendations/feed?limit=10&sessionId=xxx&excludeIds=id1,id2
```

Returns same `ScoredCompanion[]` shape. Existing `/recommendations` endpoint kept for dashboard teaser.

## 3. Data Flow

### Batched Signal Tracking

Mobile queues events locally, flushes every 5 seconds or on app background:

```
POST /recommendations/interactions/batch
{
  sessionId: "xxx",
  events: [
    { companionId, eventType: "SKIP", dwellTimeMs: 800 },
    { companionId, eventType: "DWELL_VIEW", dwellTimeMs: 5200 },
    { companionId, eventType: "PHOTO_BROWSE" }
  ]
}
```

Reduces network calls from ~1 per swipe to ~1 per 5 seconds.

### Photo Preloading Strategy

| Position | What's loaded |
|----------|---------------|
| N (current) | All photos, auto-advance running |
| N+1 | Primary + first 2 photos via `Image.prefetch()` |
| N+2 | Primary photo only |
| N-1 | Kept in memory for instant swipe-back |
| Beyond | Unloaded |

Fetch next API page when user reaches position `total - 3`.

### Session Management

Client-side only. No server state:
- `sessionId` = new UUID on app open or pull-to-refresh
- `seenIds` = Set of companion IDs shown this session
- Passed as `excludeIds` query param to feed endpoint
- Pull-to-refresh resets both

## 4. File Changes

### Mobile (society-mobile/)

| File | Action |
|------|--------|
| `src/app/(app)/for-you.tsx` | Rewrite — PagerView-based feed |
| `src/components/feed/feed-card.tsx` | New — full-screen card (extracts from CompanionCard) |
| `src/components/feed/photo-progress-bar.tsx` | New — Stories-style animated bars |
| `src/components/feed/feed-action-buttons.tsx` | New — right-side action stack |
| `src/components/feed/use-photo-auto-advance.ts` | New — timer hook with pause/resume |
| `src/components/feed/use-interaction-tracker.ts` | New — event queue + batch flush |
| `src/lib/api/services/recommendations.service.ts` | Extend — add `getFeed()` + batch endpoint |
| `src/lib/hooks/use-recommendations.ts` | Extend — add `useFeedRecommendations` |
| `src/components/swipeable-companion-card.tsx` | Keep — still used by dashboard teaser |

### Backend (society-backend/)

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Extend — new event types in enum |
| `src/modules/recommendations/dto/track-interaction.dto.ts` | Extend — new enums + BatchDto |
| `src/modules/recommendations/controllers/recommendations.controller.ts` | Extend — `GET /feed` + `POST /interactions/batch` |
| `src/modules/recommendations/services/recommendations.service.ts` | Extend — `getFeed()` with explore/exploit, dedup, diversity |
| `src/modules/recommendations/services/scoring.service.ts` | Extend — new weights, freshness, new event weights |

### New Package

```bash
npx expo install react-native-pager-view
```

Provides native `ViewPager` (Android) / `UIPageViewController` (iOS) for buttery vertical paging.

### Untouched

- Dashboard (`index.tsx`) — keeps existing teaser
- Browse tab — untouched
- Companion detail page — untouched
- Favorites — untouched
- All existing API hooks — untouched
