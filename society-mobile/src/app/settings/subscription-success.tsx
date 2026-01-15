import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { FocusAwareStatusBar, Text, View } from '@/components/ui';

function CrownIcon() {
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48" fill="none">
      <Path
        d="M6 20L12 14L18 20L24 14L30 20L36 14L42 20V38H6V20Z"
        fill="white"
        stroke="white"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M6 38H42V42H6V38Z"
        fill="white"
        stroke="white"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17L4 12"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ConfettiPiece({
  color,
  rotation,
  top,
  left,
}: {
  color: string;
  rotation: string;
  top: number;
  left: number;
}) {
  return (
    <View
      className="absolute h-4 w-1.5"
      style={{
        backgroundColor: color,
        transform: [{ rotate: rotation }],
        top,
        left,
      }}
    />
  );
}

const BENEFITS = [
  'Ad-free experience',
  'Unlimited access to all premium contents',
  'Unlimited daily interactions with AI characters',
  'Advanced customization for AI characters',
  'Early access to new features',
  'Priority customer support',
];

export default function SubscriptionSuccessScreen() {
  const handleContinue = React.useCallback(() => {
    // Navigate back to main app or settings
    router.push('/(app)');
  }, []);

  return (
    <View className="flex-1 bg-neutral-900">
      <FocusAwareStatusBar />

      {/* Confetti Decorations */}
      <ConfettiPiece color="#C9A961" rotation="25deg" top={40} left={40} />
      <ConfettiPiece color="#3B82F6" rotation="-15deg" top={60} left={100} />
      <ConfettiPiece color="#10B981" rotation="45deg" top={50} left={160} />
      <ConfettiPiece color="#F59E0B" rotation="-30deg" top={80} left={220} />
      <ConfettiPiece color="#8B5CF6" rotation="15deg" top={55} left={280} />
      <ConfettiPiece color="#EF4444" rotation="-45deg" top={70} left={340} />
      <ConfettiPiece color="#EC4899" rotation="60deg" top={120} left={60} />
      <ConfettiPiece color="#06B6D4" rotation="-20deg" top={95} left={320} />

      {/* Crown Icon */}
      <View className="mt-24 items-center">
        <View className="size-32 items-center justify-center rounded-full bg-primary-400">
          <CrownIcon />
        </View>
      </View>

      {/* Title */}
      <View className="mt-8 items-center px-6">
        <Text
          className="text-4xl font-bold leading-[1.2] text-offwhite"
          style={styles.title}
        >
          Congratulations!
        </Text>
        <Text className="text-platinum mt-3 text-center text-lg leading-[1.6] tracking-[0.2px]">
          You're Now a Lovify Premium Member!
        </Text>
      </View>

      {/* Benefits Section */}
      <View className="mt-12 px-6">
        <Text
          className="mb-6 text-2xl font-bold leading-[1.4] text-offwhite"
          style={styles.benefitsTitle}
        >
          Benefits Unlocked:
        </Text>

        <View className="gap-4">
          {BENEFITS.map((benefit, index) => (
            <View key={index} className="flex-row gap-3">
              <View className="pt-0.5">
                <CheckIcon />
              </View>
              <Text className="flex-1 text-lg leading-[1.6] tracking-[0.2px] text-offwhite">
                {benefit}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Renewal Notice */}
      <View className="mt-8 px-6">
        <Text className="text-center text-sm leading-[1.6] tracking-[0.2px] text-neutral-500">
          Your subscription will automatically renew annually unless canceled.
          Manage your subscription in your account settings.
        </Text>
      </View>

      {/* Continue Button */}
      <View className="absolute inset-x-0 bottom-0 px-6 pb-9 pt-6">
        <Pressable
          onPress={handleContinue}
          className="items-center justify-center rounded-full bg-primary-400 py-4"
          testID="continue-button"
        >
          <Text
            className="text-base font-bold leading-[1.6] tracking-[0.2px] text-midnight"
            style={styles.buttonText}
          >
            Start Exploring Premium Features
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Urbanist_700Bold',
    letterSpacing: 0,
  },
  benefitsTitle: {
    fontFamily: 'Urbanist_700Bold',
    letterSpacing: 0,
  },
  buttonText: {
    fontFamily: 'Urbanist_700Bold',
    letterSpacing: 0,
  },
});
