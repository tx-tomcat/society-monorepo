/* eslint-disable max-lines-per-function */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import {
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { ShieldCheck, Star } from '@/components/ui/icons';

export type WelcomeScreenProps = {
  onLoginWithZalo: () => void;
  isLoading?: boolean;
  testID?: string;
};

export function WelcomeScreen({
  onLoginWithZalo,
  isLoading = false,
  testID,
}: WelcomeScreenProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-white" testID={testID}>
      <FocusAwareStatusBar />

      {/* Layered Background - Soft gradient with subtle warmth */}
      <LinearGradient
        colors={['#FFF8F6', '#FFF0ED', '#FFFBF9']}
        locations={[0, 0.5, 1]}
        className="absolute inset-0"
      />

      {/* Decorative Elements - Subtle geometric shapes */}
      <View className="absolute inset-0 overflow-hidden" pointerEvents="none">
        {/* Large soft circle - top right */}
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 1200, delay: 200 }}
          className="absolute -right-20 -top-24 size-72 rounded-full bg-rose-100 opacity-40"
        />
        {/* Medium circle - bottom left */}
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 1200, delay: 400 }}
          className="absolute -left-14 bottom-24 size-48 rounded-full bg-coral-100 opacity-30"
        />
        {/* Small accent - center */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 800, delay: 600 }}
          className="absolute right-10 top-1/3 h-14 w-px bg-rose-200 opacity-50"
        />
      </View>

      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <View className="flex-1 px-8 pb-10 pt-16">
          {/* Logo & Brand Identity */}
          <MotiView
            from={{ opacity: 0, translateY: -30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 800, delay: 100 }}
            className="items-center"
          >
            {/* Premium Logo Container */}
            <Image
              source={require('../../../assets/logo.png')}
              style={{ width: 200, height: 200 }}
            />

            {/* Elegant divider */}
            <View className="my-4 h-0.5 w-10 rounded-sm bg-rose-300" />

            {/* Tagline */}
            <Text className="font-urbanist-medium text-sm uppercase tracking-widest text-gray-400">
              {t('auth.welcome.tagline')}
            </Text>
          </MotiView>

          {/* Hero Section - Central Message */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 800, delay: 400 }}
            className="mt-12 flex-1 justify-center"
          >
            <Text className="mb-4 text-center font-urbanist-bold text-3xl leading-10 text-midnight">
              {t('auth.welcome.hero_title')}
            </Text>
            <Text className="px-2 text-center font-urbanist text-base leading-6 text-gray-500">
              {t('auth.welcome.hero_subtitle')}
            </Text>

            {/* Trust Indicators - Minimal and Elegant */}
            <View className="mt-7 flex-row items-center justify-center gap-4">
              <View className="flex-row items-center gap-1.5">
                <ShieldCheck color={colors.teal[400]} width={18} height={18} />
                <Text className="font-urbanist-medium text-sm text-gray-400">
                  {t('auth.welcome.features.verified_safe')}
                </Text>
              </View>
              <View className="size-1 rounded-full bg-gray-200" />
              <View className="flex-row items-center gap-1.5">
                <Star color={colors.yellow[500]} width={18} height={18} />
                <Text className="font-urbanist-medium text-sm text-gray-400">
                  {t('auth.welcome.features.premium_quality')}
                </Text>
              </View>
            </View>
          </MotiView>

          {/* Bottom Actions - Floating Card Style */}
          <MotiView
            from={{ opacity: 0, translateY: 40 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 700, delay: 600 }}
          >
            {/* Premium Card Container */}
            <View className="rounded-3xl bg-white p-6 shadow-lg">
              {/* Zalo Login Button - Premium styling */}
              <Pressable
                onPress={onLoginWithZalo}
                disabled={isLoading}
                className={`overflow-hidden rounded-2xl bg-[#0068FF] active:scale-[0.985] active:opacity-90 ${isLoading ? 'opacity-60' : ''}`}
                testID={testID ? `${testID}-zalo-login` : undefined}
              >
                <View className="flex-row items-center justify-center gap-3 px-6 py-4">
                  <Image
                    source={require('../../../assets/zalo.svg')}
                    style={{ width: 48, height: 48 }}
                  />
                  <Text className="font-urbanist-bold text-lg tracking-wide text-white">
                    {isLoading
                      ? t('common.loading')
                      : t('auth.continue_with_zalo')}
                  </Text>
                </View>
              </Pressable>

              {/* Terms - Refined typography */}
              <Text className="mt-4 text-center font-urbanist text-xs leading-5 text-gray-400">
                {t('auth.terms_agreement')}
              </Text>
            </View>

            {/* User count badge */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 500, delay: 900 }}
              className="mt-5 flex-row items-center justify-center gap-2"
            >
              <View className="size-2 rounded-full bg-teal-400" />
              <Text className="font-urbanist-medium text-sm text-gray-500">
                {t('auth.welcome.users_count')}
              </Text>
            </MotiView>
          </MotiView>
        </View>
      </SafeAreaView>
    </View>
  );
}
