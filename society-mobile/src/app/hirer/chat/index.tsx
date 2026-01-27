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
import { ArrowLeft, MessageCircle, Search } from '@/components/ui/icons';
import { useConversations } from '@/lib/hooks';

type ConversationItem = {
  id: string;
  otherUser: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    isOnline: boolean;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  unreadCount: number;
};

function ConversationCard({
  conversation,
  onPress,
}: {
  conversation: ConversationItem;
  onPress: () => void;
}) {
  const { t } = useTranslation();

  const formatTime = React.useCallback(
    (dateString?: string) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) {
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      } else if (days === 1) {
        return t('common.yesterday');
      } else if (days < 7) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      }
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    },
    [t]
  );

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 border-b border-border-light bg-white px-4 py-3"
    >
      <View className="relative">
        <Image
          source={{
            uri:
              conversation.otherUser.avatarUrl ||
              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
          }}
          className="size-14 rounded-full"
          contentFit="cover"
        />
        {conversation.otherUser.isOnline && (
          <View className="absolute bottom-0 right-0 size-4 rounded-full border-2 border-white bg-teal-400" />
        )}
      </View>

      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text
            className={`text-base ${
              conversation.unreadCount > 0
                ? 'font-bold text-midnight'
                : 'font-medium text-midnight'
            }`}
          >
            {conversation.otherUser.fullName}
          </Text>
          <Text className="text-xs text-text-tertiary">
            {formatTime(conversation.lastMessage?.createdAt)}
          </Text>
        </View>
        <View className="mt-1 flex-row items-center justify-between">
          <Text
            className={`flex-1 text-sm ${
              conversation.unreadCount > 0
                ? 'font-medium text-midnight'
                : 'text-text-secondary'
            }`}
            numberOfLines={1}
          >
            {conversation.lastMessage?.content || t('hirer.chat.no_messages')}
          </Text>
          {conversation.unreadCount > 0 && (
            <View className="ml-2 size-5 items-center justify-center rounded-full bg-rose-400">
              <Text className="text-xs font-bold text-white">
                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function EmptyState() {
  const { t } = useTranslation();

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 500 }}
      className="flex-1 items-center justify-center p-8"
    >
      <View className="mb-4 size-20 items-center justify-center rounded-full bg-softpink">
        <MessageCircle color={colors.rose[400]} width={40} height={40} />
      </View>
      <Text className="mb-2 text-center font-urbanist-bold text-lg text-midnight">
        {t('hirer.chat.empty_title')}
      </Text>
      <Text className="text-center text-sm text-text-secondary">
        {t('hirer.chat.empty_subtitle')}
      </Text>
    </MotiView>
  );
}

export default function ChatList() {
  const router = useRouter();
  const { t } = useTranslation();

  // API hooks
  const {
    data: conversationsData,
    isLoading,
    refetch,
    isRefetching,
  } = useConversations();

  // Transform conversations
  const conversations = React.useMemo(() => {
    if (!conversationsData?.conversations) return [];
    return conversationsData.conversations.map((c) => ({
      id: c.id,
      otherUser: c.otherUser,
      lastMessage: c.lastMessage,
      unreadCount: c.unreadCount,
    }));
  }, [conversationsData]);

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleSearch = React.useCallback(() => {
    // TODO: Navigate to search screen
    console.log('Search pressed');
  }, []);

  const handleConversationPress = React.useCallback(
    (conversationId: string) => {
      router.push(`/hirer/chat/${conversationId}` as Href);
    },
    [router]
  );

  const renderItem = React.useCallback(
    ({ item, index }: { item: ConversationItem; index: number }) => (
      <MotiView
        from={{ opacity: 0, translateX: -20 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ type: 'timing', duration: 300, delay: index * 50 }}
      >
        <ConversationCard
          conversation={item}
          onPress={() => handleConversationPress(item.id)}
        />
      </MotiView>
    ),
    [handleConversationPress]
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
            {t('hirer.chat.header')}
          </Text>
          <Pressable onPress={handleSearch}>
            <Search color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
        </View>
      </SafeAreaView>

      {conversations.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.rose[400]}
            />
          }
          contentContainerStyle={{ flexGrow: 1 }}
        />
      )}
    </View>
  );
}
