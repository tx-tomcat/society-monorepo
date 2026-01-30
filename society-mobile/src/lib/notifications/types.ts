/**
 * Push Notification Types and Payloads
 */

// Notification types matching backend NotificationType enum
export const NotificationType = {
  // Booking notifications
  BOOKING_REQUEST: 'BOOKING_REQUEST',
  BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
  BOOKING_DECLINED: 'BOOKING_DECLINED',
  BOOKING_CANCELLED: 'BOOKING_CANCELLED',
  BOOKING_REMINDER: 'BOOKING_REMINDER',
  BOOKING_COMPLETED: 'BOOKING_COMPLETED',

  // Chat notifications
  NEW_MESSAGE: 'NEW_MESSAGE',

  // Review notifications
  NEW_REVIEW: 'NEW_REVIEW',

  // Payment notifications
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  WITHDRAWAL_COMPLETED: 'WITHDRAWAL_COMPLETED',

  // Account notifications
  ACCOUNT_VERIFIED: 'ACCOUNT_VERIFIED',

  // System notifications
  SYSTEM: 'SYSTEM',

  // Engagement notifications
  FAVORITE_ONLINE: 'FAVORITE_ONLINE',
  PROMOTION: 'PROMOTION',
} as const;

export type NotificationTypeValue =
  (typeof NotificationType)[keyof typeof NotificationType];

// Base notification data payload
export interface NotificationData {
  type: NotificationTypeValue;
  url?: string; // Deep link URL
  [key: string]: unknown;
}

// Booking notification payload
export interface BookingNotificationData extends NotificationData {
  type:
    | typeof NotificationType.BOOKING_REQUEST
    | typeof NotificationType.BOOKING_CONFIRMED
    | typeof NotificationType.BOOKING_DECLINED
    | typeof NotificationType.BOOKING_CANCELLED
    | typeof NotificationType.BOOKING_REMINDER
    | typeof NotificationType.BOOKING_COMPLETED;
  bookingId: string;
  companionId?: string;
  companionName?: string;
  hirerId?: string;
  hirerName?: string;
  scheduledDate?: string;
}

// Message notification payload
export interface MessageNotificationData extends NotificationData {
  type: typeof NotificationType.NEW_MESSAGE;
  conversationId: string;
  senderId: string;
  senderName: string;
  messagePreview?: string;
}

// Review notification payload
export interface ReviewNotificationData extends NotificationData {
  type: typeof NotificationType.NEW_REVIEW;
  reviewId: string;
  bookingId: string;
  reviewerName: string;
  rating: number;
}

// Payment notification payload
export interface PaymentNotificationData extends NotificationData {
  type:
    | typeof NotificationType.PAYMENT_RECEIVED
    | typeof NotificationType.WITHDRAWAL_COMPLETED;
  amount: number;
  transactionId?: string;
}

// Verification notification payload
export interface VerificationNotificationData extends NotificationData {
  type: typeof NotificationType.ACCOUNT_VERIFIED;
  verificationType: 'identity' | 'background' | 'full';
}

// Favorite online notification payload
export interface FavoriteOnlineNotificationData extends NotificationData {
  type: typeof NotificationType.FAVORITE_ONLINE;
  companionId: string;
  companionName: string;
  companionProfileId: string;
}

// Union type for all notification data
export type AppNotificationData =
  | BookingNotificationData
  | MessageNotificationData
  | ReviewNotificationData
  | PaymentNotificationData
  | VerificationNotificationData
  | FavoriteOnlineNotificationData
  | NotificationData;

// Android notification channels
export const NotificationChannels = {
  DEFAULT: {
    id: 'default',
    name: 'General',
    description: 'General notifications',
  },
  BOOKINGS: {
    id: 'bookings',
    name: 'Bookings',
    description: 'Booking requests, confirmations, and reminders',
  },
  MESSAGES: {
    id: 'messages',
    name: 'Messages',
    description: 'New chat messages',
  },
  PAYMENTS: {
    id: 'payments',
    name: 'Payments',
    description: 'Payment and withdrawal notifications',
  },
  REMINDERS: {
    id: 'reminders',
    name: 'Reminders',
    description: 'Booking reminders and alerts',
  },
} as const;

// Map notification types to channels
export const NotificationTypeToChannel: Record<NotificationTypeValue, string> =
  {
    [NotificationType.BOOKING_REQUEST]: NotificationChannels.BOOKINGS.id,
    [NotificationType.BOOKING_CONFIRMED]: NotificationChannels.BOOKINGS.id,
    [NotificationType.BOOKING_DECLINED]: NotificationChannels.BOOKINGS.id,
    [NotificationType.BOOKING_CANCELLED]: NotificationChannels.BOOKINGS.id,
    [NotificationType.BOOKING_REMINDER]: NotificationChannels.REMINDERS.id,
    [NotificationType.BOOKING_COMPLETED]: NotificationChannels.BOOKINGS.id,
    [NotificationType.NEW_MESSAGE]: NotificationChannels.MESSAGES.id,
    [NotificationType.NEW_REVIEW]: NotificationChannels.DEFAULT.id,
    [NotificationType.PAYMENT_RECEIVED]: NotificationChannels.PAYMENTS.id,
    [NotificationType.WITHDRAWAL_COMPLETED]: NotificationChannels.PAYMENTS.id,
    [NotificationType.ACCOUNT_VERIFIED]: NotificationChannels.DEFAULT.id,
    [NotificationType.SYSTEM]: NotificationChannels.DEFAULT.id,
    [NotificationType.FAVORITE_ONLINE]: NotificationChannels.DEFAULT.id,
    [NotificationType.PROMOTION]: NotificationChannels.DEFAULT.id,
  };
