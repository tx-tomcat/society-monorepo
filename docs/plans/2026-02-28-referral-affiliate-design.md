# Referral/Affiliate System Design

**Date:** 2026-02-28
**Status:** Approved

## Overview

Extend the existing referral module into a full affiliate commission system. Both hirers and companions can refer anyone. Referrers earn 5% commission (capped at 500k VND) on every booking made by their referred users, credited to their wallet.

## Financial Model

### Platform Fee Change: 22% → 27%

| | Organic Booking | Referred Booking |
|---|---|---|
| Companion receives | 73% | 73% |
| Referrer commission | 0% | 5% (capped 500k VND) |
| Hireme keeps | **27%** | **22%** (23-26% on 10M+ bookings due to cap) |

The 5% referral commission is funded by the increased platform fee. On organic bookings (no referrer), Hireme keeps the full 27% — a revenue increase over the current 22%.

### Per-Booking Examples

| Booking Amount | Companion (73%) | Referrer (5%, cap 500k) | Hireme Keeps |
|---|---|---|---|
| 2,000,000 | 1,460,000 | 100,000 | 440,000 (22%) |
| 5,000,000 | 3,650,000 | 250,000 | 1,100,000 (22%) |
| 10,000,000 | 7,300,000 | 500,000 | 2,200,000 (22%) |
| 15,000,000 | 10,950,000 | 500,000 | 3,550,000 (23.7%) |
| 20,000,000 | 14,600,000 | 500,000 | 4,900,000 (24.5%) |

## Database Schema

### New Model: ReferralBonus

```prisma
model ReferralBonus {
  id             String              @id @default(uuid()) @db.Uuid
  referralId     String              @map("referral_id") @db.Uuid
  referredUserId String              @map("referred_user_id") @db.Uuid
  bookingId      String              @unique @map("booking_id") @db.Uuid
  bookingAmount  Int                 @map("booking_amount")
  bonusAmount    Int                 @map("bonus_amount")
  status         ReferralBonusStatus @default(PENDING)
  creditedAt     DateTime?           @map("credited_at")
  createdAt      DateTime            @default(now()) @map("created_at")
  updatedAt      DateTime            @updatedAt @map("updated_at")

  referral     Referral @relation(fields: [referralId], references: [id])
  referredUser User     @relation("ReferralBonusUser", fields: [referredUserId], references: [id])
  booking      Booking  @relation(fields: [bookingId], references: [id])

  @@map("referral_bonuses")
}

enum ReferralBonusStatus {
  PENDING
  CREDITED
}
```

### Existing Model Updates

- Add `bonuses ReferralBonus[]` relation to `Referral` model
- Add `referralBonuses ReferralBonus[]` relation to `User` model
- Add `referralBonus ReferralBonus?` relation to `Booking` model
- Update platform fee constant from 0.18/0.22 to 0.27

## Backend Flow

### Booking Completion → Commission

```
Booking completes
    ↓
BookingService emits BOOKING_COMPLETED event
    ↓
ReferralService @OnEvent('booking.completed')
    ↓
Check: does the hirer have user.referredById?
    ├── No → stop
    └── Yes → continue
    ↓
Calculate: bonus = min(bookingAmount * 0.05, 500_000)
    ↓
Transaction:
    1. Create ReferralBonus (status: PENDING)
    2. Update Referral.totalEarnings += bonus
    3. Emit REFERRAL_BONUS_AWARDED event
    ↓
WalletService @OnEvent('referral.bonus_awarded')
    ↓
Credit referrer's wallet balance
    ↓
Update ReferralBonus status → CREDITED
```

## API Endpoints

### Existing (no changes needed)

- `GET /referral/my-code` — get/generate referral code
- `POST /referral/apply` — apply code at signup
- `GET /referral/stats` — total referrals + earnings
- `GET /referral/leaderboard` — top 10 referrers
- `GET /referral/history` — list of referred users

### New

- `GET /referral/bonus-history` — paginated list of ReferralBonus records

  Response:
  ```json
  {
    "bonuses": [
      {
        "id": "uuid",
        "referredUserName": "Nguyen A",
        "bookingAmount": 5000000,
        "bonusAmount": 250000,
        "status": "CREDITED",
        "creditedAt": "2026-02-28T10:00:00Z",
        "createdAt": "2026-02-28T09:55:00Z"
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 20
  }
  ```

## Mobile Screens

### Referral Screen (new)

Accessible from account/profile page.

**Components:**
- Referral code display with copy + share buttons
- Share generates deep link: `hireme.vn/ref/{CODE}`
- Stats cards: total referrals, total earnings
- Bonus history list: date, referred user, booking amount, commission
- Pull-to-refresh

### Signup Flow

- "Have a referral code?" input field after account creation
- Validates and applies via `POST /referral/apply`

## Files to Modify

### Backend

| File | Change |
|---|---|
| Prisma schema | Add `ReferralBonus` model + enum + relations |
| Earnings/platform fee constants | 22% → 27% |
| `referral.service.ts` | Add `@OnEvent` for booking completion, bonus calculation, bonus-history query |
| `referral.controller.ts` | Add `GET /bonus-history` endpoint |
| `wallet.service.ts` | Add `@OnEvent` for `REFERRAL_BONUS_AWARDED`, credit wallet |
| `wallet.events.ts` | Add `REFERRAL_BONUS_AWARDED` event constant |

### Mobile

| File | Change |
|---|---|
| New referral screen | Code display, share, stats, history |
| Account/profile page | Link to referral screen |
| Signup flow | Referral code input |
| API service | Referral API calls |
| Translations (en/vi) | Referral UI strings |

## Edge Cases

| Case | Behavior |
|---|---|
| Self-referral | Blocked (existing validation) |
| Cancelled booking | No bonus (only completed bookings) |
| Referrer deactivates code | Existing referrals still earn commission |
| Zero-amount booking | No bonus (0 * 5% = 0) |
| Multiple bookings same day | Each generates independent bonus |
| Referred companion receives booking | Commission triggers for referrer |

## Out of Scope

- Tiered commission rates
- Campaign/promo code system
- Admin dashboard for referrals
- Time limit on referral commissions (lifetime affiliate)
- Separate withdrawal flow (uses existing wallet)
