/* eslint-disable max-lines-per-function */
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, TextInput } from 'react-native';

import { type CompanionData } from '@/components/companion-card';
import {
  Badge,
  colors,
  FocusAwareStatusBar,
  Image,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { MapPin, Search, Star } from '@/components/ui/icons';
import { formatVND } from '@/lib/utils';

// Featured categories
const categories = [
  { id: 'wedding', label: 'Wedding', emoji: '💒' },
  { id: 'tet', label: 'Tết', emoji: '🎊' },
  { id: 'family', label: 'Family', emoji: '👨‍👩‍👧' },
  { id: 'corporate', label: 'Corporate', emoji: '💼' },
  { id: 'coffee', label: 'Coffee', emoji: '☕' },
  { id: 'social', label: 'Social', emoji: '🎉' },
];

// Top rated companions
const topRatedCompanions: CompanionData[] = [
  {
    id: '1',
    name: 'Minh Anh',
    age: 24,
    image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    rating: 4.9,
    reviewCount: 127,
    location: 'District 1',
    pricePerHour: 500000,
    isVerified: true,
    isOnline: true,
    specialties: ['Wedding', 'Corporate'],
  },
  {
    id: '4',
    name: 'Hoàng Yến',
    age: 25,
    image:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80',
    rating: 4.9,
    reviewCount: 156,
    location: 'District 7',
    pricePerHour: 600000,
    isVerified: true,
    isOnline: true,
    specialties: ['Wedding', 'VIP'],
  },
];

// Popular locations
const popularLocations = [
  { id: '1', name: 'District 1', count: 45 },
  { id: '2', name: 'District 3', count: 32 },
  { id: '7', name: 'District 7', count: 28 },
  { id: 'bt', name: 'Binh Thanh', count: 24 },
];

export default function Explore() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleCompanionPress = (companion: CompanionData) => {
    router.push(`/companion/${companion.id}` as Href);
  };

  const handleCategoryPress = (categoryId: string) => {
    // TODO: Navigate to filtered search
    console.log('Category pressed:', categoryId);
  };

  const handleLocationPress = (locationId: string) => {
    // TODO: Navigate to location-based search
    console.log('Location pressed:', locationId);
  };

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      {/* Header with Search */}
      <SafeAreaView edges={['top']}>
        <View className="border-b border-border-light px-4 py-3">
          <Text className="mb-3 text-2xl font-bold text-midnight">Search</Text>

          {/* Search Input */}
          <View className="flex-row items-center gap-3 rounded-xl bg-softpink px-4 py-3">
            <Search color={colors.text.tertiary} width={20} height={20} />
            <TextInput
              placeholder="Search companions, occasions..."
              placeholderTextColor={colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-base"
              style={{ fontFamily: 'Urbanist_500Medium', color: colors.midnight.DEFAULT }}
            />
          </View>
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Categories */}
        <View className="py-4">
          <Text className="mb-3 px-4 text-lg font-semibold text-midnight">
            Browse by Occasion
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          >
            {categories.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => handleCategoryPress(category.id)}
                className="items-center"
              >
                <View className="mb-2 size-16 items-center justify-center rounded-2xl bg-softpink">
                  <Text className="text-2xl">{category.emoji}</Text>
                </View>
                <Text className="text-sm font-medium text-midnight">
                  {category.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Top Rated */}
        <View className="py-4">
          <View className="mb-3 flex-row items-center justify-between px-4">
            <Text className="text-lg font-semibold text-midnight">
              Top Rated
            </Text>
            <Pressable>
              <Text className="text-sm font-medium text-rose-400">See All</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          >
            {topRatedCompanions.map((companion) => (
              <Pressable
                key={companion.id}
                onPress={() => handleCompanionPress(companion)}
                className="w-48 overflow-hidden rounded-2xl bg-white"
              >
                <Image
                  source={{ uri: companion.image }}
                  className="h-56 w-full"
                  contentFit="cover"
                />
                <View className="p-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-semibold text-midnight">
                      {companion.name}
                    </Text>
                    <View className="flex-row items-center gap-1">
                      <Star color="#FFD93D" width={12} height={12} filled />
                      <Text className="text-xs font-medium text-midnight">
                        {companion.rating}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-sm text-rose-400">
                    {formatVND(companion.pricePerHour)}/h
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Popular Locations */}
        <View className="p-4">
          <Text className="mb-3 text-lg font-semibold text-midnight">
            Popular Locations
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {popularLocations.map((location) => (
              <Pressable
                key={location.id}
                onPress={() => handleLocationPress(location.id)}
                className="flex-row items-center gap-2 rounded-xl bg-white px-4 py-3"
              >
                <MapPin color={colors.rose[400]} width={16} height={16} />
                <Text className="font-medium text-midnight">
                  {location.name}
                </Text>
                <Badge
                  label={`${location.count}`}
                  variant="secondary"
                  size="sm"
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Recent Searches */}
        <View className="p-4">
          <Text className="mb-3 text-lg font-semibold text-midnight">
            Recent Searches
          </Text>
          <View className="gap-2">
            {[
              'Wedding companion District 1',
              'Tet celebration',
              'Coffee date',
            ].map((search) => (
              <Pressable
                key={search}
                className="flex-row items-center gap-3 rounded-xl bg-white px-4 py-3"
              >
                <Search color={colors.text.tertiary} width={16} height={16} />
                <Text className="flex-1 text-midnight">{search}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Bottom spacing */}
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}
