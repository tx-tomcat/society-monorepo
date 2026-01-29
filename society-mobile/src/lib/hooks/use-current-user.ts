import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { UpdateProfileData } from '../api/services/users.service';
import { usersService } from '../api/services/users.service';
import { setUser, useUserStore } from '../stores/user';

/**
 * Hook to access current user data from local storage.
 * User data is persisted in MMKV and loaded on app start.
 */
export function useCurrentUser() {
  const user = useUserStore.use.user();
  const isLoaded = useUserStore.use.isLoaded();

  return {
    data: user,
    isLoading: !isLoaded,
    isLoaded,
    isError: false, // Local storage read never errors
  };
}

/**
 * Hook to fetch and sync user data from the API to local storage.
 * Call this after login or when you need to refresh user data.
 */
export function useSyncUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const userData = await usersService.getCurrentUser();
      setUser(userData);
      return userData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

/**
 * React Query mutation hook to update user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const result = await usersService.updateProfile(data);
      // Sync updated user to store directly from API response
      setUser(result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

/**
 * React Query mutation hook to upload avatar
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: FormData) => {
      const result = await usersService.uploadAvatar(file);
      // Sync updated user to store
      const updatedUser = await usersService.getCurrentUser();
      setUser(updatedUser);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

/**
 * React Query mutation hook to delete user account
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => usersService.deleteAccount(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
