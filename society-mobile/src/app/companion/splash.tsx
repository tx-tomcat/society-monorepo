/* eslint-disable max-lines-per-function */
import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
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
  Crown,
  ShieldCheck,
  SocietyLogo,
  Star,
  Wallet,
} from '@/components/ui/icons';

const features = [
  {
    icon: Wallet,
    labelKey: 'companion.splash.features.earn',
    color: colors.teal[400],
  },
  {
    icon: ShieldCheck,
    labelKey: 'companion.splash.features.verified',
    color: colors.lavender[400],
  },
  {
    icon: Chart,
    labelKey: 'companion.splash.features.track',
    color: colors.yellow[400],
  },
];

const stats = [
  { value: '₫5M+', labelKey: 'companion.splash.stats.earnings' },
  { value: '4.8', labelKey: 'companion.splash.stats.rating' },
  { value: '1000+', labelKey: 'companion.splash.stats.companions' },
];

export default function CompanionSplash() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleGetStarted = React.useCallback(() => {
    router.push('/companion/auth/login' as Href);
  }, [router]);

  const handleLogin = React.useCallback(() => {
    router.push('/companion/auth/login' as Href);
  }, [router]);

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />

      {/* Background Image */}
      <Image
        source={{
          uri: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80',
        }}
        className="absolute inset-0 size-full"
        contentFit="cover"
      />

      {/* Gradient Overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-center gap-3 px-6 pt-4">
          <SocietyLogo color="#FFFFFF" width={36} height={36} />
          <Text style={styles.logoText} className="text-2xl text-white">
            Society
          </Text>
          <View className="rounded-full bg-lavender-400/20 px-2 py-1">
            <Text className="text-xs font-semibold text-lavender-400">
              {t('companion.splash.badge')}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View className="flex-1 justify-end px-6 pb-8">
          {/* Title */}
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600 }}
          >
            <Text
              style={styles.title}
              className="mb-3 text-4xl leading-tight text-white"
            >
              {t('companion.splash.hero_title')}
            </Text>
            <Text className="mb-6 text-lg leading-relaxed text-white/80">
              {t('companion.splash.hero_subtitle')}
            </Text>
          </MotiView>

          {/* Stats */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 200 }}
            className="mb-6 flex-row justify-between rounded-2xl bg-white/10 p-4"
          >
            {stats.map((stat, index) => (
              <View key={stat.labelKey} className="flex-1 items-center">
                <Text style={styles.statValue} className="text-2xl text-white">
                  {stat.value}
                </Text>
                <Text className="mt-1 text-center text-xs text-white/60">
                  {t(stat.labelKey)}
                </Text>
                {index < stats.length - 1 && (
                  <View className="absolute right-0 top-1/2 h-8 w-px -translate-y-1/2 bg-white/20" />
                )}
              </View>
            ))}
          </MotiView>

          {/* Features */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 300 }}
            className="mb-8 gap-3"
          >
            {features.map((feature, index) => (
              <MotiView
                key={feature.labelKey}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: 400, delay: 400 + index * 100 }}
                className="flex-row items-center gap-3"
              >
                <View
                  className="size-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${feature.color}20` }}
                >
                  <feature.icon color={feature.color} width={20} height={20} />
                </View>
                <Text className="text-base font-medium text-white">
                  {t(feature.labelKey)}
                </Text>
              </MotiView>
            ))}
          </MotiView>

          {/* CTA Buttons */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 600 }}
            className="gap-3"
          >
            <Button
              label={t('companion.splash.start_earning')}
              onPress={handleGetStarted}
              variant="default"
              size="lg"
              className="w-full"
            />
            <Pressable
              onPress={handleLogin}
              className="items-center py-3"
            >
              <Text className="text-base font-medium text-white">
                {t('companion.splash.already_companion')}{' '}
                <Text className="font-bold text-lavender-400">{t('auth.welcome.sign_in')}</Text>
              </Text>
            </Pressable>
          </MotiView>

          {/* Trust badges */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 500, delay: 800 }}
            className="mt-4 flex-row items-center justify-center gap-4"
          >
            <View className="flex-row items-center gap-1">
              <ShieldCheck color={colors.teal[400]} width={14} height={14} />
              <Text className="text-xs text-white/60">{t('companion.splash.badges.verified')}</Text>
            </View>
            <View className="size-1 rounded-full bg-white/40" />
            <View className="flex-row items-center gap-1">
              <Star color={colors.yellow[400]} width={14} height={14} />
              <Text className="text-xs text-white/60">{t('companion.splash.badges.top_rated')}</Text>
            </View>
            <View className="size-1 rounded-full bg-white/40" />
            <View className="flex-row items-center gap-1">
              <Crown color={colors.lavender[400]} width={14} height={14} />
              <Text className="text-xs text-white/60">{t('companion.splash.badges.premium')}</Text>
            </View>
          </MotiView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  logoText: {
    fontFamily: 'Urbanist_700Bold',
  },
  title: {
    fontFamily: 'Urbanist_700Bold',
  },
  statValue: {
    fontFamily: 'Urbanist_700Bold',
  },
});
