import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, colors, Text } from '@/components/ui';
import { HiremeLogo } from '@/components/ui/icons';
import { useZaloLoginHandler } from '@/lib/hooks';

export default function ZaloLoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { handleLoginWithZalo, isLoading } = useZaloLoginHandler();

  const handleBack = () => {
    router.back();
  };

  return (
    <View
      className="flex-1 bg-warmwhite"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-1 justify-center px-6">
        {/* Logo */}
        <View className="items-center">
          <View className="size-20 items-center justify-center rounded-full bg-rose-50">
            <HiremeLogo color={colors.rose[400]} width={48} height={48} />
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
        <View className="mt-8">
          <Button
            onPress={handleLoginWithZalo}
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
      <View className="px-6 pb-4">
        <Text className="text-center text-xs text-gray-400">
          {t('auth.terms_agreement')}
        </Text>
      </View>
    </View>
  );
}
