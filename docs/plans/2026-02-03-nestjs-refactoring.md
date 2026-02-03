# NestJS Backend Refactoring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor society-backend to follow NestJS best practices by splitting god services, fixing error handling, adding rate limiting, and creating domain-specific exceptions.

**Architecture:** Extract focused services from monolithic BookingsService (2,120 lines) and CompanionsService following the existing UsersModule pattern (UsersService, ProfileService, SettingsService). Implement domain exceptions hierarchy and add rate limiting guards to unprotected endpoints.

**Tech Stack:** NestJS 11, Prisma 7, Jest 29, class-validator, Redis caching

---

## Phase 1: Domain-Specific Exceptions (Foundation)

### Task 1.1: Create Base Domain Exception

**Files:**
- Create: `src/common/exceptions/domain.exception.ts`
- Test: `src/common/exceptions/domain.exception.spec.ts`

**Step 1: Write the failing test**

```typescript
// src/common/exceptions/domain.exception.spec.ts
import { HttpStatus } from '@nestjs/common';
import { DomainException, ErrorCode } from './domain.exception';

describe('DomainException', () => {
  it('should create exception with error code and message', () => {
    const exception = new DomainException(
      ErrorCode.BOOKING_NOT_FOUND,
      'Booking not found',
      HttpStatus.NOT_FOUND,
    );

    expect(exception.errorCode).toBe(ErrorCode.BOOKING_NOT_FOUND);
    expect(exception.message).toBe('Booking not found');
    expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
  });

  it('should include metadata in response', () => {
    const exception = new DomainException(
      ErrorCode.BOOKING_CONFLICT,
      'Booking conflict',
      HttpStatus.CONFLICT,
      { bookingId: '123' },
    );

    const response = exception.getResponse() as Record<string, unknown>;
    expect(response.errorCode).toBe(ErrorCode.BOOKING_CONFLICT);
    expect(response.metadata).toEqual({ bookingId: '123' });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd society-backend && pnpm test -- --testPathPattern="domain.exception.spec.ts" --no-coverage`
Expected: FAIL with "Cannot find module"

**Step 3: Write minimal implementation**

```typescript
// src/common/exceptions/domain.exception.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export enum ErrorCode {
  // Booking errors (1xxx)
  BOOKING_NOT_FOUND = 'BOOKING_1001',
  BOOKING_CONFLICT = 'BOOKING_1002',
  BOOKING_INVALID_STATE = 'BOOKING_1003',
  BOOKING_FREQUENCY_LIMIT = 'BOOKING_1004',
  BOOKING_DOUBLE_BOOKING = 'BOOKING_1005',
  BOOKING_CANCELLATION_DENIED = 'BOOKING_1006',
  BOOKING_REVIEW_WINDOW_EXPIRED = 'BOOKING_1007',

  // Payment errors (2xxx)
  PAYMENT_NOT_FOUND = 'PAYMENT_2001',
  PAYMENT_FAILED = 'PAYMENT_2002',
  PAYMENT_INSUFFICIENT_FUNDS = 'PAYMENT_2003',
  PAYMENT_INVALID_AMOUNT = 'PAYMENT_2004',
  PAYMENT_ALREADY_PROCESSED = 'PAYMENT_2005',

  // Companion errors (3xxx)
  COMPANION_NOT_FOUND = 'COMPANION_3001',
  COMPANION_NOT_AVAILABLE = 'COMPANION_3002',
  COMPANION_PROFILE_INCOMPLETE = 'COMPANION_3003',
  COMPANION_BOOST_ACTIVE = 'COMPANION_3004',

  // User errors (4xxx)
  USER_NOT_FOUND = 'USER_4001',
  USER_SUSPENDED = 'USER_4002',
  USER_ACCESS_DENIED = 'USER_4003',

  // Validation errors (5xxx)
  VALIDATION_FAILED = 'VALIDATION_5001',
  INVALID_INPUT = 'VALIDATION_5002',
}

export class DomainException extends HttpException {
  constructor(
    public readonly errorCode: ErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super(
      {
        statusCode: status,
        errorCode,
        message,
        metadata,
        timestamp: new Date().toISOString(),
      },
      status,
    );
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd society-backend && pnpm test -- --testPathPattern="domain.exception.spec.ts" --no-coverage`
Expected: PASS

**Step 5: Commit**

```bash
git add society-backend/src/common/exceptions/
git commit -m "$(cat <<'EOF'
feat(exceptions): add base DomainException with error codes

- Create DomainException extending HttpException
- Define ErrorCode enum for booking, payment, companion, user domains
- Include metadata support for additional context

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 1.2: Create Booking-Specific Exceptions

**Files:**
- Create: `src/common/exceptions/booking.exception.ts`
- Test: `src/common/exceptions/booking.exception.spec.ts`

**Step 1: Write the failing test**

```typescript
// src/common/exceptions/booking.exception.spec.ts
import { HttpStatus } from '@nestjs/common';
import {
  BookingNotFoundException,
  BookingConflictException,
  BookingStateException,
  BookingFrequencyLimitException,
  DoubleBookingException,
  ReviewWindowExpiredException,
} from './booking.exception';
import { ErrorCode } from './domain.exception';

