/* eslint-disable max-lines-per-function */
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Badge,
  colors,
  FocusAwareStatusBar,
  Image,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import {
  ArrowRight,
  Calendar,
  Chart,
  Crown,
  Edit,
  MapPin,
  MoreVertical,
  Settings,
  ShieldCheck,
  SocietyLogo,
  Star,
  VerifiedBadge,
  Wallet,
} from '@/components/ui/icons';
import { formatVND } from '@/lib/utils';

const MOCK_PROFILE = {
  name: 'Minh Anh',
  age: 24,
  image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
  rating: 4.9,
  reviewCount: 127,
  location: 'District 1, Ho Chi Minh City',
  isVerified: true,
  isPremium: true,
  bio: 'Professional companion specializing in weddings and corporate events. Fluent in Vietnamese and English. Love making connections and creating memorable experiences.',
  stats: {
    totalBookings: 127,
    totalEarnings: 42500000,
    responseRate: 98,
    completionRate: 100,
  },
  specialties: ['Wedding', 'Corporate', 'Tet', 'Family Events'],
  photos: [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
  ],
};

export default function CompanionProfile() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleEditProfile = React.useCallback(() => {
    router.push('/companion/profile/edit' as Href);
  }, [router]);

  const handleSettings = React.useCallback(() => {
    router.push('/companion/settings' as Href);
  }, [router]);

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 px-4 py-3">
          <SocietyLogo color={colors.lavender[400]} width={32} height={32} />
          <Text style={styles.headerTitle} className="flex-1 text-xl text-midnight">
            {t('companion.profile.header')}
          </Text>
          <Pressable onPress={handleSettings} testID="settings-button">
            <Settings color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          className="items-center px-4 py-6"
        >
          <View className="relative">
            <Image
              source={{ uri: MOCK_PROFILE.image }}
              className="size-28 rounded-full"
              contentFit="cover"
            />
            {MOCK_PROFILE.isVerified && (
              <View className="absolute -bottom-1 -right-1 rounded-full bg-white p-1">
                <VerifiedBadge color={colors.teal[400]} width={28} height={28} />
              </View>
            )}
          </View>

          <View className="mt-4 flex-row items-center gap-2">
            <Text style={styles.name} className="text-2xl text-midnight">
              {MOCK_PROFILE.name}, {MOCK_PROFILE.age}
            </Text>
            {MOCK_PROFILE.isPremium && (
              <Crown color={colors.yellow[400]} width={24} height={24} />
            )}
          </View>

          <View className="mt-2 flex-row items-center gap-1">
            <MapPin color={colors.text.tertiary} width={14} height={14} />
            <Text className="text-sm text-text-secondary">{MOCK_PROFILE.location}</Text>
          </View>

          <View className="mt-3 flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <Star color={colors.yellow[400]} width={18} height={18} />
              <Text className="font-semibold text-midnight">{MOCK_PROFILE.rating}</Text>
              <Text className="text-sm text-text-tertiary">
                ({MOCK_PROFILE.reviewCount})
              </Text>
            </View>
            <Badge label={t('companion.profile.top_rated')} variant="teal" size="sm" />
          </View>

          <Pressable
            onPress={handleEditProfile}
            testID="edit-profile-button"
            className="mt-4 flex-row items-center gap-2 rounded-full bg-lavender-400/10 px-6 py-2"
          >
            <Edit color={colors.lavender[400]} width={18} height={18} />
            <Text className="font-semibold text-lavender-400">{t('companion.profile.edit_profile')}</Text>
          </Pressable>
        </MotiView>

        {/* Stats */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 100 }}
          className="mx-4 mb-4 flex-row gap-2"
        >
          <View className="flex-1 items-center rounded-xl bg-white p-4">
            <Calendar color={colors.lavender[400]} width={24} height={24} />
            <Text style={styles.statValue} className="mt-2 text-xl text-midnight">
              {MOCK_PROFILE.stats.totalBookings}
            </Text>
            <Text className="text-xs text-text-tertiary">{t('companion.profile.stats.bookings')}</Text>
          </View>
          <View className="flex-1 items-center rounded-xl bg-white p-4">
            <Wallet color={colors.teal[400]} width={24} height={24} />
            <Text style={styles.statValue} className="mt-2 text-xl text-midnight">
              {formatVND(MOCK_PROFILE.stats.totalEarnings, { abbreviated: true })}
            </Text>
            <Text className="text-xs text-text-tertiary">{t('companion.profile.stats.earned')}</Text>
          </View>
          <View className="flex-1 items-center rounded-xl bg-white p-4">
            <Chart color={colors.rose[400]} width={24} height={24} />
            <Text style={styles.statValue} className="mt-2 text-xl text-midnight">
              {MOCK_PROFILE.stats.responseRate}%
            </Text>
            <Text className="text-xs text-text-tertiary">{t('companion.profile.stats.response')}</Text>
          </View>
        </MotiView>

        {/* About */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 200 }}
          className="mx-4 mb-4 rounded-2xl bg-white p-4"
        >
          <Text className="mb-2 text-lg font-semibold text-midnight">{t('companion.profile.about_me')}</Text>
          <Text className="leading-relaxed text-text-secondary">
            {MOCK_PROFILE.bio}
          </Text>
        </MotiView>

        {/* Specialties */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 300 }}
          className="mx-4 mb-4 rounded-2xl bg-white p-4"
        >
          <Text className="mb-3 text-lg font-semibold text-midnight">{t('companion.profile.specialties')}</Text>
          <View className="flex-row flex-wrap gap-2">
            {MOCK_PROFILE.specialties.map((specialty) => (
              <Badge key={specialty} label={specialty} variant="lavender" size="default" />
            ))}
          </View>
        </MotiView>

        {/* Photos */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 400 }}
          className="mx-4 mb-4 rounded-2xl bg-white p-4"
        >
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-midnight">{t('companion.profile.photos')}</Text>
            <Pressable onPress={handleEditProfile} testID="edit-photos-button" className="flex-row items-center gap-1">
              <Text className="text-sm font-medium text-lavender-400">{t('common.edit')}</Text>
              <ArrowRight color={colors.lavender[400]} width={16} height={16} />
            </Pressable>
          </View>
          <View className="flex-row gap-2">
            {MOCK_PROFILE.photos.map((photo, index) => (
              <Image
                key={index}
                source={{ uri: photo }}
                className="h-24 flex-1 rounded-xl"
                contentFit="cover"
              />
            ))}
          </View>
        </MotiView>

        {/* Verification Status */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 500 }}
          className="mx-4 mb-4 rounded-2xl bg-teal-400/10 p-4"
        >
          <View className="flex-row items-center gap-3">
            <ShieldCheck color={colors.teal[400]} width={32} height={32} />
            <View className="flex-1">
              <Text className="font-semibold text-teal-700">{t('companion.profile.fully_verified')}</Text>
              <Text className="text-sm text-text-secondary">
                {t('companion.profile.verification_description')}
              </Text>
            </View>
            <Badge label={t('common.verified')} variant="teal" size="sm" />
          </View>
        </MotiView>

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontFamily: 'Urbanist_700Bold',
  },
  name: {
    fontFamily: 'Urbanist_700Bold',
  },
  statValue: {
    fontFamily: 'Urbanist_700Bold',
  },
});
