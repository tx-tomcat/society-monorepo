import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES, QUEUE_CONFIGS } from '../queue.config';
import { NotificationJobData } from '../interfaces/job-data.interface';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  NotificationDeliveryService,
  UserWithSettings,
} from '../../notifications/services/notification-delivery.service';

@Processor(QUEUE_NAMES.NOTIFICATION, {
  concurrency: QUEUE_CONFIGS[QUEUE_NAMES.NOTIFICATION].concurrency,
})
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly deliveryService: NotificationDeliveryService,
  ) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    const { notificationId, userId, channels, payload } = job.data;

    this.logger.debug(`Processing notification ${notificationId} for user ${userId}`);

    // Get user with settings and push tokens
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        settings: true,
        pushTokens: { where: { isActive: true } },
      },
    });

    if (!user) {
      this.logger.warn(`User ${userId} not found for notification ${notificationId}`);
      return;
    }

    // Deliver to all enabled channels using shared delivery service
    const result = await this.deliveryService.deliverToChannels(
      user as UserWithSettings,
      channels,
      payload,
      notificationId,
    );

    this.logger.debug(
      `Notification ${notificationId} processed: ` +
        `attempted=${result.attemptedChannels}, ` +
        `success=${result.successfulChannels}, ` +
        `failed=${result.failedChannels}`,
    );

    // Track partial failures for retry logic
    if (result.failedChannels > 0 && result.successfulChannels > 0) {
      this.logger.warn(
        `Notification ${notificationId} had partial failure: ` +
          `${result.failedChannels}/${result.attemptedChannels} channels failed`,
      );
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<NotificationJobData>) {
    this.logger.debug(`Notification job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<NotificationJobData>, error: Error) {
    this.logger.error(`Notification job ${job.id} failed: ${error.message}`, error.stack);
  }
}
