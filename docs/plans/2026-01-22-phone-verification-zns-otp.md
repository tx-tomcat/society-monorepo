# Phone Verification with Zalo ZNS OTP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add mandatory phone verification for both hirers and companions using Zalo ZNS (Zalo Notification Service) OTP, with Vietnam-only restriction and comprehensive anti-abuse protection.

**Architecture:** Backend generates OTP, sends via Zalo ZNS API using pre-approved OTP template, stores hashed OTP with expiry in Redis. Mobile enters phone → receives Zalo notification → enters OTP → backend verifies. All verification logic server-side.

**Tech Stack:** Zalo ZNS API (https://business.openapi.zalo.me), NestJS, Redis for OTP storage, Prisma, existing RateLimiterService

**Cost:** Lower than SMS (~200-300 VND/message), only charged on successful delivery. Users must have Zalo app installed.

**Advantages over SMS:**
- Lower cost per message
- Higher delivery rate in Vietnam (95%+ of Vietnamese use Zalo)
- Rich notifications with branding
- Only pay for delivered messages

---

## Prerequisites

Before starting implementation:

1. **Register Zalo Official Account (OA)** at https://oa.zalo.me
2. **Create Zalo App** at https://developers.zalo.me
3. **Create ZNS OTP Template** and get it approved by Zalo team
4. **Get credentials:**
   - App ID
   - App Secret
   - OA ID (Official Account ID)
   - Refresh Token (for generating Access Tokens)

---

## Security Design

### Anti-Abuse Measures
1. **Vietnam-only phone validation** - Regex: `^(\+84|84|0)(3|5|7|8|9)[0-9]{8}$`
2. **Rate limiting** - 3 OTP requests per 5 minutes per user (reuse `OTP_REQUEST` limit)
3. **Progressive delays** - Reuse existing OTP verify delays (0→5→15→30→60s)
4. **Account lockout** - 15 min after 5 failed attempts
5. **One phone per user** - Unique constraint on `phoneHash`
6. **OTP expiry** - 5 minutes TTL in Redis
7. **OTP complexity** - 6-digit random code (100,000 combinations)
8. **Phone hash storage** - SHA256 hash for duplicate detection
9. **IP-based rate limiting** - Additional layer per IP address

### Cheating Prevention
- Cannot reuse same phone for multiple accounts
- Phone verification required before accessing main features
- OTP generated and verified server-side only (not client-trusted)
- Rate limits tied to both user ID and phone number

---

## Task 1: Backend - Add Zalo ZNS Configuration

**Files:**
- Modify: `society-backend/.env`
- Modify: `society-backend/.env.example`

**Step 1: Add Zalo ZNS environment variables**

Add to `society-backend/.env`:
```env
# Zalo ZNS Configuration
ZALO_APP_ID=your_app_id
ZALO_APP_SECRET=your_app_secret
ZALO_OA_ID=your_oa_id
ZALO_REFRESH_TOKEN=your_refresh_token
ZALO_OTP_TEMPLATE_ID=your_otp_template_id
```

**Step 2: Add to .env.example**

Add to `society-backend/.env.example`:
```env
# Zalo ZNS Configuration (https://developers.zalo.me)
ZALO_APP_ID=
ZALO_APP_SECRET=
ZALO_OA_ID=
ZALO_REFRESH_TOKEN=
ZALO_OTP_TEMPLATE_ID=
```

**Step 3: Commit**
```bash
git add .env.example
git commit -m "chore: add Zalo ZNS configuration variables"
```

---

## Task 2: Backend - Create Zalo ZNS Service

**Files:**
- Create: `society-backend/src/modules/zns/zns.module.ts`
- Create: `society-backend/src/modules/zns/zns.service.ts`
- Modify: `society-backend/src/app.module.ts`

**Step 1: Create ZNS service**

Create `society-backend/src/modules/zns/zns.service.ts`:
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../cache/cache.service';

interface ZnsResponse {
  error: number;
  message: string;
  data?: {
    msg_id: string;
  };
}

interface AccessTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

const ACCESS_TOKEN_CACHE_KEY = 'zalo:access_token';
const ACCESS_TOKEN_TTL = 3500; // ~58 minutes (token expires in 3600s)

@Injectable()
export class ZnsService {
  private readonly logger = new Logger(ZnsService.name);
  private readonly oauthUrl = 'https://oauth.zaloapp.com/v4/oa/access_token';
  private readonly apiUrl = 'https://business.openapi.zalo.me/message/template';

  private readonly appId: string;
  private readonly appSecret: string;
  private readonly refreshToken: string;
  private readonly templateId: string;

  constructor(
    private configService: ConfigService,
    private cacheService: CacheService,
  ) {
    this.appId = this.configService.get<string>('ZALO_APP_ID') || '';
    this.appSecret = this.configService.get<string>('ZALO_APP_SECRET') || '';
    this.refreshToken = this.configService.get<string>('ZALO_REFRESH_TOKEN') || '';
    this.templateId = this.configService.get<string>('ZALO_OTP_TEMPLATE_ID') || '';

    if (!this.appId || !this.appSecret || !this.refreshToken) {
      this.logger.warn('Zalo ZNS credentials not fully configured');
    }
  }

  /**
   * Get or refresh access token
   */
  private async getAccessToken(): Promise<string> {
    // Check cache first
    const cached = await this.cacheService.get<string>(ACCESS_TOKEN_CACHE_KEY);
    if (cached) {
      return cached;
    }

    // Refresh token
    try {
      const response = await fetch(this.oauthUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'secret_key': this.appSecret,
        },
        body: new URLSearchParams({
          refresh_token: this.refreshToken,
          app_id: this.appId,
          grant_type: 'refresh_token',
        }),
      });

      const result: AccessTokenResponse = await response.json();

      if (result.access_token) {
        // Cache the new token
        await this.cacheService.set(
          ACCESS_TOKEN_CACHE_KEY,
          result.access_token,
          ACCESS_TOKEN_TTL,
        );
        this.logger.log('Zalo access token refreshed successfully');
        return result.access_token;
      }

      throw new Error('Failed to get access token');
    } catch (error) {
      this.logger.error('Failed to refresh Zalo access token', error);
      throw error;
    }
  }

  /**
   * Send OTP via Zalo ZNS
   */
  async sendOtp(phoneNumber: string, otp: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    const normalizedPhone = this.normalizePhone(phoneNumber);

    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': accessToken,
        },
        body: JSON.stringify({
          phone: normalizedPhone,
          template_id: this.templateId,
          template_data: {
            otp: otp,
          },
          tracking_id: `otp_${Date.now()}`,
        }),
      });

      const result: ZnsResponse = await response.json();

      if (result.error === 0) {
        this.logger.log(
          `ZNS OTP sent successfully to ${this.maskPhone(normalizedPhone)}, msg_id: ${result.data?.msg_id}`,
        );
        return {
          success: true,
          messageId: result.data?.msg_id,
        };
      }

      this.logger.error(`ZNS error: ${result.error} - ${result.message}`);
      return {
        success: false,
        error: this.mapErrorCode(result.error),
      };
    } catch (error) {
      this.logger.error('ZNS request failed', error);
      return {
        success: false,
        error: 'Zalo notification service temporarily unavailable',
      };
    }
  }

  /**
   * Normalize Vietnam phone to format without + (Zalo format)
   * Zalo expects: 84xxxxxxxxx
   */
  private normalizePhone(phone: string): string {
    let normalized = phone.replace(/\s+/g, '');
    if (normalized.startsWith('+84')) {
      normalized = '84' + normalized.slice(3);
    } else if (normalized.startsWith('0')) {
      normalized = '84' + normalized.slice(1);
    }
    return normalized;
  }

  /**
   * Mask phone for logging
   */
  private maskPhone(phone: string): string {
    if (phone.length < 6) return '***';
    return phone.slice(0, 4) + '****' + phone.slice(-2);
  }

  /**
   * Map Zalo error codes to user-friendly messages
   */
  private mapErrorCode(code: number): string {
    const errors: Record<number, string> = {
      [-108]: 'Invalid phone number or user not on Zalo',
      [-124]: 'Authentication failed, please try again',
      [-125]: 'Invalid template',
      [-144]: 'Service quota exceeded, please try again later',
      [-201]: 'Invalid parameters',
      [-202]: 'Phone number not registered on Zalo',
      [-216]: 'ZNS template not approved',
    };
    return errors[code] || 'Failed to send notification';
  }

  /**
   * Check if a phone is registered on Zalo (optional feature)
   */
  async isPhoneOnZalo(phoneNumber: string): Promise<boolean> {
    // This would require Zalo's phone check API
    // For now, we assume all Vietnam phones might be on Zalo
    // and handle errors gracefully
    return true;
  }
}
```

**Step 2: Create ZNS module**

Create `society-backend/src/modules/zns/zns.module.ts`:
```typescript
import { Global, Module } from '@nestjs/common';
import { ZnsService } from './zns.service';

