import { create } from 'zustand';

import { createSelectors } from '../utils';

export interface AuthState {
  isLoaded: boolean;
  isSignedIn: boolean;

  // Actions
  setAuthState: (state: { isLoaded: boolean; isSignedIn: boolean }) => void;
  setSignedIn: (isSignedIn: boolean) => void;
}

const _useAuthStore = create<AuthState>()((set) => ({
  isLoaded: false,
  isSignedIn: false,

  setAuthState: (state) => set(state),
  setSignedIn: (isSignedIn) => set({ isLoaded: true, isSignedIn }),
}));

export const useAuthStore = createSelectors(_useAuthStore);

// Export direct access functions for use outside React components
export const setAuthState = (state: { isLoaded: boolean; isSignedIn: boolean }) =>
  _useAuthStore.getState().setAuthState(state);
export const setSignedIn = (isSignedIn: boolean) =>
  _useAuthStore.getState().setSignedIn(isSignedIn);
export const getAuthState = () => ({
  isLoaded: _useAuthStore.getState().isLoaded,
  isSignedIn: _useAuthStore.getState().isSignedIn,
});
