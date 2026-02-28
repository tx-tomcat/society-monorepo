# Referral/Affiliate System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire up the existing referral module into a full affiliate commission system where referrers earn 5% (capped 500k VND) on every booking by referred users, credited to their wallet. Update platform fee from 22% to 27%.

**Architecture:** Extend existing `ReferralService` with an `@OnEvent` listener for booking completion. Add `ReferralBonus` model to track each payout. Emit events to credit referrer's wallet via `WalletService`. Add mobile referral screen with share/stats/history. Follow existing event-driven pattern used by membership/boost payments.

**Tech Stack:** NestJS (EventEmitter2, OnEvent), Prisma 7, React Native + Expo Router, react-query-kit, NativeWind

---

## Task 1: Add ReferralBonus Model to Prisma Schema

**Files:**
- Modify: `society-backend/prisma/schema.prisma:1296-1310` (Referral model section)
- Modify: `society-backend/prisma/schema.prisma:518-585` (Booking model — add relation)

**Step 1: Add ReferralBonusStatus enum and ReferralBonus model**

Add after the existing `Referral` model (after line 1310):

```prisma
enum ReferralBonusStatus {
  PENDING
  CREDITED
}

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

  @@index([referralId])
  @@index([referredUserId])
  @@index([status])
  @@map("referral_bonuses")
}
```

**Step 2: Add relation fields to existing models**

In the `Referral` model (line ~1307, before `@@map`), add:
```prisma
  bonuses       ReferralBonus[]
```

In the `User` model (line ~268, after referral relations), add:
```prisma
  referralBonuses ReferralBonus[] @relation("ReferralBonusUser")
```

In the `Booking` model (line ~569, after `paymentRequests`), add:
```prisma
  referralBonus   ReferralBonus?
```

**Step 3: Run migration**

Run: `cd society-backend && pnpm prisma migrate dev --name add-referral-bonus`

**Step 4: Generate Prisma client**

Run: `cd society-backend && pnpm prisma generate`

**Step 5: Commit**

```bash
git add society-backend/prisma/
git commit -m "feat: add ReferralBonus model for affiliate commission tracking"
```

---

## Task 2: Update Platform Fee from 18% to 27%

**Files:**
- Modify: `society-backend/prisma/schema.prisma:1139` (PlatformConfig default)

**Step 1: Update PlatformConfig default**

Change line 1139 from:
```prisma
  platformFeePercent     Decimal @default(0.18) @map("platform_fee_percent") @db.Decimal(5, 4) // e.g., 0.18 = 18%
```
To:
```prisma
  platformFeePercent     Decimal @default(0.27) @map("platform_fee_percent") @db.Decimal(5, 4) // e.g., 0.27 = 27%
```

**Step 2: Update the Booking model comment**

Change line 538 from:
```prisma
  platformFee Int @map("platform_fee") // 18%
```
To:
```prisma
  platformFee Int @map("platform_fee") // 27%
```

**Step 3: Create migration to update existing PlatformConfig record**

Run: `cd society-backend && pnpm prisma migrate dev --name update-platform-fee-to-27-percent`

Note: You may also need a data migration SQL to update the existing `platform_config` row:
```sql
UPDATE platform_config SET platform_fee_percent = 0.27;
```

**Step 4: Commit**

```bash
git add society-backend/prisma/
git commit -m "feat: increase platform fee from 18% to 27% for referral commission funding"
```

---

## Task 3: Add Referral Events to Wallet Events

**Files:**
- Modify: `society-backend/src/modules/wallet/events/wallet.events.ts`

**Step 1: Add referral events**

The current file has `BOOST_PAYMENT_COMPLETED` and `MEMBERSHIP_PAYMENT_COMPLETED`. Add referral event:

