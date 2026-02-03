/* eslint-disable max-lines-per-function */
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView } from 'react-native';

import {
  Badge,
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
  CreditCard,
  MapPin,
  MessageCircle,
  Phone,
  Receipt,
  ShieldCheck,
  Star,
} from '@/components/ui/icons';
import { BookingStatus, PaymentStatus } from '@/lib/api/enums';
import { getPhotoUrl } from '@/lib/api/services/companions.service';
import { useBooking, useCancelBooking } from '@/lib/hooks';

type DisplayBookingStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'expired';

const STATUS_CONFIG: Record<
  DisplayBookingStatus,
  { variant: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'lavender' | 'rose'; labelKey: string }
> = {
  pending: { variant: 'pending', labelKey: 'hirer.orders.status.pending' },
  awaiting_payment: { variant: 'rose', labelKey: 'hirer.orders.status.awaiting_payment' },
  confirmed: { variant: 'confirmed', labelKey: 'hirer.orders.status.confirmed' },
  active: { variant: 'lavender', labelKey: 'hirer.orders.status.in_progress' },
  completed: { variant: 'completed', labelKey: 'hirer.orders.status.completed' },
  cancelled: { variant: 'cancelled', labelKey: 'hirer.orders.status.cancelled' },
  expired: { variant: 'cancelled', labelKey: 'hirer.orders.status.expired' },
};

// Day of week keys for i18n
const DAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

// Month keys for i18n
const MONTH_KEYS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
] as const;

