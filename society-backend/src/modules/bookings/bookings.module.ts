import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BookingsController } from './controllers/bookings.controller';
import { BookingsService } from './services/bookings.service';
import { BookingTasks } from './tasks/booking.tasks';
import { ModerationModule } from '../moderation/moderation.module';
import { OccasionsModule } from '../occasions/occasions.module';

@Module({
  imports: [ConfigModule, ModerationModule, OccasionsModule],
  controllers: [BookingsController],
  providers: [BookingsService, BookingTasks],
  exports: [BookingsService],
})
export class BookingsModule {}
