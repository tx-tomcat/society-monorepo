/* eslint-disable max-lines-per-function */
import { FlashList } from '@shopify/flash-list';
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
  Bell,
  Calendar,
  Chart,
  Clock,
  MapPin,
  SocietyLogo,
  Star,
  Wallet,
} from '@/components/ui/icons';

type TodayBooking = {
  id: string;
  clientName: string;
  clientImage: string;
  occasion: string;
  time: string;
  location: string;
  status: 'upcoming' | 'active' | 'completed';
};

const MOCK_TODAY_BOOKINGS: TodayBooking[] = [
  {
    id: '1',
    clientName: 'Nguyen Van Minh',
    clientImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
    occasion: 'Wedding Reception',
    time: '2:00 PM - 6:00 PM',
    location: 'Rex Hotel, District 1',
    status: 'upcoming',
  },
  {
    id: '2',
    clientName: 'Tran Hoang Long',
    clientImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120',
    occasion: 'Corporate Dinner',
    time: '7:00 PM - 10:00 PM',
    location: 'Lotte Hotel, District 1',
    status: 'upcoming',
  },
];

const STATS = [
  { labelKey: 'companion.dashboard.stats.this_week', value: '₫2.5M', icon: Wallet, color: colors.teal[400] },
  { labelKey: 'companion.dashboard.stats.rating', value: '4.9', icon: Star, color: colors.yellow[400] },
  { labelKey: 'companion.dashboard.stats.bookings', value: '12', icon: Calendar, color: colors.lavender[400] },
];

