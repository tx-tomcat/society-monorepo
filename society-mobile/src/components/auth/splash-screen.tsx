/* eslint-disable max-lines-per-function */
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import React from 'react';
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
  Heart,
  HiremeLogo,
  ShieldCheck,
  Star,
  Wallet,
  Zalo,
} from '@/components/ui/icons';

type UserType = 'hirer' | 'companion';

type FeatureItem = {
  icon: React.ComponentType<{ color: string; width: number; height: number }>;
  labelKey: string;
  color: string;
};

type StatItem = {
  value: string;
  labelKey: string;
};

type BadgeItem = {
  icon: React.ComponentType<{ color: string; width: number; height: number }>;
  labelKey: string;
  color: string;
};

type ThemeConfig = {
  backgroundImage: string;
  gradientColors: readonly [string, string, string];
  accentColor: string;
  logoColor: string;
  features: FeatureItem[];
  stats?: StatItem[];
  badges?: BadgeItem[];
  taglineKey: string;
  heroTitleKey: string;
  heroSubtitleKey: string;
  badgeKey?: string;
};

const themeConfigs: Record<UserType, ThemeConfig> = {
  hirer: {
    backgroundImage:
      'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&q=80',
    gradientColors: [
      'rgba(45, 42, 51, 0.3)',
      'rgba(45, 42, 51, 0.7)',
      'rgba(45, 42, 51, 0.95)',
    ],
    accentColor: colors.rose[400],
    logoColor: colors.rose[400],
    taglineKey: 'hirer.splash.tagline',
    heroTitleKey: 'hirer.splash.hero_title',
    heroSubtitleKey: 'hirer.splash.hero_subtitle',
    features: [
      {
        icon: ShieldCheck,
        labelKey: 'hirer.splash.features.verified',
        color: colors.teal[400],
      },
      {
        icon: Star,
        labelKey: 'hirer.splash.features.premium',
        color: colors.yellow[400],
      },
      {
        icon: Heart,
        labelKey: 'hirer.splash.features.trusted',
        color: colors.rose[400],
      },
    ],
  },
  companion: {
    backgroundImage:
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80',
    gradientColors: [
      'rgba(0, 0, 0, 0.2)',
      'rgba(0, 0, 0, 0.7)',
      'rgba(0, 0, 0, 0.95)',
    ],
    accentColor: colors.lavender[400],
    logoColor: '#FFFFFF',
    taglineKey: 'companion.splash.tagline',
    heroTitleKey: 'companion.splash.hero_title',
    heroSubtitleKey: 'companion.splash.hero_subtitle',
    badgeKey: 'companion.splash.badge',
    features: [
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
    ],
    stats: [
      { value: '₫5M+', labelKey: 'companion.splash.stats.earnings' },
      { value: '4.8', labelKey: 'companion.splash.stats.rating' },
      { value: '1000+', labelKey: 'companion.splash.stats.companions' },
    ],
    badges: [
      {
        icon: ShieldCheck,
        labelKey: 'companion.splash.badges.verified',
        color: colors.teal[400],
      },
      {
        icon: Star,
        labelKey: 'companion.splash.badges.top_rated',
        color: colors.yellow[400],
      },
      {
        icon: Crown,
        labelKey: 'companion.splash.badges.premium',
        color: colors.lavender[400],
      },
    ],
  },
};

export type SplashScreenProps = {
  userType: UserType;
  onLoginWithZalo: () => void;
  isLoading?: boolean;
  testID?: string;
};