describe('Booking Exceptions', () => {
  describe('BookingNotFoundException', () => {
    it('should create with booking ID', () => {
      const exception = new BookingNotFoundException('booking-123');

      expect(exception.errorCode).toBe(ErrorCode.BOOKING_NOT_FOUND);
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(exception.message).toContain('booking-123');
    });
  });

  describe('DoubleBookingException', () => {
    it('should include companion and time details', () => {
      const exception = new DoubleBookingException(
        'companion-456',
        new Date('2026-02-03T10:00:00Z'),
        new Date('2026-02-03T12:00:00Z'),
      );

      expect(exception.errorCode).toBe(ErrorCode.BOOKING_DOUBLE_BOOKING);
      expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
      const response = exception.getResponse() as Record<string, unknown>;
      expect(response.metadata).toHaveProperty('companionId', 'companion-456');
    });
  });

  describe('BookingFrequencyLimitException', () => {
    it('should include limit type and current count', () => {
      const exception = new BookingFrequencyLimitException('daily', 5, 5);

      expect(exception.errorCode).toBe(ErrorCode.BOOKING_FREQUENCY_LIMIT);
      expect(exception.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    });
  });

  describe('ReviewWindowExpiredException', () => {
    it('should include window duration', () => {
      const exception = new ReviewWindowExpiredException(7);

      expect(exception.errorCode).toBe(ErrorCode.BOOKING_REVIEW_WINDOW_EXPIRED);
      expect(exception.message).toContain('7 days');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd society-backend && pnpm test -- --testPathPattern="booking.exception.spec.ts" --no-coverage`
Expected: FAIL with "Cannot find module"

**Step 3: Write minimal implementation**

```typescript
// src/common/exceptions/booking.exception.ts
import { HttpStatus } from '@nestjs/common';
import { DomainException, ErrorCode } from './domain.exception';

export class BookingNotFoundException extends DomainException {
  constructor(bookingId: string) {
    super(
      ErrorCode.BOOKING_NOT_FOUND,
      `Booking not found: ${bookingId}`,
      HttpStatus.NOT_FOUND,
      { bookingId },
    );
  }
}

export class BookingConflictException extends DomainException {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(ErrorCode.BOOKING_CONFLICT, message, HttpStatus.CONFLICT, metadata);
  }
}

export class BookingStateException extends DomainException {
  constructor(
    bookingId: string,
    currentState: string,
    expectedState: string,
  ) {
    super(
      ErrorCode.BOOKING_INVALID_STATE,
      `Booking ${bookingId} is in ${currentState} state, expected ${expectedState}`,
      HttpStatus.BAD_REQUEST,
      { bookingId, currentState, expectedState },
    );
  }
}

export class BookingFrequencyLimitException extends DomainException {
  constructor(limitType: string, limit: number, current: number) {
    super(
      ErrorCode.BOOKING_FREQUENCY_LIMIT,
      `${limitType} booking limit reached: ${current}/${limit}`,
      HttpStatus.TOO_MANY_REQUESTS,
      { limitType, limit, current },
    );
  }
}

export class DoubleBookingException extends DomainException {
  constructor(companionId: string, startTime: Date, endTime: Date) {
    super(
      ErrorCode.BOOKING_DOUBLE_BOOKING,
      `Companion ${companionId} already has a booking during this time`,
      HttpStatus.CONFLICT,
      {
        companionId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    );
  }
}

export class BookingCancellationDeniedException extends DomainException {
  constructor(bookingId: string, reason: string) {
    super(
      ErrorCode.BOOKING_CANCELLATION_DENIED,
      `Cannot cancel booking ${bookingId}: ${reason}`,
      HttpStatus.BAD_REQUEST,
      { bookingId, reason },
    );
  }
}

export class ReviewWindowExpiredException extends DomainException {
  constructor(windowDays: number) {
    super(
      ErrorCode.BOOKING_REVIEW_WINDOW_EXPIRED,
      `Review window of ${windowDays} days has expired`,
      HttpStatus.BAD_REQUEST,
      { windowDays },
    );
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd society-backend && pnpm test -- --testPathPattern="booking.exception.spec.ts" --no-coverage`
Expected: PASS

**Step 5: Commit**

```bash
git add society-backend/src/common/exceptions/booking.exception.ts society-backend/src/common/exceptions/booking.exception.spec.ts
git commit -m "$(cat <<'EOF'
feat(exceptions): add booking domain exceptions

- BookingNotFoundException, BookingConflictException
- BookingStateException, BookingFrequencyLimitException
- DoubleBookingException, ReviewWindowExpiredException

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 1.3: Create Payment-Specific Exceptions

**Files:**
- Create: `src/common/exceptions/payment.exception.ts`
- Test: `src/common/exceptions/payment.exception.spec.ts`

**Step 1: Write the failing test**

```typescript
// src/common/exceptions/payment.exception.spec.ts
import { HttpStatus } from '@nestjs/common';
import {
  PaymentNotFoundException,
  PaymentFailedException,
  InsufficientFundsException,
  PaymentAlreadyProcessedException,
} from './payment.exception';
import { ErrorCode } from './domain.exception';

describe('Payment Exceptions', () => {
  describe('PaymentNotFoundException', () => {
    it('should create with payment ID', () => {
      const exception = new PaymentNotFoundException('payment-123');

      expect(exception.errorCode).toBe(ErrorCode.PAYMENT_NOT_FOUND);
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('InsufficientFundsException', () => {
    it('should include required and available amounts', () => {
      const exception = new InsufficientFundsException(500000, 300000);

      expect(exception.errorCode).toBe(ErrorCode.PAYMENT_INSUFFICIENT_FUNDS);
      const response = exception.getResponse() as Record<string, unknown>;
      expect(response.metadata).toEqual({
        required: 500000,
        available: 300000,
        shortage: 200000,
      });
    });
  });

  describe('PaymentAlreadyProcessedException', () => {
    it('should include payment ID and status', () => {
      const exception = new PaymentAlreadyProcessedException('pay-123', 'COMPLETED');

      expect(exception.errorCode).toBe(ErrorCode.PAYMENT_ALREADY_PROCESSED);
      expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd society-backend && pnpm test -- --testPathPattern="payment.exception.spec.ts" --no-coverage`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/common/exceptions/payment.exception.ts
import { HttpStatus } from '@nestjs/common';
import { DomainException, ErrorCode } from './domain.exception';

export class PaymentNotFoundException extends DomainException {
  constructor(paymentId: string) {
    super(
      ErrorCode.PAYMENT_NOT_FOUND,
      `Payment not found: ${paymentId}`,
      HttpStatus.NOT_FOUND,
      { paymentId },
    );
  }
}

export class PaymentFailedException extends DomainException {
  constructor(reason: string, provider?: string) {
    super(
      ErrorCode.PAYMENT_FAILED,
      `Payment failed: ${reason}`,
      HttpStatus.BAD_REQUEST,
      { reason, provider },
    );
  }
}

export class InsufficientFundsException extends DomainException {
  constructor(required: number, available: number) {
    super(
      ErrorCode.PAYMENT_INSUFFICIENT_FUNDS,
      `Insufficient funds: required ${required} VND, available ${available} VND`,
      HttpStatus.BAD_REQUEST,
      { required, available, shortage: required - available },
    );
  }
}

export class InvalidPaymentAmountException extends DomainException {
  constructor(amount: number, min?: number, max?: number) {
    super(
      ErrorCode.PAYMENT_INVALID_AMOUNT,
      `Invalid payment amount: ${amount} VND`,
      HttpStatus.BAD_REQUEST,
      { amount, min, max },
    );
  }
}

export class PaymentAlreadyProcessedException extends DomainException {
  constructor(paymentId: string, currentStatus: string) {
    super(
      ErrorCode.PAYMENT_ALREADY_PROCESSED,
      `Payment ${paymentId} already processed with status: ${currentStatus}`,
      HttpStatus.CONFLICT,
      { paymentId, currentStatus },
    );
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd society-backend && pnpm test -- --testPathPattern="payment.exception.spec.ts" --no-coverage`
Expected: PASS

**Step 5: Commit**

```bash
git add society-backend/src/common/exceptions/payment.exception.ts society-backend/src/common/exceptions/payment.exception.spec.ts
git commit -m "$(cat <<'EOF'
feat(exceptions): add payment domain exceptions

- PaymentNotFoundException, PaymentFailedException
- InsufficientFundsException, InvalidPaymentAmountException
- PaymentAlreadyProcessedException

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 1.4: Create Exception Index and Update Global Filter

**Files:**
- Create: `src/common/exceptions/index.ts`
- Modify: `src/middleware/error.middleware.ts:1-50`

**Step 1: Create exception barrel export**

```typescript
// src/common/exceptions/index.ts
export * from './domain.exception';
export * from './booking.exception';
export * from './payment.exception';
```

**Step 2: Update global exception filter to handle DomainException**

```typescript
// src/middleware/error.middleware.ts - replace entire file
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { DomainException } from '@/common/exceptions';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status: number;
    let errorResponse: Record<string, unknown>;

    if (exception instanceof DomainException) {
      // Domain-specific exception with error code
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as Record<string, unknown>;
      errorResponse = {
        ...exceptionResponse,
        path: request.url,
      };

      this.logger.warn(
        `Domain exception: ${exception.errorCode} - ${exception.message}`,
        { metadata: exception.metadata, path: request.url },
      );
    } else if (exception instanceof HttpException) {
      // Standard NestJS HTTP exception
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      errorResponse = {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      };

      if (typeof exceptionResponse === 'string') {
        errorResponse.message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        Object.assign(errorResponse, exceptionResponse);
      }
    } else if (exception instanceof Error) {
      // Unhandled error
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: 'Internal server error',
      };

      // Log full error for debugging
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );

      // Include stack trace in non-production
      if (process.env.NODE_ENV !== 'production') {
        errorResponse.message = exception.message;
        errorResponse.stack = exception.stack;
      }
    } else {
      // Unknown error type
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: 'Internal server error',
      };

      this.logger.error('Unknown exception type', exception);
    }

    response.status(status).send(errorResponse);
  }
}
```

**Step 3: Run existing tests**

Run: `cd society-backend && pnpm test -- --no-coverage`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add society-backend/src/common/exceptions/index.ts society-backend/src/middleware/error.middleware.ts
git commit -m "$(cat <<'EOF'
feat(exceptions): integrate domain exceptions with global filter

- Create barrel export for all exceptions
- Update GlobalExceptionFilter to handle DomainException
- Log domain exceptions with error codes and metadata

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2: Fix Webhook Error Handling (Quick Win)

### Task 2.1: Fix SePay Webhook Error Suppression

**Files:**
- Modify: `src/modules/payments/controllers/webhooks.controller.ts:50-65`
- Test: `src/modules/payments/controllers/webhooks.controller.spec.ts`

**Step 1: Write the failing test**

```typescript
// src/modules/payments/controllers/webhooks.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksController } from './webhooks.controller';
import { WalletService } from '@/modules/wallet/wallet.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

describe('WebhooksController', () => {
  let controller: WebhooksController;
  let walletService: jest.Mocked<WalletService>;

  const mockWalletService = {
    processWebhook: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-api-key'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers: [
        { provide: WalletService, useValue: mockWalletService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<WebhooksController>(WebhooksController);
    walletService = module.get(WalletService);
    jest.clearAllMocks();
  });

  describe('handleSepayWebhook', () => {
    const validPayload = {
      id: 'txn-123',
      gateway: 'SePay',
      transactionDate: '2026-02-03T10:00:00Z',
      accountNumber: '123456789',
      code: 'SOC123456',
      content: 'Payment for booking',
      transferType: 'in',
      transferAmount: 500000,
      accumulated: 500000,
      subAccount: null,
      referenceCode: 'REF123',
      description: 'Test payment',
    };

    it('should return success when webhook processes successfully', async () => {
      mockWalletService.processWebhook.mockResolvedValue(undefined);

      const result = await controller.handleSepayWebhook(
        'test-api-key',
        validPayload,
      );

      expect(result).toEqual({ success: true });
      expect(mockWalletService.processWebhook).toHaveBeenCalledWith(validPayload);
    });

    it('should return error status when webhook processing fails', async () => {
      mockWalletService.processWebhook.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const result = await controller.handleSepayWebhook(
        'test-api-key',
        validPayload,
      );

      expect(result).toEqual({
        success: false,
        error: 'Webhook processing failed',
        retryable: true,
      });
    });

    it('should return non-retryable error for validation failures', async () => {
      mockWalletService.processWebhook.mockRejectedValue(
        new Error('Invalid payment code format'),
      );

      const result = await controller.handleSepayWebhook(
        'test-api-key',
        validPayload,
      );

      // Validation errors should not trigger retry
      expect(result.success).toBe(false);
    });

    it('should reject invalid API key', async () => {
      await expect(
        controller.handleSepayWebhook('invalid-key', validPayload),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd society-backend && pnpm test -- --testPathPattern="webhooks.controller.spec.ts" --no-coverage`
Expected: FAIL (current implementation always returns success)

**Step 3: Fix the webhook handler**

```typescript
// src/modules/payments/controllers/webhooks.controller.ts
// Replace the handleSepayWebhook method (around line 40-65)

import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WalletService } from '@/modules/wallet/wallet.service';
import { Public } from '@/auth/decorators/public.decorator';
import { SepayWebhookDto } from '../dto/webhook.dto';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly walletService: WalletService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('bank-transfer')
  async handleSepayWebhook(
    @Headers('authorization') authorization: string,
    @Body() payload: SepayWebhookDto,
  ): Promise<{ success: boolean; error?: string; retryable?: boolean }> {
    // Verify API key
    const expectedKey = this.configService.get<string>('SEPAY_WEBHOOK_API_KEY');
    if (authorization !== expectedKey) {
      this.logger.warn('Invalid SePay webhook API key attempt', {
        receivedKeyPrefix: authorization?.substring(0, 8),
      });
      throw new UnauthorizedException('Invalid API key');
    }

    try {
      await this.walletService.processWebhook(payload);

      this.logger.log('SePay webhook processed successfully', {
        transactionId: payload.id,
        code: payload.code,
        amount: payload.transferAmount,
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error('SePay webhook processing failed', {
        transactionId: payload.id,
        code: payload.code,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Determine if error is retryable
      const nonRetryableErrors = [
        'Invalid payment code',
        'Payment request not found',
        'already processed',
        'Invalid amount',
      ];

      const isRetryable = !nonRetryableErrors.some(msg =>
        errorMessage.toLowerCase().includes(msg.toLowerCase())
      );

      // Return error status so payment provider can retry if appropriate
      return {
        success: false,
        error: 'Webhook processing failed',
        retryable: isRetryable,
      };
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd society-backend && pnpm test -- --testPathPattern="webhooks.controller.spec.ts" --no-coverage`
Expected: PASS

**Step 5: Commit**

```bash
git add society-backend/src/modules/payments/controllers/webhooks.controller.ts society-backend/src/modules/payments/controllers/webhooks.controller.spec.ts
git commit -m "$(cat <<'EOF'
fix(webhooks): return error status on webhook processing failure

BREAKING: Webhook now returns { success: false } on errors instead of
always returning success. This allows payment providers to retry
failed webhooks appropriately.

- Add retryable flag to distinguish transient vs permanent failures
- Log webhook processing with structured context
- Add comprehensive test coverage

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3: Add Rate Limiting to Missing Endpoints

### Task 3.1: Add Rate Limiting to Bookings Controller

**Files:**
- Modify: `src/modules/bookings/controllers/bookings.controller.ts:1-50`

**Step 1: Read current file to understand structure**

Review the current controller structure and imports.

**Step 2: Add rate limiting decorators**

```typescript
// Add to imports at top of bookings.controller.ts
import { RateLimit } from '@/modules/security/decorators/rate-limit.decorator';
import { RateLimitType } from '@/modules/security/services/rate-limiter.service';
import { RateLimitGuard } from '@/modules/security/guards/rate-limit.guard';

// Add RateLimitGuard to @UseGuards on controller or individual methods
// Add @RateLimit decorator to mutation endpoints

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  // ... existing code

  @Post()
  @UseGuards(RateLimitGuard)
  @RateLimit(RateLimitType.API)  // 100 requests per minute
  async createBooking(
    @CurrentUser() user: User,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(user.id, dto);
  }

  @Patch(':id/confirm')
  @UseGuards(RateLimitGuard)
  @RateLimit(RateLimitType.API)
  async confirmBooking(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.bookingsService.updateBookingStatus(user.id, id, 'CONFIRMED');
  }

  @Post(':id/cancel')
  @UseGuards(RateLimitGuard)
  @RateLimit(RateLimitType.API)
  async cancelBooking(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancelBooking(user.id, id, dto);
  }

  @Post(':id/review')
  @UseGuards(RateLimitGuard)
  @RateLimit(RateLimitType.API)
  async submitReview(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.bookingsService.submitReview(user.id, id, dto);
  }
}
```

**Step 3: Update bookings module to import SecurityModule**

```typescript
// src/modules/bookings/bookings.module.ts - add to imports array
imports: [
  // ... existing imports
  SecurityModule,
],
```

**Step 4: Run existing tests**

Run: `cd society-backend && pnpm test -- --testPathPattern="bookings" --no-coverage`
Expected: PASS

**Step 5: Commit**

```bash
git add society-backend/src/modules/bookings/
git commit -m "$(cat <<'EOF'
feat(bookings): add rate limiting to mutation endpoints

- Add RateLimitGuard to createBooking, confirmBooking, cancelBooking
- Add rate limiting to review submission
- Import SecurityModule for rate limit services

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3.2: Add Rate Limiting to Payments Controller

**Files:**
- Modify: `src/modules/payments/controllers/payments.controller.ts`

**Step 1: Add rate limiting to payment endpoints**

```typescript
// Add to imports
import { RateLimit } from '@/modules/security/decorators/rate-limit.decorator';
import { RateLimitType } from '@/modules/security/services/rate-limiter.service';
import { RateLimitGuard } from '@/modules/security/guards/rate-limit.guard';

// Add to payment creation endpoint
@Post('booking')
@UseGuards(RateLimitGuard)
@RateLimit(RateLimitType.PAYMENT)  // 10 requests per hour
async createBookingPayment(
  @CurrentUser() user: User,
  @Body() dto: CreatePaymentDto,
) {
  return this.paymentsService.createBookingPayment(user.id, dto);
}
```

**Step 2: Update payments module**

```typescript
// src/modules/payments/payments.module.ts - add SecurityModule to imports
imports: [
  // ... existing imports
  SecurityModule,
],
```

**Step 3: Run tests**

Run: `cd society-backend && pnpm test -- --testPathPattern="payments" --no-coverage`
Expected: PASS

**Step 4: Commit**

```bash
git add society-backend/src/modules/payments/
git commit -m "$(cat <<'EOF'
feat(payments): add rate limiting to payment endpoints

- Add PAYMENT rate limit (10/hour) to booking payment creation
- Import SecurityModule for rate limit guard

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3.3: Add Rate Limiting to Files Controller

**Files:**
- Modify: `src/modules/files/files.controller.ts`

**Step 1: Add rate limiting to upload endpoint**

```typescript
// Add to imports
import { RateLimit } from '@/modules/security/decorators/rate-limit.decorator';
import { RateLimitType } from '@/modules/security/services/rate-limiter.service';
import { RateLimitGuard } from '@/modules/security/guards/rate-limit.guard';

// Add to file upload endpoint
@Post('upload')
@UseGuards(RateLimitGuard)
@RateLimit(RateLimitType.UPLOAD)  // 20 requests per hour
async uploadFile(
  @CurrentUser() user: User,
  @Body() dto: UploadFileDto,
) {
  return this.filesService.uploadFile(user.id, dto);
}
```

**Step 2: Update files module**

```typescript
// src/modules/files/files.module.ts - add SecurityModule to imports
imports: [
  // ... existing imports
  SecurityModule,
],
```

**Step 3: Run tests**

Run: `cd society-backend && pnpm test -- --testPathPattern="files" --no-coverage`
Expected: PASS

**Step 4: Commit**

```bash
git add society-backend/src/modules/files/
git commit -m "$(cat <<'EOF'
feat(files): add rate limiting to upload endpoint

- Add UPLOAD rate limit (20/hour) to file uploads
- Import SecurityModule for rate limit guard

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3.4: Add Rate Limiting to Messages Controller

**Files:**
- Modify: `src/modules/messaging/controllers/messages.controller.ts`

**Step 1: Add rate limiting to message endpoints**

```typescript
// Add to imports
import { RateLimit } from '@/modules/security/decorators/rate-limit.decorator';
import { RateLimitType } from '@/modules/security/services/rate-limiter.service';
import { RateLimitGuard } from '@/modules/security/guards/rate-limit.guard';

// Add to message sending endpoint
@Post()
@UseGuards(RateLimitGuard)
@RateLimit(RateLimitType.MESSAGE)  // 50 requests per minute
async sendMessage(
  @CurrentUser() user: User,
  @Body() dto: CreateMessageDto,
) {
  return this.messagesService.sendMessage(user.id, dto);
}
```

**Step 2: Update messaging module**

```typescript
// src/modules/messaging/messaging.module.ts - add SecurityModule to imports
imports: [
  // ... existing imports
  SecurityModule,
],
```

**Step 3: Run tests**

Run: `cd society-backend && pnpm test -- --testPathPattern="messaging" --no-coverage`
Expected: PASS

**Step 4: Commit**

```bash
git add society-backend/src/modules/messaging/
git commit -m "$(cat <<'EOF'
feat(messaging): add rate limiting to message endpoints

- Add MESSAGE rate limit (50/min) to message sending
- Import SecurityModule for rate limit guard

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4: Split BookingsService

### Task 4.1: Create BookingReviewsService

**Files:**
- Create: `src/modules/bookings/services/booking-reviews.service.ts`
- Create: `src/modules/bookings/services/booking-reviews.service.spec.ts`

**Step 1: Write the failing test**

```typescript
// src/modules/bookings/services/booking-reviews.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BookingReviewsService } from './booking-reviews.service';
import { PrismaService } from '@/prisma/prisma.service';
import { ContentReviewService } from '@/modules/moderation/services/content-review.service';
import { BookingStatus } from '@generated/enums';

describe('BookingReviewsService', () => {
  let service: BookingReviewsService;

  const mockPrismaService = {
    booking: {
      findUnique: jest.fn(),
    },
    review: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
    },
    companionProfile: {
      update: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(async (callback) => {
      return callback(mockPrismaService);
    }),
  };

  const mockContentReviewService = {
    checkContent: jest.fn().mockResolvedValue({ approved: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingReviewsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ContentReviewService, useValue: mockContentReviewService },
      ],
    }).compile();

    service = module.get<BookingReviewsService>(BookingReviewsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitReview', () => {
    const mockBooking = {
      id: 'booking-123',
      hirerId: 'hirer-1',
      companionId: 'companion-1',
      status: BookingStatus.COMPLETED,
      endDatetime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    };

    it('should submit a review for completed booking', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.review.findFirst.mockResolvedValue(null);
      mockPrismaService.review.create.mockResolvedValue({
        id: 'review-1',
        rating: 5,
        comment: 'Great experience',
      });
      mockPrismaService.review.aggregate.mockResolvedValue({
        _avg: { rating: 4.5 },
        _count: { rating: 10 },
      });

      const result = await service.submitReview('hirer-1', 'booking-123', {
        rating: 5,
        comment: 'Great experience',
      });

      expect(result.id).toBe('review-1');
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw if booking not found', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.submitReview('hirer-1', 'booking-123', { rating: 5 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if review window expired (>7 days)', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        endDatetime: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      });

      await expect(
        service.submitReview('hirer-1', 'booking-123', { rating: 5 }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd society-backend && pnpm test -- --testPathPattern="booking-reviews.service.spec.ts" --no-coverage`
Expected: FAIL with "Cannot find module"

**Step 3: Write the service implementation**

```typescript
// src/modules/bookings/services/booking-reviews.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ContentReviewService } from '@/modules/moderation/services/content-review.service';
import { ReviewWindowExpiredException } from '@/common/exceptions';
import { BookingStatus } from '@generated/enums';
import { CreateReviewDto, EditReviewDto, DisputeReviewDto } from '../dto/booking.dto';

const REVIEW_WINDOW_DAYS = 7;
const EDIT_WINDOW_HOURS = 24;
const DISPUTE_WINDOW_DAYS = 7;

@Injectable()
export class BookingReviewsService {
  private readonly logger = new Logger(BookingReviewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly contentReviewService: ContentReviewService,
  ) {}

  async submitReview(
    userId: string,
    bookingId: string,
    dto: CreateReviewDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        companion: { select: { id: true, userId: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.hirerId !== userId) {
      throw new ForbiddenException('You can only review your own bookings');
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Can only review completed bookings');
    }

    // Check review window
    const daysSinceEnd = this.getDaysSince(booking.endDatetime);
    if (daysSinceEnd > REVIEW_WINDOW_DAYS) {
      throw new ReviewWindowExpiredException(REVIEW_WINDOW_DAYS);
    }

    // Check for existing review
    const existingReview = await this.prisma.review.findFirst({
      where: { bookingId, reviewerId: userId },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this booking');
    }

    // Content moderation
    if (dto.comment) {
      const contentCheck = await this.contentReviewService.checkContent(dto.comment);
      if (!contentCheck.approved) {
        throw new BadRequestException('Review contains inappropriate content');
      }
    }

    // Create review and update companion rating in transaction
    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          bookingId,
          reviewerId: userId,
          companionId: booking.companion.id,
          rating: dto.rating,
          comment: dto.comment,
        },
      });

      // Recalculate companion rating
      const stats = await tx.review.aggregate({
        where: { companionId: booking.companion.id },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.companionProfile.update({
        where: { id: booking.companion.id },
        data: {
          rating: stats._avg.rating || 0,
          reviewCount: stats._count.rating,
        },
      });

      this.logger.log(`Review submitted for booking ${bookingId}`, {
        reviewId: review.id,
        rating: dto.rating,
      });

      return review;
    });
  }

  async editReview(userId: string, reviewId: string, dto: EditReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { booking: true },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.reviewerId !== userId) {
      throw new ForbiddenException('You can only edit your own reviews');
    }

    // Check edit window (24 hours)
    const hoursSinceCreation = this.getHoursSince(review.createdAt);
    if (hoursSinceCreation > EDIT_WINDOW_HOURS) {
      throw new BadRequestException(
        `Review can only be edited within ${EDIT_WINDOW_HOURS} hours`,
      );
    }

    // Content moderation
    if (dto.comment) {
      const contentCheck = await this.contentReviewService.checkContent(dto.comment);
      if (!contentCheck.approved) {
        throw new BadRequestException('Review contains inappropriate content');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id: reviewId },
        data: {
          rating: dto.rating,
          comment: dto.comment,
          editedAt: new Date(),
        },
      });

      // Recalculate companion rating
      const stats = await tx.review.aggregate({
        where: { companionId: review.companionId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.companionProfile.update({
        where: { id: review.companionId },
        data: {
          rating: stats._avg.rating || 0,
        },
      });

      return updated;
    });
  }

  async disputeReview(userId: string, reviewId: string, dto: DisputeReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        booking: {
          include: { companion: true },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only companion can dispute
    if (review.booking.companion.userId !== userId) {
      throw new ForbiddenException('Only the companion can dispute this review');
    }

    // Check dispute window
    const daysSinceReview = this.getDaysSince(review.createdAt);
    if (daysSinceReview > DISPUTE_WINDOW_DAYS) {
      throw new BadRequestException(
        `Reviews can only be disputed within ${DISPUTE_WINDOW_DAYS} days`,
      );
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        disputed: true,
        disputeReason: dto.reason,
        disputedAt: new Date(),
      },
    });
  }

  async canDisputeReview(userId: string, reviewId: string): Promise<boolean> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        booking: { include: { companion: true } },
      },
    });

    if (!review) return false;
    if (review.booking.companion.userId !== userId) return false;
    if (review.disputed) return false;

    const daysSinceReview = this.getDaysSince(review.createdAt);
    return daysSinceReview <= DISPUTE_WINDOW_DAYS;
  }

  private getDaysSince(date: Date): number {
    return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  private getHoursSince(date: Date): number {
    return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd society-backend && pnpm test -- --testPathPattern="booking-reviews.service.spec.ts" --no-coverage`
Expected: PASS

**Step 5: Commit**

```bash
git add society-backend/src/modules/bookings/services/booking-reviews.service.ts society-backend/src/modules/bookings/services/booking-reviews.service.spec.ts
git commit -m "$(cat <<'EOF'
refactor(bookings): extract BookingReviewsService from BookingsService

- Move submitReview, editReview, disputeReview to dedicated service
- Add canDisputeReview helper method
- Define review window constants (7 days submit, 24h edit, 7 days dispute)
- Use domain-specific ReviewWindowExpiredException

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4.2: Create BookingCancellationService

**Files:**
- Create: `src/modules/bookings/services/booking-cancellation.service.ts`
- Create: `src/modules/bookings/services/booking-cancellation.service.spec.ts`

**Step 1: Write the failing test**

```typescript
// src/modules/bookings/services/booking-cancellation.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BookingCancellationService } from './booking-cancellation.service';
import { PrismaService } from '@/prisma/prisma.service';
import { BookingStatus } from '@generated/enums';

describe('BookingCancellationService', () => {
  let service: BookingCancellationService;

  const mockPrismaService = {
    booking: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    emergencyCancellation: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(async (callback) => {
      return callback(mockPrismaService);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingCancellationService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BookingCancellationService>(BookingCancellationService);
    jest.clearAllMocks();
  });

  describe('calculateRefundPolicy', () => {
    it('should return 100% refund for >48 hours before start', () => {
      const startTime = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours from now
      const result = service.calculateRefundPolicy(startTime);

      expect(result.refundPercentage).toBe(100);
      expect(result.tier).toBe('FULL');
    });

    it('should return 50% refund for 24-48 hours before start', () => {
      const startTime = new Date(Date.now() + 36 * 60 * 60 * 1000); // 36 hours from now
      const result = service.calculateRefundPolicy(startTime);

      expect(result.refundPercentage).toBe(50);
      expect(result.tier).toBe('PARTIAL');
    });

    it('should return 0% refund for <24 hours before start', () => {
      const startTime = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours from now
      const result = service.calculateRefundPolicy(startTime);

      expect(result.refundPercentage).toBe(0);
      expect(result.tier).toBe('NONE');
    });
  });

  describe('cancelBooking', () => {
    const mockBooking = {
      id: 'booking-123',
      hirerId: 'hirer-1',
      status: BookingStatus.CONFIRMED,
      startDatetime: new Date(Date.now() + 72 * 60 * 60 * 1000),
      totalAmount: 1000000,
    };

    it('should cancel booking with full refund', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      });

      const result = await service.cancelBooking('hirer-1', 'booking-123', {
        reason: 'Change of plans',
      });

      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(mockPrismaService.booking.update).toHaveBeenCalled();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd society-backend && pnpm test -- --testPathPattern="booking-cancellation.service.spec.ts" --no-coverage`
Expected: FAIL

**Step 3: Write the service implementation**

```typescript
// src/modules/bookings/services/booking-cancellation.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationsService } from '@/modules/notifications/services/notifications.service';
import {
  BookingNotFoundException,
  BookingStateException,
  BookingCancellationDeniedException,
} from '@/common/exceptions';
import { BookingStatus } from '@generated/enums';
import { CancelBookingDto, EmergencyCancellationDto } from '../dto/booking.dto';

type RefundTier = 'FULL' | 'PARTIAL' | 'NONE';

interface RefundPolicy {
  refundPercentage: number;
  tier: RefundTier;
  refundAmount: number;
}

@Injectable()
export class BookingCancellationService {
  private readonly logger = new Logger(BookingCancellationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  calculateRefundPolicy(
    startTime: Date,
    totalAmount: number = 0,
  ): RefundPolicy {
    const hoursUntilStart = (startTime.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilStart > 48) {
      return {
        refundPercentage: 100,
        tier: 'FULL',
        refundAmount: totalAmount,
      };
    } else if (hoursUntilStart > 24) {
      return {
        refundPercentage: 50,
        tier: 'PARTIAL',
        refundAmount: Math.floor(totalAmount * 0.5),
      };
    } else {
      return {
        refundPercentage: 0,
        tier: 'NONE',
        refundAmount: 0,
      };
    }
  }

  async cancelBooking(
    userId: string,
    bookingId: string,
    dto: CancelBookingDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        companion: { select: { userId: true, fullName: true } },
        hirer: { select: { userId: true } },
      },
    });

    if (!booking) {
      throw new BookingNotFoundException(bookingId);
    }

    // Check authorization
    const isHirer = booking.hirerId === userId;
    const isCompanion = booking.companion.userId === userId;

    if (!isHirer && !isCompanion) {
      throw new ForbiddenException('You cannot cancel this booking');
    }

    // Check cancellable states
    const cancellableStates = [BookingStatus.PENDING, BookingStatus.CONFIRMED];
    if (!cancellableStates.includes(booking.status as BookingStatus)) {
      throw new BookingStateException(
        bookingId,
        booking.status,
        'PENDING or CONFIRMED',
      );
    }

    const refundPolicy = this.calculateRefundPolicy(
      booking.startDatetime,
      booking.totalAmount,
    );

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledBy: userId,
          cancellationReason: dto.reason,
          refundAmount: isHirer ? refundPolicy.refundAmount : booking.totalAmount,
          refundTier: refundPolicy.tier,
        },
      });

      // Notify the other party
      const notifyUserId = isHirer ? booking.companion.userId : booking.hirerId;
      await this.notificationsService.send(notifyUserId, {
        type: 'BOOKING_CANCELLED',
        title: 'Booking Cancelled',
        body: `Booking #${booking.bookingNumber} has been cancelled`,
        data: { bookingId },
      }).catch((err) => {
        this.logger.warn('Failed to send cancellation notification', err);
      });

      this.logger.log(`Booking cancelled: ${bookingId}`, {
        cancelledBy: userId,
        isHirer,
        refundTier: refundPolicy.tier,
      });

      return updated;
    });
  }

  async emergencyCancellation(
    userId: string,
    bookingId: string,
    dto: EmergencyCancellationDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { companion: true },
    });

    if (!booking) {
      throw new BookingNotFoundException(bookingId);
    }

    // Only active bookings can be emergency cancelled
    if (booking.status !== BookingStatus.ACTIVE) {
      throw new BookingStateException(bookingId, booking.status, 'ACTIVE');
    }

    // Check if user is part of booking
    const isHirer = booking.hirerId === userId;
    const isCompanion = booking.companion.userId === userId;

    if (!isHirer && !isCompanion) {
      throw new ForbiddenException('You cannot cancel this booking');
    }

    return this.prisma.$transaction(async (tx) => {
      // Create emergency cancellation record
      await tx.emergencyCancellation.create({
        data: {
          bookingId,
          initiatedBy: userId,
          reason: dto.reason,
          category: dto.category,
          evidence: dto.evidence,
        },
      });

      // Update booking status
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledBy: userId,
          cancellationReason: `Emergency: ${dto.reason}`,
          isEmergencyCancellation: true,
        },
      });

      this.logger.warn(`Emergency cancellation: ${bookingId}`, {
        initiatedBy: userId,
        category: dto.category,
      });

      return updated;
    });
  }

  async getEmergencyCancellationHistory(userId: string) {
    return this.prisma.emergencyCancellation.findMany({
      where: { initiatedBy: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        booking: {
          select: {
            bookingNumber: true,
            startDatetime: true,
            endDatetime: true,
          },
        },
      },
    });
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd society-backend && pnpm test -- --testPathPattern="booking-cancellation.service.spec.ts" --no-coverage`
Expected: PASS

**Step 5: Commit**

```bash
git add society-backend/src/modules/bookings/services/booking-cancellation.service.ts society-backend/src/modules/bookings/services/booking-cancellation.service.spec.ts
git commit -m "$(cat <<'EOF'
refactor(bookings): extract BookingCancellationService

- Move cancelBooking, emergencyCancellation to dedicated service
- Implement tiered refund policy (>48h: 100%, 24-48h: 50%, <24h: 0%)
- Add getEmergencyCancellationHistory
- Use domain-specific booking exceptions

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4.3: Create BookingScheduleService

**Files:**
- Create: `src/modules/bookings/services/booking-schedule.service.ts`
- Create: `src/modules/bookings/services/booking-schedule.service.spec.ts`

**Step 1: Write the failing test**

```typescript
// src/modules/bookings/services/booking-schedule.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { BookingScheduleService } from './booking-schedule.service';
import { PrismaService } from '@/prisma/prisma.service';
import { BookingFrequencyLimitException } from '@/common/exceptions';

describe('BookingScheduleService', () => {
  let service: BookingScheduleService;

  const mockPrismaService = {
    booking: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingScheduleService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BookingScheduleService>(BookingScheduleService);
    jest.clearAllMocks();
  });

  describe('checkFrequencyLimits', () => {
    it('should pass when under daily limit', async () => {
      mockPrismaService.booking.count
        .mockResolvedValueOnce(3)  // daily
        .mockResolvedValueOnce(10) // weekly
        .mockResolvedValueOnce(1); // same companion

      await expect(
        service.checkFrequencyLimits('hirer-1', 'companion-1'),
      ).resolves.not.toThrow();
    });

    it('should throw when daily limit exceeded', async () => {
      mockPrismaService.booking.count.mockResolvedValueOnce(5); // daily = 5

      await expect(
        service.checkFrequencyLimits('hirer-1', 'companion-1'),
      ).rejects.toThrow(BookingFrequencyLimitException);
    });

    it('should throw when same companion daily limit exceeded', async () => {
      mockPrismaService.booking.count
        .mockResolvedValueOnce(3)  // daily OK
        .mockResolvedValueOnce(10) // weekly OK
        .mockResolvedValueOnce(2); // same companion = 2

      await expect(
        service.checkFrequencyLimits('hirer-1', 'companion-1'),
      ).rejects.toThrow(BookingFrequencyLimitException);
    });
  });

  describe('getCompanionSchedule', () => {
    it('should return occupied time slots', async () => {
      const mockBookings = [
        {
          id: 'b1',
          startDatetime: new Date('2026-02-03T10:00:00Z'),
          endDatetime: new Date('2026-02-03T12:00:00Z'),
          status: 'CONFIRMED',
        },
      ];
      mockPrismaService.booking.findMany.mockResolvedValue(mockBookings);

      const result = await service.getCompanionSchedule(
        'companion-1',
        new Date('2026-02-01'),
        new Date('2026-02-07'),
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('b1');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd society-backend && pnpm test -- --testPathPattern="booking-schedule.service.spec.ts" --no-coverage`
Expected: FAIL

**Step 3: Write the service implementation**

```typescript
// src/modules/bookings/services/booking-schedule.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { BookingFrequencyLimitException, DoubleBookingException } from '@/common/exceptions';
import { BookingStatus } from '@generated/enums';

const BOOKING_LIMITS = {
  DAILY: 5,
  WEEKLY: 15,
  SAME_COMPANION_DAILY: 2,
};

interface TimeSlot {
  id: string;
  startDatetime: Date;
  endDatetime: Date;
  status: string;
}

@Injectable()
export class BookingScheduleService {
  private readonly logger = new Logger(BookingScheduleService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkFrequencyLimits(
    hirerId: string,
    companionId: string,
  ): Promise<void> {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Check daily limit
    const dailyCount = await this.prisma.booking.count({
      where: {
        hirerId,
        createdAt: { gte: startOfDay },
        status: { notIn: [BookingStatus.CANCELLED] },
      },
    });

    if (dailyCount >= BOOKING_LIMITS.DAILY) {
      throw new BookingFrequencyLimitException(
        'daily',
        BOOKING_LIMITS.DAILY,
        dailyCount,
      );
    }

    // Check weekly limit
    const weeklyCount = await this.prisma.booking.count({
      where: {
        hirerId,
        createdAt: { gte: startOfWeek },
        status: { notIn: [BookingStatus.CANCELLED] },
      },
    });

    if (weeklyCount >= BOOKING_LIMITS.WEEKLY) {
      throw new BookingFrequencyLimitException(
        'weekly',
        BOOKING_LIMITS.WEEKLY,
        weeklyCount,
      );
    }

    // Check same companion daily limit
    const sameCompanionCount = await this.prisma.booking.count({
      where: {
        hirerId,
        companionId,
        createdAt: { gte: startOfDay },
        status: { notIn: [BookingStatus.CANCELLED] },
      },
    });

    if (sameCompanionCount >= BOOKING_LIMITS.SAME_COMPANION_DAILY) {
      throw new BookingFrequencyLimitException(
        'same companion per day',
        BOOKING_LIMITS.SAME_COMPANION_DAILY,
        sameCompanionCount,
      );
    }
  }

  async checkDoubleBooking(
    companionId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string,
  ): Promise<void> {
    const conflictingBooking = await this.prisma.booking.findFirst({
      where: {
        companionId,
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.ACTIVE] },
        OR: [
          {
            startDatetime: { lt: endTime },
            endDatetime: { gt: startTime },
          },
        ],
      },
    });

    if (conflictingBooking) {
      throw new DoubleBookingException(companionId, startTime, endTime);
    }
  }

  async getCompanionSchedule(
    companionId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TimeSlot[]> {
    const bookings = await this.prisma.booking.findMany({
      where: {
        companionId,
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.ACTIVE],
        },
        OR: [
          {
            startDatetime: { gte: startDate, lte: endDate },
          },
          {
            endDatetime: { gte: startDate, lte: endDate },
          },
          {
            startDatetime: { lte: startDate },
            endDatetime: { gte: endDate },
          },
        ],
      },
      select: {
        id: true,
        startDatetime: true,
        endDatetime: true,
        status: true,
      },
      orderBy: { startDatetime: 'asc' },
    });

    return bookings;
  }

  async getHirerBookingStats(hirerId: string) {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [dailyCount, weeklyCount, totalCount] = await Promise.all([
      this.prisma.booking.count({
        where: {
          hirerId,
          createdAt: { gte: startOfDay },
          status: { notIn: [BookingStatus.CANCELLED] },
        },
      }),
      this.prisma.booking.count({
        where: {
          hirerId,
          createdAt: { gte: startOfWeek },
          status: { notIn: [BookingStatus.CANCELLED] },
        },
      }),
      this.prisma.booking.count({
        where: {
          hirerId,
          status: { notIn: [BookingStatus.CANCELLED] },
        },
      }),
    ]);

    return {
      daily: { count: dailyCount, limit: BOOKING_LIMITS.DAILY },
      weekly: { count: weeklyCount, limit: BOOKING_LIMITS.WEEKLY },
      total: totalCount,
    };
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd society-backend && pnpm test -- --testPathPattern="booking-schedule.service.spec.ts" --no-coverage`
Expected: PASS

**Step 5: Commit**

```bash
git add society-backend/src/modules/bookings/services/booking-schedule.service.ts society-backend/src/modules/bookings/services/booking-schedule.service.spec.ts
git commit -m "$(cat <<'EOF'
refactor(bookings): extract BookingScheduleService

- Move frequency limit checks to dedicated service
- Add checkDoubleBooking with time overlap detection
- Add getCompanionSchedule for calendar view
- Add getHirerBookingStats for user dashboard
- Use domain-specific BookingFrequencyLimitException

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4.4: Update BookingsModule to Export New Services

**Files:**
- Modify: `src/modules/bookings/bookings.module.ts`
- Create: `src/modules/bookings/services/index.ts`

**Step 1: Create service barrel export**

```typescript
// src/modules/bookings/services/index.ts
export * from './bookings.service';
export * from './booking-reviews.service';
export * from './booking-cancellation.service';
export * from './booking-schedule.service';
```

**Step 2: Update bookings module**

```typescript
// src/modules/bookings/bookings.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/prisma/prisma.module';
import { ModerationModule } from '@/modules/moderation/moderation.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { OccasionsModule } from '@/modules/occasions/occasions.module';
import { PlatformConfigModule } from '@/modules/platform-config/platform-config.module';
import { SecurityModule } from '@/modules/security/security.module';

import { BookingsController } from './controllers/bookings.controller';
import {
  BookingsService,
  BookingReviewsService,
  BookingCancellationService,
  BookingScheduleService,
} from './services';
import { BookingTasks } from './tasks/booking.tasks';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    ModerationModule,
    NotificationsModule,
    OccasionsModule,
    PlatformConfigModule,
    SecurityModule,
  ],
  controllers: [BookingsController],
  providers: [
    BookingsService,
    BookingReviewsService,
    BookingCancellationService,
    BookingScheduleService,
    BookingTasks,
  ],
  exports: [
    BookingsService,
    BookingReviewsService,
    BookingCancellationService,
    BookingScheduleService,
  ],
})
export class BookingsModule {}
```

**Step 3: Run all booking tests**

Run: `cd society-backend && pnpm test -- --testPathPattern="bookings" --no-coverage`
Expected: All PASS

**Step 4: Commit**

```bash
git add society-backend/src/modules/bookings/
git commit -m "$(cat <<'EOF'
refactor(bookings): update module to export split services

