/* eslint-disable max-lines-per-function */
import { FlashList } from '@shopify/flash-list';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, RefreshControl } from 'react-native';

import {
  Button,
  colors,
  FocusAwareStatusBar,
  Image,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { Calendar, Clock, CreditCard, MapPin } from '@/components/ui/icons';
import { BookingStatus, PaymentStatus } from '@/lib/api/enums';
import { getPhotoUrl } from '@/lib/api/services/companions.service';
import { useBookings } from '@/lib/hooks';

type DisplayBookingStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'expired';

type Booking = {
  id: string;
  companion: {
    name: string;
    image: string;
  };
  occasion: string;
  occasionEmoji: string;
  date: string;
  time: string;
  location: string;
  status: DisplayBookingStatus;
  rawStatus: BookingStatus;
  paymentStatus: PaymentStatus;
};

const TABS = [
  { id: 'upcoming', labelKey: 'hirer.orders.tabs.upcoming' },
  { id: 'past', labelKey: 'hirer.orders.tabs.past' },
];

// Move status mapping outside component to avoid recreation on each render
// For upcoming: fetch both PENDING (waiting for companion) and CONFIRMED (waiting for payment or ready)
const API_STATUS_MAP: Record<string, string | undefined> = {
  upcoming: `${BookingStatus.PENDING},${BookingStatus.CONFIRMED},${BookingStatus.ACTIVE}`,
  past: BookingStatus.COMPLETED,
};

// Map booking status + payment status to display status
const getDisplayStatus = (
  bookingStatus: BookingStatus,
  paymentStatus: PaymentStatus
): DisplayBookingStatus => {
  switch (bookingStatus) {
    case BookingStatus.PENDING:
      return 'pending';
    case BookingStatus.CONFIRMED:
      // If confirmed but payment is pending, show awaiting_payment
      if (paymentStatus === PaymentStatus.PENDING) {
        return 'awaiting_payment';
      }
      return 'confirmed';
    case BookingStatus.ACTIVE:
      return 'active';
    case BookingStatus.COMPLETED:
      return 'completed';
    case BookingStatus.CANCELLED:
    case BookingStatus.DISPUTED:
      return 'cancelled';
    case BookingStatus.EXPIRED:
      return 'expired';
    default:
      return 'pending';
  }
};

const getStatusConfig = (status: DisplayBookingStatus, t: (key: string) => string) => {
  switch (status) {
    case 'pending':
      return {
        label: t('hirer.orders.status.pending'),
        bgColor: '#FFFBEB',
        textColor: '#E6C337',
      };
    case 'awaiting_payment':
      return {
        label: t('hirer.orders.status.awaiting_payment'),
        bgColor: '#FFF1F2',
        textColor: colors.rose[500],
      };
    case 'confirmed':
      return {
        label: t('hirer.orders.status.confirmed'),
        bgColor: '#EDFCFB',
        textColor: '#46B9B1',
      };
    case 'active':
      return {
        label: t('hirer.orders.status.in_progress'),
        bgColor: '#F3E8FF',
        textColor: colors.lavender[600],
      };
    case 'completed':
      return {
        label: t('hirer.orders.status.completed'),
        bgColor: '#F0EEF2',
        textColor: colors.text.secondary,
      };
    case 'cancelled':
      return {
        label: t('hirer.orders.status.cancelled'),
        bgColor: '#FEE2E2',
        textColor: '#EF4444',
      };
    case 'expired':
      return {
        label: t('hirer.orders.status.expired'),
        bgColor: '#F0EEF2',
        textColor: colors.text.secondary,
      };
    default:
      return {
        label: status,
        bgColor: '#F0EEF2',
        textColor: colors.text.secondary,
      };
  }
};

function BookingCard({
  booking,
  onPress,
  onPayPress,
  t,
}: {
  booking: Booking;
  onPress: () => void;
  onPayPress: () => void;
  t: (key: string) => string;
}) {
  const statusConfig = getStatusConfig(booking.status, t);
  // Show pay button when booking is confirmed but payment is still pending
  const needsPayment =
    booking.rawStatus === BookingStatus.CONFIRMED &&
    booking.paymentStatus === PaymentStatus.PENDING;

  return (
    <Pressable onPress={onPress}>
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
        className="mx-4 mb-3 overflow-hidden rounded-2xl bg-white shadow-sm"
      >
        {/* Top row: Avatar, Name/Occasion, Badge */}
        <View className="flex-row items-center p-4 pb-3">
          <Image
            source={{ uri: booking.companion.image }}
            className="size-12 rounded-full"
            contentFit="cover"
          />
          <View className="ml-3 flex-1">
            <Text className="font-urbanist-semibold text-sm text-midnight">
              {booking.companion.name}
            </Text>
            <Text className="mt-0.5 text-xs text-text-secondary">
              {booking.occasionEmoji} {booking.occasion}
            </Text>
          </View>
          <View
            className="rounded-xl px-2.5 py-1"
            style={{ backgroundColor: statusConfig.bgColor }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: statusConfig.textColor }}
            >
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View className="mx-4 h-px bg-border-light" />

        {/* Bottom row: Date, Time, Location */}
        <View className="flex-row items-center gap-3 px-4 py-3">
          <View className="flex-row items-center gap-1">
            <Calendar
              color={colors.text.secondary}
              size={12}
              width={12}
              height={12}
            />
            <Text className="text-xs text-text-secondary">{booking.date}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Clock color={colors.text.secondary} width={12} height={12} />
            <Text className="text-xs text-text-secondary">{booking.time}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <MapPin color={colors.text.secondary} width={12} height={12} />
            <Text className="text-xs text-text-secondary">
              {booking.location}
            </Text>
          </View>
        </View>

        {/* Payment Button - Show when booking is confirmed but payment is pending */}
        {needsPayment && (
          <>
            <View className="mx-4 h-px bg-border-light" />
            <View className="p-3">
              <Button
                label={t('hirer.orders.pay_now')}
                onPress={(e) => {
                  e?.stopPropagation?.();
                  onPayPress();
                }}
                variant="default"
                size="sm"
                icon={CreditCard}
                className="bg-rose-400"
              />
            </View>
          </>
        )}
      </MotiView>
    </Pressable>
  );
}

