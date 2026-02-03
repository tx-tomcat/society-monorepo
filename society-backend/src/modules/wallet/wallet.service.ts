import { SepayService } from '@/modules/payments/services/sepay.service';
import { PrismaService } from '@/prisma/prisma.service';
import { PaymentRequestStatus, PaymentRequestType } from '@generated/client';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BookingPaymentRequestResponse,
  CreateBookingPaymentRequestDto,
  CreateTopupDto,
  GetTransactionsQueryDto,
  PaymentRequestItem,
  PaymentRequestStatusResponse,
  SepayWebhookDto,
  TopupResponse,
  TransactionsResponse,
  WalletBalanceResponse,
} from './dto/wallet.dto';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private readonly expiryMinutes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sepayService: SepayService,
    private readonly configService: ConfigService,
  ) {
    this.expiryMinutes = this.configService.get<number>('TOPUP_EXPIRY_MINUTES', 30);
  }

  /**
   * Create a topup payment request
   */
  async createTopup(userId: string, dto: CreateTopupDto): Promise<TopupResponse> {
    // Generate unique code with retry
    let code: string;
    let attempts = 0;
    do {
      code = this.sepayService.generateCode();
      const exists = await this.prisma.paymentRequest.findUnique({
        where: { code },
      });
      if (!exists) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      throw new BadRequestException('Unable to generate unique payment code. Please try again.');
    }

    const expiresAt = new Date(Date.now() + this.expiryMinutes * 60 * 1000);

    const request = await this.prisma.paymentRequest.create({
      data: {
        userId,
        code,
        type: PaymentRequestType.TOPUP,
        amount: dto.amount,
        status: PaymentRequestStatus.PENDING,
        expiresAt,
      },
    });

    return {
      id: request.id,
      code: request.code,
      amount: request.amount,
      qrUrl: this.sepayService.generateQrUrl(dto.amount, code),
      deeplinks: this.sepayService.getBankDeeplinks(dto.amount, code),
      accountInfo: this.sepayService.getAccountInfo(),
      expiresAt: request.expiresAt.toISOString(),
    };
  }

  /**
   * Create a booking payment request (direct QR payment for booking)
   */
  async createBookingPaymentRequest(
    userId: string,
    dto: CreateBookingPaymentRequestDto,
  ): Promise<BookingPaymentRequestResponse> {
    // Find the booking and verify ownership
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { hirer: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.hirer?.id !== userId) {
      throw new BadRequestException('You are not authorized to pay for this booking');
    }

    // Check if there's already a pending payment request for this booking
    const existingRequest = await this.prisma.paymentRequest.findFirst({
      where: {
        bookingId: dto.bookingId,
        status: PaymentRequestStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingRequest) {
      return {
        id: existingRequest.id,
        code: existingRequest.code,
        amount: existingRequest.amount,
        bookingId: dto.bookingId,
        qrUrl: this.sepayService.generateQrUrl(existingRequest.amount, existingRequest.code),
        deeplinks: this.sepayService.getBankDeeplinks(existingRequest.amount, existingRequest.code),
        accountInfo: this.sepayService.getAccountInfo(),
        expiresAt: existingRequest.expiresAt.toISOString(),
      };
    }

    // Generate unique code
    let code: string;
    let attempts = 0;
    do {
      code = this.sepayService.generateCode();
      const exists = await this.prisma.paymentRequest.findUnique({
        where: { code },
      });
      if (!exists) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      throw new BadRequestException('Unable to generate unique payment code. Please try again.');
    }

    const expiresAt = new Date(Date.now() + this.expiryMinutes * 60 * 1000);

    const request = await this.prisma.paymentRequest.create({
      data: {
        userId,
        code,
        type: PaymentRequestType.BOOKING,
        amount: booking.totalPrice,
        status: PaymentRequestStatus.PENDING,
        bookingId: dto.bookingId,
        expiresAt,
      },
    });

    return {
      id: request.id,
      code: request.code,
      amount: request.amount,
      bookingId: dto.bookingId,
      qrUrl: this.sepayService.generateQrUrl(request.amount, code),
      deeplinks: this.sepayService.getBankDeeplinks(request.amount, code),
      accountInfo: this.sepayService.getAccountInfo(),
      expiresAt: request.expiresAt.toISOString(),
    };
  }

  /**
   * Get wallet balance for a user
   */
  async getBalance(userId: string): Promise<WalletBalanceResponse> {
    // Sum of completed topups
    const topups = await this.prisma.paymentRequest.aggregate({
      where: {
        userId,
        type: PaymentRequestType.TOPUP,
        status: PaymentRequestStatus.COMPLETED,
      },
      _sum: { amount: true },
    });

    // Sum of completed wallet payments (bookings and boosts paid from wallet)
    const spent = await this.prisma.paymentRequest.aggregate({
      where: {
        userId,
        type: { in: [PaymentRequestType.BOOKING, PaymentRequestType.BOOST] },
        status: PaymentRequestStatus.COMPLETED,
      },
      _sum: { amount: true },
    });

    // Pending topups
    const pending = await this.prisma.paymentRequest.aggregate({
      where: {
        userId,
        type: PaymentRequestType.TOPUP,
        status: PaymentRequestStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      _sum: { amount: true },
    });

    const totalTopups = topups._sum.amount || 0;
    const totalSpent = spent._sum.amount || 0;
    const pendingAmount = pending._sum.amount || 0;

    return {
      balance: totalTopups - totalSpent,
      pendingTopups: pendingAmount,
      currency: 'VND',
    };
  }

  /**
   * Get payment request transactions for a user
   */
  async getTransactions(
    userId: string,
    query: GetTransactionsQueryDto,
  ): Promise<TransactionsResponse> {
    const { page = 1, limit = 20, type } = query;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(type && type !== 'all' ? { type: type as PaymentRequestType } : {}),
    };

    const [transactions, total] = await Promise.all([
      this.prisma.paymentRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.paymentRequest.count({ where }),
    ]);

    const items: PaymentRequestItem[] = transactions.map((t) => ({
      id: t.id,
      code: t.code,
      type: t.type as 'TOPUP' | 'BOOKING',
      amount: t.amount,
      status: t.status as 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'FAILED',
      bookingId: t.bookingId,
      gateway: t.gateway,
      createdAt: t.createdAt.toISOString(),
      completedAt: t.completedAt?.toISOString() || null,
      expiresAt: t.expiresAt.toISOString(),
    }));

    return {
      transactions: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Process SePay webhook
   */
  async processWebhook(payload: SepayWebhookDto): Promise<void> {
    // Only process incoming payments
    if (payload.transferType !== 'in') {
      this.logger.debug(`Ignoring outgoing transfer: ${payload.id}`);
      return;
    }

    // Extract HM code from content
    const code = this.sepayService.extractCode(payload.content);
    console.log(code);
    if (!code) {
      this.logger.warn(`No HM code found in webhook content: ${payload.content}`);
      return;
    }

    // Find payment request
    const request = await this.prisma.paymentRequest.findUnique({
      where: { code },
    });

    if (!request) {
      this.logger.warn(`No payment request found for code: ${code}`);
      return;
    }

    // Check status - idempotent handling
    if (request.status === PaymentRequestStatus.COMPLETED) {
      this.logger.log(`Payment request ${code} already completed`);
      return;
    }

    if (request.status === PaymentRequestStatus.EXPIRED) {
      this.logger.warn(`Payment request ${code} has expired`);
      return;
    }

    if (request.status === PaymentRequestStatus.FAILED) {
      this.logger.warn(`Payment request ${code} already failed`);
      return;
    }

    // Validate amount (must be at least the expected amount)
    if (payload.transferAmount < request.amount) {
      await this.prisma.paymentRequest.update({
        where: { id: request.id },
        data: {
          status: PaymentRequestStatus.FAILED,
          gateway: payload.gateway,
          sepayId: payload.id,
          referenceCode: payload.referenceCode,
        },
      });
      this.logger.error(
        `Amount mismatch for ${code}: expected ${request.amount}, got ${payload.transferAmount}`,
      );
      return;
    }

    // Complete the payment request
    await this.prisma.paymentRequest.update({
      where: { id: request.id },
      data: {
        status: PaymentRequestStatus.COMPLETED,
        completedAt: new Date(),
        sepayId: payload.id,
        gateway: payload.gateway,
        referenceCode: payload.referenceCode,
      },
    });

    this.logger.log(`Payment request ${code} completed successfully`);

    // If booking payment, update booking status
    if (request.type === PaymentRequestType.BOOKING && request.bookingId) {
      await this.prisma.booking.update({
        where: { id: request.bookingId },
        data: { paymentStatus: 'PAID' },
      });
      this.logger.log(`Booking ${request.bookingId} marked as paid`);
    }

    // TODO: Send push notification to user
  }

  /**
   * Check if user can pay from wallet balance
   */
  async canPayFromWallet(userId: string, amount: number): Promise<boolean> {
    const { balance } = await this.getBalance(userId);
    return balance >= amount;
  }

  /**
   * Deduct amount from wallet balance (for boost purchases, etc.)
   * Creates a payment request record for tracking
   */
  async deductFromWallet(
    userId: string,
    amount: number,
    metadata?: { boostId?: string; description?: string },
  ): Promise<{ success: boolean; transactionId: string }> {
    // Verify sufficient balance
    const { balance } = await this.getBalance(userId);
    if (balance < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    // Generate unique code
    let code: string;
    let attempts = 0;
    do {
      code = this.sepayService.generateCode();
      const exists = await this.prisma.paymentRequest.findUnique({
        where: { code },
      });
      if (!exists) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      throw new BadRequestException('Unable to generate unique payment code. Please try again.');
    }

    // Create a completed BOOST payment request to track the deduction
    const request = await this.prisma.paymentRequest.create({
      data: {
        userId,
        code,
        type: PaymentRequestType.BOOST,
        amount,
        status: PaymentRequestStatus.COMPLETED,
        completedAt: new Date(),
        expiresAt: new Date(), // Already completed, no expiry needed
        boostId: metadata?.boostId,
      },
    });

    this.logger.log(`Wallet deduction of ${amount} VND for user ${userId}, transaction: ${request.id}`);

    return {
      success: true,
      transactionId: request.id,
    };
  }

  /**
   * Get payment request status by ID
   * Used for polling payment status from mobile app
   */
  async getPaymentRequestStatus(
    userId: string,
    requestId: string,
  ): Promise<PaymentRequestStatusResponse> {
    const request = await this.prisma.paymentRequest.findFirst({
      where: {
        id: requestId,
        userId,
      },
    });

    if (!request) {
      throw new NotFoundException('Payment request not found');
    }

    // Check if expired
    if (
      request.status === PaymentRequestStatus.PENDING &&
      request.expiresAt < new Date()
    ) {
      // Mark as expired
      await this.prisma.paymentRequest.update({
        where: { id: request.id },
        data: { status: PaymentRequestStatus.EXPIRED },
      });
      request.status = PaymentRequestStatus.EXPIRED;
    }

    return {
      id: request.id,
      code: request.code,
      status: request.status as 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'FAILED',
      amount: request.amount,
      bookingId: request.bookingId,
      completedAt: request.completedAt?.toISOString() || null,
    };
  }

  /**
   * Cleanup expired payment requests (called by cron)
   */
  async cleanupExpiredRequests(): Promise<number> {
    const result = await this.prisma.paymentRequest.updateMany({
      where: {
        status: PaymentRequestStatus.PENDING,
        expiresAt: { lt: new Date() },
      },
      data: { status: PaymentRequestStatus.EXPIRED },
    });

    if (result.count > 0) {
      this.logger.log(`Marked ${result.count} payment requests as expired`);
    }

    return result.count;
  }
}
