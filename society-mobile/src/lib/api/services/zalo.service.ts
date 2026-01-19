import * as SecureStore from 'expo-secure-store';
import {
  getUserProfile as zaloGetUserProfile,
  isAuthenticated as zaloIsAuthenticated,
  login as zaloLogin,
  logout as zaloLogout,
} from 'react-native-zalo-kit';

import { apiClient } from '../client';
import {
  REFRESH_TOKEN_KEY,
  TOKEN_KEY,
  ZALO_ACCESS_TOKEN_KEY,
} from '../constants';

// Zalo SDK auth type constants
const AUTH_VIA_APP_OR_WEB = 'AUTH_VIA_APP_OR_WEB';

/**
 * Zalo user profile from SDK
 */
export interface ZaloUserProfile {
  id: string;
  name: string;
  picture?: {
    data?: {
      url?: string;
    };
  };
  birthday?: string;
  gender?: string;
  phone?: string;
}

/**
 * Auth response from backend after Zalo token exchange
 */
export interface ZaloAuthResponse {
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    fullName: string;
    avatarUrl: string | null;
    role: 'HIRER' | 'COMPANION' | 'ADMIN' | null;
    status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';
    isVerified: boolean;
    trustScore: number;
  };
  token: string;
  refreshToken: string;
  isNewUser: boolean;
  /** Whether user has completed their profile (companion or hirer profile exists) */
  hasProfile: boolean;
}

/**
 * Stored auth state
 */
export interface StoredAuthState {
  token: string;
  refreshToken: string;
}

/**
 * Zalo Authentication Service
 * Handles login via Zalo SDK and token exchange with backend
 */
export const zaloAuthService = {
  /**
   * Login with Zalo
   * Opens Zalo app or web browser for authentication
   */
  async login(): Promise<ZaloAuthResponse> {
    // Login via Zalo SDK - prefers app, falls back to web
    const zaloResult = await zaloLogin(AUTH_VIA_APP_OR_WEB);

    if (!zaloResult.accessToken) {
      throw new Error('Zalo login failed - no access token received');
    }

    // Store Zalo access token temporarily
    await SecureStore.setItemAsync(ZALO_ACCESS_TOKEN_KEY, zaloResult.accessToken);

    // Exchange Zalo token with backend for Hireme JWT
    const authResponse = await apiClient.post<ZaloAuthResponse>('/auth/zalo', {
      accessToken: zaloResult.accessToken,
      refreshToken: zaloResult.refreshToken,
    });

    console.log('Zalo auth response:', authResponse);

    // Store Hireme tokens
    await this.storeTokens(authResponse.token, authResponse.refreshToken);

    return authResponse;
  },

  /**
   * Logout - clear all tokens and Zalo session
   */
  async logout(): Promise<void> {
    try {
      // Logout from Zalo
      await zaloLogout();
    } catch (error) {
      // Continue even if Zalo logout fails
      console.warn('Zalo logout failed:', error);
    }

    // Clear stored tokens
    await this.clearTokens();
  },

  /**
   * Check if user is authenticated (has valid stored token)
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  },

  /**
   * Check if Zalo session is still valid
   */
  async isZaloAuthenticated(): Promise<boolean> {
    try {
      return await zaloIsAuthenticated();
    } catch {
      return false;
    }
  },

  /**
   * Get Zalo user profile (requires active Zalo session)
   */
  async getZaloUserProfile(): Promise<ZaloUserProfile | null> {
    try {
      const profile = await zaloGetUserProfile();
      return profile as ZaloUserProfile;
    } catch {
      return null;
    }
  },

  /**
   * Get stored Hireme auth token
   */
  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  /**
   * Get stored refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  /**
   * Store auth tokens securely
   */
  async storeTokens(token: string, refreshToken: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  },

  /**
   * Clear all stored tokens (including legacy keys from rebrand)
   */
  async clearTokens(): Promise<void> {
    // Clear current keys
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(ZALO_ACCESS_TOKEN_KEY);
  },


  /**
   * Refresh the auth token using refresh token
   */
  async refreshAuthToken(): Promise<string | null> {
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) {
      console.warn('[ZaloAuth] No refresh token available');
      return null;
    }

    try {
      const response = await apiClient.post<{ token: string; refreshToken: string }>(
        '/auth/refresh',
        { refreshToken }
      );

      await this.storeTokens(response.token, response.refreshToken);
      return response.token;
    } catch (error) {
      console.error('[ZaloAuth] Token refresh failed:', error);
      // Refresh failed - clear tokens and require re-login
      await this.clearTokens();
      return null;
    }
  },
};
