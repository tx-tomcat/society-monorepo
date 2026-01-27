# SePay Wallet & Payment Integration Design

**Date:** 2026-01-22
**Status:** Validated - Ready for Implementation

## Overview

Integrate SePay for QR-based bank transfers supporting both wallet topups and direct booking payments. Uses a unified `PaymentRequest` model with `HM-XXXXXXX` codes for transaction matching.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Unified PaymentRequest model | Single code path for webhook processing |
| Users | Hirers only | Companions receive earnings, don't need to pay |
| Amount matching | Exact match required | Prevents payment disputes |
| Expiry time | 30 minutes | Balance between UX and stale requests |
| Topup limits | 100K - 50M VND | Per user requirement |

## SePay Configuration

```
Webhook URL: https://api.hireme.com/webhooks/payment
Auth: API Key header
Bank: TPBank
Account: 94886886886
Name: NGUYEN DINH DUNG
```

## Database Schema

```prisma
model PaymentRequest {
  id            String               @id @default(uuid()) @db.Uuid
  userId        String               @db.Uuid
  code          String               @unique  // HM-XXXXXXX format
  type          PaymentRequestType   // TOPUP or BOOKING
  amount        Int                  // Amount in VND
  status        PaymentRequestStatus // PENDING, COMPLETED, EXPIRED, FAILED

  // For BOOKING type only
  bookingId     String?              @db.Uuid

  // SePay webhook data (populated on completion)
  sepayId       Int?                 // SePay transaction ID
  gateway       String?              // Bank name (e.g., "TPBank")
  referenceCode String?              // Bank reference

  expiresAt     DateTime
  completedAt   DateTime?
  createdAt     DateTime             @default(now())
  updatedAt     DateTime             @updatedAt

  user          User                 @relation(fields: [userId], references: [id])
  booking       Booking?             @relation(fields: [bookingId], references: [id])

  @@index([userId])
  @@index([code])
  @@index([status, expiresAt])
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

## API Endpoints

### Wallet Controller

```typescript
// POST /wallet/topup
// Create topup request, returns QR URL and deeplinks
Request: { amount: number }
Response: {
  id: string
  code: string           // HM-ABC1234
  amount: number
  qrUrl: string          // https://qr.sepay.vn/img?...
  deeplinks: {
    tpbank: string
    vietcombank: string
    techcombank: string
    mbbank: string
  }
  expiresAt: string
}

// GET /wallet/balance
// Get available wallet balance
Response: {
  balance: number
  pendingTopups: number
}

// GET /wallet/transactions
// List payment requests for user
Response: {
  transactions: PaymentRequest[]
  pagination: {...}
}
```

### Webhook Controller

```typescript
// POST /webhooks/payment
// SePay webhook endpoint
Headers: { Authorization: "Apikey <API_KEY>" }
Request: {
  id: number
  gateway: string
  transactionDate: string
  accountNumber: string
  code: string | null
  content: string        // Contains HM-XXXXXXX
  transferType: string   // "in" or "out"
  transferAmount: number
  accumulated: number
  subAccount: string | null
  referenceCode: string
  description: string
}
Response: { success: true }
```

## Service Layer

### SePay Service

```typescript
class SepayService {
  // Generate unique HM-XXXXXXX code (7 alphanumeric chars)
  generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0,O,1,I,L
    let code = 'HM-';
    for (let i = 0; i < 7; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Build SePay QR URL
  generateQrUrl(amount: number, code: string): string {
    const params = new URLSearchParams({
      acc: process.env.SEPAY_ACCOUNT_NUMBER,
      bank: process.env.SEPAY_BANK_CODE,
      amount: amount.toString(),
      des: code
    });
    return `https://qr.sepay.vn/img?${params}`;
  }

  // Get bank app deeplinks
  getBankDeeplinks(amount: number, code: string): Record<string, string> {
    const acc = process.env.SEPAY_ACCOUNT_NUMBER;
    return {
      tpbank: `tpbank://transfer?account=${acc}&amount=${amount}&note=${code}`,
      vietcombank: `vietcombank://transfer?account=${acc}&amount=${amount}&note=${code}`,
      techcombank: `techcombank://transfer?account=${acc}&amount=${amount}&note=${code}`,
      mbbank: `mbbank://transfer?account=${acc}&amount=${amount}&note=${code}`,
    };
  }

  // Verify webhook API key
  verifyWebhook(authHeader: string): boolean {
    const expected = `Apikey ${process.env.SEPAY_API_KEY}`;
    return authHeader === expected;
  }

  // Extract HM code from content
  extractCode(content: string): string | null {
    const match = content.match(/HM-([A-Z0-9]{7})/i);
    return match ? match[0].toUpperCase() : null;
  }
}
```

### Wallet Service

```typescript
class WalletService {
  // Create topup request
  async createTopup(userId: string, amount: number): Promise<TopupResponse> {
    // Validate amount
    if (amount < 100000 || amount > 50000000) {
      throw new BadRequestException('Amount must be 100,000 - 50,000,000 VND');
    }

    // Generate unique code
    let code: string;
    let attempts = 0;
    do {
      code = this.sepayService.generateCode();
      const exists = await this.prisma.paymentRequest.findUnique({ where: { code } });
      if (!exists) break;
      attempts++;
    } while (attempts < 10);

    // Create payment request
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    const request = await this.prisma.paymentRequest.create({
      data: {
        userId,
        code,
        type: 'TOPUP',
        amount,
        status: 'PENDING',
        expiresAt,
      },
    });

    return {
      id: request.id,
      code: request.code,
      amount: request.amount,
      qrUrl: this.sepayService.generateQrUrl(amount, code),
      deeplinks: this.sepayService.getBankDeeplinks(amount, code),
      expiresAt: request.expiresAt.toISOString(),
    };
  }

