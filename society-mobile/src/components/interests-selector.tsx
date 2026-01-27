/* eslint-disable max-lines-per-function */
import React from 'react';
import { Modal, Pressable, ScrollView } from 'react-native';

import { Text, View } from '@/components/ui';
import { X } from '@/components/ui/icons';

export type Interest = {
  id: string;
  label: string;
  emoji: string;
};

export const INTERESTS: Interest[] = [
  { id: 'travel', label: 'Travel', emoji: '✈️' },
  { id: 'cooking', label: 'Cooking', emoji: '🍳' },
  { id: 'hiking', label: 'Hiking', emoji: '🏞️' },
  { id: 'yoga', label: 'Yoga', emoji: '🧘' },
  { id: 'gaming', label: 'Gaming', emoji: '🎮' },
  { id: 'movies', label: 'Movies', emoji: '🎥' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'photography', label: 'Photography', emoji: '📷' },
  { id: 'pets', label: 'Pets', emoji: '🐱' },
  { id: 'painting', label: 'Painting', emoji: '🎨' },
  { id: 'art', label: 'Art', emoji: '🎨' },
  { id: 'fitness', label: 'Fitness', emoji: '💪' },
  { id: 'reading', label: 'Reading', emoji: '📖' },
  { id: 'dancing', label: 'Dancing', emoji: '💃' },
  { id: 'sports', label: 'Sports', emoji: '🏀' },
  { id: 'board-games', label: 'Board Games', emoji: '🎲' },
  { id: 'technology', label: 'Technology', emoji: '📱' },
  { id: 'fashion', label: 'Fashion', emoji: '👗' },
  { id: 'motorcycling', label: 'Motorcycling', emoji: '🏍️' },
  { id: 'science', label: 'Science', emoji: '🔬' },
  { id: 'history', label: 'History', emoji: '📜' },
  { id: 'nature', label: 'Nature', emoji: '🌿' },
  { id: 'adventure', label: 'Adventure', emoji: '🌄' },
  { id: 'gardening', label: 'Gardening', emoji: '🌻' },
  { id: 'foodie', label: 'Foodie', emoji: '🍽️' },
  { id: 'writing', label: 'Writing', emoji: '✍️' },
  { id: 'poetry', label: 'Poetry', emoji: '📝' },
  { id: 'astronomy', label: 'Astronomy', emoji: '🔭' },
  { id: 'sustainable-living', label: 'Sustainable Living', emoji: '🌱' },
  { id: 'film-production', label: 'Film Production', emoji: '🎬' },
  { id: 'meditation', label: 'Meditation', emoji: '🧘‍♂️' },
  { id: 'comedy', label: 'Comedy', emoji: '😄' },
  { id: 'volunteering', label: 'Volunteering', emoji: '🤝' },
  { id: 'diy', label: 'DIY Projects', emoji: '🛠️' },
  { id: 'art-history', label: 'Art History', emoji: '🏛️' },
  { id: 'philosophy', label: 'Philosophy', emoji: '🧠' },
  { id: 'snowboarding', label: 'Snowboarding', emoji: '🏂' },
  { id: 'wine-tasting', label: 'Wine Tasting', emoji: '🍷' },
  { id: 'collectibles', label: 'Collectibles', emoji: '🎩' },
  { id: 'sailing', label: 'Sailing', emoji: '⛵' },
  { id: 'karaoke', label: 'Karaoke', emoji: '🎤' },
  { id: 'surfing', label: 'Surfing', emoji: '🏄' },
  { id: 'scuba-diving', label: 'Scuba Diving', emoji: '🌊' },
  { id: 'skydiving', label: 'Skydiving', emoji: '🪂' },
  { id: 'pottery', label: 'Pottery', emoji: '🏺' },
  { id: 'wildlife-conservation', label: 'Wildlife Conservation', emoji: '🦁' },
  { id: 'ghost-hunting', label: 'Ghost Hunting', emoji: '👻' },
  { id: 'geocaching', label: 'Geocaching', emoji: '🌐' },
  { id: 'stand-up-comedy', label: 'Stand-up Comedy', emoji: '🎙️' },
  { id: 'motor-racing', label: 'Motor Racing', emoji: '🏁' },
  { id: 'paranormal', label: 'Paranormal Investigation', emoji: '🕵️‍♂️' },
];

type InterestChipProps = {
  interest: Interest;
  selected: boolean;
  onPress: () => void;
};

function InterestChip({ interest, selected, onPress }: InterestChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full px-5 py-2 ${
        selected ? 'bg-primary-400' : 'border border-neutral-700 bg-transparent'
      }`}
      testID={`interest-${interest.id}`}
    >
      <Text
        className={`text-base font-semibold leading-[1.6] tracking-[0.2px] ${
          selected ? 'text-midnight' : 'text-offwhite'
        }`}
      >
        {interest.label} {interest.emoji}
      </Text>
    </Pressable>
  );
}

type InterestsSelectorProps = {
  visible: boolean;
  selectedInterests: string[];
  onClose: () => void;
  onSave: (selectedIds: string[]) => void;
};

export function InterestsSelector({
  visible,
  selectedInterests,
  onClose,
  onSave,
}: InterestsSelectorProps) {
  const [selected, setSelected] = React.useState<string[]>(selectedInterests);

  React.useEffect(() => {
    if (visible) {
      setSelected(selectedInterests);
    }
  }, [visible, selectedInterests]);

  const toggleInterest = React.useCallback((id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const handleSave = React.useCallback(() => {
    onSave(selected);
    onClose();
  }, [selected, onSave, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-neutral-900">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 pt-16">
          <Pressable
            onPress={onClose}
            className="size-7 items-center justify-center"
            testID="close-button"
          >
            <X color="white" size={28} />
          </Pressable>

          <Text className="flex-1 text-center font-urbanist-bold text-2xl leading-[1.4] tracking-normal text-offwhite">
            Add Interests
          </Text>

          <View className="w-7" />
        </View>

        {/* Interests Grid */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row flex-wrap gap-3">
            {INTERESTS.map((interest) => (
              <InterestChip
                key={interest.id}
                interest={interest}
                selected={selected.includes(interest.id)}
                onPress={() => toggleInterest(interest.id)}
              />
            ))}
          </View>
        </ScrollView>

        {/* OK Button */}
        <View className="absolute inset-x-0 bottom-0 px-6 pb-9 pt-6">
          <Pressable
            onPress={handleSave}
            className="items-center justify-center rounded-full bg-primary-400 py-4"
            testID="save-interests-button"
          >
            <Text className="text-base font-bold leading-[1.6] tracking-[0.2px] text-midnight">
              OK
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
