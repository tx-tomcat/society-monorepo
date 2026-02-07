/* eslint-disable max-lines-per-function */
import { FlashList } from '@shopify/flash-list';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
} from 'react-native';

import { CompanionCard, type CompanionData } from '@/components/companion-card';
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
  CheckCircle,
  Filter,
  Heart,
  Search,
} from '@/components/ui/icons';
import { getPhotoUrl } from '@/lib/api/services/companions.service';
import {
  useCompanions,
  useFavorites,
  useMembershipBenefits,
  useRecommendationsTeaser,
  useToggleFavorite,
  useTrackInteraction,
} from '@/lib/hooks';
import { useCompanion } from '@/lib/hooks/use-companions';
import { useOccasionsStore } from '@/lib/stores';
import { formatVND } from '@/lib/utils';

export default function BrowseCompanions() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedOccasionId, setSelectedOccasionId] = React.useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Get occasions from store
  const occasions = useOccasionsStore.use.occasions();

  // API hooks
  const {
    data: companionsData,
    isLoading,
    refetch,
    isRefetching,
  } = useCompanions({
    occasionId: selectedOccasionId,
    verified: true,
    sort: 'rating',
  });

  const { data: favoritesData } = useFavorites();
  const toggleFavorite = useToggleFavorite();

  // Create a set of favorite companion IDs for quick lookup
  const _favoriteIds = React.useMemo(() => {
    if (!favoritesData?.favorites) return new Set<string>();
    return new Set(
      favoritesData.favorites.map((f: { companionId: string }) => f.companionId)
    );
  }, [favoritesData]);

  // Transform API companions to CompanionData type
  const companions = React.useMemo((): CompanionData[] => {
    if (!companionsData?.companions) return [];
    return companionsData.companions.map((c) => ({
      id: c.id,
      userId: c.userId, // User.id for favorites operations
      name: c.displayName || '',
      age: c.age || 0,
      image:
        getPhotoUrl(c.photos?.[0]) ||
        c.avatar ||
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      rating: c.rating || 0,
      reviewCount: c.reviewCount || 0,
      location: c.languages?.join(', ') || t('hirer.home.default_location'),
      pricePerHour: c.hourlyRate || 0,
      isVerified: c.isVerified ?? c.verificationStatus === 'VERIFIED',
      isOnline: c.isActive ?? false,
      isPremium: c.isFeatured,
      specialties: c.services?.map((s) => s.occasion?.name || s.occasionId) || [],
    }));
  }, [companionsData, t]);

  // Filter by search query
  const filteredCompanions = React.useMemo(() => {
    if (!searchQuery.trim()) return companions;
    const query = searchQuery.toLowerCase();
    return companions.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.specialties.some((s) => s.toLowerCase().includes(query))
    );
  }, [companions, searchQuery]);

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleFilter = React.useCallback(() => {
    router.push('/hirer/browse/filter' as Href);
  }, [router]);

  const handleCompanionPress = React.useCallback(
    (companion: CompanionData) => {
      router.push(`/hirer/companion/${companion.id}` as Href);
    },
    [router]
  );

  const handleBookPress = React.useCallback(
    (companion: CompanionData) => {
      router.push(`/hirer/booking/new?companionId=${companion.id}` as Href);
    },
    [router]
  );

  const _handleFavorite = React.useCallback(
    (companionId: string) => {
      toggleFavorite.mutate(companionId);
    },
    [toggleFavorite]
  );

  const renderCompanion = React.useCallback(
    ({ item }: { item: CompanionData }) => (
      <View className="px-4 pb-3">
        <CompanionCard
          companion={item}
          variant="compact"
          onPress={() => handleCompanionPress(item)}
          onBookPress={() => handleBookPress(item)}
          testID={`companion-card-${item.id}`}
        />
      </View>
    ),
    [handleCompanionPress, handleBookPress]
  );

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable onPress={handleBack}>
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text className="flex-1 text-center font-urbanist-semibold text-lg text-midnight">
            {t('hirer.browse.header')}
          </Text>
          <Pressable onPress={handleFilter}>
            <Filter color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View className="border-b border-border-light bg-white px-4 py-3">
          <View className="flex-row items-center gap-2 rounded-xl border border-border-light bg-white px-3 py-2.5">
            <Search color={colors.text.tertiary} width={20} height={20} />
            <TextInput
              className="flex-1 text-sm"
              placeholder={t('hirer.browse.search_placeholder')}
              placeholderTextColor={colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ color: colors.midnight.DEFAULT }}
            />
          </View>

          {/* Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-3"
          >
            <View className="flex-row gap-2">
              {/* All filter */}
              <Pressable
                onPress={() => setSelectedOccasionId(undefined)}
                className={`rounded-full px-4 py-2 ${
                  !selectedOccasionId ? 'bg-rose-400' : 'bg-softpink'
                }`}
              >
                <Text
                  className={`text-xs ${
                    !selectedOccasionId
                      ? 'font-semibold text-white'
                      : 'text-midnight'
                  }`}
                >
                  {t('hirer.home.occasions.all')}
                </Text>
              </Pressable>
              {/* Dynamic occasion filters */}
              {occasions.map((occasion) => (
                <Pressable
                  key={occasion.id}
                  onPress={() => setSelectedOccasionId(occasion.id)}
                  className={`rounded-full px-4 py-2 ${
                    selectedOccasionId === occasion.id ? 'bg-rose-400' : 'bg-softpink'
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      selectedOccasionId === occasion.id
                        ? 'font-semibold text-white'
                        : 'text-midnight'
                    }`}
                  >
                    {occasion.emoji} {occasion.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* For You Teaser Section */}
      {!isLoading && (
        <ForYouTeaser
          onCompanionPress={handleCompanionPress}
          onSeeAll={() => router.push('/hirer/browse/for-you' as Href)}
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.teal[400]} />
        </View>
      )}

      {/* Empty State */}
      {!isLoading && filteredCompanions.length === 0 && (
        <View className="flex-1 items-center justify-center px-8">
          <View className="mb-4 size-20 items-center justify-center rounded-full bg-softpink">
            <Search color={colors.rose[400]} width={32} height={32} />
          </View>
          <Text className="text-center font-urbanist-bold text-lg text-midnight">
            {t('hirer.browse.no_results')}
          </Text>
          <Text className="mt-2 text-center text-text-secondary">
            {t('hirer.browse.no_results_subtitle')}
          </Text>
        </View>
      )}

      {/* Companion List */}
      {!isLoading && filteredCompanions.length > 0 && (
        <FlashList
          data={filteredCompanions}
          renderItem={renderCompanion}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.teal[400]}
            />
          }
        />
      )}
    </View>
  );
}