@Global()
@Module({
  providers: [ZnsService],
  exports: [ZnsService],
})
export class ZnsModule {}
```

**Step 3: Register module in app.module.ts**

Add to imports in `society-backend/src/app.module.ts`:
```typescript
import { ZnsModule } from './modules/zns/zns.module';

@Module({
  imports: [
    // ... existing imports
    ZnsModule,
  ],
})
```

**Step 4: Commit**
```bash
git add src/modules/zns/ src/app.module.ts
git commit -m "feat: add Zalo ZNS service for OTP delivery"
```

---

## Task 3: Backend - Create Phone Verification Module

**Files:**
- Create: `society-backend/src/modules/phone-verification/phone-verification.module.ts`
- Create: `society-backend/src/modules/phone-verification/phone-verification.controller.ts`
- Create: `society-backend/src/modules/phone-verification/phone-verification.service.ts`
- Create: `society-backend/src/modules/phone-verification/dto/phone-verification.dto.ts`

**Step 1: Create DTO with Vietnam phone validation**

Create `society-backend/src/modules/phone-verification/dto/phone-verification.dto.ts`:
```typescript
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

// Vietnam phone number format: +84, 84, or 0 followed by valid prefix
const VIETNAM_PHONE_REGEX = /^(\+84|84|0)(3|5|7|8|9)[0-9]{8}$/;

export class SendOtpDto {
  @IsString()
  @IsNotEmpty()
  @Matches(VIETNAM_PHONE_REGEX, {
    message: 'Phone number must be a valid Vietnam mobile number',
  })
  phoneNumber: string;
}

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  @Matches(VIETNAM_PHONE_REGEX, {
    message: 'Phone number must be a valid Vietnam mobile number',
  })
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP must contain only digits' })
  otp: string;
}

export class PhoneVerificationStatusDto {
  isVerified: boolean;
  phoneNumber: string | null;
  verifiedAt: Date | null;
}
```

**Step 2: Create service with OTP generation and verification**

Create `society-backend/src/modules/phone-verification/phone-verification.service.ts`:
```typescript
import { CacheService } from '@/modules/cache/cache.service';
import { PrismaService } from '@/prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { RateLimiterService } from '../security/services/rate-limiter.service';
import { ZnsService } from '../zns/zns.service';

const OTP_LENGTH = 6;
const OTP_TTL_SECONDS = 300; // 5 minutes
const OTP_CACHE_PREFIX = 'phone_otp:';

interface StoredOtp {
  otpHash: string;
  phoneNumber: string;
  attempts: number;
  createdAt: number;
}

