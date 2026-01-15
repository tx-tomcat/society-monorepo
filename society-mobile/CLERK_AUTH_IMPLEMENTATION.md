# Clerk Authentication Implementation Guide

## ✅ Completed Steps

### 1. Environment Configuration
- ✅ Updated `.env.development` with Clerk keys
- ✅ Updated `.env.staging` with Clerk keys
- ✅ Updated `.env.production` with Clerk keys
- ✅ Created API client with Clerk token integration

### 2. API Client
- ✅ Created `src/lib/api/client.ts` with automatic token injection

---

## 📋 Remaining Implementation Steps

### Step 1: Create Phone OTP Verification Screen

**File:** `src/app/(auth)/verify-phone.tsx`

```tsx
/* eslint-disable max-lines-per-function */
import { useSignIn } from '@clerk/clerk-expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import {
  Button,
  FocusAwareStatusBar,
  SafeAreaView,
  showError,
  showErrorMessage,
  Text,
  View,
} from '@/components/ui';

export default function VerifyPhoneScreen() {
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();
  const router = useRouter();
  const { signIn, isLoaded, setActive } = useSignIn();

  const [otp, setOtp] = React.useState(['', '', '', '', '', '']);
  const [loading, setLoading] = React.useState(false);
  const [countdown, setCountdown] = React.useState(56);
  const inputRefs = React.useRef<(TextInput | null)[]>([]);

  // Countdown timer
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      value = value.charAt(value.length - 1);
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (newOtp.every((digit) => digit !== '') && index === 5) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (
    e: { nativeEvent: { key: string } },
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code?: string) => {
    if (!isLoaded || !signIn) return;

    const otpCode = code || otp.join('');
    if (otpCode.length !== 6) {
      showErrorMessage('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    try {
      // Attempt verification
      const completeSignIn = await signIn.attemptFirstFactor({
        strategy: 'phone_code',
        code: otpCode,
      });

      if (completeSignIn.status === 'complete') {
        // Set the active session
        await setActive({ session: completeSignIn.createdSessionId });

        // Navigate to onboarding or main app
        router.replace('/(app)');
      } else {
        console.log('Sign in status:', completeSignIn.status);
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || !signIn) return;

    try {
      await signIn.prepareFirstFactor({
        strategy: 'phone_code',
      });

      setCountdown(56);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      console.error('Resend code error:', error);
      showError(error);
    }
  };

  const isFormValid = otp.every((digit) => digit !== '');

  return (
    <View className="flex-1 bg-offwhite dark:bg-midnight">
      <FocusAwareStatusBar />
      <SafeAreaView edges={['top']} className="flex-1">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior="padding"
          keyboardVerticalOffset={10}
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View className="mb-8 mt-8 gap-2">
              <Text
                className="text-midnight font-inter text-3xl font-bold leading-[1.4] dark:text-offwhite"
                style={styles.title}
              >
                Verify Your Phone
              </Text>
              <Text className="font-inter text-lg leading-[1.6] tracking-[0.2px] text-neutral-700 dark:text-platinum">
                Enter the 6-digit code sent to {phoneNumber}
              </Text>
            </View>

            {/* OTP Input Boxes */}
            <View className="mb-8 flex-row gap-3">
              {otp.map((digit, index) => (
                <View
                  key={index}
                  className={`flex-1 items-center justify-center rounded-xl border ${
                    digit
                      ? 'bg-offwhite border-neutral-300 dark:bg-charcoal-800'
                      : 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                  } py-4`}
                >
                  <TextInput
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    testID={`otp-input-${index}`}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    className="text-midnight dark:text-offwhite text-center font-inter text-2xl font-bold"
                    style={styles.otpInput}
                  />
                </View>
              ))}
            </View>

            {/* Countdown and Resend */}
            <View className="items-center gap-4">
              <Text className="text-center font-inter text-lg leading-[1.6] tracking-[0.2px] text-neutral-700 dark:text-platinum">
                You can resend the code in{' '}
                <Text className="text-primary-400">{countdown}</Text> seconds
              </Text>
              <Pressable
                onPress={handleResendCode}
                disabled={countdown > 0}
                testID="resend-button"
              >
                <Text
                  className={`text-center font-inter text-lg font-semibold leading-[1.6] tracking-[0.2px] ${
                    countdown > 0 ? 'text-neutral-400' : 'text-primary-400'
                  }`}
                >
                  Resend code
                </Text>
              </Pressable>
            </View>

            <View className="h-24" />
          </ScrollView>

          {/* Bottom button */}
          <View className="border-t border-neutral-200 bg-offwhite px-6 pb-9 pt-6 dark:border-neutral-700 dark:bg-midnight">
            <Button
              testID="verify-button"
              label="Verify"
              onPress={() => handleVerify()}
              disabled={!isFormValid}
              loading={loading}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Urbanist-Bold',
    letterSpacing: 0,
  },
  otpInput: {
    fontFamily: 'Urbanist-Bold',
    letterSpacing: 0,
  },
});
```

