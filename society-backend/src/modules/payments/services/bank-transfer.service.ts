import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaymentStatus, EarningsStatus } from '@generated/client';
import { BankTransferWebhookDto } from '../dto/payment.dto';

// Platform fee percentage (18%)
const PLATFORM_FEE_PERCENT = 18;

// Order reference patterns to extract from transfer notes
// Supports: "order-123", "ORDER-abc", "booking-uuid", "PAY-123"
const ORDER_REF_PATTERNS = [
  /order[_-]?([a-zA-Z0-9-]+)/i,
  /booking[_-]?([a-zA-Z0-9-]+)/i,
  /pay[_-]?([a-zA-Z0-9-]+)/i,
  /ref[_-]?([a-zA-Z0-9-]+)/i,
];

export type BankTransferResult = {
  success: boolean;
  paymentId?: string;
  message: string;
  orderReference?: string;
};

@Injectable()
export class BankTransferService {
  private readonly logger = new Logger(BankTransferService.name);
  private readonly webhookSecret: string;
  private readonly merchantAccount: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.webhookSecret = this.configService.get<string>('BANK_WEBHOOK_SECRET') || '';
    this.merchantAccount = this.configService.get<string>('MERCHANT_BANK_ACCOUNT') || '';

    if (!this.webhookSecret) {
      this.logger.warn('Bank webhook secret not configured');
    }
  }

  /**
   * Verify webhook signature from payment gateway
   */
  verifySignature(payload: BankTransferWebhookDto): boolean {
    if (!this.webhookSecret) {
      this.logger.warn('Bank webhook secret not configured, skipping verification');
      return false;
    }

    // Create signature from payload (excluding the signature field)
    const signData = `${payload.transactionId}|${payload.amount}|${payload.transferNote}|${payload.bankCode}|${payload.timestamp || ''}`;

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(signData)
      .digest('hex');

    return payload.signature === expectedSignature;
  }

  /**
   * Extract order reference from transfer note
   * Supports formats: "order-123", "ORDER-abc123", "booking-uuid", etc.
   */
  extractOrderReference(transferNote: string): string | null {
    if (!transferNote) return null;

    // Clean up the note (trim, normalize whitespace)
    const cleanNote = transferNote.trim().replace(/\s+/g, ' ');

    for (const pattern of ORDER_REF_PATTERNS) {
      const match = cleanNote.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    // If no pattern matches, try to extract any alphanumeric sequence
    // that looks like an ID (8+ chars)
    const genericMatch = cleanNote.match(/([a-zA-Z0-9-]{8,})/);
    if (genericMatch) {
      return genericMatch[1];
    }

    return null;
  }

  /**
   * Process incoming bank transfer webhook
   */
  async processIncomingPayment(payload: BankTransferWebhookDto): Promise<BankTransferResult> {
    this.logger.log(`Processing bank transfer: ${JSON.stringify({
      transactionId: payload.transactionId,
      amount: payload.amount,
      transferNote: payload.transferNote,
      bankCode: payload.bankCode,
    })}`);

    // Verify signature
    if (!this.verifySignature(payload)) {
      this.logger.warn(`Invalid signature for transaction ${payload.transactionId}`);
      return {
        success: false,
        message: 'Invalid signature',
      };
    }

    // Extract order reference from transfer note
    const orderReference = this.extractOrderReference(payload.transferNote);
    if (!orderReference) {
      this.logger.warn(`Could not extract order reference from note: ${payload.transferNote}`);
      return {
        success: false,
        message: 'Could not extract order reference from transfer note',
      };
    }

    this.logger.log(`Extracted order reference: ${orderReference}`);

    // Find matching payment by various methods
    const payment = await this.findPaymentByReference(orderReference, payload.amount);

    if (!payment) {
      this.logger.warn(`No matching payment found for reference: ${orderReference}`);
      return {
        success: false,
        message: 'No matching pending payment found',
        orderReference,
      };
    }

    // Verify amount matches (with small tolerance for bank fees)
    const amountTolerance = 0.01; // 1% tolerance
    const expectedAmount = payment.amount;
    const receivedAmount = payload.amount;

    if (Math.abs(receivedAmount - expectedAmount) / expectedAmount > amountTolerance) {
      this.logger.warn(`Amount mismatch: expected ${expectedAmount}, received ${receivedAmount}`);
      return {
        success: false,
        message: `Amount mismatch: expected ${expectedAmount} VND, received ${receivedAmount} VND`,
        orderReference,
        paymentId: payment.id,
      };
    }

    // Check for duplicate transaction
    const existingTransaction = await this.prisma.payment.findFirst({
      where: { providerTxnId: payload.transactionId },
    });

    if (existingTransaction) {
      this.logger.warn(`Duplicate transaction: ${payload.transactionId}`);
      return {
        success: false,
        message: 'Transaction already processed',
        orderReference,
        paymentId: existingTransaction.id,
      };
    }

    // Update payment status and create earnings record
    await this.processSuccessfulPayment(payment.id, payload);

    this.logger.log(`Bank transfer processed successfully for payment ${payment.id}`);

    return {
      success: true,
      paymentId: payment.id,
      message: 'Payment processed successfully',
      orderReference,
    };
  }

  /**
   * Find payment by reference (tries multiple lookup strategies)
   */
  private async findPaymentByReference(reference: string, amount: number) {
    // Strategy 1: Direct payment ID match
    let payment = await this.prisma.payment.findFirst({
      where: {
        id: reference,
        status: PaymentStatus.PENDING,
      },
      include: { booking: true },
    });

    if (payment) return payment;

    // Strategy 2: Look for payment where ID contains the reference
    // For truncated references (e.g., first 8 chars of UUID)
    const payments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PENDING,
      },
      include: { booking: true },
      take: 100,
    });

    // Find payment where ID starts with or contains the reference
    const normalizedRef = reference.replace(/-/g, '').toLowerCase();
    const paymentByTruncated = payments.find((p) => {
      const normalizedId = p.id.replace(/-/g, '').toLowerCase();
      return normalizedId.startsWith(normalizedRef) || normalizedId.includes(normalizedRef);
    });

    if (paymentByTruncated) return paymentByTruncated;

    // Strategy 3: Booking ID match
    const paymentByBooking = await this.prisma.payment.findFirst({
      where: {
        bookingId: reference,
        status: PaymentStatus.PENDING,
      },
      include: { booking: true },
    });

    if (paymentByBooking) return paymentByBooking;

    // Strategy 4: Match by exact amount for recent pending payments (last 24 hours)
    // This is a fallback when reference extraction fails
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const paymentByAmount = await this.prisma.payment.findFirst({
      where: {
        amount,
        status: PaymentStatus.PENDING,
        createdAt: { gte: twentyFourHoursAgo },
      },
      orderBy: { createdAt: 'desc' },
      include: { booking: true },
    });

    return paymentByAmount;
  }

  /**
   * Process successful payment - update status and create earnings
   */
  private async processSuccessfulPayment(
    paymentId: string,
    payload: BankTransferWebhookDto,
  ): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true },
    });

    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    // Update payment to HELD status (in escrow)
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.HELD,
        providerTxnId: payload.transactionId,
        paidAt: new Date(),
        providerResponse: {
          bankCode: payload.bankCode,
          senderAccount: payload.senderAccount,
          senderName: payload.senderName,
          transferNote: payload.transferNote,
          timestamp: payload.timestamp,
        },
      },
    });

    // Create earning record for companion
    const platformFee = Math.floor(payment.amount * PLATFORM_FEE_PERCENT / 100);
    const netAmount = payment.amount - platformFee;

    // Check if earning already exists (in case of retry)
    const existingEarning = await this.prisma.earning.findUnique({
      where: { bookingId: payment.bookingId },
    });

    if (!existingEarning) {
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
    }

    this.logger.log(`Payment ${paymentId} processed: held in escrow, earning created`);
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return !!this.webhookSecret;
  }
}
