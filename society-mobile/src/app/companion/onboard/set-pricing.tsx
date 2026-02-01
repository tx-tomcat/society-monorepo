/* eslint-disable max-lines-per-function */
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, TextInput } from 'react-native';

import {
  Button,
  colors,
  CompanionHeader,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { Info, PriceTag } from '@/components/ui/icons';
import { usePlatformConfigStore } from '@/lib/hooks';
import { useCompanionOnboarding } from '@/lib/stores';
import { formatVND } from '@/lib/utils';

const SUGGESTED_RATES = [300000, 400000, 500000, 600000, 800000];

export default function SetPricing() {
  const router = useRouter();
  const { t } = useTranslation();

  // Get data from store
  const storedHourlyRate = useCompanionOnboarding.use.hourlyRate();
  const storedMinimumHours = useCompanionOnboarding.use.minimumHours();
  const setPricingData = useCompanionOnboarding.use.setPricingData();
  const markStepComplete = useCompanionOnboarding.use.markStepComplete();
  const platformFeePercent = usePlatformConfigStore((s) => s.config.platformFeePercent);

  const [hourlyRate, setHourlyRate] = React.useState(
    storedHourlyRate.toString()
  );
  const [minimumHours, setMinimumHours] = React.useState(
    storedMinimumHours.toString()
  );

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleSelectRate = React.useCallback((rate: number) => {
    setHourlyRate(rate.toString());
  }, []);

  const handleContinue = React.useCallback(() => {
    const hourlyRateNum = parseInt(hourlyRate, 10) || 500000;
    const minHoursNum = parseInt(minimumHours, 10) || 2;

    // Calculate optional rates
    const halfDayRate = Math.round(hourlyRateNum * 4 * 0.9); // 10% discount for 4 hours
    const fullDayRate = Math.round(hourlyRateNum * 8 * 0.8); // 20% discount for 8 hours

    // Save to store
    setPricingData({
      hourlyRate: hourlyRateNum,
      minimumHours: minHoursNum,
      halfDayRate,
      fullDayRate,
    });
    markStepComplete('set-pricing');

    // Navigate to verify identity (last step)
    router.push('/companion/onboard/verify-identity' as Href);
  }, [hourlyRate, minimumHours, setPricingData, markStepComplete, router]);

  const hourlyRateNum = parseInt(hourlyRate, 10) || 0;
  const minHoursNum = parseInt(minimumHours, 10) || 2;
  const platformFee = Math.round(hourlyRateNum * platformFeePercent);
  const yourEarnings = hourlyRateNum - platformFee;

  const estimatedMonthly = yourEarnings * minHoursNum * 20; // 20 bookings per month estimate

  // Validation states
  const MIN_RATE = 100000; // 100k
  const MAX_RATE = 50000000; // 50m
  const isBelowMinimum = hourlyRateNum > 0 && hourlyRateNum < MIN_RATE;
  const isAboveMaximum = hourlyRateNum > MAX_RATE;

  const isValid =
    hourlyRateNum >= MIN_RATE && hourlyRateNum <= MAX_RATE && minHoursNum >= 1;

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <CompanionHeader
        title={t('companion.onboard.set_pricing.header')}
        onBack={handleBack}
        rightElement={
          <Text className="text-sm text-text-tertiary">
            {t('companion.onboard.step', { current: 2, total: 3 })}
          </Text>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hourly Rate */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          className="mb-6"
        >
          <Text className="mb-2 text-lg font-semibold text-midnight">
            {t('companion.onboard.set_pricing.hourly_rate')}
          </Text>
          <View
            className={`flex-row items-center gap-2 rounded-xl border bg-white px-4 ${isBelowMinimum || isAboveMaximum
              ? 'border-danger-400'
              : 'border-border-light'
              }`}
          >
            <PriceTag
              color={
                isBelowMinimum || isAboveMaximum
                  ? colors.danger[400]
                  : colors.lavender[400]
              }
              width={24}
              height={24}
            />
            <TextInput
              value={formatVND(parseInt(hourlyRate, 10) || 0, {
                showSymbol: false,
              })}
              onChangeText={(text) => setHourlyRate(text.replace(/\D/g, ''))}
              keyboardType="number-pad"
              className="flex-1 py-4 text-2xl font-bold"
              style={{ fontFamily: 'Urbanist_700Bold', color: colors.midnight.DEFAULT }}
            />
            <Text className="text-lg text-text-secondary">
              {t('companion.onboard.set_pricing.per_hour')}
            </Text>
          </View>

          {/* Validation Messages */}
          {isBelowMinimum && (
            <Text className="mt-2 text-sm text-danger-400">
              {t('companion.onboard.set_pricing.minimum_rate_error', {
                amount: formatVND(MIN_RATE),
              })}
            </Text>
          )}
          {isAboveMaximum && (
            <Text className="mt-2 text-sm text-danger-400">
              {t('companion.onboard.set_pricing.maximum_rate_error', {
                amount: formatVND(MAX_RATE),
              })}
            </Text>
          )}

          {/* Suggested Rates */}
          <View className="mt-3 flex-row flex-wrap gap-2">
            {SUGGESTED_RATES.map((rate) => (
              <Pressable
                key={rate}
                onPress={() => handleSelectRate(rate)}
                className={`rounded-full px-4 py-2 ${hourlyRateNum === rate
                  ? 'bg-lavender-400'
                  : 'border border-border-light bg-white'
                  }`}
              >
                <Text
                  className={`text-sm font-medium ${hourlyRateNum === rate ? 'text-white' : 'text-midnight'
                    }`}
                >
                  {formatVND(rate)}
                </Text>
              </Pressable>
            ))}
          </View>
        </MotiView>

        {/* Minimum Hours */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 100 }}
          className="mb-6"
        >
          <Text className="mb-2 text-lg font-semibold text-midnight">
            {t('companion.onboard.set_pricing.minimum_hours')}
          </Text>
          <View className="flex-row items-center gap-3">
            {[2, 3, 4, 5, 6].map((hours) => (
              <Pressable
                key={hours}
                onPress={() => setMinimumHours(hours.toString())}
                className={`flex-1 items-center rounded-xl border py-3 ${minHoursNum === hours
                  ? 'border-lavender-400 bg-lavender-400/10'
                  : 'border-border-light bg-white'
                  }`}
              >
                <Text
                  className={`text-lg font-semibold ${minHoursNum === hours
                    ? 'text-lavender-400'
                    : 'text-midnight'
                    }`}
                >
                  {hours}h
                </Text>
              </Pressable>
            ))}
          </View>
        </MotiView>

        {/* Earnings Breakdown */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 200 }}
          className="mb-6 rounded-2xl bg-white p-4"
        >
          <Text className="mb-4 text-lg font-semibold text-midnight">
            {t('companion.onboard.set_pricing.earnings_breakdown')}
          </Text>
          <View className="gap-3">
            <View className="flex-row justify-between">
              <Text className="text-text-secondary">
                {t('companion.onboard.set_pricing.your_hourly_rate')}
              </Text>
              <Text className="font-medium text-midnight">
                {formatVND(parseInt(hourlyRate, 10) || 0)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-text-secondary">
                {t('companion.onboard.set_pricing.platform_fee')}
              </Text>
              <Text className="font-medium text-rose-400">
                -{formatVND(platformFee)}
              </Text>
            </View>
            <View className="h-px bg-border-light" />
            <View className="flex-row justify-between">
              <Text className="font-semibold text-midnight">
                {t('companion.onboard.set_pricing.you_earn')}
              </Text>
              <Text className="text-xl font-bold text-teal-400">
                {formatVND(yourEarnings)}
              </Text>
            </View>
          </View>
        </MotiView>

        {/* Monthly Estimate */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 300 }}
          className="mb-6 rounded-2xl bg-lavender-400/10 p-4"
        >
          <View className="flex-row items-center gap-2">
            <Info color={colors.lavender[400]} width={20} height={20} />
            <Text className="text-sm font-semibold text-lavender-400">
              {t('companion.onboard.set_pricing.estimated_monthly')}
            </Text>
          </View>
          <Text className="font-urbanist-bold mt-2 text-3xl text-midnight">
            {formatVND(estimatedMonthly)}
          </Text>
          <Text className="mt-1 text-xs text-text-secondary">
            {t('companion.onboard.set_pricing.estimate_basis', {
              bookings: 20,
              hours: minHoursNum,
            })}
          </Text>
        </MotiView>

        {/* Tip */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 400 }}
          className="rounded-xl bg-teal-400/10 p-4"
        >
          <Text className="text-sm text-text-secondary">
            <Text className="font-semibold text-teal-700">
              {t('companion.onboard.set_pricing.pro_tip_label')}
            </Text>
            {t('companion.onboard.set_pricing.pro_tip_text')}
          </Text>
        </MotiView>
      </ScrollView>

      {/* Bottom CTA */}
      <SafeAreaView
        edges={['bottom']}
        className="border-t border-border-light bg-white"
      >
        <View className="px-6 py-4">
          <Button
            label={t('common.continue')}
            onPress={handleContinue}
            disabled={!isValid}
            variant="default"
            size="lg"
            className="w-full bg-lavender-900"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
