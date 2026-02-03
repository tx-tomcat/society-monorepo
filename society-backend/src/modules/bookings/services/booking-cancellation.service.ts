import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationsService } from '@/modules/notifications/services/notifications.service';
import { BookingCancellationDeniedException } from '@/common/exceptions';
import { BookingStatus, PaymentStatus, StrikeType } from '@generated/enums';
import { EmergencyCancellationDto } from '../dto/booking.dto';

interface CancelBookingDto {
  reason?: string;
}

interface RefundPolicy {
  refundToHirer: number;
  releaseToCompanion: number;
  refundPercentage: number;
}

@Injectable()
export class BookingCancellationService {
  private readonly logger = new Logger(BookingCancellationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Calculate refund amounts based on tiered cancellation policy
   * - Cancel >48h before: 100% refund to hirer
   * - Cancel 24-48h before: 50% refund to hirer, 50% earnings to companion
   * - Cancel <24h before: 0% refund, companion gets full earnings
   */
  calculateRefundPolicy(booking: {
    startDatetime: Date;
    totalPrice: number;
    platformFee: number;
  }): RefundPolicy {
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
   * Cancel a booking (either party)
   */
  async cancelBooking(
    userId: string,
    bookingId: string,
    dto: CancelBookingDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        hirer: { select: { id: true, fullName: true } },
        companion: { select: { id: true, fullName: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const isHirer = booking.hirerId === userId;
    const isCompanion = booking.companionId === userId;

    if (!isHirer && !isCompanion) {
      throw new ForbiddenException('Access denied');
    }

    // Can only cancel pending or confirmed bookings
    if (
      booking.status !== BookingStatus.PENDING &&
      booking.status !== BookingStatus.CONFIRMED
    ) {
      throw new BookingCancellationDeniedException(booking.id, booking.status);
    }

    // Calculate refund policy
    const refundPolicy = this.calculateRefundPolicy({
      startDatetime: booking.startDatetime,
      totalPrice: booking.totalPrice,
      platformFee: booking.platformFee,
    });

    const paymentStatus =
      refundPolicy.refundToHirer > 0
        ? PaymentStatus.REFUNDED
        : PaymentStatus.RELEASED;

    // Check if late cancellation
    const hoursUntilStart =
      (booking.startDatetime.getTime() - Date.now()) / (1000 * 60 * 60);
    const isLateCancel = hoursUntilStart < 24;
    let strikeIssued = false;

    // Issue strike for late cancellation by hirer
    if (isLateCancel && isHirer) {
      await this.prisma.userStrike.create({
        data: {
          userId: booking.hirerId,
          type: StrikeType.LATE_CANCELLATION,
          reason: 'Cancelled booking less than 24 hours before start time',
          bookingId: booking.id,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        },
      });
      strikeIssued = true;
      this.logger.log(
        `Strike issued to hirer ${booking.hirerId} for late cancellation of booking ${booking.id}`,
      );
    }

    // Update booking
    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        paymentStatus,
        cancelledAt: new Date(),
        cancelledBy: userId,
        cancelReason: dto.reason,
      },
    });

    // Notify the other party
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
      message: 'Booking cancelled',
      refundDetails: {
        refundToHirer: refundPolicy.refundToHirer,
        releaseToCompanion: refundPolicy.releaseToCompanion,
        refundPercentage: refundPolicy.refundPercentage,
      },
      strikeIssued,
    };
  }

  /**
   * Decline a pending booking request (Companion only)
   */
  async declineBooking(
    companionId: string,
    bookingId: string,
    reason?: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        companion: { select: { fullName: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.companionId !== companionId) {
      throw new ForbiddenException('You can only decline your own booking requests');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Can only decline pending booking requests');
    }

    // Update booking to cancelled status
    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        paymentStatus: PaymentStatus.REFUNDED, // Full refund when companion declines
        cancelledAt: new Date(),
        cancelledBy: companionId,
        cancelReason: reason || 'Declined by companion',
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
      message: 'Booking request declined. Full refund will be processed for the hirer.',
    };
  }

  /**
   * Emergency cancellation with special handling
   */
  async emergencyCancellation(
    userId: string,
    bookingId: string,
    dto: EmergencyCancellationDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const isHirer = booking.hirerId === userId;
    const isCompanion = booking.companionId === userId;

    if (!isHirer && !isCompanion) {
      throw new ForbiddenException('Access denied');
    }

    // Can only emergency cancel pending or confirmed bookings
    if (
      booking.status !== BookingStatus.PENDING &&
      booking.status !== BookingStatus.CONFIRMED
    ) {
      throw new BadRequestException('Cannot cancel at this stage');
    }

    // Check if late cancellation
    const hoursUntilStart =
      (booking.startDatetime.getTime() - Date.now()) / (1000 * 60 * 60);
    const isLateCancel = hoursUntilStart < 24;

    // Update booking with emergency cancellation details
    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        paymentStatus: PaymentStatus.PENDING, // Hold pending admin verification
        cancelledAt: new Date(),
        cancelledBy: userId,
        cancelReason: `EMERGENCY: ${dto.emergencyType} - ${dto.description}`,
      },
    });

    // Create a pending strike that will be removed if emergency is verified
    if (isLateCancel && isHirer) {
      await this.prisma.userStrike.create({
        data: {
          userId: booking.hirerId,
          type: StrikeType.LATE_CANCELLATION,
          reason: `Emergency cancellation (${dto.emergencyType}) - pending verification`,
          bookingId: booking.id,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      });
    }

    this.logger.log(
      `Emergency cancellation: booking=${bookingId}, user=${userId}, type=${dto.emergencyType}, late=${isLateCancel}`,
    );

    return {
      id: updatedBooking.id,
      status: updatedBooking.status,
      paymentStatus: updatedBooking.paymentStatus,
      emergencyType: dto.emergencyType,
      message: 'Emergency cancellation submitted. Your request will be reviewed by our team within 24 hours.',
      nextSteps: [
        dto.proofDocumentUrl
          ? 'Your supporting document has been received.'
          : 'Please upload supporting documentation (medical certificate, etc.) to expedite verification.',
        'Refund will be processed after verification.',
        isLateCancel
          ? 'Any late cancellation penalties will be waived if emergency is verified.'
          : 'Full refund will be processed within 3-5 business days.',
      ],
      isLateCancel,
      verificationRequired: true,
    };
  }

  /**
   * Get user's emergency cancellation history
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
        cancelReason: { startsWith: 'EMERGENCY:' },
      },
      orderBy: { cancelledAt: 'desc' },
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
      (c) => c.paymentStatus === PaymentStatus.RELEASED,
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
          c.cancelReason?.replace('EMERGENCY: ', '').split(' - ')[0] || 'unknown',
        cancelledAt: c.cancelledAt?.toISOString() || '',
        status:
          c.paymentStatus === PaymentStatus.REFUNDED
            ? 'verified'
            : c.paymentStatus === PaymentStatus.RELEASED
              ? 'denied'
              : 'pending',
      })),
    };
  }
}
