import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { Env } from '@env';

import { TOKEN_KEY } from './constants';

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
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token
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
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle errors globally
    this.client.interceptors.response.use(
      (response) => response.data,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - user may need to re-authenticate
          console.warn(
            'Unauthorized request - user may need to re-authenticate'
          );
        }

        // Transform error for better handling
        const customError = {
          message: error.response?.data?.message || error.message,
          status: error.response?.status,
          data: error.response?.data,
        };

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
}

export const apiClient = new ApiClient();