export default function MyBookings() {
  const router = useRouter();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState('upcoming');

  // API hook
  const {
    data: bookingsData,
    isLoading,
    refetch,
    isRefetching,
  } = useBookings(API_STATUS_MAP[activeTab]);

  // Transform bookings data from API Booking type
  const bookings = React.useMemo(() => {
    if (!bookingsData?.bookings) return [];
    return bookingsData.bookings.map((b) => {
      return {
        id: b.id,
        companion: {
          name: b.companion?.displayName || '',
          image:
            b.companion?.avatar || getPhotoUrl(b.companion?.photos?.[0]) || '',
        },
        occasion: b.occasion?.name || 'Casual',
        occasionEmoji: b.occasion?.emoji || '👋',
        date: b.startDatetime
          ? new Date(b.startDatetime).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })
          : '',
        time: b.startDatetime
          ? new Date(b.startDatetime).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })
          : `${b.durationHours}h`,
        location: b.locationAddress?.split(',')[0] || '',
        status: getDisplayStatus(b.status, b.paymentStatus),
        rawStatus: b.status,
        paymentStatus: b.paymentStatus,
      };
    }) as Booking[];
  }, [bookingsData]);

  const handleBookingPress = React.useCallback(
    (booking: Booking) => {
      router.push(`/hirer/orders/${booking.id}` as Href);
    },
    [router]
  );

  const handlePayPress = React.useCallback(
    (booking: Booking) => {
      router.push(`/hirer/booking/payment/${booking.id}` as Href);
    },
    [router]
  );

  const handleRefresh = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const renderBooking = React.useCallback(
    ({ item }: { item: Booking }) => (
      <BookingCard
        booking={item}
        onPress={() => handleBookingPress(item)}
        onPayPress={() => handlePayPress(item)}
        t={t}
      />
    ),
    [handleBookingPress, handlePayPress, t]
  );

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        {/* Header - Left-aligned title, no back button */}
        <View className="bg-white px-4 pb-0 pt-2">
          <Text className="font-urbanist-bold text-2xl text-midnight">
            {t('hirer.orders.header')}
          </Text>
        </View>

        {/* Segmented Tabs */}
        <View className="flex-row gap-2 bg-white px-4 py-3">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className="flex-1"
              >
                <View
                  className={`items-center rounded-lg py-2 ${isActive ? 'bg-teal-400' : 'bg-neutral-100'
                    }`}
                >
                  <Text
                    className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-text-secondary'
                      }`}
                  >
                    {t(tab.labelKey)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>

      {/* Bookings List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.teal[400]} size="large" />
        </View>
      ) : (
        <FlashList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 12 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              tintColor={colors.teal[400]}
              colors={[colors.teal[400]]}
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-lg text-text-tertiary">
                {t('hirer.orders.empty')}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
