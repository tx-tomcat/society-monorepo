/* eslint-disable max-lines-per-function */
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView } from 'react-native';

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
  Calendar,
  Clock,
  Help,
  Home,
  MapPin,
  MessageCircle,
  Send,
  Share,
  VerifiedBadge,
} from '@/components/ui/icons';
import { getPhotoUrl } from '@/lib/api/services/companions.service';
import { useCompanion, useOccasion } from '@/lib/hooks';

export default function BookingConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookingId: string;
    companionId: string;
    companionProfileId: string;
    occasionId: string;
    occasionName: string;
    occasionEmoji: string;
    date: string;
    time: string;
    duration: string;
    location: string;
    notes: string;
  }>();
  const { t } = useTranslation();

  // Fetch companion data
  const { data: companionData, isLoading: isLoadingCompanion } = useCompanion(
    params.companionProfileId || params.companionId || ''
  );

  // Transform companion data
  const companion = React.useMemo(() => {
    if (!companionData) return null;
    const c = companionData;
    return {
      id: c.id,
      userId: c.userId,
      name: c.displayName || '',
      image: c.avatar || getPhotoUrl(c.photos?.[0]) || '',
      isVerified: c.isVerified ?? c.verificationStatus === 'VERIFIED',
    };
  }, [companionData]);

  // Fetch occasion details if we have an ID but no name
  const { data: occasionData } = useOccasion(params.occasionId || '');
  const occasionName = params.occasionName || occasionData?.name || '-';
  const occasionEmoji = params.occasionEmoji || occasionData?.emoji || '';

  const duration = parseInt(params.duration || '3', 10);

  const handleGoHome = React.useCallback(() => {
    router.replace('/hirer/browse' as Href);
  }, [router]);

  const handleViewBookings = React.useCallback(() => {
    router.replace('/hirer/orders' as Href);
  }, [router]);

  const handleMessage = React.useCallback(() => {
    if (companion?.userId) {
      router.push(`/hirer/chat/${companion.userId}` as Href);
    }
  }, [router, companion?.userId]);

  const handleShare = React.useCallback(() => {
    // TODO: Implement share functionality
  }, []);

  const handleSupport = React.useCallback(() => {
    router.push('/support' as Href);
  }, [router]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Loading state
  if (isLoadingCompanion) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite">
        <FocusAwareStatusBar />
        <ActivityIndicator color={colors.rose[400]} size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center justify-end px-4 py-3">
          <Pressable
            onPress={handleShare}
            className="size-10 items-center justify-center"
          >
            <Share color={colors.midnight.DEFAULT} width={22} height={22} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Success Animation - Send Icon for "Request Sent" */}
        <MotiView
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="items-center px-4 pt-8"
        >
          <View className="mb-6 size-24 items-center justify-center rounded-full bg-lavender-900">
            <MotiView
              from={{ scale: 0, rotate: '-45deg' }}
              animate={{ scale: 1, rotate: '0deg' }}
              transition={{ type: 'spring', damping: 10, delay: 300 }}
            >
              <Send color="#FFFFFF" width={44} height={44} />
            </MotiView>
          </View>
          <Text className="mb-2 text-center font-urbanist-bold text-2xl text-midnight">
            {t('hirer.confirmation.success_title')}
          </Text>
          <Text className="mx-8 mb-4 text-center text-base leading-relaxed text-text-secondary">
            {t('hirer.confirmation.success_subtitle')}
          </Text>
          <Badge
            label={`${t('hirer.confirmation.booking_id')}: ${params.bookingId?.slice(0, 8) || 'N/A'}`}
            variant="lavender"
            size="default"
          />
        </MotiView>

        {/* Booking Details Card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 200 }}
          className="mx-4 mt-8 rounded-2xl bg-white p-5"
        >
          {/* Companion Info */}
          {companion && (
            <View className="mb-5 flex-row items-center gap-4 border-b border-border-light pb-5">
              <Image
                source={{ uri: companion.image }}
                className="size-16 rounded-full"
                contentFit="cover"
              />
              <View className="flex-1">
                <View className="flex-row items-center gap-1">
                  <Text className="font-urbanist-semibold text-lg text-midnight">
                    {companion.name}
                  </Text>
                  {companion.isVerified && (
                    <VerifiedBadge color={colors.teal[400]} width={18} height={18} />
                  )}
                </View>
                <Badge
                  label="Awaiting Confirmation"
                  variant="coral"
                  size="sm"
                />
              </View>
              <Pressable
                onPress={handleMessage}
                className="size-11 items-center justify-center rounded-full bg-lavender-900"
              >
                <MessageCircle color="#FFFFFF" width={20} height={20} />
              </Pressable>
            </View>
          )}

          {/* Event Details */}
          <View className="gap-4">
            <View className="flex-row items-center gap-4">
              <View className="size-11 items-center justify-center rounded-xl bg-rose-400/10">
                <Calendar color={colors.rose[400]} width={22} height={22} />
              </View>
              <View className="flex-1">
                <Text className="text-xs uppercase tracking-wide text-text-tertiary">
                  {t('hirer.confirmation.date_time')}
                </Text>
                <Text className="mt-1 font-urbanist-semibold text-base text-midnight">
                  {params.date ? formatDate(params.date) : '-'}
                </Text>
                <Text className="text-sm text-text-secondary">
                  {params.time} • {duration} {t('hirer.confirmation.hours')}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-4">
              <View className="size-11 items-center justify-center rounded-xl bg-lavender-900/10">
                <MapPin color={colors.lavender[400]} width={22} height={22} />
              </View>
              <View className="flex-1">
                <Text className="text-xs uppercase tracking-wide text-text-tertiary">
                  {t('hirer.confirmation.location')}
                </Text>
                <Text
                  className="mt-1 font-urbanist-semibold text-base text-midnight"
                  numberOfLines={2}
                >
                  {params.location || '-'}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-4">
              <View className="size-11 items-center justify-center rounded-xl bg-teal-400/10">
                <Clock color={colors.teal[400]} width={22} height={22} />
              </View>
              <View className="flex-1">
                <Text className="text-xs uppercase tracking-wide text-text-tertiary">
                  {t('hirer.confirmation.occasion')}
                </Text>
                <Text className="mt-1 font-urbanist-semibold text-base text-midnight">
                  {occasionEmoji} {occasionName}
                </Text>
              </View>
            </View>
          </View>
        </MotiView>

        {/* What's Next Card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 300 }}
          className="mx-4 mt-4 rounded-2xl bg-lavender-900/10 p-5"
        >
          <Text className="mb-4 font-urbanist-semibold text-base text-midnight">
            {t('hirer.confirmation.whats_next')}
          </Text>
          <View className="gap-3">
            <View className="flex-row items-start gap-3">
              <View className="mt-1 size-6 items-center justify-center rounded-full bg-lavender-900">
                <Text className="text-xs font-bold text-white">1</Text>
              </View>
              <Text className="flex-1 text-sm leading-relaxed text-text-secondary">
                {t('hirer.confirmation.step_1')}
              </Text>
            </View>
            <View className="flex-row items-start gap-3">
              <View className="mt-1 size-6 items-center justify-center rounded-full bg-lavender-900">
                <Text className="text-xs font-bold text-white">2</Text>
              </View>
              <Text className="flex-1 text-sm leading-relaxed text-text-secondary">
                {t('hirer.confirmation.step_2')}
              </Text>
            </View>
            <View className="flex-row items-start gap-3">
              <View className="mt-1 size-6 items-center justify-center rounded-full bg-lavender-900">
                <Text className="text-xs font-bold text-white">3</Text>
              </View>
              <Text className="flex-1 text-sm leading-relaxed text-text-secondary">
                {t('hirer.confirmation.step_3')}
              </Text>
            </View>
          </View>
        </MotiView>

        {/* Support Link */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 400 }}
          className="mx-4 mt-4"
        >
          <Pressable
            onPress={handleSupport}
            className="flex-row items-center justify-center gap-2 rounded-2xl bg-white py-4"
          >
            <Help color={colors.text.secondary} width={20} height={20} />
            <Text className="text-sm font-medium text-text-secondary">
              {t('hirer.confirmation.need_help')}
            </Text>
          </Pressable>
        </MotiView>
      </ScrollView>

      {/* Bottom Actions */}
      <SafeAreaView edges={['bottom']} className="bg-white shadow-lg">
        <View className="flex-row gap-3 p-4">
          <Button
            label={t('hirer.confirmation.view_bookings')}
            onPress={handleViewBookings}
            variant="outline"
            size="lg"
            className="flex-1"
          />
          <Pressable
            onPress={handleGoHome}
            className="size-14 items-center justify-center rounded-xl bg-rose-400"
          >
            <Home color="#FFFFFF" width={24} height={24} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
