/* eslint-disable max-lines-per-function */
import * as React from 'react';
import { Pressable, StyleSheet, View as RNView } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { tv } from 'tailwind-variants';

import { Image, Text, View } from '@/components/ui';
import { GenderFemale } from '@/components/ui/icons';

const profileCard = tv({
  slots: {
    container: 'flex-1 overflow-hidden rounded-2xl',
    imageContainer: 'flex-1',
    image: 'size-full',
    gradientContainer: 'absolute inset-x-0 bottom-0 h-[200px]',
    content: 'absolute bottom-6 left-6 right-[124px] gap-3',
    name: 'text-3xl font-bold leading-snug text-white',
    chipsContainer: 'flex-row gap-2.5',
    chip: 'flex-row items-center gap-1 rounded-full border border-neutral-300 px-3 py-1',
    chipText:
      'text-sm font-medium leading-[1.6] tracking-[0.2px] text-neutral-300',
    chatButton: 'absolute bottom-6 right-6',
  },
});

type ProfileData = {
  id: string;
  name: string;
  age: number;
  zodiacSign: string;
  image: string;
};

type Props = {
  profile: ProfileData;
  onChatPress?: () => void;
  testID?: string;
};

export function ProfileCard({ profile, onChatPress, testID }: Props) {
  const styles = React.useMemo(() => profileCard(), []);

  return (
    <View className={styles.container()} testID={testID}>
      {/* Profile Image */}
      <View className={styles.imageContainer()}>
        <Image
          source={{ uri: profile.image }}
          className={styles.image()}
          contentFit="cover"
          testID={testID ? `${testID}-image` : undefined}
        />
      </View>

      {/* Bottom Gradient Overlay */}
      <View className={styles.gradientContainer()} pointerEvents="none">
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="rgb(0,0,0)" stopOpacity="0" />
              <Stop offset="1" stopColor="rgb(0,0,0)" stopOpacity="0.7" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#grad)" />
        </Svg>
      </View>

      {/* Profile Info */}
      <View className={styles.content()}>
        <Text
          className={styles.name()}
          testID={testID ? `${testID}-name` : undefined}
        >
          {profile.name}
        </Text>

        <View className={styles.chipsContainer()}>
          {/* Age Chip */}
          <View
            className={styles.chip()}
            testID={testID ? `${testID}-age-chip` : undefined}
          >
            <GenderFemale color="#E0E0E0" size={14} />
            <Text className={styles.chipText()}>{profile.age}</Text>
          </View>

          {/* Zodiac Sign Chip */}
          <View
            className={styles.chip()}
            testID={testID ? `${testID}-zodiac-chip` : undefined}
          >
            <Text className={styles.chipText()}>{profile.zodiacSign}</Text>
          </View>
        </View>
      </View>

      {/* Chat Button */}
      <Pressable
        className={styles.chatButton()}
        onPress={onChatPress}
        testID={testID ? `${testID}-chat-button` : undefined}
      >
        <RNView className="rounded-full bg-rose-400 px-6 py-2.5">
          <Text className="text-lg font-semibold leading-[1.6] tracking-[0.2px] text-white">
            Chat
          </Text>
        </RNView>
      </Pressable>
    </View>
  );
}
