/* eslint-disable max-lines-per-function */
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView } from 'react-native';

import {
  colors,
  FocusAwareStatusBar,
  Image,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Coffee,
  Confetti,
  Family,
  MaiFlower,
  Star,
  WeddingRings,
} from '@/components/ui/icons';

type OccasionInfo = {
  id: string;
  code: string;
  emoji: string;
  name: string;
};

type Review = {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  comment: string;
  occasion: OccasionInfo | null;
  isVerifiedBooking: boolean;
};

// Fallback icon mapping for occasions without emoji
const OCCASION_ICONS: Record<
  string,
  React.ComponentType<{ color: string; width: number; height: number }>
> = {
  wedding_attendance: WeddingRings,
  family_introduction: Family,
  business_event: Briefcase,
  tet_celebration: MaiFlower,
  casual_outing: Coffee,
  social_event: Confetti,
};

const RATING_FILTERS = ['all', '5', '4', '3', '2', '1'];

const MOCK_REVIEWS: Review[] = [
  {
    id: '1',
    author: 'Hoàng Long',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    rating: 5,
    date: '2 weeks ago',
    comment:
      "Minh Anh was absolutely wonderful at my sister's wedding. She arrived early, dressed elegantly, and made everyone feel comfortable. Her conversation skills are excellent and she navigated family dynamics with grace. Highly recommend for any formal event!",
    occasion: { id: '1', code: 'wedding_attendance', emoji: '💒', name: 'Wedding' },
    isVerifiedBooking: true,
  },
  {
    id: '2',
    author: 'Thu Trang',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    rating: 5,
    date: '1 month ago',
    comment:
      'Perfect companion for our corporate dinner. Eloquent, well-dressed, and great at conversation. She made a wonderful impression on our business partners. Will definitely book again for future events.',
    occasion: { id: '2', code: 'business_event', emoji: '💼', name: 'Business' },
    isVerifiedBooking: true,
  },
  {
    id: '3',
    author: 'Văn Đức',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    rating: 4,
    date: '1 month ago',
    comment:
      'Very professional and punctual. Made the family gathering much more enjoyable. Great personality and knew how to engage with everyone from grandparents to cousins.',
    occasion: { id: '3', code: 'family_introduction', emoji: '👨‍👩‍👧', name: 'Family' },
    isVerifiedBooking: true,
  },
  {
    id: '4',
    author: 'Ngọc Mai',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    rating: 5,
    date: '2 months ago',
    comment:
      'Booked for Tết celebration. She helped make our family reunion so much warmer. Everyone loved her, especially the elderly relatives. Such a genuine and warm person!',
    occasion: { id: '4', code: 'tet_celebration', emoji: '🏮', name: 'Tết' },
    isVerifiedBooking: true,
  },
  {
    id: '5',
    author: 'Minh Quân',
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    rating: 5,
    date: '2 months ago',
    comment:
      'Amazing experience! Minh Anh is professional, charming, and a wonderful conversationalist. She made everyone feel at ease and added such a positive energy to the event.',
    occasion: { id: '5', code: 'social_event', emoji: '🎉', name: 'Party' },
    isVerifiedBooking: true,
  },
  {
    id: '6',
    author: 'Hải Yến',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
    rating: 4,
    date: '3 months ago',
    comment:
      'Good companion for a casual outing. Friendly, easy to talk to, and very presentable. Would recommend for anyone looking for pleasant company.',
    occasion: { id: '6', code: 'casual_outing', emoji: '☕', name: 'Casual' },
    isVerifiedBooking: true,
  },
];

const MOCK_STATS = {
  averageRating: 4.9,
  totalReviews: 127,
  ratingDistribution: {
    5: 108,
    4: 15,
    3: 3,
    2: 1,
    1: 0,
  },
};

function ReviewItem({ review }: { review: Review }) {
  const { t } = useTranslation();
  const occasionCode = review.occasion?.code || '';
  const OccasionIcon = OCCASION_ICONS[occasionCode] || Calendar;

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
          source={{ uri: review.avatar }}
          className="size-12 rounded-full"
          contentFit="cover"
        />
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="font-urbanist-semibold text-base text-midnight">
              {review.author}
            </Text>
            {review.isVerifiedBooking && (
              <View className="rounded-full bg-teal-400/10 px-2 py-0.5">
                <Text className="text-[10px] font-medium text-teal-600">
                  {t('hirer.reviews.verified')}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-sm text-text-tertiary">{review.date}</Text>
        </View>
        <View className="flex-row items-center gap-1 rounded-full bg-yellow-400/10 px-3 py-1.5">
          <Star color={colors.yellow[400]} width={14} height={14} />
          <Text className="font-urbanist-bold text-sm text-midnight">
            {review.rating}
          </Text>
        </View>
      </View>

      {/* Comment */}
      <Text className="mb-3 leading-relaxed text-text-secondary">
        {review.comment}
      </Text>

      {/* Occasion Tag */}
      {review.occasion && (
        <View className="flex-row items-center gap-1.5">
          {review.occasion.emoji ? (
            <Text className="text-sm">{review.occasion.emoji}</Text>
          ) : (
            <OccasionIcon color={colors.lavender[400]} width={14} height={14} />
          )}
          <Text className="text-xs font-medium text-lavender-500">
            {review.occasion.name}
          </Text>
        </View>
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

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const filteredReviews = React.useMemo(() => {
    if (selectedFilter === 'all') return MOCK_REVIEWS;
    return MOCK_REVIEWS.filter(
      (r) => r.rating === parseInt(selectedFilter, 10)
    );
  }, [selectedFilter]);

  const renderReview = React.useCallback(
    ({ item }: { item: Review }) => <ReviewItem review={item} />,
    []
  );

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
              {MOCK_STATS.averageRating}
            </Text>
            <View className="mt-1 flex-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  color={
                    star <= Math.round(MOCK_STATS.averageRating)
                      ? colors.yellow[400]
                      : colors.neutral[200]
                  }
                  width={16}
                  height={16}
                />
              ))}
            </View>
            <Text className="mt-1 text-sm text-text-tertiary">
              {MOCK_STATS.totalReviews} {t('hirer.reviews.reviews')}
            </Text>
          </View>

          {/* Rating Distribution */}
          <View className="flex-1 justify-center gap-1.5">
            {[5, 4, 3, 2, 1].map((rating) => (
              <RatingBar
                key={rating}
                rating={rating}
                count={
                  MOCK_STATS.ratingDistribution[
                    rating as keyof typeof MOCK_STATS.ratingDistribution
                  ]
                }
                total={MOCK_STATS.totalReviews}
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
            estimatedItemSize={180}
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