// Individual teaser item that fetches its own companion data
function TeaserItem({
  companionId,
  onPress,
}: {
  companionId: string;
  onPress: (companion: CompanionData) => void;
}) {
  const { data: companionData, isLoading } = useCompanion(companionId);

  if (isLoading || !companionData) {
    return (
      <View className="w-32">
        <View className="aspect-[3/4] items-center justify-center overflow-hidden rounded-xl bg-softpink">
          <ActivityIndicator size="small" color={colors.teal[400]} />
        </View>
      </View>
    );
  }

  // Get first photo URL (photos can be objects or strings)
  const firstPhoto = companionData.photos?.[0];
  const photoUrl = typeof firstPhoto === 'string' ? firstPhoto : firstPhoto?.url;

  const companion: CompanionData = {
    id: companionData.id,
    userId: companionData.userId, // User.id for favorites operations
    name: companionData.displayName || '',
    age: companionData.age || 0,
    image:
      photoUrl ||
      companionData.avatar ||
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    rating: companionData.rating || 0,
    reviewCount: companionData.reviewCount || 0,
    location: companionData.languages?.join(', ') || '',
    pricePerHour: companionData.hourlyRate || 0,
    isVerified: companionData.isVerified,
    isOnline: companionData.isActive ?? false,
    isPremium: companionData.isFeatured,
    specialties: [],
  };

  return (
    <Pressable onPress={() => onPress(companion)} className="w-32">
      <View className="aspect-[3/4] overflow-hidden rounded-xl">
        <Image
          source={{ uri: companion.image }}
          className="size-full"
          contentFit="cover"
        />
        {companion.isVerified && (
          <View className="absolute right-1 top-1 rounded-full bg-teal-500 p-0.5">
            <CheckCircle color="white" width={12} height={12} />
          </View>
        )}
      </View>
      <Text
        className="mt-1 font-urbanist-medium text-sm text-midnight"
        numberOfLines={1}
      >
        {companion.name}
      </Text>
      <Text className="text-xs text-text-secondary">
        {formatVND(companion.pricePerHour)}/h
      </Text>
    </Pressable>
  );
}

// For You teaser section component
function ForYouTeaser({
  onCompanionPress,
  onSeeAll,
}: {
  onCompanionPress: (companion: CompanionData) => void;
  onSeeAll: () => void;
}) {
  const { t } = useTranslation();
  const { data: benefits } = useMembershipBenefits();
  const teaserLimit = benefits?.forYouLimit ?? 1;
  const { data, isLoading } = useRecommendationsTeaser(teaserLimit);
  const trackInteraction = useTrackInteraction();

  const handlePress = React.useCallback(
    (companion: CompanionData) => {
      trackInteraction.mutate({
        companionId: companion.id,
        eventType: 'PROFILE_OPEN',
      });
      onCompanionPress(companion);
    },
    [trackInteraction, onCompanionPress]
  );

  // Don't render if loading or no recommendations
  if (isLoading || !data?.companions?.length) return null;

  return (
    <View className="border-b border-border-light bg-white py-4">
      <View className="flex-row items-center justify-between px-4">
        <View className="flex-row items-center gap-1.5">
          <Heart
            color={colors.rose[400]}
            width={16}
            height={16}
            fill={colors.rose[400]}
          />
          <Text className="font-urbanist-semibold text-base text-midnight">
            {t('hirer.browse.for_you_section')}
          </Text>
        </View>
        <Pressable onPress={onSeeAll}>
          <Text className="text-sm font-medium text-teal-500">
            {t('hirer.browse.see_all')}
          </Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-3"
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      >
        {data.companions.map((rec) => (
          <TeaserItem
            key={rec.companionId}
            companionId={rec.companionId}
            onPress={handlePress}
          />
        ))}
      </ScrollView>
    </View>
  );
}