@Injectable()
export class PhoneVerificationService {
  private readonly logger = new Logger(PhoneVerificationService.name);

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private rateLimiter: RateLimiterService,
    private znsService: ZnsService,
  ) {}

  /**
   * Normalize Vietnam phone to E.164 format (+84...)
   */
  normalizePhoneNumber(phone: string): string {
    let normalized = phone.replace(/\s+/g, '');
    if (normalized.startsWith('0')) {
      normalized = '+84' + normalized.slice(1);
    } else if (normalized.startsWith('84') && !normalized.startsWith('+')) {
      normalized = '+' + normalized;
    } else if (!normalized.startsWith('+84')) {
      normalized = '+84' + normalized;
    }
    return normalized;
  }

  /**
   * Hash phone number for duplicate detection
   */
  hashPhoneNumber(phone: string): string {
    const normalized = this.normalizePhoneNumber(phone);
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Generate secure 6-digit OTP
   */
  private generateOtp(): string {
    const buffer = crypto.randomBytes(4);
    const num = buffer.readUInt32BE(0) % 1000000;
    return num.toString().padStart(OTP_LENGTH, '0');
  }

  /**
   * Hash OTP for secure storage
   */
  private hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  /**
   * Check if phone is already verified by another user
   */
  async isPhoneAlreadyUsed(
    phoneNumber: string,
    excludeUserId?: string,
  ): Promise<boolean> {
    const phoneHash = this.hashPhoneNumber(phoneNumber);

    const existing = await this.prisma.user.findFirst({
      where: {
        phoneHash,
        isPhoneVerified: true,
        ...(excludeUserId && { id: { not: excludeUserId } }),
      },
    });

    return !!existing;
  }

  /**
   * Send OTP to phone number via Zalo ZNS
   */
  async sendOtp(
    userId: string,
    phoneNumber: string,
  ): Promise<{
    success: boolean;
    message: string;
    retryAfter?: number;
  }> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    // Check if phone already used by another account
    const isUsed = await this.isPhoneAlreadyUsed(phoneNumber, userId);
    if (isUsed) {
      throw new ConflictException(
        'This phone number is already associated with another account',
      );
    }

    // Check rate limit for OTP requests
    const rateLimit = await this.rateLimiter.checkOtpRequestLimit(userId);
    if (!rateLimit.allowed) {
      return {
        success: false,
        message: rateLimit.message,
        retryAfter: rateLimit.delaySeconds,
      };
    }

    // Also rate limit by phone number to prevent phone enumeration
    const phoneRateLimit = await this.rateLimiter.checkOtpRequestLimit(
      `phone:${normalizedPhone}`,
    );
    if (!phoneRateLimit.allowed) {
      return {
        success: false,
        message: 'Too many requests for this phone number',
        retryAfter: phoneRateLimit.delaySeconds,
      };
    }

    // Generate and store OTP
    const otp = this.generateOtp();
    const otpHash = this.hashOtp(otp);

    const cacheKey = `${OTP_CACHE_PREFIX}${userId}`;
    const storedOtp: StoredOtp = {
      otpHash,
      phoneNumber: normalizedPhone,
      attempts: 0,
      createdAt: Date.now(),
    };

    await this.cacheService.set(cacheKey, storedOtp, OTP_TTL_SECONDS);

    // Send via Zalo ZNS
    const znsResult = await this.znsService.sendOtp(normalizedPhone, otp);

    if (!znsResult.success) {
      // Clear stored OTP on send failure
      await this.cacheService.del(cacheKey);
      throw new BadRequestException(
        znsResult.error || 'Failed to send verification code',
      );
    }

    // Record the request for rate limiting
    await this.rateLimiter.recordOtpRequest(userId);
    await this.rateLimiter.recordOtpRequest(`phone:${normalizedPhone}`);

    this.logger.log(
      `OTP sent via Zalo ZNS to ${this.maskPhone(normalizedPhone)} for user ${userId}`,
    );

    return {
      success: true,
      message: 'Verification code sent via Zalo',
    };
  }

  /**
   * Verify OTP and mark phone as verified
   */
  async verifyOtp(
    userId: string,
    phoneNumber: string,
    otp: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    // Check verify rate limit
    const verifyLimit = await this.rateLimiter.checkOtpVerifyLimit(userId);
    if (!verifyLimit.allowed) {
      throw new BadRequestException(verifyLimit.message);
    }

    const cacheKey = `${OTP_CACHE_PREFIX}${userId}`;
    const storedOtp = await this.cacheService.get<StoredOtp>(cacheKey);

    if (!storedOtp) {
      await this.rateLimiter.recordOtpFailure(userId);
      throw new BadRequestException(
        'Verification code expired. Please request a new one.',
      );
    }

    // Verify phone matches
    if (storedOtp.phoneNumber !== normalizedPhone) {
      await this.rateLimiter.recordOtpFailure(userId);
      throw new BadRequestException('Phone number mismatch');
    }

    // Increment attempt counter
    storedOtp.attempts += 1;
    const remainingTtl = Math.max(
      0,
      OTP_TTL_SECONDS - Math.floor((Date.now() - storedOtp.createdAt) / 1000),
    );
    await this.cacheService.set(cacheKey, storedOtp, remainingTtl);

    // Check max attempts per OTP
    if (storedOtp.attempts > 5) {
      await this.cacheService.del(cacheKey);
      await this.rateLimiter.recordOtpFailure(userId);
      throw new BadRequestException(
        'Too many attempts. Please request a new code.',
      );
    }

    // Verify OTP
    const inputHash = this.hashOtp(otp);
    if (inputHash !== storedOtp.otpHash) {
      await this.rateLimiter.recordOtpFailure(userId);
      const attemptsLeft = 5 - storedOtp.attempts;
      throw new BadRequestException(
        `Invalid code. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`,
      );
    }

    // Check if phone already used (race condition check)
    const isUsed = await this.isPhoneAlreadyUsed(phoneNumber, userId);
    if (isUsed) {
      await this.cacheService.del(cacheKey);
      throw new ConflictException(
        'This phone number is already associated with another account',
      );
    }

    // Update user with verified phone
    const phoneHash = this.hashPhoneNumber(phoneNumber);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        phone: normalizedPhone,
        phoneHash,
        isPhoneVerified: true,
        phoneVerifiedAt: new Date(),
      },
    });

    // Create verification record
    await this.prisma.verification.create({
      data: {
        userId,
        type: 'phone',
        status: 'VERIFIED',
        provider: 'zalo_zns',
        verifiedAt: new Date(),
        metadata: {
          phoneNumber: normalizedPhone,
        },
      },
    });

    // Cleanup
    await this.cacheService.del(cacheKey);
    await this.rateLimiter.recordOtpSuccess(userId);

    this.logger.log(`Phone verified for user ${userId}`);

    return {
      success: true,
      message: 'Phone verified successfully',
    };
  }

  /**
   * Get user's phone verification status
   */
  async getStatus(userId: string): Promise<{
    isVerified: boolean;
    phoneNumber: string | null;
    verifiedAt: Date | null;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        phone: true,
        isPhoneVerified: true,
        phoneVerifiedAt: true,
      },
    });

    return {
      isVerified: user?.isPhoneVerified ?? false,
      phoneNumber: user?.phone ?? null,
      verifiedAt: user?.phoneVerifiedAt ?? null,
    };
  }

  /**
   * Mask phone for logging
   */
  private maskPhone(phone: string): string {
    if (phone.length < 6) return '***';
    return phone.slice(0, 4) + '****' + phone.slice(-2);
  }
}
```

**Step 3: Create controller**

Create `society-backend/src/modules/phone-verification/phone-verification.controller.ts`:
```typescript
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SendOtpDto, VerifyOtpDto } from './dto/phone-verification.dto';
import { PhoneVerificationService } from './phone-verification.service';

