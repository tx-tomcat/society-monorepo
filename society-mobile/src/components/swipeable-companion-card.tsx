/* eslint-disable max-lines-per-function */
import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Platform, Pressable, View as RNView } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors, Image, Text } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Heart,
  MessageCircle,
  OnlineDot,
  ShieldCheck,
  Star,
} from '@/components/ui/icons';
import type { ScoredCompanion } from '@/lib/api/services/recommendations.service';
import { formatLanguages, formatVND, getOccasionName } from '@/lib/utils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.72;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

// Photo indicator dots
function PhotoIndicator({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  if (total <= 1) return null;

  return (
    <RNView className="absolute left-0 right-0 top-4 flex-row justify-center gap-1.5 px-16">
      {Array.from({ length: Math.min(total, 6) }).map((_, index) => (
        <RNView
          key={index}
          className={`h-[3px] max-w-10 flex-1 rounded-sm ${index === current ? 'bg-white' : 'bg-white/40'
            }`}
        />
      ))}
    </RNView>
  );
}

// Main swipeable card component
// Static card for FlatList (same design, no swipe gestures)
export function CompanionCard({
  recommendation,
  onBookPress,
  onCardPress,
}: {
  recommendation: ScoredCompanion;
  onBookPress?: (companionId: string) => void;
  onCardPress?: (companionId: string) => void;
}) {

  console.log('recommendation', recommendation);
  const { t, i18n } = useTranslation();
  const router = useRouter();

  // Use embedded companion data from recommendation (no API call needed!)
  const companion = recommendation.companion;

  const [currentPhotoIndex, setCurrentPhotoIndex] = React.useState(0);

  // Get photos array from embedded data
  const photos = React.useMemo(() => {
    if (!companion?.photos?.length) {
      return companion?.avatar
        ? [companion.avatar]
        : ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800'];
    }
    return companion.photos.map((p) => p.url);
  }, [companion]);

  const handleViewProfile = React.useCallback(() => {
    if (onCardPress) {
      onCardPress(recommendation.companionId);
    } else {
      router.push(`/hirer/companion/${recommendation.companionId}` as Href);
    }
  }, [router, recommendation.companionId, onCardPress]);

  const handleBookNow = React.useCallback(() => {
    if (onBookPress) {
      onBookPress(recommendation.companionId);
    }
  }, [onBookPress, recommendation.companionId]);

  // Handle photo tap to navigate between photos
  const handleLeftTap = React.useCallback(() => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex((prev) => prev - 1);
    }
  }, [currentPhotoIndex]);

  const handleRightTap = React.useCallback(() => {
    if (currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex((prev) => prev + 1);
    }
  }, [currentPhotoIndex, photos.length]);

  if (!companion) {
    return (
      <RNView
        className="mx-4 mb-4 overflow-hidden rounded-3xl bg-charcoal-100"
        style={{ height: CARD_HEIGHT }}
      />
    );
  }

  return (
    <Pressable onPress={handleViewProfile}>
      <RNView
        className="mx-4 mb-4 overflow-hidden rounded-3xl bg-charcoal-100"
        style={{
          height: CARD_HEIGHT,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 12,
        }}
      >
        {/* Photo with gradient overlay */}
        <RNView className="relative flex-1">
          <Image
            source={{ uri: photos[currentPhotoIndex] }}
            className="size-full"
            contentFit="cover"
          />

          {/* Gradient overlay for text readability */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
            locations={[0.4, 0.65, 1]}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: '70%',
            }}
          />

          {/* Photo navigation tap zones */}
          <RNView className="absolute inset-0 flex-row">
            <Pressable className="flex-1" onPress={handleLeftTap} />
            <Pressable className="flex-1" onPress={handleRightTap} />
          </RNView>

          {/* Photo indicator */}
          <PhotoIndicator total={photos.length} current={currentPhotoIndex} />

          {/* Top badges */}
          <RNView className="absolute left-4 top-7 flex-row gap-2">
            {companion.isActive && (
              <Badge
                label={t('hirer.companion_card.online')}
                variant="online"
                size="sm"
                icon={<OnlineDot color="#FFFFFF" width={8} height={8} />}
              />
            )}
            {companion.isVerified && (
              <Badge
                label={t('hirer.companion_card.verified')}
                variant="verified"
                size="sm"
                icon={<ShieldCheck color="#FFFFFF" width={12} height={12} />}
              />
            )}
          </RNView>

          {/* Bottom content overlay */}
          <RNView
            className="absolute inset-x-0 bottom-0 p-5"
            style={{ paddingBottom: Platform.OS === 'ios' ? 24 : 20 }}
          >
            {/* Recommendation reason */}
            <RNView className="mb-3 flex-row items-center gap-1.5 self-start rounded-full bg-white/15 px-3 py-1.5">
              <Heart
                color={colors.rose[400]}
                width={12}
                height={12}
                fill={colors.rose[400]}
              />
              <Text className="font-urbanist-medium text-xs text-white">
                {recommendation.reason}
              </Text>
            </RNView>

            {/* Name and age */}
            <RNView className="mb-2 flex-row items-center gap-2">
              <Text className="font-urbanist-bold text-3xl tracking-tight text-white">
                {companion.displayName}
                {companion.age && (
                  <Text className="font-urbanist text-2xl text-white/90">
                    , {companion.age}
                  </Text>
                )}
              </Text>
              {companion.isVerified && (
                <ShieldCheck color={colors.teal[400]} width={24} height={24} />
              )}
            </RNView>

            {/* Rating and reviews */}
            <RNView className="mb-3 flex-row items-center gap-4">
              <RNView className="flex-row items-center gap-1">
                <Star color="#FFD93D" width={16} height={16} filled />
                <Text className="font-urbanist-medium text-sm text-white/90">
                  {companion.rating?.toFixed(1) || '5.0'} ({companion.reviewCount || 0})
                </Text>
              </RNView>
              {companion.languages && companion.languages.length > 0 && (
                <RNView className="flex-row items-center gap-1">
                  <MessageCircle color="#FFFFFF" width={14} height={14} />
                  <Text className="font-urbanist-medium text-sm text-white/90">
                    {formatLanguages(companion.languages, 2)}
                  </Text>
                </RNView>
              )}
            </RNView>

            {/* Services tags */}
            {companion.services?.length > 0 && (
              <RNView className="mb-4 flex-row flex-wrap gap-2">
                {companion.services.slice(0, 3).map((service) => (
                  <RNView
                    key={service.occasionId}
                    className="rounded-2xl bg-white/20 px-3 py-1.5"
                  >
                    <Text className="font-urbanist-medium text-xs text-white">
                      {getOccasionName(service.occasion, i18n.language) || service.occasionId}
                    </Text>
                  </RNView>
                ))}
              </RNView>
            )}

            {/* Price */}
            <RNView className="mb-4">
              <Text className="mb-0.5 font-urbanist text-xs text-white/70">
                {t('hirer.companion_card.starting_from')}
              </Text>
              <Text className="font-urbanist-bold text-2xl text-rose-300">
                {formatVND(companion.hourlyRate)}
                <Text className="font-urbanist-medium text-base text-white/70">
                  /hr
                </Text>
              </Text>
            </RNView>

            {/* Action buttons */}
            <RNView className="flex-row items-center gap-3">
              <Pressable onPress={handleBookNow} className="flex-1 overflow-hidden rounded-2xl">
                <LinearGradient
                  colors={[colors.rose[400], colors.coral[400]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    paddingVertical: 16,
                  }}
                >
                  <Calendar color="#FFFFFF" width={20} height={20} />
                  <Text className="font-urbanist-bold text-base tracking-wide text-white">
                    {t('hirer.companion_card.book_now')}
                  </Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                onPress={handleViewProfile}
                className="overflow-hidden rounded-2xl"
              >
                <RNView className="items-center justify-center rounded-2xl border border-white/10 bg-white/20 px-4 py-3.5">
                  <Text className="font-urbanist-semibold text-xs text-white">
                    {t('hirer.browse.for_you.view_profile')}
                  </Text>
                </RNView>
              </Pressable>
            </RNView>
          </RNView>
        </RNView>
      </RNView>
    </Pressable>
  );
}

