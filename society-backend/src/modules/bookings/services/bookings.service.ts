import { PlatformConfigService } from "@/modules/config/services/config.service";
import { ContentReviewService } from "@/modules/moderation/services/content-review.service";
import { NotificationsService } from "@/modules/notifications/services/notifications.service";
import { OccasionTrackingService } from "@/modules/occasions/services/occasion-tracking.service";
import { PrismaService } from "@/prisma/prisma.service";
import {
  BookingStatus,
  EarningsStatus,
  PaymentStatus,
  Prisma,
  ReportType,
  StrikeType,
} from "@generated/client";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  BookingDetailResponse,
  BookingListItem,
  BookingRequestItem,
  CreateBookingDto,
  DisputeReviewDto,
  EditReviewDto,
  EmergencyCancellationDto,
  GetBookingsQueryDto,
  ScheduleDay,
  SubmitReviewDto,
  UpdateBookingStatusDto,
  UpdateLocationDto,
} from "../dto/booking.dto";
import { BookingUtils } from "../utils/booking.utils";

// Booking frequency limits
const BOOKING_LIMITS = {
  DAILY: 5, // Max 5 bookings per day
  WEEKLY: 15, // Max 15 bookings per week
  WITH_SAME_COMPANION_DAILY: 2, // Max 2 bookings with same companion per day
} as const;

// Vietnamese holidays with surge pricing multipliers
// Format: { month-day: { name: string, surgeMultiplier: number } }
// Note: Lunar calendar holidays need dynamic calculation
const VIETNAM_HOLIDAYS: Record<
  string,
  { name: string; surgeMultiplier: number }
> = {
  "01-01": { name: "Tết Dương lịch (New Year)", surgeMultiplier: 0.5 }, // +50%
  "04-30": {
    name: "Ngày Giải phóng miền Nam (Reunification Day)",
    surgeMultiplier: 0.5,
  },
  "05-01": { name: "Ngày Quốc tế Lao động (Labour Day)", surgeMultiplier: 0.5 },
  "09-02": { name: "Ngày Quốc khánh (National Day)", surgeMultiplier: 0.75 }, // +75%
  "09-03": {
    name: "Ngày Quốc khánh (National Day observed)",
    surgeMultiplier: 0.75,
  },
  "12-24": { name: "Christmas Eve", surgeMultiplier: 0.5 },
  "12-25": { name: "Christmas Day", surgeMultiplier: 0.5 },
  "12-31": { name: "New Year's Eve", surgeMultiplier: 1.0 }, // +100%
  "02-14": { name: "Valentine's Day", surgeMultiplier: 0.75 }, // +75% (high demand)
};

// Lunar holidays (approximate ranges - should be updated yearly)
// Tết Nguyên Đán typically falls between late January and mid-February
const TET_HOLIDAY_RANGES: Array<{
  start: string;
  end: string;
  name: string;
  surgeMultiplier: number;
}> = [
    // 2025 Tết: Jan 28 - Feb 4
    {
      start: "2025-01-28",
      end: "2025-02-04",
      name: "Tết Nguyên Đán 2025",
      surgeMultiplier: 1.0,
    },
    // 2026 Tết: Feb 15 - Feb 22
    {
      start: "2026-02-15",
      end: "2026-02-22",
      name: "Tết Nguyên Đán 2026",
      surgeMultiplier: 1.0,
    },
    // Mid-Autumn Festival 2025 (approximate)
    {
      start: "2025-10-04",
      end: "2025-10-07",
      name: "Tết Trung thu 2025",
      surgeMultiplier: 0.5,
    },
    // Mid-Autumn Festival 2026 (approximate)
    {
      start: "2026-09-23",
      end: "2026-09-26",
      name: "Tết Trung thu 2026",
      surgeMultiplier: 0.5,
    },
  ];

