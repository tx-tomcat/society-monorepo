import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { favoritesService } from '../api/services/favorites.service';
import { useAuth } from './use-auth';
import { useTrackInteraction } from './use-recommendations';

/**
 * React Query hook to fetch user's favorite companions
 */
export function useFavorites(page = 1, limit = 20) {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['favorites', page, limit],
    queryFn: () => favoritesService.getFavorites(page, limit),
    enabled: isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * React Query hook to check if a companion is favorited
 */
export function useIsFavorite(companionId: string) {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['favorites', 'check', companionId],
    queryFn: () => favoritesService.checkFavoriteStatus(companionId),
    enabled: isSignedIn && !!companionId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * React Query mutation hook to add a companion to favorites
 * Also tracks BOOKMARK interaction for recommendations
 */
export function useAddFavorite() {
  const queryClient = useQueryClient();
  const trackInteraction = useTrackInteraction();

  return useMutation({
    mutationFn: (companionId: string) =>
      favoritesService.addFavorite(companionId),
    onSuccess: (_, companionId) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.setQueryData(['favorites', 'check', companionId], {
        isFavorite: true,
      });
      // Track BOOKMARK interaction (fire-and-forget via mutation)
      trackInteraction.mutate({ companionId, eventType: 'BOOKMARK' });
    },
  });
}

/**
 * React Query mutation hook to remove a companion from favorites
 * Also tracks UNBOOKMARK interaction for recommendations
 */
export function useRemoveFavorite() {
  const queryClient = useQueryClient();
  const trackInteraction = useTrackInteraction();

  return useMutation({
    mutationFn: (companionId: string) =>
      favoritesService.removeFavorite(companionId),
    onSuccess: (_, companionId) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.setQueryData(['favorites', 'check', companionId], {
        isFavorite: false,
      });
      // Track UNBOOKMARK interaction (fire-and-forget via mutation)
      trackInteraction.mutate({ companionId, eventType: 'UNBOOKMARK' });
    },
  });
}

/**
 * React Query mutation hook to toggle favorite status
 * Also tracks BOOKMARK/UNBOOKMARK interaction based on result
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const trackInteraction = useTrackInteraction();

  return useMutation({
    mutationFn: (companionId: string) =>
      favoritesService.toggleFavorite(companionId),
    onSuccess: (result, companionId) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.setQueryData(['favorites', 'check', companionId], {
        isFavorite: result.isFavorite,
      });
      // Track BOOKMARK or UNBOOKMARK based on new state (fire-and-forget)
      const eventType = result.isFavorite ? 'BOOKMARK' : 'UNBOOKMARK';
      trackInteraction.mutate({ companionId, eventType });
    },
  });
}
