import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

/**
 * Hook that provides a safe back navigation function.
 * Falls back to a specified route if there's no navigation history.
 *
 * @param fallbackRoute - Route to navigate to if canGoBack() returns false
 * @returns goBack function that safely navigates back or to fallback
 */
export function useSafeBack(fallbackRoute: Href = '/(app)') {
  const router = useRouter();

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallbackRoute);
    }
  }, [router, fallbackRoute]);

  return goBack;
}