- Create barrel export for all booking services
- Update BookingsModule providers and exports
- Add SecurityModule import for rate limiting

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4.5: Update BookingsService to Delegate to Split Services

**Files:**
- Modify: `src/modules/bookings/services/bookings.service.ts`

**Step 1: Inject new services and delegate methods**

Update BookingsService to inject the new services and delegate calls. This maintains backward compatibility while methods are gradually migrated.

```typescript
// Add to constructor in bookings.service.ts
constructor(
  private readonly prisma: PrismaService,
  private readonly contentReviewService: ContentReviewService,
  private readonly configService: ConfigService,
  private readonly occasionTrackingService: OccasionTrackingService,
  private readonly platformConfigService: PlatformConfigService,
  private readonly notificationsService: NotificationsService,
  // New delegated services
  private readonly reviewsService: BookingReviewsService,
  private readonly cancellationService: BookingCancellationService,
  private readonly scheduleService: BookingScheduleService,
) {}

// Delegate review methods
async submitReview(userId: string, bookingId: string, dto: CreateReviewDto) {
  return this.reviewsService.submitReview(userId, bookingId, dto);
}

async editReview(userId: string, reviewId: string, dto: EditReviewDto) {
  return this.reviewsService.editReview(userId, reviewId, dto);
}

async disputeReview(userId: string, reviewId: string, dto: DisputeReviewDto) {
  return this.reviewsService.disputeReview(userId, reviewId, dto);
}

// Delegate cancellation methods
async cancelBooking(userId: string, bookingId: string, dto: CancelBookingDto) {
  return this.cancellationService.cancelBooking(userId, bookingId, dto);
}

async emergencyCancellation(userId: string, bookingId: string, dto: EmergencyCancellationDto) {
  return this.cancellationService.emergencyCancellation(userId, bookingId, dto);
}

// Use schedule service for frequency checks
async createBooking(userId: string, dto: CreateBookingDto) {
  // Check frequency limits using schedule service
  await this.scheduleService.checkFrequencyLimits(userId, dto.companionId);
  await this.scheduleService.checkDoubleBooking(
    dto.companionId,
    new Date(dto.startDatetime),
    new Date(dto.endDatetime),
  );

  // ... rest of booking creation logic
}
```

