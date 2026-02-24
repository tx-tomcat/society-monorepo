import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Platform, Pressable, View as RNView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Badge } from '@/components/ui/badge';
import { colors, Image, Text } from '@/components/ui';
import {
  Heart,
  MessageCircle,
  OnlineDot,
  ShieldCheck,
  Star,
} from '@/components/ui/icons';
import type { ScoredCompanion } from '@/lib/api/services/recommendations.service';
import { formatLanguages, formatVND, getOccasionName } from '@/lib/utils';

import { FeedActionButtons } from './feed-action-buttons';
import { PhotoProgressBar } from './photo-progress-bar';
import { usePhotoAutoAdvance } from './use-photo-auto-advance';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type FeedCardProps = {
  recommendation: ScoredCompanion;
  isActive: boolean;
  isFavorite: boolean;
  onFavoriteToggle: (companionId: string) => void;
  onBook: (companionId: string) => void;
  onPhotoBrowse: (companionId: string) => void;
  onDwellPause: (companionId: string) => void;
};

export const FeedCard = React.memo(function FeedCard({
  recommendation,
  isActive,
  isFavorite,
  onFavoriteToggle,
  onBook,
  onPhotoBrowse,
  onDwellPause,
}: FeedCardProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const companion = recommendation.companion;

  const photos = React.useMemo(() => {
    if (!companion?.photos?.length) {
      return companion?.avatar ? [companion.avatar] : [];
    }
    return companion.photos.map((p) => p.url);
  }, [companion]);

  const {
    currentIndex,
    isPaused,
    togglePause,
    goNext,
    goPrev,
    interval,
  } = usePhotoAutoAdvance({
    totalPhotos: photos.length,
    isActive,
  });

  // Track manual photo browsing
  const photoBrowseCount = React.useRef(0);
  const handleLeftTap = React.useCallback(() => {
    goPrev();
    photoBrowseCount.current++;
    if (photoBrowseCount.current >= 2) {
      onPhotoBrowse(recommendation.companionId);
    }
  }, [goPrev, onPhotoBrowse, recommendation.companionId]);

  const handleRightTap = React.useCallback(() => {
    goNext();
    photoBrowseCount.current++;
    if (photoBrowseCount.current >= 2) {
      onPhotoBrowse(recommendation.companionId);
    }
  }, [goNext, onPhotoBrowse, recommendation.companionId]);

  const handleCenterTap = React.useCallback(() => {
    togglePause();
    if (!isPaused) {
      onDwellPause(recommendation.companionId);
    }
  }, [togglePause, isPaused, onDwellPause, recommendation.companionId]);

  const handleViewProfile = React.useCallback(() => {
    router.push(`/hirer/companion/${recommendation.companionId}` as Href);
  }, [router, recommendation.companionId]);

  const handleMessage = React.useCallback(() => {
    router.push(`/hirer/chat/${recommendation.companionId}` as Href);
  }, [router, recommendation.companionId]);

  const handleBook = React.useCallback(() => {
    onBook(recommendation.companionId);
  }, [onBook, recommendation.companionId]);

  const handleFavorite = React.useCallback(() => {
    onFavoriteToggle(recommendation.companionId);
  }, [onFavoriteToggle, recommendation.companionId]);

  // Reset photo browse count when card becomes active
  React.useEffect(() => {
    if (isActive) {
      photoBrowseCount.current = 0;
    }
  }, [isActive]);

  if (!companion) return <RNView style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }} />;

  return (
    <RNView style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }} className="bg-black">
      {/* Photo */}
      <Animated.View
        entering={FadeIn.duration(300)}
        className="absolute inset-0"
      >
        <Image
          source={{ uri: photos[currentIndex] }}
          className="size-full"
          contentFit="cover"
        />
      </Animated.View>

      {/* Photo progress bar */}
      <PhotoProgressBar
        total={photos.length}
        current={currentIndex}
        isPaused={isPaused}
        duration={interval}
      />

      {/* Gradient overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
        locations={[0, 0.15, 0.5, 1]}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '100%',
        }}
        pointerEvents="none"
      />

      {/* Photo tap zones: left (1/3), center (1/3), right (1/3) */}
      <RNView className="absolute inset-0 flex-row" style={{ zIndex: 5 }}>
        <Pressable className="flex-1" onPress={handleLeftTap} />
        <Pressable className="flex-1" onPress={handleCenterTap} />
        <Pressable className="flex-1" onPress={handleRightTap} />
      </RNView>

      {/* Top badges */}
      <RNView className="absolute left-4 top-14 flex-row gap-2" style={{ zIndex: 10 }}>
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

      {/* Right-side action buttons */}
      <FeedActionButtons
        companionId={recommendation.companionId}
        isFavorite={isFavorite}
        onFavoriteToggle={handleFavorite}
        onMessage={handleMessage}
        onBook={handleBook}
      />

      {/* Bottom info overlay — same layout as CompanionCard */}
      <Pressable
        onPress={handleViewProfile}
        className="absolute inset-x-0 bottom-0 p-5"
        style={{
          paddingBottom: Platform.OS === 'ios' ? 100 : 80,
          zIndex: 15,
        }}
      >
        {/* Recommendation reason */}
        <RNView className="mb-3 flex-row items-center gap-1.5 self-start rounded-full bg-white/15 px-3 py-1.5">
          <Heart
            color={colors.rose[400]}
            width={12}
            height={12}
            filled
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

        {/* Rating and languages */}
        <RNView className="mb-3 flex-row items-center gap-4">
          <RNView className="flex-row items-center gap-1">
            <Star color="#FFD93D" width={16} height={16} filled />
            <Text className="font-urbanist-medium text-sm text-white/90">
              {companion.rating?.toFixed(1) || '5.0'} ({companion.reviewCount || 0})
            </Text>
          </RNView>
          {companion.languages?.length > 0 && (
            <RNView className="flex-row items-center gap-1">
              <MessageCircle color="#FFFFFF" width={14} height={14} />
              <Text className="font-urbanist-medium text-sm text-white/90">
                {formatLanguages(companion.languages, 2)}
              </Text>
            </RNView>
          )}
        </RNView>

        {/* Services */}
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
        <RNView>
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
      </Pressable>
    </RNView>
  );
});
