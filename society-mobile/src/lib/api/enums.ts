/**
 * Shared enums for the API layer
 * These should match the backend Prisma enums
 */

// ============ Booking Status ============

export const BookingStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  DISPUTED: 'DISPUTED',
  EXPIRED: 'EXPIRED',
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

// ============ Payment Status ============

export const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  HELD: 'HELD',
  RELEASED: 'RELEASED',
  REFUNDED: 'REFUNDED',
  PARTIAL_REFUND: 'PARTIAL_REFUND',
  FAILED: 'FAILED',
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

// ============ Payment Request Status ============

export const PaymentRequestStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
  FAILED: 'FAILED',
} as const;

export type PaymentRequestStatus =
  (typeof PaymentRequestStatus)[keyof typeof PaymentRequestStatus];

// ============ Payment Request Type ============

export const PaymentRequestType = {
  TOPUP: 'TOPUP',
  BOOKING: 'BOOKING',
} as const;

export type PaymentRequestType =
  (typeof PaymentRequestType)[keyof typeof PaymentRequestType];

// ============ User Role ============

export const UserRole = {
  HIRER: 'HIRER',
  COMPANION: 'COMPANION',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// ============ User Status ============

export const UserStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  DELETED: 'DELETED',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

// ============ Gender ============

export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
} as const;

export type Gender = (typeof Gender)[keyof typeof Gender];

// ============ Verification Status ============

export const VerificationStatus = {
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  VERIFIED: 'VERIFIED',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
} as const;

export type VerificationStatus =
  (typeof VerificationStatus)[keyof typeof VerificationStatus];

// ============ Message Type ============

export const MessageType = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  LOCATION: 'LOCATION',
  SYSTEM: 'SYSTEM',
} as const;

export type MessageType = (typeof MessageType)[keyof typeof MessageType];

// ============ Notification Type ============

export const NotificationType = {
  BOOKING_REQUEST: 'BOOKING_REQUEST',
  BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
  BOOKING_DECLINED: 'BOOKING_DECLINED',
  BOOKING_CANCELLED: 'BOOKING_CANCELLED',
  BOOKING_REMINDER: 'BOOKING_REMINDER',
  BOOKING_COMPLETED: 'BOOKING_COMPLETED',
  NEW_MESSAGE: 'NEW_MESSAGE',
  NEW_REVIEW: 'NEW_REVIEW',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  WITHDRAWAL_COMPLETED: 'WITHDRAWAL_COMPLETED',
  ACCOUNT_VERIFIED: 'ACCOUNT_VERIFIED',
  SYSTEM: 'SYSTEM',
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

// ============ Earnings Status ============

export const EarningsStatus = {
  PENDING: 'PENDING',
  AVAILABLE: 'AVAILABLE',
  WITHDRAWN: 'WITHDRAWN',
  CANCELLED: 'CANCELLED',
} as const;

export type EarningsStatus =
  (typeof EarningsStatus)[keyof typeof EarningsStatus];

// ============ Withdrawal Status ============

export const WithdrawalStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type WithdrawalStatus =
  (typeof WithdrawalStatus)[keyof typeof WithdrawalStatus];

// ============ Report Type ============

export const ReportType = {
  HARASSMENT: 'HARASSMENT',
  INAPPROPRIATE_BEHAVIOR: 'INAPPROPRIATE_BEHAVIOR',
  NO_SHOW: 'NO_SHOW',
  FRAUD: 'FRAUD',
  FAKE_PROFILE: 'FAKE_PROFILE',
  SPAM: 'SPAM',
  SAFETY_CONCERN: 'SAFETY_CONCERN',
  PAYMENT_ISSUE: 'PAYMENT_ISSUE',
  OTHER: 'OTHER',
} as const;

export type ReportType = (typeof ReportType)[keyof typeof ReportType];

// ============ Report Status ============

export const ReportStatus = {
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  RESOLVED: 'RESOLVED',
  DISMISSED: 'DISMISSED',
} as const;

export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];
