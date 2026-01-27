/* eslint-disable max-lines-per-function */
import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleSheet,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOut,
  SlideInRight,
} from 'react-native-reanimated';

import { SwipeableCompanionCard } from '@/components/swipeable-companion-card';
import {
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { ArrowLeft, Heart, RefreshCw, Sparkles } from '@/components/ui/icons';
import {
  useRecommendations,
  useRefreshRecommendations,
  useTrackInteraction,
} from '@/lib/hooks';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ForYouScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const trackInteraction = useTrackInteraction();
  const refreshRecommendations = useRefreshRecommendations();

  const [currentIndex, setCurrentIndex] = React.useState(0);

  // Fetch recommendations
  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useRecommendations();

  // Flatten pages into single array
  const recommendations = React.useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.companions);
  }, [data]);

  // Current companion
  const currentRecommendation = recommendations[currentIndex];

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  // Handle swipe left (pass)
  const handleSwipeLeft = React.useCallback(() => {
    if (currentRecommendation) {
      trackInteraction.mutate({
        companionId: currentRecommendation.companionId,
        eventType: 'VIEW',
      });
    }

    // Move to next card
    setTimeout(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        // Fetch more if near end
        if (next >= recommendations.length - 2 && hasNextPage) {
          fetchNextPage();
        }
        return next;
      });
    }, 300);
  }, [
    currentRecommendation,
    trackInteraction,
    recommendations.length,
    hasNextPage,
    fetchNextPage,
  ]);

  // Handle swipe right (like / interested)
  const handleSwipeRight = React.useCallback(() => {
    if (currentRecommendation) {
      trackInteraction.mutate({
        companionId: currentRecommendation.companionId,
        eventType: 'BOOKMARK',
      });
    }

    // Move to next card
    setTimeout(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= recommendations.length - 2 && hasNextPage) {
          fetchNextPage();
        }
        return next;
      });
    }, 300);
  }, [
    currentRecommendation,
    trackInteraction,
    recommendations.length,
    hasNextPage,
    fetchNextPage,
  ]);

  // Handle book press
  const handleBookPress = React.useCallback(
    (companionId: string) => {
      trackInteraction.mutate({
        companionId,
        eventType: 'BOOKING_STARTED',
      });
      router.push(`/booking/${companionId}` as Href);
    },
    [router, trackInteraction]
  );

  // Handle refresh
  const handleRefresh = React.useCallback(async () => {
    await refreshRecommendations.mutateAsync();
    await refetch();
    setCurrentIndex(0);
  }, [refreshRecommendations, refetch]);

  // Check if we've seen all cards
  const isOutOfCards =
    !isLoading && (recommendations.length === 0 || currentIndex >= recommendations.length);

  return (
    <View className="flex-1 bg-white">
      <FocusAwareStatusBar style="dark" />

      {/* Soft ambient background gradient */}
      <LinearGradient
        colors={['#FFF5F7', '#FFFFFF', '#FFF0F3']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <SafeAreaView edges={['top']}>
        <Animated.View
          entering={FadeInUp.duration(500)}
          className="flex-row items-center px-4 py-3"
        >
          <Pressable
            onPress={handleBack}
            className="size-11 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
          >
            <ArrowLeft color={colors.charcoal[700]} width={24} height={24} />
          </Pressable>

          <View className="flex-1 flex-row items-center justify-center gap-2">
            <LinearGradient
              colors={[colors.rose[400], colors.coral[400]]}
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Heart color="#FFFFFF" width={16} height={16} fill="#FFFFFF" />
            </LinearGradient>
            <Text
              className="font-urbanist-bold text-xl tracking-tight"
              style={{ color: colors.charcoal[900] }}
            >
              {t('hirer.browse.for_you.title')}
            </Text>
          </View>

          <Pressable
            onPress={handleRefresh}
            disabled={isRefetching || refreshRecommendations.isPending}
            className={`size-11 items-center justify-center rounded-full ${
              isRefetching || refreshRecommendations.isPending ? 'opacity-50' : ''
            }`}
            style={{ backgroundColor: 'rgba(255,107,138,0.12)' }}
          >
            {isRefetching || refreshRecommendations.isPending ? (
              <ActivityIndicator size="small" color={colors.rose[400]} />
            ) : (
              <RefreshCw color={colors.rose[400]} width={20} height={20} />
            )}
          </Pressable>
        </Animated.View>
      </SafeAreaView>

      {/* Loading State */}
      {isLoading && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          className="flex-1 items-center justify-center"
        >
          <View className="items-center">
            <ActivityIndicator size="large" color={colors.rose[400]} />
            <Text
              className="mt-4 font-urbanist-medium text-base"
              style={{ color: colors.charcoal[500] }}
            >
              {t('hirer.browse.for_you.loading')}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Out of cards state */}
      {isOutOfCards && (
        <Animated.View
          entering={FadeIn.duration(600)}
          className="flex-1 items-center justify-center px-10"
        >
          <View className="items-center">
            <LinearGradient
              colors={[colors.rose[400], colors.coral[400]]}
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}
            >
              <Sparkles color="#FFFFFF" width={40} height={40} />
            </LinearGradient>

            <Text
              className="mb-3 text-center font-urbanist-bold text-2xl"
              style={{ color: colors.charcoal[900] }}
            >
              {recommendations.length === 0
                ? t('hirer.browse.for_you.empty_title')
                : t('hirer.browse.for_you.seen_all_title')}
            </Text>

            <Text
              className="mb-8 text-center font-urbanist text-base leading-6"
              style={{ color: colors.charcoal[500] }}
            >
              {recommendations.length === 0
                ? t('hirer.browse.for_you.empty_subtitle')
                : t('hirer.browse.for_you.seen_all_subtitle')}
            </Text>

            <Pressable onPress={handleRefresh} className="overflow-hidden rounded-2xl">
              <LinearGradient
                colors={[colors.rose[400], colors.coral[400]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingHorizontal: 28,
                  paddingVertical: 16,
                }}
              >
                <RefreshCw color="#FFFFFF" width={20} height={20} />
                <Text className="font-urbanist-bold text-base text-white">
                  {t('hirer.browse.for_you.refresh_button')}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* Card stack */}
      {!isLoading && !isOutOfCards && (
        <Animated.View
          entering={SlideInRight.duration(400)}
          className="flex-1 items-center justify-center pb-5"
        >
          {/* Show next card behind (preview) */}
          {recommendations[currentIndex + 1] && (
            <View
              style={{
                position: 'absolute',
                top: '50%',
                marginTop: -(SCREEN_HEIGHT * 0.72) / 2 + 10,
              }}
            >
              <View
                style={{
                  width: Dimensions.get('window').width - 48,
                  height: SCREEN_HEIGHT * 0.72 - 20,
                  borderRadius: 24,
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  transform: [{ scale: 0.95 }],
                }}
              />
            </View>
          )}

          {/* Current card */}
          {currentRecommendation && (
            <SwipeableCompanionCard
              key={currentRecommendation.companionId}
              recommendation={currentRecommendation}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              onBookPress={handleBookPress}
              isActive={true}
            />
          )}

          {/* Swipe hints */}
          <View className="absolute inset-x-0 bottom-2 flex-row justify-between px-8">
            <View className="opacity-60">
              <Text
                className="font-urbanist-medium text-[13px]"
                style={{ color: colors.charcoal[600] }}
              >
                ← {t('hirer.browse.for_you.swipe_pass')}
              </Text>
            </View>
            <View className="opacity-60">
              <Text
                className="font-urbanist-medium text-[13px]"
                style={{ color: colors.charcoal[600] }}
              >
                {t('hirer.browse.for_you.swipe_like')} →
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Bottom safe area */}
      <SafeAreaView edges={['bottom']} />
    </View>
  );
}

