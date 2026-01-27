# SePay Wallet Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement SePay QR-based payments for wallet topups and direct booking payments with `HM-XXXXXXX` code matching.

**Architecture:** Unified `PaymentRequest` model handles both topups and booking payments. SePay webhook matches payments by extracting `HM-XXXXXXX` code from transfer description. Wallet balance = SUM(completed topups) - SUM(spent from wallet).

**Tech Stack:** NestJS backend, Prisma ORM, React Native/Expo mobile, NativeWind styling, MotiView animations.

---

## Task 1: Database Migration - PaymentRequest Model

**Files:**
- Create: `society-backend/prisma/migrations/20260122_add_payment_request/migration.sql`
- Modify: `society-backend/prisma/schema.prisma`

**Step 1: Add PaymentRequest model to schema.prisma**

Add after the `PaymentStatusHistory` model (around line 636):

```prisma
// Payment Request for SePay QR payments (wallet topups and direct booking payments)
model PaymentRequest {
  id            String               @id @default(uuid()) @db.Uuid
  userId        String               @db.Uuid
  code          String               @unique  // HM-XXXXXXX format
  type          PaymentRequestType
  amount        Int                  // Amount in VND
  status        PaymentRequestStatus @default(PENDING)

  // For BOOKING type only
  bookingId     String?              @db.Uuid

  // SePay webhook data (populated on completion)
  sepayId       Int?
  gateway       String?
  referenceCode String?

  expiresAt     DateTime
  completedAt   DateTime?
  createdAt     DateTime             @default(now())
  updatedAt     DateTime             @updatedAt

  user          User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  booking       Booking?             @relation(fields: [bookingId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([code])
  @@index([status, expiresAt])
  @@map("payment_requests")
}

enum PaymentRequestType {
  TOPUP
  BOOKING
}

enum PaymentRequestStatus {
  PENDING
  COMPLETED
  EXPIRED
  FAILED
}
```

**Step 2: Add relation to User model**

In the `User` model, add:

```prisma
  paymentRequests PaymentRequest[]
```

**Step 3: Add relation to Booking model**

In the `Booking` model, add:

```prisma
  paymentRequests PaymentRequest[]
```

**Step 4: Generate migration**

Run:
```bash
cd society-backend && npx prisma migrate dev --name add_payment_request
```

Expected: Migration created successfully.

**Step 5: Verify generated client**

Run:
```bash
cd society-backend && npx prisma generate
```

Expected: Prisma Client generated.

**Step 6: Commit**

```bash
git add society-backend/prisma/
git commit -m "feat(db): add PaymentRequest model for SePay wallet integration"
```

---

## Task 2: Update PrismaService with PaymentRequest

**Files:**
- Modify: `society-backend/src/prisma/prisma.service.ts`

**Step 1: Add paymentRequest to CACHED_MODELS**

Find the `CACHED_MODELS` array and add `'paymentRequest'` in the Bookings & payments section:

```typescript
  // Bookings & payments
  'booking',
  'payment',
  'paymentRequest',  // Add this line
  'earning',
  'withdrawal',
  'bankAccount',
```

**Step 2: Add type declaration**

Find the model accessor declarations section (around line 483) and add:

```typescript
  // Bookings & payments
  declare booking: PrismaClient['booking'];
  declare payment: PrismaClient['payment'];
  declare paymentRequest: PrismaClient['paymentRequest'];  // Add this line
  declare earning: PrismaClient['earning'];
  declare withdrawal: PrismaClient['withdrawal'];
  declare bankAccount: PrismaClient['bankAccount'];
```

**Step 3: Verify TypeScript compiles**

Run:
```bash
cd society-backend && pnpm type-check
```

Expected: No errors.

**Step 4: Commit**

```bash
git add society-backend/src/prisma/prisma.service.ts
git commit -m "feat(prisma): add paymentRequest to cached models"
```

---

## Task 3: Create SePay Service

**Files:**
- Create: `society-backend/src/modules/payments/services/sepay.service.ts`

