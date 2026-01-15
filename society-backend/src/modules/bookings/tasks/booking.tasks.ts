import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingStatus, PaymentStatus, EarningsStatus } from '@generated/client';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class BookingTasks {
  private readonly logger = new Logger(BookingTasks.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Auto-complete bookings that ended more than 24 hours ago
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async autoCompleteBookings() {
    this.logger.log('Running auto-complete bookings task...');

    // Find bookings that:
    // - Are in ACTIVE status
    // - End time was more than 24 hours ago
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const bookingsToComplete = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.ACTIVE,
        endDatetime: { lt: cutoffTime },
      },
      include: {
        payment: true,
      },
    });

    this.logger.log(`Found ${bookingsToComplete.length} bookings to auto-complete`);

    for (const booking of bookingsToComplete) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // Update booking status to COMPLETED
          await tx.booking.update({
            where: { id: booking.id },
            data: {
              status: BookingStatus.COMPLETED,
              completedAt: new Date(),
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

          // Update earning status to AVAILABLE
          await tx.earning.updateMany({
            where: {
              bookingId: booking.id,
              status: EarningsStatus.PENDING,
            },
            data: {
              status: EarningsStatus.AVAILABLE,
              releasedAt: new Date(),
            },
          });
        });

        this.logger.log(`Auto-completed booking ${booking.id} (${booking.bookingNumber})`);
      } catch (error) {
        this.logger.error(
          `Failed to auto-complete booking ${booking.id}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    this.logger.log('Auto-complete bookings task finished');
  }

  /**
   * Expire pending booking requests that have passed their expiration time
   * Runs every 15 minutes
   */
  @Cron('0 */15 * * * *')
  async expirePendingRequests() {
    this.logger.log('Running expire pending requests task...');

    const now = new Date();

    const expiredBookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.PENDING,
        requestExpiresAt: { lt: now },
      },
    });

    this.logger.log(`Found ${expiredBookings.length} expired booking requests`);

    for (const booking of expiredBookings) {
      try {
        await this.prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.CANCELLED,
            paymentStatus: PaymentStatus.REFUNDED, // Full refund for expired requests
            cancelledAt: now,
            cancelReason: 'Request expired - companion did not respond',
          },
        });

        this.logger.log(`Expired booking request ${booking.id} (${booking.bookingNumber})`);
      } catch (error) {
        this.logger.error(
          `Failed to expire booking ${booking.id}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    this.logger.log('Expire pending requests task finished');
  }
}