export default function BookingDetail() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  // API hooks
  const { data: bookingData, isLoading } = useBooking(id || '');
  const cancelBookingMutation = useCancelBooking();

  // Transform booking data
  const booking = React.useMemo(() => {
    if (!bookingData) return null;
    const b = bookingData;
    const hours = b.durationHours || 0;
    const hourlyRate = b.basePrice ? Math.round(b.basePrice / hours) : 0;
    const startDate = b.startDatetime ? new Date(b.startDatetime) : null;
    const endDate = b.endDatetime ? new Date(b.endDatetime) : null;

    // Format time range
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    };

    // Map API status to local display status based on booking AND payment status
    const mapStatus = (
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

    return {
      id: b.id,
      companion: {
        id: b.companion?.id || b.companionId || '',
        name: b.companion?.displayName || '',
        image:
          b.companion?.avatar || getPhotoUrl(b.companion?.photos?.[0]) || '',
        rating: b.companion?.rating ?? 0,
        reviewCount: b.companion?.reviewCount ?? 0,
        isVerified:
          b.companion?.isVerified ??
          b.companion?.verificationStatus === 'verified',
      },
      occasion: b.occasion?.name || 'Meeting',
      occasionEmoji: b.occasion?.emoji || '📅',
      date: startDate
        ? (() => {
          const dayKey = DAY_KEYS[startDate.getDay()];
          const monthKey = MONTH_KEYS[startDate.getMonth()];
          const day = startDate.getDate();
          const year = startDate.getFullYear();
          const weekday = t(`common.days.${dayKey}`);
          const month = t(`common.months.${monthKey}`);
          // Vietnamese: "Thứ 6, 30 Tháng 1 2026", English: "Friday, Jan 30, 2026"
          return i18n.language === 'vi'
            ? `${weekday}, ${day} ${month} ${year}`
            : `${weekday}, ${month} ${day}, ${year}`;
        })()
        : '',
      time:
        startDate && endDate
          ? `${formatTime(startDate)} - ${formatTime(endDate)}`
          : '',
      duration: `${hours} ${t('common.hours')}`,
      location: b.locationAddress || '',
      status: mapStatus(b.status, b.paymentStatus),
      rawStatus: b.status,
      specialRequests: b.specialRequests || '',
      pricing: {
        hourlyRate,
        hours,
        total: b.totalPrice || 0,
      },
      bookingCode: b.bookingNumber || `SOC-${b.id.slice(0, 8).toUpperCase()}`,
      createdAt: b.createdAt
        ? (() => {
          const date = new Date(b.createdAt);
          const monthKey = MONTH_KEYS[date.getMonth()];
          const day = date.getDate();
          const year = date.getFullYear();
          const month = t(`common.months.${monthKey}`);
          // Vietnamese: "30 Tháng 1 2026", English: "Jan 30, 2026"
          return i18n.language === 'vi'
            ? `${day} ${month} ${year}`
            : `${month} ${day}, ${year}`;
        })()
        : '',
      paymentStatus: b.paymentStatus,
      paymentDeadline: b.paymentDeadline ? new Date(b.paymentDeadline) : null,
    };
  }, [bookingData, t, i18n.language]);

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleCallCompanion = React.useCallback(() => {
    if (booking) {
      Alert.alert('Call', `Calling ${booking.companion.name}...`);
    }
  }, [booking]);

  const handleMessageCompanion = React.useCallback(() => {
    if (booking?.companion.id) {
      router.push(`/hirer/chat/${booking.companion.id}` as Href);
    }
  }, [router, booking]);

  const handleCancelBooking = React.useCallback(() => {
    if (!id) return;
    Alert.alert(
      t('hirer.booking_detail.cancel_title'),
      t('hirer.booking_detail.cancel_message'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('common.yes'),
          style: 'destructive',
          onPress: () => {
            cancelBookingMutation.mutate(
              { bookingId: id, reason: 'User cancelled' },
              {
                onSuccess: () => {
                  Alert.alert(
                    t('common.success'),
                    t('hirer.booking_detail.cancelled_success')
                  );
                },
                onError: () => {
                  Alert.alert(
                    t('common.error'),
                    t('hirer.booking_detail.cancelled_error')
                  );
                },
              }
            );
          },
        },
      ]
    );
  }, [id, cancelBookingMutation, t]);

  const handleViewReceipt = React.useCallback(() => {
    Alert.alert('Receipt', 'Downloading receipt...');
  }, []);

  const handleMakePayment = React.useCallback(() => {
    if (id) {
      router.push(`/hirer/booking/payment/${id}` as Href);
    }
  }, [id, router]);

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite">
        <ActivityIndicator size="large" color={colors.rose[400]} />
      </View>
    );
  }

  // Error state
  if (!booking) {
    return (
      <View className="flex-1 bg-warmwhite">
        <FocusAwareStatusBar />
        <SafeAreaView edges={['top']}>
          <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
            <Pressable onPress={handleBack}>
              <ArrowLeft
                color={colors.midnight.DEFAULT}
                width={24}
                height={24}
              />
            </Pressable>
            <Text className="flex-1 font-urbanist-bold text-xl text-midnight">
              {t('hirer.booking_detail.header')}
            </Text>
          </View>
        </SafeAreaView>
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-center text-text-secondary">
            {t('hirer.booking_detail.not_found')}
          </Text>
        </View>
      </View>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable onPress={handleBack}>
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text className="flex-1 font-urbanist-bold text-xl text-midnight">
            {t('hirer.booking_detail.header')}
          </Text>
          <Badge
            label={t(statusConfig.labelKey)}
            variant={statusConfig.variant}
            size="sm"
          />
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Payment Required Banner - Show when booking is confirmed but payment is still pending */}
        {booking.rawStatus === BookingStatus.CONFIRMED &&
          booking.paymentStatus === PaymentStatus.PENDING && (
            <MotiView
              from={{ opacity: 0, translateY: -10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400 }}
              className="mx-4 mt-4 flex-row items-center gap-3 rounded-2xl bg-yellow-400/10 p-4"
            >
              <View className="size-10 items-center justify-center rounded-full bg-yellow-400/20">
                <CreditCard color={colors.yellow[600]} width={20} height={20} />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-yellow-700">
                  {t('hirer.booking_detail.payment_required')}
                </Text>
                <Text className="text-sm text-yellow-600">
                  {booking.paymentDeadline
                    ? `${t('hirer.booking_detail.payment_deadline')} ${booking.paymentDeadline.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })} ${t('hirer.booking_detail.payment_deadline_suffix')}`
                    : t('hirer.booking_detail.payment_required_desc')}
                </Text>
              </View>
            </MotiView>
          )}

        {/* Companion Card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          className="m-4 rounded-2xl bg-white p-4"
        >
          <View className="flex-row items-center gap-4">
            <Image
              source={{ uri: booking.companion.image }}
              className="size-20 rounded-xl"
              contentFit="cover"
            />
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-xl font-bold text-midnight">
                  {booking.companion.name}
                </Text>
                {booking.companion.isVerified && (
                  <ShieldCheck
                    color={colors.teal[400]}
                    width={18}
                    height={18}
                  />
                )}
              </View>
              <View className="mt-1 flex-row items-center gap-1">
                <Star color={colors.yellow[400]} width={16} height={16} />
                <Text className="font-semibold text-midnight">
                  {booking.companion.rating}
                </Text>
                <Text className="text-sm text-text-tertiary">
                  ({booking.companion.reviewCount} {t('common.reviews')})
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Actions - only show when booking is confirmed or active */}
          {(booking.rawStatus === BookingStatus.CONFIRMED ||
            booking.rawStatus === BookingStatus.ACTIVE) && (
              <View className="mt-4 flex-row gap-3">
                <Pressable
                  onPress={handleCallCompanion}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-softpink py-3"
                >
                  <Phone color={colors.rose[400]} width={20} height={20} />
                  <Text className="font-semibold text-rose-400">
                    {t('hirer.booking_detail.call')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleMessageCompanion}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-softpink py-3"
                >
                  <MessageCircle
                    color={colors.rose[400]}
                    width={20}
                    height={20}
                  />
                  <Text className="font-semibold text-rose-400">
                    {t('hirer.booking_detail.message')}
                  </Text>
                </Pressable>
              </View>
            )}
        </MotiView>

        {/* Booking Info */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 100 }}
          className="mx-4 mb-4 rounded-2xl bg-white p-4"
        >
          <Text className="mb-4 text-lg font-bold text-midnight">
            {t('hirer.booking_detail.booking_info')}
          </Text>

          <View className="gap-4">
            {/* Occasion */}
            <View className="flex-row items-start gap-3">
              <View className="size-10 items-center justify-center rounded-lg bg-rose-400/10">
                <Calendar color={colors.rose[400]} width={20} height={20} />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-text-tertiary">
                  {t('hirer.booking_detail.occasion')}
                </Text>
                <Text className="font-semibold text-midnight">
                  {booking.occasion}
                </Text>
              </View>
            </View>

            {/* Date & Time */}
            <View className="flex-row items-start gap-3">
              <View className="size-10 items-center justify-center rounded-lg bg-lavender-900/10">
                <Clock color={colors.lavender[400]} width={20} height={20} />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-text-tertiary">
                  {t('hirer.booking_detail.date_time')}
                </Text>
                <Text className="font-semibold text-midnight">
                  {booking.date}
                </Text>
                <Text className="text-sm text-text-secondary">
                  {booking.time} ({booking.duration})
                </Text>
              </View>
            </View>

            {/* Location */}
            <View className="flex-row items-start gap-3">
              <View className="size-10 items-center justify-center rounded-lg bg-teal-400/10">
                <MapPin color={colors.teal[400]} width={20} height={20} />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-text-tertiary">
                  {t('hirer.booking_detail.location')}
                </Text>
                <Text className="font-semibold text-midnight">
                  {booking.location}
                </Text>
              </View>
            </View>
          </View>

          {/* Special Requests */}
          {booking.specialRequests && (
            <View className="mt-4 rounded-xl bg-softpink p-3">
              <Text className="text-sm font-medium text-rose-400">
                {t('hirer.booking_detail.special_requests')}
              </Text>
              <Text className="mt-1 text-sm text-text-secondary">
                {booking.specialRequests}
              </Text>
            </View>
          )}
        </MotiView>

        {/* Payment Summary */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 200 }}
          className="mx-4 mb-4 rounded-2xl bg-white p-4"
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-bold text-midnight">
              {t('hirer.booking_detail.payment_summary')}
            </Text>
            <Pressable
              onPress={handleViewReceipt}
              className="flex-row items-center gap-1"
            >
              <Receipt color={colors.rose[400]} width={16} height={16} />
              <Text className="text-sm font-medium text-rose-400">
                {t('hirer.booking_detail.view_receipt')}
              </Text>
            </Pressable>
          </View>

          <View className="mt-4 gap-3">
            <View className="flex-row justify-between">
              <Text className="text-text-secondary">
                {booking.pricing.hourlyRate.toLocaleString('vi-VN')}đ x{' '}
                {booking.pricing.hours} hours
              </Text>
              <Text className="text-lg font-bold text-rose-400">
                {booking.pricing.total.toLocaleString('vi-VN')}đ
              </Text>
            </View>
          </View>

          <View className="mt-4 rounded-lg bg-teal-400/10 p-3">
            <Text className="text-center text-sm text-teal-700">
              {t('hirer.booking_detail.escrow_notice')}
            </Text>
          </View>
        </MotiView>

        {/* Booking Code */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 300 }}
          className="mx-4 mb-4 items-center rounded-2xl bg-white p-4"
        >
          <Text className="text-sm text-text-tertiary">
            {t('hirer.booking_detail.booking_code')}
          </Text>
          <Text className="mt-1 text-2xl font-bold tracking-wider text-midnight">
            {booking.bookingCode}
          </Text>
          <Text className="mt-1 text-xs text-text-tertiary">
            {t('hirer.booking_detail.booked_on')} {booking.createdAt}
          </Text>
        </MotiView>

        {/* Spacer */}
        <View className="h-32" />
      </ScrollView>

      {/* Bottom Actions */}
      <SafeAreaView
        edges={['bottom']}
        className="border-t border-border-light bg-white"
      >
        <View className="flex-row gap-3 p-4">
          {/* Show Make Payment button when booking is confirmed but payment is still pending */}
          {booking.rawStatus === BookingStatus.CONFIRMED &&
            booking.paymentStatus === PaymentStatus.PENDING && (
              <Button
                label={t('hirer.booking_detail.make_payment')}
                onPress={handleMakePayment}
                variant="default"
                size="lg"
                className="flex-1 bg-rose-400"
                icon={CreditCard}
              />
            )}
          {booking.rawStatus !== BookingStatus.CANCELLED &&
            booking.rawStatus !== BookingStatus.COMPLETED &&
            booking.rawStatus !== BookingStatus.DISPUTED && (
              <Button
                label={t('hirer.booking_detail.cancel_booking')}
                onPress={handleCancelBooking}
                variant="outline"
                size="lg"
                className="flex-1"
                loading={cancelBookingMutation.isPending}
              />
            )}
        </View>
      </SafeAreaView>
    </View>
  );
}
