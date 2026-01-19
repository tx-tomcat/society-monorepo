/* eslint-disable max-lines-per-function */
import { FlashList } from '@shopify/flash-list';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, TextInput, StyleSheet } from 'react-native';

import { CompanionCard, type CompanionData } from '@/components/companion-card';
import {
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { Bell, Search } from '@/components/ui/icons';
import type {
  Companion,
  ServiceType,
} from '@/lib/api/services/companions.service';
import { useCompanions, useCurrentUser } from '@/lib/hooks';

// Map ServiceType to i18n keys
const serviceTypeI18nKeys: Record<ServiceType, string> = {
  FAMILY_INTRODUCTION: 'hirer.home.occasions.family',
  WEDDING_ATTENDANCE: 'hirer.home.occasions.wedding',
  TET_COMPANIONSHIP: 'hirer.home.occasions.tet',
  BUSINESS_EVENT: 'hirer.home.occasions.corporate',
  CASUAL_OUTING: 'hirer.home.occasions.coffee',
  CLASS_REUNION: 'hirer.home.occasions.reunion',
  OTHER: 'hirer.home.occasions.other',
};

// Occasion filter chips with emoji icons matching wireframe
const occasionIds: { id: string; i18nKey: string; serviceType?: ServiceType }[] = [
  { id: 'dining', i18nKey: 'hirer.home.occasions.dining', serviceType: 'CASUAL_OUTING' },
  { id: 'party', i18nKey: 'hirer.home.occasions.party', serviceType: 'CLASS_REUNION' },
  { id: 'coffee', i18nKey: 'hirer.home.occasions.coffee', serviceType: 'CASUAL_OUTING' },
  { id: 'event', i18nKey: 'hirer.home.occasions.event', serviceType: 'BUSINESS_EVENT' },
];

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedOccasion, setSelectedOccasion] = React.useState('dining');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Get current user for greeting
  const { data: currentUser } = useCurrentUser();
  const userName = currentUser?.user?.fullName?.split(' ')[0] || 'there';

  // Map API Companion to CompanionData for the card
  const mapCompanionToCardData = React.useCallback(
    (companion: Companion): CompanionData => {
      const primaryPhoto = companion.photos?.find((p) => p.isPrimary);
      const photoUrl =
        primaryPhoto?.url ||
        companion.photos?.[0]?.url ||
        companion.user?.avatarUrl ||
        'https://via.placeholder.com/400';

      return {
        id: companion.id,
        name: companion.user?.fullName || t('hirer.home.unknown_name'),
        age: 0,
        image: photoUrl,
        rating: companion.ratingAvg || 0,
        reviewCount: companion.ratingCount || 0,
        location: t('hirer.home.default_location'),
        pricePerHour: companion.hourlyRate || 0,
        isVerified: companion.verificationStatus === 'verified',
        isOnline: companion.isActive ?? false,
        isPremium: companion.isFeatured ?? false,
        specialties: (companion.services || [])
          .filter((s) => s.isAvailable)
          .map((s) => t(serviceTypeI18nKeys[s.type]))
          .slice(0, 3),
      };
    },
    [t]
  );

  // Get the service type filter based on selected occasion
  const selectedServiceType = React.useMemo(() => {
    const occasion = occasionIds.find((o) => o.id === selectedOccasion);
    return occasion?.serviceType;
  }, [selectedOccasion]);

  // Fetch companions from API
  const {
    data: companionsData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useCompanions({
    serviceType: selectedServiceType,
    verified: true,
    sort: 'rating',
  });

  // Map API data to card format
  const companions = React.useMemo(() => {
    if (!companionsData?.companions) return [];
    return companionsData.companions.map(mapCompanionToCardData);
  }, [companionsData, mapCompanionToCardData]);

  const handleNotificationPress = React.useCallback(() => {
    // TODO: Navigate to notifications
    console.log('Notifications pressed');
  }, []);

  const handleSeeAllPress = React.useCallback(() => {
    // Navigate to browse screen
    router.push('/hirer/browse' as Href);
  }, [router]);

  const handleCompanionPress = React.useCallback(
    (companion: CompanionData) => {
      // Navigate to companion profile
      router.push(`/companion/${companion.id}` as Href);
    },
    [router]
  );

  const handleBookPress = React.useCallback(
    (companion: CompanionData) => {
      // Navigate to booking flow
      router.push(`/booking/${companion.id}` as Href);
    },
    [router]
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

      {/* Header - Greeting style matching wireframe */}
      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center justify-between px-4 py-3">
          {/* Greeting */}
          <View>
            <Text className="text-sm text-text-secondary">
              {t('hirer.home.welcome_back')}
            </Text>
            <Text style={styles.userName} className="text-lg text-midnight">
              {userName} 👋
            </Text>
          </View>

          {/* Notification Icon */}
          <Pressable
            className="size-10 items-center justify-center rounded-full bg-softpink"
            onPress={handleNotificationPress}
          >
            <Bell color={colors.midnight.DEFAULT} width={20} height={20} />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View className="px-4 pb-3">
          <View className="flex-row items-center gap-2 rounded-xl border border-border-light bg-white px-3 py-2.5">
            <Search color={colors.text.tertiary} width={20} height={20} />
            <TextInput
              className="flex-1 text-sm"
              placeholder={t('hirer.home.search_placeholder')}
              placeholderTextColor={colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ color: colors.midnight.DEFAULT }}
            />
          </View>
        </View>

        {/* Popular Occasions */}
        <View className="px-4 pb-3">
          <Text style={styles.sectionTitle} className="mb-3 text-sm text-midnight">
            {t('hirer.home.popular_occasions')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {occasionIds.map((occasion) => (
                <Pressable
                  key={occasion.id}
                  onPress={() => setSelectedOccasion(occasion.id)}
                  className={`rounded-full px-4 py-2 ${
                    selectedOccasion === occasion.id
                      ? 'bg-rose-400'
                      : 'bg-softpink'
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      selectedOccasion === occasion.id
                        ? 'font-semibold text-white'
                        : 'text-midnight'
                    }`}
                  >
                    {t(occasion.i18nKey)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Top Companions Section Header */}
        <View className="flex-row items-center justify-between px-4 pb-3">
          <Text style={styles.sectionTitle} className="text-sm text-midnight">
            {t('hirer.home.top_companions')}
          </Text>
          <Pressable onPress={handleSeeAllPress}>
            <Text className="text-sm font-medium text-teal-400">
              {t('hirer.home.see_all')}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Loading State */}
      {isLoading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.teal[400]} />
          <Text className="mt-4 text-text-secondary">
            {t('hirer.home.loading')}
          </Text>
        </View>
      )}

      {/* Error State */}
      {isError && !isLoading && (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-lg font-semibold text-midnight">
            {t('hirer.home.error.title')}
          </Text>
          <Text className="mt-2 text-center text-text-secondary">
            {t('hirer.home.error.description')}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="mt-4 rounded-full bg-teal-400 px-6 py-3"
          >
            <Text className="font-semibold text-white">
              {t('hirer.home.error.retry')}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Empty State */}
      {!isLoading && !isError && companions.length === 0 && (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-lg font-semibold text-midnight">
            {t('hirer.home.empty.title')}
          </Text>
          <Text className="mt-2 text-center text-text-secondary">
            {t('hirer.home.empty.description')}
          </Text>
        </View>
      )}

      {/* Companion List - Compact cards */}
      {!isLoading && !isError && companions.length > 0 && (
        <FlashList
          data={companions}
          renderItem={renderCompanion}
          estimatedItemSize={80}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
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
  userName: {
    fontFamily: 'Urbanist_600SemiBold',
  },
  sectionTitle: {
    fontFamily: 'Urbanist_600SemiBold',
  },
});
