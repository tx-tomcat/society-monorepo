/* eslint-disable max-lines-per-function */
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView
} from 'react-native';

import {
  Badge,
  Button,
  colors,
  CompanionHeader,
  FocusAwareStatusBar,
  Image,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import {
  showErrorMessage,
  showInfoMessage,
  showSuccessMessage,
} from '@/components/ui/utils';
import {
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
} from '@/components/ui/icons';
import { BookingStatus, PaymentStatus } from '@/lib/api/enums';
import {
  useBooking,
  useCancelBooking,
  useCompleteBooking,
  useUpdateBookingStatus,
} from '@/lib/hooks';
import { formatVND } from '@/lib/utils';

// Map status to badge variant
function getStatusBadge(status: BookingStatus): {
  label: string;
  variant: 'default' | 'teal' | 'lavender' | 'rose';
} {
  switch (status) {
    case BookingStatus.CONFIRMED:
      return { label: 'common.status.confirmed', variant: 'teal' };
    case BookingStatus.ACTIVE:
      return { label: 'common.status.active', variant: 'lavender' };
    case BookingStatus.PENDING:
      return { label: 'common.status.pending', variant: 'default' };
    case BookingStatus.COMPLETED:
      return { label: 'common.status.completed', variant: 'teal' };
    case BookingStatus.CANCELLED:
      return { label: 'common.status.cancelled', variant: 'rose' };
    default:
      return { label: 'common.status.unknown', variant: 'default' };
  }
}

export default function CompanionBookingDetail() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Get locale for date formatting (vi-VN or en-US)
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';

  // React Query hooks
  const { data: booking, isLoading } = useBooking(id || '');
  const cancelBooking = useCancelBooking();
  const updateBookingStatus = useUpdateBookingStatus();
  const completeBooking = useCompleteBooking();

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleCallClient = React.useCallback(() => {
    if (!booking) return;
    // TODO: Implement actual call functionality
    Alert.alert(
      t('companion.booking_detail.call'),
      `${t('companion.booking_detail.calling')} ${booking.hirer?.displayName || t('common.client')}...`
    );
  }, [t, booking]);

  const handleMessageClient = React.useCallback(() => {
    if (!booking) return;
    router.push(`/chat/${booking.hirer?.id}` as Href);
  }, [router, booking]);

  const handleStartNavigation = React.useCallback(() => {
    if (!booking) return;
    // Open Google Maps or Apple Maps with the location
    const address = encodeURIComponent(booking.locationAddress);
    const url = `https://maps.google.com/?q=${address}`;
    Linking.openURL(url);
  }, [booking]);

  const handleCancelBooking = React.useCallback(() => {
    if (!booking) return;
    Alert.alert(
      t('companion.booking_detail.cancel_booking'),
      t('companion.booking_detail.cancel_warning'),
      [
        { text: t('companion.booking_detail.no_keep_it'), style: 'cancel' },
        {
          text: t('companion.booking_detail.yes_cancel'),
          style: 'destructive',
          onPress: () => {
            cancelBooking.mutate(
              { bookingId: booking.id, reason: undefined },
              {
                onSuccess: () => {
                  showInfoMessage(t('companion.booking_detail.cancelled'));
                  router.back();
                },
                onError: (error) => {
                  console.error('Failed to cancel booking:', error);
                  showErrorMessage(t('errors.cancel_failed'));
                },
              }
            );
          },
        },
      ]
    );
  }, [router, t, booking, cancelBooking]);

  const handleCheckIn = React.useCallback(() => {
    if (!booking) return;
    updateBookingStatus.mutate(
      { bookingId: booking.id, status: 'ACTIVE' },
      {
        onSuccess: () => {
          showSuccessMessage(t('companion.booking_detail.checked_in'));
        },
        onError: (error) => {
          console.error('Failed to check in:', error);
          showErrorMessage(t('errors.check_in_failed'));
        },
      }
    );
  }, [booking, t, updateBookingStatus]);

  const handleComplete = React.useCallback(() => {
    if (!booking) return;
    Alert.alert(
      t('companion.booking_detail.complete_booking'),
      t('companion.booking_detail.complete_confirmation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: () => {
            completeBooking.mutate(booking.id, {
              onSuccess: () => {
                showSuccessMessage(t('companion.booking_detail.completed'));
              },
              onError: (error) => {
                console.error('Failed to complete booking:', error);
                showErrorMessage(t('errors.complete_failed'));
              },
            });
          },
        },
      ]
    );
  }, [booking, t, completeBooking]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite">
        <ActivityIndicator size="large" color={colors.lavender[400]} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite">
        <Text className="text-text-secondary">
          {t('errors.booking_not_found')}
        </Text>
      </View>
    );
  }

  const startTime = new Date(booking.startDatetime);
  const endTime = new Date(booking.endDatetime);
  const dateStr = startTime.toLocaleDateString(locale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = `${startTime.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
  })} - ${endTime.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
  const yourEarnings = booking.totalPrice - booking.platformFee;
  const statusBadge = getStatusBadge(booking.status);

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <CompanionHeader
        title={t('companion.booking_detail.header')}
        onBack={handleBack}
        rightElement={
          <Badge
            label={t(statusBadge.label)}
            variant={statusBadge.variant}
            size="sm"
          />
        }
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Client Card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          className="m-4 rounded-2xl bg-white p-4"
        >
          <View className="flex-row items-center gap-4">
            <Image
              source={{
                uri:
                  booking.hirer?.avatar ||
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
              }}
              className="size-16 rounded-xl"
              contentFit="cover"
            />
            <View className="flex-1">
              <Text className="text-lg font-bold text-midnight">
                {booking.hirer?.displayName || t('common.anonymous')}
              </Text>
              <View className="mt-1 flex-row items-center gap-2">
                <ShieldCheck color={colors.teal[400]} width={14} height={14} />
                <Text className="text-sm text-midnight">
                  ⭐ {booking.hirer?.rating?.toFixed(1) || '5.0'}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          {/* <View className="mt-4 flex-row gap-3">
            <Pressable
              onPress={handleCallClient}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-lavender-900/10 py-3"
            >
              <Phone color={colors.lavender[400]} width={20} height={20} />
              <Text className="font-semibold text-lavender-900">
                {t('companion.booking_detail.call')}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleMessageClient}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-lavender-900/10 py-3"
            >
              <MessageCircle
                color={colors.lavender[400]}
                width={20}
                height={20}
              />
              <Text className="font-semibold text-lavender-900">
                {t('companion.booking_detail.message')}
              </Text>
            </Pressable>
          </View> */}
        </MotiView>

        {/* Booking Info */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 100 }}
          className="mx-4 mb-4 rounded-2xl bg-white p-4"
        >
          <Text className="mb-4 text-lg font-bold text-midnight">
            {t('companion.booking_detail.booking_info')}
          </Text>

          <View className="gap-4">
            {/* Occasion */}
            <View className="flex-row items-start gap-3">
              <View className="size-10 items-center justify-center rounded-lg bg-rose-400/10">
                <Calendar color={colors.rose[400]} width={20} height={20} />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-text-tertiary">
                  {t('companion.booking_detail.occasion')}
                </Text>
                <Text className="font-semibold text-midnight">
                  {booking.occasion
                    ? `${booking.occasion.emoji} ${booking.occasion.name}`
                    : t('common.occasion')}
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
                  {t('companion.booking_detail.date_time')}
                </Text>
                <Text className="font-semibold text-midnight">{dateStr}</Text>
                <Text className="text-sm text-text-secondary">
                  {timeStr} ({booking.durationHours} {t('common.hours')})
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
                  {t('companion.booking_detail.location')}
                </Text>
                <Text className="font-semibold text-midnight">
                  {booking.locationAddress}
                </Text>
              </View>
            </View>
          </View>

          {/* Navigate Button */}
          {/* <Pressable
            onPress={handleStartNavigation}
            className="mt-4 flex-row items-center justify-center gap-2 rounded-xl bg-teal-400 py-3"
          >
            <Gps color="#FFFFFF" width={20} height={20} />
            <Text className="font-semibold text-white">
              {t('companion.booking_detail.get_directions')}
            </Text>
          </Pressable> */}

          {/* Special Requests */}
          {booking.specialRequests && (
            <View className="mt-4 rounded-xl bg-softpink p-3">
              <Text className="text-sm font-medium text-rose-400">
                {t('companion.booking_detail.special_requests')}
              </Text>
              <Text className="mt-1 text-sm text-text-secondary">
                {booking.specialRequests}
              </Text>
            </View>
          )}
        </MotiView>

        {/* Earnings Summary */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 200 }}
          className="mx-4 mb-4 rounded-2xl bg-white p-4"
        >
          <Text className="mb-4 text-lg font-bold text-midnight">
            {t('companion.booking_detail.your_earnings')}
          </Text>

          <View className="gap-3">
            <View className="flex-row justify-between">
              <Text className="text-text-secondary">
                {t('companion.booking_detail.booking_amount')}
              </Text>
              <Text className="text-midnight">
                {formatVND(booking.totalPrice)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-text-secondary">
                {t('companion.booking_detail.platform_fee')}
              </Text>
              <Text className="text-rose-400">
                -{formatVND(booking.platformFee)}
              </Text>
            </View>
            <View className="h-px bg-border-light" />
            <View className="flex-row justify-between">
              <Text className="font-bold text-midnight">
                {t('companion.booking_detail.you_will_earn')}
              </Text>
              <Text className="font-urbanist-bold text-xl text-teal-400">
                {formatVND(yourEarnings)}
              </Text>
            </View>
          </View>

          <View className="mt-4 rounded-lg bg-lavender-900/10 p-3">
            <Text className="text-center text-sm text-lavender-900">
              {t('companion.booking_detail.payment_release_notice')}
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
            {t('companion.booking_detail.booking_code')}
          </Text>
          <Text className="mt-1 font-urbanist-bold text-2xl tracking-wider text-midnight">
            {booking.bookingNumber}
          </Text>
          <Text className="mt-1 text-xs text-text-tertiary">
            {t('companion.booking_detail.booked_on')}{' '}
            {new Date(booking.createdAt).toLocaleDateString(locale, {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </MotiView>

        {/* Safety Reminder */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 400 }}
          className="mx-4 mb-4 rounded-xl bg-teal-400/10 p-4"
        >
          <View className="flex-row items-start gap-3">
            <ShieldCheck color={colors.teal[400]} width={24} height={24} />
            <View className="flex-1">
              <Text className="font-semibold text-teal-700">
                {t('companion.booking_detail.safety_reminder')}
              </Text>
              <Text className="mt-1 text-sm text-text-secondary">
                {t('companion.booking_detail.safety_reminder_text')}
              </Text>
            </View>
          </View>
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
          {booking.status === BookingStatus.CONFIRMED && (
            <>
              <Button
                label={t('companion.booking_detail.cancel_booking')}
                onPress={handleCancelBooking}
                variant="outline"
                size="lg"
                loading={cancelBooking.isPending}
                disabled={
                  cancelBooking.isPending || updateBookingStatus.isPending
                }
                className="flex-1"
              />
              {booking.paymentStatus === PaymentStatus.PAID && (
                <Button
                  label={t('companion.booking_detail.ive_arrived')}
                  onPress={handleCheckIn}
                  variant="default"
                  size="lg"
                  loading={updateBookingStatus.isPending}
                  disabled={
                    cancelBooking.isPending || updateBookingStatus.isPending
                  }
                  className="flex-1 bg-lavender-900"
                />
              )}
            </>
          )}
          {booking.status === BookingStatus.ACTIVE && (
            <Button
              label={t('companion.booking_detail.complete_booking')}
              onPress={handleComplete}
              variant="default"
              size="lg"
              loading={completeBooking.isPending}
              disabled={completeBooking.isPending}
              className="flex-1 bg-teal-400"
            />
          )}
          {(booking.status === BookingStatus.COMPLETED ||
            booking.status === BookingStatus.CANCELLED) && (
              <Button
                label={t('common.back')}
                onPress={handleBack}
                variant="outline"
                size="lg"
                className="flex-1"
              />
            )}
        </View>
      </SafeAreaView>
    </View>
  );
}
