import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PaymentStatus, BookingStatus, EarningsStatus } from '@generated/client';
import { PaymentProvider as PrismaPaymentProvider } from '@generated/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateBookingPaymentDto, PaymentProvider, RefundRequestDto } from '../dto/payment.dto';
import { PaymentDetails, PaymentHistoryItem, PaymentInitResult } from '../interfaces/payment.interface';
import { MomoService } from './momo.service';
import { VnpayService } from './vnpay.service';
import { FraudDetectionService } from '../../security/services/fraud-detection.service';
import { FraudRiskLevel } from '../../security/dto/security.dto';

// Platform fee percentage (18%)
const PLATFORM_FEE_PERCENT = 18;

// Payment fraud detection thresholds
const PAYMENT_FRAUD_RULES = {
  MAX_PAYMENT_AMOUNT_VND: 50_000_000, // Max 50M VND per transaction
  MAX_DAILY_PAYMENTS: 5, // Max 5 payments per day per user
  MAX_DAILY_SPEND_VND: 100_000_000, // Max 100M VND per day
  SUSPICIOUS_NEW_ACCOUNT_THRESHOLD_HOURS: 24, // Flag payments from accounts < 24 hours old
  SUSPICIOUS_RAPID_BOOKINGS_THRESHOLD: 3, // Flag if 3+ bookings in 1 hour
} as const;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vnpayService: VnpayService,
    private readonly momoService: MomoService,
    private readonly fraudDetectionService: FraudDetectionService,
  ) {}

  /**
   * Create payment for a booking
   * Includes fraud detection checks before processing
   */
  async createBookingPayment(
    userId: string,
    dto: CreateBookingPaymentDto,
  ): Promise<PaymentInitResult> {
    // Get booking and verify ownership
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        companion: { select: { fullName: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.hirerId !== userId) {
      throw new ForbiddenException('Not authorized to pay for this booking');
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Booking must be confirmed before payment');
    }

    // Run payment fraud detection checks
    await this.runPaymentFraudChecks(userId, booking.totalPrice);

    // Check if payment already exists
    const existingPayment = await this.prisma.payment.findUnique({
      where: { bookingId: dto.bookingId },
    });

    if (existingPayment && existingPayment.status === PaymentStatus.PAID) {
      throw new BadRequestException('Booking already paid');
    }

    // Create or update payment record
    const payment = existingPayment
      ? await this.prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            provider: dto.provider as unknown as PrismaPaymentProvider,
            status: PaymentStatus.PENDING,
          },
        })
      : await this.prisma.payment.create({
          data: {
            bookingId: dto.bookingId,
            userId,
            amount: booking.totalPrice,
            currency: 'VND',
            provider: dto.provider as unknown as PrismaPaymentProvider,
            status: PaymentStatus.PENDING,
          },
        });

    // Create payment URL based on provider
    const description = `Booking with ${booking.companion.fullName || 'Companion'}`;

    let paymentInit: PaymentInitResult;
    switch (dto.provider) {
      case PaymentProvider.VNPAY:
        paymentInit = await this.vnpayService.createPayment(
          payment.id,
          booking.totalPrice,
          description,
          dto.returnUrl,
        );
        break;
      case PaymentProvider.MOMO:
        paymentInit = await this.momoService.createPayment(
          payment.id,
          booking.totalPrice,
          description,
          dto.returnUrl,
        );
        break;
      default:
        throw new BadRequestException('Unsupported payment provider');
    }

    return paymentInit;
  }

  /**
   * Get payment history for user
   */
  async getPaymentHistory(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<PaymentHistoryItem[]> {
    const payments = await this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return payments.map((p) => ({
      id: p.id,
      bookingId: p.bookingId,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      provider: p.provider,
      paidAt: p.paidAt,
      createdAt: p.createdAt,
    }));
  }

  /**
   * Get payment details by ID
   */
  async getPaymentById(userId: string, paymentId: string): Promise<PaymentDetails> {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, userId },
      include: {
        booking: {
          select: {
            id: true,
            startDatetime: true,
            durationHours: true,
            totalPrice: true,
            companion: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return {
      id: payment.id,
      bookingId: payment.bookingId,
      amount: payment.amount,
      currency: payment.currency,
      provider: payment.provider,
      status: payment.status,
      providerTxnId: payment.providerTxnId,
      paidAt: payment.paidAt,
      releasedAt: payment.releasedAt,
      refundedAt: payment.refundedAt,
      createdAt: payment.createdAt,
      booking: {
        id: payment.booking.id,
        startDatetime: payment.booking.startDatetime,
        durationHours: Number(payment.booking.durationHours),
        totalPrice: payment.booking.totalPrice,
        companion: {
          id: payment.booking.companion.id,
          fullName: payment.booking.companion.fullName,
        },
      },
    };
  }

  /**
   * Request refund for a payment
   */
  async requestRefund(userId: string, paymentId: string, dto: RefundRequestDto) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId,
        status: { in: [PaymentStatus.PAID, PaymentStatus.HELD] },
      },
      include: { booking: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment eligible for refund not found');
    }

    // Check if booking can be refunded (cancellation policy)
    const hoursUntilBooking = (payment.booking.startDatetime.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilBooking < 24) {
      throw new BadRequestException('Refund not available within 24 hours of booking');
    }

    const refundAmount = dto.amount || payment.amount;

    // Update payment status
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: refundAmount === payment.amount ? PaymentStatus.REFUNDED : PaymentStatus.PARTIAL_REFUND,
        refundedAt: new Date(),
      },
    });

    // Update booking status
    await this.prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: BookingStatus.CANCELLED },
    });

    this.logger.log(`Refund of ${refundAmount} VND processed for payment ${paymentId}`);

    return {
      paymentId,
      refundAmount,
      status: 'processed',
      message: 'Refund has been processed successfully',
    };
  }

  /**
   * Handle payment callback from provider
   */
  async handlePaymentCallback(
    paymentId: string,
    transactionId: string,
    success: boolean,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true },
    });

    if (!payment) {
      this.logger.warn(`Payment not found: ${paymentId}`);
      return;
    }

    if (success) {
      // Payment successful - hold in escrow
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.HELD,
          providerTxnId: transactionId,
          paidAt: new Date(),
        },
      });

      // Create earning record for companion (pending release)
      const platformFee = Math.floor(payment.amount * PLATFORM_FEE_PERCENT / 100);
      const netAmount = payment.amount - platformFee;

      await this.prisma.earning.create({
        data: {
          companionId: payment.booking.companionId,
          bookingId: payment.bookingId,
          grossAmount: payment.amount,
          platformFee,
          netAmount,
          status: EarningsStatus.PENDING,
        },
      });

      this.logger.log(`Payment ${paymentId} held in escrow, earning created`);
    } else {
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.FAILED },
      });

      this.logger.log(`Payment ${paymentId} failed`);
    }
  }

  /**
   * Release payment to companion after booking completion
   */
  async releasePayment(bookingId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });

    if (!payment || payment.status !== PaymentStatus.HELD) {
      this.logger.warn(`No held payment found for booking ${bookingId}`);
      return;
    }

    // Release payment
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.RELEASED,
        releasedAt: new Date(),
      },
    });

    // Update earning status
    await this.prisma.earning.updateMany({
      where: { bookingId },
      data: {
        status: EarningsStatus.AVAILABLE,
        releasedAt: new Date(),
      },
    });

    this.logger.log(`Payment released for booking ${bookingId}`);
  }

  /**
   * Run payment fraud detection checks
   * Blocks high-risk transactions and flags suspicious patterns
   */
  private async runPaymentFraudChecks(userId: string, amount: number): Promise<void> {
    const fraudCheckResults: string[] = [];

    // 1. Check maximum payment amount
    if (amount > PAYMENT_FRAUD_RULES.MAX_PAYMENT_AMOUNT_VND) {
      fraudCheckResults.push(`Payment amount exceeds maximum limit of ${PAYMENT_FRAUD_RULES.MAX_PAYMENT_AMOUNT_VND.toLocaleString()} VND`);
    }

    // 2. Get user and check account age
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    });

    if (user) {
      const accountAgeHours = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60);
      if (accountAgeHours < PAYMENT_FRAUD_RULES.SUSPICIOUS_NEW_ACCOUNT_THRESHOLD_HOURS) {
        // New account - run enhanced fraud check
        const riskAssessment = await this.fraudDetectionService.assessRisk(userId);

        if (riskAssessment.overallRisk === FraudRiskLevel.CRITICAL) {
          this.logger.error(`Payment blocked for user ${userId}: CRITICAL fraud risk level`);
          throw new ForbiddenException({
            message: 'Payment cannot be processed due to account security concerns. Please contact support.',
            error: 'FRAUD_RISK_CRITICAL',
            riskLevel: 'critical',
          });
        }

        if (riskAssessment.overallRisk === FraudRiskLevel.HIGH && amount > 10_000_000) {
          this.logger.warn(`High-value payment blocked for high-risk user ${userId}`);
          throw new ForbiddenException({
            message: 'High-value payments are temporarily restricted for your account. Please complete additional verification or contact support.',
            error: 'FRAUD_RISK_HIGH',
            riskLevel: 'high',
          });
        }
      }
    }

    // 3. Check daily payment count and total spend
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayPayments = await this.prisma.payment.findMany({
      where: {
        userId,
        createdAt: { gte: today, lt: tomorrow },
        status: { in: [PaymentStatus.PAID, PaymentStatus.HELD, PaymentStatus.PENDING] },
      },
      select: { amount: true },
    });

    // Check daily payment count
    if (todayPayments.length >= PAYMENT_FRAUD_RULES.MAX_DAILY_PAYMENTS) {
      this.logger.warn(`Daily payment limit reached for user ${userId}`);
      throw new BadRequestException({
        message: `You have reached the maximum of ${PAYMENT_FRAUD_RULES.MAX_DAILY_PAYMENTS} payments per day. Please try again tomorrow.`,
        error: 'DAILY_PAYMENT_LIMIT',
        limit: PAYMENT_FRAUD_RULES.MAX_DAILY_PAYMENTS,
      });
    }

    // Check daily spend limit
    const totalSpentToday = todayPayments.reduce((sum, p) => sum + p.amount, 0);
    if (totalSpentToday + amount > PAYMENT_FRAUD_RULES.MAX_DAILY_SPEND_VND) {
      const remainingLimit = PAYMENT_FRAUD_RULES.MAX_DAILY_SPEND_VND - totalSpentToday;
      this.logger.warn(`Daily spend limit exceeded for user ${userId}`);
      throw new BadRequestException({
        message: `This payment would exceed your daily spending limit of ${PAYMENT_FRAUD_RULES.MAX_DAILY_SPEND_VND.toLocaleString()} VND. Remaining today: ${remainingLimit.toLocaleString()} VND`,
        error: 'DAILY_SPEND_LIMIT',
        dailyLimit: PAYMENT_FRAUD_RULES.MAX_DAILY_SPEND_VND,
        remainingToday: remainingLimit,
      });
    }

    // 4. Check for rapid bookings (potential card testing)
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentBookings = await this.prisma.booking.count({
      where: {
        hirerId: userId,
        createdAt: { gte: hourAgo },
      },
    });

    if (recentBookings >= PAYMENT_FRAUD_RULES.SUSPICIOUS_RAPID_BOOKINGS_THRESHOLD) {
      // Check for suspicious patterns
      const patterns = await this.fraudDetectionService.detectSuspiciousPatterns(userId);

      if (patterns.includes('multiple_failed_payments')) {
        this.logger.error(`Potential card testing detected for user ${userId}`);
        throw new ForbiddenException({
          message: 'Too many payment attempts. Please wait before trying again or contact support.',
          error: 'SUSPICIOUS_ACTIVITY',
          reason: 'rapid_payments',
        });
      }
    }

    // 5. Log any collected fraud warnings (but don't block)
    if (fraudCheckResults.length > 0) {
      this.logger.warn(`Payment fraud warnings for user ${userId}: ${fraudCheckResults.join(', ')}`);
    }
  }
}