@Controller('phone-verification')
@UseGuards(JwtAuthGuard)
export class PhoneVerificationController {
  constructor(
    private phoneVerificationService: PhoneVerificationService,
  ) {}

  /**
   * Send OTP to phone number via Zalo ZNS
   */
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async sendOtp(
    @CurrentUser('id') userId: string,
    @Body() dto: SendOtpDto,
  ) {
    return this.phoneVerificationService.sendOtp(userId, dto.phoneNumber);
  }

  /**
   * Verify OTP code
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async verify(
    @CurrentUser('id') userId: string,
    @Body() dto: VerifyOtpDto,
  ) {
    return this.phoneVerificationService.verifyOtp(
      userId,
      dto.phoneNumber,
      dto.otp,
    );
  }

  /**
   * Get current verification status
   */
  @Get('status')
  async getStatus(@CurrentUser('id') userId: string) {
    return this.phoneVerificationService.getStatus(userId);
  }
}
```

**Step 4: Create module**

Create `society-backend/src/modules/phone-verification/phone-verification.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { PhoneVerificationController } from './phone-verification.controller';
import { PhoneVerificationService } from './phone-verification.service';

@Module({
  controllers: [PhoneVerificationController],
  providers: [PhoneVerificationService],
  exports: [PhoneVerificationService],
})
export class PhoneVerificationModule {}
```

**Step 5: Register module in app.module.ts**

Add to imports in `society-backend/src/app.module.ts`:
```typescript
import { PhoneVerificationModule } from './modules/phone-verification/phone-verification.module';

@Module({
  imports: [
    // ... existing imports
    PhoneVerificationModule,
  ],
})
```

**Step 6: Commit**
```bash
git add src/modules/phone-verification/ src/app.module.ts
git commit -m "feat: add phone verification module with Zalo ZNS OTP"
```

---

## Task 4: Backend - Update Prisma Schema for Phone Verification

**Files:**
- Modify: `society-backend/prisma/schema.prisma`

**Step 1: Add phone verification fields to User model**

Add after `phone` field (around line 189):
```prisma
model User {
  // ... existing fields
  phone            String?
  phoneHash        String?   @unique @map("phone_hash") // For duplicate detection
  isPhoneVerified  Boolean   @default(false) @map("is_phone_verified")
  phoneVerifiedAt  DateTime? @map("phone_verified_at")
  // ... rest of model
}
```

**Step 2: Add index for phone lookup**

Add to User model indexes:
```prisma
@@index([phoneHash])
```

**Step 3: Create and run migration**

Run:
```bash
cd society-backend
pnpm prisma migrate dev --name add_phone_verification_fields
```

Expected: Migration creates new columns

**Step 4: Commit**
```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add phone verification fields to User model"
```

---

## Task 5: Mobile - Create Phone Verification Service

**Files:**
- Create: `society-mobile/src/lib/api/services/phone-verification.service.ts`
- Modify: `society-mobile/src/lib/api/services/index.ts`

**Step 1: Create phone verification API service**

Create `society-mobile/src/lib/api/services/phone-verification.service.ts`:
```typescript
import { apiClient } from '../client';

export interface SendOtpResponse {
  success: boolean;
  message: string;
  retryAfter?: number;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
}

export interface PhoneVerificationStatus {
  isVerified: boolean;
  phoneNumber: string | null;
  verifiedAt: string | null;
}

