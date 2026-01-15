import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';
import { useCallback } from 'react';

/**
 * Custom auth hook that wraps Clerk's useAuth
 * Provides a consistent interface for authentication throughout the app
 */
export function useAuth() {
  const { isLoaded, isSignedIn, userId, getToken, signOut } = useClerkAuth();
  const { user } = useUser();

  const logout = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, [signOut]);

  const getAuthToken = useCallback(async () => {
    try {
      return await getToken();
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }, [getToken]);

  return {
    // Auth state
    isLoaded,
    isSignedIn,
    userId,
    user,

    // Methods
    getToken: getAuthToken,
    logout,

    // User data
    phoneNumber: user?.primaryPhoneNumber?.phoneNumber,
    email: user?.primaryEmailAddress?.emailAddress,
    firstName: user?.firstName,
    lastName: user?.lastName,
    fullName: user?.fullName,
    imageUrl: user?.imageUrl,
  };
}
