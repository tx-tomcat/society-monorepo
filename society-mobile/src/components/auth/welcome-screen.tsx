/* eslint-disable max-lines-per-function */
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import React from 'react';
import { Dimensions, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Button,
  colors,
  FocusAwareStatusBar,
  Image,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import {
  Chart,
  Heart,
  ShieldCheck,
  SocietyLogo,
  Star,
  Wallet,
} from '@/components/ui/icons';

const { width, height } = Dimensions.get('window');

export type WelcomeScreenProps = {
  onGetStartedAsHirer: () => void;
  onGetStartedAsCompanion: () => void;
  onLoginAsHirer: () => void;
  onLoginAsCompanion: () => void;
  testID?: string;
};

export function WelcomeScreen({
  onGetStartedAsHirer,
  onGetStartedAsCompanion,
  onLoginAsHirer,
  onLoginAsCompanion,
  testID,
}: WelcomeScreenProps) {
  const { t } = useTranslation();

  const features = [
    { icon: ShieldCheck, label: t('auth.welcome.features.verified_safe'), color: colors.teal[400] },
    { icon: Star, label: t('auth.welcome.features.premium_quality'), color: colors.yellow[400] },
    { icon: Heart, label: t('auth.welcome.features.trusted_community'), color: colors.rose[400] },
  ];

  return (
    <View className="flex-1" testID={testID}>
      <FocusAwareStatusBar />

      {/* Background Image with Gradient Overlay */}
      <View className="absolute inset-0">
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&q=80' }}
          className="absolute inset-0"
          style={{ width, height }}
          contentFit="cover"
        />
        <LinearGradient
          colors={['rgba(45, 42, 51, 0.3)', 'rgba(45, 42, 51, 0.7)', 'rgba(45, 42, 51, 0.95)']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        <View className="flex-1 px-6">
          {/* Logo & Brand */}
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600 }}
            className="mt-12 items-center"
          >
            <View className="mb-4 size-20 items-center justify-center rounded-3xl bg-white/10">
              <SocietyLogo color={colors.rose[400]} width={48} height={48} />
            </View>
            <Text style={styles.brandName} className="text-4xl text-white">
              {t('auth.welcome.brand_name')}
            </Text>
            <Text className="mt-2 text-center text-lg text-white/80">
              {t('auth.welcome.tagline')}
            </Text>
          </MotiView>

          {/* Hero Content */}
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 200 }}
            className="mt-auto"
          >
            <Text style={styles.heroTitle} className="text-center text-3xl text-white">
              {t('auth.welcome.hero_title')}
            </Text>
            <Text className="mt-4 text-center text-base leading-relaxed text-white/70">
              {t('auth.welcome.hero_subtitle')}
            </Text>
          </MotiView>

          {/* Feature Highlights */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 600, delay: 400 }}
            className="mt-8 flex-row justify-center gap-6"
          >
            {features.map((feature, index) => (
              <MotiView
                key={feature.label}
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 400, delay: 500 + index * 100 }}
                className="items-center"
              >
                <View className="mb-2 size-12 items-center justify-center rounded-full bg-white/10">
                  <feature.icon color={feature.color} width={24} height={24} />
                </View>
                <Text className="text-center text-xs text-white/70">{feature.label}</Text>
              </MotiView>
            ))}
          </MotiView>

          {/* User Type Selection */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 600 }}
            className="mb-6 mt-10 gap-4"
          >
            {/* Hirer Button (Primary) */}
            <Button
              label={t('auth.welcome.find_companion')}
              onPress={onGetStartedAsHirer}
              variant="default"
              size="lg"
              fullWidth
              testID={testID ? `${testID}-hirer-cta` : undefined}
            />

            {/* Companion Button (Secondary) */}
            <Pressable
              onPress={onGetStartedAsCompanion}
              className="flex-row items-center justify-center gap-3 rounded-2xl border border-lavender-400/50 bg-lavender-400/10 py-4"
              testID={testID ? `${testID}-companion-cta` : undefined}
            >
              <View className="flex-row items-center gap-2">
                <Wallet color={colors.lavender[400]} width={20} height={20} />
                <Text className="text-base font-semibold text-lavender-400">
                  {t('auth.welcome.become_companion')}
                </Text>
              </View>
              <View className="rounded-full bg-lavender-400/20 px-2 py-0.5">
                <Text className="text-xs font-medium text-lavender-400">{t('auth.welcome.earn_money')}</Text>
              </View>
            </Pressable>
          </MotiView>

          {/* Login Links */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 500, delay: 800 }}
            className="mb-4 flex-row justify-center gap-6"
          >
            <Pressable
              onPress={onLoginAsHirer}
              testID={testID ? `${testID}-hirer-login` : undefined}
            >
              <Text className="text-sm text-white/60">
                {t('auth.welcome.hirer_login')} <Text className="font-semibold text-rose-400">{t('auth.welcome.sign_in')}</Text>
              </Text>
            </Pressable>
            <View className="h-4 w-px bg-white/30" />
            <Pressable
              onPress={onLoginAsCompanion}
              testID={testID ? `${testID}-companion-login` : undefined}
            >
              <Text className="text-sm text-white/60">
                {t('auth.welcome.companion_login')} <Text className="font-semibold text-lavender-400">{t('auth.welcome.sign_in')}</Text>
              </Text>
            </Pressable>
          </MotiView>

          {/* Trust badges */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 500, delay: 900 }}
            className="flex-row items-center justify-center gap-4"
          >
            <View className="flex-row items-center gap-1">
              <ShieldCheck color={colors.teal[400]} width={12} height={12} />
              <Text className="text-xs text-white/50">{t('auth.welcome.id_verified')}</Text>
            </View>
            <View className="size-1 rounded-full bg-white/30" />
            <View className="flex-row items-center gap-1">
              <Chart color={colors.yellow[400]} width={12} height={12} />
              <Text className="text-xs text-white/50">{t('auth.welcome.users_count')}</Text>
            </View>
          </MotiView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  brandName: {
    fontFamily: 'Urbanist_700Bold',
    letterSpacing: 1,
  },
  heroTitle: {
    fontFamily: 'Urbanist_700Bold',
    lineHeight: 40,
  },
});