export const phoneVerificationService = {
  /**
   * Send OTP to phone number via Zalo ZNS
   */
  async sendOtp(phoneNumber: string): Promise<SendOtpResponse> {
    return apiClient.post('/phone-verification/send-otp', { phoneNumber });
  },

  /**
   * Verify OTP code
   */
  async verifyOtp(
    phoneNumber: string,
    otp: string,
  ): Promise<VerifyOtpResponse> {
    return apiClient.post('/phone-verification/verify', {
      phoneNumber,
      otp,
    });
  },

  /**
   * Get current verification status
   */
  async getStatus(): Promise<PhoneVerificationStatus> {
    return apiClient.get('/phone-verification/status');
  },
};
```

**Step 2: Export from index**

Add to `society-mobile/src/lib/api/services/index.ts`:
```typescript
export * from './phone-verification.service';
```

**Step 3: Commit**
```bash
git add src/lib/api/services/phone-verification.service.ts src/lib/api/services/index.ts
git commit -m "feat: add phone verification API service"
```

---

## Task 6: Mobile - Create Phone Verification Hook

**Files:**
- Create: `society-mobile/src/lib/hooks/use-phone-verification.ts`
- Modify: `society-mobile/src/lib/hooks/index.tsx`

**Step 1: Create phone verification hook**

Create `society-mobile/src/lib/hooks/use-phone-verification.ts`:
```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';

import { phoneVerificationService } from '../api/services/phone-verification.service';

// Vietnam phone regex
const VIETNAM_PHONE_REGEX = /^(\+84|84|0)(3|5|7|8|9)[0-9]{8}$/;

/**
 * Normalize Vietnam phone to E.164 format
 */
export function normalizeVietnamPhone(phone: string): string {
  let normalized = phone.replace(/\s+/g, '');
  if (normalized.startsWith('0')) {
    normalized = '+84' + normalized.slice(1);
  } else if (normalized.startsWith('84') && !normalized.startsWith('+')) {
    normalized = '+' + normalized;
  } else if (!normalized.startsWith('+84')) {
    normalized = '+84' + normalized;
  }
  return normalized;
}

/**
 * Validate Vietnam phone number
 */
export function isValidVietnamPhone(phone: string): boolean {
  return VIETNAM_PHONE_REGEX.test(phone);
}

/**
 * Hook for phone verification status
 */
