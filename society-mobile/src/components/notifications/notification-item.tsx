import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { colors, Text, View } from '@/components/ui';
import {
  Bell,
  Calendar,
  CheckCircle,
  MessageCircle,
  Money,
  Star,
  XCircle,
} from '@/components/ui/icons';
import type { Notification } from '@/lib/api/services/notifications.service';

type NotificationItemProps = {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
};

// Get icon and colors based on notification type
function getNotificationStyle(type: Notification['type']) {
  switch (type) {
    case 'booking_request':
      return {
        icon: Calendar,
        iconBg: 'bg-lavender-100',
        iconColor: colors.lavender[400],
      };
    case 'booking_confirmed':
      return {
        icon: CheckCircle,
        iconBg: 'bg-teal-100',
        iconColor: colors.teal[400],
      };
    case 'booking_declined':
    case 'booking_cancelled':
      return {
        icon: XCircle,
        iconBg: 'bg-danger-50',
        iconColor: colors.danger[400],
      };
    case 'booking_reminder':
      return {
        icon: Calendar,
        iconBg: 'bg-yellow-100',
        iconColor: colors.yellow[500],
      };
    case 'booking_completed':
      return {
        icon: CheckCircle,
        iconBg: 'bg-teal-100',
        iconColor: colors.teal[400],
      };
    case 'new_message':
      return {
        icon: MessageCircle,
        iconBg: 'bg-rose-100',
        iconColor: colors.rose[400],
      };
    case 'new_review':
      return {
        icon: Star,
        iconBg: 'bg-yellow-100',
        iconColor: colors.yellow[500],
      };
    case 'payment_received':
    case 'withdrawal_completed':
      return {
        icon: Money,
        iconBg: 'bg-teal-100',
        iconColor: colors.teal[400],
      };
    case 'account_verified':
      return {
        icon: CheckCircle,
        iconBg: 'bg-teal-100',
        iconColor: colors.teal[400],
      };
    default:
      return {
        icon: Bell,
        iconBg: 'bg-neutral-100',
        iconColor: colors.neutral[500],
      };
  }
}

// Get deep link route based on notification type and data
function getNotificationRoute(notification: Notification): string | null {
  const data = notification.data as Record<string, string> | undefined;

  switch (notification.type) {
    case 'booking_request':
      return data?.bookingId
        ? `/companion/bookings/${data.bookingId}`
        : '/companion/bookings';
    case 'booking_confirmed':
    case 'booking_declined':
    case 'booking_cancelled':
    case 'booking_reminder':
    case 'booking_completed':
      return data?.bookingId
        ? `/hirer/bookings/${data.bookingId}`
        : '/hirer/bookings';
    case 'new_message':
      return data?.conversationId ? `/chat/${data.conversationId}` : '/chat';
    case 'new_review':
      return '/companion/reviews';
    case 'payment_received':
    case 'withdrawal_completed':
      return '/companion/earnings';
    case 'account_verified':
      return '/(app)/account';
    default:
      return null;
  }
}

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const style = getNotificationStyle(notification.type);
  const Icon = style.icon;

  const handlePress = React.useCallback(() => {
    // Mark as read when tapped
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }

    // Navigate to relevant screen
    const route = getNotificationRoute(notification);
    if (route) {
      router.push(route as never);
    }
  }, [notification, onMarkAsRead, router]);

  const renderRightActions = React.useCallback(() => {
    if (!onDelete) return null;

    return (
      <Pressable
        onPress={() => onDelete(notification.id)}
        className="items-center justify-center bg-danger-400 px-6"
      >
        <Text className="font-urbanist-semibold text-sm text-white">
          {t('common.delete')}
        </Text>
      </Pressable>
    );
  }, [notification.id, onDelete, t]);

  const content = (
    <Pressable
      onPress={handlePress}
      className={`flex-row items-start gap-3 px-4 py-4 ${
        notification.isRead ? 'bg-white' : 'bg-rose-50/50'
      }`}
    >
      {/* Icon */}
      <View
        className={`size-11 items-center justify-center rounded-full ${style.iconBg}`}
      >
        <Icon color={style.iconColor} width={22} height={22} />
      </View>

      {/* Content */}
      <View className="flex-1">
        <View className="flex-row items-start justify-between">
          <Text
            className={`flex-1 text-base ${
              notification.isRead
                ? 'font-urbanist-medium text-midnight'
                : 'font-urbanist-bold text-midnight'
            }`}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          <Text className="ml-2 text-xs text-text-tertiary">
            {formatRelativeTime(notification.createdAt)}
          </Text>
        </View>
        <Text
          className="mt-1 text-sm leading-5 text-text-secondary"
          numberOfLines={2}
        >
          {notification.body}
        </Text>
      </View>

      {/* Unread indicator */}
      {!notification.isRead && (
        <View className="mt-2 size-2 rounded-full bg-rose-400" />
      )}
    </Pressable>
  );

  if (onDelete) {
    return (
      <Swipeable renderRightActions={renderRightActions}>{content}</Swipeable>
    );
  }

  return content;
}

export function NotificationItemSkeleton() {
  return (
    <View className="flex-row items-start gap-3 bg-white px-4 py-4">
      <View className="size-11 animate-pulse rounded-full bg-neutral-200" />
      <View className="flex-1">
        <View className="h-5 w-3/4 animate-pulse rounded bg-neutral-200" />
        <View className="mt-2 h-4 w-full animate-pulse rounded bg-neutral-200" />
        <View className="mt-1 h-4 w-2/3 animate-pulse rounded bg-neutral-200" />
      </View>
    </View>
  );
}
