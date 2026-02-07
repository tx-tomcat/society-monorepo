import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { BookingStatus } from '@generated/enums';
import { ScheduleDay, BookingRequestItem } from '../dto/booking.dto';
import { BookingUtils } from '../utils/booking.utils';

interface GetBookingRequestsQuery {
  limit?: number;
  cursor?: string;
}

interface AvailabilityResult {
  available: boolean;
  conflicts: Array<{
    id: string;
    bookingNumber: string;
    startDatetime: Date;
    endDatetime: Date;
    status: BookingStatus;
  }>;
}

@Injectable()
export class BookingScheduleService {
  private readonly logger = new Logger(BookingScheduleService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get companion schedule for a date range
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
      orderBy: [{ startDatetime: 'asc' }],
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
      const dateStr = startDt.toISOString().split('T')[0];

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
   * Get pending booking requests (Companion) with cursor-based pagination
   */
  async getBookingRequests(
    companionUserId: string,
    query: GetBookingRequestsQuery = {},
  ): Promise<{ requests: BookingRequestItem[]; nextCursor: string | null }> {
    const { limit = 20, cursor } = query;

    // Fetch one extra to check if there are more results
    const requests = await this.prisma.booking.findMany({
      where: {
        companionId: companionUserId,
        status: BookingStatus.PENDING,
        requestExpiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
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
      requestExpiresAt: r.requestExpiresAt?.toISOString() || '',
    }));

    return { requests: requestList, nextCursor };
  }

  /**
   * Check companion availability for a time slot
   */
  async checkAvailability(
    companionUserId: string,
    startDatetime: Date,
    endDatetime: Date,
  ): Promise<AvailabilityResult> {
    // Find any overlapping bookings
    const overlappingBookings = await this.prisma.booking.findMany({
      where: {
        companionId: companionUserId,
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.ACTIVE],
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
      select: {
        id: true,
        bookingNumber: true,
        startDatetime: true,
        endDatetime: true,
        status: true,
      },
    });

    return {
      available: overlappingBookings.length === 0,
      conflicts: overlappingBookings,
    };
  }

  /**
   * Get upcoming bookings for companion
   */
  async getUpcomingBookings(companionUserId: string, limit: number = 10) {
    return this.prisma.booking.findMany({
      where: {
        companionId: companionUserId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.ACTIVE] },
        startDatetime: { gte: new Date() },
      },
      orderBy: { startDatetime: 'asc' },
      take: limit,
      include: {
        occasion: true,
        hirer: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Get companion's booking stats for a period
   */
  async getCompanionBookingStats(
    companionUserId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    total: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    pending: number;
  }> {
    const where = {
      companionId: companionUserId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    const [total, confirmed, completed, cancelled, pending] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.count({
        where: { ...where, status: BookingStatus.CONFIRMED },
      }),
      this.prisma.booking.count({
        where: { ...where, status: BookingStatus.COMPLETED },
      }),
      this.prisma.booking.count({
        where: { ...where, status: BookingStatus.CANCELLED },
      }),
      this.prisma.booking.count({
        where: { ...where, status: BookingStatus.PENDING },
      }),
    ]);

    return { total, confirmed, completed, cancelled, pending };
  }
}
