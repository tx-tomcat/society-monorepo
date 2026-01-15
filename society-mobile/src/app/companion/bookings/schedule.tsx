/* eslint-disable max-lines-per-function */
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Badge,
  colors,
  FocusAwareStatusBar,
  Image,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
} from '@/components/ui/icons';

type ScheduledBooking = {
  id: string;
  clientName: string;
  clientImage: string;
  occasion: string;
  date: Date;
  time: string;
  duration: string;
  location: string;
  status: 'confirmed' | 'pending';
};

const MOCK_SCHEDULE: ScheduledBooking[] = [
  {
    id: '1',
    clientName: 'Nguyen Van Minh',
    clientImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
    occasion: 'Wedding Reception',
    date: new Date(2025, 0, 15),
    time: '2:00 PM - 6:00 PM',
    duration: '4 hours',
    location: 'Rex Hotel, District 1',
    status: 'confirmed',
  },
  {
    id: '2',
    clientName: 'Tran Hoang Long',
    clientImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120',
    occasion: 'Corporate Dinner',
    date: new Date(2025, 0, 15),
    time: '7:00 PM - 10:00 PM',
    duration: '3 hours',
    location: 'Lotte Hotel, District 1',
    status: 'confirmed',
  },
  {
    id: '3',
    clientName: 'Le Thi Hong',
    clientImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120',
    occasion: 'Tết Family Gathering',
    date: new Date(2025, 0, 28),
    time: '10:00 AM - 4:00 PM',
    duration: '6 hours',
    location: 'Binh Thanh District',
    status: 'pending',
  },
];

const DAYS_OF_WEEK_KEYS = [
  'common.days.sun_short',
  'common.days.mon_short',
  'common.days.tue_short',
  'common.days.wed_short',
  'common.days.thu_short',
  'common.days.fri_short',
  'common.days.sat_short',
];

