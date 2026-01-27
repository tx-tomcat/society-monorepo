import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import type {
  RecommendationsResponse,
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
    queryFn: async ({ pageParam = 0 }) => {
      if (__DEV__) {
        console.log('[useRecommendations] Fetching with params:', {
          limit: PAGE_SIZE,
          offset: pageParam,
        });
      }
      try {
        const result = await recommendationsService.getForYou({
          limit: PAGE_SIZE,
          offset: pageParam as number,
        });
        if (__DEV__) {
          console.log('[useRecommendations] Success:', {
            count: result.companions?.length,
            hasMore: result.hasMore,
            strategy: result.strategy,
          });
        }
        return result;
      } catch (error) {
        if (__DEV__) {
          console.error('[useRecommendations] Error:', error);
        }
        throw error;
      }
    },
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