```typescript
export const WALLET_EVENTS = {
  BOOST_PAYMENT_COMPLETED: 'boost.payment.completed',
  MEMBERSHIP_PAYMENT_COMPLETED: 'membership.payment.completed',
  REFERRAL_BONUS_AWARDED: 'referral.bonus.awarded',
} as const;

export class BoostPaymentCompletedEvent {
  constructor(public readonly boostId: string) {}
}

export class MembershipPaymentCompletedEvent {
  constructor(public readonly membershipId: string) {}
}

export class ReferralBonusAwardedEvent {
  constructor(
    public readonly referralBonusId: string,
    public readonly referrerUserId: string,
    public readonly bonusAmount: number,
  ) {}
}
```

**Step 2: Commit**

```bash
git add society-backend/src/modules/wallet/events/wallet.events.ts
git commit -m "feat: add REFERRAL_BONUS_AWARDED event for wallet crediting"
```

---

## Task 4: Update ReferralService with Booking Completion Listener

**Files:**
- Modify: `society-backend/src/modules/referral/referral.service.ts`

**Step 1: Add event imports and EventEmitter**

Update imports and constructor:

```typescript
import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { ReferralBonusAwardedEvent, WALLET_EVENTS } from '../wallet/events/wallet.events';

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}
```

**Step 2: Replace `creditReferralBonus` method (lines 142-175)**

Replace the existing `creditReferralBonus` method with an event-driven version that creates a `ReferralBonus` record and emits a wallet credit event:

```typescript
  /**
   * Process referral bonus when a booking completes.
   * Called from BookingsService after booking status changes to COMPLETED.
   */
  async processBookingCompletion(
    bookingId: string,
    hirerId: string,
    bookingAmount: number,
  ): Promise<void> {
    // Check if hirer was referred
    const hirer = await this.prisma.user.findUnique({
      where: { id: hirerId },
      select: { referredById: true },
    });

    if (!hirer?.referredById) {
      return; // Hirer has no referrer
    }

    const referral = await this.prisma.referral.findUnique({
      where: { id: hirer.referredById },
    });

    if (!referral) {
      return;
    }

    // Check if bonus already exists for this booking (idempotency)
    const existingBonus = await this.prisma.referralBonus.findUnique({
      where: { bookingId },
    });

    if (existingBonus) {
      this.logger.warn(`Referral bonus already exists for booking ${bookingId}`);
      return;
    }

    // Calculate bonus: 5% of booking amount, capped at 500,000 VND
    const bonusPercent = 5;
    const maxBonus = 500000;
    const bonus = Math.min(Math.floor(bookingAmount * bonusPercent / 100), maxBonus);

    if (bonus <= 0) {
      return;
    }

    // Create bonus record and update referral earnings in a transaction
    const referralBonus = await this.prisma.$transaction(async (tx) => {
      const rb = await tx.referralBonus.create({
        data: {
          referralId: referral.id,
          referredUserId: hirerId,
          bookingId,
          bookingAmount,
          bonusAmount: bonus,
          status: 'PENDING',
        },
      });

      await tx.referral.update({
        where: { id: referral.id },
        data: {
          totalEarnings: { increment: bonus },
        },
      });

      return rb;
    });

    // Emit event for wallet crediting
    this.eventEmitter.emit(
      WALLET_EVENTS.REFERRAL_BONUS_AWARDED,
      new ReferralBonusAwardedEvent(referralBonus.id, referral.userId, bonus),
    );

    this.logger.log(
      `Referral bonus ${bonus} VND awarded for booking ${bookingId}, referrer ${referral.userId}`,
    );
  }
```

**Step 3: Add bonus history endpoint method**

Add at the end of the class (before the `private generateRandomCode` method):

