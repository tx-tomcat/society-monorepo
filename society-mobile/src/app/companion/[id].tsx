/* eslint-disable max-lines-per-function */
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView } from 'react-native';

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
  Calendar,
  MapPin,
  Share,
  ShieldCheck,
  Star,
} from '@/components/ui/icons';
import { formatVND } from '@/lib/utils';

// Mock companion data - in real app, fetch from API
const mockCompanionDetails = {
  id: '1',
  name: 'Minh Anh',
  age: 24,
  bio: 'Hi! I am Minh Anh, a professional companion with 3 years of experience. I specialize in formal events, weddings, and corporate gatherings. I am fluent in Vietnamese and English, and I pride myself on making every occasion special.',
  images: [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80',
  ],
  rating: 4.9,
  reviewCount: 127,
  completedBookings: 245,
  location: 'District 1, Ho Chi Minh City',
  pricePerHour: 500000,
  isVerified: true,
  isOnline: true,
  isPremium: true,
  languages: ['Vietnamese', 'English'],
  specialties: [
    'Wedding',
    'Corporate Events',
    'Family Gatherings',
    'Tet Celebrations',
  ],
  availability: 'Available today',
  responseTime: 'Usually responds within 1 hour',
  reviews: [
    {
      id: '1',
      author: 'Nguyen Van A',
      rating: 5,
      date: '2024-01-15',
      comment:
        'Minh Anh was wonderful at my sister wedding. Very professional and friendly!',
    },
    {
      id: '2',
      author: 'Tran Thi B',
      rating: 5,
      date: '2024-01-10',
      comment: 'Great companion for our corporate dinner. Highly recommended!',
    },
  ],
};

export default function CompanionProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  const companion = mockCompanionDetails; // In real app: fetch by id

  const handleBookPress = () => {
    router.push(`/booking/${id}` as Href);
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleSharePress = () => {
    // TODO: Implement share functionality
    console.log('Share pressed');
  };

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      {/* Image Gallery */}
      <View className="relative h-[400px]">
        <Image
          source={{ uri: companion.images[currentImageIndex] }}
          className="size-full"
          contentFit="cover"
        />

        {/* Header Overlay */}
        <SafeAreaView edges={['top']} className="absolute inset-x-0 top-0">
          <View className="flex-row items-center justify-between px-4 py-2">
            <Pressable
              onPress={handleBackPress}
              className="size-10 items-center justify-center rounded-full bg-black/30"
            >
              <ArrowLeft color="#FFFFFF" width={24} height={24} />
            </Pressable>
            <Pressable
              onPress={handleSharePress}
              className="size-10 items-center justify-center rounded-full bg-black/30"
            >
              <Share color="#FFFFFF" width={24} height={24} />
            </Pressable>
          </View>
        </SafeAreaView>

        {/* Image Indicators */}
        <View className="absolute inset-x-0 bottom-4 flex-row justify-center gap-2">
          {companion.images.map((_, index) => (
            <Pressable
              key={index}
              onPress={() => setCurrentImageIndex(index)}
              className={`h-2 rounded-full ${index === currentImageIndex ? 'w-6 bg-white' : 'w-2 bg-white/50'
                }`}
            />
          ))}
        </View>

        {/* Verified Badge */}
        {companion.isVerified && (
          <View className="absolute bottom-4 right-4">
            <Badge
              label="Verified"
              variant="verified"
              icon={<ShieldCheck color="#FFFFFF" width={14} height={14} />}
            />
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="gap-4 p-4">
          {/* Name and Rating */}
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-midnight">
                {companion.name}, {companion.age}
              </Text>
              <View className="mt-1 flex-row items-center gap-1">
                <MapPin color={colors.text.tertiary} width={16} height={16} />
                <Text className="text-sm text-text-tertiary">
                  {companion.location}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <View className="flex-row items-center gap-1">
                <Star color="#FFD93D" width={18} height={18} filled />
                <Text className="text-lg font-bold text-midnight">
                  {companion.rating.toFixed(1)}
                </Text>
              </View>
              <Text className="text-sm text-text-tertiary">
                {companion.reviewCount} reviews
              </Text>
            </View>
          </View>

          {/* Stats */}
          <View className="flex-row gap-4 rounded-xl bg-softpink p-4">
            <View className="flex-1 items-center">
              <Text className="text-xl font-bold text-rose-400">
                {companion.completedBookings}
              </Text>
              <Text className="text-xs text-text-tertiary">Bookings</Text>
            </View>
            <View className="w-px bg-border-light" />
            <View className="flex-1 items-center">
              <Text className="text-xl font-bold text-rose-400">
                {companion.rating.toFixed(1)}
              </Text>
              <Text className="text-xs text-text-tertiary">Rating</Text>
            </View>
            <View className="w-px bg-border-light" />
            <View className="flex-1 items-center">
              <Text className="text-xl font-bold text-rose-400">3+</Text>
              <Text className="text-xs text-text-tertiary">Years Exp</Text>
            </View>
          </View>

          {/* Specialties */}
          <View>
            <Text className="mb-2 text-lg font-semibold text-midnight">
              Specialties
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {companion.specialties.map((specialty) => (
                <Badge key={specialty} label={specialty} variant="secondary" />
              ))}
            </View>
          </View>

          {/* About */}
          <View>
            <Text className="mb-2 text-lg font-semibold text-midnight">
              About
            </Text>
            <Text className="leading-6 text-text-secondary">
              {companion.bio}
            </Text>
          </View>

          {/* Languages */}
          <View>
            <Text className="mb-2 text-lg font-semibold text-midnight">
              Languages
            </Text>
            <View className="flex-row gap-2">
              {companion.languages.map((language) => (
                <Badge key={language} label={language} variant="outline" />
              ))}
            </View>
          </View>

          {/* Availability */}
          <View className="flex-row items-center gap-2 rounded-xl bg-teal-400/10 p-4">
            <Calendar color={colors.teal[400]} width={20} height={20} />
            <View>
              <Text className="font-semibold text-teal-400">
                {companion.availability}
              </Text>
              <Text className="text-sm text-text-tertiary">
                {companion.responseTime}
              </Text>
            </View>
          </View>

          {/* Reviews Preview */}
          <View>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-midnight">
                Reviews
              </Text>
              <Pressable>
                <Text className="text-sm font-medium text-rose-400">
                  See All
                </Text>
              </Pressable>
            </View>
            {companion.reviews.slice(0, 2).map((review) => (
              <View key={review.id} className="mb-3 rounded-xl bg-softpink p-4">
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="font-semibold text-midnight">
                    {review.author}
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <Star color="#FFD93D" width={14} height={14} filled />
                    <Text className="text-sm text-midnight">
                      {review.rating}
                    </Text>
                  </View>
                </View>
                <Text className="text-sm text-text-secondary">
                  {review.comment}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Spacing for Fixed Button */}
        <View className="h-24" />
      </ScrollView>

      {/* Fixed Bottom Bar */}
      <SafeAreaView
        edges={['bottom']}
        className="absolute inset-x-0 bottom-0 border-t border-border-light bg-warmwhite"
      >
        <View className="flex-row items-center gap-4 px-4 py-3">
          <View className="flex-1">
            <Text className="text-sm text-text-tertiary">Starting from</Text>
            <Text className="text-xl font-bold text-rose-400">
              {formatVND(companion.pricePerHour)}/hour
            </Text>
          </View>
          <Button
            label="Book Now"
            onPress={handleBookPress}
            className="flex-1"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
