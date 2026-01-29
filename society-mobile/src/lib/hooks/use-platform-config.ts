import { useQuery } from '@tanstack/react-query';
import { create } from 'zustand';

import type { PlatformConfig } from '../api/services/config.service';
import { configService } from '../api/services/config.service';

/**
 * Default platform config values (fallback if API fails)
 */
const DEFAULT_CONFIG: PlatformConfig = {
  platformFeePercent: 0.18,
  minBookingHours: 1,
  maxBookingHours: 12,
  minAdvanceBookingHours: 2,
  maxAdvanceBookingDays: 30,
  cancellationFeePercent: 0.5,
  freeCancellationHours: 24,
  supportEmail: 'support@luxe.vn',
  supportPhone: '+84 28 1234 5678',
  minAppVersion: '1.0.0',
  currentAppVersion: '1.0.0',
};

/**
 * Zustand store for synchronous access to platform config
 */
interface PlatformConfigStore {
  config: PlatformConfig;
  isLoaded: boolean;
  setConfig: (config: PlatformConfig) => void;
}

export const usePlatformConfigStore = create<PlatformConfigStore>((set) => ({
  config: DEFAULT_CONFIG,
  isLoaded: false,
  setConfig: (config) => set({ config, isLoaded: true }),
}));

/**
 * Hook to fetch platform config from API
 * Fetches once on app startup and caches for 1 hour
 * Also updates Zustand store for synchronous access
 */
export function usePlatformConfig() {
  const setConfig = usePlatformConfigStore((state) => state.setConfig);

  return useQuery({
    queryKey: ['platform-config'],
    queryFn: async () => {
      const config = await configService.getPlatformConfig();
      // Update Zustand store for synchronous access
      setConfig(config);
      return config;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours cache
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    // Use default config as placeholder while loading
    placeholderData: DEFAULT_CONFIG,
  });
}

/**
 * Get platform config synchronously from Zustand store
 * Use this when you need the config value outside of React components
 * or when you need synchronous access
 */
export function getPlatformConfig(): PlatformConfig {
  return usePlatformConfigStore.getState().config;
}

/**
 * Helper to calculate service fee based on platform config
 */
export function calculateServiceFee(subtotal: number): number {
  const { platformFeePercent } = getPlatformConfig();
  return Math.round(subtotal * platformFeePercent);
}

/**
 * Fetch platform config at app startup (fire and forget)
 * Called from _layout.tsx to preload config before user navigates to payment
 */
export async function fetchPlatformConfig(): Promise<void> {
  try {
    const config = await configService.getPlatformConfig();
    usePlatformConfigStore.getState().setConfig(config);
    if (__DEV__) {
      console.log('[PlatformConfig] Loaded:', {
        platformFeePercent: `${(config.platformFeePercent * 100).toFixed(0)}%`,
        minBookingHours: config.minBookingHours,
        maxBookingHours: config.maxBookingHours,
      });
    }
  } catch (error) {
    // Silent fail - default config is already set
    console.warn('[PlatformConfig] Failed to fetch, using defaults:', error);
  }
}
