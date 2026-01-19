import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { SwipeData } from '../api/services/matches.service';
import { matchesService } from '../api/services/matches.service';
import { useAuth } from './use-auth';

/**
 * React Query hook to fetch matches
 */
export function useMatches() {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['matches'],
    queryFn: () => matchesService.getMatches(),
    enabled: isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * React Query mutation hook for swiping
 */
export function useSwipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SwipeData) => matchesService.swipe(data),
    onSuccess: () => {
      // Invalidate matches query to refetch
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

/**
 * React Query hook to fetch single match
 */
export function useMatch(matchId: string) {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['match', matchId],
    queryFn: () => matchesService.getMatch(matchId),
    enabled: isSignedIn && !!matchId,
    staleTime: 5 * 60 * 1000,
  });
}
