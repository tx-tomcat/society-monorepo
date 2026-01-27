import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { useAuth } from './use-auth';
import { useSyncUser } from './use-current-user';

type ZaloAuthResponse = {
  isNewUser: boolean;
  hasProfile: boolean;
  user: {
    role: 'HIRER' | 'COMPANION' | 'ADMIN' | null;
  };
};

type UseZaloLoginHandlerOptions = {
  /** Optional callback fired on successful login */
  onSuccess?: (response: ZaloAuthResponse) => void;
  /** Optional callback fired on login error */
  onError?: (error: unknown) => void;
};

/**
 * Reusable hook that handles Zalo login flow with routing.
 * Consolidates the login logic used across welcome, hirer/splash, and companion/splash screens.
 */
export function useZaloLoginHandler(options: UseZaloLoginHandlerOptions = {}): {
  handleLoginWithZalo: () => Promise<void>;
  isLoading: boolean;
} {
  const router = useRouter();
  const { t } = useTranslation();
  const { signInWithZalo } = useAuth();
  const { mutateAsync: syncUser } = useSyncUser();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLoginWithZalo = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // Login with Zalo - this also updates auth state
      const authResponse = await signInWithZalo();

      // Sync user data to local store
      try {
        await syncUser();
        console.log('User synced successfully');
      } catch (syncError) {
        console.warn('Failed to sync user data:', syncError);
        // Continue anyway - app will handle missing user data
      }
      // Navigate based on user state
      if (authResponse.isNewUser || !authResponse.user.role) {
        // New user or no role - needs to select role
        router.replace('/auth/select-role' as Href);
      } else if (!authResponse.hasProfile) {
        // Has role but hasn't completed onboarding
        if (authResponse.user.role === 'COMPANION') {
          router.replace('/companion/onboard/create-profile' as Href);
        } else {
          router.replace('/hirer/onboarding/profile' as Href);
        }
      } else {
        // Existing user with completed profile - redirect to dashboard
        if (authResponse.user.role === 'COMPANION') {
          router.replace('/companion/(app)' as Href);
        } else {
          router.replace('/(app)' as Href);
        }
      }

      options.onSuccess?.(authResponse);
    } catch (error) {
      console.error('Zalo login failed:', error);
      Alert.alert(
        t('auth.errors.login_failed'),
        t('auth.errors.zalo_login_failed')
      );

      options.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [router, t, options, signInWithZalo, syncUser]);

  return {
    handleLoginWithZalo,
    isLoading,
  };
}
