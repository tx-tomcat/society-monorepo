import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { unpack } from 'msgpackr';

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
        // Request MessagePack responses for smaller payloads and faster parsing
        Accept: 'application/msgpack, application/json',
      },
      // Handle binary MessagePack responses
      responseType: 'arraybuffer',
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

        // Debug logging for API requests (development only)
        if (__DEV__) {
          console.log('[API Request]', {
            method: config.method?.toUpperCase(),
            url: `${config.baseURL}${config.url}`,
            params: config.params,
            hasAuth: !!config.headers.Authorization,
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
          console.log('[API Response]', {
            status: response.status,
            url: response.config.url,
            format,
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
          console.error('[API Error]', {
            status: error.response?.status,
            url: error.config?.url,
            method: error.config?.method?.toUpperCase(),
            message: errorData?.message || error.message,
            data: errorData,
          });
        }

        if (error.response?.status === 401) {
          // Handle unauthorized - user may need to re-authenticate
          console.warn(
            'Unauthorized request - user may need to re-authenticate'
          );
        }

        // Transform error for better handling
        const customError = {
          message: errorData?.message || error.message,
          status: error.response?.status,
          data: errorData,
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
