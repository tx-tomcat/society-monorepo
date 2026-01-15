import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';

import { usersService } from '../api/services/users.service';

/**
 * React Query hook to fetch current user data
 * Automatically uses Clerk token for authentication
 */
export function useCurrentUser() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => usersService.getCurrentUser(getToken),
    enabled: isSignedIn, // Only fetch when user is signed in
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  });
}
