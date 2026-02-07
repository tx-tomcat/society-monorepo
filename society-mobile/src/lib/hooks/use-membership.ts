import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { MembershipTier } from '../api/services/membership.service';
import { membershipService } from '../api/services/membership.service';

/**
 * React Query hook to fetch membership tier pricing
 */
export function useMembershipPricing() {
  return useQuery({
    queryKey: ['membership', 'pricing'],
    queryFn: () => membershipService.getPricing(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * React Query hook to fetch user's active membership and history
 */
export function useActiveMembership() {
  return useQuery({
    queryKey: ['membership', 'me'],
    queryFn: () => membershipService.getMe(),
  });
}

/**
 * React Query hook to fetch user's current membership benefits
 */
export function useMembershipBenefits() {
  return useQuery({
    queryKey: ['membership', 'benefits'],
    queryFn: () => membershipService.getBenefits(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * React Query mutation hook to purchase a membership tier
 */
export function usePurchaseMembership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tier: MembershipTier) => membershipService.purchase(tier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership'] });
    },
  });
}