export default function CompanionSchedule() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  // Generate calendar dates for current week
  const weekDates = React.useMemo(() => {
    const dates = [];
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay()); // Start from Sunday

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [selectedDate]);

  // Filter bookings for selected date
  const dayBookings = React.useMemo(() => {
    return MOCK_SCHEDULE.filter(
      (booking) =>
        booking.date.toDateString() === selectedDate.toDateString()
    );
  }, [selectedDate]);

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handlePrevWeek = React.useCallback(() => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  }, [selectedDate]);

  const handleNextWeek = React.useCallback(() => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  }, [selectedDate]);

  const handleBookingPress = React.useCallback(
    (booking: ScheduledBooking) => {
      router.push(`/companion/bookings/${booking.id}` as Href);
    },
    [router]
  );

  const hasBookingsOnDate = (date: Date) => {
    return MOCK_SCHEDULE.some(
      (b) => b.date.toDateString() === date.toDateString()
    );
  };

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable onPress={handleBack}>
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text style={styles.headerTitle} className="flex-1 text-xl text-midnight">
            {t('companion.schedule.header')}
          </Text>
          <Pressable>
            <Calendar color={colors.lavender[400]} width={24} height={24} />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Calendar Week View */}
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500 }}
        className="bg-white px-4 py-4"
      >
        {/* Month Header */}
        <View className="mb-4 flex-row items-center justify-between">
          <Pressable onPress={handlePrevWeek} className="p-2">
            <ArrowLeft color={colors.midnight.DEFAULT} width={20} height={20} />
          </Pressable>
          <Text style={styles.monthTitle} className="text-lg text-midnight">
            {selectedDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
          <Pressable onPress={handleNextWeek} className="p-2">
            <ArrowRight color={colors.midnight.DEFAULT} width={20} height={20} />
          </Pressable>
        </View>

        {/* Week Days */}
        <View className="flex-row">
          {weekDates.map((date, index) => {
            const isSelected =
              date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();
            const hasBookings = hasBookingsOnDate(date);

            return (
              <Pressable
                key={index}
                onPress={() => setSelectedDate(date)}
                className={`flex-1 items-center rounded-xl py-3 ${
                  isSelected ? 'bg-lavender-400' : ''
                }`}
              >
                <Text
                  className={`text-xs ${
                    isSelected ? 'text-white' : 'text-text-tertiary'
                  }`}
                >
                  {t(DAYS_OF_WEEK_KEYS[date.getDay()])}
                </Text>
                <Text
                  className={`mt-1 text-lg font-semibold ${
                    isSelected
                      ? 'text-white'
                      : isToday
                        ? 'text-lavender-400'
                        : 'text-midnight'
                  }`}
                >
                  {date.getDate()}
                </Text>
                {hasBookings && !isSelected && (
                  <View className="mt-1 size-1.5 rounded-full bg-rose-400" />
                )}
                {hasBookings && isSelected && (
                  <View className="mt-1 size-1.5 rounded-full bg-white" />
                )}
              </Pressable>
            );
          })}
        </View>
      </MotiView>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
      >
        {/* Selected Date Header */}
        <Text className="mb-4 text-sm font-medium text-text-tertiary">
          {selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>

        {/* Bookings */}
        {dayBookings.length > 0 ? (
          <View className="gap-3">
            {dayBookings.map((booking, index) => (
              <MotiView
                key={booking.id}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: 400, delay: index * 100 }}
              >
                <Pressable
                  onPress={() => handleBookingPress(booking)}
                  className="flex-row gap-4 rounded-2xl bg-white p-4"
                >
                  {/* Time Indicator */}
                  <View className="items-center">
                    <Text className="text-sm font-semibold text-lavender-400">
                      {booking.time.split(' - ')[0]}
                    </Text>
                    <View className="my-2 h-12 w-0.5 bg-lavender-400/30" />
                    <Text className="text-xs text-text-tertiary">
                      {booking.time.split(' - ')[1]}
                    </Text>
                  </View>

                  {/* Booking Card */}
                  <View className="flex-1 rounded-xl bg-softpink p-3">
                    <View className="flex-row items-center gap-3">
                      <Image
                        source={{ uri: booking.clientImage }}
                        className="size-10 rounded-full"
                        contentFit="cover"
                      />
                      <View className="flex-1">
                        <Text className="font-semibold text-midnight">
                          {booking.clientName}
                        </Text>
                        <Text className="text-sm text-rose-400">
                          {booking.occasion}
                        </Text>
                      </View>
                      <Badge
                        label={booking.status === 'confirmed' ? t('common.status.confirmed') : t('common.status.pending')}
                        variant={booking.status === 'confirmed' ? 'teal' : 'lavender'}
                        size="sm"
                      />
                    </View>
                    <View className="mt-3 flex-row items-center gap-4">
                      <View className="flex-row items-center gap-1">
                        <Clock color={colors.text.tertiary} width={12} height={12} />
                        <Text className="text-xs text-text-tertiary">
                          {booking.duration}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <MapPin color={colors.text.tertiary} width={12} height={12} />
                        <Text className="text-xs text-text-tertiary">
                          {booking.location}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              </MotiView>
            ))}
          </View>
        ) : (
          <View className="items-center py-16">
            <View className="size-16 items-center justify-center rounded-full bg-lavender-400/20">
              <Calendar color={colors.lavender[400]} width={32} height={32} />
            </View>
            <Text style={styles.emptyTitle} className="mt-4 text-lg text-midnight">
              {t('companion.schedule.no_bookings')}
            </Text>
            <Text className="mt-1 text-center text-sm text-text-secondary">
              {t('companion.schedule.no_bookings_description')}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontFamily: 'Urbanist_700Bold',
  },
  monthTitle: {
    fontFamily: 'Urbanist_700Bold',
  },
  emptyTitle: {
    fontFamily: 'Urbanist_700Bold',
  },
});
