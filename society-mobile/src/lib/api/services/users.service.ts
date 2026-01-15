import { apiClient } from '../client';

export interface User {
  id: string;
  clerkId: string;
  email?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  profileImageUrl?: string;
  bio?: string;
  location?: string;
  interests?: string[];
  verified: boolean;
  role: 'user' | 'premium' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  interests?: string[];
}

/**
 * Users API Service
 * All methods require authentication via getToken
 */
export const usersService = {
  /**
   * Get current user profile
   */
  async getCurrentUser(getToken: () => Promise<string | null>): Promise<User> {
    return apiClient.get('/users/me', { getToken });
  },

  /**
   * Update user profile
   */
  async updateProfile(
    data: UpdateProfileData,
    getToken: () => Promise<string | null>
  ): Promise<User> {
    return apiClient.put('/users/profile', data, { getToken });
  },

  /**
   * Upload profile avatar
   */
  async uploadAvatar(
    file: FormData,
    getToken: () => Promise<string | null>
  ): Promise<{ url: string }> {
    return apiClient.post('/users/avatar', file, {
      getToken,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Delete user account
   */
  async deleteAccount(
    getToken: () => Promise<string | null>
  ): Promise<{ success: boolean }> {
    return apiClient.delete('/users/me', { getToken });
  },
};
