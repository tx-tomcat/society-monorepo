/* eslint-disable max-lines-per-function */
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';

import {
  Badge,
  colors,
  FocusAwareStatusBar,
  Image,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { MoreVertical, OnlineDot, Search, SocietyLogo } from '@/components/ui/icons';

type Tab = {
  id: string;
  label: string;
};

const TABS: Tab[] = [
  { id: 'all', label: 'All' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'support', label: 'Support' },
];

type ChatItemData = {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  avatar: string;
  unreadCount?: number;
  isOnline?: boolean;
  isBookingChat?: boolean;
  bookingStatus?: 'upcoming' | 'active' | 'completed';
};

// Mock data for Society chat list
const MOCK_CHATS: ChatItemData[] = [
  {
    id: '1',
    name: 'Minh Anh',
    lastMessage: 'See you at Rex Hotel at 2pm!',
    timestamp: '10:30 AM',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
    unreadCount: 2,
    isOnline: true,
    isBookingChat: true,
    bookingStatus: 'upcoming',
  },
  {
    id: '2',
    name: 'Thu Hương',
    lastMessage: 'Thank you for the great review! Hope to see you again.',
    timestamp: 'Yesterday',
    avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=120',
    isOnline: false,
    isBookingChat: true,
    bookingStatus: 'completed',
  },
  {
    id: '3',
    name: 'Society Support',
    lastMessage: 'Your payment has been processed successfully.',
    timestamp: 'Yesterday',
    avatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=120',
    isOnline: true,
  },
  {
    id: '4',
    name: 'Ngọc Trâm',
    lastMessage: 'Looking forward to the coffee date!',
    timestamp: '12/28/24',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120',
    isOnline: true,
    isBookingChat: true,
    bookingStatus: 'active',
  },
];

function ChatListItem({
  chat,
  onPress,
}: {
  chat: ChatItemData;
  onPress: () => void;
}) {
  const getStatusBadge = () => {
    if (!chat.isBookingChat) return null;

    switch (chat.bookingStatus) {
      case 'upcoming':
        return <Badge label="Upcoming" variant="lavender" size="sm" />;
      case 'active':
        return <Badge label="Active" variant="teal" size="sm" />;
      case 'completed':
        return <Badge label="Completed" variant="secondary" size="sm" />;
      default:
        return null;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 py-3"
    >
      {/* Avatar */}
      <View className="relative">
        <Image
          source={{ uri: chat.avatar }}
          className="size-14 rounded-full"
          contentFit="cover"
        />
        {chat.isOnline && (
          <View className="absolute bottom-0 right-0 size-4 items-center justify-center rounded-full border-2 border-warmwhite bg-teal-400">
            <OnlineDot color="#FFFFFF" width={8} height={8} />
          </View>
        )}
      </View>

      {/* Content */}
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <Text className="flex-1 text-base font-semibold text-midnight">
            {chat.name}
          </Text>
          <Text className="text-xs text-text-tertiary">{chat.timestamp}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Text
            className={`flex-1 text-sm ${
              chat.unreadCount ? 'font-medium text-midnight' : 'text-text-tertiary'
            }`}
            numberOfLines={1}
          >
            {chat.lastMessage}
          </Text>
          {chat.unreadCount ? (
            <View className="size-5 items-center justify-center rounded-full bg-rose-400">
              <Text className="text-xs font-bold text-white">
                {chat.unreadCount}
              </Text>
            </View>
          ) : null}
        </View>
        {getStatusBadge()}
      </View>
    </Pressable>
  );
}

export default function Chats() {
  const [activeTab, setActiveTab] = React.useState('all');

  const handleChatPress = React.useCallback((chatId: string) => {
    router.push(`/chat/${chatId}`);
  }, []);

  const handleSearchPress = React.useCallback(() => {
    console.log('Search pressed');
  }, []);

  const handleMorePress = React.useCallback(() => {
    console.log('More options pressed');
  }, []);

  const filteredChats = React.useMemo(() => {
    if (activeTab === 'all') return MOCK_CHATS;
    if (activeTab === 'bookings') return MOCK_CHATS.filter((c) => c.isBookingChat);
    if (activeTab === 'support') return MOCK_CHATS.filter((c) => c.name === 'Society Support');
    return MOCK_CHATS;
  }, [activeTab]);

  const renderChatItem = React.useCallback(
    ({ item }: { item: ChatItemData }) => (
      <ChatListItem
        chat={item}
        onPress={() => handleChatPress(item.id)}
      />
    ),
    [handleChatPress]
  );

  const renderSeparator = React.useCallback(
    () => <View className="h-px bg-border-light" />,
    []
  );

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          {/* Logo */}
          <View className="w-8">
            <SocietyLogo color={colors.rose[400]} width={32} height={32} />
          </View>

          {/* Title */}
          <Text className="flex-1 text-center text-2xl font-bold leading-[1.4] text-midnight">
            Messages
          </Text>

          {/* Action Icons */}
          <View className="flex-row items-center gap-4">
            <Pressable onPress={handleSearchPress} testID="search-button">
              <Search color={colors.midnight.DEFAULT} width={24} height={24} />
            </Pressable>
            <Pressable onPress={handleMorePress} testID="more-button">
              <MoreVertical color={colors.midnight.DEFAULT} width={24} height={24} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      {/* Content */}
      <View className="flex-1 px-4">
        {/* Tab Switcher */}
        <View className="flex-row gap-2 py-3">
          {TABS.map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
            >
              <Badge
                label={tab.label}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                size="default"
              />
            </Pressable>
          ))}
        </View>

        {/* Chat List */}
        <FlashList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={80}
          ItemSeparatorComponent={renderSeparator}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-lg text-text-tertiary">No messages yet</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}
