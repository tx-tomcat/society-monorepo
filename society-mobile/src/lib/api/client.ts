import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import axios from 'axios';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import i18n from 'i18next';
import { unpack } from 'msgpackr';

import { Env } from '@env';

import { showMessage } from 'react-native-flash-message';
import { setAuthState } from '../stores/auth';
import { clearUser } from '../stores/user';
import {
  REFRESH_TOKEN_KEY,
  TOKEN_KEY,
  ZALO_ACCESS_TOKEN_KEY,
} from './constants';

/**
 * API Client with automatic JWT token injection.
 * Fetches token from SecureStore and adds to Authorization header.
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: Env.API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        // Request MessagePack responses for smaller payloads and faster parsing
        Accept: 'application/msgpack, application/json',
      },
      // Handle binary MessagePack responses
      responseType: 'arraybuffer',
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token and language header
    this.client.interceptors.request.use(
      async (config) => {
        try {
          const token = await SecureStore.getItemAsync(TOKEN_KEY);
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.warn('Failed to get auth token:', error);
        }

        // Add Accept-Language header based on current i18n language
        const currentLanguage = i18n.language || 'en';
        config.headers['Accept-Language'] = currentLanguage;

        // Store request start time for response time calculation
        (config as { metadata?: { startTime: number } }).metadata = {
          startTime: Date.now(),
        };

        // Debug logging for API requests (development only)
        if (__DEV__) {
          console.log('[API Request]', {
            method: config.method?.toUpperCase(),
            url: `${config.baseURL}${config.url}`,
            params: config.params,
            hasAuth: !!config.headers.Authorization,
            language: currentLanguage,
          });
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle MessagePack decoding and errors
    this.client.interceptors.response.use(
      (response) => {
        const contentType = response.headers['content-type'] || '';
        let data = response.data;
        let format = 'unknown';

        // Decode MessagePack responses
        if (contentType.includes('application/msgpack') && data) {
          try {
            data = unpack(new Uint8Array(data));
            format = 'MessagePack';
          } catch (unpackError) {
            console.warn('Failed to unpack MessagePack response:', unpackError);
            // Fall through to try JSON parsing as fallback
            try {
              const text = new TextDecoder().decode(data);
              data = JSON.parse(text);
              format = 'JSON (fallback from MessagePack)';
            } catch {
              // Keep raw data if both fail
              console.warn('Failed to parse response as JSON fallback');
            }
          }
        }

        // Handle JSON responses (arraybuffer needs parsing)
        if (
          contentType.includes('application/json') &&
          data instanceof ArrayBuffer
        ) {
          try {
            const text = new TextDecoder().decode(data);
            data = JSON.parse(text);
            format = 'JSON';
          } catch {
            // Data might already be parsed
          }
        }

        if (__DEV__) {
          const startTime = (
            response.config as { metadata?: { startTime: number } }
          ).metadata?.startTime;
          const duration = startTime ? Date.now() - startTime : null;
          console.log('[API Response]', {
            status: response.status,
            url: response.config.url,
            format,
            duration: duration ? `${duration}ms` : 'N/A',
          });
        }
        return data;
      },
      async (error) => {
        // Decode error response data (may be MessagePack or JSON arraybuffer)
        let errorData = error.response?.data;
        if (errorData instanceof ArrayBuffer) {
          const contentType = error.response?.headers?.['content-type'] || '';
          try {
            if (contentType.includes('application/msgpack')) {
              errorData = unpack(new Uint8Array(errorData));
            } else {
              const text = new TextDecoder().decode(errorData);
              errorData = JSON.parse(text);
            }
          } catch {
            // Keep as-is if decoding fails
          }
        }

        // Enhanced error logging (development shows full details)
        if (__DEV__) {
          const startTime = (
            error.config as { metadata?: { startTime: number } }
          )?.metadata?.startTime;
          const duration = startTime ? Date.now() - startTime : null;
          console.error('[API Error]', {
            status: error.response?.status,
            url: error.config?.url,
            method: error.config?.method?.toUpperCase(),
            message: errorData?.message || error.message,
            data: errorData,
            duration: duration ? `${duration}ms` : 'N/A',
          });
        }

        if (error.response?.status === 401) {
          // Handle unauthorized - clear all auth data and redirect to login
          console.warn('Unauthorized request - logging out user');

          // Clear tokens from secure store
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
          await SecureStore.deleteItemAsync(ZALO_ACCESS_TOKEN_KEY);

          // Clear user data from store
          clearUser();

          // Set auth state to signed out
          setAuthState({ isLoaded: true, isSignedIn: false });

          // Navigate to welcome screen (layout will handle routing)
          // Using setTimeout to avoid navigation during render
          setTimeout(() => {
            router.replace('/welcome');
          }, 0);
        }

        // Transform error for better handling
        const customError = {
          message: errorData?.message || error.message,
          status: error.response?.status,
          data: errorData,
        };

        // Show toast for mutation errors (POST, PUT, PATCH, DELETE)
        const method = error.config?.method?.toLowerCase();
        const isMutation = ['post', 'put', 'patch', 'delete'].includes(
          method || ''
        );

        if (isMutation && error.response?.status !== 401) {
          const errorMessage = this.extractErrorMessage(errorData);
          console.log('error message', errorMessage);
          // Use setTimeout to push showMessage to next event loop tick
          // This prevents delay caused by async interceptor blocking UI updates
          setTimeout(() => {
            showMessage({
              message: errorMessage,
              type: 'danger',
              animated: false,
              autoHide: true,
              duration: 3000,
            });
          }, 0);
        }

        return Promise.reject(customError);
      }
    );
  }

  /**
   * GET request
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get(url, config);
  }

  /**
   * POST request
   */
  async post<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.client.post(url, data, config);
  }

  /**
   * PUT request
   */
  async put<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.client.put(url, data, config);
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete(url, config);
  }

  /**
   * PATCH request
   */
  async patch<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.client.patch(url, data, config);
  }

  /**
   * Extract a readable error message from API error response
   */
  private extractErrorMessage(data: unknown): string {
    if (typeof data === 'string') {
      return data;
    }
    if (Array.isArray(data)) {
      return data.map((item) => this.extractErrorMessage(item)).join(', ');
    }
    if (typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>;
      // Check for common error message fields
      if (typeof obj.message === 'string') {
        return obj.message;
      }
      if (Array.isArray(obj.message)) {
        return obj.message.join(', ');
      }
      if (typeof obj.error === 'string') {
        return obj.error;
      }
      // Recursively extract from nested objects
      const messages = Object.entries(obj)
        .filter(([key]) => key !== 'statusCode' && key !== 'status')
        .map(([, value]) => this.extractErrorMessage(value))
        .filter(Boolean);
      return messages.join(', ') || 'Something went wrong';
    }
    return 'Something went wrong';
  }
}

export const apiClient = new ApiClient();
