import { registerAs } from '@nestjs/config';

export const QUEUE_NAMES = {
  NOTIFICATION: 'notification',
  FILE_PROCESSING: 'file-processing',
  CONTENT_REVIEW: 'content-review',
  PAYMENT: 'payment',
  ZNS: 'zns',
  SCHEDULED: 'scheduled',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// Queue-specific configurations
export const QUEUE_CONFIGS: Record<QueueName, { concurrency: number; maxRetries: number }> = {
  [QUEUE_NAMES.NOTIFICATION]: { concurrency: 10, maxRetries: 3 },
  [QUEUE_NAMES.FILE_PROCESSING]: { concurrency: 5, maxRetries: 2 },
  [QUEUE_NAMES.CONTENT_REVIEW]: { concurrency: 3, maxRetries: 2 },
  [QUEUE_NAMES.PAYMENT]: { concurrency: 5, maxRetries: 3 },
  [QUEUE_NAMES.ZNS]: { concurrency: 5, maxRetries: 3 },
  [QUEUE_NAMES.SCHEDULED]: { concurrency: 2, maxRetries: 2 },
};

export const queueConfig = registerAs('queue', () => ({
  redis: {
    url: process.env.REDIS_URL,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 24 * 60 * 60, // Keep for 24 hours
    },
    removeOnFail: {
      count: 500, // Keep last 500 failed jobs for debugging
      age: 7 * 24 * 60 * 60, // Keep for 7 days
    },
  },
}));
