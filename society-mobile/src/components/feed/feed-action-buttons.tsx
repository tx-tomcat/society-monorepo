import * as React from 'react';
import { Pressable, View as RNView } from 'react-native';

import { colors } from '@/components/ui';
import { Calendar, Heart, MessageCircle } from '@/components/ui/icons';

type FeedActionButtonsProps = {
  companionId: string;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
  onMessage: () => void;
  onBook: () => void;
};

export const FeedActionButtons = React.memo(function FeedActionButtons({
  isFavorite,
  onFavoriteToggle,
  onMessage,
  onBook,
}: FeedActionButtonsProps) {
  return (
    <RNView className="absolute bottom-44 right-4 items-center gap-4" style={{ zIndex: 20 }}>
      {/* Favorite */}
      <Pressable
        onPress={onFavoriteToggle}
        className="items-center justify-center rounded-full"
        style={{
          width: 48,
          height: 48,
          backgroundColor: 'rgba(0,0,0,0.3)',
        }}
      >
        <Heart
          color={isFavorite ? colors.rose[400] : '#FFFFFF'}
          width={24}
          height={24}
          fill={isFavorite ? colors.rose[400] : 'transparent'}
        />
      </Pressable>

      {/* Message */}
      <Pressable
        onPress={onMessage}
        className="items-center justify-center rounded-full"
        style={{
          width: 48,
          height: 48,
          backgroundColor: 'rgba(0,0,0,0.3)',
        }}
      >
        <MessageCircle color="#FFFFFF" width={24} height={24} />
      </Pressable>

      {/* Book */}
      <Pressable
        onPress={onBook}
        className="items-center justify-center overflow-hidden rounded-full"
        style={{
          width: 48,
          height: 48,
          backgroundColor: colors.rose[400],
        }}
      >
        <Calendar color="#FFFFFF" width={22} height={22} />
      </Pressable>
    </RNView>
  );
});