export function usePhoneVerificationStatus() {
  return useQuery({
    queryKey: ['phone-verification', 'status'],
    queryFn: () => phoneVerificationService.getStatus(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for phone verification flow
 */
export function usePhoneVerification() {
  const queryClient = useQueryClient();
  const [verificationState, setVerificationState] = React.useState<
    'idle' | 'sending' | 'code_sent' | 'verifying' | 'success' | 'error'
  >('idle');
  const [error, setError] = React.useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = React.useState<string>('');
  const [retryAfter, setRetryAfter] = React.useState<number>(0);

  // Countdown timer for retry
  React.useEffect(() => {
    if (retryAfter <= 0) return;

    const timer = setInterval(() => {
      setRetryAfter((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [retryAfter]);

  // Send OTP mutation
  const sendOtpMutation = useMutation({
    mutationFn: (phone: string) => phoneVerificationService.sendOtp(phone),
  });

  // Verify OTP mutation
  const verifyOtpMutation = useMutation({
    mutationFn: ({ phone, otp }: { phone: string; otp: string }) =>
      phoneVerificationService.verifyOtp(phone, otp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phone-verification'] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
  });

  /**
   * Step 1: Send OTP code via Zalo
   */
  const sendCode = React.useCallback(
    async (phone: string) => {
      try {
        setError(null);
        setVerificationState('sending');

        // Validate phone format
        if (!isValidVietnamPhone(phone)) {
          throw new Error('Invalid Vietnam phone number');
        }

        const normalizedPhone = normalizeVietnamPhone(phone);
        setPhoneNumber(normalizedPhone);

        const result = await sendOtpMutation.mutateAsync(normalizedPhone);

        if (result.success) {
          setVerificationState('code_sent');
          return { success: true };
        }

        // Handle rate limiting
        if (result.retryAfter) {
          setRetryAfter(result.retryAfter);
        }

        throw new Error(result.message);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to send code';
        setError(message);
        setVerificationState('error');
        return { success: false, error: message };
      }
    },
    [sendOtpMutation],
  );

  /**
   * Step 2: Verify the OTP code
   */
  const verifyCode = React.useCallback(
    async (otp: string) => {
      if (!phoneNumber) {
        setError('No verification in progress');
        return { success: false, error: 'No verification in progress' };
      }

      try {
        setError(null);
        setVerificationState('verifying');

        const result = await verifyOtpMutation.mutateAsync({
          phone: phoneNumber,
          otp,
        });

        if (result.success) {
          setVerificationState('success');
          return { success: true };
        }

        throw new Error(result.message);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid code';
        setError(message);
        setVerificationState('error');
        return { success: false, error: message };
      }
    },
    [phoneNumber, verifyOtpMutation],
  );

  /**
   * Reset state
   */
  const reset = React.useCallback(() => {
    setVerificationState('idle');
    setError(null);
    setPhoneNumber('');
    setRetryAfter(0);
  }, []);

  return {
    // State
    verificationState,
    error,
    phoneNumber,
    retryAfter,
    isCodeSent: verificationState === 'code_sent',
    isSending: verificationState === 'sending',
    isVerifying: verificationState === 'verifying',
    isSuccess: verificationState === 'success',
    canResend: retryAfter === 0,

    // Actions
    sendCode,
    verifyCode,
    reset,

    // Mutation states
    isSendingCode: sendOtpMutation.isPending,
    isVerifyingCode: verifyOtpMutation.isPending,
  };
}
```

**Step 2: Export from index**

Add to `society-mobile/src/lib/hooks/index.tsx`:
```typescript
export * from './use-phone-verification';
```

**Step 3: Commit**
```bash
git add src/lib/hooks/use-phone-verification.ts src/lib/hooks/index.tsx
git commit -m "feat: add phone verification hook"
```

---

## Task 7: Mobile - Create Phone Verification Screen

**Files:**
- Create: `society-mobile/src/app/phone-verification/index.tsx`

**Step 1: Create phone verification screen**

> **Note:** Use @frontend-design skill for premium UI quality.

Create `society-mobile/src/app/phone-verification/index.tsx`:
```typescript
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  TextInput as RNTextInput,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';

import {
  Button,
  colors,
  FocusAwareStatusBar,
  Input,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { ArrowLeft, Check, Shield } from '@/components/ui/icons';
import {
  isValidVietnamPhone,
  usePhoneVerification,
} from '@/lib/hooks/use-phone-verification';

const OTP_LENGTH = 6;

// Zalo logo for branding
const ZALO_LOGO = require('@/assets/images/zalo-logo.png');

export default function PhoneVerificationScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    verificationState,
    error,
    isCodeSent,
    isSending,
    isVerifying,
    isSuccess,
    retryAfter,
    canResend,
    sendCode,
    verifyCode,
    reset,
  } = usePhoneVerification();

  // Phone input state
  const [phone, setPhone] = React.useState('');
  const [phoneError, setPhoneError] = React.useState<string | null>(null);

  // OTP input state
  const [otp, setOtp] = React.useState<string[]>(Array(OTP_LENGTH).fill(''));
  const otpInputRefs = React.useRef<(RNTextInput | null)[]>([]);

  // Validate phone on change
  const handlePhoneChange = React.useCallback(
    (value: string) => {
      // Only allow digits and + symbol
      const cleaned = value.replace(/[^\d+]/g, '');
      setPhone(cleaned);

      if (cleaned.length > 0 && !isValidVietnamPhone(cleaned)) {
        setPhoneError(t('phone_verification.invalid_phone'));
      } else {
        setPhoneError(null);
      }
    },
    [t],
  );

  // Send verification code
  const handleSendCode = React.useCallback(async () => {
    if (!isValidVietnamPhone(phone)) {
      setPhoneError(t('phone_verification.invalid_phone'));
      return;
    }

    const result = await sendCode(phone);
    if (!result.success && result.error) {
      Alert.alert(t('common.error'), result.error);
    }
  }, [phone, sendCode, t]);

  // Handle OTP input
  const handleOtpChange = React.useCallback(
    (value: string, index: number) => {
      // Only allow single digit
      const digit = value.replace(/\D/g, '').slice(-1);

      const newOtp = [...otp];
      newOtp[index] = digit;
      setOtp(newOtp);

      // Auto-focus next input
      if (digit && index < OTP_LENGTH - 1) {
        otpInputRefs.current[index + 1]?.focus();
      }

      // Auto-submit when complete
      if (digit && index === OTP_LENGTH - 1) {
        const code = newOtp.join('');
        if (code.length === OTP_LENGTH) {
          verifyCode(code);
        }
      }
    },
    [otp, verifyCode],
  );

  // Handle backspace
  const handleOtpKeyPress = React.useCallback(
    (key: string, index: number) => {
      if (key === 'Backspace' && !otp[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    },
    [otp],
  );

  // Handle verification
  const handleVerify = React.useCallback(async () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      Alert.alert(t('common.error'), t('phone_verification.enter_code'));
      return;
    }

    const result = await verifyCode(code);
    if (result.success) {
      // Navigate back or to next screen
      router.back();
    } else if (result.error) {
      Alert.alert(t('common.error'), result.error);
      // Clear OTP on error
      setOtp(Array(OTP_LENGTH).fill(''));
      otpInputRefs.current[0]?.focus();
    }
  }, [otp, verifyCode, router, t]);

  // Handle resend
  const handleResend = React.useCallback(() => {
    if (!canResend) return;
    setOtp(Array(OTP_LENGTH).fill(''));
    sendCode(phone);
  }, [canResend, phone, sendCode]);

  // Success state
  if (isSuccess) {
    return (
      <View className="flex-1 items-center justify-center bg-warmwhite px-6">
        <FocusAwareStatusBar />
        <MotiView
          from={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-teal-100"
        >
          <Check color={colors.teal[500]} width={48} height={48} />
        </MotiView>
        <Text className="mb-2 text-center text-2xl font-bold text-midnight">
          {t('phone_verification.success_title')}
        </Text>
        <Text className="mb-8 text-center text-base text-text-secondary">
          {t('phone_verification.success_message')}
        </Text>
        <Button
          label={t('common.continue')}
          onPress={() => router.back()}
          variant="default"
          size="lg"
          fullWidth
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-4 px-4 py-3">
          <Pressable onPress={() => (isCodeSent ? reset() : router.back())}>
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>
          <Text style={styles.headerTitle} className="flex-1 text-xl text-black">
            {t('phone_verification.title')}
          </Text>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <View className="flex-1 px-6 pt-8">
          {/* Zalo Badge */}
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            className="mb-8 flex-row items-center gap-3 rounded-xl bg-blue-50 p-4"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
              <Image source={ZALO_LOGO} style={{ width: 28, height: 28 }} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-blue-600">
                {t('phone_verification.zalo_notice_title')}
              </Text>
              <Text className="text-xs text-blue-500">
                {t('phone_verification.zalo_notice_desc')}
              </Text>
            </View>
          </MotiView>

          {!isCodeSent ? (
            // Phone Input Screen
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
            >
              <Text className="mb-2 text-lg font-semibold text-midnight">
                {t('phone_verification.enter_phone')}
              </Text>
              <Text className="mb-6 text-sm text-text-secondary">
                {t('phone_verification.phone_description_zalo')}
              </Text>

              <View className="mb-6 flex-row items-center">
                <View className="mr-3 rounded-xl border border-border-light bg-white px-4 py-4">
                  <Text className="text-lg font-semibold text-midnight">
                    +84
                  </Text>
                </View>
                <View className="flex-1">
                  <Input
                    placeholder="912 345 678"
                    value={phone.replace(/^\+?84/, '')}
                    onChangeText={(v) => handlePhoneChange('+84' + v)}
                    keyboardType="phone-pad"
                    error={phoneError || undefined}
                    autoFocus
                  />
                </View>
              </View>

              {error && (
                <View className="mb-4 rounded-lg bg-red-50 p-3">
                  <Text className="text-sm text-red-500">{error}</Text>
                </View>
              )}

              <Button
                label={t('phone_verification.send_code_zalo')}
                onPress={handleSendCode}
                disabled={!isValidVietnamPhone(phone) || isSending}
                loading={isSending}
                variant="default"
                size="lg"
                fullWidth
              />
            </MotiView>
          ) : (
            // OTP Input Screen
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
            >
              <Text className="mb-2 text-lg font-semibold text-midnight">
                {t('phone_verification.enter_code')}
              </Text>
              <Text className="mb-6 text-sm text-text-secondary">
                {t('phone_verification.code_sent_zalo', { phone })}
              </Text>

              {/* OTP Input Boxes */}
              <View className="mb-6 flex-row justify-between">
                {Array(OTP_LENGTH)
                  .fill(0)
                  .map((_, index) => (
                    <RNTextInput
                      key={index}
                      ref={(ref) => (otpInputRefs.current[index] = ref)}
                      style={styles.otpInput}
                      className={`h-14 w-12 rounded-xl border-2 bg-white text-center text-2xl font-bold ${
                        otp[index] ? 'border-rose-400' : 'border-border-light'
                      }`}
                      value={otp[index]}
                      onChangeText={(v) => handleOtpChange(v, index)}
                      onKeyPress={({ nativeEvent }) =>
                        handleOtpKeyPress(nativeEvent.key, index)
                      }
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                    />
                  ))}
              </View>

              {error && (
                <View className="mb-4 rounded-lg bg-red-50 p-3">
                  <Text className="text-sm text-red-500">{error}</Text>
                </View>
              )}

              <Button
                label={t('phone_verification.verify')}
                onPress={handleVerify}
                disabled={otp.join('').length !== OTP_LENGTH || isVerifying}
                loading={isVerifying}
                variant="default"
                size="lg"
                fullWidth
              />

              {/* Resend Code */}
              <Pressable
                onPress={handleResend}
                disabled={!canResend}
                className="mt-4"
              >
                <Text
                  className={`text-center text-sm ${
                    canResend ? 'text-rose-400' : 'text-text-tertiary'
                  }`}
                >
                  {canResend
                    ? t('phone_verification.resend_code')
                    : t('phone_verification.resend_in', { seconds: retryAfter })}
                </Text>
              </Pressable>
            </MotiView>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontFamily: 'Urbanist_700Bold',
  },
  otpInput: {
    fontFamily: 'Urbanist_700Bold',
    color: colors.midnight.DEFAULT,
  },
});
```

**Step 2: Add Zalo logo asset**

Download Zalo logo and place at `society-mobile/src/assets/images/zalo-logo.png`

**Step 3: Commit**
```bash
git add src/app/phone-verification/ src/assets/images/zalo-logo.png
git commit -m "feat: add phone verification screen with Zalo ZNS OTP"
```

---

## Task 8: Mobile - Add Translations

**Files:**
- Modify: `society-mobile/src/translations/en.json`
- Modify: `society-mobile/src/translations/vi.json`

**Step 1: Add English translations**

Add to `society-mobile/src/translations/en.json`:
```json
{
  "phone_verification": {
    "title": "Verify Phone",
    "enter_phone": "Enter your phone number",
    "phone_description_zalo": "We'll send a verification code via Zalo to confirm your identity",
    "invalid_phone": "Please enter a valid Vietnam phone number",
    "send_code_zalo": "Send Code via Zalo",
    "enter_code": "Enter verification code",
    "code_sent_zalo": "We sent a 6-digit code to your Zalo at {{phone}}",
    "verify": "Verify",
    "resend_code": "Didn't receive code? Resend",
    "resend_in": "Resend code in {{seconds}}s",
    "success_title": "Phone Verified!",
    "success_message": "Your phone number has been verified successfully",
    "zalo_notice_title": "Verification via Zalo",
    "zalo_notice_desc": "You'll receive the code in your Zalo app"
  }
}
```

**Step 2: Add Vietnamese translations**

Add to `society-mobile/src/translations/vi.json`:
```json
{
  "phone_verification": {
    "title": "Xác minh số điện thoại",
    "enter_phone": "Nhập số điện thoại của bạn",
    "phone_description_zalo": "Chúng tôi sẽ gửi mã xác minh qua Zalo để xác nhận danh tính của bạn",
    "invalid_phone": "Vui lòng nhập số điện thoại Việt Nam hợp lệ",
    "send_code_zalo": "Gửi mã qua Zalo",
    "enter_code": "Nhập mã xác minh",
    "code_sent_zalo": "Chúng tôi đã gửi mã 6 chữ số đến Zalo của bạn tại {{phone}}",
    "verify": "Xác minh",
    "resend_code": "Không nhận được mã? Gửi lại",
    "resend_in": "Gửi lại mã sau {{seconds}}s",
    "success_title": "Đã xác minh!",
    "success_message": "Số điện thoại của bạn đã được xác minh thành công",
    "zalo_notice_title": "Xác minh qua Zalo",
    "zalo_notice_desc": "Bạn sẽ nhận được mã trong ứng dụng Zalo"
  }
}
```

**Step 3: Commit**
```bash
git add src/translations/
git commit -m "feat: add phone verification translations (en/vi)"
```

---

## Task 9: Mobile - Add Phone Verification Gate to Onboarding

**Files:**
- Modify: `society-mobile/src/app/hirer/onboarding/profile.tsx`
- Modify: `society-mobile/src/app/companion/onboard/create-profile.tsx`

**Step 1: Add phone verification check to hirer onboarding**

Modify `society-mobile/src/app/hirer/onboarding/profile.tsx`:

Add import:
```typescript
import { usePhoneVerificationStatus } from '@/lib/hooks/use-phone-verification';
```

Add after other hooks:
```typescript
const { data: phoneStatus } = usePhoneVerificationStatus();
```

Modify `handleContinue` to check phone verification:
```typescript
const handleContinue = React.useCallback(async () => {
  // ... existing validation

  // Check phone verification
  if (!phoneStatus?.isVerified) {
    router.push('/phone-verification' as Href);
    return;
  }

  // ... rest of handler
}, [/* ... add phoneStatus to deps */]);
```

**Step 2: Similar changes to companion onboarding**

Apply same pattern to `society-mobile/src/app/companion/onboard/create-profile.tsx`.

**Step 3: Commit**
```bash
git add src/app/hirer/onboarding/profile.tsx src/app/companion/onboard/create-profile.tsx
git commit -m "feat: require phone verification during onboarding"
```

---

## Task 10: Backend - Add Phone Verification Guard

**Files:**
- Create: `society-backend/src/modules/phone-verification/guards/phone-verified.guard.ts`
- Create: `society-backend/src/modules/phone-verification/decorators/require-phone-verification.decorator.ts`

**Step 1: Create guard for protected routes**

Create `society-backend/src/modules/phone-verification/guards/phone-verified.guard.ts`:
```typescript
import { PrismaService } from '@/prisma/prisma.service';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const REQUIRE_PHONE_VERIFICATION_KEY = 'requirePhoneVerification';

@Injectable()
export class PhoneVerifiedGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requireVerification = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_PHONE_VERIFICATION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requireVerification) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isPhoneVerified: true },
    });

    if (!user?.isPhoneVerified) {
      throw new UnauthorizedException('Phone verification required');
    }

    return true;
  }
}
```

**Step 2: Create decorator**

Create `society-backend/src/modules/phone-verification/decorators/require-phone-verification.decorator.ts`:
```typescript
import { SetMetadata } from '@nestjs/common';
import { REQUIRE_PHONE_VERIFICATION_KEY } from '../guards/phone-verified.guard';

export const RequirePhoneVerification = () =>
  SetMetadata(REQUIRE_PHONE_VERIFICATION_KEY, true);
```

**Step 3: Commit**
```bash
git add src/modules/phone-verification/guards/ src/modules/phone-verification/decorators/
git commit -m "feat: add phone verification guard for protected routes"
```

---

## Task 11: Create Zalo ZNS OTP Template

**This task requires manual action in Zalo Developer Console**

**Step 1: Login to Zalo for Developers**

Go to https://developers.zalo.me and login with your Zalo account.

**Step 2: Navigate to ZNS Template Management**

Go to: ZNS → Template Management → Create Template

**Step 3: Create OTP Template**

Template details:
- **Template Type:** OTP/Authentication
- **Template Name:** Society OTP Verification
- **Content (Vietnamese):**
```
Mã xác minh của bạn là: {otp}

Mã có hiệu lực trong 5 phút. Không chia sẻ mã này với bất kỳ ai.
```

- **Parameters:**
  - `otp` - 6-digit verification code

**Step 4: Submit for approval**

Wait for Zalo team to approve the template (usually 1-3 business days).

**Step 5: Copy Template ID**

Once approved, copy the template ID and add to `.env`:
```env
ZALO_OTP_TEMPLATE_ID=your_approved_template_id
```

---

## Task 12: Testing - Manual Verification

**Step 1: Start backend**
```bash
cd society-backend && pnpm dev
```

**Step 2: Start mobile app**
```bash
cd society-mobile && pnpm ios
```

**Step 3: Test scenarios**

1. **Valid Vietnam phone** - Enter `0912345678`, should send Zalo notification
2. **Invalid phone** - Enter `1234567890`, should show error
3. **Non-Zalo user** - Test with phone not registered on Zalo, should show error
4. **Rate limiting** - Request 4 codes quickly, should block
5. **Wrong OTP** - Enter wrong code 5 times, should lock account
6. **Phone reuse** - Try same phone on different account, should fail
7. **Success flow** - Complete verification, check database

**Step 4: Verify database**
```sql
SELECT id, phone, phone_hash, is_phone_verified, phone_verified_at
FROM users WHERE phone IS NOT NULL;
```

**Step 5: Check Zalo ZNS delivery**

Check Zalo Developer Console → ZNS → Message History for delivery status.

---

## Summary

This implementation provides:

1. **Vietnam-only restriction** - Regex validation on both client and server
2. **Rate limiting** - 3 OTP requests per 5 min per user AND per phone
3. **Account lockout** - 15 min lockout after 5 failed attempts
4. **Phone uniqueness** - SHA256 hash-based duplicate detection
5. **OTP security** - 6-digit code, 5-min expiry, hashed storage
6. **Server-side verification** - All OTP logic server-side (not client-trusted)
7. **Premium UI** - Animated transitions, clear error states, bilingual support
8. **Cost-effective** - Lower cost than SMS via Zalo ZNS

**Security layers:**
- Client validation (immediate feedback)
- Backend rate limiting per user (abuse prevention)
- Backend rate limiting per phone (enumeration prevention)
- OTP expiry (5 min TTL)
- Max attempts per OTP (5)
- Database constraints (uniqueness enforcement)

**Zalo ZNS Setup:**
1. Register Zalo Official Account at https://oa.zalo.me
2. Create Zalo App at https://developers.zalo.me
3. Create and get approval for OTP template
4. Get App ID, App Secret, Refresh Token
5. Add credentials to `.env`

**Limitations:**
- User must have Zalo app installed
- Template must be pre-approved by Zalo
- Requires Zalo Official Account (business registration)

**Sources:**
- [Zalo Developers](https://developers.zalo.me/docs/zalo-notification-service/gui-tin-zns/gui-zns)
- [Zalo ZNS API - Infobip](https://www.infobip.com/docs/zalo)
- [trungdv/zalo-otp Package](https://packagist.org/packages/trungdv/zalo-otp)
- [8x8 ZNS Developer Portal](https://developer.8x8.com/connect/docs/usage-samples-zns/)
