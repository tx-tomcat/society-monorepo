/* eslint-disable max-lines-per-function */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import {
  colors,
  FocusAwareStatusBar,
  Image,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { ArrowLeft, MoreVertical, Phone, Send } from '@/components/ui/icons';
import {
  useConversation,
  useCurrentUser,
  useMarkAsRead,
  useMessages,
  useSendMessage,
} from '@/lib/hooks';

type MessageItem = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
};

function MessageBubble({
  message,
  isOwnMessage,
}: {
  message: MessageItem;
  isOwnMessage: boolean;
}) {
  const formatTime = React.useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, []);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 200 }}
      className={`mb-3 max-w-[80%] ${isOwnMessage ? 'self-end' : 'self-start'}`}
    >
      <View
        className={`rounded-2xl px-4 py-3 ${
          isOwnMessage ? 'rounded-br-sm bg-rose-400' : 'rounded-bl-sm bg-white'
        }`}
      >
        <Text className={isOwnMessage ? 'text-white' : 'text-midnight'}>
          {message.content}
        </Text>
      </View>
      <Text
        className={`mt-1 text-xs text-text-tertiary ${
          isOwnMessage ? 'text-right' : 'text-left'
        }`}
      >
        {formatTime(message.createdAt)}
      </Text>
    </MotiView>
  );
}

export default function ChatConversation() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: currentUser } = useCurrentUser();
  const userId = currentUser?.user?.id;

  const [messageText, setMessageText] = React.useState('');
  const flatListRef = React.useRef<FlatList>(null);

  // API hooks
  const { data: conversation, isLoading: isLoadingConversation } =
    useConversation(id || '');
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(id || '');
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();

  // Transform messages - flatten all pages
  const messages = React.useMemo(() => {
    if (!messagesData?.pages) return [];
    const allMessages: MessageItem[] = [];
    messagesData.pages.forEach((page) => {
      page.messages.forEach((m) => {
        allMessages.push({
          id: m.id,
          senderId: m.senderId,
          content: m.content,
          createdAt: m.createdAt,
          isRead: m.isRead,
        });
      });
    });
    // Sort newest first for inverted list
    return allMessages.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [messagesData]);

  // Mark as read when entering conversation
  React.useEffect(() => {
    if (id && conversation?.unreadCount && conversation.unreadCount > 0) {
      markAsRead.mutate(id);
    }
  }, [id, conversation?.unreadCount]);

  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleCall = React.useCallback(() => {
    // TODO: Implement calling
    console.log('Call pressed');
  }, []);

  const handleMore = React.useCallback(() => {
    // TODO: Show more options (report, block, etc.)
    console.log('More pressed');
  }, []);

  const handleSend = React.useCallback(async () => {
    if (!messageText.trim() || !id) return;

    const text = messageText.trim();
    setMessageText('');

    try {
      await sendMessage.mutateAsync({
        conversationId: id,
        data: { content: text, messageType: 'text' },
      });
    } catch (error) {
      console.error('Send message error:', error);
      // Restore message on error
      setMessageText(text);
    }
  }, [messageText, id, sendMessage]);

  const handleLoadMore = React.useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderMessage = React.useCallback(
    ({ item }: { item: MessageItem }) => (
      <MessageBubble message={item} isOwnMessage={item.senderId === userId} />
    ),
    [userId]
  );

  const isLoading = isLoadingConversation || isLoadingMessages;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite">
        <ActivityIndicator size="large" color={colors.rose[400]} />
      </View>
    );
  }

  if (!conversation) {
    return (
      <View className="flex-1 bg-warmwhite">
        <FocusAwareStatusBar />
        <SafeAreaView edges={['top']}>
          <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
            <Pressable onPress={handleBack}>
              <ArrowLeft
                color={colors.midnight.DEFAULT}
                width={24}
                height={24}
              />
            </Pressable>
            <Text
              style={styles.headerTitle}
              className="flex-1 text-xl text-midnight"
            >
              {t('hirer.chat.header')}
            </Text>
          </View>
        </SafeAreaView>
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-center text-text-secondary">
            {t('hirer.chat.conversation_not_found')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-3 border-b border-border-light bg-white px-4 py-3">
          <Pressable onPress={handleBack}>
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>

          <View className="relative">
            <Image
              source={{
                uri:
                  conversation.otherUser.avatarUrl ||
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
              }}
              className="size-10 rounded-full"
              contentFit="cover"
            />
            {conversation.otherUser.isOnline && (
              <View className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-teal-400" />
            )}
          </View>

          <View className="flex-1">
            <Text
              style={styles.headerTitle}
              className="text-base text-midnight"
            >
              {conversation.otherUser.fullName}
            </Text>
            <Text className="text-xs text-text-secondary">
              {conversation.otherUser.isOnline
                ? t('hirer.chat.online')
                : t('hirer.chat.offline')}
            </Text>
          </View>

          <Pressable onPress={handleCall} className="p-2">
            <Phone color={colors.rose[400]} width={22} height={22} />
          </Pressable>
          <Pressable onPress={handleMore} className="p-2">
            <MoreVertical
              color={colors.midnight.DEFAULT}
              width={22}
              height={22}
            />
          </Pressable>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          inverted
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                size="small"
                color={colors.rose[400]}
                style={{ marginVertical: 10 }}
              />
            ) : null
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center">
              <Text className="text-text-tertiary">
                {t('hirer.chat.start_conversation')}
              </Text>
            </View>
          }
        />

        {/* Input Area */}
        <SafeAreaView
          edges={['bottom']}
          className="border-t border-border-light bg-white"
        >
          <View className="flex-row items-end gap-3 px-4 py-3">
            <View className="flex-1 flex-row items-end rounded-2xl border border-border-light bg-gray-50 px-4">
              <TextInput
                value={messageText}
                onChangeText={setMessageText}
                placeholder={t('hirer.chat.message_placeholder')}
                placeholderTextColor={colors.text.tertiary}
                multiline
                maxLength={1000}
                className="max-h-24 flex-1 py-3 text-base"
                style={[styles.input, { color: colors.midnight.DEFAULT }]}
              />
            </View>
            <Pressable
              onPress={handleSend}
              disabled={!messageText.trim() || sendMessage.isPending}
              className={`size-12 items-center justify-center rounded-full ${
                messageText.trim() ? 'bg-rose-400' : 'bg-gray-200'
              }`}
            >
              {sendMessage.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send
                  color={messageText.trim() ? '#FFFFFF' : colors.text.tertiary}
                  width={20}
                  height={20}
                />
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontFamily: 'Urbanist_700Bold',
  },
  input: {
    fontFamily: 'Urbanist_500Medium',
  },
});
