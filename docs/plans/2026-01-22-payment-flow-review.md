# Payment Flow Review - SePay Integration Analysis

**Date:** 2026-01-22
**Status:** Review Complete - Implementation Required

## Executive Summary

The current payment system supports VNPay, Momo, and basic bank transfer webhooks, but **lacks SePay integration** for the user's described topup flow. Key gaps include:

1. No SePay QR code generation
2. No `HM-XXXXXXX` payment message format
3. No wallet/topup functionality (only booking payments)
4. No bank app deeplink integration
5. Webhook endpoint mismatch (`/webhooks/bank-transfer` vs `/webhooks/payment`)

---

## Current Implementation

### Backend Payment Module Structure

```
society-backend/src/modules/payments/
├── controllers/
│   ├── payments.controller.ts      # General payments API
│   ├── subscriptions.controller.ts # Subscription management
│   └── webhooks.controller.ts      # VNPay, Momo, Bank Transfer webhooks
├── services/
│   ├── payments.service.ts         # Main payment service with fraud detection
│   ├── subscriptions.service.ts    # Subscription plan management
│   ├── vnpay.service.ts            # VNPay payment URL generation
│   ├── momo.service.ts             # Momo payment API
│   └── bank-transfer.service.ts    # Bank transfer webhook processing
├── dto/
│   └── payment.dto.ts              # DTOs including BankTransferWebhookDto
└── interfaces/
    └── payment.interface.ts        # Type definitions
```

### Supported Payment Providers

| Provider | Status | Features |
|----------|--------|----------|
| VNPay | ✅ Implemented | Payment URL, SHA512 signature, webhook |
| Momo | ✅ Implemented | Payment API, HMAC-SHA256, webhook |
| Bank Transfer | ⚠️ Partial | Webhook only, no QR generation |
| SePay | ❌ Missing | Not implemented |

### Current Webhook Endpoints

```typescript
// webhooks.controller.ts
GET  /webhooks/vnpay           // VNPay IPN callback
POST /webhooks/momo            // Momo callback
POST /webhooks/bank-transfer   // Bank transfer (NOT /webhooks/payment)
```

### Current Payment Message Patterns

```typescript
// bank-transfer.service.ts - extractOrderReference()
const ORDER_REF_PATTERNS = [
  /order[_-]?([a-zA-Z0-9-]+)/i,   // order-123, order_abc
  /booking[_-]?([a-zA-Z0-9-]+)/i, // booking-456
  /pay[_-]?([a-zA-Z0-9-]+)/i,     // pay-789
  /ref[_-]?([a-zA-Z0-9-]+)/i,     // ref-xyz
];
```

**User requirement:** `HM-XXXXXXX` format

### Fraud Detection Rules (payments.service.ts)

- Max single transaction: 50,000,000 VND
- Max per day: 5 payments
- Max daily amount: 200,000,000 VND
- Account age check: > 7 days for large transactions
- IP velocity: Max 10 payments/hour from same IP

---

## User's Expected Flow

### SePay Webhook Configuration

```
Webhook ID: 22602
Type: "Xác thực thanh toán" (Payment verification)
Bank: TPBank
Account: 94886886886
Name: NGUYEN DINH DUNG
URL: https://api.hireme.com/webhooks/payment
Auth: Api_Key
```

### Expected Topup Flow

```
1. User clicks "Top Up" in app
2. App shows QR code from https://qr.sepay.vn/
3. User can:
   - Scan QR with banking app
   - Download QR image
   - Use deeplink to open bank app (VietQR API)
4. User completes payment with message: HM-XXXXXXX
5. SePay receives payment, calls webhook
6. Backend matches HM-XXXXXXX to pending topup
7. User wallet balance updated
```

---

## Gap Analysis

### 1. No Wallet/Topup Model

**Current:** Only `Payment` and `Earning` models exist for booking payments.

**Missing:**
- `Wallet` model for user balance
- `TopUp` model for topup requests
- `WalletTransaction` model for balance changes

```prisma
// Proposed models
model Wallet {
  id        String   @id @default(uuid())
  userId    String   @unique
  balance   Int      @default(0) // In VND
  user      User     @relation(...)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model TopUp {
  id          String       @id @default(uuid())
  userId      String
  code        String       @unique // HM-XXXXXXX format
  amount      Int
  status      TopUpStatus  // PENDING, COMPLETED, EXPIRED, FAILED
  expiresAt   DateTime
  completedAt DateTime?
  metadata    Json?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}
```

### 2. No SePay QR Code Generation

**Required:** Integration with `https://qr.sepay.vn/` API

**SePay QR URL format:**
```
https://qr.sepay.vn/img?acc={ACCOUNT}&bank={BANK_CODE}&amount={AMOUNT}&des={MESSAGE}
```

For user's config:
```
https://qr.sepay.vn/img?acc=94886886886&bank=TPBank&amount=500000&des=HM-ABC123
```

### 3. Payment Message Format Mismatch

**Current patterns:** `order-`, `booking-`, `pay-`, `ref-`

**Required pattern:** `HM-XXXXXXX`

