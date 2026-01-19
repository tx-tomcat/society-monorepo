import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  CompanionAvailability,
  CompanionFilters,
  CompanionService,
  UpdateCompanionProfileData,
} from '../api/services/companions.service';
import { companionsService } from '../api/services/companions.service';
import { useAuth } from './use-auth';

/**
 * React Query hook to fetch companions list
 */
export function useCompanions(filters?: CompanionFilters) {
  return useQuery({
    queryKey: ['companions', filters],
    queryFn: () => companionsService.getCompanions(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * React Query hook to fetch featured companions (uses verified filter)
 */
export function useFeaturedCompanions() {
  return useQuery({
    queryKey: ['companions', 'featured'],
    queryFn: () =>
      companionsService.getCompanions(
        { verified: true, sort: 'rating', limit: 10 }
      ),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * React Query hook to fetch single companion profile
 */
export function useCompanion(companionId: string) {
  return useQuery({
    queryKey: ['companion', companionId],
    queryFn: () => companionsService.getCompanion(companionId),
    enabled: !!companionId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * React Query hook to fetch companion availability
 */
export function useCompanionAvailability(companionId: string, date?: string) {
  return useQuery({
    queryKey: ['companion', companionId, 'availability', date],
    queryFn: () =>
      companionsService.getCompanionAvailability(companionId, date),
    enabled: !!companionId,
    staleTime: 2 * 60 * 1000, // 2 minutes - availability changes frequently
  });
}

/**
 * React Query hook to fetch companion reviews
 */
export function useCompanionReviews(companionId: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: ['companion', companionId, 'reviews', { page, limit }],
    queryFn: () =>
      companionsService.getCompanionReviews(companionId, page, limit),
    enabled: !!companionId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * React Query hook to fetch current companion's own profile (for companion users)
 */
export function useMyCompanionProfile() {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['companion', 'me'],
    queryFn: () => companionsService.getMyProfile(),
    enabled: isSignedIn,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * React Query mutation hook to update companion profile
 */
export function useUpdateCompanionProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCompanionProfileData) =>
      companionsService.updateMyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companion', 'me'] });
    },
  });
}

/**
 * React Query mutation hook to update companion availability
 */
export function useUpdateCompanionAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (availability: CompanionAvailability[]) =>
      companionsService.updateAvailability(availability),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companion', 'me'] });
    },
  });
}

/**
 * React Query mutation hook to update companion services
 */
export function useUpdateCompanionServices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (services: CompanionService[]) =>
      companionsService.updateServices(services),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companion', 'me'] });
    },
  });
}

/**
 * React Query hook to search companions (uses filters)
 */
export function useSearchCompanions(query: string, filters?: CompanionFilters) {
  return useQuery({
    queryKey: ['companions', 'search', query, filters],
    queryFn: () => companionsService.getCompanions(filters),
    enabled: query.length > 0 || !!filters,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * React Query hook to fetch boost pricing
 */
export function useBoostPricing() {
  return useQuery({
    queryKey: ['companions', 'boost', 'pricing'],
    queryFn: () => companionsService.getBoostPricing(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * React Query hook to fetch active boost
 */
export function useActiveBoost() {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['companions', 'me', 'boost'],
    queryFn: () => companionsService.getActiveBoost(),
    enabled: isSignedIn,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * React Query mutation hook to purchase a boost
 */
export function usePurchaseBoost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (durationHours: number) =>
      companionsService.purchaseBoost(durationHours),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['companions', 'me', 'boost'],
      });
    },
  });
}

/**
 * React Query mutation hook to add a photo
 */
export function useAddCompanionPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: FormData) => companionsService.addPhoto(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companion', 'me'] });
    },
  });
}

/**
 * React Query mutation hook to remove a photo
 */
export function useRemoveCompanionPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoId: string) =>
      companionsService.removePhoto(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companion', 'me'] });
    },
  });
}
