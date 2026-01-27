/* eslint-disable max-lines-per-function */
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';

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
  Heart,
  MapPin,
  ShieldCheck,
  Star,
  Trash2,
} from '@/components/ui/icons';
import { getPhotoUrl } from '@/lib/api/services/companions.service';
import { useFavorites, useRemoveFavorite } from '@/lib/hooks';

type FavoriteItem = {
  id: string;
  companionId: string;
  companion: {
    id: string;
    name: string;
    profileImage?: string;
    hourlyRate: number;
    avgRating: number;
    totalReviews: number;
    location?: string;
    isVerified: boolean;
  };
};

function FavoriteCard({
  favorite,
  onPress,
  onRemove,
}: {
  favorite: FavoriteItem;
  onPress: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      className="m-2 flex-row rounded-2xl bg-white p-3"
    >
      <Image
        source={{
          uri:
            favorite.companion.profileImage ||
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
        }}
        className="size-24 rounded-xl"
        contentFit="cover"
      />
      <View className="ml-3 flex-1 justify-between py-1">
        <View>
          <View className="flex-row items-center gap-1">
            <Text className="text-base font-bold text-midnight">
              {favorite.companion.name}
            </Text>
            {favorite.companion.isVerified && (
              <ShieldCheck color={colors.teal[400]} width={14} height={14} />
            )}
          </View>
          <View className="mt-1 flex-row items-center gap-1">
            <Star color={colors.yellow[400]} width={14} height={14} />
            <Text className="text-sm font-medium text-midnight">
              {favorite.companion.avgRating.toFixed(1)}
            </Text>
            <Text className="text-xs text-text-tertiary">
              ({favorite.companion.totalReviews} {t('common.reviews')})
            </Text>
          </View>
          {favorite.companion.location && (
            <View className="mt-1 flex-row items-center gap-1">
              <MapPin color={colors.text.tertiary} width={12} height={12} />
              <Text className="text-xs text-text-tertiary" numberOfLines={1}>
                {favorite.companion.location}
              </Text>
            </View>
          )}
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-bold text-rose-400">
            {favorite.companion.hourlyRate.toLocaleString('vi-VN')}đ
            <Text className="font-normal text-text-tertiary">/hr</Text>
          </Text>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="rounded-lg bg-red-50 p-2"
          >
            <Trash2 color={colors.rose[400]} width={18} height={18} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 500 }}
      className="flex-1 items-center justify-center p-8"
    >
      <View className="mb-4 size-20 items-center justify-center rounded-full bg-softpink">
        <Heart color={colors.rose[400]} width={40} height={40} />
      </View>
      <Text className="mb-2 text-center font-urbanist-bold text-lg text-midnight">
        {t('hirer.favorites.empty_title')}
      </Text>
      <Text className="mb-6 text-center text-sm text-text-secondary">
        {t('hirer.favorites.empty_subtitle')}
      </Text>
      <Pressable
        onPress={() => router.push('/hirer/browse' as Href)}
        className="rounded-xl bg-rose-400 px-6 py-3"
      >
        <Text className="font-semibold text-white">
          {t('hirer.favorites.browse_companions')}
        </Text>
      </Pressable>
    </MotiView>
  );
}

export default function Favorites() {
  const router = useRouter();
  const { t } = useTranslation();

  // API hooks
  const {
    data: favoritesData,
    isLoading,
    refetch,
    isRefetching,
  } = useFavorites();
  const removeFavorite = useRemoveFavorite();

  // Transform favorites - map from Companion type to FavoriteItem format
  const favorites = React.useMemo(() => {
    if (!favoritesData?.favorites) return [];
    return favoritesData.favorites.map((f) => ({
      id: f.id,
      companionId: f.companionId,
      companion: {
        id: f.companion?.id || f.companionId,
        name: f.companion?.displayName || '',
        profileImage:
          f.companion?.avatar || getPhotoUrl(f.companion?.photos?.[0]),
        hourlyRate: f.companion?.hourlyRate || 0,
        avgRating: f.companion?.rating ?? 0,
        totalReviews: f.companion?.reviewCount ?? 0,
        location: f.companion?.languages?.join(', '),
        isVerified: f.companion?.isVerified ?? false,
      },
    }));
  }, [favoritesData]);

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleCompanionPress = React.useCallback(
    (companionId: string) => {
      router.push(`/hirer/companion/${companionId}` as Href);
    },
    [router]
  );

  const handleRemoveFavorite = React.useCallback(
    (companionId: string) => {
      removeFavorite.mutate(companionId);
    },
    [removeFavorite]
  );

  const renderItem = React.useCallback(
    ({ item, index }: { item: FavoriteItem; index: number }) => (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300, delay: index * 50 }}
      >
        <FavoriteCard
          favorite={item}
          onPress={() => handleCompanionPress(item.companionId)}
          onRemove={() => handleRemoveFavorite(item.companionId)}
        />
      </MotiView>
    ),
    [handleCompanionPress, handleRemoveFavorite]
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite">
        <ActivityIndicator size="large" color={colors.rose[400]} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable onPress={handleBack}>
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text className="flex-1 font-urbanist-bold text-xl text-midnight">
            {t('hirer.favorites.header')}
          </Text>
          {favorites.length > 0 && (
            <Text className="text-sm text-text-secondary">
              {favorites.length} {t('hirer.favorites.saved')}
            </Text>
          )}
        </View>
      </SafeAreaView>

      {favorites.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 8, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.rose[400]}
            />
          }
        />
      )}
    </View>
  );
}

