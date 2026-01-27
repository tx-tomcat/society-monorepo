import { apiClient } from '../client';
import type { UserProfileResponse } from '../types';

export type { UserProfileResponse };

export interface UpdateProfileData {
  fullName?: string;
  avatarUrl?: string;
  gender?: string;
  dateOfBirth?: string;
  province?: string;
  district?: string;
}

/**
 * Users API Service
 * Auth token is automatically injected by apiClient
 */
export const usersService = {
  /**
   * Get current user profile
   * Uses /users/profile which returns comprehensive profile data including role
   */
  async getCurrentUser(): Promise<UserProfileResponse> {
    return apiClient.get('/users/profile');
  },

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<UserProfileResponse> {
    return apiClient.put('/users/profile', data);
  },

  /**
   * Upload profile avatar
   */
  async uploadAvatar(file: FormData): Promise<{ url: string }> {
    return apiClient.post('/users/avatar', file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<{ success: boolean }> {
    return apiClient.delete('/users/me');
  },
};
