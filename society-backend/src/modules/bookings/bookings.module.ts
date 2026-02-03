import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BookingsController } from './controllers/bookings.controller';
import { BookingsService } from './services/bookings.service';
import { BookingReviewsService } from './services/booking-reviews.service';
import { BookingCancellationService } from './services/booking-cancellation.service';
import { BookingScheduleService } from './services/booking-schedule.service';
import { BookingTasks } from './tasks/booking.tasks';
import { ModerationModule } from '../moderation/moderation.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OccasionsModule } from '../occasions/occasions.module';
import { PlatformConfigModule } from '../config/config.module';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [
    ConfigModule,
    ModerationModule,
    NotificationsModule,
    OccasionsModule,
    PlatformConfigModule,
    SecurityModule,
  ],
  controllers: [BookingsController],
  providers: [
    BookingsService,
    BookingReviewsService,
    BookingCancellationService,
    BookingScheduleService,
    BookingTasks,
  ],
  exports: [
    BookingsService,
    BookingReviewsService,
    BookingCancellationService,
    BookingScheduleService,
  ],
})
export class BookingsModule {}
