// Import  global CSS file
import '../../global.css';

import {
  Urbanist_100Thin,
  Urbanist_100Thin_Italic,
  Urbanist_200ExtraLight,
  Urbanist_200ExtraLight_Italic,
  Urbanist_300Light,
  Urbanist_300Light_Italic,
  Urbanist_400Regular,
  Urbanist_400Regular_Italic,
  Urbanist_500Medium,
  Urbanist_500Medium_Italic,
  Urbanist_600SemiBold,
  Urbanist_600SemiBold_Italic,
  Urbanist_700Bold,
  Urbanist_700Bold_Italic,
  Urbanist_800ExtraBold,
  Urbanist_800ExtraBold_Italic,
  Urbanist_900Black,
  Urbanist_900Black_Italic,
  useFonts,
} from '@expo-google-fonts/urbanist';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '@react-navigation/native';
import {
  QueryClient,
  QueryClientProvider,
  focusManager
} from '@tanstack/react-query';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React from 'react';
import type { AppStateStatus } from 'react-native';
import { ActivityIndicator, AppState, Platform, View } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '@/components/ui';
import { HiremeLogo } from '@/components/ui/icons';
import { loadSelectedTheme } from '@/lib';
import { useAuth, useCurrentUser } from '@/lib/hooks';
import { useThemeConfig } from '@/lib/use-theme-config';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(app)',
};

// ============================================
// TanStack Query - Mobile-Optimized Configuration
// ============================================
// Optimized for bandwidth efficiency, battery life, and UX

// Configure refetch on app focus (React Native specific)
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry configuration - exponential backoff for transient failures
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Stale time - how long data is considered fresh (no refetch)
      // 5 minutes is good for most data; specific queries can override
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Garbage collection time - how long inactive data stays in cache
      gcTime: 30 * 60 * 1000, // 30 minutes (increased for better offline experience)

      // Refetch behaviors - optimized for mobile battery/bandwidth
      refetchOnMount: 'always', // Refetch if stale when component mounts
      refetchOnWindowFocus: true, // Refetch when app comes to foreground
      refetchOnReconnect: true, // Refetch when network reconnects

      // Disable automatic background refetching (saves battery)
      refetchInterval: false,

      // Network mode - fetch only when online
      networkMode: 'online',

      // Structural sharing - reduces re-renders by reusing unchanged objects
      structuralSharing: true,
    },
    mutations: {
      // Retry mutations once on failure (careful with non-idempotent operations)
      retry: 1,
      retryDelay: 1000,

      // Network mode - mutations only when online
      networkMode: 'online',
    },
  },
});

loadSelectedTheme();
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

// Protected route logic
function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { data: userData, isLoading: isUserLoading, isError: isUserError } = useCurrentUser();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigationReady, setIsNavigationReady] = React.useState(false);

  const [fontsLoaded] = useFonts({
    Urbanist_100Thin,
    Urbanist_100Thin_Italic,
    Urbanist_200ExtraLight,
    Urbanist_200ExtraLight_Italic,
    Urbanist_300Light,
    Urbanist_300Light_Italic,
    Urbanist_400Regular,
    Urbanist_400Regular_Italic,
    Urbanist_500Medium,
    Urbanist_500Medium_Italic,
    Urbanist_600SemiBold,
    Urbanist_600SemiBold_Italic,
    Urbanist_700Bold,
    Urbanist_700Bold_Italic,
    Urbanist_800ExtraBold,
    Urbanist_800ExtraBold_Italic,
    Urbanist_900Black,
    Urbanist_900Black_Italic,
  });

  // Check if user needs onboarding (missing profile or no role)
  const needsOnboarding = React.useMemo(() => {
    // If API error (user doesn't exist in backend yet), they need onboarding
    if (isUserError) return true;
    if (!userData?.user) return false;
    const user = userData.user;
    // User needs onboarding if they don't have a role
    if (!user.role) return true;
    // For COMPANION, they need a companion profile record
    if (user.role === 'COMPANION') {
      return !userData.profile;
    }
    // For HIRER, consider onboarding complete when they have gender and dateOfBirth
    // (HirerProfile record is not required - it only contains optional fields)
    return !user.gender || !user.dateOfBirth;
  }, [userData, isUserError]);

  // Get the appropriate onboarding route based on user role
  const getOnboardingRoute = React.useCallback(() => {
    if (!userData?.user) return '/auth/select-role';
    const role = userData.user.role;
    // User without role needs to select one first
    if (!role) return '/auth/select-role';
    // Route to role-specific onboarding
    if (role === 'COMPANION') {
      return '/companion/onboard/create-profile';
    }
    return '/hirer/onboarding/profile';
  }, [userData]);

  // Get the appropriate dashboard route based on user role
  const getDashboardRoute = React.useCallback(() => {
    if (!userData?.user?.role) return '/(app)';
    if (userData.user.role === 'COMPANION') {
      return '/companion/(app)';
    }
    return '/(app)';
  }, [userData]);

  // Handle auth-based routing
  React.useEffect(() => {
    if (!isLoaded || !fontsLoaded) return;
    // Wait for user data to load if signed in
    if (isSignedIn && isUserLoading) return;

    const firstSegment = segments[0] as string | undefined;
    const secondSegment = segments[1] as string | undefined;

    // Public routes - no authentication required
    const isPublicRoute =
      firstSegment === 'auth' ||
      firstSegment === 'welcome';

    // Onboarding routes - authenticated but completing profile/role selection
    const isOnboardingRoute =
      (firstSegment === 'auth' && secondSegment === 'select-role') ||
      (firstSegment === 'hirer' && secondSegment === 'onboarding') ||
      (firstSegment === 'companion' && secondSegment === 'onboard');

    if (!isSignedIn && !isPublicRoute) {
      // User is not signed in and trying to access protected route
      router.replace('/welcome');
    } else if (isSignedIn && needsOnboarding && !isOnboardingRoute) {
      // User is signed in but needs to complete onboarding
      router.replace(getOnboardingRoute());
    } else if (isSignedIn && !needsOnboarding && (isPublicRoute || isOnboardingRoute)) {
      // User is signed in, profile complete, but on auth/onboarding route - redirect to role-specific dashboard
      router.replace(getDashboardRoute());
    }

    // Mark navigation as ready after auth check
    setIsNavigationReady(true);
  }, [isLoaded, isSignedIn, isUserLoading, needsOnboarding, segments, fontsLoaded, router, getOnboardingRoute, getDashboardRoute]);

  React.useEffect(() => {
    // Hide splash screen after navigation is ready
    if (fontsLoaded && isLoaded && isNavigationReady) {
      const timer = setTimeout(() => {
        SplashScreen.hideAsync();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded, isLoaded, isNavigationReady]);

  // Show splash screen while loading or navigating
  if (!fontsLoaded || !isLoaded || !isNavigationReady || (isSignedIn && isUserLoading)) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite">
        <HiremeLogo color={colors.rose[400]} width={80} height={80} />
        <ActivityIndicator
          size="small"
          color={colors.rose[400]}
          className="mt-6"
        />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  // Set up AppState listener for refetch on app focus (React Native specific)
  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Providers>
        <InitialLayout />
      </Providers>
    </QueryClientProvider>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  const theme = useThemeConfig();
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView
        className={`flex-1 ${theme.dark ? 'dark' : ''}`}
      >
        <KeyboardProvider>
          <ThemeProvider value={theme}>
            <BottomSheetModalProvider>
              {children}
              <FlashMessage position="top" />
            </BottomSheetModalProvider>
          </ThemeProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

