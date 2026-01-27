import { Module, forwardRef } from '@nestjs/common';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsService } from './services/notifications.service';
import { NotificationDeliveryService } from './services/notification-delivery.service';
import { PushService } from './services/push.service';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    // Import QueueModule to get NotificationProducer (optional dependency)
    forwardRef(() => QueueModule),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationDeliveryService,
    PushService,
    EmailService,
    SmsService,
  ],
  exports: [
    NotificationsService,
    NotificationDeliveryService,
    PushService,
    EmailService,
    SmsService,
  ],
})
export class NotificationsModule {}
