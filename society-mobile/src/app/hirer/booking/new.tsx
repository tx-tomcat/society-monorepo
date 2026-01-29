/* eslint-disable max-lines-per-function */
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';

import { OccasionSelector } from '@/components/occasion-selector';
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
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Star,
  VerifiedBadge,
} from '@/components/ui/icons';
import { getPhotoUrl } from '@/lib/api/services/companions.service';
import { useAllOccasions, useCompanion, useCompanionAvailability } from '@/lib/hooks';
import { useOccasionsStore } from '@/lib/stores';
import { formatVND } from '@/lib/utils';

const DURATIONS = [
  { id: '2', label: '2 hours', hours: 2 },
  { id: '3', label: '3 hours', hours: 3 },
  { id: '4', label: '4 hours', hours: 4 },
  { id: '6', label: '6 hours', hours: 6 },
  { id: '8', label: '8 hours', hours: 8 },
];

const DEFAULT_TIME_SLOTS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
];

export default function BookingFormScreen() {
  const router = useRouter();
  const { companionId } = useLocalSearchParams<{ companionId: string }>();
  const { t } = useTranslation();

  const [selectedOccasion, setSelectedOccasion] = React.useState<string | null>(
    null
  );
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = React.useState('3');
  const [location, setLocation] = React.useState('');
  const [notes, setNotes] = React.useState('');

  // Calculate date range for availability (next 14 days from selected date or today)
  const dateRange = React.useMemo(() => {
    const start = selectedDate ? new Date(selectedDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + 14);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }, [selectedDate]);

  // API hooks
  const { data: companionData, isLoading: isLoadingCompanion } = useCompanion(
    companionId || ''
  );
  const { data: availabilityData } = useCompanionAvailability(
    companionId || '',
    dateRange.startDate,
    dateRange.endDate
  );

  // Get occasions from store (prefetched at app startup)
  // Use React Query as fallback if store is empty
  const storeOccasions = useOccasionsStore.use.occasions();
  const { data: fetchedOccasions, isLoading: isLoadingOccasions } = useAllOccasions();
  const occasions = storeOccasions.length > 0 ? storeOccasions : (fetchedOccasions || []);


  // Transform companion data from API Companion type
  const companion = React.useMemo(() => {
    if (!companionData) return null;
    const c = companionData;
    return {
      id: c.id,
      userId: c.userId, // User.id for booking creation
      name: c.displayName || '',
      image: c.avatar || getPhotoUrl(c.photos?.[0]) || '',
      rating: c.rating ?? 0,
      reviewCount: c.reviewCount ?? 0,
      hourlyRate: c.hourlyRate || 0,
      location: c.languages?.join(', ') || '',
      isVerified: c.isVerified ?? c.verificationStatus === 'verified',
    };
  }, [companionData]);

  // Get available time slots from availability data or use defaults
  const timeSlots = React.useMemo(() => {
    if (!availabilityData || !Array.isArray(availabilityData))
      return DEFAULT_TIME_SLOTS;
    // Generate time slots from available blocks
    const slots: string[] = [];
    availabilityData.forEach((block) => {
      if (block.isAvailable) {
        // Add the start time of available blocks
        slots.push(block.startTime);
      }
    });
    return slots.length > 0 ? slots : DEFAULT_TIME_SLOTS;
  }, [availabilityData]);

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleContinue = React.useCallback(() => {
    if (
      !companion ||
      !selectedOccasion ||
      !selectedDate ||
      !selectedTime ||
      !location
    ) {
      return;
    }

    // Find the selected occasion to pass its details
    const occasion = occasions.find((o) => o.id === selectedOccasion);

    const params = new URLSearchParams({
      companionId: companion.userId,
      companionProfileId: companion.id,
      occasionId: selectedOccasion,
      occasionName: occasion?.name || '',
      occasionEmoji: occasion?.emoji || '',
      date: selectedDate,
      time: selectedTime,
      duration: selectedDuration,
      location,
      notes,
    });
    router.push(`/hirer/booking/review?${params.toString()}` as Href);
  }, [
    router,
    companion,
    selectedOccasion,
    selectedDate,
    selectedTime,
    selectedDuration,
    location,
    notes,
    occasions,
  ]);

  // Generate next 14 days for date picker
  const dates = React.useMemo(() => {
    const result = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      result.push({
        id: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('vi-VN', { weekday: 'short' }),
        date: date.getDate(),
        month: date.toLocaleDateString('vi-VN', { month: 'short' }),
      });
    }
    return result;
  }, []);

  const selectedDurationObj = DURATIONS.find((d) => d.id === selectedDuration);
  const totalAmount =
    (companion?.hourlyRate || 0) * (selectedDurationObj?.hours || 3);

  const isFormValid =
    companion &&
    selectedOccasion &&
    selectedDate &&
    selectedTime &&
    location.trim();

  // Loading state
  if (isLoadingCompanion) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite">
        <FocusAwareStatusBar />
        <ActivityIndicator color={colors.rose[400]} size="large" />
        <Text className="mt-4 text-text-secondary">{t('common.loading')}</Text>
      </View>
    );
  }

  // Error state - companion not found
  if (!companion) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite">
        <FocusAwareStatusBar />
        <Text className="text-lg text-text-secondary">
          {t('errors.not_found')}
        </Text>
        <Button
          label={t('common.go_back')}
          onPress={handleBack}
          variant="outline"
          className="mt-4"
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable
            onPress={handleBack}
            className="size-10 items-center justify-center"
          >
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text className="flex-1 font-urbanist-bold text-xl text-midnight">
            {t('hirer.booking.title')}
          </Text>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Companion Card */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            className="mx-4 mt-4 flex-row items-center gap-3 rounded-2xl bg-white p-4"
          >
            <Image
              source={{ uri: companion.image }}
              className="size-16 rounded-xl"
              contentFit="cover"
            />
            <View className="flex-1">
              <View className="flex-row items-center gap-1">
                <Text className="font-urbanist-semibold text-lg text-midnight">
                  {companion.name}
                </Text>
                {companion.isVerified && (
                  <VerifiedBadge
                    color={colors.teal[400]}
                    width={18}
                    height={18}
                  />
                )}
              </View>
              <View className="mt-1 flex-row items-center gap-2">
                <View className="flex-row items-center gap-1">
                  <Star color={colors.yellow[400]} width={14} height={14} />
                  <Text className="text-sm font-medium text-midnight">
                    {companion.rating}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <MapPin color={colors.text.tertiary} width={12} height={12} />
                  <Text className="text-xs text-text-tertiary">
                    {companion.location}
                  </Text>
                </View>
              </View>
            </View>
            <View className="items-end">
              <Text className="font-urbanist-bold text-lg text-rose-400">
                {formatVND(companion.hourlyRate)}
              </Text>
              <Text className="text-xs text-text-tertiary">
                /{t('hirer.booking.hour')}
              </Text>
            </View>
          </MotiView>

          {/* Occasion Selection */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 50 }}
          >
            <OccasionSelector
              occasions={occasions}
              selectedOccasion={selectedOccasion}
              onSelect={setSelectedOccasion}
              isLoading={isLoadingOccasions}
              label={t('hirer.booking.occasion')}
              required
            />
          </MotiView>

          {/* Date Selection */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 100 }}
            className="pt-6"
          >
            <View className="mb-3 flex-row items-center gap-2 px-4">
              <Calendar color={colors.rose[400]} width={20} height={20} />
              <Text className="font-urbanist-semibold text-base text-midnight">
                {t('hirer.booking.select_date')} *
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            >
              {dates.map((date) => {
                const isSelected = selectedDate === date.id;
                return (
                  <Pressable
                    key={date.id}
                    onPress={() => setSelectedDate(date.id)}
                    className={`mr-3 items-center rounded-xl px-5 py-3 ${isSelected ? 'bg-rose-400' : 'bg-white'
                      }`}
                  >
                    <Text
                      className={`text-xs uppercase ${isSelected ? 'text-white/80' : 'text-text-tertiary'
                        }`}
                    >
                      {date.day}
                    </Text>
                    <Text
                      className={`font-urbanist-bold text-xl ${isSelected ? 'text-white' : 'text-midnight'}`}
                    >
                      {date.date}
                    </Text>
                    <Text
                      className={`text-xs ${isSelected ? 'text-white/80' : 'text-text-tertiary'}`}
                    >
                      {date.month}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </MotiView>

          {/* Time Selection */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 150 }}
            className="px-4 pt-6"
          >
            <View className="mb-3 flex-row items-center gap-2">
              <Clock color={colors.rose[400]} width={20} height={20} />
              <Text className="font-urbanist-semibold text-base text-midnight">
                {t('hirer.booking.select_time')} *
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {timeSlots.length > 0 ? (
                timeSlots.map((time: string) => {
                  const isSelected = selectedTime === time;
                  return (
                    <Pressable
                      key={time}
                      onPress={() => setSelectedTime(time)}
                      className={`rounded-lg px-5 py-3 ${isSelected ? 'bg-lavender-400' : 'bg-white'
                        }`}
                    >
                      <Text
                        className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-midnight'
                          }`}
                      >
                        {time}
                      </Text>
                    </Pressable>
                  );
                })
              ) : (
                <Text className="text-sm text-text-tertiary">
                  {t('hirer.booking.no_slots_available')}
                </Text>
              )}
            </View>
          </MotiView>

          {/* Duration Selection */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 200 }}
            className="px-4 pt-6"
          >
            <Text className="mb-3 font-urbanist-semibold text-base text-midnight">
              {t('hirer.booking.duration')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {DURATIONS.map((duration) => {
                const isSelected = selectedDuration === duration.id;
                return (
                  <Pressable
                    key={duration.id}
                    onPress={() => setSelectedDuration(duration.id)}
                    className={`mr-3 rounded-full px-5 py-3 ${isSelected ? 'bg-teal-400' : 'bg-white'
                      }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-midnight'
                        }`}
                    >
                      {duration.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </MotiView>

          {/* Location Input */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 250 }}
            className="px-4 pt-6"
          >
            <View className="mb-3 flex-row items-center gap-2">
              <MapPin color={colors.rose[400]} width={20} height={20} />
              <Text className="font-urbanist-semibold text-base text-midnight">
                {t('hirer.booking.location')} *
              </Text>
            </View>
            <View className="rounded-xl bg-white p-1">
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder={t('hirer.booking.location_placeholder')}
                placeholderTextColor={colors.text.tertiary}
                style={{ fontFamily: 'Urbanist_400Regular', color: colors.midnight.DEFAULT }}
                className="px-4 py-3 text-base"
                multiline={false}
              />
            </View>
          </MotiView>

          {/* Notes Input */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 300 }}
            className="px-4 pt-6"
          >
            <Text className="mb-3 font-urbanist-semibold text-base text-midnight">
              {t('hirer.booking.notes')}
            </Text>
            <View className="rounded-xl bg-white p-1">
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder={t('hirer.booking.notes_placeholder')}
                placeholderTextColor={colors.text.tertiary}
                style={{ fontFamily: 'Urbanist_400Regular', color: colors.midnight.DEFAULT }}
                className="min-h-[100px] px-4 py-3 text-base"
                multiline
                textAlignVertical="top"
              />
            </View>
          </MotiView>

          {/* Pricing Summary */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 350 }}
            className="mx-4 mt-6 rounded-2xl bg-lavender-400/10 p-4"
          >
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-text-secondary">
                {t('hirer.booking.hourly_rate')}
              </Text>
              <Text className="font-medium text-midnight">
                {formatVND(companion.hourlyRate)}
              </Text>
            </View>
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-text-secondary">
                {t('hirer.booking.duration_label')}
              </Text>
              <Text className="font-medium text-midnight">
                {selectedDurationObj?.hours || 3} {t('hirer.booking.hours')}
              </Text>
            </View>
            <View className="mb-2 border-t border-lavender-400/20 pt-3">
              <View className="flex-row items-center justify-between">
                <Text className="font-urbanist-semibold text-base text-midnight">
                  {t('hirer.booking.estimated_total')}
                </Text>
                <Text className="font-urbanist-bold text-xl text-rose-400">
                  {formatVND(totalAmount)}
                </Text>
              </View>
            </View>
          </MotiView>

          <View className="h-32" />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Actions */}
      <SafeAreaView
        edges={['bottom']}
        className="border-t border-border-light bg-white"
      >
        <View className="flex-row items-center gap-3 p-4">

          <Button
            label={t('hirer.booking.continue')}
            onPress={handleContinue}
            variant="default"
            size="lg"
            disabled={!isFormValid}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
