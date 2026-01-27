import React from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { FocusAwareStatusBar, Text, View } from '@/components/ui';
import { Image } from 'expo-image';

// Hireme Logo Component with animation
function HiremeLogo({ size = 160 }: { size?: number }) {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View
      className="items-center justify-center rounded-full bg-white/10"
      style={[{ width: size, height: size }, animatedStyle]}
    >
      <Svg width={size * 0.7} height={size * 0.7} viewBox="0 0 100 100">
        <G>
          {/* Elegant S monogram for Hireme */}
          <Circle
            cx="50"
            cy="50"
            r="45"
            stroke="#FFFFFF"
            strokeWidth="2"
            fill="none"
            opacity="0.3"
          />
          <Path
            d="M50 15 C30 15 20 25 20 35 C20 45 28 52 42 52 C56 52 68 58 68 70 C68 82 58 85 50 85"
            stroke="#FFFFFF"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Accent dots */}
          <Circle cx="50" cy="15" r="3" fill="#FFFFFF" />
          <Circle cx="50" cy="85" r="3" fill="#FFFFFF" />
        </G>
      </Svg>
    </Animated.View>
  );
}

// Loading Spinner Component
function LoadingSpinner() {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1200,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <View className="size-20 items-center justify-center rounded-full border-4 border-white/20 border-t-white" />
    </Animated.View>
  );
}

interface SplashScreenProps {
  /** App name to display */
  appName?: string;
  /** Background color variant */
  variant?: 'brand' | 'dark' | 'primary';
  /** Show loading spinner */
  showLoading?: boolean;
  /** Optional subtitle */
  subtitle?: string;
}

export function SplashScreen({
  appName = 'Hireme',
  variant = 'brand',
  showLoading = true,
  subtitle,
}: SplashScreenProps) {
  const bgColorClass = {
    brand: 'bg-brand-400',
    dark: 'bg-midnight',
    primary: 'bg-primary-600',
  }[variant];

  return (
    <View className={`flex-1 ${bgColorClass}`}>
      {/* Status Bar */}
      <FocusAwareStatusBar />

      {/* Center Content */}
      <View className="absolute inset-0 items-center justify-center">
        <View className="items-center gap-8">
          {/* Logo */}
          <Image source={require('../../assets/logo.png')} style={{ width: 160, height: 160 }} />

          {/* App Name */}
          <View className="items-center gap-2">
            <Text className="text-center font-urbanist-bold text-5xl leading-[56px] tracking-tight text-white">
              {appName}
            </Text>

            {subtitle && (
              <Text className="text-center font-urbanist-semibold text-base tracking-[0.2px] text-white/80">
                {subtitle}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Loading Spinner at Bottom */}
      {showLoading && (
        <View className="absolute inset-x-0 bottom-20 items-center">
          <LoadingSpinner />
        </View>
      )}
    </View>
  );
}
