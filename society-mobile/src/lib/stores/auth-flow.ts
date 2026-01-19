import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { storage } from '../storage';
import { createSelectors } from '../utils';

export type AuthMethod = 'email';

export interface AuthFlowState {
  // Auth data (email-only)
  email: string;
  authMethod: AuthMethod | null;
  isNewUser: boolean;

  // Actions
  setAuthData: (data: {
    email: string;
    authMethod?: AuthMethod;
    isNewUser?: boolean;
  }) => void;
  reset: () => void;
}

const initialState = {
  email: '',
  authMethod: null as AuthMethod | null,
  isNewUser: true,
};

const _useAuthFlow = create<AuthFlowState>()(
  persist(
    (set) => ({
      ...initialState,

      setAuthData: (data) =>
        set((state) => ({
          email: data.email,
          authMethod: data.authMethod ?? 'email',
          isNewUser: data.isNewUser ?? state.isNewUser,
        })),

      reset: () => set(initialState),
    }),
    {
      name: 'auth-flow',
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
    }
  )
);

export const useAuthFlow = createSelectors(_useAuthFlow);

// Export direct access functions
export const resetAuthFlow = () => _useAuthFlow.getState().reset();
