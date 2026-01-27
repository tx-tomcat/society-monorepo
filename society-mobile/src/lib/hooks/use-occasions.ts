import { useQuery } from '@tanstack/react-query';
import * as Localization from 'expo-localization';

import type {
  Occasion,
  OccasionsResponse,
} from '../api/services/occasions.service';
import { occasionsService } from '../api/services/occasions.service';

/**
 * React Query hook to fetch contextual occasions
 * Automatically includes device timezone for accurate context detection
 */
export function useOccasions() {
  const timezone = Localization.timezone;

  return useQuery<OccasionsResponse>({
    queryKey: ['occasions', 'contextual', timezone],
    queryFn: () => occasionsService.getContextualOccasions(timezone),
    staleTime: 5 * 60 * 1000, // 5 minutes - background refresh
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });
}

/**
 * React Query hook to fetch all active occasions without filtering
 * Useful for forms where user needs to see all options
 */
export function useAllOccasions() {
  return useQuery<Occasion[]>({
    queryKey: ['occasions', 'all'],
    queryFn: () => occasionsService.getAllOccasions(),
    staleTime: 30 * 60 * 1000, // 30 minutes - rarely changes
    gcTime: 60 * 60 * 1000, // 1 hour cache
  });
}

/**
 * React Query hook to fetch a specific occasion by ID
 */
export function useOccasion(occasionId: string) {
  return useQuery<Occasion>({
    queryKey: ['occasions', occasionId],
    queryFn: () => occasionsService.getOccasionById(occasionId),
    enabled: !!occasionId,
    staleTime: 30 * 60 * 1000,
  });
}

// Re-export types for convenience
export type { Occasion, OccasionsResponse, OccasionContext, TimeSlot, DayType } from '../api/services/occasions.service';
