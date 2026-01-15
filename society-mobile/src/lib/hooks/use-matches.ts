import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { SwipeData } from '../api/services/matches.service';
import { matchesService } from '../api/services/matches.service';

/**
 * React Query hook to fetch matches
 */
export function useMatches() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['matches'],
    queryFn: () => matchesService.getMatches(getToken),
    enabled: isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * React Query mutation hook for swiping
 */
export function useSwipe() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SwipeData) => matchesService.swipe(data, getToken),
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
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['match', matchId],
    queryFn: () => matchesService.getMatch(matchId, getToken),
    enabled: isSignedIn && !!matchId,
    staleTime: 5 * 60 * 1000,
  });
}
