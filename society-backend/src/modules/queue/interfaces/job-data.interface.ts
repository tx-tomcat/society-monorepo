import { NotificationType } from '@generated/client';

// Notification job data
export type NotificationJobData = {
  notificationId: string;
  userId: string;
  channels: {
    push?: boolean;
    email?: boolean;
    sms?: boolean;
  };
  payload: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
    actionUrl?: string;
  };
  type: NotificationType;
};

// File processing job data
export type FileProcessingJobData = {
  fileId: string;
  userId: string;
  operation: 'thumbnail' | 'compress' | 'resize' | 'blur-check';
  options?: {
    width?: number;
    height?: number;
    quality?: number;
  };
};

// Content review job data
export type ContentReviewJobData = {
  contentId: string;
  contentType: 'profile_bio' | 'review_comment' | 'message' | 'photo';
  content: string;
  userId: string;
};

// Payment job data
export type PaymentJobData = {
  paymentId: string;
  operation: 'fraud-check' | 'earnings-release' | 'refund';
  data?: Record<string, unknown>;
};

// ZNS (Zalo Notification Service) job data
export type ZnsJobData = {
  phoneNumber: string;
  templateId: string;
  templateData: Record<string, string>;
  userId?: string;
};

// Scheduled job data
export type ScheduledJobData = {
  type: 'booking-reminder' | 'payment-release' | 'cleanup' | 'stats-calculation';
  targetId?: string;
  data?: Record<string, unknown>;
};

// Union type for all job data
export type JobData =
  | NotificationJobData
  | FileProcessingJobData
  | ContentReviewJobData
  | PaymentJobData
  | ZnsJobData
  | ScheduledJobData;
