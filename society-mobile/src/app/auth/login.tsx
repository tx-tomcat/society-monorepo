import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, colors, Text } from '@/components/ui';
import { SocietyLogo } from '@/components/ui/icons';
import { useAuth, useSyncUser } from '@/lib/hooks';

export default function ZaloLoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { signInWithZalo } = useAuth();
  const { mutateAsync: syncUser } = useSyncUser();
  const [isLoading, setIsLoading] = useState(false);

  const handleZaloLogin = async () => {
    setIsLoading(true);
    try {
      const response = await signInWithZalo();

      // Sync user data to local store
      try {
        await syncUser();
      } catch (syncError) {
        console.warn('Failed to sync user data:', syncError);
        // Continue anyway - app will handle missing user data
      }

      if (response.isNewUser) {
        // New user - navigate to role selection
        router.replace('/auth/select-role');
      } else {
        // Existing user - navigate to main app
        router.replace('/(app)');
      }
    } catch (error) {
      console.error('Zalo login error:', error);
      showMessage({
        message: t('common.error'),
        description: t('auth.errors.login_failed'),
        type: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <SocietyLogo color={colors.rose[400]} width={48} height={48} />
          </View>
        </View>

        {/* Title */}
        <Text className="mt-6 text-center text-3xl font-bold text-midnight">
          {t('auth.welcome_back')}
        </Text>
        <Text className="mt-2 text-center text-base text-gray-500">
          {t('auth.login_with_zalo_description')}
        </Text>

        {/* Zalo Login Button */}
        <View style={styles.buttonContainer}>
          <Button
            onPress={handleZaloLogin}
            disabled={isLoading}
            className="w-full bg-[#0068ff]"
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-center text-base font-semibold text-white">
                {t('auth.continue_with_zalo')}
              </Text>
            )}
          </Button>
        </View>

        {/* Back button */}
        <Button
          variant="ghost"
          onPress={handleBack}
          className="mt-4"
        >
          <Text className="text-center text-base text-gray-500">
            {t('common.back')}
          </Text>
        </Button>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text className="text-center text-xs text-gray-400">
          {t('auth.terms_agreement')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.warmwhite.DEFAULT,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.rose[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    marginTop: 32,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
});
