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
  GetRecommendationsDto,
  GetTeaserDto,
} from '../dto/get-recommendations.dto';
import { TrackInteractionDto } from '../dto/track-interaction.dto';
import { RecommendationsResult, RecommendationsService } from '../services/recommendations.service';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  private readonly logger = new Logger(RecommendationsController.name);

  constructor(
    private recommendationsService: RecommendationsService,
    private membershipService: MembershipService,
  ) { }

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
