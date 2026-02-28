/* eslint-disable max-lines-per-function */
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, TextInput } from 'react-native';

import {
  Badge,
  Button,
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import {
  ArrowLeft,
  Calendar,
  Lock,
  MapPin,
  PriceTag,
  Star,
  Users,
} from '@/components/ui/icons';
import { useMembershipBenefits } from '@/lib/hooks/use-membership';
import { useTierTheme } from '@/lib/theme';

// ============================================================
// Tier Gating
// ============================================================

const TIER_ORDER: Record<string, number> = {
  SILVER: 1,
  GOLD: 2,
  PLATINUM: 3,
};

const FILTER_REQUIRED_TIER: Record<string, string | null> = {
  price: null,
  rating: 'SILVER',
  location: 'GOLD',
  gender: 'PLATINUM',
  age: 'PLATINUM',
};

function hasFilterAccess(
  userTier: string | null,
  filterKey: string
): boolean {
  const required = FILTER_REQUIRED_TIER[filterKey];
  if (required === null) return true;
  if (userTier === null) return false;
  return (TIER_ORDER[userTier] ?? 0) >= (TIER_ORDER[required] ?? 0);
}

// ============================================================
// Filter Constants
// ============================================================

const PRICE_RANGES = [
  { id: 'any', label: 'Any', min: 0, max: 0 },
  { id: 'budget', label: '< 300K', min: 0, max: 300000 },
  { id: 'mid', label: '300K - 500K', min: 300000, max: 500000 },
  { id: 'premium', label: '500K - 800K', min: 500000, max: 800000 },
  { id: 'luxury', label: '> 800K', min: 800000, max: 0 },
];

const RATINGS = [
  { id: 'any', label: 'Any', min: 0 },
  { id: '4.5', label: '4.5+', min: 4.5 },
  { id: '4.7', label: '4.7+', min: 4.7 },
  { id: '4.9', label: '4.9+', min: 4.9 },
];

const LOCATIONS = [
  'District 1',
  'District 2',
  'District 3',
  'District 7',
  'Binh Thanh',
  'Phu Nhuan',
  'Tan Binh',
  'Go Vap',
];

const GENDERS = [
  { id: 'any', labelKey: 'hirer.filter.gender_any' },
  { id: 'MALE', labelKey: 'hirer.filter.gender_male' },
  { id: 'FEMALE', labelKey: 'hirer.filter.gender_female' },
];

// ============================================================
// Locked Overlay Component
// ============================================================

function LockedOverlay({
  tier,
  onUpgrade,
}: {
  tier: string;
  onUpgrade: () => void;
}) {
  return (
    <Pressable
      onPress={onUpgrade}
      className="absolute inset-0 z-10 items-center justify-center rounded-2xl"
    >
      <View className="flex-row items-center gap-1.5 rounded-full bg-lavender-900 px-3 py-1.5">
        <Lock color="#FFFFFF" size={14} />
        <Text className="text-xs font-semibold text-white">{tier}</Text>
      </View>
    </Pressable>
  );
}

// ============================================================
// Main Filter Screen
// ============================================================

export default function FilterScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  // Membership tier for filter gating
  const { data: benefits } = useMembershipBenefits();
  const userTier = benefits?.tier ?? null;
  const theme = useTierTheme();

  // Filter state
  const [selectedPrice, setSelectedPrice] = React.useState('any');
  const [selectedRating, setSelectedRating] = React.useState('any');
  const [selectedLocations, setSelectedLocations] = React.useState<string[]>(
    []
  );
  const [selectedGender, setSelectedGender] = React.useState('any');
  const [minAge, setMinAge] = React.useState('');
  const [maxAge, setMaxAge] = React.useState('');

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleReset = React.useCallback(() => {
    setSelectedPrice('any');
    setSelectedRating('any');
    setSelectedLocations([]);
    setSelectedGender('any');
    setMinAge('');
    setMaxAge('');
  }, []);

  const handleUpgrade = React.useCallback(
    (requiredTier: string) => {
      Alert.alert(
        t('hirer.filter.locked_title'),
        `${t('hirer.filter.locked_message')} ${requiredTier}`,
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('hirer.filter.upgrade_cta'),
            onPress: () =>
              router.push('/hirer/membership' as Href),
          },
        ]
      );
    },
    [t, router]
  );

  const handleApply = React.useCallback(() => {
    const params: Record<string, string> = {};

    // Price (always available)
    const price = PRICE_RANGES.find((r) => r.id === selectedPrice);
    if (price && price.id !== 'any') {
      if (price.min > 0) params.minPrice = String(price.min);
      if (price.max > 0) params.maxPrice = String(price.max);
    }

    // Rating (Silver+)
    if (
      selectedRating !== 'any' &&
      hasFilterAccess(userTier, 'rating')
    ) {
      const r = RATINGS.find((x) => x.id === selectedRating);
      if (r) params.rating = String(r.min);
    }

    // Location (Gold+)
    if (
      selectedLocations.length > 0 &&
      hasFilterAccess(userTier, 'location')
    ) {
      params.province = 'HCM';
    }

    // Gender (Platinum)
    if (
      selectedGender !== 'any' &&
      hasFilterAccess(userTier, 'gender')
    ) {
      params.gender = selectedGender;
    }

    // Age (Platinum)
    if (hasFilterAccess(userTier, 'age')) {
      if (minAge) params.minAge = minAge;
      if (maxAge) params.maxAge = maxAge;
    }

    const qs = new URLSearchParams(params).toString();
    router.replace(
      (qs ? `/hirer/browse?${qs}` : '/hirer/browse') as Href
    );
  }, [
    router,
    selectedPrice,
    selectedRating,
    selectedLocations,
    selectedGender,
    minAge,
    maxAge,
    userTier,
  ]);

  const toggleLocation = React.useCallback((location: string) => {
    setSelectedLocations((prev) =>
      prev.includes(location)
        ? prev.filter((l) => l !== location)
        : [...prev, location]
    );
  }, []);

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (selectedPrice !== 'any') count++;
    if (selectedRating !== 'any') count++;
    if (selectedLocations.length > 0) count++;
    if (selectedGender !== 'any') count++;
    if (minAge || maxAge) count++;
    return count;
  }, [selectedPrice, selectedRating, selectedLocations, selectedGender, minAge, maxAge]);

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-border-light px-4 py-3">
          <Pressable
            onPress={handleBack}
            className="size-10 items-center justify-center"
          >
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text className="font-urbanist-bold text-xl text-midnight">
            {t('hirer.filter.title')}
          </Text>
          <Pressable onPress={handleReset}>
            <Text className="text-sm font-semibold" style={{ color: theme.primary }}>
              {t('hirer.filter.reset')}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Price Range - Free */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          className="px-4 pt-6"
        >
          <View className="mb-3 flex-row items-center gap-2">
            <PriceTag color={theme.primary} width={20} height={20} />
            <Text className="font-urbanist-semibold text-base text-midnight">
              {t('hirer.filter.price_range')}
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {PRICE_RANGES.map((range) => {
              const isSelected = selectedPrice === range.id;
              return (
                <Pressable
                  key={range.id}
                  onPress={() => setSelectedPrice(range.id)}
                  className={`rounded-full px-4 py-2.5 ${
                    !isSelected ? 'bg-white' : ''
                  }`}
                  style={isSelected ? { backgroundColor: theme.primary } : undefined}
                >
                  <Text
                    className={`text-sm font-medium ${
                      isSelected ? 'text-white' : 'text-text-secondary'
                    }`}
                  >
                    {range.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </MotiView>

        {/* Rating - Silver+ */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
          className="relative px-4 pt-6"
        >
          <View className={!hasFilterAccess(userTier, 'rating') ? 'opacity-40' : ''}>
            <View className="mb-3 flex-row items-center gap-2">
              <Star color={colors.yellow[400]} width={20} height={20} />
              <Text className="font-urbanist-semibold text-base text-midnight">
                {t('hirer.filter.minimum_rating')}
              </Text>
              {!hasFilterAccess(userTier, 'rating') && (
                <Badge label="SILVER" variant="lavender" size="sm" />
              )}
            </View>
            <View className="flex-row flex-wrap gap-2">
              {RATINGS.map((rating) => {
                const isSelected = selectedRating === rating.id;
                return (
                  <Pressable
                    key={rating.id}
                    onPress={() => {
                      if (!hasFilterAccess(userTier, 'rating')) return;
                      setSelectedRating(rating.id);
                    }}
                    className={`flex-row items-center gap-1 rounded-full px-4 py-2.5 ${
                      isSelected ? 'bg-yellow-400' : 'bg-white'
                    }`}
                  >
                    {rating.id !== 'any' && (
                      <Star
                        color={
                          isSelected
                            ? colors.midnight.DEFAULT
                            : colors.yellow[400]
                        }
                        width={14}
                        height={14}
                      />
                    )}
                    <Text
                      className={`text-sm font-medium ${
                        isSelected ? 'text-midnight' : 'text-text-secondary'
                      }`}
                    >
                      {rating.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          {!hasFilterAccess(userTier, 'rating') && (
            <LockedOverlay
              tier="SILVER"
              onUpgrade={() => handleUpgrade('SILVER')}
            />
          )}
        </MotiView>

        {/* Location - Gold+ */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 200 }}
          className="relative px-4 pt-6"
        >
          <View className={!hasFilterAccess(userTier, 'location') ? 'opacity-40' : ''}>
            <View className="mb-3 flex-row items-center gap-2">
              <MapPin color={theme.primary} width={20} height={20} />
              <Text className="font-urbanist-semibold text-base text-midnight">
                {t('hirer.filter.location')}
              </Text>
              {!hasFilterAccess(userTier, 'location') && (
                <Badge label="GOLD" variant="lavender" size="sm" />
              )}
            </View>
            <View className="flex-row flex-wrap gap-2">
              {LOCATIONS.map((location) => {
                const isSelected = selectedLocations.includes(location);
                return (
                  <Pressable
                    key={location}
                    onPress={() => {
                      if (!hasFilterAccess(userTier, 'location')) return;
                      toggleLocation(location);
                    }}
                    className={`rounded-full px-4 py-2.5 ${
                      isSelected ? 'bg-lavender-900' : 'bg-white'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isSelected ? 'text-white' : 'text-text-secondary'
                      }`}
                    >
                      {location}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          {!hasFilterAccess(userTier, 'location') && (
            <LockedOverlay
              tier="GOLD"
              onUpgrade={() => handleUpgrade('GOLD')}
            />
          )}
        </MotiView>

        {/* Gender - Platinum */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 300 }}
          className="relative px-4 pt-6"
        >
          <View className={!hasFilterAccess(userTier, 'gender') ? 'opacity-40' : ''}>
            <View className="mb-3 flex-row items-center gap-2">
              <Users color={theme.primary} size={20} />
              <Text className="font-urbanist-semibold text-base text-midnight">
                {t('hirer.filter.gender')}
              </Text>
              {!hasFilterAccess(userTier, 'gender') && (
                <Badge label="PLATINUM" variant="lavender" size="sm" />
              )}
            </View>
            <View className="flex-row flex-wrap gap-2">
              {GENDERS.map((g) => {
                const isSelected = selectedGender === g.id;
                return (
                  <Pressable
                    key={g.id}
                    onPress={() => {
                      if (!hasFilterAccess(userTier, 'gender')) return;
                      setSelectedGender(g.id);
                    }}
                    className={`rounded-full px-4 py-2.5 ${
                      !isSelected ? 'bg-white' : ''
                    }`}
                    style={isSelected ? { backgroundColor: theme.primary } : undefined}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isSelected ? 'text-white' : 'text-text-secondary'
                      }`}
                    >
                      {t(g.labelKey)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          {!hasFilterAccess(userTier, 'gender') && (
            <LockedOverlay
              tier="PLATINUM"
              onUpgrade={() => handleUpgrade('PLATINUM')}
            />
          )}
        </MotiView>

        {/* Age Range - Platinum */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 400 }}
          className="relative px-4 pt-6"
        >
          <View className={!hasFilterAccess(userTier, 'age') ? 'opacity-40' : ''}>
            <View className="mb-3 flex-row items-center gap-2">
              <Calendar color={theme.primary} width={20} height={20} />
              <Text className="font-urbanist-semibold text-base text-midnight">
                {t('hirer.filter.age_range')}
              </Text>
              {!hasFilterAccess(userTier, 'age') && (
                <Badge label="PLATINUM" variant="lavender" size="sm" />
              )}
            </View>
            <View className="flex-row items-center gap-4">
              <View className="flex-1">
                <Text className="mb-2 text-xs text-text-secondary">
                  {t('hirer.filter.age_min')}
                </Text>
                <TextInput
                  value={minAge}
                  onChangeText={(val) => {
                    const cleaned = val.replace(/[^0-9]/g, '');
                    setMinAge(cleaned);
                  }}
                  placeholder="18"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="number-pad"
                  editable={hasFilterAccess(userTier, 'age')}
                  className="rounded-xl border border-border-light bg-white px-4 py-3 text-sm text-midnight"
                  style={{ color: colors.midnight.DEFAULT }}
                />
              </View>
              <Text className="mt-6 text-text-secondary">-</Text>
              <View className="flex-1">
                <Text className="mb-2 text-xs text-text-secondary">
                  {t('hirer.filter.age_max')}
                </Text>
                <TextInput
                  value={maxAge}
                  onChangeText={(val) => {
                    const cleaned = val.replace(/[^0-9]/g, '');
                    setMaxAge(cleaned);
                  }}
                  placeholder="100"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="number-pad"
                  editable={hasFilterAccess(userTier, 'age')}
                  className="rounded-xl border border-border-light bg-white px-4 py-3 text-sm text-midnight"
                  style={{ color: colors.midnight.DEFAULT }}
                />
              </View>
            </View>
          </View>
          {!hasFilterAccess(userTier, 'age') && (
            <LockedOverlay
              tier="PLATINUM"
              onUpgrade={() => handleUpgrade('PLATINUM')}
            />
          )}
        </MotiView>

        <View className="h-32" />
      </ScrollView>

      {/* Bottom Actions */}
      <SafeAreaView
        edges={['bottom']}
        className="border-t border-border-light bg-white"
      >
        <View className="flex-row items-center gap-3 p-4">
          {activeFilterCount > 0 && (
            <Badge
              label={`${activeFilterCount} ${t('hirer.filter.filters_active')}`}
              variant="lavender"
              size="default"
            />
          )}
          <View className="flex-1" />
          <Button
            label={t('hirer.filter.apply')}
            onPress={handleApply}
            variant="default"
            size="lg"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
