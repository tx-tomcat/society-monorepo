/* eslint-disable max-lines-per-function */
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { ArrowLeft } from '@/components/ui/icons';

type SubscriptionPlan = 'monthly' | 'yearly';

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

const FEATURES = [
  'Ad-free experience.',
  'Unlock and unlimited access to all premium contents.',
  'Unlimited swipe, chat and daily interactions with AI characters.',
  'Advanced customization options for creating AI characters.',
  'Early access to new features and beta tests.',
  'Priority customer support.',
];

type PlanDetailsProps = {
  plan: SubscriptionPlan;
};

function PlanDetails({ plan }: PlanDetailsProps) {
  const isMonthly = plan === 'monthly';
  const price = isMonthly ? '$4.99' : '$49.99';
  const period = isMonthly ? 'month' : 'year';
  const savings = isMonthly ? null : 'Save 17%';

  return (
    <View className="flex-1 px-6 py-8">
      {/* Plan Header */}
      <View className="items-center gap-2">
        <View className="flex-row items-center gap-3">
          <Text
            className="text-2xl font-bold leading-[1.4] text-offwhite"
            style={styles.planTitle}
          >
            Society Premium
          </Text>
          {savings && (
            <View className="rounded-lg bg-gold-400 px-3 py-1">
              <Text className="text-sm font-semibold leading-[1.6] tracking-[0.2px] text-midnight">
                {savings}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row items-end">
          <Text
            className="text-6xl font-bold leading-[1.2] text-offwhite"
            style={styles.price}
          >
            {price}
          </Text>
          <Text className="mb-2 ml-2 text-xl leading-[1.4] text-platinum">
            / {period}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View className="my-8 h-px w-full bg-neutral-700" />

      {/* Features List */}
      <View className="gap-6">
        {FEATURES.map((feature, index) => (
          <View key={index} className="flex-row gap-4">
            <View className="pt-1">
              <CheckIcon />
            </View>
            <Text className="flex-1 text-lg leading-[1.6] tracking-[0.2px] text-offwhite">
              {feature}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function SubscriptionScreen() {
  const [selectedPlan, setSelectedPlan] =
    React.useState<SubscriptionPlan>('monthly');

  const handleBack = React.useCallback(() => {
    router.back();
  }, []);

  const handleContinue = React.useCallback(() => {
    const price = selectedPlan === 'monthly' ? '4.99' : '49.99';
    console.log(`Continue with ${selectedPlan} plan - $${price}`);
    // TODO: Implement payment flow with payment provider (Stripe, etc.)
    // After successful payment, navigate to success screen
    router.push('/settings/subscription-success');
  }, [selectedPlan]);

  return (
    <View className="flex-1 bg-midnight">
      <FocusAwareStatusBar />

      {/* Header */}
      <SafeAreaView edges={['top']} className="bg-midnight">
        <View className="flex-row items-center px-6 py-3">
          <Pressable onPress={handleBack} testID="back-button" className="w-7">
            <ArrowLeft color="white" size={28} />
          </Pressable>

          <Text
            className="flex-1 text-center text-2xl font-bold leading-[1.4] text-offwhite"
            style={styles.headerTitle}
          >
            Upgrade Plan
          </Text>

          <View className="w-7" />
        </View>
      </SafeAreaView>

      {/* Tabs */}
      <View className="flex-row gap-3 px-6 py-4">
        <Pressable
          onPress={() => setSelectedPlan('monthly')}
          className={`flex-1 items-center rounded-lg py-4 ${
            selectedPlan === 'monthly' ? 'bg-gold-400' : 'bg-neutral-800'
          }`}
          testID="monthly-tab"
        >
          <Text
            className={`text-base font-semibold leading-[1.6] tracking-[0.2px] ${
              selectedPlan === 'monthly' ? 'text-midnight' : 'text-platinum'
            }`}
          >
            Monthly
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setSelectedPlan('yearly')}
          className={`flex-1 items-center rounded-lg py-4 ${
            selectedPlan === 'yearly' ? 'bg-gold-400' : 'bg-neutral-800'
          }`}
          testID="yearly-tab"
        >
          <Text
            className={`text-base font-semibold leading-[1.6] tracking-[0.2px] ${
              selectedPlan === 'yearly' ? 'text-midnight' : 'text-platinum'
            }`}
          >
            Yearly
          </Text>
        </Pressable>
      </View>

      {/* Plan Content */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <PlanDetails plan={selectedPlan} />
      </ScrollView>

      {/* Continue Button */}
      <View className="absolute inset-x-0 bottom-0 bg-midnight px-6 pb-9 pt-6">
        <Pressable
          onPress={handleContinue}
          className="items-center justify-center rounded-full bg-gold-400 py-4"
          testID="continue-button"
        >
          <Text
            className="text-base font-bold leading-[1.6] tracking-[0.2px] text-midnight"
            style={styles.continueButtonText}
          >
            Continue - {selectedPlan === 'monthly' ? '$4.99' : '$49.99'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontFamily: 'Urbanist_700Bold',
    letterSpacing: 0,
  },
  planTitle: {
    fontFamily: 'Urbanist_700Bold',
    letterSpacing: 0,
  },
  price: {
    fontFamily: 'Urbanist_700Bold',
    letterSpacing: 0,
  },
  continueButtonText: {
    fontFamily: 'Urbanist_700Bold',
    letterSpacing: 0,
  },
});
