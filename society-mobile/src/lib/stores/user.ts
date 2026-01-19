import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { UserProfileResponse } from '../api/types/user.types';
import { storage } from '../storage';
import { createSelectors } from '../utils';

export interface UserState {
  // User data
  user: UserProfileResponse | null;
  isLoaded: boolean;

  // Actions
  setUser: (user: UserProfileResponse | null) => void;
  clearUser: () => void;
  hydrate: () => void;
}

const initialState = {
  user: null as UserProfileResponse | null,
  isLoaded: false,
};

const _useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (user) =>
        set({
          user,
          isLoaded: true,
        }),

      clearUser: () =>
        set({
          user: null,
          isLoaded: true,
        }),

      hydrate: () =>
        set((state) => ({
          ...state,
          isLoaded: true,
        })),
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          const value = storage.getString(name);
          return value ?? null;
        },
        setItem: (name, value) => {
          storage.set(name, value);
        },
        removeItem: (name) => {
          storage.delete(name);
        },
      })),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoaded = true;
        }
      },
    }
  )
);

export const useUserStore = createSelectors(_useUserStore);

// Export direct access functions for use outside React components
export const setUser = (user: UserProfileResponse | null) =>
  _useUserStore.getState().setUser(user);
export const clearUser = () => _useUserStore.getState().clearUser();
export const getUser = () => _useUserStore.getState().user;
