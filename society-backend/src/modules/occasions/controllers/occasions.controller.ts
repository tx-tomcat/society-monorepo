import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/enums/roles.enum';
import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CreateHolidayDto,
  CreateOccasionDto,
  HolidayDto,
  OccasionDetailDto,
  OccasionDto,
  OccasionEventType,
  OccasionMetricsDto,
  OccasionsResponseDto,
  TrackOccasionBatchDto,
  TrackOccasionInteractionDto,
  UpdateHolidayDto,
  UpdateOccasionDto,
} from '../dto/occasion.dto';
import { OccasionTrackingService } from '../services/occasion-tracking.service';
import { OccasionsService } from '../services/occasions.service';

@Controller('occasions')
@UseGuards(JwtAuthGuard)
export class OccasionsController {
  private readonly logger = new Logger(OccasionsController.name);

  constructor(
    private readonly occasionsService: OccasionsService,
    private readonly trackingService: OccasionTrackingService,
  ) { }

  /**
   * GET /occasions
   * Get contextual occasions based on current time, day, and holidays
   * Public endpoint - no auth required
   */
  @Public()
  @Get()
  async getContextualOccasions(
    @Headers('accept-language') acceptLanguage?: string,
    @Query('timezone') timezone?: string,
  ): Promise<OccasionsResponseDto> {
    const language = this.parseLanguage(acceptLanguage);
    return this.occasionsService.getContextualOccasions(
      language,
      timezone || 'Asia/Ho_Chi_Minh',
    );
  }

  /**
   * GET /occasions/all
   * Get all active occasions without context filtering
   * Public endpoint - no auth required
   */
  @Public()
  @Get('all')
  async getAllOccasions(
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<OccasionDto[]> {
    const language = this.parseLanguage(acceptLanguage);
    return this.occasionsService.getAllOccasions(language);
  }

  /**
   * GET /occasions/:id
   * Get a specific occasion by ID
   */
  @Public()
  @Get(':id')
  async getOccasionById(@Param('id') id: string): Promise<OccasionDetailDto> {
    return this.occasionsService.getOccasionById(id);
  }

  // ==================== Tracking Endpoints ====================

  /**
   * POST /occasions/track
   * Track a single occasion interaction (fire-and-forget)
   * Supports both authenticated and anonymous tracking
   */
  @Public()
  @Post('track')
  trackInteraction(
    @Body() dto: TrackOccasionInteractionDto,
    @CurrentUser('id') userId?: string,
  ): { success: boolean } {
    // Fire-and-forget: Don't await - respond immediately
    this.trackingService.trackInteraction(userId ?? null, dto).catch((error) => {
      this.logger.warn(
        `Failed to track occasion interaction: occasionId=${dto.occasionId}`,
        error instanceof Error ? error.stack : String(error),
      );
    });
    return { success: true };
  }

  /**
   * POST /occasions/track/batch
   * Track multiple occasion views at once (fire-and-forget)
   * Used when displaying occasion list
   */
  @Public()
  @Post('track/batch')
  trackBatch(
    @Body() dto: TrackOccasionBatchDto,
    @CurrentUser('id') userId?: string,
  ): { success: boolean } {
    // Fire-and-forget: Don't await - respond immediately
    this.trackingService.trackBatch(userId ?? null, dto).catch((error) => {
      this.logger.warn(
        `Failed to track batch occasion interactions: count=${dto.occasionIds.length}`,
        error instanceof Error ? error.stack : String(error),
      );
    });
    return { success: true };
  }

  // ==================== Admin Endpoints ====================

  /**
   * GET /occasions/admin/list
   * List all occasions (admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/list')
  async listAllOccasions(): Promise<OccasionDetailDto[]> {
    return this.occasionsService.listAllOccasions();
  }

  /**
   * POST /occasions/admin
   * Create a new occasion (admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin')
  async createOccasion(
    @Body() dto: CreateOccasionDto,
  ): Promise<OccasionDetailDto> {
    return this.occasionsService.createOccasion(dto);
  }

  /**
   * PATCH /occasions/admin/:id
   * Update an occasion (admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('admin/:id')
  async updateOccasion(
    @Param('id') id: string,
    @Body() dto: UpdateOccasionDto,
  ): Promise<OccasionDetailDto> {
    return this.occasionsService.updateOccasion(id, dto);
  }

  /**
   * DELETE /occasions/admin/:id
   * Delete an occasion (admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('admin/:id')
  async deleteOccasion(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.occasionsService.deleteOccasion(id);
    return { success: true };
  }

  /**
   * GET /occasions/admin/metrics
   * Get occasion usage metrics (admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/metrics')
  async getMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<OccasionMetricsDto[]> {
    return this.trackingService.getMetrics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  /**
   * GET /occasions/admin/top
   * Get top occasions by usage (admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/top')
  async getTopOccasions(
    @Query('limit') limit?: string,
    @Query('eventType') eventType?: OccasionEventType,
    @Query('days') days?: string,
  ): Promise<{ occasionId: string; code: string; name: string; count: number }[]> {
    return this.trackingService.getTopOccasions(
      limit ? parseInt(limit, 10) : 10,
      eventType ?? 'BOOKING_CREATED',
      days ? parseInt(days, 10) : 30,
    );
  }

  // ==================== Helper Methods ====================

  private parseLanguage(acceptLanguage?: string): 'en' | 'vi' {
    if (!acceptLanguage) return 'vi';
    return acceptLanguage.toLowerCase().startsWith('en') ? 'en' : 'vi';
  }
}

@Controller('holidays')
export class HolidaysController {
  constructor(private readonly occasionsService: OccasionsService) { }

  // ==================== Admin Endpoints ====================

  /**
   * GET /holidays/admin/list
   * List all holidays (admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/list')
  async listAllHolidays(): Promise<HolidayDto[]> {
    return this.occasionsService.listAllHolidays();
  }

  /**
   * POST /holidays/admin
   * Create a new holiday (admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin')
  async createHoliday(@Body() dto: CreateHolidayDto): Promise<HolidayDto> {
    return this.occasionsService.createHoliday(dto);
  }

  /**
   * PATCH /holidays/admin/:id
   * Update a holiday (admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('admin/:id')
  async updateHoliday(
    @Param('id') id: string,
    @Body() dto: UpdateHolidayDto,
  ): Promise<HolidayDto> {
    return this.occasionsService.updateHoliday(id, dto);
  }

  /**
   * DELETE /holidays/admin/:id
   * Delete a holiday (admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('admin/:id')
  async deleteHoliday(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.occasionsService.deleteHoliday(id);
    return { success: true };
  }
}