```typescript
  /**
   * Get referral bonus history for a user
   */
  async getBonusHistory(userId: string, page = 1, limit = 20) {
    const referral = await this.prisma.referral.findUnique({
      where: { userId },
    });

    if (!referral) {
      return { bonuses: [], total: 0, page, limit };
    }

    const [bonuses, total] = await Promise.all([
      this.prisma.referralBonus.findMany({
        where: { referralId: referral.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          referredUser: {
            select: { fullName: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.referralBonus.count({
        where: { referralId: referral.id },
      }),
    ]);

    return {
      bonuses: bonuses.map((b) => ({
        id: b.id,
        referredUserName: b.referredUser.fullName || 'Anonymous',
        referredUserAvatar: b.referredUser.avatarUrl,
        bookingAmount: b.bookingAmount,
        bonusAmount: b.bonusAmount,
        status: b.status,
        creditedAt: b.creditedAt,
        createdAt: b.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * Mark a referral bonus as credited (called after wallet credit succeeds)
   */
  async markBonusCredited(referralBonusId: string): Promise<void> {
    await this.prisma.referralBonus.update({
      where: { id: referralBonusId },
      data: {
        status: 'CREDITED',
        creditedAt: new Date(),
      },
    });
  }
```

**Step 4: Commit**

```bash
git add society-backend/src/modules/referral/referral.service.ts
git commit -m "feat: add event-driven referral bonus processing and bonus history"
```

---

## Task 5: Add Bonus History Endpoint to ReferralController

**Files:**
- Modify: `society-backend/src/modules/referral/referral.controller.ts`

**Step 1: Add bonus-history endpoint**

Add after the existing `history` endpoint (line 43):

```typescript
  @Get('bonus-history')
  async getBonusHistory(
    @CurrentUser() user: CurrentUserData,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.referralService.getBonusHistory(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
```

Add `Query` to the `@nestjs/common` import:

```typescript
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
```

**Step 2: Commit**

```bash
git add society-backend/src/modules/referral/referral.controller.ts
git commit -m "feat: add GET /referral/bonus-history endpoint"
```

---

## Task 6: Integrate Referral Bonus into Booking Completion Flow

**Files:**
- Modify: `society-backend/src/modules/bookings/services/bookings.service.ts:1078-1086`
- Modify: `society-backend/src/modules/bookings/bookings.module.ts`

**Step 1: Add ReferralModule import to BookingsModule**

In `society-backend/src/modules/bookings/bookings.module.ts`, add import:

```typescript
import { ReferralModule } from '../referral/referral.module';
```

Add `ReferralModule` to the imports array:

```typescript
  imports: [
    ConfigModule,
    ModerationModule,
    NotificationsModule,
    OccasionsModule,
    PlatformConfigModule,
    ReferralModule,
    SecurityModule,
  ],
```

**Step 2: Inject ReferralService into BookingsService**

In `society-backend/src/modules/bookings/services/bookings.service.ts`, add import:

```typescript
import { ReferralService } from '@/modules/referral/referral.service';
```

Add to constructor:

```typescript
private readonly referralService: ReferralService,
```

**Step 3: Call referral processing on booking completion**

In the `BookingStatus.COMPLETED` block (after line 1086, after the `createEarningForBooking` call), add:

```typescript
      // Process referral bonus (async, don't block the response)
      this.referralService.processBookingCompletion(
        bookingId,
        booking.hirerId,
        booking.totalPrice,
      ).catch((err) =>
        this.logger.error(`Failed to process referral bonus for booking ${bookingId}: ${err.message}`),
      );
```

**Step 4: Commit**

```bash
git add society-backend/src/modules/bookings/
git commit -m "feat: integrate referral bonus processing into booking completion flow"
```

---

## Task 7: Add Wallet Credit Listener for Referral Bonuses

**Files:**
- Modify: `society-backend/src/modules/wallet/wallet.service.ts`

**Step 1: Import referral event and ReferralService**

Add to existing imports in wallet.service.ts:

```typescript
import { ReferralBonusAwardedEvent, WALLET_EVENTS } from './events/wallet.events';
```

Note: `WALLET_EVENTS` import should already exist — just ensure `ReferralBonusAwardedEvent` is included.

