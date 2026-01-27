import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, ServiceType } from '@generated/client';
import { PrismaService } from '@/prisma/prisma.service';
import {
  DashboardResponse,
  TodaySummary,
  UpcomingBooking,
  ActivityItem,
  DashboardStats,
  NextBookingInfo,
} from '../dto/dashboard.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get companion dashboard data
   * Optimized with parallel queries for better performance
   */
  async getDashboard(userId: string): Promise<DashboardResponse> {
    const companion = await this.prisma.companionProfile.findUnique({
      where: { userId },
    });

    if (!companion) {
      throw new NotFoundException('Companion profile not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Execute all independent queries in parallel
    const [
      todaysBookings,
      completedTodayBookings,
      upcomingBookingsData,
      recentActivity,
      stats,
    ] = await Promise.all([
      // Today's active/confirmed bookings
      this.prisma.booking.findMany({
        where: {
          companionId: userId,
          startDatetime: {
            gte: today,
            lt: tomorrow,
          },
          status: {
            in: [BookingStatus.CONFIRMED, BookingStatus.ACTIVE],
          },
        },
        include: {
          hirer: true,
        },
        orderBy: { startDatetime: 'asc' },
      }),
      // Today's completed bookings for earnings
      this.prisma.booking.findMany({
        where: {
          companionId: userId,
          completedAt: {
            gte: today,
            lt: tomorrow,
          },
          status: BookingStatus.COMPLETED,
        },
      }),
      // Upcoming bookings (next 7 days)
      this.prisma.booking.findMany({
        where: {
          companionId: userId,
          startDatetime: {
            gte: tomorrow,
            lte: nextWeek,
          },
          status: {
            in: [BookingStatus.CONFIRMED, BookingStatus.PENDING],
          },
        },
        include: {
          hirer: true,
        },
        orderBy: { startDatetime: 'asc' },
        take: 5,
      }),
      // Recent activity
      this.getRecentActivity(userId),
      // Stats
      this.getStats(userId, companion.id),
    ]);

    // Calculate today's earnings
    const todaysEarnings = completedTodayBookings.reduce(
      (sum, b) => sum + b.basePrice,
      0,
    );

    // Find next booking
    const now = new Date();
    const nextBooking = todaysBookings.find((b) => b.startDatetime > now);

    let nextBookingInfo: NextBookingInfo | null = null;
    if (nextBooking) {
      const diffMs = nextBooking.startDatetime.getTime() - now.getTime();
      const diffMins = Math.round(diffMs / 60000);

      nextBookingInfo = {
        id: nextBooking.id,
        startDatetime: nextBooking.startDatetime.toISOString(),
        endDatetime: nextBooking.endDatetime.toISOString(),
        occasionType: nextBooking.occasionType as ServiceType,
        hirer: {
          displayName: nextBooking.hirer?.fullName || 'Anonymous',
          avatar: nextBooking.hirer?.avatarUrl || null,
        },
        locationAddress: nextBooking.locationAddress,
        startsIn: diffMins > 60
          ? `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`
          : `${diffMins}m`,
      };
    }

    const todaysSummary: TodaySummary = {
      date: today.toISOString().split('T')[0],
      bookingsCount: todaysBookings.length,
      earnings: todaysEarnings,
      nextBooking: nextBookingInfo,
    };

    const upcomingBookings: UpcomingBooking[] = upcomingBookingsData.map((b) => ({
      id: b.id,
      startDatetime: b.startDatetime.toISOString(),
      endDatetime: b.endDatetime.toISOString(),
      occasionType: b.occasionType as ServiceType,
      status: b.status,
      hirer: {
        displayName: b.hirer?.fullName || 'Anonymous',
        avatar: b.hirer?.avatarUrl || null,
      },
      locationAddress: b.locationAddress,
      totalPrice: b.totalPrice,
    }));

    return {
      todaysSummary,
      upcomingBookings,
      recentActivity,
      stats,
    };
  }

  /**
   * Get recent activity
   * Optimized with parallel queries
   *
   * IMPORTANT: All data is fetched in parallel upfront to avoid N+1 queries.
   * If extending this method with additional data sources, ensure they are
   * added to the Promise.all() array, not fetched inside the processing loops.
   */
  private async getRecentActivity(userId: string): Promise<ActivityItem[]> {
    // Fetch bookings and reviews in parallel
    const [recentBookings, recentReviews] = await Promise.all([
      this.prisma.booking.findMany({
        where: { companionId: userId },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: {
          hirer: true,
        },
      }),
      this.prisma.review.findMany({
        where: {
          booking: {
            companionId: userId,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          reviewer: true,
        },
      }),
    ]);

    const activities: ActivityItem[] = [];

    // Process bookings
    for (const booking of recentBookings) {
      const hirerName = booking.hirer?.fullName || 'Anonymous';

      if (booking.status === BookingStatus.PENDING) {
        activities.push({
          id: `req-${booking.id}`,
          type: 'booking_request',
          title: 'New Booking Request',
          description: `${hirerName} requested a ${booking.occasionType.toLowerCase().replace('_', ' ')} booking`,
          createdAt: booking.createdAt.toISOString(),
        });
      } else if (booking.status === BookingStatus.CONFIRMED) {
        activities.push({
          id: `conf-${booking.id}`,
          type: 'booking_confirmed',
          title: 'Booking Confirmed',
          description: `Booking with ${hirerName} confirmed`,
          amount: booking.totalPrice,
          createdAt: booking.updatedAt.toISOString(),
        });
      } else if (booking.status === BookingStatus.COMPLETED) {
        activities.push({
          id: `comp-${booking.id}`,
          type: 'booking_completed',
          title: 'Booking Completed',
          description: `Completed ${booking.occasionType.toLowerCase().replace('_', ' ')} with ${hirerName}`,
          amount: booking.basePrice,
          createdAt: booking.updatedAt.toISOString(),
        });
      }
    }

    // Process reviews
    for (const review of recentReviews) {
      activities.push({
        id: `rev-${review.id}`,
        type: 'review_received',
        title: `${review.rating}-Star Review`,
        description: review.comment || 'No comment',
        createdAt: review.createdAt.toISOString(),
      });
    }

    // Sort by date and return top 10
    return activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }

  /**
   * Get companion stats
   */
  private async getStats(userId: string, companionProfileId: string): Promise<DashboardStats> {
    const companion = await this.prisma.companionProfile.findUnique({
      where: { id: companionProfileId },
    });

    if (!companion) {
      throw new NotFoundException('Companion not found');
    }

    // Calculate this month's stats
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthBookings = await this.prisma.booking.findMany({
      where: {
        companionId: userId,
        status: BookingStatus.COMPLETED,
        completedAt: { gte: startOfMonth },
      },
    });

    const thisMonthEarnings = thisMonthBookings.reduce(
      (sum, b) => sum + b.basePrice, // Companion earnings
      0,
    );

    // Calculate completion rate
    const completionRate = companion.totalBookings > 0
      ? Math.round((companion.completedBookings / companion.totalBookings) * 100)
      : 100;

    return {
      rating: Number(companion.ratingAvg),
      reviewCount: companion.ratingCount,
      responseRate: companion.responseRate,
      completionRate,
      totalBookings: companion.totalBookings,
      thisMonthBookings: thisMonthBookings.length,
      thisMonthEarnings,
    };
  }
}