// Main swipeable card component
export function SwipeableCompanionCard({
  recommendation,
  onSwipeLeft,
  onSwipeRight,
  onBookPress,
  isActive,
}: {
  recommendation: ScoredCompanion;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onBookPress?: (companionId: string) => void;
  isActive: boolean;
}) {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  // Use embedded companion data from recommendation (no API call needed!)
  const companion = recommendation.companion;

  const [currentPhotoIndex, setCurrentPhotoIndex] = React.useState(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardRotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const likeOpacity = useSharedValue(0);
  const nopeOpacity = useSharedValue(0);

  // Get photos array from embedded data
  const photos = React.useMemo(() => {
    if (!companion?.photos?.length) {
      return companion?.avatar
        ? [companion.avatar]
        : ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800'];
    }
    return companion.photos.map((p) => p.url);
  }, [companion]);

  // Handle photo tap to navigate between photos
  const handlePhotoTap = React.useCallback(
    (tapX: number) => {
      const isLeftSide = tapX < CARD_WIDTH / 2;
      if (isLeftSide && currentPhotoIndex > 0) {
        setCurrentPhotoIndex((prev) => prev - 1);
      } else if (!isLeftSide && currentPhotoIndex < photos.length - 1) {
        setCurrentPhotoIndex((prev) => prev + 1);
      }
    },
    [currentPhotoIndex, photos.length]
  );

  // Tap gesture for photo navigation
  const tapGesture = Gesture.Tap().onEnd((event) => {
    runOnJS(handlePhotoTap)(event.x);
  });

  // Pan gesture for swiping
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.5;
      cardRotation.value = interpolate(
        event.translationX,
        [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        [-15, 0, 15],
        Extrapolation.CLAMP
      );

      // Update like/nope opacity
      likeOpacity.value = interpolate(
        event.translationX,
        [0, SWIPE_THRESHOLD],
        [0, 1],
        Extrapolation.CLAMP
      );
      nopeOpacity.value = interpolate(
        event.translationX,
        [-SWIPE_THRESHOLD, 0],
        [1, 0],
        Extrapolation.CLAMP
      );
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        // Swipe right - Like
        translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 300 });
        cardRotation.value = withTiming(30, { duration: 300 });
        if (onSwipeRight) {
          runOnJS(onSwipeRight)();
        }
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        // Swipe left - Pass
        translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 300 });
        cardRotation.value = withTiming(-30, { duration: 300 });
        if (onSwipeLeft) {
          runOnJS(onSwipeLeft)();
        }
      } else {
        // Spring back
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
        cardRotation.value = withSpring(0, { damping: 15, stiffness: 150 });
        likeOpacity.value = withTiming(0);
        nopeOpacity.value = withTiming(0);
      }
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${cardRotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  const likeStampStyle = useAnimatedStyle(() => ({
    opacity: likeOpacity.value,
    transform: [{ rotate: '-25deg' }, { scale: likeOpacity.value * 0.3 + 0.7 }],
  }));

  const nopeStampStyle = useAnimatedStyle(() => ({
    opacity: nopeOpacity.value,
    transform: [{ rotate: '25deg' }, { scale: nopeOpacity.value * 0.3 + 0.7 }],
  }));

  const handleViewProfile = React.useCallback(() => {
    router.push(`/hirer/companion/${recommendation.companionId}` as Href);
  }, [router, recommendation.companionId]);

  const handleBookNow = React.useCallback(() => {
    if (onBookPress) {
      onBookPress(recommendation.companionId);
    }
  }, [onBookPress, recommendation.companionId]);

  const handleMessage = React.useCallback(() => {
    router.push(`/hirer/chat/${recommendation.companionId}` as Href);
  }, [router, recommendation.companionId]);

  if (!companion) {
    return (
      <RNView
        className="overflow-hidden rounded-3xl"
        style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
      >
        <RNView className="size-full rounded-3xl bg-charcoal-100" />
      </RNView>
    );
  }

  if (!isActive) return null;

  return (
    <GestureHandlerRootView className="flex-1 items-center justify-center">
      <GestureDetector gesture={composedGesture}>
        <Animated.View
          className="overflow-hidden rounded-3xl bg-charcoal-100 shadow-2xl"
          style={[
            {
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.15,
              shadowRadius: 24,
              elevation: 20,
            },
            cardAnimatedStyle,
          ]}
        >
          {/* Photo with gradient overlay */}
          <RNView className="relative flex-1">
            <Image
              source={{ uri: photos[currentPhotoIndex] }}
              className="size-full"
              contentFit="cover"
            />

            {/* Gradient overlay for text readability */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
              locations={[0.4, 0.65, 1]}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: '70%',
              }}
            />

            {/* Photo navigation hints (tap zones) */}
            <RNView className="absolute inset-0 flex-row">
              <RNView className="flex-1" />
              <RNView className="flex-1" />
            </RNView>

            {/* Photo indicator */}
            <PhotoIndicator total={photos.length} current={currentPhotoIndex} />

            {/* Top badges */}
            <RNView className="absolute left-4 top-7 flex-row gap-2">
              {companion.isActive && (
                <Badge
                  label={t('hirer.companion_card.online')}
                  variant="online"
                  size="sm"
                  icon={<OnlineDot color="#FFFFFF" width={8} height={8} />}
                />
              )}
              {companion.isVerified && (
                <Badge
                  label={t('hirer.companion_card.verified')}
                  variant="verified"
                  size="sm"
                  icon={<ShieldCheck color="#FFFFFF" width={12} height={12} />}
                />
              )}
            </RNView>

            {/* Like stamp */}
            <Animated.View
              className="absolute right-8 top-20 rounded-lg border-4 border-teal-400 px-5 py-2.5"
              style={likeStampStyle}
            >
              <Text className="font-urbanist-extrabold text-3xl tracking-[3px] text-white">
                LIKE
              </Text>
            </Animated.View>

            {/* Nope stamp */}
            <Animated.View
              className="absolute left-8 top-20 rounded-lg border-4 border-rose-400 px-5 py-2.5"
              style={nopeStampStyle}
            >
              <Text className="font-urbanist-extrabold text-3xl tracking-[3px] text-white">
                NOPE
              </Text>
            </Animated.View>

            {/* Bottom content overlay */}
            <RNView
              className="absolute inset-x-0 bottom-0 p-5"
              style={{ paddingBottom: Platform.OS === 'ios' ? 24 : 20 }}
            >
              {/* Recommendation reason */}
              <RNView className="mb-3 flex-row items-center gap-1.5 self-start rounded-full bg-white/15 px-3 py-1.5">
                <Heart
                  color={colors.rose[400]}
                  width={12}
                  height={12}
                  fill={colors.rose[400]}
                />
                <Text className="font-urbanist-medium text-xs text-white">
                  {recommendation.reason}
                </Text>
              </RNView>

              {/* Name and age */}
              <RNView className="mb-2 flex-row items-center gap-2">
                <Text className="font-urbanist-bold text-3xl tracking-tight text-white">
                  {companion.displayName}
                  {companion.age && (
                    <Text className="font-urbanist text-2xl text-white/90">
                      , {companion.age}
                    </Text>
                  )}
                </Text>
                {companion.isVerified && (
                  <ShieldCheck color={colors.teal[400]} width={24} height={24} />
                )}
              </RNView>

              {/* Rating and reviews */}
              <RNView className="mb-3 flex-row items-center gap-4">
                <RNView className="flex-row items-center gap-1">
                  <Star color="#FFD93D" width={16} height={16} filled />
                  <Text className="font-urbanist-medium text-sm text-white/90">
                    {companion.rating?.toFixed(1) || '5.0'} ({companion.reviewCount || 0})
                  </Text>
                </RNView>
                {companion.languages && companion.languages.length > 0 && (
                  <RNView className="flex-row items-center gap-1">
                    <MessageCircle color="#FFFFFF" width={14} height={14} />
                    <Text className="font-urbanist-medium text-sm text-white/90">
                      {formatLanguages(companion.languages, 2)}
                    </Text>
                  </RNView>
                )}
              </RNView>

              {/* Services tags */}
              {companion.services?.length > 0 && (
                <RNView className="mb-4 flex-row flex-wrap gap-2">
                  {companion.services.slice(0, 3).map((service) => (
                    <RNView
                      key={service.occasionId}
                      className="rounded-2xl bg-white/20 px-3 py-1.5"
                    >
                      <Text className="font-urbanist-medium text-xs text-white">
                        {getOccasionName(service.occasion, i18n.language) || service.occasionId}
                      </Text>
                    </RNView>
                  ))}
                </RNView>
              )}

              {/* Price */}
              <RNView className="mb-4">
                <Text className="mb-0.5 font-urbanist text-xs text-white/70">
                  {t('hirer.companion_card.starting_from')}
                </Text>
                <Text className="font-urbanist-bold text-2xl text-rose-300">
                  {formatVND(companion.hourlyRate)}
                  <Text className="font-urbanist-medium text-base text-white/70">
                    /hr
                  </Text>
                </Text>
              </RNView>

              {/* Action buttons */}
              <RNView className="flex-row items-center gap-3">
                <Pressable onPress={handleBookNow} className="flex-1 overflow-hidden rounded-2xl">
                  <LinearGradient
                    colors={[colors.rose[400], colors.coral[400]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      paddingVertical: 16,
                    }}
                  >
                    <Calendar color="#FFFFFF" width={20} height={20} />
                    <Text className="font-urbanist-bold text-base tracking-wide text-white">
                      {t('hirer.companion_card.book_now')}
                    </Text>
                  </LinearGradient>
                </Pressable>

                <Pressable
                  onPress={handleViewProfile}
                  className="overflow-hidden rounded-2xl"
                >
                  <RNView className="items-center justify-center rounded-2xl border border-white/10 bg-white/20 px-4 py-3.5">
                    <Text className="font-urbanist-semibold text-xs text-white">
                      {t('hirer.browse.for_you.view_profile')}
                    </Text>
                  </RNView>
                </Pressable>
              </RNView>
            </RNView>
          </RNView>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}
