/* eslint-disable max-lines-per-function */
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
  NotificationItem,
  NotificationItemSkeleton,
} from '@/components/notifications';
import {
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { ArrowLeft, Bell, DoubleCheck } from '@/components/ui/icons';
import type { Notification } from '@/lib/api/services/notifications.service';
import {
  useDeleteNotification,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotificationsList,
} from '@/lib/hooks';
import { useSafeBack } from '@/lib/hooks';

function EmptyNotifications() {
  const { t } = useTranslation();

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 400 }}
      className="flex-1 items-center justify-center px-8 py-16"
    >
      <View className="mb-4 size-20 items-center justify-center rounded-full bg-neutral-100">
        <Bell color={colors.neutral[400]} width={40} height={40} />
      </View>
      <Text className="mb-2 text-center font-urbanist-bold text-lg text-midnight">
        {t('notifications.empty_title')}
      </Text>
      <Text className="text-center text-sm text-text-secondary">
        {t('notifications.empty_message')}
      </Text>
    </MotiView>
  );
}

function LoadingSkeleton() {
  return (
    <View className="flex-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <NotificationItemSkeleton key={i} />
      ))}
    </View>
  );
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const goBack = useSafeBack('/(app)/account');

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotificationsList();

  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();

  // Flatten paginated data
  const notifications = React.useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.notifications);
  }, [data]);

  const unreadCount = data?.pages[0]?.unreadCount ?? 0;

  const handleMarkAsRead = React.useCallback(
    (id: string) => {
      markAsRead.mutate(id);
    },
    [markAsRead]
  );

  const handleMarkAllAsRead = React.useCallback(() => {
    markAllAsRead.mutate();
  }, [markAllAsRead]);

  const handleDelete = React.useCallback(
    (id: string) => {
      deleteNotification.mutate(id);
    },
    [deleteNotification]
  );

  const handleLoadMore = React.useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = React.useCallback(
    ({ item }: { item: Notification }) => (
      <NotificationItem
        notification={item}
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleDelete}
      />
    ),
    [handleMarkAsRead, handleDelete]
  );

  const renderFooter = React.useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View className="items-center py-4">
        <ActivityIndicator size="small" color={colors.rose[400]} />
      </View>
    );
  }, [isFetchingNextPage]);

  const renderSeparator = React.useCallback(
    () => <View className="h-px bg-border-light" />,
    []
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-warmwhite">
        <FocusAwareStatusBar />
        <SafeAreaView edges={['top']}>
          <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
            <Pressable onPress={goBack}>
              <ArrowLeft
                color={colors.midnight.DEFAULT}
                width={24}
                height={24}
              />
            </Pressable>
            <Text className="flex-1 font-urbanist-bold text-xl text-midnight">
              {t('notifications.title')}
            </Text>
          </View>
        </SafeAreaView>
        <LoadingSkeleton />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center gap-4 border-b border-border-light px-4 py-3">
          <Pressable onPress={goBack}>
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text className="flex-1 font-urbanist-bold text-xl text-midnight">
            {t('notifications.title')}
          </Text>
          {unreadCount > 0 && (
            <Pressable
              onPress={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
              className="flex-row items-center gap-1"
            >
              <DoubleCheck color={colors.rose[400]} width={20} height={20} />
              <Text className="text-sm font-medium text-rose-400">
                {t('notifications.mark_all_read')}
              </Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <View className="flex-row items-center justify-center gap-2 bg-rose-50 py-2">
          <View className="size-2 rounded-full bg-rose-400" />
          <Text className="text-sm text-rose-500">
            {t('notifications.unread_count', { count: unreadCount })}
          </Text>
        </View>
      )}

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <EmptyNotifications />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={renderSeparator}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.rose[400]}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}