  // Get wallet balance
  async getBalance(userId: string): Promise<{ balance: number; pendingTopups: number }> {
    // Sum of completed topups
    const topups = await this.prisma.paymentRequest.aggregate({
      where: { userId, type: 'TOPUP', status: 'COMPLETED' },
      _sum: { amount: true },
    });

    // Sum of completed wallet payments (bookings paid from wallet)
    const spent = await this.prisma.paymentRequest.aggregate({
      where: { userId, type: 'BOOKING', status: 'COMPLETED', bookingId: { not: null } },
      _sum: { amount: true },
    });

    // Pending topups
    const pending = await this.prisma.paymentRequest.aggregate({
      where: { userId, type: 'TOPUP', status: 'PENDING' },
      _sum: { amount: true },
    });

    return {
      balance: (topups._sum.amount || 0) - (spent._sum.amount || 0),
      pendingTopups: pending._sum.amount || 0,
    };
  }

  // Process SePay webhook
  async processWebhook(payload: SepayWebhookDto): Promise<void> {
    // Only process incoming payments
    if (payload.transferType !== 'in') return;

    // Extract code from content
    const code = this.sepayService.extractCode(payload.content);
    if (!code) {
      this.logger.warn(`No HM code found in content: ${payload.content}`);
      return;
    }

    // Find payment request
    const request = await this.prisma.paymentRequest.findUnique({ where: { code } });
    if (!request) {
      this.logger.warn(`No payment request found for code: ${code}`);
      return;
    }

    // Check status
    if (request.status !== 'PENDING') {
      this.logger.info(`Payment request ${code} already ${request.status}`);
      return;
    }

    // Validate amount (exact match)
    if (payload.transferAmount !== request.amount) {
      await this.prisma.paymentRequest.update({
        where: { id: request.id },
        data: {
          status: 'FAILED',
          gateway: payload.gateway,
          sepayId: payload.id,
          referenceCode: payload.referenceCode,
        },
      });
      this.logger.error(`Amount mismatch for ${code}: expected ${request.amount}, got ${payload.transferAmount}`);
      return;
    }

    // Complete the payment request
    await this.prisma.paymentRequest.update({
      where: { id: request.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        sepayId: payload.id,
        gateway: payload.gateway,
        referenceCode: payload.referenceCode,
      },
    });

    // If booking payment, update booking status
    if (request.type === 'BOOKING' && request.bookingId) {
      await this.bookingsService.markPaymentReceived(request.bookingId);
    }

    // Send push notification to user
    await this.notificationsService.sendPaymentConfirmation(request.userId, request.amount);
  }
}
```

## Webhook Processing Flow

```
SePay Webhook Arrives (POST /webhooks/payment)
    │
    ├─► Verify API Key header
    │   └─► If invalid → return 401
    │
    ├─► Check transferType === "in"
    │   └─► If "out" → return 200 (ignore)
    │
    ├─► Extract HM-XXXXXXX from "content" field
    │   └─► If no code → log warning, return 200
    │
    ├─► Find PaymentRequest by code
    │   └─► If not found → log warning, return 200
    │
    ├─► Check PaymentRequest status
    │   ├─► If COMPLETED → already processed, return 200
    │   ├─► If EXPIRED → log, return 200
    │   └─► If PENDING → continue
    │
    ├─► Validate amount (exact match)
    │   └─► If mismatch → mark FAILED, return 200
    │
    ├─► Update PaymentRequest to COMPLETED
    │
    ├─► If type === BOOKING → update booking status
    │
    ├─► Send push notification
    │
    └─► Return {"success": true}
```

## Mobile App Flow

### Topup Screen (`/hirer/wallet/topup.tsx`)

```
1. User enters amount (preset: 100K, 200K, 500K, 1M, 2M, 5M + custom)

2. User taps "Create QR Code"
   └─► POST /wallet/topup { amount }

3. Display QR Screen:
   ┌─────────────────────────────┐
   │  Amount: 500,000 VND        │
   │  Code: HM-ABC1234           │
   │                             │
   │      [QR CODE IMAGE]        │
   │                             │
   │  ⏱ Expires in 29:45         │
   │                             │
   │  [Download QR]  [Copy Code] │
   │                             │
   │  ── Open Bank App ──        │
   │  [TPBank] [VCB] [MB] [TCB]  │
   └─────────────────────────────┘

4. Bank deeplinks pre-fill transfer details

5. After payment, show success when webhook processes
```

### Booking Payment with Wallet

```
Payment screen shows wallet option if balance sufficient:

┌─────────────────────────────┐
│  Booking Total: 1,500,000đ  │
│                             │
│  ○ Wallet (Balance: 2M)  ✓  │
│  ○ Bank QR Code             │
│  ○ VNPay                    │
│  ○ Momo                     │
└─────────────────────────────┘

Wallet payment = instant (no QR needed)
Bank QR = same flow as topup with type=BOOKING
```

## Error Handling

| Scenario | Handling |
|----------|----------|
| Wrong amount paid | Mark FAILED, user notified, manual refund |
| Payment after expiry | No matching request, manual reconciliation |
| Duplicate webhook | Idempotent - return success |
| Pays twice same code | First completes, second logged for review |
| Insufficient balance | Block wallet option, show "Top up" CTA |

### Expiry Cleanup Cron

```typescript
// Every 5 minutes
@Cron('*/5 * * * *')
async cleanupExpiredRequests() {
  await this.prisma.paymentRequest.updateMany({
    where: {
      status: 'PENDING',
      expiresAt: { lt: new Date() }
    },
    data: { status: 'EXPIRED' }
  });
}
```

## Environment Variables

```bash
SEPAY_ACCOUNT_NUMBER=94886886886
SEPAY_BANK_CODE=TPBank
SEPAY_ACCOUNT_NAME=NGUYEN DINH DUNG
SEPAY_API_KEY=<webhook_api_key>

TOPUP_MIN_AMOUNT=100000
TOPUP_MAX_AMOUNT=50000000
TOPUP_EXPIRY_MINUTES=30
```

## Files to Create

| File | Purpose |
|------|---------|
| `society-backend/src/modules/wallet/wallet.module.ts` | Wallet module |
| `society-backend/src/modules/wallet/wallet.controller.ts` | REST endpoints |
| `society-backend/src/modules/wallet/wallet.service.ts` | Business logic |
| `society-backend/src/modules/wallet/dto/wallet.dto.ts` | DTOs |
| `society-backend/src/modules/payments/services/sepay.service.ts` | SePay integration |
| `society-backend/prisma/migrations/XXXX_add_payment_request/` | DB migration |
| `society-mobile/src/app/hirer/wallet/index.tsx` | Wallet balance screen |
| `society-mobile/src/app/hirer/wallet/topup.tsx` | Topup with QR |
| `society-mobile/src/lib/api/services/wallet.service.ts` | API client |

## Files to Modify

| File | Changes |
|------|---------|
| `schema.prisma` | Add PaymentRequest model and enums |
| `webhooks.controller.ts` | Add POST /webhooks/payment endpoint |
| `app.module.ts` | Import WalletModule |
| `prisma.service.ts` | Add paymentRequest to CACHED_MODELS |
| `payment.tsx` (mobile) | Add wallet payment option |
