/* eslint-disable max-lines-per-function */
import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
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
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  Coffee,
  Confetti,
  Family,
  Heart,
  MaiFlower,
  MapPin,
  MessageCircle,
  Share,
  ShieldCheck,
  Star,
  VerifiedBadge,
  WeddingRings,
} from '@/components/ui/icons';
import {
  useCompanion,
  useCompanionAvailability,
  useCompanionReviews,
  useIsFavorite,
  useToggleFavorite,
} from '@/lib/hooks';
import { formatVND } from '@/lib/utils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_WIDTH * 1.1;

type Review = {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  comment: string;
  occasion: string;
};

type TimeSlot = {
  id: string;
  time: string;
  available: boolean;
};

type Companion = {
  id: string;
  name: string;
  age: number;
  images: string[];
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  location: string;
  isVerified: boolean;
  isOnline: boolean;
  bio: string;
  responseTime: string;
  completionRate: number;
  languages: string[];
  specialties: string[];
  reviews: Review[];
  availability: TimeSlot[];
};

const OCCASION_ICONS: Record<
  string,
  React.ComponentType<{ color: string; width: number; height: number }>
> = {
  wedding: WeddingRings,
  family: Family,
  business: Briefcase,
  tet: MaiFlower,
  casual: Coffee,
  party: Confetti,
};

function ReviewCard({ review }: { review: Review }) {
  const OccasionIcon = OCCASION_ICONS[review.occasion] || Calendar;

  return (
    <View className="mr-4 w-72 rounded-2xl bg-white p-4">
      <View className="mb-3 flex-row items-center gap-3">
        <Image
          source={{ uri: review.avatar }}
          className="size-10 rounded-full"
          contentFit="cover"
        />
        <View className="flex-1">
          <Text style={styles.reviewAuthor} className="text-sm text-midnight">
            {review.author}
          </Text>
          <Text className="text-xs text-text-tertiary">{review.date}</Text>
        </View>
        <View className="flex-row items-center gap-1 rounded-full bg-yellow-400/10 px-2 py-1">
          <Star color={colors.yellow[400]} width={12} height={12} />
          <Text className="text-xs font-semibold text-midnight">
            {review.rating}
          </Text>
        </View>
      </View>
      <Text
        className="mb-3 text-sm leading-relaxed text-text-secondary"
        numberOfLines={3}
      >
        {review.comment}
      </Text>
      <View className="flex-row items-center gap-1">
        <OccasionIcon color={colors.lavender[400]} width={14} height={14} />
        <Text className="text-xs capitalize text-lavender-400">
          {review.occasion}
        </Text>
      </View>
    </View>
  );
}