**Step 2: Run all tests**

Run: `cd society-backend && pnpm test -- --no-coverage`
Expected: All PASS

**Step 3: Commit**

```bash
git add society-backend/src/modules/bookings/services/bookings.service.ts
git commit -m "$(cat <<'EOF'
refactor(bookings): delegate to split services in BookingsService

- Inject BookingReviewsService, BookingCancellationService, BookingScheduleService
- Delegate review methods (submit, edit, dispute)
- Delegate cancellation methods
- Use schedule service for frequency/double-booking checks
- Maintain backward compatibility for existing callers

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 5: Final Integration and Verification

### Task 5.1: Run Full Test Suite

**Step 1: Run all tests**

Run: `cd society-backend && pnpm test --no-coverage`
Expected: All tests PASS

**Step 2: Run linting**

Run: `cd society-backend && pnpm lint`
Expected: No errors

**Step 3: Run type checking**

Run: `cd society-backend && pnpm tsc --noEmit`
Expected: No errors

---

### Task 5.2: Final Commit and Summary

**Step 1: Create final summary commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore: complete NestJS refactoring phase 1

Summary of changes:
- Created domain-specific exception hierarchy (DomainException, BookingExceptions, PaymentExceptions)
- Fixed webhook error suppression - now returns proper error status
- Added rate limiting to bookings, payments, files, messaging endpoints
- Split BookingsService (2120 lines) into focused services:
  - BookingReviewsService (reviews, disputes)
  - BookingCancellationService (cancellation, refunds)
  - BookingScheduleService (frequency limits, scheduling)

Breaking changes:
- Webhook returns { success: false } on errors (previously always true)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Summary

| Phase | Tasks | Estimated Steps |
|-------|-------|-----------------|
| Phase 1: Domain Exceptions | 4 tasks | 20 steps |
| Phase 2: Webhook Fix | 1 task | 5 steps |
| Phase 3: Rate Limiting | 4 tasks | 20 steps |
| Phase 4: Split BookingsService | 5 tasks | 25 steps |
| Phase 5: Integration | 2 tasks | 6 steps |
| **Total** | **16 tasks** | **~76 steps** |

## Files Created/Modified

**New Files (12):**
- `src/common/exceptions/domain.exception.ts`
- `src/common/exceptions/domain.exception.spec.ts`
- `src/common/exceptions/booking.exception.ts`
- `src/common/exceptions/booking.exception.spec.ts`
- `src/common/exceptions/payment.exception.ts`
- `src/common/exceptions/payment.exception.spec.ts`
- `src/common/exceptions/index.ts`
- `src/modules/bookings/services/booking-reviews.service.ts`
- `src/modules/bookings/services/booking-reviews.service.spec.ts`
- `src/modules/bookings/services/booking-cancellation.service.ts`
- `src/modules/bookings/services/booking-cancellation.service.spec.ts`
- `src/modules/bookings/services/booking-schedule.service.ts`
- `src/modules/bookings/services/booking-schedule.service.spec.ts`
- `src/modules/bookings/services/index.ts`
- `src/modules/payments/controllers/webhooks.controller.spec.ts`

**Modified Files (8):**
- `src/middleware/error.middleware.ts`
- `src/modules/payments/controllers/webhooks.controller.ts`
- `src/modules/bookings/controllers/bookings.controller.ts`
- `src/modules/bookings/bookings.module.ts`
- `src/modules/bookings/services/bookings.service.ts`
- `src/modules/payments/payments.module.ts`
- `src/modules/files/files.module.ts`
- `src/modules/messaging/messaging.module.ts`
