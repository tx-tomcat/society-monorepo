/* eslint-disable max-lines-per-function */
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
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
import { SocietyLogo, ShieldCheck, Star, Heart } from '@/components/ui/icons';

const { width, height } = Dimensions.get('window');

// Feature highlights - labels are translation keys
const features = [
  { icon: ShieldCheck, labelKey: 'hirer.splash.features.verified', color: colors.teal[400] },
  { icon: Star, labelKey: 'hirer.splash.features.premium', color: colors.yellow[400] },
  { icon: Heart, labelKey: 'hirer.splash.features.trusted', color: colors.rose[400] },
];

export default function HirerSplash() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleGetStarted = React.useCallback(() => {
    router.push('/hirer/auth/login' as Href);
  }, [router]);

  const handleLogin = React.useCallback(() => {
    router.push('/hirer/auth/login' as Href);
  }, [router]);

  return (
    <View className="flex-1">
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

      <SafeAreaView className="flex-1">
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
              Society
            </Text>
            <Text className="mt-2 text-center text-lg text-white/80">
              {t('hirer.splash.tagline')}
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
              {t('hirer.splash.hero_title')}
            </Text>
            <Text className="mt-4 text-center text-base leading-relaxed text-white/70">
              {t('hirer.splash.hero_subtitle')}
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
                key={feature.labelKey}
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 400, delay: 500 + index * 100 }}
                className="items-center"
              >
                <View className="mb-2 size-12 items-center justify-center rounded-full bg-white/10">
                  <feature.icon color={feature.color} width={24} height={24} />
                </View>
                <Text className="text-center text-xs text-white/70">{t(feature.labelKey)}</Text>
              </MotiView>
            ))}
          </MotiView>

          {/* CTA Buttons */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 600 }}
            className="mb-8 mt-10 gap-4"
          >
            <Button
              label={t('hirer.splash.get_started')}
              onPress={handleGetStarted}
              variant="default"
              size="lg"
              fullWidth
              testID="get-started-button"
            />
            <Pressable onPress={handleLogin} className="py-3">
              <Text className="text-center text-base text-white">
                {t('hirer.splash.already_have_account')}{' '}
                <Text className="font-bold text-rose-400">{t('auth.welcome.sign_in')}</Text>
              </Text>
            </Pressable>
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
