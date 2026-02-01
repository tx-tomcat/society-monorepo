/* eslint-disable max-lines-per-function */
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch } from 'react-native';

import {
  Button,
  colors,
  CompanionHeader,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { Calendar, Clock } from '@/components/ui/icons';
import type { CompanionAvailability, RecurringAvailabilitySlot } from '@/lib/api/services/companions.service';
import {
  useMyCompanionAvailability,
  useSafeBack,
  useUpdateCompanionAvailability,
} from '@/lib/hooks';

type DayConfig = {
  dayOfWeek: number;
  labelKey: string;
  shortLabelKey: string;
};

const DAYS: DayConfig[] = [
  { dayOfWeek: 1, labelKey: 'common.days.monday', shortLabelKey: 'common.days.mon_short' },
  { dayOfWeek: 2, labelKey: 'common.days.tuesday', shortLabelKey: 'common.days.tue_short' },
  { dayOfWeek: 3, labelKey: 'common.days.wednesday', shortLabelKey: 'common.days.wed_short' },
  { dayOfWeek: 4, labelKey: 'common.days.thursday', shortLabelKey: 'common.days.thu_short' },
  { dayOfWeek: 5, labelKey: 'common.days.friday', shortLabelKey: 'common.days.fri_short' },
  { dayOfWeek: 6, labelKey: 'common.days.saturday', shortLabelKey: 'common.days.sat_short' },
  { dayOfWeek: 0, labelKey: 'common.days.sunday', shortLabelKey: 'common.days.sun_short' },
];

type TimeSlot = {
  id: string;
  labelKey: string;
  startTime: string;
  endTime: string;
};

const TIME_SLOTS: TimeSlot[] = [
  { id: 'morning', labelKey: 'companion.availability.morning', startTime: '08:00', endTime: '12:00' },
  { id: 'afternoon', labelKey: 'companion.availability.afternoon', startTime: '12:00', endTime: '17:00' },
  { id: 'evening', labelKey: 'companion.availability.evening', startTime: '17:00', endTime: '22:00' },
  { id: 'midnight', labelKey: 'companion.availability.midnight', startTime: '22:00', endTime: '02:00' },
];

type DayAvailability = {
  enabled: boolean;
  slots: string[]; // slot ids
};

export default function CompanionAvailabilityScreen() {
  const { t } = useTranslation();
  const goBack = useSafeBack('/companion/(app)/account');

  // React Query hooks
  const { data: availabilityData, isLoading } = useMyCompanionAvailability();
  const updateAvailabilityMutation = useUpdateCompanionAvailability();

  const [availability, setAvailability] = React.useState<Record<number, DayAvailability>>({});
  const [hasChanges, setHasChanges] = React.useState(false);

  const parseAvailabilityFromData = React.useCallback((slots: CompanionAvailability[]) => {
    const parsed: Record<number, DayAvailability> = {};

    // Initialize all days as disabled
    DAYS.forEach(day => {
      parsed[day.dayOfWeek] = { enabled: false, slots: [] };
    });

    // Parse availability from API response
    slots.forEach(slot => {
      const day = parsed[slot.dayOfWeek];
      if (day && slot.isAvailable) {
        day.enabled = true;
        // Map time ranges to slot IDs
        TIME_SLOTS.forEach(timeSlot => {
          if (slot.startTime === timeSlot.startTime && slot.endTime === timeSlot.endTime) {
            if (!day.slots.includes(timeSlot.id)) {
              day.slots.push(timeSlot.id);
            }
          }
        });
      }
    });

    return parsed;
  }, []);

  // Initialize availability when data loads
  React.useEffect(() => {
    if (availabilityData?.recurring) {
      setAvailability(parseAvailabilityFromData(availabilityData.recurring));
    }
  }, [availabilityData, parseAvailabilityFromData]);

  const handleToggleDay = React.useCallback((dayOfWeek: number) => {
    setAvailability(prev => {
      const day = prev[dayOfWeek];
      const enabled = !day?.enabled;
      return {
        ...prev,
        [dayOfWeek]: {
          enabled,
          slots: enabled ? (day?.slots.length ? day.slots : ['morning', 'afternoon', 'evening', 'midnight']) : [],
        },
      };
    });
    setHasChanges(true);
  }, []);

  const handleToggleSlot = React.useCallback((dayOfWeek: number, slotId: string) => {
    setAvailability(prev => {
      const day = prev[dayOfWeek];
      if (!day?.enabled) return prev;

      const slots = day.slots.includes(slotId)
        ? day.slots.filter(s => s !== slotId)
        : [...day.slots, slotId];

      return {
        ...prev,
        [dayOfWeek]: {
          ...day,
          slots,
          enabled: slots.length > 0,
        },
      };
    });
    setHasChanges(true);
  }, []);

  const handleSave = React.useCallback(async () => {
    try {
      // Convert availability state to API format
      const recurring: RecurringAvailabilitySlot[] = [];

      Object.entries(availability).forEach(([dayOfWeekStr, day]) => {
        const dayOfWeek = parseInt(dayOfWeekStr, 10);
        if (day.enabled && day.slots.length > 0) {
          day.slots.forEach(slotId => {
            const slot = TIME_SLOTS.find(s => s.id === slotId);
            if (slot) {
              recurring.push({
                dayOfWeek,
                startTime: slot.startTime,
                endTime: slot.endTime,
              });
            }
          });
        }
      });

      await updateAvailabilityMutation.mutateAsync({ recurring });
      setHasChanges(false);
      Alert.alert(t('common.success'), t('companion.availability.saved_message'));
    } catch (error) {
      console.error('Failed to save availability:', error);
      Alert.alert(t('common.error'), t('errors.try_again'));
    }
  }, [availability, t, updateAvailabilityMutation]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite">
        <ActivityIndicator size="large" color={colors.lavender[400]} />
      </View>
    );
  }

  const enabledDaysCount = Object.values(availability).filter(d => d.enabled).length;
  const totalSlotsCount = Object.values(availability).reduce((acc, d) => acc + d.slots.length, 0);

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <CompanionHeader title={t('companion.availability.header')} onBack={goBack} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          className="mx-4 mt-4 rounded-xl bg-lavender-50 p-4"
        >
          <View className="flex-row items-center gap-3">
            <View className="size-10 items-center justify-center rounded-full bg-lavender-400">
              <Calendar color="white" width={20} height={20} />
            </View>
            <View className="flex-1">
              <Text className="font-urbanist-semibold text-base text-midnight">
                {t('companion.availability.summary_title')}
              </Text>
              <Text className="text-sm text-text-secondary">
                {t('companion.availability.summary_description', {
                  days: enabledDaysCount,
                  slots: totalSlotsCount,
                })}
              </Text>
            </View>
          </View>
        </MotiView>

        {/* Days Section */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
          className="mx-4 mt-4"
        >
          <Text className="mb-3 font-urbanist-semibold text-base text-midnight">
            {t('companion.availability.days_title')}
          </Text>
          <View className="rounded-xl bg-white">
            {DAYS.map((day, index) => {
              const dayAvail = availability[day.dayOfWeek];
              const isEnabled = dayAvail?.enabled || false;

              return (
                <View
                  key={day.dayOfWeek}
                  className={`flex-row items-center justify-between p-4 ${
                    index < DAYS.length - 1 ? 'border-b border-border-light' : ''
                  }`}
                >
                  <Text className="font-urbanist-medium text-base text-midnight">
                    {t(day.labelKey)}
                  </Text>
                  <Switch
                    value={isEnabled}
                    onValueChange={() => handleToggleDay(day.dayOfWeek)}
                    trackColor={{ false: colors.neutral[200], true: colors.lavender[300] }}
                    thumbColor={isEnabled ? colors.lavender[400] : colors.neutral[100]}
                    ios_backgroundColor={colors.neutral[200]}
                  />
                </View>
              );
            })}
          </View>
        </MotiView>

        {/* Time Slots Section */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 200 }}
          className="mx-4 mt-6"
        >
          <View className="mb-3 flex-row items-center gap-2">
            <Clock color={colors.midnight.DEFAULT} width={18} height={18} />
            <Text className="font-urbanist-semibold text-base text-midnight">
              {t('companion.availability.time_slots_title')}
            </Text>
          </View>
          <Text className="mb-3 text-sm text-text-secondary">
            {t('companion.availability.time_slots_description')}
          </Text>

          {DAYS.filter(day => availability[day.dayOfWeek]?.enabled).map(day => {
            const dayAvail = availability[day.dayOfWeek];

            return (
              <View key={day.dayOfWeek} className="mb-3 rounded-xl bg-white p-4">
                <Text className="mb-3 font-urbanist-semibold text-sm text-midnight">
                  {t(day.labelKey)}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {TIME_SLOTS.map(slot => {
                    const isSelected = dayAvail?.slots.includes(slot.id);
                    return (
                      <Pressable
                        key={slot.id}
                        onPress={() => handleToggleSlot(day.dayOfWeek, slot.id)}
                        className={`rounded-full px-4 py-2 ${
                          isSelected ? 'bg-lavender-400' : 'border border-border-light bg-white'
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            isSelected ? 'text-white' : 'text-midnight'
                          }`}
                        >
                          {t(slot.labelKey)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}

          {enabledDaysCount === 0 && (
            <View className="rounded-xl bg-white p-6">
              <Text className="text-center text-sm text-text-tertiary">
                {t('companion.availability.no_days_selected')}
              </Text>
            </View>
          )}
        </MotiView>

        {/* Info Card */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 300 }}
          className="mx-4 mt-6 rounded-xl bg-teal-50 p-4"
        >
          <Text className="text-sm text-teal-700">
            {t('companion.availability.info_message')}
          </Text>
        </MotiView>
      </ScrollView>

      {/* Save Button */}
      <SafeAreaView edges={['bottom']} className="border-t border-border-light bg-white">
        <View className="px-4 py-4">
          <Button
            label={t('common.save_changes')}
            onPress={handleSave}
            disabled={!hasChanges || updateAvailabilityMutation.isPending}
            loading={updateAvailabilityMutation.isPending}
            variant="default"
            size="lg"
            className={`w-full ${hasChanges ? 'bg-lavender-400' : 'bg-neutral-300'}`}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
