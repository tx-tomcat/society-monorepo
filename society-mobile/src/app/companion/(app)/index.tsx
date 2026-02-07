/* eslint-disable max-lines-per-function */
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
} from 'react-native';

import {
  Badge,
  BookingCard,
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  StatCard,
  Text,
  View,
} from '@/components/ui';
import {
  Bell,
  Calendar,
  Chart,
  HiremeLogo,
  Star,
  Wallet,
} from '@/components/ui/icons';
import { BookingStatus } from '@/lib/api/enums';
import type { Booking } from '@/lib/api/services/bookings.service';
import {
  useBookingRequests,
  useCompanionBookings,
  useEarningsOverview,
  useMyCompanionProfile,
} from '@/lib/hooks';
import { formatVND } from '@/lib/utils';

type DashboardBooking = Booking & {
  displayStatus: 'upcoming' | 'active';
};

export default function CompanionDashboard() {
  const router = useRouter();
  const { t } = useTranslation();

  // React Query hooks
  const { data: profile, isLoading: isProfileLoading } =
    useMyCompanionProfile();
  const { data: earnings, isLoading: isEarningsLoading } =
    useEarningsOverview();
  const {
    data: bookingsData,
    isLoading: isBookingsLoading,
    refetch: refetchBookings,
    isRefetching: isRefetchingBookings,
  } = useCompanionBookings(`${BookingStatus.CONFIRMED},${BookingStatus.ACTIVE}`, 1, 10);
  const {
    data: requestsData,
    isLoading: isRequestsLoading,
    refetch: refetchRequests,
    isRefetching: isRefetchingRequests,
  } = useBookingRequests();

  const isLoading =
    isProfileLoading ||
    isEarningsLoading ||
    isBookingsLoading ||
    isRequestsLoading;
  const isRefreshing = isRefetchingBookings || isRefetchingRequests;

  const pendingRequestsCount = requestsData?.requests?.length ?? 0;

  console.log(bookingsData?.bookings);

  // Active + upcoming bookings — backend only returns CONFIRMED & ACTIVE
  const upcomingBookings = React.useMemo((): DashboardBooking[] => {
    if (!bookingsData?.bookings) return [];

    const now = new Date();

    return bookingsData.bookings
      .map((booking) => {
        const startDate = new Date(booking.startDatetime);
        const endDate = new Date(booking.endDatetime);

        const displayStatus: DashboardBooking['displayStatus'] =
          booking.status === 'ACTIVE' || (now >= startDate && now <= endDate)
            ? 'active'
            : 'upcoming';

        return { ...booking, displayStatus };
      })
      .sort((a, b) => {
        // Active bookings first, then by nearest start time
        if (a.displayStatus === 'active' && b.displayStatus !== 'active') return -1;
        if (a.displayStatus !== 'active' && b.displayStatus === 'active') return 1;
        return new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime();
      });
  }, [bookingsData]);

  const handleRefresh = React.useCallback(() => {
    refetchBookings();
    refetchRequests();
  }, [refetchBookings, refetchRequests]);

  const handleNotificationPress = React.useCallback(() => {
    router.push('/companion/bookings/requests' as Href);
  }, [router]);

  const handleBookingPress = React.useCallback(
    (booking: DashboardBooking) => {
      router.push(`/companion/bookings/${booking.id}` as Href);
    },
    [router]
  );

  const handleViewAllBookings = React.useCallback(() => {
    router.push('/companion/schedule' as Href);
  }, [router]);

  const handleViewEarnings = React.useCallback(() => {
    router.push('/companion/earnings' as Href);
  }, [router]);

  // Computed stats
  const stats = React.useMemo(
    () => [
      {
        labelKey: 'companion.dashboard.stats.this_week',
        value: formatVND(earnings?.thisWeek ?? 0),
        icon: Wallet,
        color: colors.teal[400],
      },
      {
        labelKey: 'companion.dashboard.stats.rating',
        value: profile?.rating?.toFixed(1) ?? '0.0',
        icon: Star,
        color: colors.yellow[400],
      },
      {
        labelKey: 'companion.dashboard.stats.bookings',
        value: String(profile?.completedBookings ?? 0),
        icon: Calendar,
        color: colors.lavender[400],
      },
    ],
    [earnings, profile]
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite">
        <ActivityIndicator color={colors.lavender[400]} size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 px-4 py-3">
          <HiremeLogo color={colors.lavender[400]} width={32} height={32} />
          <View className="flex-1">
            <Text className="text-sm text-text-tertiary">
              {t('companion.dashboard.greeting')}
            </Text>
            <Text className="font-urbanist-bold text-xl text-midnight">
              {profile?.displayName ?? t('common.loading')}
            </Text>
          </View>
          <Pressable
            onPress={handleNotificationPress}
            testID="notification-button"
            className="relative"
          >
            <Bell color={colors.midnight.DEFAULT} width={24} height={24} />
            {pendingRequestsCount > 0 && (
              <View className="absolute -right-1 -top-1 size-4 items-center justify-center rounded-full bg-rose-400">
                <Text className="text-xs font-bold text-white">
                  {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.lavender[400]}
          />
        }
      >
        {/* Stats Cards */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          className="p-4"
        >
          <View className="flex-row gap-3">
            {stats.map((stat) => (
              <StatCard
                key={stat.labelKey}
                label={t(stat.labelKey)}
                value={stat.value}
                icon={stat.icon}
                iconColor={stat.color}
                iconBgColor={`${stat.color}20`}
                onPress={
                  stat.labelKey === 'companion.dashboard.stats.this_week'
                    ? handleViewEarnings
                    : undefined
                }
                testID={`stat-card-${stat.labelKey.split('.').pop()}`}
              />
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
            className="rounded-2xl bg-lavender-900 p-5"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="size-12 items-center justify-center rounded-full bg-white/20">
                  <Chart color="#FFFFFF" width={24} height={24} />
                </View>
                <View>
                  <Text className="text-sm font-medium text-white/70">
                    {t('companion.dashboard.total_earnings')}
                  </Text>
                  <Text className="font-urbanist-bold text-2xl text-white">
                    {formatVND(earnings?.totalEarnings ?? 0)}
                  </Text>
                </View>
              </View>
              {earnings?.monthlyChange !== undefined &&
                earnings.monthlyChange !== 0 && (
                  <View className="rounded-full bg-white/20 px-3 py-1.5">
                    <Text className="text-sm font-semibold text-white">
                      {earnings.monthlyChange > 0 ? '+' : ''}
                      {earnings.monthlyChange.toFixed(0)}%
                    </Text>
                  </View>
                )}
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
            <Text className="font-urbanist-bold text-lg text-midnight">
              {t('companion.dashboard.upcoming_bookings')}
            </Text>
            <Pressable
              onPress={handleViewAllBookings}
              testID="view-all-bookings"
            >
              <Text className="text-sm font-semibold text-lavender-900">
                {t('common.view_all')}
              </Text>
            </Pressable>
          </View>

          {upcomingBookings.length > 0 ? (
            <View className="gap-3">
              {upcomingBookings.map((booking, index) => {
                const startTime = new Date(booking.startDatetime);
                const endTime = new Date(booking.endDatetime);
                const timeString = `${startTime.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })} - ${endTime.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}`;

                const statusLabel =
                  booking.displayStatus === 'active'
                    ? t('common.status.active')
                    : t('common.status.upcoming');

                const statusVariant =
                  booking.displayStatus === 'active' ? 'teal' : 'lavender';

                return (
                  <MotiView
                    key={booking.id}
                    from={{ opacity: 0, translateX: -20 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{
                      type: 'timing',
                      duration: 400,
                      delay: 300 + index * 100,
                    }}
                  >
                    <BookingCard
                      avatarUrl={
                        booking.hirer?.avatar ||
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120'
                      }
                      displayName={booking.hirer?.displayName || 'Anonymous'}
                      occasionEmoji={booking.occasion?.emoji}
                      occasionName={booking.occasion?.name || t('common.occasion')}
                      timeString={timeString}
                      locationAddress={booking.locationAddress}
                      statusLabel={statusLabel}
                      statusVariant={statusVariant}
                      onPress={() => handleBookingPress(booking)}
                      testID={`booking-card-${booking.id}`}
                    />
                  </MotiView>
                );
              })}
            </View>
          ) : (
            <View className="items-center rounded-2xl bg-white py-12">
              <Calendar color={colors.lavender[400]} width={48} height={48} />
              <Text className="mt-3 text-lg font-semibold text-midnight">
                {t('companion.dashboard.no_upcoming_bookings')}
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
          <Text className="mb-4 font-urbanist-bold text-lg text-midnight">
            {t('companion.dashboard.quick_actions')}
          </Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={() =>
                router.push('/companion/bookings/requests' as Href)
              }
              testID="quick-action-requests"
              className="flex-1 items-center rounded-2xl bg-white p-4"
            >
              <View className="mb-3 size-12 items-center justify-center rounded-full bg-rose-400/10">
                <Bell color={colors.rose[400]} width={24} height={24} />
              </View>
              <Text className="text-center text-sm font-medium text-midnight">
                {t('companion.dashboard.actions.requests')}
              </Text>
              {pendingRequestsCount > 0 && (
                <View className="mt-2">
                  <Badge
                    label={`${pendingRequestsCount} ${t('companion.dashboard.actions.new_count')}`}
                    variant="rose"
                    size="sm"
                  />
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={() =>
                router.push('/companion/schedule' as Href)
              }
              testID="quick-action-schedule"
              className="flex-1 items-center rounded-2xl bg-white p-4"
            >
              <View className="mb-3 size-12 items-center justify-center rounded-full bg-lavender-900/10">
                <Calendar color={colors.lavender[400]} width={24} height={24} />
              </View>
              <Text className="text-center text-sm font-medium text-midnight">
                {t('companion.dashboard.actions.schedule')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() =>
                router.push('/companion/earnings/withdraw' as Href)
              }
              testID="quick-action-withdraw"
              className="flex-1 items-center rounded-2xl bg-white p-4"
            >
              <View className="mb-3 size-12 items-center justify-center rounded-full bg-teal-400/10">
                <Wallet color={colors.teal[400]} width={24} height={24} />
              </View>
              <Text className="text-center text-sm font-medium text-midnight">
                {t('companion.dashboard.actions.withdraw')}
              </Text>
            </Pressable>
          </View>
        </MotiView>

        {/* Bottom spacing */}
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}
