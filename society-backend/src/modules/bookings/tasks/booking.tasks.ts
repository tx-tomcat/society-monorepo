import { PlatformConfigService } from '@/modules/config/services/config.service';
import { PrismaService } from '@/prisma/prisma.service';
import { BookingStatus, EarningsStatus, PaymentStatus } from '@generated/client';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class BookingTasks {
  private readonly logger = new Logger(BookingTasks.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly platformConfigService: PlatformConfigService,
  ) { }

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
                bookingId: booking.id,
                grossAmount: booking.totalPrice,
                platformFee,
                netAmount,
                status: EarningsStatus.AVAILABLE,
                releasedAt: new Date(),
              },
            });
          }
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
   * Auto-start confirmed bookings when their start time has arrived
   * Runs every minute to ensure timely activation
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async autoStartBookings() {
    this.logger.log('Running auto-start bookings task...');

    const now = new Date();

    // Find bookings that:
    // - Are in CONFIRMED status
    // - Payment is HELD (escrow)
    // - Start time has passed
    const bookingsToStart = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        startDatetime: { lte: now },
      },
    });

    this.logger.log(`Found ${bookingsToStart.length} bookings to auto-start`);

    for (const booking of bookingsToStart) {
      try {
        await this.prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.ACTIVE,
            startedAt: now,
          },
        });

        this.logger.log(`Auto-started booking ${booking.id} (${booking.bookingNumber})`);
      } catch (error) {
        this.logger.error(
          `Failed to auto-start booking ${booking.id}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    this.logger.log('Auto-start bookings task finished');
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

  /**
   * Expire confirmed bookings where hirer hasn't paid by the payment deadline
   * Runs every 5 minutes
   */
  @Cron('0 */5 * * * *')
  async expireUnpaidConfirmedBookings() {
    this.logger.log('Running expire unpaid confirmed bookings task...');

    const now = new Date();

    // Find bookings that:
    // - Are in CONFIRMED status
    // - Payment is still PENDING (not paid)
    // - Payment deadline has passed
    const unpaidBookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PENDING,
        paymentDeadline: { lt: now },
      },
    });

    this.logger.log(`Found ${unpaidBookings.length} unpaid confirmed bookings to expire`);

    for (const booking of unpaidBookings) {
      try {
        await this.prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.CANCELLED,
            cancelledAt: now,
            cancelReason: 'Payment deadline expired - hirer did not pay',
          },
        });

        this.logger.log(`Expired unpaid booking ${booking.id} (${booking.bookingNumber})`);
      } catch (error) {
        this.logger.error(
          `Failed to expire unpaid booking ${booking.id}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    this.logger.log('Expire unpaid confirmed bookings task finished');
  }
}
