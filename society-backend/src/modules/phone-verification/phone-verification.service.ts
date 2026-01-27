import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { CacheService } from '../cache/cache.service';
import { RateLimiterService } from '../security/services/rate-limiter.service';
import { SMS_PROVIDER, SmsProvider } from '../sms/sms-provider.interface';
import { PrismaService } from '../../prisma/prisma.service';

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
    @Inject(SMS_PROVIDER) private smsProvider: SmsProvider,
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

    // Send via configured SMS provider
    const smsResult = await this.smsProvider.sendOtp(normalizedPhone, otp);

    if (!smsResult.success) {
      // Clear stored OTP on send failure
      await this.cacheService.del(cacheKey);
      throw new BadRequestException(
        smsResult.error || 'Failed to send verification code',
      );
    }

    // Record the request for rate limiting
    await this.rateLimiter.recordOtpRequest(userId);
    await this.rateLimiter.recordOtpRequest(`phone:${normalizedPhone}`);

    this.logger.log(
      `OTP sent via ${this.smsProvider.name} to ${this.maskPhone(normalizedPhone)} for user ${userId}`,
    );

    return {
      success: true,
      message: 'Verification code sent',
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
        provider: this.smsProvider.name,
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
