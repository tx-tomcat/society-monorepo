import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  SubmitVerificationData
} from '../api/services/auth.service';
import { authService } from '../api/services/auth.service';
import { zaloAuthService, type ZaloAuthResponse } from '../api/services/zalo.service';
import { setAuthState } from '../stores/auth';
import { clearUser } from '../stores/user';
import { useAuth } from './use-auth';

/**
 * React Query mutation hook to login with Zalo
 */
export function useZaloLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (): Promise<ZaloAuthResponse> => zaloAuthService.login(),
    onSuccess: () => {
      // Clear any cached queries on successful auth
      queryClient.clear();
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => zaloAuthService.logout(),
    onSuccess: () => {
      // Clear user data from local store
      clearUser();
      // Update auth state so navigation guard detects logout
      setAuthState({ isLoaded: true, isSignedIn: false });
      queryClient.clear();
    },
  });
}

/**
 * React Query hook to fetch verification status
 */
export function useVerificationStatus() {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['verification-status'],
    queryFn: () => authService.getVerificationStatus(),
    enabled: isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * React Query mutation hook to submit identity verification
 */
export function useSubmitVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubmitVerificationData) =>
      authService.submitVerification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-status'] });
    },
  });
}

/**
 * React Query mutation hook to set user role
 */
export function useSetUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (role: 'hirer' | 'companion') =>
      authService.setUserRole(role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
}
