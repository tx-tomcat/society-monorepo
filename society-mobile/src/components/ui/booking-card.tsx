import React from 'react';
import { Pressable, type PressableProps } from 'react-native';

import { Badge, Text, View, colors } from './index';
import { Image } from './image';
import { Clock, MapPin } from './icons';

type BookingCardProps = {
  avatarUrl: string;
  displayName: string;
  occasionEmoji?: string;
  occasionName: string;
  timeString: string;
  locationAddress: string;
  statusLabel: string;
  statusVariant: 'default' | 'teal' | 'lavender' | 'rose';
  onPress?: () => void;
  testID?: string;
} & Omit<PressableProps, 'children'>;

export const BookingCard = React.memo<BookingCardProps>(
  ({
    avatarUrl,
    displayName,
    occasionEmoji,
    occasionName,
    timeString,
    locationAddress,
    statusLabel,
    statusVariant,
    onPress,
    testID,
    ...pressableProps
  }) => {
    return (
      <Pressable
        onPress={onPress}
        testID={testID}
        className="flex-row gap-4 rounded-2xl bg-white p-4"
        {...pressableProps}
      >
        <Image
          source={{ uri: avatarUrl }}
          className="size-14 rounded-full"
          contentFit="cover"
        />
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="font-semibold text-midnight">
              {displayName}
            </Text>
            <Badge
              label={statusLabel}
              variant={statusVariant}
              size="sm"
            />
          </View>
          <Text className="mt-1 text-sm text-rose-400">
            {occasionEmoji ? `${occasionEmoji} ${occasionName}` : occasionName}
          </Text>
          <View className="mt-2 flex-row items-center gap-4">
            <View className="flex-row items-center gap-1">
              <Clock
                color={colors.text.tertiary}
                width={14}
                height={14}
              />
              <Text className="text-xs text-text-tertiary">
                {timeString}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <MapPin
                color={colors.text.tertiary}
                width={14}
                height={14}
              />
              <Text
                className="text-xs text-text-tertiary"
                numberOfLines={1}
              >
                {locationAddress}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  }
);

BookingCard.displayName = 'BookingCard';
