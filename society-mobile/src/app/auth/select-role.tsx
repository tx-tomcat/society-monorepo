import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import {
  Button,
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { showErrorMessage } from '@/components/ui/utils';
import {
  Briefcase,
  CheckCircle,
  Heart
} from '@/components/ui/icons';

import { authService } from '@/lib/api/services/auth.service';
import type { BackendUserRole } from '@/lib/api/types/user.types';
import { resetAuthFlow } from '@/lib/stores';
import { getUser, setUser } from '@/lib/stores/user';

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

      // Update user store with the new role
      const currentUser = getUser();
      if (currentUser) {
        const backendRole: BackendUserRole = selectedRole === 'hirer' ? 'HIRER' : 'COMPANION';
        setUser({
          ...currentUser,
          user: {
            ...currentUser.user,
            role: backendRole,
          },
        });
      }

      // Reset auth flow state
      resetAuthFlow();

      // Navigate to role-specific onboarding
      if (selectedRole === 'hirer') {
        router.push('/hirer/onboarding/profile' as Href);
      } else {
        router.push('/companion/onboard/create-profile' as Href);
      }
    } catch (error) {
      console.error('Set role error:', error);
      showErrorMessage(t('auth.errors.set_role_failed'));
    } finally {
      setIsSubmitting(false);
    }
  }, [router, selectedRole, isSubmitting, t]);

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      {/* Header with back button */}
      <SafeAreaView edges={['top']}>

      </SafeAreaView>

      <View className="flex-1 px-6">
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          className="mb-8"
        >
          <Text className="mb-2 font-urbanist-bold text-2xl text-midnight">
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
                  <Text className="font-urbanist-semibold text-base text-midnight">
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
                ? 'border-lavender-900 bg-lavender-900/10'
                : 'border-border-light bg-white'
                }`}
            >
              <View className="flex-row items-center gap-4">
                <View
                  className={`size-12 items-center justify-center rounded-xl ${selectedRole === 'companion'
                    ? 'bg-lavender-900'
                    : 'bg-lavender-900/20'
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
                  <Text className="font-urbanist-semibold text-base text-midnight">
                    {t('auth.select_role.companion.title')}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {t('auth.select_role.companion.description')}
                  </Text>
                </View>
                <View
                  className={`size-6 items-center justify-center rounded-full border-2 ${selectedRole === 'companion'
                    ? 'border-lavender-900 bg-lavender-900'
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
            className={selectedRole === 'hirer' ? 'bg-teal-400' : 'bg-lavender-900'}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

