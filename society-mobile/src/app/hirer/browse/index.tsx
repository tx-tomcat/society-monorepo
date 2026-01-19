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
  StyleSheet,
  TextInput,
} from 'react-native';

import { CompanionCard, type CompanionData } from '@/components/companion-card';
import {
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { ArrowLeft, Filter, Search } from '@/components/ui/icons';
import type { ServiceType } from '@/lib/api/services/companions.service';
import {
  useCompanions,
  useFavorites,
  useToggleFavorite,
} from '@/lib/hooks';

// Occasion filter chips matching wireframe
const occasionFilters: { id: string; i18nKey: string; serviceType?: ServiceType }[] = [
  { id: 'all', i18nKey: 'hirer.home.occasions.all' },
  { id: 'dining', i18nKey: 'hirer.home.occasions.dining', serviceType: 'CASUAL_OUTING' },
  { id: 'party', i18nKey: 'hirer.home.occasions.party', serviceType: 'CLASS_REUNION' },
  { id: 'coffee', i18nKey: 'hirer.home.occasions.coffee', serviceType: 'CASUAL_OUTING' },
];

export default function BrowseCompanions() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedFilter, setSelectedFilter] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Get the service type filter
  const selectedServiceType = React.useMemo(() => {
    if (selectedFilter === 'all') return undefined;
    const filter = occasionFilters.find((f) => f.id === selectedFilter);
    return filter?.serviceType;
  }, [selectedFilter]);

  // API hooks
  const {
    data: companionsData,
    isLoading,
    refetch,
    isRefetching,
  } = useCompanions({
    serviceType: selectedServiceType,
    verified: true,
    sort: 'rating',
  });

  const { data: favoritesData } = useFavorites();
  const toggleFavorite = useToggleFavorite();

  // Create a set of favorite companion IDs for quick lookup
  const favoriteIds = React.useMemo(() => {
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
      name: c.user?.fullName || '',
      age: 0,
      image:
        c.photos?.[0]?.url ||
        c.user?.avatarUrl ||
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      rating: c.ratingAvg || 0,
      reviewCount: c.ratingCount || 0,
      location: c.languages?.join(', ') || t('hirer.home.default_location'),
      pricePerHour: c.hourlyRate || 0,
      isVerified: c.user?.isVerified ?? c.verificationStatus === 'verified',
      isOnline: c.isActive,
      isPremium: c.isFeatured,
      specialties: c.services?.map((s) => s.type) || [],
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
      router.push(`/booking/${companion.id}` as Href);
    },
    [router]
  );

  const handleFavorite = React.useCallback(
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
          <Text style={styles.headerTitle} className="flex-1 text-center text-lg text-midnight">
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
              {occasionFilters.map((filter) => (
                <Pressable
                  key={filter.id}
                  onPress={() => setSelectedFilter(filter.id)}
                  className={`rounded-full px-4 py-2 ${
                    selectedFilter === filter.id
                      ? 'bg-rose-400'
                      : 'bg-softpink'
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      selectedFilter === filter.id
                        ? 'font-semibold text-white'
                        : 'text-midnight'
                    }`}
                  >
                    {t(filter.i18nKey)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>

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
          <Text style={styles.emptyTitle} className="text-center text-lg text-midnight">
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
          estimatedItemSize={80}
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

const styles = StyleSheet.create({
  headerTitle: {
    fontFamily: 'Urbanist_600SemiBold',
  },
  emptyTitle: {
    fontFamily: 'Urbanist_700Bold',
  },
});
