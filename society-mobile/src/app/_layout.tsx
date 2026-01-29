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
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React from 'react';
import type { AppStateStatus } from 'react-native';
import { ActivityIndicator, AppState, Platform, View } from 'react-native';
import FlashMessage from "react-native-flash-message";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '@/components/ui';
import { CustomFlashMessage } from '@/components/ui/flash-message-config';
import { HiremeLogo } from '@/components/ui/icons';
import { loadSelectedTheme } from '@/lib';
import { fetchPlatformConfig, useAuth, useCurrentUser } from '@/lib/hooks';
import { fetchOccasions } from '@/lib/stores';
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
      retry: 1,
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
      retry: 0,
      retryDelay: 1000,

      // Network mode - mutations only when online
      networkMode: 'online',
    },
  },
});

loadSelectedTheme();
// Prefetch occasions on app startup (force refresh to get latest IDs)
fetchOccasions(true);
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

  const user = userData?.user;
  const role = user?.role;
  const isCompanion = role === 'COMPANION';

  // Check if user needs onboarding
  const needsOnboarding = React.useMemo(() => {
    if (isUserError || !user) return isUserError;
    if (!role) return true;
    if (isCompanion) return !userData.profile;
    return !user.gender || !user.dateOfBirth;
  }, [user, role, isCompanion, userData?.profile, isUserError]);

  // Get route based on user state
  const getOnboardingRoute = () => {
    if (!role) return '/auth/select-role';
    if (isCompanion) return '/companion/onboard/create-profile';
    return '/hirer/onboarding/profile';
  };

  const getDashboardRoute = () => isCompanion ? '/companion/(app)' : '/(app)';

  // Fetch platform config when signed in
  React.useEffect(() => {
    if (isSignedIn) fetchPlatformConfig();
  }, [isSignedIn]);

  // Handle auth-based routing
  React.useEffect(() => {
    if (!isLoaded || !fontsLoaded || (isSignedIn && isUserLoading)) return;

    const [firstSegment, secondSegment] = segments as [string?, string?];

    const isPublicRoute = firstSegment === 'auth' || firstSegment === 'welcome';
    const isOnboardingRoute =
      (firstSegment === 'auth' && secondSegment === 'select-role') ||
      (firstSegment === 'hirer' && secondSegment === 'onboarding') ||
      (firstSegment === 'companion' && secondSegment === 'onboard') ||
      firstSegment === 'phone-verification';

    if (!isSignedIn && !isPublicRoute) {
      router.replace('/welcome');
    } else if (isSignedIn && needsOnboarding && !isOnboardingRoute) {
      router.replace(getOnboardingRoute());
    } else if (isSignedIn && !needsOnboarding && (isPublicRoute || isOnboardingRoute)) {
      router.replace(getDashboardRoute());
    }

    setIsNavigationReady(true);
  }, [isLoaded, isSignedIn, isUserLoading, needsOnboarding, segments, fontsLoaded, router]);

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

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(app)" />
      <Stack.Screen name="companion/(app)" />
      <Stack.Screen name="hirer" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="phone-verification" />
      <Stack.Screen name="settings" />
    </Stack>
  );
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
      <FlashMessage
        position="top"
        floating
        MessageComponent={CustomFlashMessage}
      />
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
            </BottomSheetModalProvider>
          </ThemeProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

