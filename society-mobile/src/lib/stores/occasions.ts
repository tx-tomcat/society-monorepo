import { create } from 'zustand';

import type { Occasion } from '../api/services/occasions.service';
import { occasionsService } from '../api/services/occasions.service';
import { createSelectors } from '../utils';

export interface OccasionsState {
  occasions: Occasion[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;

  // Actions
  fetchOccasions: (force?: boolean) => Promise<void>;
}

const _useOccasionsStore = create<OccasionsState>()((set, get) => ({
  occasions: [],
  isLoading: false,
  isLoaded: false,
  error: null,

  fetchOccasions: async (force = false) => {
    // Skip if already loading
    if (get().isLoading) return;
    // Skip if already loaded and not forcing refresh
    if (get().isLoaded && !force) return;

    set({ isLoading: true, error: null });
    try {
      const occasions = await occasionsService.getAllOccasions();
      set({ occasions, isLoaded: true, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to fetch occasions',
        isLoading: false,
      });
    }
  },
}));

export const useOccasionsStore = createSelectors(_useOccasionsStore);

// Export direct access functions for use outside React components
export const fetchOccasions = (force?: boolean) =>
  _useOccasionsStore.getState().fetchOccasions(force);
export const getOccasions = () => _useOccasionsStore.getState().occasions;

/**
 * Get occasion name from code or id
 */
export function getOccasionName(codeOrId: string): string {
  const occasions = _useOccasionsStore.getState().occasions;
  const occasion = occasions.find(
    (o) => o.code === codeOrId || o.id === codeOrId
  );
  return occasion?.name || codeOrId;
}

/**
 * Get occasion by code or id
 */
export function getOccasionByCode(codeOrId: string): Occasion | undefined {
  const occasions = _useOccasionsStore.getState().occasions;
  return occasions.find((o) => o.code === codeOrId || o.id === codeOrId);
}
