import { apiClient } from '../client';

export type NotificationType =
  | 'booking_request'
  | 'booking_confirmed'
  | 'booking_declined'
  | 'booking_cancelled'
  | 'booking_reminder'
  | 'booking_completed'
  | 'new_message'
  | 'new_review'
  | 'payment_received'
  | 'withdrawal_completed'
  | 'account_verified'
  | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  bookingUpdates: boolean;
  messages: boolean;
  promotions: boolean;
  reminders: boolean;
}

/**
 * Notifications API Service
 */
export const notificationsService = {
  /**
   * Get notifications list
   */
  async getNotifications(
    page = 1,
    limit = 20
  ): Promise<NotificationsResponse> {
    return apiClient.get(`/notifications?page=${page}&limit=${limit}`);
  },

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<{ count: number }> {
    return apiClient.get('/notifications/unread-count');
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<{ success: boolean }> {
    return apiClient.put(`/notifications/${notificationId}/read`, {});
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ success: boolean }> {
    return apiClient.put('/notifications/read-all', {});
  },

  /**
   * Delete notification
   */
  async deleteNotification(
    notificationId: string
  ): Promise<{ success: boolean }> {
    return apiClient.delete(`/notifications/${notificationId}`);
  },

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    return apiClient.get('/notifications/preferences');
  },

  /**
   * Update notification preferences
   */
  async updatePreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    return apiClient.put('/notifications/preferences', preferences);
  },

  /**
   * Register push token
   */
  async registerPushToken(
    token: string,
    platform: 'ios' | 'android'
  ): Promise<{ success: boolean }> {
    return apiClient.post('/notifications/token', { token, platform });
  },

  /**
   * Remove push token
   */
  async removePushToken(tokenId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/notifications/token/${tokenId}`);
  },
};