```typescript
// Proposed pattern
const HM_CODE_PATTERN = /HM-([A-Z0-9]{7})/i;

function generateTopupCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'HM-';
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
```

### 4. Webhook Endpoint Mismatch

**User configured:** `POST /webhooks/payment`
**Current endpoint:** `POST /webhooks/bank-transfer`

**Options:**
1. Add new endpoint `/webhooks/payment` for SePay
2. Update user's SePay config to use existing endpoint
3. Create unified `/webhooks/sepay` endpoint

### 5. No Bank App Deeplinks

**VietQR Deeplink API:** `https://www.vietqr.io/danh-sach-api/deeplink-app-ngan-hang/`

**Example deeplinks:**
```typescript
const BANK_DEEPLINKS = {
  vietcombank: 'vietcombank://transfer?account={ACC}&amount={AMT}&note={NOTE}',
  techcombank: 'techcombank://transfer?account={ACC}&amount={AMT}&note={NOTE}',
  tpbank: 'tpbank://transfer?account={ACC}&amount={AMT}&note={NOTE}',
  mbbank: 'mbbank://transfer?account={ACC}&amount={AMT}&note={NOTE}',
  // ... etc
};
```

### 6. SePay Webhook Payload Format

**Unknown:** Need to verify SePay's actual webhook payload structure.

**Current BankTransferWebhookDto:**
```typescript
export class BankTransferWebhookDto {
  transactionId: string;
  amount: number;
  transferNote: string;
  senderAccount: string;
  senderName: string;
  bankCode: string;
  signature: string;
  timestamp: string;
}
```

**Likely SePay fields to verify:**
- Transaction ID format
- Amount field name
- Transfer note/description field
- Signature algorithm (HMAC-SHA256?)
- Timestamp format

---

## Mobile App Current State

### payment.tsx (Booking Payment)

- Shows payment method selection: card, bank, momo, zalopay
- Creates booking then payment
- No QR display
- No topup functionality

### PaymentInitiateResponse

```typescript
export interface PaymentInitiateResponse {
  paymentId: string;
  paymentUrl: string;
  qrCode?: string;  // Field exists but not implemented
  expiresAt: string;
}
```

**Note:** `qrCode` field exists but backend doesn't populate it.

---

## Implementation Recommendations

### Phase 1: Database & Core Models

1. Add `Wallet` model to schema
2. Add `TopUp` model with `HM-XXXXXXX` code
3. Add `WalletTransaction` model for audit trail
4. Run migrations

### Phase 2: SePay Service

1. Create `sepay.service.ts`:
   - `generateTopupCode()` - Create HM-XXXXXXX codes
   - `generateQrUrl()` - Build SePay QR URL
   - `getBankDeeplinks()` - Return deeplink URLs for major banks
   - `verifyWebhook()` - Validate SePay signature

2. Create `wallet.service.ts`:
   - `getBalance()` - Get user wallet balance
   - `createTopup()` - Create pending topup with code
   - `completeTopup()` - Process successful payment
   - `getTransactions()` - Wallet transaction history

### Phase 3: Webhook Endpoint

1. Add `POST /webhooks/payment` (or `/webhooks/sepay`)
2. Parse SePay webhook payload
3. Extract HM-XXXXXXX from transfer note
4. Find matching pending TopUp
5. Update wallet balance
6. Mark TopUp as completed

### Phase 4: Mobile Integration

1. Create topup screen with:
   - Amount selection
   - QR code display (from SePay URL)
   - Download QR button
   - Bank app deeplinks
   - Expiry countdown

2. Add wallet balance display
3. Add transaction history screen

---

## Environment Variables Needed

```bash
# SePay Configuration
SEPAY_BANK_CODE=TPBank
SEPAY_ACCOUNT_NUMBER=94886886886
SEPAY_ACCOUNT_NAME=NGUYEN DINH DUNG
SEPAY_API_KEY=<your_api_key>
SEPAY_WEBHOOK_SECRET=<webhook_secret>
```

---

## Questions to Clarify

1. **SePay webhook payload structure** - Need documentation or sample
2. **Wallet scope** - For hirers only, or companions too?
3. **Topup expiry time** - How long is QR code valid?
4. **Minimum/maximum topup amounts** - Business rules?
5. **Use case** - Is this for booking payments or general wallet topup?

---

## Files to Create/Modify

### New Files
- `society-backend/src/modules/wallet/wallet.module.ts`
- `society-backend/src/modules/wallet/wallet.service.ts`
- `society-backend/src/modules/wallet/wallet.controller.ts`
- `society-backend/src/modules/wallet/dto/wallet.dto.ts`
- `society-backend/src/modules/payments/services/sepay.service.ts`
- `society-mobile/src/app/hirer/wallet/topup.tsx`
- `society-mobile/src/app/hirer/wallet/index.tsx`

### Modified Files
- `society-backend/prisma/schema.prisma` - Add Wallet, TopUp models
- `society-backend/src/modules/payments/controllers/webhooks.controller.ts` - Add SePay endpoint
- `society-backend/src/modules/payments/dto/payment.dto.ts` - Add SePay webhook DTO
- `society-mobile/src/lib/api/services/payments.service.ts` - Add topup API calls
