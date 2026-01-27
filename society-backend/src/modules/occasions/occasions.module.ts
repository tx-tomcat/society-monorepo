import { Module } from '@nestjs/common';
import { OccasionsController, HolidaysController } from './controllers/occasions.controller';
import { OccasionsService } from './services/occasions.service';
import { OccasionTrackingService } from './services/occasion-tracking.service';

@Module({
  controllers: [OccasionsController, HolidaysController],
  providers: [OccasionsService, OccasionTrackingService],
  exports: [OccasionsService, OccasionTrackingService],
})
export class OccasionsModule {}