**Step 1: Create the SePay service file**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SepayService {
  private readonly logger = new Logger(SepayService.name);

  private readonly accountNumber: string;
  private readonly bankCode: string;
  private readonly accountName: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.accountNumber = this.configService.get<string>('SEPAY_ACCOUNT_NUMBER', '');
    this.bankCode = this.configService.get<string>('SEPAY_BANK_CODE', '');
    this.accountName = this.configService.get<string>('SEPAY_ACCOUNT_NAME', '');
    this.apiKey = this.configService.get<string>('SEPAY_API_KEY', '');
  }

  /**
   * Check if SePay is configured
   */
  isConfigured(): boolean {
    return !!(this.accountNumber && this.bankCode && this.apiKey);
  }

  /**
   * Generate unique HM-XXXXXXX code
   * Uses alphanumeric chars excluding confusing ones (0,O,1,I,L)
   */
  generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'HM-';
    for (let i = 0; i < 7; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Build SePay QR URL
   */
  generateQrUrl(amount: number, code: string): string {
    const params = new URLSearchParams({
      acc: this.accountNumber,
      bank: this.bankCode,
      amount: amount.toString(),
      des: code,
    });
    return `https://qr.sepay.vn/img?${params.toString()}`;
  }

  /**
   * Get bank app deeplinks for Vietnamese banks
   */
  getBankDeeplinks(amount: number, code: string): Record<string, string> {
    const acc = this.accountNumber;
    const name = encodeURIComponent(this.accountName);

    return {
      tpbank: `https://link.tpb.vn/transfer?acc=${acc}&bank=TPB&amount=${amount}&memo=${code}&name=${name}`,
      vietcombank: `https://vcbdigibank.vietcombank.com.vn/transfer?acc=${acc}&amount=${amount}&memo=${code}`,
      techcombank: `https://link.techcombank.com/transfer?acc=${acc}&amount=${amount}&memo=${code}`,
      mbbank: `https://online.mbbank.com.vn/transfer?acc=${acc}&amount=${amount}&memo=${code}`,
      acb: `https://acb.com.vn/transfer?acc=${acc}&amount=${amount}&memo=${code}`,
      bidv: `https://smartbanking.bidv.com.vn/transfer?acc=${acc}&amount=${amount}&memo=${code}`,
    };
  }

  /**
   * Verify webhook API key from Authorization header
   */
  verifyWebhook(authHeader: string | undefined): boolean {
    if (!authHeader) return false;
    const expected = `Apikey ${this.apiKey}`;
    return authHeader === expected;
  }

  /**
   * Extract HM-XXXXXXX code from webhook content field
   */
  extractCode(content: string): string | null {
    if (!content) return null;
    const match = content.match(/HM-([A-Z0-9]{7})/i);
    return match ? match[0].toUpperCase() : null;
  }

  /**
   * Get account info for display
   */
  getAccountInfo(): { bankCode: string; accountNumber: string; accountName: string } {
    return {
      bankCode: this.bankCode,
      accountNumber: this.accountNumber,
      accountName: this.accountName,
    };
  }
}
```

**Step 2: Verify TypeScript compiles**

Run:
```bash
cd society-backend && pnpm type-check
```

Expected: No errors.

**Step 3: Commit**

```bash
git add society-backend/src/modules/payments/services/sepay.service.ts
git commit -m "feat(payments): add SePay service for QR generation and webhook verification"
```

---

## Task 4: Create Wallet DTOs

**Files:**
- Create: `society-backend/src/modules/wallet/dto/wallet.dto.ts`

**Step 1: Create the wallet DTOs file**

```typescript
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

// ============ Request DTOs ============

export class CreateTopupDto {
  @IsInt()
  @Min(100000, { message: 'Minimum topup amount is 100,000 VND' })
  @Max(50000000, { message: 'Maximum topup amount is 50,000,000 VND' })
  amount: number;
}

export class CreateBookingPaymentRequestDto {
  @IsUUID()
  bookingId: string;
}

export class GetTransactionsQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  type?: 'TOPUP' | 'BOOKING' | 'all';
}

// ============ Response DTOs ============

export interface TopupResponse {
  id: string;
  code: string;
  amount: number;
  qrUrl: string;
  deeplinks: Record<string, string>;
  accountInfo: {
    bankCode: string;
    accountNumber: string;
    accountName: string;
  };
  expiresAt: string;
}

export interface BookingPaymentRequestResponse {
  id: string;
  code: string;
  amount: number;
  bookingId: string;
  qrUrl: string;
  deeplinks: Record<string, string>;
  accountInfo: {
    bankCode: string;
    accountNumber: string;
    accountName: string;
  };
  expiresAt: string;
}

export interface WalletBalanceResponse {
  balance: number;
  pendingTopups: number;
  currency: string;
}

export interface PaymentRequestItem {
  id: string;
  code: string;
  type: 'TOPUP' | 'BOOKING';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'FAILED';
  bookingId: string | null;
  gateway: string | null;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string;
}

export interface TransactionsResponse {
  transactions: PaymentRequestItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============ SePay Webhook DTO ============

export class SepayWebhookDto {
  @IsInt()
  id: number;

  @IsString()
  gateway: string;

  @IsString()
  transactionDate: string;