function ImageGallery({
  images,
  currentIndex,
  onIndexChange,
}: {
  images: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}) {
  return (
    <View style={{ height: IMAGE_HEIGHT }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(
            e.nativeEvent.contentOffset.x / SCREEN_WIDTH
          );
          onIndexChange(index);
        }}
      >
        {images.map((image, index) => (
          <Image
            key={index}
            source={{ uri: image }}
            style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }}
            contentFit="cover"
          />
        ))}
      </ScrollView>
      {/* Image indicators */}
      <View className="absolute inset-x-0 bottom-4 flex-row items-center justify-center gap-2">
        {images.map((_, index) => (
          <View
            key={index}
            className={`h-2 rounded-full ${
              index === currentIndex ? 'w-6 bg-white' : 'w-2 bg-white/50'
            }`}
          />
        ))}
      </View>
      {/* Gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)']}
        style={[StyleSheet.absoluteFill, { top: IMAGE_HEIGHT - 120 }]}
      />
    </View>
  );
}

export default function CompanionProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();

  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);

  // API hooks
  const { data: companionData, isLoading: isLoadingCompanion } = useCompanion(
    id || ''
  );
  const { data: favoriteData } = useIsFavorite(id || '');
  const toggleFavoriteMutation = useToggleFavorite();
  const { data: availabilityData } = useCompanionAvailability(
    id || '',
    selectedDate || undefined
  );
  const { data: reviewsData } = useCompanionReviews(id || '', 1, 5);

  const isFavorite = favoriteData?.isFavorite ?? false;

  // Transform API data to component format
  const companion = React.useMemo((): Companion | null => {
    if (!companionData) return null;
    const c = companionData;
    return {
      id: c.id,
      name: c.user?.fullName || '',
      age: 0, // Not available in API
      images:
        c.photos?.map((p) => p.url) ||
        (c.user?.avatarUrl ? [c.user.avatarUrl] : []),
      rating: c.ratingAvg ?? 0,
      reviewCount: c.ratingCount ?? 0,
      hourlyRate: c.hourlyRate ?? 0,
      location: c.languages?.join(', ') || '',
      isVerified: c.user?.isVerified ?? c.verificationStatus === 'verified',
      isOnline: c.isActive,
      bio: c.bio || '',
      responseTime: '< 30 min',
      completionRate:
        c.totalBookings > 0
          ? Math.round((c.completedBookings / c.totalBookings) * 100)
          : 0,
      languages: c.languages || [],
      specialties: c.services?.map((s) => s.type) || [],
      reviews: [] as Review[],
      availability: [] as TimeSlot[],
    };
  }, [companionData]);

  // Transform reviews data from CompanionReview type
  const reviews = React.useMemo(() => {
    if (!reviewsData?.reviews) return [];
    return reviewsData.reviews.map((r) => ({
      id: r.id,
      author: r.reviewer?.fullName || 'Anonymous',
      avatar: r.reviewer?.avatarUrl || '',
      rating: r.rating,
      date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '',
      comment: r.comment || '',
      occasion: 'casual', // Not available in CompanionReview type
    })) as Review[];
  }, [reviewsData]);

  // Transform availability data - convert availability blocks to time slots
  const availability = React.useMemo(() => {
    if (!availabilityData || !Array.isArray(availabilityData)) return [];
    // Generate time slots from availability blocks
    const slots: TimeSlot[] = [];
    availabilityData.forEach((block, index) => {
      if (block.isAvailable) {
        slots.push({
          id: String(index),
          time: `${block.startTime} - ${block.endTime}`,
          available: block.isAvailable,
        });
      }
    });
    return slots;
  }, [availabilityData]);

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleShare = React.useCallback(() => {
    // TODO: Implement share functionality
  }, []);

  const handleToggleFavorite = React.useCallback(() => {
    if (id) {
      toggleFavoriteMutation.mutate(id);
    }
  }, [id, toggleFavoriteMutation]);

  const handleMessage = React.useCallback(() => {
    if (id) {
      router.push(`/hirer/chat/${id}` as Href);
    }
  }, [router, id]);

  const handleBookNow = React.useCallback(() => {
    if (id) {
      router.push(`/hirer/booking/new?companionId=${id}` as Href);
    }
  }, [router, id]);

  const handleViewAllReviews = React.useCallback(() => {
    if (id) {
      router.push(`/hirer/companion/${id}/reviews` as Href);
    }
  }, [router, id]);

  // Generate next 7 days for date picker
  const dates = React.useMemo(() => {
    const result = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      result.push({
        id: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
      });
    }
    return result;
  }, []);

  // Loading state
  if (isLoadingCompanion) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite">
        <FocusAwareStatusBar style="dark" />
        <ActivityIndicator color={colors.rose[400]} size="large" />
        <Text className="mt-4 text-text-secondary">{t('common.loading')}</Text>
      </View>
    );
  }

  // Error state - companion not found
  if (!companion) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite">
        <FocusAwareStatusBar style="dark" />
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
      <FocusAwareStatusBar style="light" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero Image Gallery */}
        <ImageGallery
          images={
            companion.images.length > 0
              ? companion.images
              : ['https://via.placeholder.com/800x800']
          }
          currentIndex={currentImageIndex}
          onIndexChange={setCurrentImageIndex}
        />

        {/* Floating Header */}
        <SafeAreaView
          edges={['top']}
          style={[StyleSheet.absoluteFill, { height: 100 }]}
        >
          <View className="flex-row items-center justify-between px-4 pt-2">
            <Pressable
              onPress={handleBack}
              className="size-10 items-center justify-center rounded-full bg-black/30"
            >
              <ArrowLeft color="#FFFFFF" width={24} height={24} />
            </Pressable>
            <View className="flex-row gap-2">
              <Pressable
                onPress={handleShare}
                className="size-10 items-center justify-center rounded-full bg-black/30"
              >
                <Share color="#FFFFFF" width={20} height={20} />
              </Pressable>
              <Pressable
                onPress={handleToggleFavorite}
                className="size-10 items-center justify-center rounded-full bg-black/30"
              >
                <Heart
                  color={isFavorite ? colors.rose[400] : '#FFFFFF'}
                  width={20}
                  height={20}
                  fill={isFavorite ? colors.rose[400] : 'none'}
                />
              </Pressable>
            </View>
          </View>
        </SafeAreaView>

        {/* Profile Content */}
        <View className="-mt-6 rounded-t-3xl bg-warmwhite">
          {/* Basic Info */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            className="px-4 pt-6"
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text style={styles.name} className="text-2xl text-midnight">
                    {companion.name}, {companion.age}
                  </Text>
                  {companion.isVerified && (
                    <VerifiedBadge
                      color={colors.teal[400]}
                      width={24}
                      height={24}
                    />
                  )}
                </View>
                <View className="mt-2 flex-row items-center gap-2">
                  <MapPin color={colors.text.tertiary} width={14} height={14} />
                  <Text className="text-sm text-text-secondary">
                    {companion.location}
                  </Text>
                </View>
              </View>
              {companion.isOnline && (
                <Badge
                  label={t('hirer.companion.online')}
                  variant="teal"
                  size="sm"
                />
              )}
            </View>

            {/* Rating & Stats Row */}
            <View className="mt-4 flex-row items-center gap-4">
              <View className="flex-row items-center gap-1">
                <Star color={colors.yellow[400]} width={18} height={18} />
                <Text style={styles.rating} className="text-lg text-midnight">
                  {companion.rating}
                </Text>
                <Text className="text-sm text-text-tertiary">
                  ({companion.reviewCount} {t('hirer.companion.reviews')})
                </Text>
              </View>
              <View className="h-4 w-px bg-border" />
              <View className="flex-row items-center gap-1">
                <Clock color={colors.text.tertiary} width={14} height={14} />
                <Text className="text-sm text-text-secondary">
                  {companion.responseTime}
                </Text>
              </View>
              <View className="h-4 w-px bg-border" />
              <View className="flex-row items-center gap-1">
                <CheckCircle color={colors.teal[400]} width={14} height={14} />
                <Text className="text-sm text-text-secondary">
                  {companion.completionRate}%
                </Text>
              </View>
            </View>

            {/* Price */}
            <View className="mt-4 flex-row items-baseline gap-1">
              <Text style={styles.price} className="text-2xl text-rose-400">
                {formatVND(companion.hourlyRate)}
              </Text>
              <Text className="text-sm text-text-tertiary">
                /{t('hirer.companion.hour')}
              </Text>
            </View>
          </MotiView>

          {/* About Section */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 100 }}
            className="mx-4 mt-6 rounded-2xl bg-white p-4"
          >
            <Text
              style={styles.sectionTitle}
              className="mb-3 text-base text-midnight"
            >
              {t('hirer.companion.about')}
            </Text>
            <Text className="leading-relaxed text-text-secondary">
              {companion.bio}
            </Text>
            <View className="mt-4 flex-row flex-wrap gap-2">
              {companion.languages.map((lang) => (
                <Badge key={lang} label={lang} variant="lavender" size="sm" />
              ))}
            </View>
          </MotiView>

          {/* Specialties */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 150 }}
            className="mx-4 mt-4 rounded-2xl bg-white p-4"
          >
            <Text
              style={styles.sectionTitle}
              className="mb-3 text-base text-midnight"
            >
              {t('hirer.companion.specialties')}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {companion.specialties.map((specialty) => {
                const Icon = OCCASION_ICONS[specialty] || Calendar;
                return (
                  <View
                    key={specialty}
                    className="flex-row items-center gap-2 rounded-full bg-softpink px-4 py-2"
                  >
                    <Icon color={colors.rose[400]} width={16} height={16} />
                    <Text className="text-sm font-medium capitalize text-rose-500">
                      {t(`occasions.${specialty}`)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </MotiView>

          {/* Verification Badge */}
          {companion.isVerified && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 200 }}
              className="mx-4 mt-4 rounded-2xl bg-teal-400/10 p-4"
            >
              <View className="flex-row items-center gap-3">
                <ShieldCheck color={colors.teal[400]} width={28} height={28} />
                <View className="flex-1">
                  <Text
                    style={styles.verifiedTitle}
                    className="text-sm text-teal-700"
                  >
                    {t('hirer.companion.verified_profile')}
                  </Text>
                  <Text className="text-xs text-text-secondary">
                    {t('hirer.companion.verified_desc')}
                  </Text>
                </View>
              </View>
            </MotiView>
          )}

          {/* Availability Preview */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 250 }}
            className="mt-6 px-4"
          >
            <View className="mb-3 flex-row items-center gap-2">
              <Calendar color={colors.rose[400]} width={20} height={20} />
              <Text
                style={styles.sectionTitle}
                className="text-base text-midnight"
              >
                {t('hirer.companion.availability')}
              </Text>
            </View>

            {/* Date Selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
            >
              {dates.map((date, index) => {
                const isSelected = selectedDate === date.id;
                return (
                  <Pressable
                    key={date.id}
                    onPress={() => setSelectedDate(date.id)}
                    className={`mr-3 items-center rounded-xl px-4 py-3 ${
                      isSelected ? 'bg-rose-400' : 'bg-white'
                    }`}
                  >
                    <Text
                      className={`text-xs ${
                        isSelected ? 'text-white' : 'text-text-tertiary'
                      }`}
                    >
                      {date.day}
                    </Text>
                    <Text
                      style={styles.dateNumber}
                      className={`text-lg ${
                        isSelected ? 'text-white' : 'text-midnight'
                      }`}
                    >
                      {date.date}
                    </Text>
                    <Text
                      className={`text-xs ${
                        isSelected ? 'text-white/80' : 'text-text-tertiary'
                      }`}
                    >
                      {date.month}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Time Slots */}
            <View className="flex-row flex-wrap gap-2">
              {availability.length > 0 ? (
                availability.map((slot) => (
                  <View
                    key={slot.id}
                    className={`rounded-lg px-4 py-2 ${
                      slot.available ? 'bg-white' : 'bg-neutral-100'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        slot.available
                          ? 'text-midnight'
                          : 'text-text-tertiary line-through'
                      }`}
                    >
                      {slot.time}
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="text-sm text-text-tertiary">
                  {t('hirer.companion.select_date')}
                </Text>
              )}
            </View>
          </MotiView>

          {/* Reviews Section */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 300 }}
            className="mt-6"
          >
            <View className="mb-3 flex-row items-center justify-between px-4">
              <View className="flex-row items-center gap-2">
                <Star color={colors.yellow[400]} width={20} height={20} />
                <Text
                  style={styles.sectionTitle}
                  className="text-base text-midnight"
                >
                  {t('hirer.companion.reviews_title')}
                </Text>
                <Text className="text-sm text-text-tertiary">
                  ({companion.reviewCount})
                </Text>
              </View>
              <Pressable onPress={handleViewAllReviews}>
                <Text className="text-sm font-semibold text-rose-400">
                  {t('hirer.companion.see_all')}
                </Text>
              </Pressable>
            </View>

            {reviews.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
              >
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </ScrollView>
            ) : (
              <View className="items-center px-4 py-8">
                <Text className="text-sm text-text-tertiary">
                  {t('hirer.companion.no_reviews')}
                </Text>
              </View>
            )}
          </MotiView>

          {/* Bottom Spacing */}
          <View className="h-32" />
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <SafeAreaView
        edges={['bottom']}
        className="border-t border-border-light bg-white"
      >
        <View className="flex-row items-center gap-3 p-4">
          <Pressable
            onPress={handleMessage}
            className="size-12 items-center justify-center rounded-xl bg-lavender-400/10"
          >
            <MessageCircle
              color={colors.lavender[400]}
              width={24}
              height={24}
            />
          </Pressable>
          <Button
            label={t('hirer.companion.book_now')}
            onPress={handleBookNow}
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
  name: {
    fontFamily: 'Urbanist_700Bold',
  },
  rating: {
    fontFamily: 'Urbanist_700Bold',
  },
  price: {
    fontFamily: 'Urbanist_700Bold',
  },
  sectionTitle: {
    fontFamily: 'Urbanist_600SemiBold',
  },
  verifiedTitle: {
    fontFamily: 'Urbanist_600SemiBold',
  },
  dateNumber: {
    fontFamily: 'Urbanist_700Bold',
  },
  reviewAuthor: {
    fontFamily: 'Urbanist_600SemiBold',
  },
});