---

### Step 2: Create Auth Utility Hook

**File:** `src/lib/hooks/use-auth.ts`

```typescript
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';
import { useCallback } from 'react';

export function useAuth() {
  const { isLoaded, isSignedIn, userId, getToken, signOut } = useClerkAuth();
  const { user } = useUser();

  const logout = useCallback(async () => {
    await signOut();
  }, [signOut]);

  const getAuthToken = useCallback(async () => {
    return await getToken();
  }, [getToken]);

  return {
    isLoaded,
    isSignedIn,
    userId,
    user,
    getToken: getAuthToken,
    logout,
  };
}
```

---

### Step 3: Update Root Layout with Clerk Provider

**File:** `src/app/_layout.tsx`

Add Clerk provider to your existing layout:

```typescript
// Import  global CSS file
import '../../global.css';

import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '@react-navigation/native';
import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import React from 'react';
import { StyleSheet } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { APIProvider } from '@/api';
import { loadSelectedTheme } from '@/lib';
import { useThemeConfig } from '@/lib/use-theme-config';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(app)',
};

// Clerk token cache using SecureStore
const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

loadSelectedTheme();
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

// Protected route logic
function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';

    if (isSignedIn && inAuthGroup) {
      // Redirect authenticated users away from auth screens
      router.replace('/(app)');
    } else if (!isSignedIn && inAppGroup) {
      // Redirect unauthenticated users to sign in
      router.replace('/(auth)/phone-sign-in');
    }
  }, [isSignedIn, segments]);

  return <Slot />;
}

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

  if (!publishableKey) {
    throw new Error(
      'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env'
    );
  }

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <Providers>
          <InitialLayout />
        </Providers>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  const theme = useThemeConfig();
  return (
    <GestureHandlerRootView
      style={styles.container}
      className={theme.dark ? `dark` : undefined}
    >
      <KeyboardProvider>
        <ThemeProvider value={theme}>
          <APIProvider>
            <BottomSheetModalProvider>
              {children}
              <FlashMessage position="top" />
            </BottomSheetModalProvider>
          </APIProvider>
        </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

---

### Step 4: Create Auth Layout

**File:** `src/app/(auth)/_layout.tsx`

```typescript
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="phone-sign-in" />
      <Stack.Screen name="verify-phone" />
    </Stack>
  );
}
```

---

### Step 5: Update API Services to Use Clerk Token

**File:** `src/lib/api/services/users.service.ts`

```typescript
import { useAuth } from '@clerk/clerk-expo';
import { apiClient } from '../client';

export interface User {
  id: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string;
  createdAt: string;
}

