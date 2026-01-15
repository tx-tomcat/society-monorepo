import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import axios from 'axios';
import Constants from 'expo-constants';

/**
 * API Client with Clerk Authentication Integration
 *
 * This client automatically injects Clerk JWT tokens into requests.
 * Token injection happens at request time via a function parameter.
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    const apiUrl =
      Constants.expoConfig?.extra?.apiUrl ||
      process.env.EXPO_PUBLIC_API_URL ||
      'http://localhost:3000/api';

    this.client = axios.create({
      baseURL: apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Response interceptor - Handle errors globally
    this.client.interceptors.response.use(
      (response) => response.data,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - Clerk will handle re-auth automatically
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
  async get<T>(
    url: string,
    config?: AxiosRequestConfig & { getToken?: () => Promise<string | null> }
  ): Promise<T> {
    const token = config?.getToken ? await config.getToken() : null;
    const headers = token
      ? { ...config?.headers, Authorization: `Bearer ${token}` }
      : config?.headers;

    return this.client.get(url, { ...config, headers });
  }

  /**
   * POST request
   */
  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & { getToken?: () => Promise<string | null> }
  ): Promise<T> {
    const token = config?.getToken ? await config.getToken() : null;
    const headers = token
      ? { ...config?.headers, Authorization: `Bearer ${token}` }
      : config?.headers;

    return this.client.post(url, data, { ...config, headers });
  }

  /**
   * PUT request
   */
  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & { getToken?: () => Promise<string | null> }
  ): Promise<T> {
    const token = config?.getToken ? await config.getToken() : null;
    const headers = token
      ? { ...config?.headers, Authorization: `Bearer ${token}` }
      : config?.headers;

    return this.client.put(url, data, { ...config, headers });
  }

  /**
   * DELETE request
   */
  async delete<T>(
    url: string,
    config?: AxiosRequestConfig & { getToken?: () => Promise<string | null> }
  ): Promise<T> {
    const token = config?.getToken ? await config.getToken() : null;
    const headers = token
      ? { ...config?.headers, Authorization: `Bearer ${token}` }
      : config?.headers;

    return this.client.delete(url, { ...config, headers });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & { getToken?: () => Promise<string | null> }
  ): Promise<T> {
    const token = config?.getToken ? await config.getToken() : null;
    const headers = token
      ? { ...config?.headers, Authorization: `Bearer ${token}` }
      : config?.headers;

    return this.client.patch(url, data, { ...config, headers });
  }
}

export const apiClient = new ApiClient();
