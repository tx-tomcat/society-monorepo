import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { NotificationPreferences } from '../api/services/notifications.service';
import { notificationsService } from '../api/services/notifications.service';
import { useAuth } from './use-auth';

/**
 * React Query hook to fetch notifications
 */
export function useNotifications(page = 1, limit = 20) {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['notifications', { page, limit }],
    queryFn: () => notificationsService.getNotifications(page, limit),
    enabled: isSignedIn,
    staleTime: 1 * 60 * 1000, // 1 minute - notifications should be fresh
  });
}

/**
 * React Query hook to fetch unread notification count
 */
export function useUnreadNotificationCount() {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsService.getUnreadCount(),
    enabled: isSignedIn,
    staleTime: 30 * 1000, // 30 seconds - check frequently
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * React Query mutation hook to mark notification as read
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * React Query mutation hook to mark all notifications as read
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * React Query mutation hook to delete a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * React Query hook to fetch notification preferences
 */
export function useNotificationPreferences() {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => notificationsService.getPreferences(),
    enabled: isSignedIn,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * React Query mutation hook to update notification preferences
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: Partial<NotificationPreferences>) =>
      notificationsService.updatePreferences(preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });
}

/**
 * React Query mutation hook to register push token
 */
export function useRegisterPushToken() {
  return useMutation({
    mutationFn: ({
      token,
      platform,
    }: {
      token: string;
      platform: 'ios' | 'android';
    }) => notificationsService.registerPushToken(token, platform),
  });
}

/**
 * React Query mutation hook to remove push token
 */
export function useRemovePushToken() {
  return useMutation({
    mutationFn: (tokenId: string) =>
      notificationsService.removePushToken(tokenId),
  });
}
