import { Module } from '@nestjs/common';
import { CacheModule } from '../cache/cache.module';
import { MembershipModule } from '../membership/membership.module';
import { RecommendationsController } from './controllers/recommendations.controller';
import { RecommendationsService } from './services/recommendations.service';
import { ScoringService } from './services/scoring.service';

@Module({
  imports: [CacheModule, MembershipModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService, ScoringService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
