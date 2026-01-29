import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { CompanionsService } from '../services/companions.service';
import { VnpayService } from '../../payments/services/vnpay.service';
import {
  BrowseCompanionsQueryDto,
  GetAvailabilityQueryDto,
  UpdateCompanionProfileDto,
  UpdateAvailabilityDto,
  AddPhotoDto,
  UpdateServicesDto,
  PurchaseBoostDto,
} from '../dto/companion.dto';

@Controller('companions')
export class CompanionsController {
  constructor(
    private readonly companionsService: CompanionsService,
    private readonly vnpayService: VnpayService,
  ) {}

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

  // ============================================
  // Profile Boost Endpoints
  // ============================================

  /**
   * Get boost pricing options (Public)
   */
  @Public()
  @Get('boosts/pricing')
  async getBoostPricing() {
    return {
      pricing: this.companionsService.getBoostPricing(),
    };
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
   * Creates a pending boost and returns payment URL for VNPay
   */
  @Post('me/boost')
  @UseGuards(JwtAuthGuard)
  async purchaseBoost(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: PurchaseBoostDto,
  ) {
    // Create pending boost
    const result = await this.companionsService.purchaseBoost(user.id, dto);

    // Generate payment URL via VNPay
    const paymentInit = await this.vnpayService.createPayment(
      `boost-${result.boostId}`, // Prefix with 'boost-' to identify in webhook
      result.price,
      `Profile Boost - ${dto.tier}`,
      dto.returnUrl,
    );

    return {
      ...result,
      paymentUrl: paymentInit.paymentUrl,
      paymentExpiresAt: paymentInit.expiresAt,
    };
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
}