**Step 2: Add OnEvent listener method**

Add the `OnEvent` import if not already present:

```typescript
import { OnEvent } from '@nestjs/event-emitter';
```

Add listener method to the WalletService class:

```typescript
  /**
   * Credit referrer's wallet when referral bonus is awarded.
   * Creates a completed TOPUP payment request to credit the wallet balance.
   */
  @OnEvent(WALLET_EVENTS.REFERRAL_BONUS_AWARDED)
  async creditReferralBonus(event: ReferralBonusAwardedEvent): Promise<void> {
    const { referralBonusId, referrerUserId, bonusAmount } = event;

    try {
      // Create a completed topup record to credit the wallet
      const code = `HM-REF-${Date.now().toString(36).toUpperCase()}`;

      await this.prisma.paymentRequest.create({
        data: {
          userId: referrerUserId,
          code,
          type: 'TOPUP',
          amount: bonusAmount,
          status: 'COMPLETED',
          expiresAt: new Date(), // Already completed, no expiry needed
          completedAt: new Date(),
        },
      });

      // Mark the referral bonus as credited
      // Import ReferralService would create circular dependency,
      // so update directly via Prisma
      await this.prisma.referralBonus.update({
        where: { id: referralBonusId },
        data: {
          status: 'CREDITED',
          creditedAt: new Date(),
        },
      });

      this.logger.log(
        `Referral bonus ${bonusAmount} VND credited to wallet for user ${referrerUserId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to credit referral bonus ${referralBonusId}: ${error.message}`,
      );
    }
  }
```

**Step 3: Add Logger if not already present**

Check if the service already has a logger. If not, add:

```typescript
private readonly logger = new Logger(WalletService.name);
```

**Step 4: Commit**

```bash
git add society-backend/src/modules/wallet/wallet.service.ts
git commit -m "feat: add wallet credit listener for referral bonuses"
```

---

## Task 8: Add EventEmitterModule to ReferralModule

**Files:**
- Modify: `society-backend/src/modules/referral/referral.module.ts`

**Step 1: Verify EventEmitterModule is available**

Check `society-backend/src/app.module.ts` for `EventEmitterModule.forRoot()`. It should already be registered globally. If so, no import needed in ReferralModule — just ensure `EventEmitter2` can be injected.

If not globally available, add to referral module imports:

```typescript
import { Module } from '@nestjs/common';
import { ReferralController } from './referral.controller';
import { ReferralService } from './referral.service';

@Module({
  controllers: [ReferralController],
  providers: [ReferralService],
  exports: [ReferralService],
})
export class ReferralModule {}
```

No changes needed if EventEmitterModule is global (which it should be since wallet.service.ts already uses it).

**Step 2: Commit (if changes needed)**

```bash
git add society-backend/src/modules/referral/referral.module.ts
git commit -m "feat: ensure EventEmitter available in ReferralModule"
```

---

## Task 9: Create Mobile Referral API Service

**Files:**
- Create: `society-mobile/src/lib/api/services/referral.service.ts`
- Modify: `society-mobile/src/lib/api/services/index.ts`

**Step 1: Create referral service**

Create `society-mobile/src/lib/api/services/referral.service.ts`:

```typescript
import { apiClient } from '../client';

export type ReferralBonusStatus = 'PENDING' | 'CREDITED';

export interface ReferralStats {
  totalReferrals: number;
  totalEarnings: number;
  code: string | null;
}

export interface ReferralBonusItem {
  id: string;
  referredUserName: string;
  referredUserAvatar: string | null;
  bookingAmount: number;
  bonusAmount: number;
  status: ReferralBonusStatus;
  creditedAt: string | null;
  createdAt: string;
}

export interface ReferralBonusHistoryResponse {
  bonuses: ReferralBonusItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ReferredUser {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
}

export const referralService = {
  async getMyCode(): Promise<{ code: string }> {
    return apiClient.get('/referral/my-code');
  },

  async getStats(): Promise<ReferralStats> {
    return apiClient.get('/referral/stats');
  },

  async getBonusHistory(page = 1, limit = 20): Promise<ReferralBonusHistoryResponse> {
    return apiClient.get(`/referral/bonus-history?page=${page}&limit=${limit}`);
  },

  async getHistory(): Promise<ReferredUser[]> {
    return apiClient.get('/referral/history');
  },

  async applyCode(code: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/referral/apply', { code });
  },

  async validateCode(code: string): Promise<{ valid: boolean; message?: string }> {
    return apiClient.get(`/referral/validate?code=${code}`);
  },
};
```

**Step 2: Export from index**

Add to `society-mobile/src/lib/api/services/index.ts`:

```typescript
export * from './referral.service';
```

**Step 3: Commit**

```bash
git add society-mobile/src/lib/api/services/referral.service.ts society-mobile/src/lib/api/services/index.ts
git commit -m "feat: add referral API service for mobile app"
```

---

## Task 10: Add Referral Translations

**Files:**
- Modify: `society-mobile/src/translations/en.json`
- Modify: `society-mobile/src/translations/vi.json`

**Step 1: Add English translations**

Add a `referral` section to `en.json`:

```json
"referral": {
  "title": "Referrals",
  "your_code": "Your Referral Code",
  "copy_code": "Copy Code",
  "copied": "Copied!",
  "share": "Share",
  "share_message": "Join Hireme with my referral code {{code}} and get matched with top professionals! Download at hireme.vn/ref/{{code}}",
  "stats": "Your Stats",
  "total_referrals": "Total Referrals",
  "total_earnings": "Total Earnings",
  "bonus_history": "Commission History",
  "no_bonuses": "No commissions yet. Share your code to start earning!",
  "no_referrals": "No referrals yet",
  "bonus_from": "From {{name}}'s booking",
  "pending": "Pending",
  "credited": "Credited",
  "earn_description": "Earn 5% commission (up to 500K VND) on every booking made by people you refer!",
  "referred_users": "Referred Users",
  "apply_code": "Have a referral code?",
  "apply_code_placeholder": "Enter referral code",
  "apply_button": "Apply",
  "apply_success": "Referral code applied successfully!",
  "apply_error": "Invalid or expired referral code"
}
```

**Step 2: Add Vietnamese translations**

Add a `referral` section to `vi.json`:

```json
"referral": {
  "title": "Giới thiệu",
  "your_code": "Mã giới thiệu của bạn",
  "copy_code": "Sao chép",
  "copied": "Đã sao chép!",
  "share": "Chia sẻ",
  "share_message": "Tham gia Hireme với mã giới thiệu {{code}} và được kết nối với các chuyên gia hàng đầu! Tải tại hireme.vn/ref/{{code}}",
  "stats": "Thống kê",
  "total_referrals": "Tổng giới thiệu",
  "total_earnings": "Tổng thu nhập",
  "bonus_history": "Lịch sử hoa hồng",
  "no_bonuses": "Chưa có hoa hồng. Chia sẻ mã để bắt đầu kiếm tiền!",
  "no_referrals": "Chưa có người được giới thiệu",
  "bonus_from": "Từ đặt chỗ của {{name}}",
  "pending": "Đang xử lý",
  "credited": "Đã cộng",
  "earn_description": "Nhận 5% hoa hồng (tối đa 500K VND) trên mỗi đặt chỗ của người bạn giới thiệu!",
  "referred_users": "Người được giới thiệu",
  "apply_code": "Bạn có mã giới thiệu?",
  "apply_code_placeholder": "Nhập mã giới thiệu",
  "apply_button": "Áp dụng",
  "apply_success": "Áp dụng mã giới thiệu thành công!",
  "apply_error": "Mã giới thiệu không hợp lệ hoặc đã hết hạn"
}
```

**Step 3: Commit**

```bash
git add society-mobile/src/translations/
git commit -m "feat: add referral translations for en and vi"
```

---

## Task 11: Create Mobile Referral Screen

**Files:**
- Create: `society-mobile/src/app/hirer/referral/index.tsx`

**Step 1: Create referral screen**

Create `society-mobile/src/app/hirer/referral/index.tsx`:

```tsx
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Pressable, Share } from 'react-native';

import { colors, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { ArrowLeft, Copy, Share as ShareIcon } from '@/components/ui/icons';
import { referralService } from '@/lib/api/services/referral.service';
import type { ReferralBonusItem } from '@/lib/api/services/referral.service';
import { useQuery } from '@tanstack/react-query';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
}

function BonusItem({ item }: { item: ReferralBonusItem }) {
  const { t } = useTranslation();

  return (
    <View className="mb-2 flex-row items-center justify-between rounded-xl bg-white p-4">
      <View className="flex-1">
        <Text className="font-urbanist-semibold text-base text-midnight">
          {t('referral.bonus_from', { name: item.referredUserName })}
        </Text>
        <Text className="mt-1 text-sm text-text-tertiary">
          {new Date(item.createdAt).toLocaleDateString('vi-VN')}
        </Text>
      </View>
      <View className="items-end">
        <Text className="font-urbanist-bold text-base text-teal-500">
          +{formatCurrency(item.bonusAmount)}
        </Text>
        <Text className={`mt-1 text-xs ${item.status === 'CREDITED' ? 'text-teal-500' : 'text-yellow-500'}`}>
          {t(`referral.${item.status.toLowerCase()}`)}
        </Text>
      </View>
    </View>
  );
}

export default function ReferralScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['referral', 'stats'],
    queryFn: () => referralService.getStats(),
  });

  const { data: codeData } = useQuery({
    queryKey: ['referral', 'my-code'],
    queryFn: () => referralService.getMyCode(),
  });

  const { data: bonusHistory } = useQuery({
    queryKey: ['referral', 'bonus-history'],
    queryFn: () => referralService.getBonusHistory(),
  });

  const code = codeData?.code || stats?.code || '';

  const handleCopy = useCallback(async () => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleShare = useCallback(async () => {
    if (!code) return;
    try {
      await Share.share({
        message: t('referral.share_message', { code }),
      });
    } catch (error) {
      // User cancelled
    }
  }, [code, t]);

  return (
    <SafeAreaView className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      {/* Header */}
      <View className="flex-row items-center border-b border-border-light px-4 py-3">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
        </Pressable>
        <Text className="font-urbanist-bold text-xl text-midnight">
          {t('referral.title')}
        </Text>
      </View>

      <FlatList
        data={bonusHistory?.bonuses || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BonusItem item={item} />}
        contentContainerClassName="px-4 pb-8"
        ListHeaderComponent={
          <>
            {/* Earn Description */}
            <View className="mt-4 rounded-2xl bg-lavender-900/5 p-4">
              <Text className="text-center text-sm text-text-secondary">
                {t('referral.earn_description')}
              </Text>
            </View>

            {/* Referral Code Card */}
            <View className="mt-4 rounded-2xl bg-white p-5">
              <Text className="text-center text-sm text-text-tertiary">
                {t('referral.your_code')}
              </Text>
              <Text className="mt-2 text-center font-urbanist-bold text-3xl tracking-widest text-midnight">
                {code || '---'}
              </Text>
              <View className="mt-4 flex-row gap-3">
                <Pressable
                  onPress={handleCopy}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-lavender-900/10 py-3"
                >
                  <Copy color={colors.lavender[900]} width={18} height={18} />
                  <Text className="font-semibold text-lavender-900">
                    {copied ? t('referral.copied') : t('referral.copy_code')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleShare}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-rose-400/10 py-3"
                >
                  <ShareIcon color={colors.rose[400]} width={18} height={18} />
                  <Text className="font-semibold text-rose-400">
                    {t('referral.share')}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Stats */}
            <View className="mt-4 flex-row gap-3">
              <View className="flex-1 rounded-2xl bg-white p-4">
                <Text className="text-sm text-text-tertiary">
                  {t('referral.total_referrals')}
                </Text>
                <Text className="mt-1 font-urbanist-bold text-2xl text-midnight">
                  {stats?.totalReferrals ?? 0}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-4">
                <Text className="text-sm text-text-tertiary">
                  {t('referral.total_earnings')}
                </Text>
                <Text className="mt-1 font-urbanist-bold text-2xl text-teal-500">
                  {formatCurrency(stats?.totalEarnings ?? 0)}
                </Text>
              </View>
            </View>

            {/* Bonus History Header */}
            <Text className="mb-3 mt-6 font-urbanist-semibold text-sm uppercase tracking-wider text-text-tertiary">
              {t('referral.bonus_history')}
            </Text>
          </>
        }
        ListEmptyComponent={
          <View className="items-center py-8">
            <Text className="text-center text-text-tertiary">
              {t('referral.no_bonuses')}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
```

**Step 2: Commit**

```bash
git add society-mobile/src/app/hirer/referral/
git commit -m "feat: add referral screen with code sharing, stats, and bonus history"
```

---

## Task 12: Add Referral Link to Account Screen

**Files:**
- Modify: `society-mobile/src/app/(app)/account.tsx:47-76`

**Step 1: Add Gift/Share icon import**

In the icons import (line 19-31), add an appropriate icon. If `Gift` doesn't exist, use `Share` or `Star`:

```typescript
import {
    ArrowRight,
    Bell,
    Crown,
    Edit,
    Heart,
    Help,
    HiremeLogo,
    Language,
    Lock,
    Logout,
    Share,
    Shield,
    Star,
    User
} from '@/components/ui/icons';
```

**Step 2: Add referral item to the Account section**

In the first `SETTINGS_SECTIONS` items array (lines 50-76), add after the membership item:

```typescript
            {
                id: 'referral',
                labelKey: 'referral.title',
                icon: Share,
                iconBg: 'bg-teal-400/10',
                iconColor: colors.teal[400],
                route: '/hirer/referral',
            },
```

**Step 3: Commit**

```bash
git add society-mobile/src/app/(app)/account.tsx
git commit -m "feat: add referral link to account settings screen"
```

---

## Task 13: Backend Tests for Referral Bonus Processing

**Files:**
- Create: `society-backend/src/modules/referral/referral.service.spec.ts`

**Step 1: Write tests**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ReferralService } from './referral.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WALLET_EVENTS } from '../wallet/events/wallet.events';

