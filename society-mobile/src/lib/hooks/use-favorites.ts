import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { favoritesService } from '../api/services/favorites.service';
import { useAuth } from './use-auth';

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
 */
export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (companionId: string) =>
      favoritesService.addFavorite(companionId),
    onSuccess: (_, companionId) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.setQueryData(['favorites', 'check', companionId], {
        isFavorite: true,
      });
    },
  });
}

/**
 * React Query mutation hook to remove a companion from favorites
 */
export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (companionId: string) =>
      favoritesService.removeFavorite(companionId),
    onSuccess: (_, companionId) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.setQueryData(['favorites', 'check', companionId], {
        isFavorite: false,
      });
    },
  });
}

/**
 * React Query mutation hook to toggle favorite status
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (companionId: string) =>
      favoritesService.toggleFavorite(companionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}
