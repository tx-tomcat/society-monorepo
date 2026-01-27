import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QUEUE_NAMES, queueConfig } from './queue.config';
import { NotificationProducer } from './producers/notification.producer';
import { NotificationProcessor } from './processors/notification.processor';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forFeature(queueConfig),

    // Register BullMQ with Redis connection
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');

        if (!redisUrl) {
          throw new Error('REDIS_URL is required for queue functionality');
        }

        return {
          connection: {
            url: redisUrl,
          },
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 1000,
            },
            removeOnComplete: {
              count: 100,
              age: 24 * 60 * 60,
            },
            removeOnFail: {
              count: 500,
              age: 7 * 24 * 60 * 60,
            },
          },
        };
      },
      inject: [ConfigService],
    }),

    // Register individual queues (add others as they're implemented)
    BullModule.registerQueue(
      { name: QUEUE_NAMES.NOTIFICATION },
      // Future queues (implement producers/processors before enabling):
      // { name: QUEUE_NAMES.FILE_PROCESSING },
      // { name: QUEUE_NAMES.CONTENT_REVIEW },
      // { name: QUEUE_NAMES.PAYMENT },
      // { name: QUEUE_NAMES.ZNS },
      // { name: QUEUE_NAMES.SCHEDULED },
    ),

    // Import modules needed by processors (forwardRef for circular dependency)
    forwardRef(() => NotificationsModule),
  ],
  providers: [
    // Producers
    NotificationProducer,

    // Processors
    NotificationProcessor,
  ],
  exports: [
    BullModule,
    NotificationProducer,
  ],
})
export class QueueModule {}
