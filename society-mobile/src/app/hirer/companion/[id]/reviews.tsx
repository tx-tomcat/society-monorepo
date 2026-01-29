/* eslint-disable max-lines-per-function */
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView } from 'react-native';

import {
  colors,
  FocusAwareStatusBar,
  Image,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { ArrowLeft, Star } from '@/components/ui/icons';
import type { CompanionReview } from '@/lib/api/services/companions.service';
import { useCompanionReviews } from '@/lib/hooks';
import { formatRelativeDate } from '@/lib/utils';

const RATING_FILTERS = ['all', '5', '4', '3', '2', '1'];

function ReviewItem({ review }: { review: CompanionReview }) {
  const { t } = useTranslation();

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300 }}
      className="mx-4 mb-4 rounded-2xl bg-white p-4"
    >
      {/* Header */}
      <View className="mb-3 flex-row items-center gap-3">
        <Image
          source={{
            uri:
              review.reviewer?.avatarUrl ||
              'https://via.placeholder.com/100x100',
          }}
          className="size-12 rounded-full"
          contentFit="cover"
        />
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="font-urbanist-semibold text-base text-midnight">
              {review.reviewer?.fullName || 'Anonymous'}
            </Text>
            <View className="rounded-full bg-teal-400/10 px-2 py-0.5">
              <Text className="text-[10px] font-medium text-teal-600">
                {t('hirer.reviews.verified')}
              </Text>
            </View>
          </View>
          <Text className="text-sm text-text-tertiary">
            {formatRelativeDate(review.createdAt)}
          </Text>
        </View>
        <View className="flex-row items-center gap-1 rounded-full bg-yellow-400/10 px-3 py-1.5">
          <Star color={colors.yellow[400]} width={14} height={14} />
          <Text className="font-urbanist-bold text-sm text-midnight">
            {review.rating}
          </Text>
        </View>
      </View>

      {/* Comment */}
      {review.comment && (
        <Text className="leading-relaxed text-text-secondary">
          {review.comment}
        </Text>
      )}
    </MotiView>
  );
}

function RatingBar({
  rating,
  count,
  total,
}: {
  rating: number;
  count: number;
  total: number;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <View className="flex-row items-center gap-2">
      <Text className="w-4 text-right text-xs text-text-secondary">
        {rating}
      </Text>
      <Star color={colors.yellow[400]} width={12} height={12} />
      <View className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
        <View
          className="h-full rounded-full bg-yellow-400"
          style={{ width: `${percentage}%` }}
        />
      </View>
      <Text className="w-8 text-right text-xs text-text-tertiary">{count}</Text>
    </View>
  );
}

export default function CompanionReviewsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();

  const [selectedFilter, setSelectedFilter] = React.useState('all');

  // Fetch reviews from API
  const { data: reviewsData, isLoading } = useCompanionReviews(id || '', 1, 50);

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  // Filter reviews based on selected rating
  const filteredReviews = React.useMemo(() => {
    if (!reviewsData?.reviews) return [];
    if (selectedFilter === 'all') return reviewsData.reviews;
    return reviewsData.reviews.filter(
      (r) => r.rating === parseInt(selectedFilter, 10)
    );
  }, [reviewsData?.reviews, selectedFilter]);

  // Get stats from API response
  const stats = React.useMemo(() => {
    if (!reviewsData) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<
          number,
          number
        >,
      };
    }
    return {
      averageRating: reviewsData.averageRating || 0,
      totalReviews: reviewsData.total || 0,
      ratingDistribution: (reviewsData.ratingDistribution || {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      }) as Record<number, number>,
    };
  }, [reviewsData]);

  const renderReview = React.useCallback(
    ({ item }: { item: CompanionReview }) => <ReviewItem review={item} />,
    []
  );

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 bg-warmwhite">
        <FocusAwareStatusBar />
        <SafeAreaView edges={['top']}>
          <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
            <Pressable
              onPress={handleBack}
              className="size-10 items-center justify-center"
            >
              <ArrowLeft
                color={colors.midnight.DEFAULT}
                width={24}
                height={24}
              />
            </Pressable>
            <Text className="flex-1 font-urbanist-bold text-xl text-midnight">
              {t('hirer.reviews.title')}
            </Text>
          </View>
        </SafeAreaView>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.rose[400]} size="large" />
          <Text className="mt-4 text-text-secondary">
            {t('common.loading')}
          </Text>
        </View>
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
            {t('hirer.reviews.title')}
          </Text>
        </View>
      </SafeAreaView>

      {/* Rating Summary */}
      <View className="border-b border-border-light bg-white px-4 py-5">
        <View className="flex-row gap-6">
          {/* Average Rating */}
          <View className="items-center">
            <Text className="font-urbanist-bold text-5xl text-midnight">
              {stats.averageRating.toFixed(1)}
            </Text>
            <View className="mt-1 flex-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  color={
                    star <= Math.round(stats.averageRating)
                      ? colors.yellow[400]
                      : colors.neutral[200]
                  }
                  width={16}
                  height={16}
                />
              ))}
            </View>
            <Text className="mt-1 text-sm text-text-tertiary">
              {stats.totalReviews} {t('hirer.reviews.reviews')}
            </Text>
          </View>

          {/* Rating Distribution */}
          <View className="flex-1 justify-center gap-1.5">
            {[5, 4, 3, 2, 1].map((rating) => (
              <RatingBar
                key={rating}
                rating={rating}
                count={stats.ratingDistribution[rating] || 0}
                total={stats.totalReviews}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View className="border-b border-border-light bg-white">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        >
          {RATING_FILTERS.map((filter) => {
            const isSelected = selectedFilter === filter;
            const label =
              filter === 'all' ? t('hirer.reviews.all') : `${filter} ★`;
            return (
              <Pressable
                key={filter}
                onPress={() => setSelectedFilter(filter)}
                className={`mr-2 rounded-full px-4 py-2 ${
                  isSelected ? 'bg-rose-400' : 'bg-neutral-100'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    isSelected ? 'text-white' : 'text-text-secondary'
                  }`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Reviews List */}
      <View className="flex-1 pt-4">
        {filteredReviews.length > 0 ? (
          <FlashList
            data={filteredReviews}
            renderItem={renderReview}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-8">
            <View className="mb-4 size-16 items-center justify-center rounded-full bg-neutral-100">
              <Star color={colors.neutral[400]} width={28} height={28} />
            </View>
            <Text className="text-center font-urbanist-semibold text-lg text-midnight">
              {t('hirer.reviews.no_reviews')}
            </Text>
            <Text className="mt-2 text-center text-sm text-text-tertiary">
              {t('hirer.reviews.no_reviews_filter')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
