import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../queue.config';
import { NotificationJobData } from '../interfaces/job-data.interface';

@Injectable()
export class NotificationProducer {
  private readonly logger = new Logger(NotificationProducer.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.NOTIFICATION)
    private readonly notificationQueue: Queue<NotificationJobData>,
  ) {}

  /**
   * Enqueue a notification for async delivery
   */
  async enqueue(data: NotificationJobData): Promise<string> {
    const job = await this.notificationQueue.add('send', data, {
      priority: this.getPriority(data),
    });

    this.logger.debug(`Queued notification ${job.id} for user ${data.userId}`);
    return job.id!;
  }

  /**
   * Enqueue multiple notifications in bulk
   */
  async enqueueBulk(notifications: NotificationJobData[]): Promise<string[]> {
    const jobs = await this.notificationQueue.addBulk(
      notifications.map((data) => ({
        name: 'send',
        data,
        opts: { priority: this.getPriority(data) },
      })),
    );

    this.logger.debug(`Queued ${jobs.length} notifications in bulk`);
    return jobs.map((job) => job.id!);
  }

  /**
   * Schedule a notification for later delivery
   */
  async scheduleNotification(
    data: NotificationJobData,
    delayMs: number,
  ): Promise<string> {
    const job = await this.notificationQueue.add('send', data, {
      delay: delayMs,
      priority: this.getPriority(data),
    });

    this.logger.debug(
      `Scheduled notification ${job.id} for user ${data.userId} in ${delayMs}ms`,
    );
    return job.id!;
  }

  /**
   * Determine job priority based on notification type
   * Lower number = higher priority
   */
  private getPriority(data: NotificationJobData): number {
    // Payment and booking confirmations are highest priority
    if (
      data.type === 'PAYMENT_RECEIVED' ||
      data.type === 'BOOKING_CONFIRMED' ||
      data.type === 'BOOKING_REQUEST'
    ) {
      return 1;
    }

    // Messages and reminders are medium priority
    if (data.type === 'NEW_MESSAGE' || data.type === 'BOOKING_REMINDER') {
      return 2;
    }

    // Everything else is normal priority
    return 3;
  }
}
