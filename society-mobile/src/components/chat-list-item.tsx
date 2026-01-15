import * as React from 'react';
import { Pressable } from 'react-native';
import { tv } from 'tailwind-variants';

import { Image, Text, View } from '@/components/ui';

const chatListItem = tv({
  slots: {
    container: 'flex-row items-center gap-2 py-4',
    avatar: 'size-[60px] rounded-full',
    content: 'flex-1 gap-2',
    header: 'flex-row items-center gap-2',
    name: 'text-lg font-bold leading-[1.4] text-midnight dark:text-white',
    levelBadge:
      'bg-primary-400/8 rounded-full border border-primary-400 px-2.5 py-0.5',
    levelText:
      'text-xs font-semibold leading-[1.6] tracking-[0.2px] text-primary-400',
    message:
      'text-sm font-medium leading-[1.6] tracking-[0.2px] text-neutral-600 dark:text-neutral-400',
    timeContainer: 'items-end justify-center',
    time: 'text-sm font-medium leading-[1.6] tracking-[0.2px] text-neutral-600 dark:text-neutral-400',
  },
});

export type ChatListItemData = {
  id: string;
  name: string;
  level: number;
  lastMessage: string;
  timestamp: string;
  avatar: string;
};

type Props = {
  chat: ChatListItemData;
  onPress: () => void;
  testID?: string;
};

export function ChatListItem({ chat, onPress, testID }: Props) {
  const styles = React.useMemo(() => chatListItem(), []);

  return (
    <Pressable className={styles.container()} onPress={onPress} testID={testID}>
      {/* Avatar */}
      <Image
        source={{ uri: chat.avatar }}
        className={styles.avatar()}
        testID={testID ? `${testID}-avatar` : undefined}
      />

      {/* Content */}
      <View className={styles.content()}>
        {/* Name + Level Badge */}
        <View className={styles.header()}>
          <Text
            className={styles.name()}
            numberOfLines={1}
            testID={testID ? `${testID}-name` : undefined}
          >
            {chat.name}
          </Text>
          <View className={styles.levelBadge()}>
            <Text className={styles.levelText()}>Lv.{chat.level}</Text>
          </View>
        </View>

        {/* Last Message */}
        <Text
          className={styles.message()}
          numberOfLines={1}
          testID={testID ? `${testID}-message` : undefined}
        >
          {chat.lastMessage}
        </Text>
      </View>

      {/* Timestamp */}
      <View className={styles.timeContainer()}>
        <Text className={styles.time()}>{chat.timestamp}</Text>
      </View>
    </Pressable>
  );
}
