import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CreateBookingDto,
  DeclineBookingDto,
  DisputeReviewDto,
  EditReviewDto,
  EmergencyCancellationDto,
  GetBookingRequestsQueryDto,
  GetBookingsQueryDto,
  SubmitReviewDto,
  UpdateBookingStatusDto,
  UpdateLocationDto,
} from '../dto/booking.dto';
import { BookingsService } from '../services/bookings.service';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) { }

  /**
   * Create a new booking (Hirer)
   */
  @Post()
  async createBooking(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(userId, dto);
  }

  /**
   * Get hirer's bookings
   */
  @Get('hirer')
  async getHirerBookings(
    @CurrentUser('id') userId: string,
    @Query() query: GetBookingsQueryDto,
  ) {
    return this.bookingsService.getHirerBookings(userId, query);
  }

  /**
   * Get companion's bookings
   */
  @Get('companion')
  async getCompanionBookings(
    @CurrentUser('id') userId: string,
    @Query() query: GetBookingsQueryDto,
  ) {
    return this.bookingsService.getCompanionBookings(userId, query);
  }

  /**
   * Get pending booking requests (Companion)
   */
  @Get('companion/requests')
  async getBookingRequests(
    @CurrentUser('id') userId: string,
    @Query() query: GetBookingRequestsQueryDto,
  ) {
    return this.bookingsService.getBookingRequests(userId, query);
  }

  /**
   * Get companion schedule
   */
  @Get('companion/schedule')
  async getCompanionSchedule(
    @CurrentUser('id') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.bookingsService.getCompanionSchedule(userId, startDate, endDate);
  }

  /**
   * Get booking detail
   */
  @Get(':bookingId')
  async getBookingDetail(
    @Param('bookingId') bookingId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookingsService.getBookingDetail(bookingId, userId);
  }

  /**
   * Update booking status
   */
  @Put(':bookingId/status')
  async updateBookingStatus(
    @Param('bookingId') bookingId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateBookingStatus(bookingId, userId, dto);
  }

  /**
   * Submit review (Hirer)
   */
  @Post(':bookingId/review')
  async submitReview(
    @Param('bookingId') bookingId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitReviewDto,
  ) {
    return this.bookingsService.submitReview(bookingId, userId, dto);
  }

  /**
   * Edit review (Hirer only)
   * Must be done within 24 hours of review creation
   */
  @Put('reviews/:reviewId')
  async editReview(
    @Param('reviewId') reviewId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: EditReviewDto,
  ) {
    return this.bookingsService.editReview(reviewId, userId, dto);
  }

  /**
   * Update booking location (for tracking)
   */
  @Post(':bookingId/location')
  async updateBookingLocation(
    @Param('bookingId') bookingId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.bookingsService.updateBookingLocation(bookingId, userId, dto);
  }

  /**
   * Decline a pending booking request (Companion only)
   */
  @Post(':bookingId/decline')
  @HttpCode(HttpStatus.OK)
  async declineBooking(
    @Param('bookingId') bookingId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: DeclineBookingDto,
  ) {
    return this.bookingsService.declineBooking(bookingId, userId, dto.reason);
  }

  /**
   * Dispute a review (Companion only)
   * Must be done within 7 days of review creation
   */
  @Post('reviews/:reviewId/dispute')
  @HttpCode(HttpStatus.OK)
  async disputeReview(
    @Param('reviewId') reviewId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: DisputeReviewDto,
  ) {
    return this.bookingsService.disputeReview(reviewId, userId, dto);
  }

  /**
   * Check if a review can be disputed (for UI)
   */
  @Get('reviews/:reviewId/can-dispute')
  async canDisputeReview(
    @Param('reviewId') reviewId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookingsService.canDisputeReview(reviewId, userId);
  }

  /**
   * Emergency cancellation (both hirer and companion)
   * Special handling for medical/family emergencies
   */
  @Post(':bookingId/emergency-cancel')
  @HttpCode(HttpStatus.OK)
  async emergencyCancellation(
    @Param('bookingId') bookingId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: EmergencyCancellationDto,
  ) {
    return this.bookingsService.emergencyCancellation(bookingId, userId, dto);
  }

  /**
   * Get user's emergency cancellation history
   */
  @Get('emergency-cancellations/history')
  async getEmergencyCancellationHistory(@CurrentUser('id') userId: string) {
    return this.bookingsService.getEmergencyCancellationHistory(userId);
  }
}
