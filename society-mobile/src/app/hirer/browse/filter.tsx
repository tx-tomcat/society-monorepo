/* eslint-disable max-lines-per-function */
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView } from 'react-native';

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
  Briefcase,
  Calendar,
  Coffee,
  Confetti,
  Family,
  MaiFlower,
  MapPin,
  PriceTag,
  Star,
  WeddingRings,
  X,
} from '@/components/ui/icons';

type OccasionType = {
  id: string;
  labelKey: string;
  icon: React.ComponentType<{ color: string; width: number; height: number }>;
};

const OCCASIONS: OccasionType[] = [
  { id: 'wedding', labelKey: 'occasions.wedding', icon: WeddingRings },
  { id: 'family', labelKey: 'occasions.family', icon: Family },
  { id: 'business', labelKey: 'occasions.business', icon: Briefcase },
  { id: 'tet', labelKey: 'occasions.tet', icon: MaiFlower },
  { id: 'casual', labelKey: 'occasions.casual', icon: Coffee },
  { id: 'party', labelKey: 'occasions.party', icon: Confetti },
];

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
  'Bình Thạnh',
  'Phú Nhuận',
  'Tân Bình',
  'Gò Vấp',
];

export default function FilterScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [selectedOccasions, setSelectedOccasions] = React.useState<string[]>(
    []
  );
  const [selectedPrice, setSelectedPrice] = React.useState('any');
  const [selectedRating, setSelectedRating] = React.useState('any');
  const [selectedLocations, setSelectedLocations] = React.useState<string[]>(
    []
  );
  const [verifiedOnly, setVerifiedOnly] = React.useState(false);
  const [onlineOnly, setOnlineOnly] = React.useState(false);

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleReset = React.useCallback(() => {
    setSelectedOccasions([]);
    setSelectedPrice('any');
    setSelectedRating('any');
    setSelectedLocations([]);
    setVerifiedOnly(false);
    setOnlineOnly(false);
  }, []);

  const handleApply = React.useCallback(() => {
    // TODO: Apply filters and navigate back with params
    router.back();
  }, [router]);

  const toggleOccasion = React.useCallback((id: string) => {
    setSelectedOccasions((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  }, []);

  const toggleLocation = React.useCallback((location: string) => {
    setSelectedLocations((prev) =>
      prev.includes(location)
        ? prev.filter((l) => l !== location)
        : [...prev, location]
    );
  }, []);

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (selectedOccasions.length > 0) count++;
    if (selectedPrice !== 'any') count++;
    if (selectedRating !== 'any') count++;
    if (selectedLocations.length > 0) count++;
    if (verifiedOnly) count++;
    if (onlineOnly) count++;
    return count;
  }, [
    selectedOccasions,
    selectedPrice,
    selectedRating,
    selectedLocations,
    verifiedOnly,
    onlineOnly,
  ]);

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
            <Text className="text-sm font-semibold text-rose-400">
              {t('hirer.filter.reset')}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Occasion Type */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          className="px-4 pt-6"
        >
          <View className="mb-3 flex-row items-center gap-2">
            <Calendar color={colors.rose[400]} width={20} height={20} />
            <Text className="font-urbanist-semibold text-base text-midnight">
              {t('hirer.filter.occasion')}
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {OCCASIONS.map((occasion) => {
              const isSelected = selectedOccasions.includes(occasion.id);
              return (
                <Pressable
                  key={occasion.id}
                  onPress={() => toggleOccasion(occasion.id)}
                  className={`flex-row items-center gap-2 rounded-full px-4 py-2.5 ${
                    isSelected ? 'bg-rose-400' : 'bg-white'
                  }`}
                >
                  <occasion.icon
                    color={isSelected ? '#FFFFFF' : colors.text.secondary}
                    width={18}
                    height={18}
                  />
                  <Text
                    className={`text-sm font-medium ${
                      isSelected ? 'text-white' : 'text-text-secondary'
                    }`}
                  >
                    {t(occasion.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </MotiView>

        {/* Price Range */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
          className="px-4 pt-6"
        >
          <View className="mb-3 flex-row items-center gap-2">
            <PriceTag color={colors.rose[400]} width={20} height={20} />
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
                    isSelected ? 'bg-rose-400' : 'bg-white'
                  }`}
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

        {/* Rating */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 200 }}
          className="px-4 pt-6"
        >
          <View className="mb-3 flex-row items-center gap-2">
            <Star color={colors.yellow[400]} width={20} height={20} />
            <Text className="font-urbanist-semibold text-base text-midnight">
              {t('hirer.filter.minimum_rating')}
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {RATINGS.map((rating) => {
              const isSelected = selectedRating === rating.id;
              return (
                <Pressable
                  key={rating.id}
                  onPress={() => setSelectedRating(rating.id)}
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
        </MotiView>

        {/* Location */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 300 }}
          className="px-4 pt-6"
        >
          <View className="mb-3 flex-row items-center gap-2">
            <MapPin color={colors.rose[400]} width={20} height={20} />
            <Text className="font-urbanist-semibold text-base text-midnight">
              {t('hirer.filter.location')}
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {LOCATIONS.map((location) => {
              const isSelected = selectedLocations.includes(location);
              return (
                <Pressable
                  key={location}
                  onPress={() => toggleLocation(location)}
                  className={`rounded-full px-4 py-2.5 ${
                    isSelected ? 'bg-lavender-400' : 'bg-white'
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
        </MotiView>

        {/* Toggle Options */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 400 }}
          className="px-4 pt-6"
        >
          <Pressable
            onPress={() => setVerifiedOnly(!verifiedOnly)}
            className="mb-3 flex-row items-center justify-between rounded-xl bg-white p-4"
          >
            <Text className="text-base text-midnight">
              {t('hirer.filter.verified_only')}
            </Text>
            <View
              className={`size-6 items-center justify-center rounded-full ${
                verifiedOnly ? 'bg-teal-400' : 'bg-border'
              }`}
            >
              {verifiedOnly && <X color="#FFFFFF" width={14} height={14} />}
            </View>
          </Pressable>

          <Pressable
            onPress={() => setOnlineOnly(!onlineOnly)}
            className="flex-row items-center justify-between rounded-xl bg-white p-4"
          >
            <Text className="text-base text-midnight">
              {t('hirer.filter.online_only')}
            </Text>
            <View
              className={`size-6 items-center justify-center rounded-full ${
                onlineOnly ? 'bg-teal-400' : 'bg-border'
              }`}
            >
              {onlineOnly && <X color="#FFFFFF" width={14} height={14} />}
            </View>
          </Pressable>
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

