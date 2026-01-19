import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';
import { showMessage } from 'react-native-flash-message';

import {
  Button,
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import {
  ArrowLeft,
  Briefcase,
  CheckCircle,
  Heart,
} from '@/components/ui/icons';

import { authService } from '@/lib/api/services/auth.service';
import { resetAuthFlow } from '@/lib/stores';

type Role = 'hirer' | 'companion';

export default function SelectRole() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = React.useState<Role>('hirer');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleContinue = React.useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Set user role via API
      await authService.setUserRole(selectedRole);

      // Reset auth flow state
      resetAuthFlow();

      // Navigate to role-specific onboarding
      if (selectedRole === 'hirer') {
        router.replace('/hirer/onboarding/profile' as Href);
      } else {
        router.replace('/companion/onboard/create-profile' as Href);
      }
    } catch (error) {
      console.error('Set role error:', error);
      showMessage({
        message: t('common.error'),
        description: t('auth.errors.set_role_failed'),
        type: 'danger',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [router, selectedRole, isSubmitting, t]);

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      {/* Header with back button */}
      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 px-4 py-3">
          <Pressable onPress={() => router.back()}>
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <View className="flex-1" />
        </View>
      </SafeAreaView>

      <View className="flex-1 px-6">
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          className="mb-8"
        >
          <Text style={styles.title} className="mb-2 text-2xl text-midnight">
            {t('auth.select_role.title')}
          </Text>
          <Text className="text-base text-gray-500">
            {t('auth.select_role.subtitle')}
          </Text>
        </MotiView>

        {/* Role Cards - Wireframe style with selection indicator */}
        <View className="gap-4">
          {/* Hirer Card */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 100 }}
          >
            <Pressable
              onPress={() => setSelectedRole('hirer')}
              disabled={isSubmitting}
              className={`rounded-2xl border-2 p-5 ${selectedRole === 'hirer'
                  ? 'border-teal-400 bg-teal-400/10'
                  : 'border-border-light bg-white'
                }`}
            >
              <View className="flex-row items-center gap-4">
                <View
                  className={`size-12 items-center justify-center rounded-xl ${selectedRole === 'hirer' ? 'bg-teal-400' : 'bg-teal-400/20'
                    }`}
                >
                  <Briefcase
                    color={selectedRole === 'hirer' ? '#FFFFFF' : colors.teal[400]}
                    width={24}
                    height={24}
                  />
                </View>
                <View className="flex-1">
                  <Text style={styles.cardTitle} className="text-base text-midnight">
                    {t('auth.select_role.hirer.title')}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {t('auth.select_role.hirer.description')}
                  </Text>
                </View>
                <View
                  className={`size-6 items-center justify-center rounded-full border-2 ${selectedRole === 'hirer'
                      ? 'border-teal-400 bg-teal-400'
                      : 'border-border-light'
                    }`}
                >
                  {selectedRole === 'hirer' && (
                    <CheckCircle color="#FFFFFF" width={16} height={16} />
                  )}
                </View>
              </View>
            </Pressable>
          </MotiView>

          {/* Companion Card */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 200 }}
          >
            <Pressable
              onPress={() => setSelectedRole('companion')}
              disabled={isSubmitting}
              className={`rounded-2xl border-2 p-5 ${selectedRole === 'companion'
                  ? 'border-lavender-400 bg-lavender-400/10'
                  : 'border-border-light bg-white'
                }`}
            >
              <View className="flex-row items-center gap-4">
                <View
                  className={`size-12 items-center justify-center rounded-xl ${selectedRole === 'companion'
                      ? 'bg-lavender-400'
                      : 'bg-lavender-400/20'
                    }`}
                >
                  <Heart
                    color={
                      selectedRole === 'companion' ? '#FFFFFF' : colors.lavender[400]
                    }
                    width={24}
                    height={24}
                  />
                </View>
                <View className="flex-1">
                  <Text style={styles.cardTitle} className="text-base text-midnight">
                    {t('auth.select_role.companion.title')}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {t('auth.select_role.companion.description')}
                  </Text>
                </View>
                <View
                  className={`size-6 items-center justify-center rounded-full border-2 ${selectedRole === 'companion'
                      ? 'border-lavender-400 bg-lavender-400'
                      : 'border-border-light'
                    }`}
                >
                  {selectedRole === 'companion' && (
                    <CheckCircle color="#FFFFFF" width={16} height={16} />
                  )}
                </View>
              </View>
            </Pressable>
          </MotiView>
        </View>
      </View>

      {/* Sticky CTA */}
      <SafeAreaView edges={['bottom']} className="border-t border-border-light bg-warmwhite">
        <View className="p-4">
          <Button
            label={
              selectedRole === 'hirer'
                ? t('auth.select_role.continue_as_hirer')
                : t('auth.select_role.continue_as_companion')
            }
            onPress={handleContinue}
            loading={isSubmitting}
            disabled={isSubmitting}
            variant="default"
            size="lg"
            fullWidth
            className={selectedRole === 'hirer' ? 'bg-teal-400' : 'bg-lavender-400'}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Urbanist_700Bold',
  },
  cardTitle: {
    fontFamily: 'Urbanist_600SemiBold',
  },
});
