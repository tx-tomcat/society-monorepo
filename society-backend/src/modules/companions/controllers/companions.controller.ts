import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import {
  AddPhotoDto,
  BrowseCompanionsQueryDto,
  GetAvailabilityQueryDto,
  PurchaseBoostDto,
  SubmitPhotoVerificationDto,
  UpdateAvailabilityDto,
  UpdateCompanionProfileDto,
  UpdateServicesDto,
} from '../dto/companion.dto';
import { CompanionsService } from '../services/companions.service';

@Controller('companions')
export class CompanionsController {
  constructor(
    private readonly companionsService: CompanionsService,
  ) { }

  /**
   * Browse companions with filters (Public, but filters blocked users if authenticated)
   */
  @Public()
  @Get()
  async browseCompanions(
    @Query() query: BrowseCompanionsQueryDto,
    @CurrentUser() user?: CurrentUserData,
  ) {
    return this.companionsService.browseCompanions(query, user?.id);
  }

  // ============================================
  // "me" routes - MUST be defined before :companionId routes
  // ============================================

  /**
   * Get own companion profile (Protected)
   */
  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  async getMyCompanionProfile(@CurrentUser() user: CurrentUserData) {
    return this.companionsService.getMyCompanionProfile(user.id);
  }

  /**
   * Update companion profile (Protected)
   */
  @Put('me/profile')
  @UseGuards(JwtAuthGuard)
  async updateCompanionProfile(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateCompanionProfileDto,
  ) {
    return this.companionsService.updateCompanionProfile(user.id, dto);
  }

  /**
   * Get own availability (Protected)
   */
  @Get('me/availability')
  @UseGuards(JwtAuthGuard)
  async getMyAvailability(@CurrentUser() user: CurrentUserData) {
    return this.companionsService.getMyAvailability(user.id);
  }

  /**
   * Update availability (Protected)
   */
  @Put('me/availability')
  @UseGuards(JwtAuthGuard)
  async updateAvailability(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.companionsService.updateAvailability(user.id, dto);
  }

  /**
   * Add photo to profile (Protected)
   */
  @Post('me/photos')
  @UseGuards(JwtAuthGuard)
  async addPhoto(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: AddPhotoDto,
  ) {
    return this.companionsService.addPhoto(user.id, dto.url, dto.isPrimary);
  }

  /**
   * Set photo as primary (Protected)
   */
  @Patch('me/photos/:photoId/primary')
  @UseGuards(JwtAuthGuard)
  async setPrimaryPhoto(
    @CurrentUser() user: CurrentUserData,
    @Param('photoId', ParseUUIDPipe) photoId: string,
  ) {
    return this.companionsService.setPrimaryPhoto(user.id, photoId);
  }

  /**
   * Remove photo from profile (Protected)
   */
  @Delete('me/photos/:photoId')
  @UseGuards(JwtAuthGuard)
  async removePhoto(
    @CurrentUser() user: CurrentUserData,
    @Param('photoId', ParseUUIDPipe) photoId: string,
  ) {
    return this.companionsService.removePhoto(user.id, photoId);
  }

  /**
   * Update services offered (Protected)
   */
  @Put('me/services')
  @UseGuards(JwtAuthGuard)
  async updateServices(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateServicesDto,
  ) {
    const services = dto.services.map((s) => ({
      occasionId: s.occasionId,
      description: s.description,
      priceAdjustment: s.priceAdjustment,
      isEnabled: s.isEnabled,
    }));
    return this.companionsService.updateServices(user.id, services);
  }

  /**
   * Get active boost status (Protected)
   */
  @Get('me/boost')
  @UseGuards(JwtAuthGuard)
  async getActiveBoost(@CurrentUser() user: CurrentUserData) {
    const activeBoost = await this.companionsService.getActiveBoost(user.id);
    return {
      hasActiveBoost: !!activeBoost,
      boost: activeBoost,
    };
  }

  /**
   * Get boost history (Protected)
   */
  @Get('me/boost/history')
  @UseGuards(JwtAuthGuard)
  async getBoostHistory(
    @CurrentUser() user: CurrentUserData,
    @Query('limit') limit?: number,
  ) {
    const history = await this.companionsService.getBoostHistory(
      user.id,
      limit ? Number(limit) : 10,
    );
    return { history };
  }

  /**
   * Purchase a profile boost (Protected)
   * Creates a pending boost and returns QR payment data
   */
  @Post('me/boost')
  @UseGuards(JwtAuthGuard)
  async purchaseBoost(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: PurchaseBoostDto,
  ) {
    return this.companionsService.purchaseBoost(user.id, dto);
  }

  /**
   * Cancel an active boost (Protected)
   */
  @Delete('me/boost/:boostId')
  @UseGuards(JwtAuthGuard)
  async cancelBoost(
    @CurrentUser() user: CurrentUserData,
    @Param('boostId', ParseUUIDPipe) boostId: string,
  ) {
    return this.companionsService.cancelBoost(user.id, boostId);
  }

  // ============================================
  // Photo Verification
  // ============================================

  /**
   * Submit photo verification (Protected)
   */
  @Post('me/verification')
  @UseGuards(JwtAuthGuard)
  async submitPhotoVerification(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: SubmitPhotoVerificationDto,
  ) {
    return this.companionsService.submitPhotoVerification(user.id, dto);
  }

  /**
   * Get own verification status (Protected)
   */
  @Get('me/verification')
  @UseGuards(JwtAuthGuard)
  async getMyPhotoVerification(@CurrentUser() user: CurrentUserData) {
    return this.companionsService.getMyPhotoVerification(user.id);
  }

  // ============================================
  // Public routes with :companionId parameter
  // These MUST come after "me" routes to avoid "me" being matched as companionId
  // ============================================

  /**
   * Get boost pricing options (Public)
   */
  @Public()
  @Get('boosts/pricing')
  async getBoostPricing() {
    return {
      pricing: await this.companionsService.getBoostPricing(),
    };
  }

  /**
   * Get companion profile by ID (Public)
   */
  @Public()
  @Get(':companionId')
  async getCompanionProfile(
    @Param('companionId', ParseUUIDPipe) companionId: string,
  ) {
    return this.companionsService.getCompanionProfile(companionId);
  }

  /**
   * Get companion availability for date range (Public)
   */
  @Public()
  @Get(':companionId/availability')
  async getCompanionAvailability(
    @Param('companionId', ParseUUIDPipe) companionId: string,
    @Query() query: GetAvailabilityQueryDto,
  ) {
    return this.companionsService.getCompanionAvailability(
      companionId,
      query.startDate,
      query.endDate,
    );
  }

  /**
   * Get companion reviews (Public)
   */
  @Public()
  @Get(':companionId/reviews')
  async getCompanionReviews(
    @Param('companionId', ParseUUIDPipe) companionId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.companionsService.getCompanionReviews(
      companionId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }
}
