import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { MembershipService } from '@/modules/membership/membership.service';
import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  GetFeedDto,
  GetRecommendationsDto,
  GetTeaserDto,
} from '../dto/get-recommendations.dto';
import { BatchTrackInteractionDto, TrackInteractionDto } from '../dto/track-interaction.dto';
import { RecommendationsResult, RecommendationsService } from '../services/recommendations.service';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  private readonly logger = new Logger(RecommendationsController.name);

  constructor(
    private recommendationsService: RecommendationsService,
    private membershipService: MembershipService,
  ) { }

  @Get('feed')
  async getFeed(
    @CurrentUser('id') userId: string,
    @Query() query: GetFeedDto,
  ): Promise<RecommendationsResult> {
    const benefits = await this.membershipService.getUserBenefits(userId);
    const photoLimit = benefits.forYouLimit;

    const excludeIds = query.excludeIds
      ? query.excludeIds.split(',').filter(Boolean)
      : [];

    const result = await this.recommendationsService.getFeed(
      userId,
      query.limit,
      excludeIds,
    );

    return {
      ...result,
      companions: result.companions.map((c) => ({
        ...c,
        companion: {
          ...c.companion,
          photos: c.companion.photos?.slice(0, photoLimit) ?? [],
        },
      })),
    };
  }

  @Post('interactions/batch')
  trackBatchInteractions(
    @CurrentUser('id') userId: string,
    @Body() dto: BatchTrackInteractionDto,
  ) {
    this.recommendationsService
      .trackBatch(userId, dto.sessionId, dto.events)
      .catch((error) => {
        this.logger.warn(
          `Failed to track batch interaction: userId=${userId}`,
          error.stack,
        );
      });
    return { success: true };
  }

  @Get('for-you')
  async getForYou(
    @CurrentUser('id') userId: string,
    @Query() query: GetRecommendationsDto,
  ): Promise<RecommendationsResult> {
    return this.recommendationsService.getForYou(
      userId,
      query.limit,
      query.offset,
    );
  }

  @Get('for-you/teaser')
  async getTeaser(
    @CurrentUser('id') userId: string,
    @Query() query: GetTeaserDto,
  ) {
    const benefits = await this.membershipService.getUserBenefits(userId);
    const limit = query.limit ?? benefits.forYouLimit;
    const companions = await this.recommendationsService.getTeaser(
      userId,
      limit,
    );
    return { companions };
  }

  @Post('interactions')
  trackInteraction(
    @CurrentUser('id') userId: string,
    @Body() dto: TrackInteractionDto,
  ) {
    // Fire-and-forget: Don't await - respond immediately to not block client UX
    this.recommendationsService.trackInteraction(userId, dto).catch((error) => {
      // Best-effort tracking - log but don't fail the request
      this.logger.warn(
        `Failed to track interaction: userId=${userId}, companionId=${dto.companionId}`,
        error.stack,
      );
    });
    return { success: true };
  }

  @Post('refresh')
  async refresh(@CurrentUser('id') userId: string) {
    await this.recommendationsService.refresh(userId);
    return { success: true };
  }
}