// Auto-archive delay after booking completion (in days)
const AUTO_ARCHIVE_DELAY_DAYS = 7; // Archive conversations 7 days after completion

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);
  private supabase: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly contentReviewService: ContentReviewService,
    private readonly configService: ConfigService,
    private readonly occasionTrackingService: OccasionTrackingService,
    private readonly platformConfigService: PlatformConfigService,
    private readonly notificationsService: NotificationsService,
  ) {
    this.supabase = createClient(
      this.configService.get<string>("SUPABASE_URL")!,
      this.configService.get<string>("SUPABASE_SERVICE_KEY")!,
    );
  }

  /**
   * Generate booking number
   */
  private generateBookingNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `SOC-${year}-${random}`;
  }

  /**
   * Calculate refund amounts based on tiered cancellation policy
   * - Cancel >48h before: 100% refund to hirer
   * - Cancel 24-48h before: 50% refund to hirer, 50% earnings to companion
   * - Cancel <24h before: 0% refund, companion gets full earnings
   */
  private calculateRefundPolicy(booking: {
    startDatetime: Date;
    totalPrice: number;
    platformFee: number;
  }): {
    refundToHirer: number;
    releaseToCompanion: number;
    refundPercentage: number;
  } {
    const now = new Date();
    const hoursUntilStart =
      (booking.startDatetime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const companionEarnings = booking.totalPrice - booking.platformFee;

    if (hoursUntilStart > 48) {
      // Full refund to hirer
      return {
        refundToHirer: booking.totalPrice,
        releaseToCompanion: 0,
        refundPercentage: 100,
      };
    } else if (hoursUntilStart >= 24) {
      // 50% refund to hirer, 50% to companion
      return {
        refundToHirer: Math.round(booking.totalPrice * 0.5),
        releaseToCompanion: Math.round(companionEarnings * 0.5),
        refundPercentage: 50,
      };
    } else {
      // No refund, companion gets full earnings
      return {
        refundToHirer: 0,
        releaseToCompanion: companionEarnings,
        refundPercentage: 0,
      };
    }
  }

  /**
   * Check if phone number should be revealed
   * Phone numbers are only visible on the booking day (or during active/completed bookings)
   * Uses Vietnam Standard Time (UTC+7) for date comparison
   */
  private shouldRevealPhone(
    status: BookingStatus,
    startDatetime: Date,
  ): boolean {
    // Always show phone for active or completed bookings
    if (status === BookingStatus.ACTIVE || status === BookingStatus.COMPLETED) {
      return true;
    }

    // For confirmed bookings, only show on the booking day (Vietnam timezone UTC+7)
    if (status === BookingStatus.CONFIRMED) {
      const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7 in milliseconds

      // Get current time in Vietnam timezone
      const now = new Date();
      const vietnamNow = new Date(
        now.getTime() + VIETNAM_OFFSET_MS + now.getTimezoneOffset() * 60000,
      );

      // Get booking day in Vietnam timezone
      const bookingVietnam = new Date(
        startDatetime.getTime() +
        VIETNAM_OFFSET_MS +
        startDatetime.getTimezoneOffset() * 60000,
      );

      // Compare dates (ignoring time) in Vietnam timezone
      return (
        vietnamNow.getUTCFullYear() === bookingVietnam.getUTCFullYear() &&
        vietnamNow.getUTCMonth() === bookingVietnam.getUTCMonth() &&
        vietnamNow.getUTCDate() === bookingVietnam.getUTCDate()
      );
    }

    // Don't show for pending or cancelled bookings
    return false;
  }

  /**
   * Check booking frequency limits for a hirer
   * Prevents abuse and ensures fair access to companions
   */
  private async checkBookingFrequencyLimits(
    hirerId: string,
    companionId: string,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start of week (Sunday)

    // Count bookings created today (not cancelled)
    const dailyBookings = await this.prisma.booking.count({
      where: {
        hirerId,
        createdAt: { gte: startOfDay },
        status: { not: BookingStatus.CANCELLED },
      },
    });

    if (dailyBookings >= BOOKING_LIMITS.DAILY) {
      return {
        allowed: false,
        reason: `You have reached the maximum of ${BOOKING_LIMITS.DAILY} bookings per day. Please try again tomorrow.`,
      };
    }

    // Count bookings created this week
    const weeklyBookings = await this.prisma.booking.count({
      where: {
        hirerId,
        createdAt: { gte: startOfWeek },
        status: { not: BookingStatus.CANCELLED },
      },
    });

    if (weeklyBookings >= BOOKING_LIMITS.WEEKLY) {
      return {
        allowed: false,
        reason: `You have reached the maximum of ${BOOKING_LIMITS.WEEKLY} bookings per week. Please try again next week.`,
      };
    }

    // Count bookings with the same companion today
    const sameCompanionDaily = await this.prisma.booking.count({
      where: {
        hirerId,
        companionId,
        createdAt: { gte: startOfDay },
        status: { not: BookingStatus.CANCELLED },
      },
    });

    if (sameCompanionDaily >= BOOKING_LIMITS.WITH_SAME_COMPANION_DAILY) {
      return {
        allowed: false,
        reason: `You can only book the same companion ${BOOKING_LIMITS.WITH_SAME_COMPANION_DAILY} times per day. Please try again tomorrow.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Check if a date is a holiday and calculate surge multiplier
   * Returns holiday info with surge multiplier, or null if not a holiday
   */
  private getHolidaySurgeInfo(bookingDate: Date): {
    isHoliday: boolean;
    holidayName?: string;
    surgeMultiplier: number;
  } {
    // Format as MM-DD for fixed holidays
    const month = String(bookingDate.getMonth() + 1).padStart(2, "0");
    const day = String(bookingDate.getDate()).padStart(2, "0");
    const dateKey = `${month}-${day}`;

    // Check fixed holidays
    const fixedHoliday = VIETNAM_HOLIDAYS[dateKey];
    if (fixedHoliday) {
      return {
        isHoliday: true,
        holidayName: fixedHoliday.name,
        surgeMultiplier: fixedHoliday.surgeMultiplier,
      };
    }

    // Check lunar holiday ranges
    const dateStr = bookingDate.toISOString().split("T")[0];
    for (const range of TET_HOLIDAY_RANGES) {
      if (dateStr >= range.start && dateStr <= range.end) {
        return {
          isHoliday: true,
          holidayName: range.name,
          surgeMultiplier: range.surgeMultiplier,
        };
      }
    }

    // Not a holiday
    return { isHoliday: false, surgeMultiplier: 0 };
  }

  /**
   * Schedule auto-archive of conversation after booking completion
   * Archives conversations 7 days after completion to allow for post-booking communication
   */
  private async scheduleConversationArchive(
    hirerId: string,
    companionId: string,
    bookingId: string,
  ): Promise<void> {
    // Calculate archive date (7 days from now)
    const archiveAt = new Date(
      Date.now() + AUTO_ARCHIVE_DELAY_DAYS * 24 * 60 * 60 * 1000,
    );

    this.logger.log(
      `Scheduling conversation archive for booking ${bookingId} between ${hirerId} and ${companionId} at ${archiveAt.toISOString()}`,
    );

    // Update the conversation to set archive_at timestamp
    // This allows a cron job or scheduled task to archive conversations when the time comes
    // Conversations are in Supabase, so we update them directly
    const { error } = await this.supabase
      .from("conversations")
      .update({ archive_at: archiveAt.toISOString() })
      .or(
        `and(participant1_id.eq.${hirerId},participant2_id.eq.${companionId}),and(participant1_id.eq.${companionId},participant2_id.eq.${hirerId})`,
      );

    if (error) {
      this.logger.error(
        `Failed to schedule conversation archive: ${error.message}`,
      );
      throw new Error(
        `Failed to schedule conversation archive: ${error.message}`,
      );
    }

    this.logger.log(
      `Successfully scheduled conversation archive for booking ${bookingId}`,
    );
  }

  /**
   * Create earning record for companion (fire-and-forget)
   */
  private async createEarningForBooking(
    bookingId: string,
    companionUserId: string,
    totalPrice: number,
  ): Promise<void> {
    const companionProfile = await this.prisma.companionProfile.findUnique({
      where: { userId: companionUserId },
      select: { id: true },
    });

    if (!companionProfile) {
      this.logger.error(`Companion profile not found for user ${companionUserId}`);
      return;
    }

    // Get platform fee from config (stored as decimal, e.g., 0.18 = 18%)
    const platformConfig = await this.platformConfigService.getPlatformConfig();
    const platformFee = Math.floor(totalPrice * platformConfig.platformFeePercent);
    const netAmount = totalPrice - platformFee;

    await this.prisma.earning.create({
      data: {
        companionId: companionProfile.id,
        bookingId,
        grossAmount: totalPrice,
        platformFee,
        netAmount,
        status: EarningsStatus.AVAILABLE,
        releasedAt: new Date(),
      },
    });

    this.logger.log(`Earning created for booking ${bookingId}, companion profile ${companionProfile.id}`);
  }

  /**
   * Create a new booking (Hirer)
   * Uses serializable transaction to prevent double-booking race conditions
   */
  async createBooking(hirerId: string, dto: CreateBookingDto) {
    // Validate hirer exists (outside transaction for fast fail)
    const hirer = await this.prisma.user.findUnique({
      where: { id: hirerId },
      include: { hirerProfile: true },
    });

    if (!hirer) {
      throw new NotFoundException("User not found");
    }

    // Ensure hirer profile exists (use upsert to handle race conditions)
    if (!hirer.hirerProfile) {
      await this.prisma.hirerProfile.upsert({
        where: { userId: hirerId },
        create: { userId: hirerId },
        update: {},
      });
    }

    // Get companion - dto.companionId is the userId of the companion
    const companion = await this.prisma.user.findUnique({
      where: { id: dto.companionId },
      include: { companionProfile: true },
    });

    if (!companion || !companion.companionProfile) {
      throw new NotFoundException("Companion not found");
    }

    const companionProfile = companion.companionProfile;

    if (!companionProfile.isActive) {
      throw new BadRequestException("Companion is not available");
    }

    // Check booking frequency limits (outside transaction for fast fail)
    const frequencyCheck = await this.checkBookingFrequencyLimits(
      hirerId,
      dto.companionId,
    );
    if (!frequencyCheck.allowed) {
      throw new BadRequestException(frequencyCheck.reason);
    }

    const startDatetime = new Date(dto.startDatetime);
    const endDatetime = new Date(dto.endDatetime);

    // Calculate duration
    const durationMs = endDatetime.getTime() - startDatetime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);

    if (durationHours <= 0) {
      throw new BadRequestException("Invalid time range");
    }

    // Calculate pricing using platform config
    const platformConfig = await this.platformConfigService.getPlatformConfig();
    const basePrice = Math.round(companionProfile.hourlyRate * durationHours);
    const platformFee = Math.round(
      basePrice * platformConfig.platformFeePercent,
    );

    // Calculate surge fee for same-day bookings (<24h before start)
    const hoursUntilStart =
      (startDatetime.getTime() - Date.now()) / (1000 * 60 * 60);
    let surgeFee = hoursUntilStart < 24 ? Math.round(basePrice * 0.3) : 0; // +30% surge for <24h

    // Calculate holiday surge pricing (+50% to +100%)
    const holidayInfo = this.getHolidaySurgeInfo(startDatetime);
    let holidaySurgeFee = 0;
    if (holidayInfo.isHoliday && holidayInfo.surgeMultiplier > 0) {
      holidaySurgeFee = Math.round(basePrice * holidayInfo.surgeMultiplier);
      this.logger.log(
        `Holiday surge applied: ${holidayInfo.holidayName} (+${holidayInfo.surgeMultiplier * 100}%) = ${holidaySurgeFee} VND`,
      );
    }

    // Total surge is the sum of same-day and holiday surges
    surgeFee = surgeFee + holidaySurgeFee;
    const totalPrice = basePrice + platformFee + surgeFee;

    // Use serializable transaction to prevent double-booking race conditions
    // This ensures atomic check-and-insert: if two requests come in simultaneously,
    // one will succeed and the other will fail with a conflict error
    try {
      const booking = await this.prisma.$transaction(
        async (tx) => {
          // Check for overlapping bookings inside transaction (atomic with insert)
          const overlappingBooking = await tx.booking.findFirst({
            where: {
              companionId: dto.companionId,
              status: {
                in: [
                  BookingStatus.PENDING,
                  BookingStatus.CONFIRMED,
                  BookingStatus.ACTIVE,
                ],
              },
              OR: [
                {
                  // New booking starts during an existing booking
                  startDatetime: { lte: startDatetime },
                  endDatetime: { gt: startDatetime },
                },
                {
                  // New booking ends during an existing booking
                  startDatetime: { lt: endDatetime },
                  endDatetime: { gte: endDatetime },
                },
                {
                  // New booking completely contains an existing booking
                  startDatetime: { gte: startDatetime },
                  endDatetime: { lte: endDatetime },
                },
              ],
            },
          });

          if (overlappingBooking) {
            throw new ConflictException(
              "Companion is not available for this time slot. Please choose a different time.",
            );
          }

          // Create booking atomically with overlap check
          return tx.booking.create({
            data: {
              bookingNumber: this.generateBookingNumber(),
              hirerId,
              companionId: dto.companionId,
              status: BookingStatus.PENDING,
              occasionId: dto.occasionId,
              startDatetime,
              endDatetime,
              durationHours,
              locationAddress: dto.locationAddress,
              locationLat: dto.locationLat,
              locationLng: dto.locationLng,
              specialRequests: dto.specialRequests,
              basePrice,
              platformFee,
              surgeFee,
              totalPrice,
              paymentStatus: PaymentStatus.PENDING,
              requestExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours to respond
            },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000, // 5 seconds max wait for transaction slot
          timeout: 10000, // 10 seconds timeout for transaction
        },
      );

      // Track occasion usage (fire-and-forget - don't block response)
      if (dto.occasionId) {
        this.occasionTrackingService
          .trackBookingCreated(hirerId, dto.occasionId, booking.id)
          .catch((err) =>
            this.logger.warn(
              `Failed to track occasion usage for booking ${booking.id}`,
              err instanceof Error ? err.stack : err,
            ),
          );
      }

      // Send push notification to companion about new booking request
      this.notificationsService
        .notifyBookingRequest(dto.companionId, hirer.fullName, booking.id)
        .catch((err) =>
          this.logger.warn(
            `Failed to send booking request notification: ${err.message}`,
          ),
        );

      return {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        totalPrice: booking.totalPrice,
        message: "Booking request sent successfully",
      };
    } catch (error) {
      // Handle serialization failures (concurrent booking attempts)
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034" // Transaction conflict / serialization failure
      ) {
        this.logger.warn(
          `Double-booking prevented for companion ${dto.companionId}`,
        );
        throw new ConflictException(
          "This time slot was just booked by another user. Please choose a different time.",
        );
      }
      throw error;
    }
  }

  /**
   * Get hirer's bookings
   */
  async getHirerBookings(
    hirerId: string,
    query: GetBookingsQueryDto,
  ): Promise<{
    bookings: BookingListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { status, page = 1, limit = 20 } = query;

    const where: Prisma.BookingWhereInput = {
      hirerId,
    };

    // Support multiple statuses (array)
    if (status && status.length > 0) {
      where.status = status.length === 1 ? status[0] : { in: status };
    }

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          occasion: {
            select: { id: true, code: true, emoji: true, nameEn: true },
          },
          companion: {
            select: {
              id: true,
              companionProfile: {
                select: {
                  id: true,
                  displayName: true,
                  ratingAvg: true,
                  ratingCount: true,
                  photos: {
                    orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
                    select: { id: true, url: true, isPrimary: true, position: true },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    const bookingList: BookingListItem[] = bookings.map((b) => ({
      id: b.id,
      bookingNumber: b.bookingNumber,
      status: b.status,
      paymentStatus: b.paymentStatus,
      occasion: BookingUtils.mapOccasion(b.occasion),
      startDatetime: b.startDatetime instanceof Date ? b.startDatetime.toISOString() : String(b.startDatetime),
      endDatetime: b.endDatetime instanceof Date ? b.endDatetime.toISOString() : String(b.endDatetime),
      durationHours: Number(b.durationHours),
      locationAddress: b.locationAddress,
      totalPrice: b.totalPrice,
      createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : String(b.createdAt),
      companion: b.companion?.companionProfile
        ? {
          id: b.companion.companionProfile.id,
          userId: b.companion.id,
          displayName: b.companion.companionProfile.displayName || "Anonymous",
          avatar: b.companion.companionProfile.photos[0]?.url || null,
          photos: b.companion.companionProfile.photos,
          rating: Number(b.companion.companionProfile.ratingAvg),
          reviewCount: b.companion.companionProfile.ratingCount || 0,
        }
        : undefined,
    }));

    return {
      bookings: bookingList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get companion's bookings
   */
  async getCompanionBookings(
    companionUserId: string,
    query: GetBookingsQueryDto,
  ): Promise<{
    bookings: BookingListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { status, page = 1, limit = 20 } = query;

    const where: Prisma.BookingWhereInput = {
      companionId: companionUserId,
    };

    // Support multiple statuses (array)
    if (status && status.length > 0) {
      where.status = status.length === 1 ? status[0] : { in: status };
    }

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          occasion: {
            select: { id: true, code: true, emoji: true, nameEn: true },
          },
          hirer: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              hirerProfile: {
                select: { ratingAvg: true },
              },
              memberships: {
                where: { status: 'ACTIVE', expiresAt: { gt: new Date() } },
                take: 1,
                select: { tier: true },
              },
            },
          },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    // Priority sort: Gold/Platinum hirers' pending requests appear first
    if (!status || status.length === 0 || status.includes('PENDING' as any)) {
      bookings.sort((a, b) => {
        const tierOrder = { PLATINUM: 2, GOLD: 1 } as Record<string, number>;
        const aPriority = tierOrder[a.hirer?.memberships?.[0]?.tier as string] || 0;
        const bPriority = tierOrder[b.hirer?.memberships?.[0]?.tier as string] || 0;
        if (aPriority !== bPriority) return bPriority - aPriority;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    const bookingList: BookingListItem[] = bookings.map((b) => ({
      id: b.id,
      bookingNumber: b.bookingNumber,
      status: b.status,
      paymentStatus: b.paymentStatus,
      occasion: BookingUtils.mapOccasion(b.occasion),
      startDatetime: b.startDatetime instanceof Date ? b.startDatetime.toISOString() : String(b.startDatetime),
      endDatetime: b.endDatetime instanceof Date ? b.endDatetime.toISOString() : String(b.endDatetime),
      durationHours: Number(b.durationHours),
      locationAddress: b.locationAddress,
      totalPrice: b.totalPrice,
      createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : String(b.createdAt),
      hirer: b.hirer
        ? {
          id: b.hirer.id,
          displayName: b.hirer.fullName,
          avatar: b.hirer.avatarUrl,
          rating: b.hirer.hirerProfile
            ? Number(b.hirer.hirerProfile.ratingAvg)
            : 5,
          membershipTier: b.hirer.memberships?.[0]?.tier || null,
        }
        : undefined,
    }));

    return {
      bookings: bookingList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get booking detail
   */
  async getBookingDetail(
    bookingId: string,
    userId: string,
  ): Promise<BookingDetailResponse> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        occasion: {
          select: { id: true, code: true, emoji: true, nameEn: true },
        },
        companion: {
          select: {
            id: true,
            phone: true,
            companionProfile: {
              select: {
                id: true,
                displayName: true,
                ratingAvg: true,
                ratingCount: true,
                verificationStatus: true,
                photos: {
                  orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
                  select: { id: true, url: true, isPrimary: true, position: true },
                },
              },
            },
          },
        },
        hirer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            avatarUrl: true,
            hirerProfile: {
              select: { ratingAvg: true },
            },
          },
        },
        reviews: {
          where: { reviewerId: userId },
          take: 1,
          select: {
            id: true,
            rating: true,
            comment: true,
            tags: true,
            createdAt: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    // Check if user has access to this booking
    const isHirer = booking.hirerId === userId;
    const isCompanion = booking.companionId === userId;

    if (!isHirer && !isCompanion) {
      throw new ForbiddenException("Access denied");
    }

    const companionProfile = booking.companion.companionProfile;
    const review = booking.reviews[0];

    // Handle cached date strings (cache proxy may return strings instead of Date objects)
    const startDatetime = booking.startDatetime instanceof Date
      ? booking.startDatetime
      : new Date(booking.startDatetime);
    const endDatetime = booking.endDatetime instanceof Date
      ? booking.endDatetime
      : new Date(booking.endDatetime);

    return {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      occasion: BookingUtils.mapOccasion(booking.occasion),
      startDatetime: startDatetime.toISOString(),
      endDatetime: endDatetime.toISOString(),
      durationHours: Number(booking.durationHours),
      locationAddress: booking.locationAddress,
      locationLat: booking.locationLat ? Number(booking.locationLat) : null,
      locationLng: booking.locationLng ? Number(booking.locationLng) : null,
      specialRequests: booking.specialRequests,
      basePrice: booking.basePrice,
      platformFee: booking.platformFee,
      surgeFee: booking.surgeFee,
      totalPrice: booking.totalPrice,
      paymentStatus: booking.paymentStatus,
      companion: {
        id: companionProfile?.id || "",
        userId: booking.companion.id,
        displayName: companionProfile?.displayName || "Anonymous",
        avatar: companionProfile?.photos[0]?.url || null,
        photos: companionProfile?.photos || [],
        rating: companionProfile ? Number(companionProfile.ratingAvg) : 0,
        reviewCount: companionProfile?.ratingCount || 0,
        isVerified: companionProfile?.verificationStatus === "VERIFIED",
        phone:
          isHirer &&
            this.shouldRevealPhone(booking.status, startDatetime)
            ? booking.companion.phone
            : null,
      },
      hirer: {
        id: booking.hirer.id,
        displayName: booking.hirer.fullName,
        avatar: booking.hirer.avatarUrl,
        rating: booking.hirer.hirerProfile
          ? Number(booking.hirer.hirerProfile.ratingAvg)
          : 5,
        phone:
          isCompanion &&
            this.shouldRevealPhone(booking.status, startDatetime)
            ? booking.hirer.phone
            : null,
      },
      review: review
        ? {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          tags: review.tags,
          createdAt: review.createdAt instanceof Date
            ? review.createdAt.toISOString()
            : String(review.createdAt),
        }
        : null,
      requestExpiresAt: booking.requestExpiresAt
        ? (booking.requestExpiresAt instanceof Date
          ? booking.requestExpiresAt.toISOString()
          : String(booking.requestExpiresAt))
        : null,
      paymentDeadline: booking.paymentDeadline
        ? (booking.paymentDeadline instanceof Date
          ? booking.paymentDeadline.toISOString()
          : String(booking.paymentDeadline))
        : null,
      confirmedAt: booking.confirmedAt
        ? (booking.confirmedAt instanceof Date
          ? booking.confirmedAt.toISOString()
          : String(booking.confirmedAt))
        : null,
      completedAt: booking.completedAt
        ? (booking.completedAt instanceof Date
          ? booking.completedAt.toISOString()
          : String(booking.completedAt))
        : null,
      cancelledAt: booking.cancelledAt
        ? (booking.cancelledAt instanceof Date
          ? booking.cancelledAt.toISOString()
          : String(booking.cancelledAt))
        : null,
      cancelReason: booking.cancelReason,
      createdAt: booking.createdAt instanceof Date
        ? booking.createdAt.toISOString()
        : String(booking.createdAt),
    };
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(
    bookingId: string,
    userId: string,
    dto: UpdateBookingStatusDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        hirer: { select: { id: true, fullName: true } },
        companion: { select: { id: true, fullName: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    const isHirer = booking.hirerId === userId;
    const isCompanion = booking.companionId === userId;

    if (!isHirer && !isCompanion) {
      throw new ForbiddenException("Access denied");
    }

    // Validate status transitions
    const { status, reason } = dto;

    switch (status) {
      case BookingStatus.CONFIRMED:
        if (!isCompanion)
          throw new ForbiddenException("Only companion can confirm");
        if (booking.status !== BookingStatus.PENDING) {
          throw new BadRequestException("Can only confirm pending bookings");
        }
        break;

      case BookingStatus.ACTIVE:
        if (!isCompanion)
          throw new ForbiddenException("Only companion can start");
        if (booking.status !== BookingStatus.CONFIRMED) {
          throw new BadRequestException("Can only start confirmed bookings");
        }
        break;

      case BookingStatus.COMPLETED:
        if (!isCompanion)
          throw new ForbiddenException("Only companion can complete");
        if (booking.status !== BookingStatus.ACTIVE) {
          throw new BadRequestException("Can only complete active bookings");
        }
        break;

      case BookingStatus.CANCELLED:
        if (
          booking.status !== BookingStatus.PENDING &&
          booking.status !== BookingStatus.CONFIRMED
        ) {
          throw new BadRequestException("Cannot cancel at this stage");
        }
        break;

      default:
        throw new BadRequestException("Invalid status transition");
    }

    // Build update data
    const updateData: Prisma.BookingUpdateInput = {
      status,
    };

    // Update payment status based on booking status
    if (status === BookingStatus.CONFIRMED) {
      // Payment status stays PENDING until hirer pays - don't set HELD here
      updateData.confirmedAt = new Date();

      // Calculate payment deadline: earlier of 2h after confirmation OR 2h before start
      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const twoHoursBeforeStart = new Date(booking.startDatetime.getTime() - 2 * 60 * 60 * 1000);
      updateData.paymentDeadline = twoHoursFromNow < twoHoursBeforeStart
        ? twoHoursFromNow
        : twoHoursBeforeStart;

      // Notify hirer that booking is confirmed
      this.notificationsService
        .notifyBookingConfirmed(booking.hirerId, booking.companion.fullName, bookingId)
        .catch((err) =>
          this.logger.warn(`Failed to send booking confirmed notification: ${err.message}`),
        );
    } else if (status === BookingStatus.COMPLETED) {
      updateData.paymentStatus = PaymentStatus.RELEASED;
      updateData.completedAt = new Date();

      // Create earning record for companion (async, don't block the response)
      this.createEarningForBooking(bookingId, booking.companionId, booking.totalPrice)
        .catch((err) =>
          this.logger.error(`Failed to create earning for booking ${bookingId}: ${err.message}`),
        );

      // Schedule auto-archive of conversation (async, don't block the response)
      this.scheduleConversationArchive(
        booking.hirerId,
        booking.companionId,
        bookingId,
      ).catch((err) =>
        this.logger.error(
          `Failed to schedule conversation archive: ${err.message}`,
        ),
      );
    } else if (status === BookingStatus.CANCELLED) {
      // Calculate tiered refund based on cancellation timing
      const refundPolicy = this.calculateRefundPolicy({
        startDatetime: booking.startDatetime,
        totalPrice: booking.totalPrice,
        platformFee: booking.platformFee,
      });

      updateData.paymentStatus =
        refundPolicy.refundToHirer > 0
          ? PaymentStatus.REFUNDED
          : PaymentStatus.RELEASED; // Released to companion if no refund
      updateData.cancelledAt = new Date();
      updateData.cancelReason = reason;
      updateData.cancelledBy = userId;

      // Issue strike for late cancellation (<24h before start)
      const hoursUntilStart =
        (booking.startDatetime.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilStart < 24 && isHirer) {
        // Hirer cancels less than 24h before - issue strike
        await this.prisma.userStrike.create({
          data: {
            userId: booking.hirerId,
            type: StrikeType.LATE_CANCELLATION,
            reason: "Cancelled booking less than 24 hours before start time",
            bookingId: booking.id,
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Expires in 90 days
          },
        });
        this.logger.log(
          `Strike issued to hirer ${booking.hirerId} for late cancellation of booking ${booking.id}`,
        );
      }

      // Update and return with refund details
      const updatedBooking = await this.prisma.booking.update({
        where: { id: bookingId },
        data: updateData,
      });

      // Notify the other party about cancellation
      const cancelledByName = isHirer ? booking.hirer.fullName : booking.companion.fullName;
      const recipientId = isHirer ? booking.companionId : booking.hirerId;
      this.notificationsService
        .notifyBookingCancelled(recipientId, bookingId, cancelledByName)
        .catch((err) =>
          this.logger.warn(`Failed to send booking cancelled notification: ${err.message}`),
        );

      return {
        id: updatedBooking.id,
        status: updatedBooking.status,
        paymentStatus: updatedBooking.paymentStatus,
        message: "Booking cancelled",
        refundDetails: {
          refundToHirer: refundPolicy.refundToHirer,
          releaseToCompanion: refundPolicy.releaseToCompanion,
          refundPercentage: refundPolicy.refundPercentage,
        },
        strikeIssued: hoursUntilStart < 24 && isHirer,
      };
    } else if (status === BookingStatus.ACTIVE) {
      updateData.startedAt = new Date();
    }

    // Update booking
    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
    });

    // Send notifications based on status change
    if (status === BookingStatus.COMPLETED) {
      // Notify both parties about completion
      this.notificationsService
        .send({
          userId: booking.hirerId,
          type: "BOOKING_COMPLETED" as any,
          title: "Booking Completed",
          body: `Your booking with ${booking.companion.fullName} has been completed. Please leave a review!`,
          data: { bookingId },
          actionUrl: `/bookings/${bookingId}`,
          sendPush: true,
        })
        .catch((err) =>
          this.logger.warn(`Failed to send booking completed notification to hirer: ${err.message}`),
        );
    }

    return {
      id: updatedBooking.id,
      status: updatedBooking.status,
      paymentStatus: updatedBooking.paymentStatus,
      message: "Booking status updated",
    };
  }

  /**
   * Get pending booking requests (Companion) with cursor-based pagination
   * @deprecated Use BookingScheduleService.getBookingRequests() instead for new code.
   */
  async getBookingRequests(
    companionUserId: string,
    query: { limit?: number; cursor?: string } = {},
  ): Promise<{ requests: BookingRequestItem[]; nextCursor: string | null }> {
    const { limit = 20, cursor } = query;

    // Fetch one extra to check if there are more results
    const requests = await this.prisma.booking.findMany({
      where: {
        companionId: companionUserId,
        status: BookingStatus.PENDING,
        requestExpiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        occasion: {
          select: { id: true, code: true, emoji: true, nameEn: true },
        },
        hirer: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            hirerProfile: {
              select: { ratingAvg: true },
            },
          },
        },
      },
    });

    // Check if there are more results
    const hasMore = requests.length > limit;
    const resultsToReturn = hasMore ? requests.slice(0, limit) : requests;
    const nextCursor = hasMore
      ? resultsToReturn[resultsToReturn.length - 1].id
      : null;

    const requestList: BookingRequestItem[] = resultsToReturn.map((r) => ({
      id: r.id,
      bookingNumber: r.bookingNumber,
      occasion: BookingUtils.mapOccasion(r.occasion),
      startDatetime: r.startDatetime.toISOString(),
      endDatetime: r.endDatetime.toISOString(),
      durationHours: Number(r.durationHours),
      locationAddress: r.locationAddress,
      totalPrice: r.totalPrice,
      specialRequests: r.specialRequests,
      hirer: r.hirer
        ? {
          id: r.hirer.id,
          displayName: r.hirer.fullName,
          avatar: r.hirer.avatarUrl,
          rating: r.hirer.hirerProfile
            ? Number(r.hirer.hirerProfile.ratingAvg)
            : 5,
        }
        : undefined,
      createdAt: r.createdAt.toISOString(),
      requestExpiresAt: r.requestExpiresAt?.toISOString() || "",
    }));

    return { requests: requestList, nextCursor };
  }

  /**
   * Get companion schedule
   * @deprecated Use BookingScheduleService.getCompanionSchedule() instead for new code.
   */
  async getCompanionSchedule(
    companionUserId: string,
    startDate: string,
    endDate: string,
  ): Promise<{ schedule: ScheduleDay[] }> {
    const bookings = await this.prisma.booking.findMany({
      where: {
        companionId: companionUserId,
        startDatetime: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.ACTIVE],
        },
      },
      orderBy: [{ startDatetime: "asc" }],
      include: {
        occasion: true,
        hirer: true,
      },
    });

    // Group by date
    const scheduleMap = new Map<string, ScheduleDay>();

    for (const booking of bookings) {
      const startDt = new Date(booking.startDatetime);
      const endDt = new Date(booking.endDatetime);
      const dateStr = startDt.toISOString().split("T")[0];

      if (!scheduleMap.has(dateStr)) {
        scheduleMap.set(dateStr, { date: dateStr, bookings: [] });
      }

      scheduleMap.get(dateStr)!.bookings.push({
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        startTime: startDt.toISOString().substring(11, 16),
        endTime: endDt.toISOString().substring(11, 16),
        startDatetime: startDt.toISOString(),
        endDatetime: endDt.toISOString(),
        durationHours: Number(booking.durationHours),
        occasion: BookingUtils.mapOccasion(booking.occasion),
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        hirer: {
          displayName: booking.hirer.fullName,
          avatar: booking.hirer.avatarUrl,
        },
        locationAddress: booking.locationAddress,
      });
    }

    return { schedule: Array.from(scheduleMap.values()) };
  }

  /**
   * Submit review (Hirer)
   * @deprecated Use BookingReviewsService.submitReview() instead for new code.
   * This method will be removed in a future version.
   */
  async submitReview(bookingId: string, hirerId: string, dto: SubmitReviewDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        reviews: {
          where: { reviewerId: hirerId },
        },
        hirer: {
          select: { fullName: true },
        },
        companion: {
          include: { companionProfile: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    if (booking.hirerId !== hirerId) {
      throw new ForbiddenException("Only hirer can review");
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException("Can only review completed bookings");
    }

    if (booking.reviews.length > 0) {
      throw new BadRequestException("Review already submitted");
    }

    // Check 7-day review window
    if (booking.completedAt) {
      const daysSinceCompletion = Math.floor(
        (Date.now() - booking.completedAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSinceCompletion > 7) {
        throw new BadRequestException(
          "Review window has expired. Reviews must be submitted within 7 days of booking completion.",
        );
      }
    }

    // Check review comment for profanity/inappropriate content
    if (dto.comment) {
      const reviewResult = await this.contentReviewService.reviewText(
        dto.comment,
      );
      if (!reviewResult.isSafe || reviewResult.suggestedAction === "reject") {
        this.logger.warn(
          `Review rejected for profanity - booking: ${bookingId}, flags: ${reviewResult.flags.join(", ")}`,
        );
        throw new BadRequestException(
          "Your review contains inappropriate language. Please revise and resubmit.",
        );
      }
    }

    // ATOMIC: Create review and update rating in a single transaction
    const companionProfile = booking.companion.companionProfile;

    const result = await this.prisma.$transaction(
      async (tx) => {
        // Create review
        const review = await tx.review.create({
          data: {
            bookingId,
            reviewerId: hirerId,
            revieweeId: booking.companionId,
            rating: dto.rating,
            comment: dto.comment,
            tags: dto.tags || [],
            isVisible: dto.isVisible ?? true,
          },
        });

        // Update companion rating atomically
        if (companionProfile) {
          // Use aggregate in transaction to get accurate count and sum
          const stats = await tx.review.aggregate({
            where: { revieweeId: booking.companionId },
            _count: { rating: true },
            _avg: { rating: true },
          });

          await tx.companionProfile.update({
            where: { id: companionProfile.id },
            data: {
              ratingAvg: stats._avg.rating ?? dto.rating,
              ratingCount: stats._count.rating,
            },
          });
        }

        return review;
      },
      {
        timeout: 10000, // 10 second timeout for consistency with payment operations
      },
    );

    // Notify companion of new review
    this.notificationsService
      .notifyNewReview(booking.companionId, booking.hirer.fullName, dto.rating, bookingId)
      .catch((err) =>
        this.logger.warn(`Failed to send new review notification: ${err.message}`),
      );

    return {
      id: result.id,
      rating: result.rating,
      message: "Review submitted successfully",
    };
  }

  /**
   * Edit review (Hirer only)
   * Must be done within 24 hours of review creation
   * @deprecated Use BookingReviewsService.editReview() instead for new code.
   */
  async editReview(reviewId: string, hirerId: string, dto: EditReviewDto) {
    const EDIT_WINDOW_HOURS = 24;

    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        booking: {
          include: {
            companion: {
              include: { companionProfile: true },
            },
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException("Review not found");
    }

    // Only the reviewer can edit
    if (review.reviewerId !== hirerId) {
      throw new ForbiddenException("Only the reviewer can edit this review");
    }

    // Check if review is disputed
    if (review.isDisputed) {
      throw new BadRequestException("Cannot edit a disputed review");
    }

    // Enforce 24-hour edit window
    const hoursSinceCreation =
      (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > EDIT_WINDOW_HOURS) {
      throw new BadRequestException(
        `Reviews can only be edited within ${EDIT_WINDOW_HOURS} hours of creation.`,
      );
    }

    // Validate there's something to update
    if (!dto.rating && !dto.comment && !dto.tags) {
      throw new BadRequestException("No changes provided");
    }

    // Check edited comment for profanity
    if (dto.comment) {
      const reviewResult = await this.contentReviewService.reviewText(
        dto.comment,
      );
      if (!reviewResult.isSafe || reviewResult.suggestedAction === "reject") {
        throw new BadRequestException(
          "Your review contains inappropriate language. Please revise.",
        );
      }
    }

    // Prepare update data
    const updateData: Prisma.ReviewUpdateInput = {};
    if (dto.rating !== undefined) updateData.rating = dto.rating;
    if (dto.comment !== undefined) updateData.comment = dto.comment;
    if (dto.tags !== undefined) updateData.tags = dto.tags;

    // ATOMIC: Update review and recalculate rating in a single transaction
    const companionProfile = review.booking.companion.companionProfile;
    const shouldRecalculateRating =
      dto.rating !== undefined && companionProfile;

    const updatedReview = await this.prisma.$transaction(
      async (tx) => {
        // Update review
        const updated = await tx.review.update({
          where: { id: reviewId },
          data: updateData,
        });

        // Recalculate companion rating atomically if rating changed
        if (shouldRecalculateRating) {
          const stats = await tx.review.aggregate({
            where: { revieweeId: review.revieweeId },
            _avg: { rating: true },
          });

          await tx.companionProfile.update({
            where: { id: companionProfile.id },
            data: { ratingAvg: stats._avg.rating ?? dto.rating },
          });
        }

        return updated;
      },
      {
        timeout: 10000, // 10 second timeout for consistency with payment operations
      },
    );

    const hoursRemaining = Math.max(0, EDIT_WINDOW_HOURS - hoursSinceCreation);

    return {
      id: updatedReview.id,
      rating: updatedReview.rating,
      message: "Review updated successfully",
      editWindowEndsIn: `${Math.floor(hoursRemaining)} hours ${Math.floor((hoursRemaining % 1) * 60)} minutes`,
    };
  }

  /**
   * Update booking location (for tracking)
   */
  async updateBookingLocation(
    bookingId: string,
    userId: string,
    dto: UpdateLocationDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    const isHirer = booking.hirerId === userId;
    const isCompanion = booking.companionId === userId;

    if (!isHirer && !isCompanion) {
      throw new ForbiddenException("Access denied");
    }

    if (booking.status !== BookingStatus.ACTIVE) {
      throw new BadRequestException(
        "Can only update location for active bookings",
      );
    }

    // Update the booking's location (simplified - no separate location tracking model)
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        locationLat: dto.latitude,
        locationLng: dto.longitude,
      },
    });

    return { success: true, message: "Location updated" };
  }

  /**
   * Decline a pending booking request (Companion only)
   * @deprecated Use BookingCancellationService.declineBooking() instead for new code.
   */
  async declineBooking(
    bookingId: string,
    companionId: string,
    reason?: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        companion: { select: { fullName: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    if (booking.companionId !== companionId) {
      throw new ForbiddenException(
        "You can only decline your own booking requests",
      );
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(
        "Can only decline pending booking requests",
      );
    }

    // Update booking to declined/cancelled status
    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        paymentStatus: PaymentStatus.REFUNDED, // Full refund when companion declines
        cancelledAt: new Date(),
        cancelledBy: companionId,
        cancelReason: reason || "Declined by companion",
      },
    });

    // Notify hirer that booking was declined
    this.notificationsService
      .notifyBookingDeclined(booking.hirerId, booking.companion.fullName, bookingId)
      .catch((err) =>
        this.logger.warn(`Failed to send booking declined notification: ${err.message}`),
      );

    return {
      id: updatedBooking.id,
      status: updatedBooking.status,
      paymentStatus: updatedBooking.paymentStatus,
      message:
        "Booking request declined. Full refund will be processed for the hirer.",
    };
  }

  /**
   * Dispute a review (Companion only)
   * Enforces 7-day window from review creation
   * @deprecated Use BookingReviewsService.disputeReview() instead for new code.
   */
  async disputeReview(
    reviewId: string,
    companionId: string,
    dto: DisputeReviewDto,
  ) {
    const DISPUTE_WINDOW_DAYS = 7;

    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        booking: true,
      },
    });

    if (!review) {
      throw new NotFoundException("Review not found");
    }

    // Only the companion (reviewee) can dispute a review
    if (review.revieweeId !== companionId) {
      throw new ForbiddenException(
        "Only the reviewed companion can dispute this review",
      );
    }

    // Check if already disputed
    if (review.isDisputed) {
      throw new BadRequestException("This review has already been disputed");
    }

    // Enforce 7-day window from review creation
    const daysSinceReview = Math.floor(
      (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceReview > DISPUTE_WINDOW_DAYS) {
      throw new BadRequestException(
        `Dispute window has expired. Reviews can only be disputed within ${DISPUTE_WINDOW_DAYS} days of being posted.`,
      );
    }

    // Mark review as disputed
    await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        isDisputed: true,
        isVisible: false, // Hide disputed reviews until resolved
      },
    });

    // Log the dispute for admin review (would typically create a ticket)
    this.logger.log(
      `Review ${reviewId} disputed by companion ${companionId}. Reason: ${dto.reason}`,
    );

    // TODO: Create admin ticket/notification for dispute resolution
    // await this.adminService.createDisputeTicket({ reviewId, reason: dto.reason });

    return {
      id: reviewId,
      status: "disputed",
      message:
        "Review has been disputed and hidden pending admin review. Our team will review within 48-72 hours.",
      disputedAt: new Date().toISOString(),
      daysRemaining: DISPUTE_WINDOW_DAYS - daysSinceReview,
    };
  }

  /**
   * Check if a review can still be disputed (for UI purposes)
   * @deprecated Use BookingReviewsService.canDisputeReview() instead for new code.
   */
  async canDisputeReview(
    reviewId: string,
    companionId: string,
  ): Promise<{
    canDispute: boolean;
    reason?: string;
    daysRemaining?: number;
  }> {
    const DISPUTE_WINDOW_DAYS = 7;

    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return { canDispute: false, reason: "Review not found" };
    }

    if (review.revieweeId !== companionId) {
      return { canDispute: false, reason: "Not your review" };
    }

    if (review.isDisputed) {
      return { canDispute: false, reason: "Already disputed" };
    }

    const daysSinceReview = Math.floor(
      (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceReview > DISPUTE_WINDOW_DAYS) {
      return {
        canDispute: false,
        reason: `Dispute window expired (${DISPUTE_WINDOW_DAYS} days)`,
      };
    }

    return {
      canDispute: true,
      daysRemaining: DISPUTE_WINDOW_DAYS - daysSinceReview,
    };
  }

  /**
   * Emergency cancellation with special handling
   * - Emergency cancellations are tracked separately
   * - May waive late cancellation strikes if verified
   * - Both hirer and companion can use this
   * @deprecated Use BookingCancellationService.emergencyCancellation() instead for new code.
   */
  async emergencyCancellation(
    bookingId: string,
    userId: string,
    dto: EmergencyCancellationDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    const isHirer = booking.hirerId === userId;
    const isCompanion = booking.companionId === userId;

    if (!isHirer && !isCompanion) {
      throw new ForbiddenException("Access denied");
    }

    // Can only emergency cancel pending or confirmed bookings
    if (
      booking.status !== BookingStatus.PENDING &&
      booking.status !== BookingStatus.CONFIRMED
    ) {
      throw new BadRequestException("Cannot cancel at this stage");
    }

    // Calculate refund policy (full refund for verified emergencies)
    const hoursUntilStart =
      (booking.startDatetime.getTime() - Date.now()) / (1000 * 60 * 60);
    const isLateCancel = hoursUntilStart < 24;

    // Update booking with emergency cancellation details
    const emergencyData = {
      emergencyType: dto.emergencyType,
      description: dto.description,
      proofDocumentUrl: dto.proofDocumentUrl,
      reportedBy: userId,
      reportedAt: new Date().toISOString(),
      isVerified: false, // Admin needs to verify
    };

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        paymentStatus: PaymentStatus.PENDING, // Hold pending admin verification
        cancelledAt: new Date(),
        cancelledBy: userId,
        cancelReason: `EMERGENCY: ${dto.emergencyType} - ${dto.description}`,
        // Store emergency data in metadata (assuming a JSONB field exists)
        // If not, we'd need to store this in a separate table
      },
    });

    // Log for admin review
    this.logger.log(
      `Emergency cancellation: booking=${bookingId}, user=${userId}, type=${dto.emergencyType}, late=${isLateCancel}`,
    );

    // Create a pending strike that will be removed if emergency is verified
    if (isLateCancel && isHirer) {
      await this.prisma.userStrike.create({
        data: {
          userId: booking.hirerId,
          type: StrikeType.LATE_CANCELLATION,
          reason: `Emergency cancellation (${dto.emergencyType}) - pending verification`,
          bookingId: booking.id,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          // Mark as pending verification - admin can void this
        },
      });
    }

    return {
      id: updatedBooking.id,
      status: updatedBooking.status,
      paymentStatus: updatedBooking.paymentStatus,
      emergencyType: dto.emergencyType,
      message:
        "Emergency cancellation submitted. Your request will be reviewed by our team within 24 hours.",
      nextSteps: [
        dto.proofDocumentUrl
          ? "Your supporting document has been received."
          : "Please upload supporting documentation (medical certificate, etc.) to expedite verification.",
        "Refund will be processed after verification.",
        isLateCancel
          ? "Any late cancellation penalties will be waived if emergency is verified."
          : "Full refund will be processed within 3-5 business days.",
      ],
      isLateCancel,
      verificationRequired: true,
    };
  }

  /**
   * Get user's emergency cancellation history (for admin/support)
   * @deprecated Use BookingCancellationService.getEmergencyCancellationHistory() instead.
   */
  async getEmergencyCancellationHistory(userId: string): Promise<{
    total: number;
    verified: number;
    pending: number;
    denied: number;
    cancellations: Array<{
      bookingId: string;
      bookingNumber: string;
      emergencyType: string;
      cancelledAt: string;
      status: string;
    }>;
  }> {
    const emergencyCancellations = await this.prisma.booking.findMany({
      where: {
        OR: [{ hirerId: userId }, { companionId: userId }],
        status: BookingStatus.CANCELLED,
        cancelReason: { startsWith: "EMERGENCY:" },
      },
      orderBy: { cancelledAt: "desc" },
      select: {
        id: true,
        bookingNumber: true,
        cancelReason: true,
        cancelledAt: true,
        paymentStatus: true,
      },
    });

    const verified = emergencyCancellations.filter(
      (c) => c.paymentStatus === PaymentStatus.REFUNDED,
    ).length;
    const denied = emergencyCancellations.filter(
      (c) => c.paymentStatus === PaymentStatus.RELEASED, // Released to other party = denied
    ).length;
    const pending = emergencyCancellations.length - verified - denied;

    return {
      total: emergencyCancellations.length,
      verified,
      pending,
      denied,
      cancellations: emergencyCancellations.map((c) => ({
        bookingId: c.id,
        bookingNumber: c.bookingNumber,
        emergencyType:
          c.cancelReason?.replace("EMERGENCY: ", "").split(" - ")[0] ||
          "unknown",
        cancelledAt: c.cancelledAt?.toISOString() || "",
        status:
          c.paymentStatus === PaymentStatus.REFUNDED
            ? "verified"
            : c.paymentStatus === PaymentStatus.RELEASED
              ? "denied"
              : "pending",
      })),
    };
  }

  /**
   * Early completion of an active booking
   * - Only available for ACTIVE bookings
   * - Both parties can request early completion
   * - Companion's earning is released immediately
   */
  async completeEarly(
    bookingId: string,
    userId: string,
    reason?: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        earning: true,
      },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    const isHirer = booking.hirerId === userId;
    const isCompanion = booking.companionId === userId;

    if (!isHirer && !isCompanion) {
      throw new ForbiddenException("Access denied");
    }

    // Early completion can only be done for ACTIVE bookings
    if (booking.status !== BookingStatus.ACTIVE) {
      throw new BadRequestException(
        "Early completion can only be done for active bookings"
      );
    }

    // Update booking to COMPLETED
    const updatedBooking = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.COMPLETED,
          paymentStatus: PaymentStatus.RELEASED,
          completedAt: new Date(),
          cancelReason: reason ? `EARLY_COMPLETION: ${reason}` : 'EARLY_COMPLETION',
        },
      });

      // Release payment if held
      if (booking.payment && booking.payment.status === PaymentStatus.HELD) {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: {
            status: PaymentStatus.RELEASED,
            releasedAt: new Date(),
          },
        });
      }

      // Create earning record for companion
      const companionProfile = await tx.companionProfile.findUnique({
        where: { userId: booking.companionId },
        select: { id: true },
      });

      if (companionProfile) {
        // Get platform fee from config (stored as decimal, e.g., 0.18 = 18%)
        const platformConfig = await this.platformConfigService.getPlatformConfig();
        const platformFee = Math.floor(booking.totalPrice * platformConfig.platformFeePercent);
        const netAmount = booking.totalPrice - platformFee;

        await tx.earning.create({
          data: {
            companionId: companionProfile.id,
            bookingId,
            grossAmount: booking.totalPrice,
            platformFee,
            netAmount,
            status: EarningsStatus.AVAILABLE,
            releasedAt: new Date(),
          },
        });
      }

      return updated;
    });

    // Schedule auto-archive of conversation
    this.scheduleConversationArchive(
      booking.hirerId,
      booking.companionId,
      bookingId,
    ).catch((err) =>
      this.logger.error(
        `Failed to schedule conversation archive: ${err.message}`,
      ),
    );

    this.logger.log(
      `Early completion: booking=${bookingId}, completedBy=${userId}`,
    );

    return {
      id: updatedBooking.id,
      bookingNumber: updatedBooking.bookingNumber,
      status: updatedBooking.status,
      paymentStatus: updatedBooking.paymentStatus,
      completedAt: updatedBooking.completedAt,
      message: "Booking has been completed successfully.",
    };
  }

  /**
   * Report a no-show for an active booking
   * - Only available for ACTIVE bookings (booking has started)
   * - Reporter must be part of the booking (hirer or companion)
   * - Creates a dispute/report record
   * - Transitions booking to DISPUTED status for admin review
   */
  async reportNoShow(
    bookingId: string,
    reporterId: string,
    description: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        hirer: { select: { fullName: true } },
        companion: { select: { fullName: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    const isHirer = booking.hirerId === reporterId;
    const isCompanion = booking.companionId === reporterId;

    if (!isHirer && !isCompanion) {
      throw new ForbiddenException("Access denied");
    }

    // No-show can only be reported for ACTIVE bookings
    if (booking.status !== BookingStatus.ACTIVE) {
      throw new BadRequestException(
        "No-show can only be reported for active bookings"
      );
    }

    // Determine who is being reported
    const reportedId = isHirer ? booking.companionId : booking.hirerId;
    const reporterName = isHirer ? booking.hirer?.fullName : booking.companion?.fullName;
    const reportedName = isHirer ? booking.companion?.fullName : booking.hirer?.fullName;

    // Create a report record
    const report = await this.prisma.report.create({
      data: {
        reporterId,
        reportedId,
        bookingId,
        type: ReportType.NO_SHOW,
        description: description || `${reportedName} did not show up for the booking`,
      },
    });

    // Transition booking to DISPUTED status
    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.DISPUTED,
        cancelReason: `NO_SHOW: Reported by ${reporterName}`,
      },
    });

    // Issue a pending strike to the reported party
    await this.prisma.userStrike.create({
      data: {
        userId: reportedId,
        type: StrikeType.NO_SHOW,
        reason: `No-show reported for booking ${booking.bookingNumber} - pending verification`,
        bookingId: booking.id,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      },
    });

    this.logger.log(
      `No-show reported: booking=${bookingId}, reporter=${reporterId}, reported=${reportedId}`,
    );

    return {
      id: updatedBooking.id,
      bookingNumber: updatedBooking.bookingNumber,
      status: updatedBooking.status,
      reportId: report.id,
      message:
        "No-show has been reported. Our team will review this dispute within 24 hours.",
      nextSteps: [
        "The booking has been marked as disputed.",
        "Our support team will contact both parties.",
        isHirer
          ? "If verified, you will receive a full refund."
          : "If verified, compensation will be discussed with support.",
      ],
    };
  }
}
