/* eslint-disable max-lines-per-function */
import { MotiView } from 'moti';
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

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
  Phone,
  MessageCircle,
  ShieldCheck,
  Star,
  Receipt,
} from '@/components/ui/icons';

// Mock booking data
const BOOKING = {
  id: '1',
  companion: {
    id: 'c1',
    name: 'Minh Anh',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
    rating: 4.9,
    reviewCount: 127,
    isVerified: true,
  },
  occasion: 'Wedding Reception',
  date: 'January 15, 2025',
  time: '2:00 PM - 6:00 PM',
  duration: '4 hours',
  location: 'Rex Hotel, 141 Nguyen Hue, District 1, HCMC',
  status: 'upcoming' as const,
  specialRequests: 'Please dress formally in a red áo dài if possible',
  pricing: {
    hourlyRate: 500000,
    hours: 4,
    subtotal: 2000000,
    serviceFee: 200000,
    total: 2200000,
  },
  bookingCode: 'SOC-2025-0115',
  createdAt: 'Jan 10, 2025',
};

export default function BookingDetail() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleCallCompanion = React.useCallback(() => {
    Alert.alert('Call', `Calling ${BOOKING.companion.name}...`);
  }, []);

  const handleMessageCompanion = React.useCallback(() => {
    router.push(`/chat/${BOOKING.companion.id}` as Href);
  }, [router]);

  const handleCancelBooking = React.useCallback(() => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? Cancellation fees may apply.',
      [
        { text: 'No, Keep It', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: () => console.log('Cancelled') },
      ]
    );
  }, []);

  const handleViewReceipt = React.useCallback(() => {
    Alert.alert('Receipt', 'Downloading receipt...');
  }, []);

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable onPress={handleBack}>
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text style={styles.headerTitle} className="flex-1 text-xl text-midnight">
            {t('hirer.booking_detail.header')}
          </Text>
          <Badge label={t('hirer.orders.status.upcoming')} variant="lavender" size="sm" />
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
              source={{ uri: BOOKING.companion.image }}
              className="size-20 rounded-xl"
              contentFit="cover"
            />
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-xl font-bold text-midnight">
                  {BOOKING.companion.name}
                </Text>
                {BOOKING.companion.isVerified && (
                  <ShieldCheck color={colors.teal[400]} width={18} height={18} />
                )}
              </View>
              <View className="mt-1 flex-row items-center gap-1">
                <Star color={colors.yellow[400]} width={16} height={16} />
                <Text className="font-semibold text-midnight">
                  {BOOKING.companion.rating}
                </Text>
                <Text className="text-sm text-text-tertiary">
                  ({BOOKING.companion.reviewCount} {t('common.reviews')})
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
              <Text className="font-semibold text-rose-400">{t('hirer.booking_detail.call')}</Text>
            </Pressable>
            <Pressable
              onPress={handleMessageCompanion}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-softpink py-3"
            >
              <MessageCircle color={colors.rose[400]} width={20} height={20} />
              <Text className="font-semibold text-rose-400">{t('hirer.booking_detail.message')}</Text>
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
          <Text className="mb-4 text-lg font-bold text-midnight">{t('hirer.booking_detail.booking_info')}</Text>

          <View className="gap-4">
            {/* Occasion */}
            <View className="flex-row items-start gap-3">
              <View className="size-10 items-center justify-center rounded-lg bg-rose-400/10">
                <Calendar color={colors.rose[400]} width={20} height={20} />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-text-tertiary">{t('hirer.booking_detail.occasion')}</Text>
                <Text className="font-semibold text-midnight">{BOOKING.occasion}</Text>
              </View>
            </View>

            {/* Date & Time */}
            <View className="flex-row items-start gap-3">
              <View className="size-10 items-center justify-center rounded-lg bg-lavender-400/10">
                <Clock color={colors.lavender[400]} width={20} height={20} />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-text-tertiary">{t('hirer.booking_detail.date_time')}</Text>
                <Text className="font-semibold text-midnight">{BOOKING.date}</Text>
                <Text className="text-sm text-text-secondary">
                  {BOOKING.time} ({BOOKING.duration})
                </Text>
              </View>
            </View>

            {/* Location */}
            <View className="flex-row items-start gap-3">
              <View className="size-10 items-center justify-center rounded-lg bg-teal-400/10">
                <MapPin color={colors.teal[400]} width={20} height={20} />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-text-tertiary">{t('hirer.booking_detail.location')}</Text>
                <Text className="font-semibold text-midnight">{BOOKING.location}</Text>
              </View>
            </View>
          </View>

          {/* Special Requests */}
          {BOOKING.specialRequests && (
            <View className="mt-4 rounded-xl bg-softpink p-3">
              <Text className="text-sm font-medium text-rose-400">{t('hirer.booking_detail.special_requests')}</Text>
              <Text className="mt-1 text-sm text-text-secondary">
                {BOOKING.specialRequests}
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
            <Text className="text-lg font-bold text-midnight">{t('hirer.booking_detail.payment_summary')}</Text>
            <Pressable onPress={handleViewReceipt} className="flex-row items-center gap-1">
              <Receipt color={colors.rose[400]} width={16} height={16} />
              <Text className="text-sm font-medium text-rose-400">{t('hirer.booking_detail.view_receipt')}</Text>
            </Pressable>
          </View>

          <View className="mt-4 gap-3">
            <View className="flex-row justify-between">
              <Text className="text-text-secondary">
                {BOOKING.pricing.hourlyRate.toLocaleString('vi-VN')}đ x {BOOKING.pricing.hours} hours
              </Text>
              <Text className="text-midnight">
                {BOOKING.pricing.subtotal.toLocaleString('vi-VN')}đ
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-text-secondary">{t('hirer.booking_detail.service_fee')}</Text>
              <Text className="text-midnight">
                {BOOKING.pricing.serviceFee.toLocaleString('vi-VN')}đ
              </Text>
            </View>
            <View className="h-px bg-border-light" />
            <View className="flex-row justify-between">
              <Text className="font-bold text-midnight">{t('hirer.booking_detail.total')}</Text>
              <Text className="text-lg font-bold text-rose-400">
                {BOOKING.pricing.total.toLocaleString('vi-VN')}đ
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
          <Text className="text-sm text-text-tertiary">{t('hirer.booking_detail.booking_code')}</Text>
          <Text className="mt-1 text-2xl font-bold tracking-wider text-midnight">
            {BOOKING.bookingCode}
          </Text>
          <Text className="mt-1 text-xs text-text-tertiary">{t('hirer.booking_detail.booked_on')} {BOOKING.createdAt}</Text>
        </MotiView>

        {/* Spacer */}
        <View className="h-32" />
      </ScrollView>

      {/* Bottom Actions */}
      <SafeAreaView edges={['bottom']} className="border-t border-border-light bg-white">
        <View className="flex-row gap-3 px-4 py-4">
          <Button
            label={t('hirer.booking_detail.cancel_booking')}
            onPress={handleCancelBooking}
            variant="outline"
            size="lg"
            className="flex-1"
          />
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

const styles = StyleSheet.create({
  headerTitle: {
    fontFamily: 'Urbanist_700Bold',
  },
});
