/* eslint-disable max-lines-per-function */
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import {
  Button,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { useIsFirstTime } from '@/lib/hooks';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Mock phone frame with placeholder
function PhoneMockup() {
  return (
    <View className="items-center justify-center">
      {/* Phone frame */}
      <View
        className="overflow-hidden rounded-[40px] bg-midnight"
        style={{
          width: SCREEN_WIDTH * 0.8,
          height: SCREEN_HEIGHT * 0.5,
          maxWidth: 345,
          maxHeight: 700,
        }}
      >
        {/* Phone screen with placeholder */}
        <View className="flex-1 items-center justify-center bg-charcoal-800">
          {/* Placeholder for profile image */}
          <View className="size-48 items-center justify-center rounded-full bg-brand-200">
            <Text className="text-4xl">👤</Text>
          </View>
          <Text className="mt-4 text-center text-lg font-semibold text-white">
            For You
          </Text>
        </View>

        {/* Phone notch */}
        <View className="absolute left-1/2 top-2 h-6 w-32 -translate-x-1/2 rounded-full bg-midnight" />
      </View>

      {/* Glow effect behind phone */}
      <View
        className="absolute -z-10 rounded-full bg-brand-300 opacity-30 blur-3xl"
        style={{
          width: SCREEN_WIDTH * 1.2,
          height: SCREEN_HEIGHT * 0.4,
        }}
      />
    </View>
  );
}

// Pagination dots
function PaginationDots({
  currentIndex = 0,
  total = 3,
}: {
  currentIndex?: number;
  total?: number;
}) {
  return (
    <View className="flex-row items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          className={`rounded-full ${
            index === currentIndex
              ? 'h-2 w-8 bg-brand-400'
              : 'size-2 bg-neutral-300'
          }`}
        />
      ))}
    </View>
  );
}

// Curved white bottom section
function CurvedBottom({ children }: { children: React.ReactNode }) {
  return (
    <View className="absolute inset-x-0 bottom-0">
      {/* SVG curved top */}
      <Svg
        width={SCREEN_WIDTH}
        height={100}
        viewBox={`0 0 ${SCREEN_WIDTH} 100`}
        style={{ position: 'absolute', top: -99 }}
      >
        <Defs>
          <LinearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="white" stopOpacity="0" />
            <Stop offset="1" stopColor="white" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect
          x="0"
          y="0"
          width={SCREEN_WIDTH}
          height="100"
          fill="url(#curveGrad)"
        />
      </Svg>

      {/* White content area */}
      <View className="bg-white px-6 pb-9 pt-6">{children}</View>
    </View>
  );
}

export default function Onboarding() {
  const [_, setIsFirstTime] = useIsFirstTime();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const handleContinue = () => {
    if (currentIndex < 2) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsFirstTime(false);
      router.replace('/login');
    }
  };

  const handleSkip = () => {
    setIsFirstTime(false);
    router.replace('/login');
  };

  return (
    <View className="flex-1 bg-brand-400">
      <FocusAwareStatusBar />

      {/* Main content */}
      <View className="flex-1 items-center justify-center pt-20">
        <PhoneMockup />
      </View>

      {/* Bottom curved section */}
      <CurvedBottom>
        {/* Title and description */}
        <View className="mb-6 gap-3">
          <Text className="text-center font-urbanist-bold text-3xl leading-[1.4] tracking-[0px] text-midnight">
            Welcome to Lovify - Where Love Meets AI!
          </Text>
          <Text className="text-center text-lg leading-[1.6] tracking-[0.2px] text-neutral-700">
            Discover a new way to connect with Lovify, the AI dating app that
            revolutionizes the way you find love. Get started now!
          </Text>
        </View>

        {/* Pagination dots */}
        <View className="mb-6">
          <PaginationDots currentIndex={currentIndex} total={3} />
        </View>

        {/* Buttons */}
        <SafeAreaView edges={['bottom']}>
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Button
                label="Skip"
                variant="secondary"
                onPress={handleSkip}
                testID="onboarding-skip-button"
              />
            </View>
            <View className="flex-1">
              <Button
                label="Continue"
                variant="default"
                onPress={handleContinue}
                testID="onboarding-continue-button"
              />
            </View>
          </View>
        </SafeAreaView>
      </CurvedBottom>
    </View>
  );
}

