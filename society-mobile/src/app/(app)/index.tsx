/* eslint-disable max-lines-per-function */
import type { Href } from 'expo-router';
import { useFocusEffect, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView } from 'react-native';

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
  Clock,
  Heart,
  HiremeLogo,
  MapPin,
  Search,
  Star,
} from '@/components/ui/icons';
import { BookingStatus } from '@/lib/api/enums';
import type { Booking } from '@/lib/api/services/bookings.service';
import { bookingsService } from '@/lib/api/services/bookings.service';
import { getPrimaryPhotoUrl } from '@/lib/api/services/companions.service';
import { favoritesService } from '@/lib/api/services/favorites.service';
import { useCurrentUser } from '@/lib/hooks';

type UpcomingBooking = Booking & {
  displayStatus: 'upcoming' | 'active' | 'pending';
};

type BookingCardProps = {
  booking: UpcomingBooking;
  onPress: () => void;
  t: (key: string) => string;
};

const BookingCard = React.memo(function BookingCard({
  booking,
  onPress,
  t,
}: BookingCardProps) {
  const { dateString, timeString, companionPhoto } = React.useMemo(() => {
    const startTime = new Date(booking.startDatetime);
    const endTime = new Date(booking.endDatetime);
    const now = new Date();

    const isToday = startTime.toDateString() === now.toDateString();
    const dateStr = isToday
      ? t('common.today')
      : startTime.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });

    const timeStr = `${startTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })} - ${endTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })}`;

    const photo =
      getPrimaryPhotoUrl(booking.companion.photos) ||
      booking.companion.avatar ||
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120';

    return { dateString: dateStr, timeString: timeStr, companionPhoto: photo };
  }, [booking.startDatetime, booking.endDatetime, booking.companion, t]);

  return (
    <Pressable
      onPress={onPress}
      testID={`booking-card-${booking.id}`}
      className="flex-row gap-4 rounded-2xl bg-white p-4"
    >
      <Image
        source={{ uri: companionPhoto }}
        className="size-14 rounded-full"
        contentFit="cover"
      />
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="font-semibold text-midnight">
            {booking.companion.displayName}
          </Text>
          <Badge
            label={
              booking.displayStatus === 'active'
                ? t('common.status.active')
                : booking.displayStatus === 'pending'
                  ? t('common.status.pending')
                  : t('common.status.upcoming')
            }
            variant={
              booking.displayStatus === 'active'
                ? 'teal'
                : booking.displayStatus === 'pending'
                  ? 'pending'
                  : 'rose'
            }
            size="sm"
          />
        </View>
        <Text className="mt-1 text-sm text-rose-400">
          {booking.occasion
            ? `${booking.occasion.emoji} ${booking.occasion.name}`
            : t('common.occasion')}
        </Text>
        <View className="mt-2 flex-row items-center gap-4">
          <View className="flex-row items-center gap-1">
            <Clock color={colors.text.tertiary} width={14} height={14} />
            <Text className="text-xs text-text-tertiary">
              {dateString}, {timeString}
            </Text>
          </View>
        </View>
        <View className="mt-1 flex-row items-center gap-1">
          <MapPin color={colors.text.tertiary} width={14} height={14} />
          <Text className="text-xs text-text-tertiary" numberOfLines={1}>
            {booking.locationAddress}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

export default function HirerDashboard() {
  const router = useRouter();
  const { t } = useTranslation();

  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [upcomingBookings, setUpcomingBookings] = React.useState<
    UpcomingBooking[]
  >([]);
  const [favoritesCount, setFavoritesCount] = React.useState(0);
  const [completedBookingsCount, setCompletedBookingsCount] = React.useState(0);
  const [upcomingCount, setUpcomingCount] = React.useState(0);

  // Get current user for greeting
  const { data: currentUser } = useCurrentUser();

  const userName = currentUser?.user?.fullName?.split(' ')[0] || 'there';

  // Track last fetch time to prevent over-fetching
  const lastFetchRef = React.useRef<number>(0);
  const STALE_TIME = 30000; // 30 seconds

  const fetchDashboardData = React.useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetchRef.current < STALE_TIME) {
      return; // Data is still fresh
    }
    lastFetchRef.current = now;

    try {
      // Fetch all dashboard data in parallel
      const [pendingRes, confirmedRes, completedRes, favoritesRes] =
        await Promise.all([
          bookingsService.getHirerBookings(BookingStatus.PENDING, 1, 10),
          bookingsService.getHirerBookings(BookingStatus.CONFIRMED, 1, 10),
          bookingsService.getHirerBookings(BookingStatus.COMPLETED, 1, 1),
          favoritesService.getFavorites(1, 1),
        ]);

      // Filter upcoming bookings (today and future)
      const now = new Date();

      // Process pending bookings
      const pendingBookings = (pendingRes.bookings || [])
        .filter((booking) => {
          const endDate = new Date(booking.endDatetime);
          return endDate >= now;
        })
        .map((booking) => ({
          ...booking,
          displayStatus: 'pending' as const,
        }));

      // Process confirmed bookings
      const confirmedBookings = (confirmedRes.bookings || [])
        .filter((booking) => {
          const endDate = new Date(booking.endDatetime);
          return endDate >= now;
        })
        .map((booking) => {
          const startDate = new Date(booking.startDatetime);
          const endDate = new Date(booking.endDatetime);

          let displayStatus: 'upcoming' | 'active' = 'upcoming';
          if (now >= startDate && now <= endDate) {
            displayStatus = 'active';
          }

          return { ...booking, displayStatus };
        });

      // Combine and sort by start date, show max 3
      const allUpcoming = [...pendingBookings, ...confirmedBookings]
        .sort(
          (a, b) =>
            new Date(a.startDatetime).getTime() -
            new Date(b.startDatetime).getTime()
        )
        .slice(0, 3);

      setUpcomingBookings(allUpcoming);
      setUpcomingCount(
        (pendingRes.pagination?.total || 0) +
        (confirmedRes.pagination?.total || 0)
      );
      setCompletedBookingsCount(completedRes.pagination?.total || 0);
      setFavoritesCount(favoritesRes.total || 0);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchDashboardData(false); // Don't force on focus
    }, [fetchDashboardData])
  );

  const handleRefresh = React.useCallback(() => {
    setIsRefreshing(true);
    fetchDashboardData(true); // Force refresh
  }, [fetchDashboardData]);

  const handleNotificationPress = React.useCallback(() => {
    // TODO: Navigate to notifications
    console.log('Notifications pressed');
  }, []);

  const handleBookingPress = React.useCallback(
    (booking: UpcomingBooking) => {
      router.push(`/hirer/orders/${booking.id}` as Href);
    },
    [router]
  );

  const handleViewAllBookings = React.useCallback(() => {
    router.push('/bookings' as Href);
  }, [router]);

  const handleBrowseCompanions = React.useCallback(() => {
    router.push('/hirer/browse' as Href);
  }, [router]);

  const handleViewFavorites = React.useCallback(() => {
    router.push('/hirer/favorites' as Href);
  }, [router]);

  // Computed stats with pre-computed background colors
  const stats = React.useMemo(
    () => [
      {
        labelKey: 'hirer.dashboard.stats.upcoming',
        value: String(upcomingCount),
        icon: Calendar,
        color: colors.rose[400],
        bgColor: `${colors.rose[400]}20`,
      },
      {
        labelKey: 'hirer.dashboard.stats.favorites',
        value: String(favoritesCount),
        icon: Heart,
        color: colors.lavender[400],
        bgColor: `${colors.lavender[400]}20`,
      },
      {
        labelKey: 'hirer.dashboard.stats.completed',
        value: String(completedBookingsCount),
        icon: Star,
        color: colors.teal[400],
        bgColor: `${colors.teal[400]}20`,
      },
    ],
    [upcomingCount, favoritesCount, completedBookingsCount]
  );

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 px-4 py-3">
          <HiremeLogo color={colors.rose[400]} width={32} height={32} />
          <View className="flex-1">
            <Text className="text-sm text-text-tertiary">
              {t('hirer.dashboard.greeting')}
            </Text>
            <Text className="font-urbanist-bold text-xl text-midnight">
              {userName} 👋
            </Text>
          </View>
          <Pressable
            onPress={handleNotificationPress}
            testID="notification-button"
            className="relative"
          >
            <Bell color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
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
              <Pressable
                key={stat.labelKey}
                onPress={
                  stat.labelKey === 'hirer.dashboard.stats.upcoming'
                    ? handleViewAllBookings
                    : stat.labelKey === 'hirer.dashboard.stats.favorites'
                      ? handleViewFavorites
                      : undefined
                }
                testID={`stat-card-${stat.labelKey.split('.').pop()}`}
                className="flex-1 rounded-2xl bg-white p-4"
              >
                <View
                  className="mb-2 size-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: stat.bgColor }}
                >
                  <stat.icon color={stat.color} width={20} height={20} />
                </View>
                <Text className="font-urbanist-bold text-xl text-midnight">
                  {stat.value}
                </Text>
                <Text className="text-xs text-text-tertiary">
                  {t(stat.labelKey)}
                </Text>
              </Pressable>
            ))}
          </View>
        </MotiView>

        {/* Browse Companions CTA */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 100 }}
          className="mx-4 mb-4"
        >
          <Pressable
            onPress={handleBrowseCompanions}
            testID="browse-card"
            className="flex-row items-center justify-between rounded-2xl bg-rose-400 p-4"
          >
            <View className="flex-row items-center gap-3">
              <View className="size-12 items-center justify-center rounded-full bg-white/20">
                <Search color="#FFFFFF" width={24} height={24} />
              </View>
              <View>
                <Text className="text-sm text-white/80">
                  {t('hirer.dashboard.find_companion')}
                </Text>
                <Text className="font-urbanist-bold text-lg text-white">
                  {t('hirer.dashboard.browse_companions')}
                </Text>
              </View>
            </View>
            <View className="rounded-full bg-white/20 px-3 py-1">
              <Text className="text-sm font-semibold text-white">
                {t('hirer.dashboard.explore')}
              </Text>
            </View>
          </Pressable>
        </MotiView>

        {/* Upcoming Bookings */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 200 }}
          className="px-4"
        >
          <View className="mb-3 flex-row items-center justify-between">
            <Text
              style={{ fontFamily: 'Urbanist_700Bold' }}
              className="text-lg text-midnight"
            >
              {t('hirer.dashboard.upcoming_bookings')}
            </Text>
            <Pressable
              onPress={handleViewAllBookings}
              testID="view-all-bookings"
            >
              <Text className="text-sm font-semibold text-rose-400">
                {t('common.view_all')}
              </Text>
            </Pressable>
          </View>

          {upcomingBookings.length > 0 ? (
            <View className="gap-3">
              {upcomingBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onPress={() => handleBookingPress(booking)}
                  t={t}
                />
              ))}
            </View>
          ) : (
            <View className="items-center rounded-2xl bg-white py-12">
              <Calendar color={colors.rose[400]} width={48} height={48} />
              <Text className="mt-3 text-lg font-semibold text-midnight">
                {t('hirer.dashboard.no_upcoming_bookings')}
              </Text>
              <Text className="mt-1 text-center text-sm text-text-tertiary">
                {t('hirer.dashboard.start_browsing')}
              </Text>
              <Pressable
                onPress={handleBrowseCompanions}
                className="mt-4 rounded-full bg-rose-400 px-6 py-2"
              >
                <Text className="font-semibold text-white">
                  {t('hirer.dashboard.browse_now')}
                </Text>
              </Pressable>
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
          <Text
            style={{ fontFamily: 'Urbanist_700Bold' }}
            className="mb-3 text-lg text-midnight"
          >
            {t('hirer.dashboard.quick_actions')}
          </Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={handleBrowseCompanions}
              testID="quick-action-browse"
              className="flex-1 items-center rounded-2xl bg-white p-4"
            >
              <View className="mb-2 size-12 items-center justify-center rounded-full bg-rose-400/10">
                <Search color={colors.rose[400]} width={24} height={24} />
              </View>
              <Text className="text-sm font-medium text-midnight">
                {t('hirer.dashboard.actions.browse')}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleViewAllBookings}
              testID="quick-action-bookings"
              className="flex-1 items-center rounded-2xl bg-white p-4"
            >
              <View className="mb-2 size-12 items-center justify-center rounded-full bg-lavender-900/10">
                <Calendar color={colors.lavender[400]} width={24} height={24} />
              </View>
              <Text className="text-sm font-medium text-midnight">
                {t('hirer.dashboard.actions.bookings')}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleViewFavorites}
              testID="quick-action-favorites"
              className="flex-1 items-center rounded-2xl bg-white p-4"
            >
              <View className="mb-2 size-12 items-center justify-center rounded-full bg-teal-400/10">
                <Heart color={colors.teal[400]} width={24} height={24} />
              </View>
              <Text className="text-sm font-medium text-midnight">
                {t('hirer.dashboard.actions.favorites')}
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
