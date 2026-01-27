/* eslint-disable max-lines-per-function */
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
} from 'react-native';

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
  MapPin,
  MessageCircle,
  Phone,
  Receipt,
  ShieldCheck,
  Star,
} from '@/components/ui/icons';
import { useBooking, useCancelBooking } from '@/lib/hooks';

type BookingStatus =
  | 'upcoming'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'pending';

const STATUS_CONFIG: Record<
  BookingStatus,
  { variant: 'lavender' | 'teal' | 'secondary' | 'rose'; labelKey: string }
> = {
  upcoming: { variant: 'lavender', labelKey: 'hirer.orders.status.upcoming' },
  pending: { variant: 'rose', labelKey: 'hirer.orders.status.pending' },
  active: { variant: 'teal', labelKey: 'hirer.orders.status.in_progress' },
  completed: {
    variant: 'secondary',
    labelKey: 'hirer.orders.status.completed',
  },
  cancelled: {
    variant: 'secondary',
    labelKey: 'hirer.orders.status.cancelled',
  },
};

export default function BookingDetail() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  // API hooks
  const { data: bookingData, isLoading } = useBooking(id || '');
  const cancelBookingMutation = useCancelBooking();

  // Transform booking data
  const booking = React.useMemo(() => {
    if (!bookingData) return null;
    const b = bookingData as {
      id: string;
      companion?: {
        id?: string;
        name?: string;
        profileImage?: string;
        avgRating?: number;
        rating?: number;
        totalReviews?: number;
        reviewCount?: number;
        isVerified?: boolean;
      };
      companionId?: string;
      companionName?: string;
      companionImage?: string;
      occasion?: string;
      date?: string;
      startTime?: string;
      endTime?: string;
      duration?: number;
      location?: string;
      status?: string;
      notes?: string;
      hourlyRate?: number;
      subtotal?: number;
      serviceFee?: number;
      totalAmount?: number;
      bookingCode?: string;
      createdAt?: string;
    };
    const hours = b.duration || 0;
    const hourlyRate = b.hourlyRate || 0;
    const subtotal = b.subtotal || hourlyRate * hours;
    const serviceFee = b.serviceFee || Math.round(subtotal * 0.18);

    return {
      id: b.id,
      companion: {
        id: b.companion?.id || b.companionId || '',
        name: b.companion?.name || b.companionName || '',
        image: b.companion?.profileImage || b.companionImage || '',
        rating: b.companion?.avgRating ?? b.companion?.rating ?? 0,
        reviewCount: b.companion?.totalReviews ?? b.companion?.reviewCount ?? 0,
        isVerified: b.companion?.isVerified ?? false,
      },
      occasion: b.occasion || 'Casual',
      date: b.date
        ? new Date(b.date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        : '',
      time:
        b.startTime && b.endTime
          ? `${b.startTime} - ${b.endTime}`
          : b.startTime || '',
      duration: `${hours} hours`,
      location: b.location || '',
      status: (b.status || 'upcoming') as BookingStatus,
      specialRequests: b.notes || '',
      pricing: {
        hourlyRate,
        hours,
        subtotal,
        serviceFee,
        total: b.totalAmount || subtotal + serviceFee,
      },
      bookingCode: b.bookingCode || `SOC-${b.id.slice(0, 8).toUpperCase()}`,
      createdAt: b.createdAt
        ? new Date(b.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : '',
    };
  }, [bookingData]);

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

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.upcoming;

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

          {/* Quick Actions */}
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
              <MessageCircle color={colors.rose[400]} width={20} height={20} />
              <Text className="font-semibold text-rose-400">
                {t('hirer.booking_detail.message')}
              </Text>
            </Pressable>
          </View>
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
              <View className="size-10 items-center justify-center rounded-lg bg-lavender-400/10">
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
              <Text className="text-midnight">
                {booking.pricing.subtotal.toLocaleString('vi-VN')}đ
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-text-secondary">
                {t('hirer.booking_detail.service_fee')}
              </Text>
              <Text className="text-midnight">
                {booking.pricing.serviceFee.toLocaleString('vi-VN')}đ
              </Text>
            </View>
            <View className="h-px bg-border-light" />
            <View className="flex-row justify-between">
              <Text className="font-bold text-midnight">
                {t('hirer.booking_detail.total')}
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
          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
            <Button
              label={t('hirer.booking_detail.cancel_booking')}
              onPress={handleCancelBooking}
              variant="outline"
              size="lg"
              className="flex-1"
              loading={cancelBookingMutation.isPending}
            />
          )}
          <Button
            label={t('hirer.booking_detail.get_directions')}
            onPress={() => {}}
            variant="default"
            size="lg"
            className="flex-1"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

