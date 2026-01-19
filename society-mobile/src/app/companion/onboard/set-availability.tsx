/* eslint-disable max-lines-per-function */
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { showMessage } from 'react-native-flash-message';

import {
  Button,
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { ArrowLeft, Calendar, CheckCircle, Clock } from '@/components/ui/icons';
import { companionsService } from '@/lib/api/services/companions.service';
import {
  type DayOfWeek as DayOfWeekStore,
  type TimeSlot as TimeSlotStore,
  useCompanionOnboarding,
} from '@/lib/stores';

type DayConfig = {
  id: DayOfWeekStore;
  shortKey: string;
  fullKey: string;
};

const DAYS: DayConfig[] = [
  {
    id: 'mon',
    shortKey: 'common.days.mon_short',
    fullKey: 'common.days.monday',
  },
  {
    id: 'tue',
    shortKey: 'common.days.tue_short',
    fullKey: 'common.days.tuesday',
  },
  {
    id: 'wed',
    shortKey: 'common.days.wed_short',
    fullKey: 'common.days.wednesday',
  },
  {
    id: 'thu',
    shortKey: 'common.days.thu_short',
    fullKey: 'common.days.thursday',
  },
  {
    id: 'fri',
    shortKey: 'common.days.fri_short',
    fullKey: 'common.days.friday',
  },
  {
    id: 'sat',
    shortKey: 'common.days.sat_short',
    fullKey: 'common.days.saturday',
  },
  {
    id: 'sun',
    shortKey: 'common.days.sun_short',
    fullKey: 'common.days.sunday',
  },
];

const TIME_SLOTS: {
  id: TimeSlotStore;
  labelKey: string;
  time: string;
}[] = [
  {
    id: 'morning',
    labelKey: 'companion.onboard.set_availability.slots.morning',
    time: '8:00 - 12:00',
  },
  {
    id: 'afternoon',
    labelKey: 'companion.onboard.set_availability.slots.afternoon',
    time: '12:00 - 17:00',
  },
  {
    id: 'evening',
    labelKey: 'companion.onboard.set_availability.slots.evening',
    time: '17:00 - 22:00',
  },
];

export default function SetAvailability() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Get data from store
  const storedSelectedDays = useCompanionOnboarding.use.selectedDays();
  const storedSelectedSlots = useCompanionOnboarding.use.selectedSlots();
  const storedAdvanceNotice = useCompanionOnboarding.use.advanceNoticeHours();
  const setAvailabilityData = useCompanionOnboarding.use.setAvailabilityData();
  const getAvailabilitySlots =
    useCompanionOnboarding.use.getAvailabilitySlots();
  const getServiceTypes = useCompanionOnboarding.use.getServiceTypes();
  const markStepComplete = useCompanionOnboarding.use.markStepComplete();
  const reset = useCompanionOnboarding.use.reset();

  // Profile data for submission
  const displayName = useCompanionOnboarding.use.displayName();
  const bio = useCompanionOnboarding.use.bio();
  const hourlyRate = useCompanionOnboarding.use.hourlyRate();
  const halfDayRate = useCompanionOnboarding((state) => state.halfDayRate);
  const fullDayRate = useCompanionOnboarding((state) => state.fullDayRate);

  const [selectedDays, setSelectedDays] =
    React.useState<DayOfWeekStore[]>(storedSelectedDays);
  const [selectedSlots, setSelectedSlots] =
    React.useState<TimeSlotStore[]>(storedSelectedSlots);
  const [advanceNotice, setAdvanceNotice] = React.useState(
    storedAdvanceNotice.toString()
  );

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleToggleDay = React.useCallback((dayId: DayOfWeekStore) => {
    setSelectedDays((prev) =>
      prev.includes(dayId)
        ? prev.filter((id) => id !== dayId)
        : [...prev, dayId]
    );
  }, []);

  const handleToggleSlot = React.useCallback((slotId: TimeSlotStore) => {
    setSelectedSlots((prev) =>
      prev.includes(slotId)
        ? prev.filter((id) => id !== slotId)
        : [...prev, slotId]
    );
  }, []);

  const handleComplete = React.useCallback(async () => {
    if (isSubmitting) return;

    // Save availability to store first
    setAvailabilityData({
      selectedDays,
      selectedSlots,
      advanceNoticeHours: parseInt(advanceNotice, 10) || 24,
    });

    setIsSubmitting(true);

    try {
      // Get the computed availability slots and service types
      const availabilitySlots = getAvailabilitySlots();
      const serviceTypes = getServiceTypes();

      // Update profile
      await companionsService.updateMyProfile({
        bio,
        hourlyRate,
        halfDayRate,
        fullDayRate,
      });

      // Update availability
      await companionsService.updateAvailability(availabilitySlots);

      // Update services
      await companionsService.updateServices(
        serviceTypes.map((type) => ({
          type: type as
            | 'FAMILY_INTRODUCTION'
            | 'WEDDING_ATTENDANCE'
            | 'TET_COMPANIONSHIP'
            | 'BUSINESS_EVENT'
            | 'CASUAL_OUTING'
            | 'CLASS_REUNION'
            | 'OTHER',
          isAvailable: true,
        }))
      );

      markStepComplete('set-availability');
      markStepComplete('complete');

      showMessage({
        message: t('companion.onboard.set_availability.setup_complete'),
        description: t(
          'companion.onboard.set_availability.setup_complete_description'
        ),
        type: 'success',
        duration: 4000,
      });

      // Reset onboarding state and navigate to dashboard
      reset();
      router.replace('/companion/(app)' as Href);
    } catch (error) {
      console.error('Setup completion error:', error);
      showMessage({
        message: t('companion.onboard.set_availability.setup_error'),
        description: t(
          'companion.onboard.set_availability.setup_error_description'
        ),
        type: 'danger',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    selectedDays,
    selectedSlots,
    advanceNotice,
    setAvailabilityData,
    getAvailabilitySlots,
    getServiceTypes,
    bio,
    hourlyRate,
    halfDayRate,
    fullDayRate,
    markStepComplete,
    reset,
    router,
    t,
  ]);

  // Validation states
  const hasNoDaysSelected = selectedDays.length === 0;
  const hasNoSlotsSelected = selectedSlots.length === 0;

  const isValid = selectedDays.length >= 1 && selectedSlots.length >= 1;

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable onPress={handleBack}>
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text
            style={styles.headerTitle}
            className="flex-1 text-xl text-midnight"
          >
            {t('companion.onboard.set_availability.header')}
          </Text>
          <Text className="text-sm text-text-tertiary">
            {t('companion.onboard.step', { current: 4, total: 4 })}
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Days Selection */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          className="mb-6"
        >
          <View className="mb-3 flex-row items-center gap-2">
            <Calendar color={colors.lavender[400]} width={20} height={20} />
            <Text className="text-lg font-semibold text-midnight">
              {t('companion.onboard.set_availability.available_days')}
            </Text>
          </View>
          <Text className="mb-4 text-sm text-text-secondary">
            {t('companion.onboard.set_availability.available_days_description')}
          </Text>

          <View className="flex-row gap-2">
            {DAYS.map((day) => {
              const isSelected = selectedDays.includes(day.id);
              return (
                <Pressable
                  key={day.id}
                  onPress={() => handleToggleDay(day.id)}
                  className={`flex-1 items-center rounded-xl py-4 ${
                    isSelected
                      ? 'bg-lavender-400'
                      : 'border border-border-light bg-white'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      isSelected ? 'text-white' : 'text-midnight'
                    }`}
                  >
                    {t(day.shortKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {hasNoDaysSelected && (
            <Text className="mt-2 text-xs text-danger-400">
              {t('companion.onboard.set_availability.select_day_error')}
            </Text>
          )}
        </MotiView>

        {/* Time Slots */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 100 }}
          className="mb-6"
        >
          <View className="mb-3 flex-row items-center gap-2">
            <Clock color={colors.lavender[400]} width={20} height={20} />
            <Text className="text-lg font-semibold text-midnight">
              {t('companion.onboard.set_availability.preferred_slots')}
            </Text>
          </View>
          <Text className="mb-4 text-sm text-text-secondary">
            {t(
              'companion.onboard.set_availability.preferred_slots_description'
            )}
          </Text>

          <View className="gap-3">
            {TIME_SLOTS.map((slot) => {
              const isSelected = selectedSlots.includes(slot.id);
              return (
                <Pressable
                  key={slot.id}
                  onPress={() => handleToggleSlot(slot.id)}
                  className={`flex-row items-center justify-between rounded-xl p-4 ${
                    isSelected
                      ? 'border border-lavender-400 bg-lavender-400/10'
                      : 'border border-border-light bg-white'
                  }`}
                >
                  <View>
                    <Text className="font-semibold text-midnight">
                      {t(slot.labelKey)}
                    </Text>
                    <Text className="text-sm text-text-secondary">
                      {slot.time}
                    </Text>
                  </View>
                  <View
                    className={`size-6 items-center justify-center rounded-full border-2 ${
                      isSelected
                        ? 'border-lavender-400 bg-lavender-400'
                        : 'border-border-light'
                    }`}
                  >
                    {isSelected && (
                      <CheckCircle color="#FFFFFF" width={16} height={16} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
          {hasNoSlotsSelected && (
            <Text className="mt-2 text-xs text-danger-400">
              {t('companion.onboard.set_availability.select_slot_error')}
            </Text>
          )}
        </MotiView>

        {/* Advance Notice */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 200 }}
          className="mb-6"
        >
          <Text className="mb-3 text-lg font-semibold text-midnight">
            {t('companion.onboard.set_availability.advance_notice')}
          </Text>
          <Text className="mb-4 text-sm text-text-secondary">
            {t('companion.onboard.set_availability.advance_notice_description')}
          </Text>

          <View className="flex-row gap-2">
            {['6', '12', '24', '48'].map((hours) => (
              <Pressable
                key={hours}
                onPress={() => setAdvanceNotice(hours)}
                className={`flex-1 items-center rounded-xl py-3 ${
                  advanceNotice === hours
                    ? 'bg-lavender-400'
                    : 'border border-border-light bg-white'
                }`}
              >
                <Text
                  className={`font-semibold ${
                    advanceNotice === hours ? 'text-white' : 'text-midnight'
                  }`}
                >
                  {hours}h
                </Text>
              </Pressable>
            ))}
          </View>
        </MotiView>

        {/* Summary */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 300 }}
          className="rounded-2xl bg-lavender-400/10 p-4"
        >
          <Text className="mb-2 text-sm font-semibold text-lavender-400">
            {t('companion.onboard.set_availability.summary_title')}
          </Text>
          <Text className="text-sm text-text-secondary">
            {t('companion.onboard.set_availability.summary_text', {
              days: selectedDays.length,
              slots: selectedSlots.length,
              hours: advanceNotice,
            })}
          </Text>
        </MotiView>

        {/* Note */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 400 }}
          className="mt-4"
        >
          <Text className="text-center text-xs text-text-tertiary">
            {t('companion.onboard.set_availability.adjust_anytime')}
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
            label={t('companion.onboard.set_availability.complete_setup')}
            onPress={handleComplete}
            disabled={!isValid}
            variant="default"
            size="lg"
            className="w-full bg-lavender-400"
          />
          <Text className="mt-2 text-center text-xs text-text-tertiary">
            {t('companion.onboard.set_availability.review_notice')}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontFamily: 'Urbanist_700Bold',
  },
});
