/* eslint-disable max-lines-per-function */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
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
  Gps,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
} from '@/components/ui/icons';
import { formatVND } from '@/lib/utils';

const MOCK_BOOKING = {
  id: '1',
  client: {
    id: 'c1',
    name: 'Nguyen Van Minh',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    rating: 4.8,
    bookingsCount: 5,
    memberSince: 'Dec 2024',
  },
  occasion: 'Wedding Reception',
  date: 'January 15, 2025',
  time: '2:00 PM - 6:00 PM',
  duration: '4 hours',
  location: 'Rex Hotel, 141 Nguyen Hue, District 1, HCMC',
  status: 'confirmed' as const,
  specialRequests: 'Please wear a formal red áo dài if possible. The wedding theme is traditional Vietnamese.',
  earnings: {
    bookingAmount: 2000000,
    platformFee: 360000,
    yourEarnings: 1640000,
  },
  bookingCode: 'SOC-2025-0115',
  createdAt: 'Jan 10, 2025',
};

export default function CompanionBookingDetail() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleCallClient = React.useCallback(() => {
    Alert.alert(t('companion.booking_detail.call'), `${t('companion.booking_detail.calling')} ${MOCK_BOOKING.client.name}...`);
  }, [t]);

  const handleMessageClient = React.useCallback(() => {
    router.push(`/chat/${MOCK_BOOKING.client.id}`);
  }, [router]);

  const handleStartNavigation = React.useCallback(() => {
    Alert.alert(t('companion.booking_detail.navigation'), t('companion.booking_detail.opening_maps'));
  }, [t]);

  const handleCancelBooking = React.useCallback(() => {
    Alert.alert(
      t('companion.booking_detail.cancel_booking'),
      t('companion.booking_detail.cancel_warning'),
      [
        { text: t('companion.booking_detail.no_keep_it'), style: 'cancel' },
        { text: t('companion.booking_detail.yes_cancel'), style: 'destructive', onPress: () => router.back() },
      ]
    );
  }, [router, t]);

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable onPress={handleBack}>
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text style={styles.headerTitle} className="flex-1 text-xl text-midnight">
            {t('companion.booking_detail.header')}
          </Text>
          <Badge label={t('common.status.confirmed')} variant="teal" size="sm" />
        </View>
      </SafeAreaView>

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
              source={{ uri: MOCK_BOOKING.client.image }}
              className="size-16 rounded-xl"
              contentFit="cover"
            />
            <View className="flex-1">
              <Text className="text-lg font-bold text-midnight">
                {MOCK_BOOKING.client.name}
              </Text>
              <View className="mt-1 flex-row items-center gap-2">
                <Star color={colors.yellow[400]} width={14} height={14} />
                <Text className="text-sm text-midnight">
                  {MOCK_BOOKING.client.rating}
                </Text>
                <Text className="text-sm text-text-tertiary">
                  • {t('companion.booking_detail.bookings_count', { count: MOCK_BOOKING.client.bookingsCount })}
                </Text>
              </View>
              <Text className="text-xs text-text-tertiary">
                {t('companion.booking_detail.member_since')} {MOCK_BOOKING.client.memberSince}
              </Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="mt-4 flex-row gap-3">
            <Pressable
              onPress={handleCallClient}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-lavender-400/10 py-3"
            >
              <Phone color={colors.lavender[400]} width={20} height={20} />
              <Text className="font-semibold text-lavender-400">{t('companion.booking_detail.call')}</Text>
            </Pressable>
            <Pressable
              onPress={handleMessageClient}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-lavender-400/10 py-3"
            >
              <MessageCircle color={colors.lavender[400]} width={20} height={20} />
              <Text className="font-semibold text-lavender-400">{t('companion.booking_detail.message')}</Text>
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
          <Text className="mb-4 text-lg font-bold text-midnight">{t('companion.booking_detail.booking_info')}</Text>

          <View className="gap-4">
            {/* Occasion */}
            <View className="flex-row items-start gap-3">
              <View className="size-10 items-center justify-center rounded-lg bg-rose-400/10">
                <Calendar color={colors.rose[400]} width={20} height={20} />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-text-tertiary">{t('companion.booking_detail.occasion')}</Text>
                <Text className="font-semibold text-midnight">{MOCK_BOOKING.occasion}</Text>
              </View>
            </View>

            {/* Date & Time */}
            <View className="flex-row items-start gap-3">
              <View className="size-10 items-center justify-center rounded-lg bg-lavender-400/10">
                <Clock color={colors.lavender[400]} width={20} height={20} />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-text-tertiary">{t('companion.booking_detail.date_time')}</Text>
                <Text className="font-semibold text-midnight">{MOCK_BOOKING.date}</Text>
                <Text className="text-sm text-text-secondary">
                  {MOCK_BOOKING.time} ({MOCK_BOOKING.duration})
                </Text>
              </View>
            </View>

            {/* Location */}
            <View className="flex-row items-start gap-3">
              <View className="size-10 items-center justify-center rounded-lg bg-teal-400/10">
                <MapPin color={colors.teal[400]} width={20} height={20} />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-text-tertiary">{t('companion.booking_detail.location')}</Text>
                <Text className="font-semibold text-midnight">{MOCK_BOOKING.location}</Text>
              </View>
            </View>
          </View>

          {/* Navigate Button */}
          <Pressable
            onPress={handleStartNavigation}
            className="mt-4 flex-row items-center justify-center gap-2 rounded-xl bg-teal-400 py-3"
          >
            <Gps color="#FFFFFF" width={20} height={20} />
            <Text className="font-semibold text-white">{t('companion.booking_detail.get_directions')}</Text>
          </Pressable>

          {/* Special Requests */}
          {MOCK_BOOKING.specialRequests && (
            <View className="mt-4 rounded-xl bg-softpink p-3">
              <Text className="text-sm font-medium text-rose-400">{t('companion.booking_detail.special_requests')}</Text>
              <Text className="mt-1 text-sm text-text-secondary">
                {MOCK_BOOKING.specialRequests}
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
          <Text className="mb-4 text-lg font-bold text-midnight">{t('companion.booking_detail.your_earnings')}</Text>

          <View className="gap-3">
            <View className="flex-row justify-between">
              <Text className="text-text-secondary">{t('companion.booking_detail.booking_amount')}</Text>
              <Text className="text-midnight">
                {formatVND(MOCK_BOOKING.earnings.bookingAmount)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-text-secondary">{t('companion.booking_detail.platform_fee')}</Text>
              <Text className="text-rose-400">
                -{formatVND(MOCK_BOOKING.earnings.platformFee)}
              </Text>
            </View>
            <View className="h-px bg-border-light" />
            <View className="flex-row justify-between">
              <Text className="font-bold text-midnight">{t('companion.booking_detail.you_will_earn')}</Text>
              <Text style={styles.earnings} className="text-xl text-teal-400">
                {formatVND(MOCK_BOOKING.earnings.yourEarnings)}
              </Text>
            </View>
          </View>

          <View className="mt-4 rounded-lg bg-lavender-400/10 p-3">
            <Text className="text-center text-sm text-lavender-400">
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
          <Text className="text-sm text-text-tertiary">{t('companion.booking_detail.booking_code')}</Text>
          <Text style={styles.bookingCode} className="mt-1 text-2xl tracking-wider text-midnight">
            {MOCK_BOOKING.bookingCode}
          </Text>
          <Text className="mt-1 text-xs text-text-tertiary">
            {t('companion.booking_detail.booked_on')} {MOCK_BOOKING.createdAt}
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
              <Text className="font-semibold text-teal-700">{t('companion.booking_detail.safety_reminder')}</Text>
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
      <SafeAreaView edges={['bottom']} className="border-t border-border-light bg-white">
        <View className="flex-row gap-3 px-4 py-4">
          <Button
            label={t('companion.booking_detail.cancel_booking')}
            onPress={handleCancelBooking}
            variant="outline"
            size="lg"
            className="flex-1"
          />
          <Button
            label={t('companion.booking_detail.ive_arrived')}
            onPress={() => Alert.alert(t('companion.booking_detail.check_in'), t('companion.booking_detail.checked_in'))}
            variant="default"
            size="lg"
            className="flex-1 bg-lavender-400"
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
  earnings: {
    fontFamily: 'Urbanist_700Bold',
  },
  bookingCode: {
    fontFamily: 'Urbanist_700Bold',
  },
});
