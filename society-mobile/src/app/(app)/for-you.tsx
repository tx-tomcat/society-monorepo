/* eslint-disable max-lines-per-function */
import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View as RNView } from 'react-native';
import PagerView from 'react-native-pager-view';
import Animated, { FadeIn } from 'react-native-reanimated';

import { FeedCard } from '@/components/feed/feed-card';
import { useInteractionTracker } from '@/components/feed/use-interaction-tracker';
import {
  colors,
  FocusAwareStatusBar,
  Image,
  Text,
  View,
} from '@/components/ui';
import {
  RefreshCw,
  Sparkles,
} from '@/components/ui/icons';
import type { ScoredCompanion } from '@/lib/api/services/recommendations.service';
import {
  useFeedRecommendations,
  useRefreshRecommendations,
} from '@/lib/hooks';
import { useFavorites, useToggleFavorite } from '@/lib/hooks/use-favorites';

export default function ForYouTab() {
  const router = useRouter();
  const { t } = useTranslation();
  const refreshRecommendations = useRefreshRecommendations();
  const pagerRef = useRef<PagerView>(null);

  // Feed data
  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    sessionId,
    markSeen,
    resetSession,
  } = useFeedRecommendations();

  // Interaction tracking
  const { track, trackDwell, flush } = useInteractionTracker(sessionId);

  // Favorites
  const { data: favoritesData } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const favoriteIds = useMemo(() => {
    if (!favoritesData?.data) return new Set<string>();
    return new Set(favoritesData.data.map((f: { companionId: string }) => f.companionId));
  }, [favoritesData]);

  // Flatten pages into single array
  const recommendations = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.companions);
  }, [data]);

  // Current page index
  const [currentPage, setCurrentPage] = useState(0);
  const dwellStartRef = useRef<number>(Date.now());

  // Handle page change
  const handlePageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      const newPage = e.nativeEvent.position;
      const prevPage = currentPage;

      // Track dwell time for the previous page
      if (recommendations[prevPage]) {
        const dwellTimeMs = Date.now() - dwellStartRef.current;
        trackDwell(recommendations[prevPage].companionId, dwellTimeMs);
      }

      // Start dwell timer for new page
      dwellStartRef.current = Date.now();
      setCurrentPage(newPage);

      // Mark companion as seen
      if (recommendations[newPage]) {
        markSeen(recommendations[newPage].companionId);
        track({
          companionId: recommendations[newPage].companionId,
          eventType: 'VIEW',
        });
      }

      // Detect revisit (swiping backwards)
      if (newPage < prevPage && recommendations[newPage]) {
        track({
          companionId: recommendations[newPage].companionId,
          eventType: 'REVISIT',
        });
      }

      // Preload photos of N+1 and N+2 companions
      for (let offset = 1; offset <= 2; offset++) {
        const preloadIdx = newPage + offset;
        if (preloadIdx < recommendations.length) {
          const companion = recommendations[preloadIdx].companion;
          const photos = companion?.photos?.length
            ? companion.photos.map((p) => p.url)
            : companion?.avatar
              ? [companion.avatar]
              : [];
          photos.forEach((url) => Image.prefetch(url));
        }
      }

      // Load more when reaching near the end
      if (
        newPage >= recommendations.length - 3 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    },
    [
      currentPage,
      recommendations,
      trackDwell,
      markSeen,
      track,
      hasNextPage,
      isFetchingNextPage,
      fetchNextPage,
    ],
  );

  // Mark first companion as seen on initial load
  useEffect(() => {
    if (recommendations.length > 0 && currentPage === 0) {
      markSeen(recommendations[0].companionId);
      track({
        companionId: recommendations[0].companionId,
        eventType: 'VIEW',
      });
      dwellStartRef.current = Date.now();
    }
  }, [recommendations.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handlers
  const handleFavoriteToggle = useCallback(
    (companionId: string) => {
      toggleFavorite.mutate(companionId);
      track({
        companionId,
        eventType: favoriteIds.has(companionId) ? 'UNBOOKMARK' : 'BOOKMARK',
      });
    },
    [toggleFavorite, track, favoriteIds],
  );

  const handleBook = useCallback(
    (companionId: string) => {
      track({ companionId, eventType: 'BOOKING_STARTED' });
      flush();
      router.push(`/hirer/booking/new?companionId=${companionId}` as Href);
    },
    [track, flush, router],
  );

  const handlePhotoBrowse = useCallback(
    (companionId: string) => {
      track({ companionId, eventType: 'PHOTO_BROWSE' });
    },
    [track],
  );

  const handleDwellPause = useCallback(
    (companionId: string) => {
      track({ companionId, eventType: 'DWELL_PAUSE' });
    },
    [track],
  );

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await flush();
    await refreshRecommendations.mutateAsync();
    resetSession();
    setCurrentPage(0);
  }, [flush, refreshRecommendations, resetSession]);

  // Empty state
  if (!isLoading && recommendations.length === 0) {
    return (
      <View className="flex-1 bg-black">
        <FocusAwareStatusBar style="light" />
        <Animated.View
          entering={FadeIn.duration(600)}
          className="flex-1 items-center justify-center px-10"
        >
          <RNView className="items-center">
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

            <Text className="mb-3 text-center font-urbanist-bold text-2xl text-white">
              {t('hirer.browse.for_you.empty_title')}
            </Text>

            <Text className="mb-8 text-center font-urbanist text-base leading-6 text-white/60">
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
          </RNView>
        </Animated.View>
      </View>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 bg-black">
        <FocusAwareStatusBar style="light" />
        <Animated.View
          entering={FadeIn}
          className="flex-1 items-center justify-center"
        >
          <ActivityIndicator size="large" color={colors.rose[400]} />
          <Text className="mt-4 font-urbanist-medium text-base text-white/60">
            {t('hirer.browse.for_you.loading')}
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <FocusAwareStatusBar style="light" />

      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        orientation="vertical"
        initialPage={0}
        onPageSelected={handlePageSelected}
        overdrag
      >
        {recommendations.map((item: ScoredCompanion, index: number) => (
          <RNView key={item.companionId} collapsable={false}>
            <FeedCard
              recommendation={item}
              isActive={index === currentPage}
              isFavorite={favoriteIds.has(item.companionId)}
              onFavoriteToggle={handleFavoriteToggle}
              onBook={handleBook}
              onPhotoBrowse={handlePhotoBrowse}
              onDwellPause={handleDwellPause}
            />
          </RNView>
        ))}
      </PagerView>

      {/* Loading indicator when fetching more */}
      {isFetchingNextPage && (
        <RNView className="absolute bottom-8 left-0 right-0 items-center">
          <ActivityIndicator color={colors.rose[400]} />
        </RNView>
      )}
    </View>
  );
}
