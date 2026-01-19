import { useCallback, useEffect } from 'react';

import { zaloAuthService, type ZaloAuthResponse } from '@/lib/api/services/zalo.service';
import { useAuthStore } from '@/lib/stores/auth';
import { clearUser } from '@/lib/stores/user';

/**
 * Custom useAuth hook that provides Zalo-based authentication.
 * Uses shared Zustand store so auth state is consistent across all components.
 * Only handles authentication state - use useCurrentUser for user data.
 */
export function useAuth() {
  const isLoaded = useAuthStore.use.isLoaded();
  const isSignedIn = useAuthStore.use.isSignedIn();
  const setAuthState = useAuthStore.use.setAuthState();

  // Check auth state on mount
  useEffect(() => {
    // Only check once when not yet loaded
    if (isLoaded) return;

    const checkAuth = async () => {
      try {
        const isAuthenticated = await zaloAuthService.isAuthenticated();
        setAuthState({
          isLoaded: true,
          isSignedIn: isAuthenticated,
        });
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthState({
          isLoaded: true,
          isSignedIn: false,
        });
      }
    };

    checkAuth();
  }, [isLoaded, setAuthState]);

  /**
   * Sign in with Zalo
   */
  const signInWithZalo = useCallback(async (): Promise<ZaloAuthResponse> => {
    const response = await zaloAuthService.login();

    setAuthState({
      isLoaded: true,
      isSignedIn: true,
    });

    return response;
  }, [setAuthState]);

  /**
   * Sign out the current user
   */
  const signOut = useCallback(async (): Promise<void> => {
    await zaloAuthService.logout();
    // Clear user data from local store
    clearUser();

    setAuthState({
      isLoaded: true,
      isSignedIn: false,
    });
  }, [setAuthState]);

  /**
   * Refresh the auth state (re-check token validity)
   */
  const refreshAuth = useCallback(async (): Promise<void> => {
    const isAuthenticated = await zaloAuthService.isAuthenticated();
    setAuthState({
      isLoaded: true,
      isSignedIn: isAuthenticated,
    });
  }, [setAuthState]);

  return {
    isLoaded,
    isSignedIn,
    signInWithZalo,
    signOut,
    refreshAuth,
  };
}