  @IsString()
  accountNumber: string;

  @IsOptional()
  @IsString()
  code: string | null;

  @IsString()
  content: string;

  @IsString()
  transferType: string;

  @IsInt()
  transferAmount: number;

  @IsInt()
  accumulated: number;

  @IsOptional()
  @IsString()
  subAccount: string | null;

  @IsString()
  referenceCode: string;

  @IsOptional()
  @IsString()
  description: string;
}
```

**Step 2: Commit**

```bash
mkdir -p society-backend/src/modules/wallet/dto
git add society-backend/src/modules/wallet/dto/wallet.dto.ts
git commit -m "feat(wallet): add wallet DTOs for topup and transactions"
```

---

## Task 5: Create Wallet Service

**Files:**
- Create: `society-backend/src/modules/wallet/wallet.service.ts`

**Step 1: Create the wallet service file**

```typescript
import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentRequestStatus, PaymentRequestType } from '@generated/client';
import { PrismaService } from '@/prisma/prisma.service';
import { SepayService } from '@/modules/payments/services/sepay.service';
import {
  CreateTopupDto,
  CreateBookingPaymentRequestDto,
  GetTransactionsQueryDto,
  TopupResponse,
  BookingPaymentRequestResponse,
  WalletBalanceResponse,
  TransactionsResponse,
  PaymentRequestItem,
  SepayWebhookDto,
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

    if (booking.hirer?.userId !== userId) {
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
        amount: booking.totalAmount,
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

    // Sum of completed wallet payments (bookings paid from wallet - marked by walletPayment flag)
    // For now, we track spending through completed BOOKING type requests
    const spent = await this.prisma.paymentRequest.aggregate({
      where: {
        userId,
        type: PaymentRequestType.BOOKING,
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
      this.logger.info(`Payment request ${code} already completed`);
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

    // Validate amount (exact match required)
    if (payload.transferAmount !== request.amount) {
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
```

**Step 2: Verify TypeScript compiles**

Run:
```bash
cd society-backend && pnpm type-check
```

Expected: No errors (may have some import path issues to fix).

**Step 3: Commit**

```bash
git add society-backend/src/modules/wallet/wallet.service.ts
git commit -m "feat(wallet): add wallet service with topup, balance, and webhook processing"
```

---

## Task 6: Create Wallet Controller

**Files:**
- Create: `society-backend/src/modules/wallet/wallet.controller.ts`

**Step 1: Create the wallet controller file**

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { SepayService } from '@/modules/payments/services/sepay.service';
import { WalletService } from './wallet.service';
import {
  CreateTopupDto,
  CreateBookingPaymentRequestDto,
  GetTransactionsQueryDto,
  TopupResponse,
  BookingPaymentRequestResponse,
  WalletBalanceResponse,
  TransactionsResponse,
  SepayWebhookDto,
} from './dto/wallet.dto';

@Controller('wallet')
export class WalletController {
  private readonly logger = new Logger(WalletController.name);

  constructor(
    private readonly walletService: WalletService,
    private readonly sepayService: SepayService,
  ) {}

  /**
   * Create a topup payment request
   */
  @Post('topup')
  @UseGuards(JwtAuthGuard)
  async createTopup(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTopupDto,
  ): Promise<TopupResponse> {
    return this.walletService.createTopup(userId, dto);
  }

  /**
   * Create a booking payment request (QR payment for booking)
   */
  @Post('booking-payment')
  @UseGuards(JwtAuthGuard)
  async createBookingPaymentRequest(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBookingPaymentRequestDto,
  ): Promise<BookingPaymentRequestResponse> {
    return this.walletService.createBookingPaymentRequest(userId, dto);
  }

  /**
   * Get wallet balance
   */
  @Get('balance')
  @UseGuards(JwtAuthGuard)
  async getBalance(@CurrentUser('id') userId: string): Promise<WalletBalanceResponse> {
    return this.walletService.getBalance(userId);
  }

  /**
   * Get payment request transactions
   */
  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  async getTransactions(
    @CurrentUser('id') userId: string,
    @Query() query: GetTransactionsQueryDto,
  ): Promise<TransactionsResponse> {
    return this.walletService.getTransactions(userId, query);
  }

  /**
   * Check if user can pay a specific amount from wallet
   */
  @Get('can-pay')
  @UseGuards(JwtAuthGuard)
  async canPayFromWallet(
    @CurrentUser('id') userId: string,
    @Query('amount') amount: string,
  ): Promise<{ canPay: boolean; balance: number }> {
    const amountNum = parseInt(amount, 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      return { canPay: false, balance: 0 };
    }
    const canPay = await this.walletService.canPayFromWallet(userId, amountNum);
    const { balance } = await this.walletService.getBalance(userId);
    return { canPay, balance };
  }
}

/**
 * Separate controller for webhooks (no auth guard, uses API key)
 */
@Controller('webhooks')
export class SepayWebhookController {
  private readonly logger = new Logger(SepayWebhookController.name);

  constructor(
    private readonly walletService: WalletService,
    private readonly sepayService: SepayService,
  ) {}

  /**
   * SePay webhook endpoint
   */
  @Post('payment')
  @HttpCode(HttpStatus.OK)
  async handleSepayWebhook(
    @Headers('authorization') authHeader: string,
    @Body() payload: SepayWebhookDto,
  ): Promise<{ success: boolean }> {
    // Verify API key
    if (!this.sepayService.verifyWebhook(authHeader)) {
      this.logger.warn('Invalid SePay webhook API key');
      throw new UnauthorizedException('Invalid API key');
    }

    this.logger.log(`Received SePay webhook: ${JSON.stringify(payload)}`);

    try {
      await this.walletService.processWebhook(payload);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error processing SePay webhook: ${error.message}`);
      // Still return success to prevent retries for our errors
      return { success: true };
    }
  }
}
```

**Step 2: Commit**

```bash
git add society-backend/src/modules/wallet/wallet.controller.ts
git commit -m "feat(wallet): add wallet and webhook controllers"
```

---

## Task 7: Create Wallet Module

**Files:**
- Create: `society-backend/src/modules/wallet/wallet.module.ts`

**Step 1: Create the wallet module file**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '@/prisma/prisma.module';
import { SepayService } from '@/modules/payments/services/sepay.service';
import { WalletService } from './wallet.service';
import { WalletController, SepayWebhookController } from './wallet.controller';
import { WalletScheduler } from './wallet.scheduler';

@Module({
  imports: [ConfigModule, PrismaModule, ScheduleModule.forRoot()],
  controllers: [WalletController, SepayWebhookController],
  providers: [WalletService, SepayService, WalletScheduler],
  exports: [WalletService, SepayService],
})
export class WalletModule {}
```

**Step 2: Create the wallet scheduler for cleanup cron**

Create `society-backend/src/modules/wallet/wallet.scheduler.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WalletService } from './wallet.service';

@Injectable()
export class WalletScheduler {
  private readonly logger = new Logger(WalletScheduler.name);

  constructor(private readonly walletService: WalletService) {}

  /**
   * Cleanup expired payment requests every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleExpiredRequests(): Promise<void> {
    this.logger.debug('Running expired payment requests cleanup...');
    await this.walletService.cleanupExpiredRequests();
  }
}
```

**Step 3: Commit**

```bash
git add society-backend/src/modules/wallet/
git commit -m "feat(wallet): add wallet module with scheduler for expired cleanup"
```

---

## Task 8: Register Wallet Module in App

**Files:**
- Modify: `society-backend/src/app.module.ts`

**Step 1: Import WalletModule**

Add to imports array:

```typescript
import { WalletModule } from '@/modules/wallet/wallet.module';

@Module({
  imports: [
    // ... existing imports
    WalletModule,
  ],
  // ...
})
export class AppModule {}
```

**Step 2: Add environment variables to .env.example**

Add to `society-backend/.env.example`:

```bash
# SePay Configuration
SEPAY_ACCOUNT_NUMBER=94886886886
SEPAY_BANK_CODE=TPBank
SEPAY_ACCOUNT_NAME=NGUYEN DINH DUNG
SEPAY_API_KEY=your_webhook_api_key

# Topup Configuration
TOPUP_MIN_AMOUNT=100000
TOPUP_MAX_AMOUNT=50000000
TOPUP_EXPIRY_MINUTES=30
```

**Step 3: Verify backend compiles and runs**

Run:
```bash
cd society-backend && pnpm build
```

Expected: Build successful.

**Step 4: Commit**

```bash
git add society-backend/src/app.module.ts society-backend/.env.example
git commit -m "feat(app): register wallet module and add SePay env vars"
```

---

## Task 9: Create Mobile Wallet API Service

**Files:**
- Create: `society-mobile/src/lib/api/services/wallet.service.ts`

**Step 1: Create the wallet API service**

```typescript
import { client } from '../client';

// ============ Types ============

export interface TopupResponse {
  id: string;
  code: string;
  amount: number;
  qrUrl: string;
  deeplinks: Record<string, string>;
  accountInfo: {
    bankCode: string;
    accountNumber: string;
    accountName: string;
  };
  expiresAt: string;
}

export interface BookingPaymentRequestResponse {
  id: string;
  code: string;
  amount: number;
  bookingId: string;
  qrUrl: string;
  deeplinks: Record<string, string>;
  accountInfo: {
    bankCode: string;
    accountNumber: string;
    accountName: string;
  };
  expiresAt: string;
}

export interface WalletBalanceResponse {
  balance: number;
  pendingTopups: number;
  currency: string;
}

export interface PaymentRequestItem {
  id: string;
  code: string;
  type: 'TOPUP' | 'BOOKING';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'FAILED';
  bookingId: string | null;
  gateway: string | null;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string;
}

export interface TransactionsResponse {
  transactions: PaymentRequestItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CanPayResponse {
  canPay: boolean;
  balance: number;
}

// ============ API Service ============

export const walletService = {
  /**
   * Create a topup payment request
   */
  createTopup: async (amount: number): Promise<TopupResponse> => {
    const response = await client.post('/wallet/topup', { amount });
    return response.data;
  },

  /**
   * Create a booking payment request (QR for direct booking payment)
   */
  createBookingPaymentRequest: async (bookingId: string): Promise<BookingPaymentRequestResponse> => {
    const response = await client.post('/wallet/booking-payment', { bookingId });
    return response.data;
  },

  /**
   * Get wallet balance
   */
  getBalance: async (): Promise<WalletBalanceResponse> => {
    const response = await client.get('/wallet/balance');
    return response.data;
  },

  /**
   * Get payment request transactions
   */
  getTransactions: async (
    page: number = 1,
    limit: number = 20,
    type?: 'TOPUP' | 'BOOKING' | 'all',
  ): Promise<TransactionsResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(type && { type }),
    });
    const response = await client.get(`/wallet/transactions?${params}`);
    return response.data;
  },

  /**
   * Check if user can pay from wallet
   */
  canPayFromWallet: async (amount: number): Promise<CanPayResponse> => {
    const response = await client.get(`/wallet/can-pay?amount=${amount}`);
    return response.data;
  },
};
```

**Step 2: Export from services index**

Add to `society-mobile/src/lib/api/services/index.ts`:

```typescript
export * from './wallet.service';
```

**Step 3: Commit**

```bash
git add society-mobile/src/lib/api/services/wallet.service.ts society-mobile/src/lib/api/services/index.ts
git commit -m "feat(mobile): add wallet API service"
```

---

## Task 10: Create Mobile Wallet Hooks

**Files:**
- Create: `society-mobile/src/lib/hooks/use-wallet.ts`

**Step 1: Create the wallet hooks file**

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { walletService, WalletBalanceResponse, TransactionsResponse, TopupResponse } from '../api/services/wallet.service';

// Query keys
export const walletKeys = {
  all: ['wallet'] as const,
  balance: () => [...walletKeys.all, 'balance'] as const,
  transactions: (page: number, type?: string) => [...walletKeys.all, 'transactions', page, type] as const,
  canPay: (amount: number) => [...walletKeys.all, 'can-pay', amount] as const,
};

/**
 * Get wallet balance
 */
export function useWalletBalance() {
  return useQuery<WalletBalanceResponse>({
    queryKey: walletKeys.balance(),
    queryFn: () => walletService.getBalance(),
  });
}

/**
 * Get wallet transactions
 */
export function useWalletTransactions(page: number = 1, type?: 'TOPUP' | 'BOOKING' | 'all') {
  return useQuery<TransactionsResponse>({
    queryKey: walletKeys.transactions(page, type),
    queryFn: () => walletService.getTransactions(page, 20, type),
  });
}

/**
 * Check if can pay from wallet
 */
export function useCanPayFromWallet(amount: number) {
  return useQuery({
    queryKey: walletKeys.canPay(amount),
    queryFn: () => walletService.canPayFromWallet(amount),
    enabled: amount > 0,
  });
}

/**
 * Create topup mutation
 */
export function useCreateTopup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amount: number) => walletService.createTopup(amount),
    onSuccess: () => {
      // Invalidate balance and transactions after creating topup
      queryClient.invalidateQueries({ queryKey: walletKeys.balance() });
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}

/**
 * Create booking payment request mutation
 */
export function useCreateBookingPaymentRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => walletService.createBookingPaymentRequest(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}
```

**Step 2: Export from hooks index**

Add to `society-mobile/src/lib/hooks/index.tsx`:

```typescript
export * from './use-wallet';
```

**Step 3: Commit**

```bash
git add society-mobile/src/lib/hooks/use-wallet.ts society-mobile/src/lib/hooks/index.tsx
git commit -m "feat(mobile): add wallet React Query hooks"
```

---

## Task 11: Create Mobile Wallet Balance Screen

**Files:**
- Create: `society-mobile/src/app/hirer/wallet/index.tsx`

**Step 1: Use frontend-design skill to design the wallet balance screen**

Reference: Follow the existing `society-mobile/src/app/companion/earnings/index.tsx` pattern.

Design requirements:
- Header with back button and title "Wallet"
- Large balance card with wallet icon (lavender background)
- "Top Up" primary button (rose-400)
- Pending topups indicator if any
- Transaction history list with pull-to-refresh
- Transaction items show: icon, description, amount, status, date
- Use colors from colors.js: rose-400, lavender-400, teal-400
- Use existing icons: Wallet, ArrowLeft, Plus, CheckCircle, Clock, XCircle
- MotiView animations with staggered delays

**IMPORTANT:** Use `Skill` tool with `frontend-design:frontend-design` to generate this screen.

---

## Task 12: Create Mobile Topup Screen with QR Display

**Files:**
- Create: `society-mobile/src/app/hirer/wallet/topup.tsx`

**Step 1: Use frontend-design skill to design the topup screen**

Design requirements:
- Header with back button and title "Top Up"
- Amount input section:
  - Large TextInput with number-pad keyboard
  - Vietnamese currency formatting (toLocaleString('vi-VN'))
  - Validation: 100,000 - 50,000,000 VND
  - Error message display
- Quick amount buttons: 100K, 200K, 500K, 1M, 2M, 5M (grid layout)
- "Generate QR Code" button (rose-400)
- After QR generated, show:
  - QR code image from qrUrl (using Image component)
  - Payment code: HM-XXXXXXX (with copy button)
  - Amount display
  - Countdown timer showing expiry
  - Account info: Bank, Account Number, Account Name
  - "Download QR" button
  - Bank app deeplinks section with bank icons (horizontal scroll)
- Use colors: rose-400 (primary), lavender-400 (secondary), teal-400 (success)
- Use icons: Wallet, ArrowLeft, Copy, Download, Clock
- MotiView animations

**IMPORTANT:** Use `Skill` tool with `frontend-design:frontend-design` to generate this screen.

---

## Task 13: Add Wallet Option to Booking Payment Screen

**Files:**
- Modify: `society-mobile/src/app/hirer/booking/payment.tsx`

**Step 1: Add wallet payment method option**

In the payment methods array, add wallet option at the beginning:

```typescript
const [walletBalance, setWalletBalance] = useState<number>(0);
const { data: balanceData } = useWalletBalance();

useEffect(() => {
  if (balanceData) {
    setWalletBalance(balanceData.balance);
  }
}, [balanceData]);

const paymentMethods: PaymentMethod[] = [
  // Add wallet option first if balance is sufficient
  ...(walletBalance >= totalAmount ? [{
    id: 'wallet',
    name: t('hirer.payment.wallet'),
    description: `${t('hirer.payment.balance')}: ${walletBalance.toLocaleString('vi-VN')}đ`,
    icon: Wallet,
    provider: 'wallet' as const,
  }] : []),
  // ... existing methods
];
```

**Step 2: Handle wallet payment selection**

Add logic to handle instant wallet payment vs redirect to QR screen for bank_transfer.

**Step 3: Commit**

```bash
git add society-mobile/src/app/hirer/booking/payment.tsx
git commit -m "feat(mobile): add wallet payment option to booking payment screen"
```

---

## Task 14: Add Translations

**Files:**
- Modify: `society-mobile/src/translations/en.json`
- Modify: `society-mobile/src/translations/vi.json`

**Step 1: Add English translations**

Add to `en.json` under `hirer`:

```json
"wallet": {
  "title": "Wallet",
  "balance": "Available Balance",
  "pending": "Pending Topups",
  "topup": "Top Up",
  "topup_title": "Top Up Wallet",
  "enter_amount": "Enter Amount",
  "amount_placeholder": "Enter amount",
  "min_amount": "Minimum: 100,000đ",
  "max_amount": "Maximum: 50,000,000đ",
  "quick_amounts": "Quick Amounts",
  "generate_qr": "Generate QR Code",
  "qr_title": "Scan QR to Pay",
  "payment_code": "Payment Code",
  "copy_code": "Copy",
  "copied": "Copied!",
  "download_qr": "Download QR",
  "expires_in": "Expires in",
  "bank_apps": "Open Bank App",
  "account_info": "Transfer to",
  "bank": "Bank",
  "account_number": "Account Number",
  "account_name": "Account Name",
  "transactions": "Transaction History",
  "no_transactions": "No transactions yet",
  "topup_success": "Top up successful!",
  "topup_pending": "Waiting for payment...",
  "topup_expired": "Payment expired",
  "topup_failed": "Payment failed",
  "status": {
    "pending": "Pending",
    "completed": "Completed",
    "expired": "Expired",
    "failed": "Failed"
  }
},
"payment": {
  "wallet": "Pay from Wallet",
  "balance": "Balance"
}
```

**Step 2: Add Vietnamese translations**

Add to `vi.json` under `hirer`:

```json
"wallet": {
  "title": "Ví",
  "balance": "Số dư khả dụng",
  "pending": "Đang chờ nạp",
  "topup": "Nạp tiền",
  "topup_title": "Nạp tiền vào ví",
  "enter_amount": "Nhập số tiền",
  "amount_placeholder": "Nhập số tiền",
  "min_amount": "Tối thiểu: 100.000đ",
  "max_amount": "Tối đa: 50.000.000đ",
  "quick_amounts": "Số tiền nhanh",
  "generate_qr": "Tạo mã QR",
  "qr_title": "Quét QR để thanh toán",
  "payment_code": "Mã thanh toán",
  "copy_code": "Sao chép",
  "copied": "Đã sao chép!",
  "download_qr": "Tải QR",
  "expires_in": "Hết hạn sau",
  "bank_apps": "Mở ứng dụng ngân hàng",
  "account_info": "Chuyển khoản đến",
  "bank": "Ngân hàng",
  "account_number": "Số tài khoản",
  "account_name": "Chủ tài khoản",
  "transactions": "Lịch sử giao dịch",
  "no_transactions": "Chưa có giao dịch",
  "topup_success": "Nạp tiền thành công!",
  "topup_pending": "Đang chờ thanh toán...",
  "topup_expired": "Thanh toán hết hạn",
  "topup_failed": "Thanh toán thất bại",
  "status": {
    "pending": "Đang chờ",
    "completed": "Hoàn thành",
    "expired": "Hết hạn",
    "failed": "Thất bại"
  }
},
"payment": {
  "wallet": "Thanh toán từ ví",
  "balance": "Số dư"
}
```

**Step 3: Commit**

```bash
git add society-mobile/src/translations/
git commit -m "feat(i18n): add wallet translations for English and Vietnamese"
```

---

## Task 15: Backend Tests for Wallet Service

**Files:**
- Create: `society-backend/src/modules/wallet/wallet.service.spec.ts`

**Step 1: Create test file**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WalletService } from './wallet.service';
import { SepayService } from '@/modules/payments/services/sepay.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('WalletService', () => {
  let service: WalletService;
  let prisma: PrismaService;
  let sepayService: SepayService;

  const mockPrisma = {
    paymentRequest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      aggregate: jest.fn(),
    },
    booking: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockSepayService = {
    generateCode: jest.fn().mockReturnValue('HM-ABC1234'),
    generateQrUrl: jest.fn().mockReturnValue('https://qr.sepay.vn/img?...'),
    getBankDeeplinks: jest.fn().mockReturnValue({ tpbank: 'https://...' }),
    getAccountInfo: jest.fn().mockReturnValue({
      bankCode: 'TPBank',
      accountNumber: '94886886886',
      accountName: 'NGUYEN DINH DUNG',
    }),
    extractCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SepayService, useValue: mockSepayService },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(30) },
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    prisma = module.get<PrismaService>(PrismaService);
    sepayService = module.get<SepayService>(SepayService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTopup', () => {
    it('should create a topup payment request', async () => {
      const userId = 'user-123';
      const amount = 500000;

      mockPrisma.paymentRequest.findUnique.mockResolvedValue(null);
      mockPrisma.paymentRequest.create.mockResolvedValue({
        id: 'request-123',
        code: 'HM-ABC1234',
        amount,
        expiresAt: new Date(),
      });

      const result = await service.createTopup(userId, { amount });

      expect(result.code).toBe('HM-ABC1234');
      expect(result.amount).toBe(amount);
      expect(result.qrUrl).toBeDefined();
      expect(mockPrisma.paymentRequest.create).toHaveBeenCalled();
    });
  });

  describe('getBalance', () => {
    it('should calculate wallet balance correctly', async () => {
      const userId = 'user-123';

      mockPrisma.paymentRequest.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 1000000 } }) // topups
        .mockResolvedValueOnce({ _sum: { amount: 300000 } })  // spent
        .mockResolvedValueOnce({ _sum: { amount: 200000 } }); // pending

      const result = await service.getBalance(userId);

      expect(result.balance).toBe(700000);
      expect(result.pendingTopups).toBe(200000);
    });
  });

  describe('processWebhook', () => {
    it('should complete payment request on valid webhook', async () => {
      const payload = {
        id: 12345,
        gateway: 'TPBank',
        transactionDate: '2026-01-22 10:00:00',
        accountNumber: '94886886886',
        code: null,
        content: 'Chuyen tien HM-ABC1234',
        transferType: 'in',
        transferAmount: 500000,
        accumulated: 1000000,
        subAccount: null,
        referenceCode: 'REF123',
        description: '',
      };

      mockSepayService.extractCode.mockReturnValue('HM-ABC1234');
      mockPrisma.paymentRequest.findUnique.mockResolvedValue({
        id: 'request-123',
        code: 'HM-ABC1234',
        amount: 500000,
        status: 'PENDING',
        type: 'TOPUP',
        bookingId: null,
      });
      mockPrisma.paymentRequest.update.mockResolvedValue({});

      await service.processWebhook(payload);

      expect(mockPrisma.paymentRequest.update).toHaveBeenCalledWith({
        where: { id: 'request-123' },
        data: expect.objectContaining({
          status: 'COMPLETED',
          sepayId: 12345,
          gateway: 'TPBank',
        }),
      });
    });

    it('should fail payment on amount mismatch', async () => {
      const payload = {
        id: 12345,
        gateway: 'TPBank',
        transactionDate: '2026-01-22 10:00:00',
        accountNumber: '94886886886',
        code: null,
        content: 'Chuyen tien HM-ABC1234',
        transferType: 'in',
        transferAmount: 400000, // Wrong amount
        accumulated: 1000000,
        subAccount: null,
        referenceCode: 'REF123',
        description: '',
      };

      mockSepayService.extractCode.mockReturnValue('HM-ABC1234');
      mockPrisma.paymentRequest.findUnique.mockResolvedValue({
        id: 'request-123',
        code: 'HM-ABC1234',
        amount: 500000,
        status: 'PENDING',
      });
      mockPrisma.paymentRequest.update.mockResolvedValue({});

      await service.processWebhook(payload);

      expect(mockPrisma.paymentRequest.update).toHaveBeenCalledWith({
        where: { id: 'request-123' },
        data: expect.objectContaining({
          status: 'FAILED',
        }),
      });
    });
  });
});
```

**Step 2: Run tests**

Run:
```bash
cd society-backend && pnpm test -- --testPathPattern=wallet.service.spec
```

Expected: All tests pass.

**Step 3: Commit**

```bash
git add society-backend/src/modules/wallet/wallet.service.spec.ts
git commit -m "test(wallet): add unit tests for wallet service"
```

---

## Task 16: Final Integration Testing

**Step 1: Start backend server**

```bash
cd society-backend && pnpm dev
```

**Step 2: Test API endpoints with curl**

```bash
# Test create topup (replace TOKEN with valid JWT)
curl -X POST http://localhost:3000/wallet/topup \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 500000}'

# Test get balance
curl http://localhost:3000/wallet/balance \
  -H "Authorization: Bearer TOKEN"

# Test webhook (replace API_KEY)
curl -X POST http://localhost:3000/webhooks/payment \
  -H "Authorization: Apikey API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 12345,
    "gateway": "TPBank",
    "transactionDate": "2026-01-22 10:00:00",
    "accountNumber": "94886886886",
    "code": null,
    "content": "Chuyen tien HM-ABC1234",
    "transferType": "in",
    "transferAmount": 500000,
    "accumulated": 1000000,
    "subAccount": null,
    "referenceCode": "REF123",
    "description": ""
  }'
```

**Step 3: Test mobile app**

```bash
cd society-mobile && pnpm start
```

Navigate to wallet screens and verify:
- Balance displays correctly
- Topup creates QR code
- QR code is scannable
- Bank deeplinks work
- Transactions list shows history

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete SePay wallet integration

- Add PaymentRequest model for unified topup/booking payments
- Implement SePay QR generation and webhook processing
- Add wallet balance and transaction history endpoints
- Create mobile wallet screens with QR display
- Add bank app deeplinks for Vietnamese banks
- Include cron job for expired request cleanup
- Add comprehensive unit tests"
```

---

## Summary

This plan implements:

1. **Database**: PaymentRequest model with HM-XXXXXXX codes
2. **Backend**: SePay service, Wallet service, Webhook controller
3. **Mobile**: Wallet balance screen, Topup screen with QR, Booking payment integration
4. **Tests**: Unit tests for wallet service

**Files created:** 12 new files
**Files modified:** 6 existing files

---

**Plan complete and saved to `docs/plans/2026-01-22-sepay-wallet-implementation.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
