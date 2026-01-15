import { NotificationType } from '@generated/client';

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  actionUrl?: string;
}

export interface PushNotificationPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

export interface SmsPayload {
  to: string;
  body: string;
}

export interface NotificationResult {
  notificationId: string;
  channels: {
    inApp: boolean;
    push?: { success: boolean; error?: string };
    email?: { success: boolean; error?: string };
    sms?: { success: boolean; error?: string };
  };
}

export interface NotificationPreferences {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  typePreferences: {
    [key in NotificationType]?: {
      push: boolean;
      email: boolean;
      sms: boolean;
    };
  };
}

export interface NotificationListItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, any>;
  actionUrl: string | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}