export const usersService = {
  async getCurrentUser(getToken: () => Promise<string | null>): Promise<User> {
    return apiClient.get('/users/me', { getToken });
  },

  async updateProfile(
    data: Partial<User>,
    getToken: () => Promise<string | null>
  ): Promise<User> {
    return apiClient.put('/users/profile', data, { getToken });
  },

  async uploadAvatar(
    file: FormData,
    getToken: () => Promise<string | null>
  ): Promise<{ url: string }> {
    return apiClient.post('/users/avatar', file, {
      getToken,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Hook to use in components
export function useCurrentUser() {
  const { getToken } = useAuth();

  return async () => {
    return usersService.getCurrentUser(getToken);
  };
}
```

---

### Step 6: Create React Query Integration

**File:** `src/lib/hooks/use-current-user.ts`

```typescript
import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import { usersService } from '../api/services/users.service';

export function useCurrentUser() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => usersService.getCurrentUser(getToken),
    enabled: isSignedIn,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
```

---

## 🚀 Usage Examples

### In a Component

```typescript
import { useAuth } from '@/lib/hooks/use-auth';
import { useCurrentUser } from '@/lib/hooks/use-current-user';

export function ProfileScreen() {
  const { user, isSignedIn, logout } = useAuth();
  const { data: userData, isLoading } = useCurrentUser();

  if (!isSignedIn) {
    return <Text>Not authenticated</Text>;
  }

  return (
    <View>
      <Text>Name: {user?.firstName}</Text>
      <Text>Phone: {user?.primaryPhoneNumber?.phoneNumber}</Text>
      <Button label="Logout" onPress={logout} />
    </View>
  );
}
```

### Making Authenticated API Calls

```typescript
import { useAuth } from '@clerk/clerk-expo';
import { apiClient } from '@/lib/api/client';

function MyComponent() {
  const { getToken } = useAuth();

  const fetchData = async () => {
    try {
      const data = await apiClient.get('/protected-endpoint', { getToken });
      console.log(data);
    } catch (error) {
      console.error(error);
    }
  };

  return <Button onPress={fetchData} label="Fetch Data" />;
}
```

---

## 🔧 Clerk Dashboard Setup

1. **Go to** https://dashboard.clerk.com
2. **Create a new application**
3. **Enable Phone Number authentication:**
   - Go to "User & Authentication" → "Email, Phone, Username"
   - Enable "Phone number"
   - Enable "SMS verification code"
4. **Configure Phone Numbers:**
   - Add your Twilio credentials (or use Clerk's built-in SMS)
   - Set up allowed countries
5. **Get API Keys:**
   - Copy publishable keys from "API Keys" section
   - Add to your `.env` files

---

## 📱 App Configuration

Add Clerk to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "@clerk/clerk-expo",
        {
          "publishableKey": "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY"
        }
      ]
    ]
  }
}
```

---

## 🧪 Testing

1. **Development Mode:**
   ```bash
   pnpm start
   ```

2. **Test Phone Number (Clerk provides test numbers):**
   - Phone: `+15555550100`
   - OTP: `424242`

3. **Production:**
   - Use real phone numbers
   - SMS will be sent via Twilio/Clerk

---

## 🎯 Next Steps

1. ✅ Complete phone sign-in flow
2. ✅ Complete OTP verification
3. ✅ Implement user profile management
4. ✅ Add onboarding flow for new users
5. ✅ Implement logout functionality
6. ✅ Add user settings screen
7. ✅ Integrate with your backend API

---

## 🐛 Troubleshooting

### "Missing Publishable Key" Error
- Ensure `.env` files have the correct `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- Restart Metro bundler after adding env vars

### Phone Number Not Receiving SMS
- Check Clerk dashboard SMS logs
- Verify Twilio credentials
- Use test phone numbers in development

### Token Not Being Sent
- Ensure `getToken` is passed to API calls
- Check network requests in dev tools

---

## 📚 Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Expo SDK](https://clerk.com/docs/references/expo/overview)
- [React Query Documentation](https://tanstack.com/query/latest)
