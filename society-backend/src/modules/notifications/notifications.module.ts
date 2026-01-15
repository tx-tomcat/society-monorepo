import { Module } from '@nestjs/common';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsService } from './services/notifications.service';
import { PushService } from './services/push.service';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    PushService,
    EmailService,
    SmsService,
  ],
  exports: [
    NotificationsService,
    PushService,
    EmailService,
    SmsService,
  ],
})
export class NotificationsModule {}
