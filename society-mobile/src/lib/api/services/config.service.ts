import { apiClient } from '../client';

/**
 * Platform configuration from backend
 */
export interface PlatformConfig {
  /** Platform fee percentage (e.g., 0.18 for 18%) */
  platformFeePercent: number;
  /** Minimum booking duration in hours */
  minBookingHours: number;
  /** Maximum booking duration in hours */
  maxBookingHours: number;
  /** Minimum advance booking time in hours */
  minAdvanceBookingHours: number;
  /** Maximum advance booking days */
  maxAdvanceBookingDays: number;
  /** Cancellation fee percentage if cancelled within grace period */
  cancellationFeePercent: number;
  /** Free cancellation window in hours before booking start */
  freeCancellationHours: number;
  /** Support email address */
  supportEmail?: string;
  /** Support phone number */
  supportPhone?: string;
  /** Minimum app version required */
  minAppVersion?: string;
  /** Current app version */
  currentAppVersion?: string;
}

/**
 * Platform Config API Service
 */
export const configService = {
  /**
   * Get platform configuration
   * This is a public endpoint - no authentication required
   */
  async getPlatformConfig(): Promise<PlatformConfig> {
    return apiClient.get('/config/platform');
  },
};