describe('ReferralService', () => {
  let service: ReferralService;
  let prisma: any;
  let eventEmitter: EventEmitter2;

  const mockPrisma = {
    referral: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    referralBonus: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<ReferralService>(ReferralService);
    prisma = module.get(PrismaService);
    eventEmitter = module.get(EventEmitter2);

    jest.clearAllMocks();
  });

  describe('processBookingCompletion', () => {
    it('should do nothing if hirer has no referrer', async () => {
      prisma.user.findUnique.mockResolvedValue({ referredById: null });

      await service.processBookingCompletion('booking-1', 'hirer-1', 5000000);

      expect(prisma.referralBonus.findUnique).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should calculate 5% bonus capped at 500k', async () => {
      prisma.user.findUnique.mockResolvedValue({ referredById: 'ref-1' });
      prisma.referral.findUnique.mockResolvedValue({ id: 'ref-1', userId: 'referrer-1' });
      prisma.referralBonus.findUnique.mockResolvedValue(null);

      const mockBonus = { id: 'bonus-1' };
      prisma.$transaction.mockImplementation(async (fn: any) => {
        const mockTx = {
          referralBonus: { create: jest.fn().mockResolvedValue(mockBonus) },
          referral: { update: jest.fn().mockResolvedValue({}) },
        };
        return fn(mockTx);
      });

      await service.processBookingCompletion('booking-1', 'hirer-1', 5000000);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        WALLET_EVENTS.REFERRAL_BONUS_AWARDED,
        expect.objectContaining({
          referralBonusId: 'bonus-1',
          referrerUserId: 'referrer-1',
          bonusAmount: 250000, // 5% of 5M
        }),
      );
    });

    it('should cap bonus at 500k VND for large bookings', async () => {
      prisma.user.findUnique.mockResolvedValue({ referredById: 'ref-1' });
      prisma.referral.findUnique.mockResolvedValue({ id: 'ref-1', userId: 'referrer-1' });
      prisma.referralBonus.findUnique.mockResolvedValue(null);

      let capturedBonusAmount: number;
      prisma.$transaction.mockImplementation(async (fn: any) => {
        const mockTx = {
          referralBonus: {
            create: jest.fn().mockImplementation((args: any) => {
              capturedBonusAmount = args.data.bonusAmount;
              return { id: 'bonus-1' };
            }),
          },
          referral: { update: jest.fn().mockResolvedValue({}) },
        };
        return fn(mockTx);
      });

      await service.processBookingCompletion('booking-1', 'hirer-1', 20000000);

      expect(capturedBonusAmount!).toBe(500000); // Capped at 500k
    });

    it('should be idempotent — skip if bonus already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ referredById: 'ref-1' });
      prisma.referral.findUnique.mockResolvedValue({ id: 'ref-1', userId: 'referrer-1' });
      prisma.referralBonus.findUnique.mockResolvedValue({ id: 'existing-bonus' });

      await service.processBookingCompletion('booking-1', 'hirer-1', 5000000);

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('getBonusHistory', () => {
    it('should return empty if user has no referral record', async () => {
      prisma.referral.findUnique.mockResolvedValue(null);

      const result = await service.getBonusHistory('user-1');

      expect(result).toEqual({ bonuses: [], total: 0, page: 1, limit: 20 });
    });

    it('should return paginated bonus history', async () => {
      prisma.referral.findUnique.mockResolvedValue({ id: 'ref-1' });
      prisma.referralBonus.findMany.mockResolvedValue([
        {
          id: 'b1',
          bookingAmount: 5000000,
          bonusAmount: 250000,
          status: 'CREDITED',
          creditedAt: new Date(),
          createdAt: new Date(),
          referredUser: { fullName: 'Nguyen A', avatarUrl: null },
        },
      ]);
      prisma.referralBonus.count.mockResolvedValue(1);

      const result = await service.getBonusHistory('user-1');

      expect(result.bonuses).toHaveLength(1);
      expect(result.bonuses[0].bonusAmount).toBe(250000);
      expect(result.total).toBe(1);
    });
  });
});
```

**Step 2: Run tests**

Run: `cd society-backend && pnpm test -- --testPathPattern=referral.service.spec`

Expected: All tests pass.

**Step 3: Commit**

```bash
git add society-backend/src/modules/referral/referral.service.spec.ts
git commit -m "test: add unit tests for referral bonus processing"
```

---

## Task 14: End-to-End Verification

**Step 1: Build backend**

Run: `cd society-backend && pnpm build`

Expected: No TypeScript errors.

**Step 2: Run all backend tests**

Run: `cd society-backend && pnpm test`

Expected: All tests pass.

**Step 3: Type-check mobile**

Run: `cd society-mobile && pnpm type-check`

Expected: No TypeScript errors.

**Step 4: Lint both projects**

Run: `cd society-backend && pnpm lint && cd ../society-mobile && pnpm lint`

Expected: No lint errors (or only pre-existing ones).

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete referral/affiliate commission system for hirers and companions"
```