export default function CompanionDashboard() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleNotificationPress = React.useCallback(() => {
    // TODO: Navigate to notifications screen
    // router.push('/companion/notifications' as Href);
  }, []);

  const handleBookingPress = React.useCallback(
    (booking: TodayBooking) => {
      router.push(`/companion/bookings/${booking.id}` as Href);
    },
    [router]
  );

  const handleViewAllBookings = React.useCallback(() => {
    router.push('/companion/bookings/schedule' as Href);
  }, [router]);

  const handleViewEarnings = React.useCallback(() => {
    router.push('/companion/earnings' as Href);
  }, [router]);

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 px-4 py-3">
          <SocietyLogo color={colors.lavender[400]} width={32} height={32} />
          <View className="flex-1">
            <Text className="text-sm text-text-tertiary">{t('companion.dashboard.greeting')}</Text>
            <Text style={styles.title} className="text-xl text-midnight">
              Minh Anh
            </Text>
          </View>
          <Pressable
            onPress={handleNotificationPress}
            testID="notification-button"
            className="relative"
          >
            <Bell color={colors.midnight.DEFAULT} width={24} height={24} />
            <View className="absolute -right-1 -top-1 size-4 items-center justify-center rounded-full bg-rose-400">
              <Text className="text-xs font-bold text-white">3</Text>
            </View>
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          className="px-4 py-4"
        >
          <View className="flex-row gap-3">
            {STATS.map((stat, index) => (
              <Pressable
                key={stat.labelKey}
                onPress={stat.labelKey === 'companion.dashboard.stats.this_week' ? handleViewEarnings : undefined}
                testID={`stat-card-${stat.labelKey.split('.').pop()}`}
                className="flex-1 rounded-2xl bg-white p-4"
              >
                <View
                  className="mb-2 size-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <stat.icon color={stat.color} width={20} height={20} />
                </View>
                <Text style={styles.statValue} className="text-xl text-midnight">
                  {stat.value}
                </Text>
                <Text className="text-xs text-text-tertiary">{t(stat.labelKey)}</Text>
              </Pressable>
            ))}
          </View>
        </MotiView>

        {/* Earnings Summary */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 100 }}
          className="mx-4 mb-4"
        >
          <Pressable
            onPress={handleViewEarnings}
            testID="earnings-card"
            className="flex-row items-center justify-between rounded-2xl bg-lavender-400 p-4"
          >
            <View className="flex-row items-center gap-3">
              <View className="size-12 items-center justify-center rounded-full bg-white/20">
                <Chart color="#FFFFFF" width={24} height={24} />
              </View>
              <View>
                <Text className="text-sm text-white/80">{t('companion.dashboard.total_earnings')}</Text>
                <Text style={styles.earningsValue} className="text-2xl text-white">
                  ₫8,450,000
                </Text>
              </View>
            </View>
            <View className="rounded-full bg-white/20 px-3 py-1">
              <Text className="text-sm font-semibold text-white">+12%</Text>
            </View>
          </Pressable>
        </MotiView>

        {/* Today's Bookings */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 200 }}
          className="px-4"
        >
          <View className="mb-3 flex-row items-center justify-between">
            <Text style={styles.sectionTitle} className="text-lg text-midnight">
              {t('companion.dashboard.todays_bookings')}
            </Text>
            <Pressable onPress={handleViewAllBookings} testID="view-all-bookings">
              <Text className="text-sm font-semibold text-lavender-400">
                {t('common.view_all')}
              </Text>
            </Pressable>
          </View>

          {MOCK_TODAY_BOOKINGS.length > 0 ? (
            <View className="gap-3">
              {MOCK_TODAY_BOOKINGS.map((booking, index) => (
                <MotiView
                  key={booking.id}
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'timing', duration: 400, delay: 300 + index * 100 }}
                >
                  <Pressable
                    onPress={() => handleBookingPress(booking)}
                    testID={`booking-card-${booking.id}`}
                    className="flex-row gap-4 rounded-2xl bg-white p-4"
                  >
                    <Image
                      source={{ uri: booking.clientImage }}
                      className="size-14 rounded-full"
                      contentFit="cover"
                    />
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="font-semibold text-midnight">
                          {booking.clientName}
                        </Text>
                        <Badge
                          label={booking.status === 'upcoming' ? t('common.status.upcoming') : t('common.status.active')}
                          variant={booking.status === 'upcoming' ? 'lavender' : 'teal'}
                          size="sm"
                        />
                      </View>
                      <Text className="mt-1 text-sm text-rose-400">
                        {booking.occasion}
                      </Text>
                      <View className="mt-2 flex-row items-center gap-4">
                        <View className="flex-row items-center gap-1">
                          <Clock color={colors.text.tertiary} width={14} height={14} />
                          <Text className="text-xs text-text-tertiary">
                            {booking.time}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <MapPin color={colors.text.tertiary} width={14} height={14} />
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
            <View className="items-center rounded-2xl bg-white py-12">
              <Calendar color={colors.lavender[400]} width={48} height={48} />
              <Text className="mt-3 text-lg font-semibold text-midnight">
                {t('companion.dashboard.no_bookings_today')}
              </Text>
              <Text className="mt-1 text-sm text-text-tertiary">
                {t('companion.dashboard.enjoy_day_off')}
              </Text>
            </View>
          )}
        </MotiView>

        {/* Quick Actions */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 400 }}
          className="px-4 py-6"
        >
          <Text style={styles.sectionTitle} className="mb-3 text-lg text-midnight">
            {t('companion.dashboard.quick_actions')}
          </Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => router.push('/companion/bookings/requests' as Href)}
              testID="quick-action-requests"
              className="flex-1 items-center rounded-2xl bg-white p-4"
            >
              <View className="mb-2 size-12 items-center justify-center rounded-full bg-rose-400/10">
                <Bell color={colors.rose[400]} width={24} height={24} />
              </View>
              <Text className="text-sm font-medium text-midnight">{t('companion.dashboard.actions.requests')}</Text>
              <Badge label={t('companion.dashboard.actions.new_count', { count: 2 })} variant="default" size="sm" />
            </Pressable>
            <Pressable
              onPress={() => router.push('/companion/bookings/schedule' as Href)}
              testID="quick-action-schedule"
              className="flex-1 items-center rounded-2xl bg-white p-4"
            >
              <View className="mb-2 size-12 items-center justify-center rounded-full bg-lavender-400/10">
                <Calendar color={colors.lavender[400]} width={24} height={24} />
              </View>
              <Text className="text-sm font-medium text-midnight">{t('companion.dashboard.actions.schedule')}</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/companion/earnings/withdraw' as Href)}
              testID="quick-action-withdraw"
              className="flex-1 items-center rounded-2xl bg-white p-4"
            >
              <View className="mb-2 size-12 items-center justify-center rounded-full bg-teal-400/10">
                <Wallet color={colors.teal[400]} width={24} height={24} />
              </View>
              <Text className="text-sm font-medium text-midnight">{t('companion.dashboard.actions.withdraw')}</Text>
            </Pressable>
          </View>
        </MotiView>

        {/* Bottom spacing */}
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Urbanist_700Bold',
  },
  statValue: {
    fontFamily: 'Urbanist_700Bold',
  },
  earningsValue: {
    fontFamily: 'Urbanist_700Bold',
  },
  sectionTitle: {
    fontFamily: 'Urbanist_700Bold',
  },
});
