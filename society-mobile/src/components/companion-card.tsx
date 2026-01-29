/* eslint-disable max-lines-per-function */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View as RNView } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { tv } from 'tailwind-variants';

import { colors, Image, Text, View } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { MapPin, OnlineDot, ShieldCheck, Star, VerifiedBadge } from '@/components/ui/icons';
import { formatVND } from '@/lib/utils';

const companionCard = tv({
  slots: {
    container: 'overflow-hidden rounded-2xl bg-softpink',
    imageContainer: 'relative aspect-[3/4]',
    image: 'size-full',
    gradientContainer: 'absolute inset-x-0 bottom-0 h-[120px]',
    verifiedBadge: 'absolute right-3 top-3',
    onlineIndicator: 'absolute left-3 top-3',
    content: 'gap-2 p-4',
    header: 'flex-row items-center justify-between',
    nameContainer: 'flex-1',
    name: 'text-lg font-bold leading-[1.4] text-midnight',
    age: 'text-sm font-medium text-text-secondary',
    ratingContainer: 'flex-row items-center gap-1',
    rating: 'text-sm font-semibold text-midnight',
    locationContainer: 'flex-row items-center gap-1',
    location: 'text-sm text-text-tertiary',
    priceContainer: 'mt-1 flex-row items-center justify-between',
    price: 'text-lg font-bold text-rose-400',
    priceUnit: 'text-sm text-text-tertiary',
    tagsContainer: 'mt-2 flex-row flex-wrap gap-1.5',
    bookButton: 'mt-3',
  },
});

export type CompanionData = {
  id: string;
  userId: string; // User.id for favorites operations
  name: string;
  age: number;
  image: string;
  rating: number;
  reviewCount: number;
  location: string;
  pricePerHour: number;
  isVerified: boolean;
  isOnline: boolean;
  isPremium?: boolean;
  specialties: string[];
};

type Props = {
  companion: CompanionData;
  onPress?: () => void;
  onBookPress?: () => void;
  variant?: 'default' | 'compact';
  testID?: string;
};

export function CompanionCard({
  companion,
  onPress,
  onBookPress,
  variant = 'default',
  testID,
}: Props) {
  const { t } = useTranslation();
  const styles = React.useMemo(() => companionCard(), []);

  // Compact variant - row-based layout matching wireframe
  if (variant === 'compact') {
    return (
      <Pressable onPress={onPress} testID={testID}>
        <View className="flex-row items-center gap-3 rounded-xl border border-border-light bg-white p-3">
          {/* Avatar */}
          <Image
            source={{ uri: companion.image }}
            className="size-12 rounded-full"
            contentFit="cover"
            testID={testID ? `${testID}-image` : undefined}
          />

          {/* Info */}
          <View className="flex-1">
            <View className="flex-row items-center gap-1">
              <Text className="text-sm font-semibold text-midnight">
                {companion.name}
              </Text>
              {companion.isVerified && (
                <VerifiedBadge color={colors.teal[400]} width={14} height={14} />
              )}
            </View>
            <Text className="text-xs text-text-secondary">
              ⭐ {companion.rating.toFixed(1)} · {t('hirer.home.bookings_count', { count: companion.reviewCount })}
            </Text>
          </View>

          {/* Price & Book */}
          <View className="items-end">
            <Text className="text-sm font-semibold text-teal-400">
              {formatVND(companion.pricePerHour)}/hr
            </Text>
            {onBookPress && (
              <Pressable
                onPress={onBookPress}
                className="mt-1 rounded-lg bg-teal-400 px-3 py-1"
                testID={testID ? `${testID}-book-button` : undefined}
              >
                <Text className="text-xs font-semibold text-white">Book</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>
    );
  }

  // Default variant - full card with image
  return (
    <Pressable onPress={onPress} testID={testID}>
      <View className={styles.container()}>
        {/* Profile Image */}
        <View className={styles.imageContainer()}>
          <Image
            source={{ uri: companion.image }}
            className={styles.image()}
            contentFit="cover"
            testID={testID ? `${testID}-image` : undefined}
          />

          {/* Bottom Gradient Overlay */}
          <View className={styles.gradientContainer()} pointerEvents="none">
            <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="companionGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="rgb(0,0,0)" stopOpacity="0" />
                  <Stop offset="1" stopColor="rgb(0,0,0)" stopOpacity="0.5" />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#companionGrad)" />
            </Svg>
          </View>

          {/* Online Indicator */}
          {companion.isOnline && (
            <View className={styles.onlineIndicator()}>
              <Badge
                label={t('hirer.companion_card.online')}
                variant="online"
                size="sm"
                icon={<OnlineDot color="#FFFFFF" width={8} height={8} />}
              />
            </View>
          )}

          {/* Verified Badge */}
          {companion.isVerified && (
            <View className={styles.verifiedBadge()}>
              <Badge
                label={t('hirer.companion_card.verified')}
                variant="verified"
                size="sm"
                icon={<ShieldCheck color="#FFFFFF" width={12} height={12} />}
              />
            </View>
          )}
        </View>

        {/* Content */}
        <View className={styles.content()}>
          {/* Header with Name and Rating */}
          <View className={styles.header()}>
            <View className={styles.nameContainer()}>
              <Text className={styles.name()}>
                {companion.name}
                {companion.age > 0 && `, ${companion.age}`}
              </Text>
            </View>
            <View className={styles.ratingContainer()}>
              <Star color="#FFD93D" width={14} height={14} filled />
              <Text className={styles.rating()}>
                {companion.rating.toFixed(1)} ({companion.reviewCount})
              </Text>
            </View>
          </View>

          {/* Location */}
          <View className={styles.locationContainer()}>
            <MapPin color="#9CA3AF" width={14} height={14} />
            <Text className={styles.location()}>{companion.location}</Text>
          </View>

          {/* Tags */}
          {companion.specialties.length > 0 && (
            <View className={styles.tagsContainer()}>
              {companion.specialties.slice(0, 3).map((specialty) => (
                <Badge
                  key={specialty}
                  label={specialty}
                  variant="secondary"
                  size="sm"
                />
              ))}
            </View>
          )}

          {/* Price and Book Button */}
          <View className={styles.priceContainer()}>
            <View className="flex-row items-baseline gap-1">
              <Text className={styles.price()}>
                {formatVND(companion.pricePerHour)}
              </Text>
              <Text className={styles.priceUnit()}>
                {t('hirer.companion_card.per_hour')}
              </Text>
            </View>
          </View>

          {/* Book Button */}
          {onBookPress && (
            <Pressable
              className={styles.bookButton()}
              onPress={onBookPress}
              testID={testID ? `${testID}-book-button` : undefined}
            >
              <RNView className="items-center rounded-full bg-rose-400 py-3">
                <Text className="text-base font-bold text-white">
                  {t('hirer.companion_card.book_now')}
                </Text>
              </RNView>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}
