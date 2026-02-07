/* eslint-disable max-lines-per-function */
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
} from 'react-native';

import {
  Button,
  colors,
  FocusAwareStatusBar,
  Image,
  SafeAreaView,
  Text,
  View
} from '@/components/ui';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  Occasions,
  ShieldCheck,
  Star,
  VerifiedBadge,
} from '@/components/ui/icons';
import { getPhotoUrl } from '@/lib/api/services/companions.service';
import { useCompanion, useCreateBooking } from '@/lib/hooks';
import { formatVND } from '@/lib/utils';

export default function BookingReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    companionId: string; // User.id - used for booking creation
    companionProfileId: string; // CompanionProfile.id - used for fetching companion data
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

  // API hooks
  const { data: companionData, isLoading: isLoadingCompanion } = useCompanion(
    params.companionProfileId || params.companionId || ''
  );
  const createBooking = useCreateBooking();


  // Terms agreement state
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);

  // Transform companion data
  const companion = React.useMemo(() => {
    if (!companionData) return null;
    const c = companionData;
    return {
      id: c.id,
      userId: c.userId,
      name: c.displayName || '',
      image: c.avatar || getPhotoUrl(c.photos?.[0]) || '',
      rating: c.rating ?? 0,
      reviewCount: c.reviewCount ?? 0,
      hourlyRate: c.hourlyRate || 0,
      isVerified: c.isVerified ?? c.verificationStatus === 'VERIFIED',
    };
  }, [companionData]);

  // Calculate pricing
  const duration = parseInt(params.duration || '3', 10);
  const total = (companion?.hourlyRate || 0) * duration;

  const isProcessing = createBooking.isPending;

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleConfirmBooking = React.useCallback(async () => {
    if (!agreedToTerms || !companion || !params.companionId) return;

    try {
      // Calculate start and end datetime
      const startDatetime = new Date(
        `${params.date}T${params.time}:00`
      ).toISOString();
      const endDate = new Date(`${params.date}T${params.time}:00`);
      endDate.setHours(endDate.getHours() + duration);
      const endDatetime = endDate.toISOString();

      console.log('payload', {
        companionId: params.companionId,
        ...(params.occasionId ? { occasionId: params.occasionId } : {}),
        startDatetime,
        endDatetime,
        locationAddress: params.location,
        specialRequests: params.notes,
      })

      // Create the booking request (PENDING status)
      const bookingResult = await createBooking.mutateAsync({
        companionId: params.companionId,
        ...(params.occasionId ? { occasionId: params.occasionId } : {}),
        startDatetime,
        endDatetime,
        locationAddress: params.location,
        specialRequests: params.notes,
      });

      // Navigate to confirmation screen
      router.push({
        pathname: '/hirer/booking/confirmation',
        params: {
          bookingId: bookingResult.id,
          companionId: params.companionId,
          companionProfileId: params.companionProfileId,
          occasionId: params.occasionId || '',
          occasionName: params.occasionName || '',
          occasionEmoji: params.occasionEmoji || '',
          date: params.date,
          time: params.time,
          duration: params.duration,
          location: params.location,
          notes: params.notes,
        },
      } as unknown as Href);
    } catch (error: any) {

      console.error('Booking failed:', error);
    }
  }, [
    params,
    agreedToTerms,
    companion,
    duration,
    createBooking,
  ]);

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
        <Text className="mt-4 text-text-secondary">{t('common.loading')}</Text>
      </View>
    );
  }

  // Error state
  if (!companion) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite">
        <FocusAwareStatusBar />
        <Text className="text-lg text-text-secondary">
          {t('errors.not_found')}
        </Text>
        <Button
          label={t('common.go_back')}
          onPress={handleBack}
          variant="outline"
          className="mt-4"
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable
            onPress={handleBack}
            className="size-10 items-center justify-center"
          >
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text className="flex-1 font-urbanist-bold text-xl text-midnight">
            {t('hirer.review.title')}
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Companion Card - Hero Style */}
        <MotiView

          className="mx-4 mt-4 overflow-hidden rounded-3xl bg-white"
        >
          {/* Companion Image with Gradient Overlay */}
          <View className="relative h-48">
            <Image
              source={{ uri: companion.image }}
              className="h-full w-full"
              contentFit="cover"
            />
            {/* Gradient overlay */}
            <View className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Companion info on image */}
            <View className="absolute bottom-0 left-0 right-0 p-4">
              <View className="flex-row items-center gap-2">
                <Text className="font-urbanist-bold text-2xl text-white">
                  {companion.name}
                </Text>
                {companion.isVerified && (
                  <VerifiedBadge color={colors.teal[400]} width={22} height={22} />
                )}
              </View>
              <View className="mt-1 flex-row items-center gap-3">
                <View className="flex-row items-center gap-1">
                  <Star color={colors.yellow[400]} width={16} height={16} />
                  <Text className="text-sm font-semibold text-white">
                    {companion.rating.toFixed(1)}
                  </Text>
                  <Text className="text-sm text-white/80">
                    ({companion.reviewCount})
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </MotiView>

        {/* Booking Details Card */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
          className="mx-4 mt-4 rounded-2xl bg-white p-4"
        >
          <Text className="mb-4 font-urbanist-semibold text-base text-midnight">
            {t('hirer.review.booking_details')}
          </Text>

          <View className="gap-4">
            {/* Date */}
            <View className="flex-row items-center gap-4">
              <View className="size-12 items-center justify-center rounded-xl bg-rose-400/10">
                <Calendar color={colors.rose[400]} width={22} height={22} />
              </View>
              <View className="flex-1">
                <Text className="text-xs uppercase tracking-wide text-text-tertiary">
                  {t('hirer.review.date')}
                </Text>
                <Text className="mt-0.5 font-urbanist-semibold text-base text-midnight">
                  {params.date ? formatDate(params.date) : '-'}
                </Text>
              </View>
            </View>

            {/* Time & Duration */}
            <View className="flex-row items-center gap-4">
              <View className="size-12 items-center justify-center rounded-xl bg-lavender-900/10">
                <Clock color={colors.lavender[400]} width={22} height={22} />
              </View>
              <View className="flex-1">
                <Text className="text-xs uppercase tracking-wide text-text-tertiary">
                  {t('hirer.review.time_duration')}
                </Text>
                <Text className="mt-0.5 font-urbanist-semibold text-base text-midnight">
                  {params.time} • {duration} {t('hirer.review.hours')}
                </Text>
              </View>
            </View>

            {/* Location */}
            <View className="flex-row items-center gap-4">
              <View className="size-12 items-center justify-center rounded-xl bg-teal-400/10">
                <MapPin color={colors.teal[400]} width={22} height={22} />
              </View>
              <View className="flex-1">
                <Text className="text-xs uppercase tracking-wide text-text-tertiary">
                  {t('hirer.review.location')}
                </Text>
                <Text
                  className="mt-0.5 font-urbanist-semibold text-base text-midnight"
                  numberOfLines={2}
                >
                  {params.location || '-'}
                </Text>
              </View>
            </View>

            {/* Occasion */}
            {params.occasionName ? (
              <View className="flex-row items-center gap-4">
                <View className="size-12 items-center justify-center rounded-xl bg-coral-400/10">
                  <Occasions color={colors.coral[400]} width={22} height={22} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs uppercase tracking-wide text-text-tertiary">
                    {t('hirer.review.occasion')}
                  </Text>
                  <Text className="mt-0.5 font-urbanist-semibold text-base text-midnight">
                    {params.occasionEmoji} {params.occasionName}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Special Requests */}
          {params.notes ? (
            <View className="mt-4 rounded-xl bg-warmwhite p-3">
              <Text className="text-xs uppercase tracking-wide text-text-tertiary">
                {t('hirer.review.special_requests')}
              </Text>
              <Text className="mt-1 text-sm leading-relaxed text-text-secondary">
                {params.notes}
              </Text>
            </View>
          ) : null}
        </MotiView>

        {/* Price Breakdown Card */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 150 }}
          className="mx-4 mt-4 rounded-2xl bg-white p-4"
        >
          <Text className="mb-4 font-urbanist-semibold text-base text-midnight">
            {t('hirer.review.price_breakdown')}
          </Text>

          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-text-secondary">
                {formatVND(companion.hourlyRate)} × {duration} {t('hirer.review.hours')}
              </Text>
              <Text className="font-urbanist-bold text-2xl text-rose-400">
                {formatVND(total)}
              </Text>
            </View>
          </View>
        </MotiView>

        {/* How It Works Card */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 200 }}
          className="mx-4 mt-4 rounded-2xl bg-lavender-900/10 p-4"
        >
          <Text className="mb-4 font-urbanist-semibold text-base text-midnight">
            {t('hirer.review.how_it_works')}
          </Text>
          <View className="gap-3">
            <View className="flex-row items-start gap-3">
              <View className="mt-0.5 size-6 items-center justify-center rounded-full bg-lavender-900">
                <Text className="text-xs font-bold text-white">1</Text>
              </View>
              <View className="flex-1">
                <Text className="font-urbanist-semibold text-sm text-midnight">
                  {t('hirer.review.step_1_title')}
                </Text>
                <Text className="text-sm leading-relaxed text-text-secondary">
                  {t('hirer.review.step_1_desc')}
                </Text>
              </View>
            </View>
            <View className="flex-row items-start gap-3">
              <View className="mt-0.5 size-6 items-center justify-center rounded-full bg-lavender-900">
                <Text className="text-xs font-bold text-white">2</Text>
              </View>
              <View className="flex-1">
                <Text className="font-urbanist-semibold text-sm text-midnight">
                  {t('hirer.review.step_2_title')}
                </Text>
                <Text className="text-xs leading-relaxed text-text-secondary">
                  {t('hirer.review.step_2_desc')}
                </Text>
              </View>
            </View>
            <View className="flex-row items-start gap-3">
              <View className="mt-0.5 size-6 items-center justify-center rounded-full bg-lavender-900">
                <Text className="text-xs font-bold text-white">3</Text>
              </View>
              <View className="flex-1">
                <Text className="font-urbanist-semibold text-sm text-midnight">
                  {t('hirer.review.step_3_title')}
                </Text>
                <Text className="text-xs leading-relaxed text-text-secondary">
                  {t('hirer.review.step_3_desc')}
                </Text>
              </View>
            </View>
          </View>
        </MotiView>

        {/* Security Notice */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 250 }}
          className="mx-4 mt-4 rounded-2xl bg-teal-400/10 p-4"
        >
          <View className="flex-row items-center gap-3">
            <ShieldCheck color={colors.teal[400]} width={24} height={24} />
            <View className="flex-1">
              <Text className="font-urbanist-semibold text-sm text-teal-700">
                {t('hirer.review.secure_booking')}
              </Text>
              <Text className="text-xs text-text-secondary">
                {t('hirer.review.secure_booking_desc')}
              </Text>
            </View>
          </View>
        </MotiView>

        {/* Terms Agreement */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 300 }}
          className="mx-4 mt-4"
        >
          <Pressable
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            className="flex-row items-start gap-3"
          >
            <View
              className={`mt-1 size-5 items-center justify-center rounded border-2 ${agreedToTerms
                ? 'border-rose-400 bg-rose-400'
                : 'border-border bg-white'
                }`}
            >
              {agreedToTerms && (
                <CheckCircle color="#FFFFFF" width={12} height={12} />
              )}
            </View>
            <Text className="flex-1 text-sm leading-relaxed text-text-secondary">
              {t('hirer.review.terms_agreement')}
            </Text>
          </Pressable>
        </MotiView>

        <View className="h-32" />
      </ScrollView>

      {/* Bottom Actions */}
      <SafeAreaView
        edges={['bottom']}
        className="border-t border-border-light bg-white"
      >
        <View className="p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-text-secondary">
              {t('hirer.review.estimated_total')}
            </Text>
            <Text className="font-urbanist-bold text-xl text-midnight">
              {formatVND(total)}
            </Text>
          </View>
          <Button
            label={
              isProcessing
                ? t('hirer.review.submitting')
                : t('hirer.review.confirm_booking')
            }
            onPress={handleConfirmBooking}
            variant="default"
            size="lg"
            disabled={!agreedToTerms || isProcessing}
            loading={isProcessing}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