export function SplashScreen({
  userType,
  onLoginWithZalo,
  isLoading = false,
  testID,
}: SplashScreenProps) {
  const { t } = useTranslation();
  const theme = themeConfigs[userType];

  return (
    <View className="flex-1" testID={testID}>
      <FocusAwareStatusBar />

      {/* Background Image */}
      <Image
        source={{ uri: theme.backgroundImage }}
        className="absolute inset-0 size-full"
        contentFit="cover"
      />

      {/* Gradient Overlay */}
      <LinearGradient
        colors={theme.gradientColors}
        locations={[0, 0.5, 1]}
        className="absolute inset-0"
      />

      <SafeAreaView edges={['top', 'bottom']} className="flex-1">
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
          className="flex-row items-center justify-center gap-3 px-6 pt-4"
        >
          <View className="size-14 items-center justify-center rounded-2xl bg-white/10">
            <HiremeLogo color={theme.logoColor} width={32} height={32} />
          </View>
          <Text className="font-urbanist-bold text-2xl tracking-wide text-white">
            Hireme
          </Text>
          {theme.badgeKey && (
            <View
              className="rounded-full px-2 py-1"
              style={{ backgroundColor: `${theme.accentColor}20` }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: theme.accentColor }}
              >
                {t(theme.badgeKey)}
              </Text>
            </View>
          )}
        </MotiView>

        {/* Content */}
        <View className="flex-1 justify-end px-6 pb-8">
          {/* Hero Section */}
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 200 }}
          >
            <Text className="mb-3 font-urbanist-bold text-4xl leading-tight text-white">
              {t(theme.heroTitleKey)}
            </Text>
            <Text className="mb-6 text-lg leading-relaxed text-white/80">
              {t(theme.heroSubtitleKey)}
            </Text>
          </MotiView>

          {/* Stats (Companion only) */}
          {theme.stats && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 300 }}
              className="mb-6 flex-row justify-between rounded-2xl bg-white/10 p-4"
            >
              {theme.stats.map((stat, index) => (
                <View key={stat.labelKey} className="flex-1 items-center">
                  <Text className="font-urbanist-bold text-2xl text-white">
                    {stat.value}
                  </Text>
                  <Text className="mt-1 text-center text-xs text-white/60">
                    {t(stat.labelKey)}
                  </Text>
                  {index < theme.stats!.length - 1 && (
                    <View className="absolute right-0 top-1/2 h-8 w-px -translate-y-1/2 bg-white/20" />
                  )}
                </View>
              ))}
            </MotiView>
          )}

          {/* Features */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 400 }}
            className={userType === 'companion' ? 'mb-8 gap-3' : 'mb-8 flex-row justify-center gap-6'}
          >
            {theme.features.map((feature, index) => (
              <MotiView
                key={feature.labelKey}
                from={
                  userType === 'companion'
                    ? { opacity: 0, translateX: -20 }
                    : { opacity: 0, scale: 0.8 }
                }
                animate={
                  userType === 'companion'
                    ? { opacity: 1, translateX: 0 }
                    : { opacity: 1, scale: 1 }
                }
                transition={{
                  type: 'timing',
                  duration: 400,
                  delay: 500 + index * 100,
                }}
                className={
                  userType === 'companion'
                    ? 'flex-row items-center gap-3'
                    : 'items-center'
                }
              >
                <View
                  className={
                    userType === 'companion'
                      ? 'size-10 items-center justify-center rounded-full'
                      : 'mb-2 size-12 items-center justify-center rounded-full bg-white/10'
                  }
                  style={
                    userType === 'companion'
                      ? { backgroundColor: `${feature.color}20` }
                      : undefined
                  }
                >
                  <feature.icon
                    color={feature.color}
                    width={userType === 'companion' ? 20 : 24}
                    height={userType === 'companion' ? 20 : 24}
                  />
                </View>
                <Text
                  className={
                    userType === 'companion'
                      ? 'text-base font-medium text-white'
                      : 'text-center text-xs text-white/70'
                  }
                >
                  {t(feature.labelKey)}
                </Text>
              </MotiView>
            ))}
          </MotiView>

          {/* CTA Button - Zalo Login */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 600 }}
            className="gap-3"
          >
            <Button
              onPress={onLoginWithZalo}
              variant="default"
              size="lg"
              fullWidth
              disabled={isLoading}
              testID={testID ? `${testID}-zalo-login` : 'zalo-login-button'}
            >
              <View className="flex-row items-center gap-3">
                <Zalo size={24} />
                <Text className="text-lg font-bold text-white">
                  {isLoading ? t('common.loading') : t('auth.continue_with_zalo')}
                </Text>
              </View>
            </Button>
          </MotiView>

          {/* Trust Badges (Companion only) */}
          {theme.badges && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 500, delay: 800 }}
              className="mt-4 flex-row items-center justify-center gap-4"
            >
              {theme.badges.map((badge, index) => (
                <React.Fragment key={badge.labelKey}>
                  <View className="flex-row items-center gap-1">
                    <badge.icon color={badge.color} width={14} height={14} />
                    <Text className="text-xs text-white/60">
                      {t(badge.labelKey)}
                    </Text>
                  </View>
                  {index < theme.badges!.length - 1 && (
                    <View className="size-1 rounded-full bg-white/40" />
                  )}
                </React.Fragment>
              ))}
            </MotiView>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
