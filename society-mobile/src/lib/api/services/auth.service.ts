import { apiClient } from '../client';
import type { UserRole, UserStatus } from '../types';

export type { UserRole, UserStatus };

export interface RegisterData {
  email: string;
  fullName: string;
  role: UserRole;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    role: UserRole | null;
    status?: UserStatus;
    isVerified: boolean;
    isActive: boolean;
    trustScore: number;
    createdAt: string;
  };
  token: string;
  refreshToken: string;
  isNewUser: boolean;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

export interface VerificationStatusResponse {
  status: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  submittedAt?: string;
  verifiedAt?: string;
}

export interface SubmitVerificationData {
  idType: 'vneid' | 'cccd' | 'passport';
  idNumber: string;
  idFrontImage: string;
  idBackImage?: string;
  selfieImage: string;
}

/**
 * Auth API Service
 * Handles authentication flows via Zalo + backend JWT
 */
export const authService = {
  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    return apiClient.post('/auth/register', data);
  },

  /**
   * Refresh auth token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    return apiClient.post('/auth/refresh', { refreshToken });
  },

  /**
   * Get verification status
   */
  async getVerificationStatus(): Promise<VerificationStatusResponse> {
    return apiClient.get('/auth/verification-status');
  },

  /**
   * Submit identity verification documents
   */
  async submitVerification(
    data: SubmitVerificationData
  ): Promise<{ success: boolean; status: string }> {
    return apiClient.post('/auth/verify-identity', data);
  },

  /**
   * Set user role after initial registration
   */
  async setUserRole(
    role: 'hirer' | 'companion'
  ): Promise<{ success: boolean; role: UserRole }> {
    return apiClient.post('/auth/set-role', { role });
  },
};
