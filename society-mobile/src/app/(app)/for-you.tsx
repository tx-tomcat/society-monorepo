/* eslint-disable max-lines-per-function */
import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { CompanionCard } from '@/components/swipeable-companion-card';
import {
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import {
  Heart,
  RefreshCw,
  Sparkles,
} from '@/components/ui/icons';
import type { ScoredCompanion } from '@/lib/api/services/recommendations.service';
import {
  useRecommendations,
  useRefreshRecommendations,
  useTrackInteraction,
} from '@/lib/hooks';

export default function ForYouTab() {
  const router = useRouter();
  const { t } = useTranslation();
  const trackInteraction = useTrackInteraction();
  const refreshRecommendations = useRefreshRecommendations();

  // Fetch recommendations
  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useRecommendations();

  // Flatten pages into single array
  const recommendations = React.useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.companions);
  }, [data]);

  // Handle card press - view profile
  const handleCardPress = React.useCallback(
    (companionId: string) => {
      trackInteraction.mutate({
        companionId,
        eventType: 'VIEW',
      });
      router.push(`/hirer/companion/${companionId}` as Href);
    },
    [router, trackInteraction]
  );

  // Handle book press
  const handleBookPress = React.useCallback(
    (companionId: string) => {
      trackInteraction.mutate({
        companionId,
        eventType: 'BOOKING_STARTED',
      });
      router.push(`/hirer/booking/new?companionId=${companionId}` as Href);
    },
    [router, trackInteraction]
  );

  // Handle refresh
  const handleRefresh = React.useCallback(async () => {
    await refreshRecommendations.mutateAsync();
    await refetch();
  }, [refreshRecommendations, refetch]);

  // Handle load more
  const handleLoadMore = React.useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = React.useCallback(
    ({ item }: { item: ScoredCompanion }) => (
      <CompanionCard
        recommendation={item}
        onBookPress={handleBookPress}
        onCardPress={handleCardPress}
      />
    ),
    [handleBookPress, handleCardPress]
  );

  const keyExtractor = React.useCallback(
    (item: ScoredCompanion) => item.companionId,
    []
  );

  const ListEmptyComponent = React.useCallback(
    () => (
      <Animated.View
        entering={FadeIn.duration(600)}
        className="flex-1 items-center justify-center px-10 py-20"
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
            {t('hirer.browse.for_you.empty_title')}
          </Text>

          <Text
            className="mb-8 text-center font-urbanist text-base leading-6"
            style={{ color: colors.charcoal[500] }}
          >
            {t('hirer.browse.for_you.empty_subtitle')}
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
    ),
    [handleRefresh, t]
  );

  const ListFooterComponent = React.useCallback(
    () =>
      isFetchingNextPage ? (
        <View className="py-6">
          <ActivityIndicator color={colors.rose[400]} />
        </View>
      ) : null,
    [isFetchingNextPage]
  );

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar style="dark" />

      {/* Header */}
      <SafeAreaView edges={['top']}>
        <Animated.View
          entering={FadeInUp.duration(500)}
          className="flex-row items-center justify-between px-5 py-3"
        >
          <View className="flex-row items-center gap-2">
            <LinearGradient
              colors={[colors.rose[400], colors.coral[400]]}
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Heart color="#FFFFFF" width={18} height={18} fill="#FFFFFF" />
            </LinearGradient>
            <Text
              className="font-urbanist-bold text-[22px] tracking-tight"
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
      {isLoading ? (
        <Animated.View
          entering={FadeIn}
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
      ) : (
        <FlashList
          data={recommendations}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={ListEmptyComponent}
          ListFooterComponent={ListFooterComponent}
          refreshing={isRefetching}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );
}
