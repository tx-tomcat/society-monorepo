/* eslint-disable max-lines-per-function */
import { FlashList } from '@shopify/flash-list';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';

import { CompanionCard, type CompanionData } from '@/components/companion-card';
import {
  Badge,
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { Bell, Filter, SocietyLogo } from '@/components/ui/icons';

// Mock data for companions
const mockCompanions: CompanionData[] = [
  {
    id: '1',
    name: 'Minh Anh',
    age: 24,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',
    rating: 4.9,
    reviewCount: 127,
    location: 'District 1, HCMC',
    pricePerHour: 500000,
    isVerified: true,
    isOnline: true,
    isPremium: true,
    specialties: ['Wedding', 'Corporate', 'Family'],
  },
  {
    id: '2',
    name: 'Thu Hương',
    age: 26,
    image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80',
    rating: 4.8,
    reviewCount: 98,
    location: 'District 3, HCMC',
    pricePerHour: 450000,
    isVerified: true,
    isOnline: false,
    specialties: ['Tet Celebration', 'Family'],
  },
  {
    id: '3',
    name: 'Ngọc Trâm',
    age: 23,
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80',
    rating: 4.7,
    reviewCount: 64,
    location: 'Binh Thanh, HCMC',
    pricePerHour: 400000,
    isVerified: true,
    isOnline: true,
    specialties: ['Coffee Date', 'Social Events'],
  },
  {
    id: '4',
    name: 'Hoàng Yến',
    age: 25,
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80',
    rating: 4.9,
    reviewCount: 156,
    location: 'District 7, HCMC',
    pricePerHour: 600000,
    isVerified: true,
    isOnline: true,
    isPremium: true,
    specialties: ['Wedding', 'Corporate', 'VIP Events'],
  },
];

// Occasion filter chips
const occasions = [
  { id: 'all', label: 'All', icon: null },
  { id: 'wedding', label: 'Wedding' },
  { id: 'tet', label: 'Tết' },
  { id: 'family', label: 'Family' },
  { id: 'corporate', label: 'Corporate' },
  { id: 'coffee', label: 'Coffee' },
];

export default function Home() {
  const router = useRouter();
  const [selectedOccasion, setSelectedOccasion] = React.useState('all');

  const handleNotificationPress = React.useCallback(() => {
    // TODO: Navigate to notifications
    console.log('Notifications pressed');
  }, []);

  const handleFilterPress = React.useCallback(() => {
    // TODO: Show filter modal
    console.log('Filter button pressed');
  }, []);

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
      <View className="px-4 pb-4">
        <CompanionCard
          companion={item}
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
        <View className="flex-row items-center gap-4 px-4 py-3">
          {/* Logo */}
          <View className="w-8">
            <SocietyLogo color={colors.rose[400]} width={32} height={32} />
          </View>

          {/* Title */}
          <Text className="flex-1 text-center text-2xl font-bold leading-[1.4] text-midnight">
            Discover
          </Text>

          {/* Notification Icon */}
          <Pressable className="w-8 items-end" onPress={handleNotificationPress}>
            <Bell color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
        </View>

        {/* Occasion Filter Chips */}
        <View className="border-b border-border-light px-4 pb-3">
          <View className="flex-row gap-2">
            {occasions.map((occasion) => (
              <Pressable
                key={occasion.id}
                onPress={() => setSelectedOccasion(occasion.id)}
              >
                <Badge
                  label={occasion.label}
                  variant={selectedOccasion === occasion.id ? 'default' : 'outline'}
                  size="default"
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Search/Filter Row */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text className="text-lg font-semibold text-midnight">
            Available Now
          </Text>
          <Pressable
            className="flex-row items-center gap-1"
            onPress={handleFilterPress}
          >
            <Filter color={colors.text.tertiary} width={20} height={20} />
            <Text className="text-sm text-text-tertiary">Filters</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Companion List */}
      <FlashList
        data={mockCompanions}
        renderItem={renderCompanion}
        estimatedItemSize={450}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}
