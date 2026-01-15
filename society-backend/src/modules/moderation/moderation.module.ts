import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { ContentReviewService } from './services/content-review.service';
import { ModerationService } from './services/moderation.service';
import { ModerationController, ModerationAdminController } from './controllers/moderation.controller';
import { AppealsController } from './controllers/appeals.controller';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [
    ModerationController,
    ModerationAdminController,
    AppealsController,
  ],
  providers: [ContentReviewService, ModerationService],
  exports: [ModerationService, ContentReviewService],
})
export class ModerationModule {}
