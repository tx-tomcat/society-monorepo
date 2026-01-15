import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../../cache/cache.service';
import { RateLimitType } from '../dto/security.dto';
import { RateLimitStatus } from '../interfaces/security.interface';

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

interface RateLimitData {
  count: number;
  expiresAt: number;
}

const DEFAULT_LIMITS: Record<RateLimitType, RateLimitConfig> = {
  [RateLimitType.LOGIN]: { maxRequests: 5, windowSeconds: 300 }, // 5 per 5 min
  [RateLimitType.API]: { maxRequests: 100, windowSeconds: 60 }, // 100 per min
  [RateLimitType.MESSAGE]: { maxRequests: 50, windowSeconds: 60 }, // 50 per min
  [RateLimitType.MATCH]: { maxRequests: 100, windowSeconds: 3600 }, // 100 per hour
  [RateLimitType.PAYMENT]: { maxRequests: 10, windowSeconds: 3600 }, // 10 per hour
  [RateLimitType.UPLOAD]: { maxRequests: 20, windowSeconds: 3600 }, // 20 per hour
  [RateLimitType.OTP_REQUEST]: { maxRequests: 3, windowSeconds: 300 }, // 3 per 5 min (stricter)
  [RateLimitType.OTP_VERIFY]: { maxRequests: 5, windowSeconds: 300 }, // 5 attempts per 5 min
};

// Progressive delay multipliers for failed OTP attempts
const OTP_PROGRESSIVE_DELAYS: Record<number, number> = {
  1: 0,      // No delay on first attempt
  2: 5,      // 5 second delay after 1 failure
  3: 15,     // 15 second delay after 2 failures
  4: 30,     // 30 second delay after 3 failures
  5: 60,     // 60 second delay after 4 failures
};

interface OtpFailureData {
  failureCount: number;
  lastAttemptAt: number;
  lockedUntil: number | null;
}

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  private limits: Map<RateLimitType, RateLimitConfig> = new Map();

  constructor(private readonly cacheService: CacheService) {
    // Initialize with defaults
    Object.entries(DEFAULT_LIMITS).forEach(([type, config]) => {
      this.limits.set(type as RateLimitType, config);
    });
  }

  async checkLimit(
    identifier: string, // userId or IP
    type: RateLimitType,
  ): Promise<RateLimitStatus> {
    const config = this.limits.get(type) || DEFAULT_LIMITS[type];
    const key = `ratelimit:${type}:${identifier}`;

    const data = await this.cacheService.get<RateLimitData>(key);
    const count = data?.count || 0;
    const expiresAt = data?.expiresAt || (Date.now() + config.windowSeconds * 1000);

    return {
      type,
      remaining: Math.max(0, config.maxRequests - count),
      limit: config.maxRequests,
      resetAt: new Date(expiresAt),
      blocked: count >= config.maxRequests,
    };
  }

  async increment(identifier: string, type: RateLimitType): Promise<RateLimitStatus> {
    const config = this.limits.get(type) || DEFAULT_LIMITS[type];
    const key = `ratelimit:${type}:${identifier}`;

    const data = await this.cacheService.get<RateLimitData>(key);
    const now = Date.now();

    let count: number;
    let expiresAt: number;

    if (!data || data.expiresAt < now) {
      // Start new window
      count = 1;
      expiresAt = now + config.windowSeconds * 1000;
    } else {
      // Increment existing window
      count = data.count + 1;
      expiresAt = data.expiresAt;
    }

    await this.cacheService.set(key, { count, expiresAt }, config.windowSeconds);

    const status: RateLimitStatus = {
      type,
      remaining: Math.max(0, config.maxRequests - count),
      limit: config.maxRequests,
      resetAt: new Date(expiresAt),
      blocked: count >= config.maxRequests,
    };

    if (status.blocked) {
      this.logger.warn(`Rate limit exceeded: ${type} for ${identifier}`);
    }

    return status;
  }

  async reset(identifier: string, type: RateLimitType): Promise<void> {
    const key = `ratelimit:${type}:${identifier}`;
    await this.cacheService.del(key);
  }

  async updateLimit(type: RateLimitType, config: RateLimitConfig): Promise<void> {
    this.limits.set(type, config);
    this.logger.log(`Rate limit updated: ${type} - ${config.maxRequests}/${config.windowSeconds}s`);
  }

  async getLimits(): Promise<Record<string, RateLimitConfig>> {
    const result: Record<string, RateLimitConfig> = {};
    this.limits.forEach((config, type) => {
      result[type] = config;
    });
    return result;
  }

  // Sliding window rate limiter for more precise control
  async checkSlidingWindow(
    identifier: string,
    type: RateLimitType,
    windowMs: number,
    maxRequests: number,
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const key = `slidingwindow:${type}:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get timestamps of recent requests
    const timestamps = await this.cacheService.get<number[]>(key);
    let requests: number[] = timestamps || [];

    // Filter to only include requests within the window
    requests = requests.filter((ts) => ts > windowStart);

    const allowed = requests.length < maxRequests;
    const remaining = Math.max(0, maxRequests - requests.length);

    if (allowed) {
      requests.push(now);
      await this.cacheService.set(key, requests, Math.ceil(windowMs / 1000));
    }

    // Calculate reset time
    const oldestRequest = requests.length > 0 ? Math.min(...requests) : now;
    const resetAt = new Date(oldestRequest + windowMs);

    return { allowed, remaining, resetAt };
  }

  // ============================================
  // OTP-SPECIFIC RATE LIMITING
  // ============================================

  /**
   * Check if OTP request is allowed with progressive delays
   * Returns whether request is allowed and any required delay
   */
  async checkOtpRequestLimit(
    identifier: string, // email or phone
  ): Promise<{
    allowed: boolean;
    remaining: number;
    delaySeconds: number;
    resetAt: Date;
    message: string;
  }> {
    const status = await this.checkLimit(identifier, RateLimitType.OTP_REQUEST);

    if (status.blocked) {
      return {
        allowed: false,
        remaining: 0,
        delaySeconds: Math.ceil((status.resetAt.getTime() - Date.now()) / 1000),
        resetAt: status.resetAt,
        message: `Too many OTP requests. Please wait ${Math.ceil((status.resetAt.getTime() - Date.now()) / 1000)} seconds.`,
      };
    }

    return {
      allowed: true,
      remaining: status.remaining,
      delaySeconds: 0,
      resetAt: status.resetAt,
      message: 'OTP request allowed',
    };
  }

  /**
   * Record OTP request and check rate limit
   */
  async recordOtpRequest(identifier: string): Promise<RateLimitStatus> {
    return this.increment(identifier, RateLimitType.OTP_REQUEST);
  }

  /**
   * Check OTP verification attempt with progressive delay
   */
  async checkOtpVerifyLimit(
    identifier: string,
  ): Promise<{
    allowed: boolean;
    remaining: number;
    delaySeconds: number;
    resetAt: Date;
    lockedUntil: Date | null;
    message: string;
  }> {
    const failureKey = `otpfailure:${identifier}`;
    const failureData = await this.cacheService.get<OtpFailureData>(failureKey);
    const now = Date.now();

    // Check if account is temporarily locked
    if (failureData?.lockedUntil && failureData.lockedUntil > now) {
      const lockoutRemaining = Math.ceil((failureData.lockedUntil - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        delaySeconds: lockoutRemaining,
        resetAt: new Date(failureData.lockedUntil),
        lockedUntil: new Date(failureData.lockedUntil),
        message: `Account temporarily locked due to too many failed attempts. Try again in ${lockoutRemaining} seconds.`,
      };
    }

    // Check standard rate limit
    const status = await this.checkLimit(identifier, RateLimitType.OTP_VERIFY);

    if (status.blocked) {
      return {
        allowed: false,
        remaining: 0,
        delaySeconds: Math.ceil((status.resetAt.getTime() - now) / 1000),
        resetAt: status.resetAt,
        lockedUntil: null,
        message: `Too many verification attempts. Please wait ${Math.ceil((status.resetAt.getTime() - now) / 1000)} seconds.`,
      };
    }

    // Calculate progressive delay based on failure count
    const failureCount = failureData?.failureCount || 0;
    const progressiveDelay = OTP_PROGRESSIVE_DELAYS[Math.min(failureCount + 1, 5)] || 60;

    // Check if we need to enforce progressive delay
    if (failureData?.lastAttemptAt) {
      const timeSinceLastAttempt = (now - failureData.lastAttemptAt) / 1000;
      if (timeSinceLastAttempt < progressiveDelay) {
        const waitTime = Math.ceil(progressiveDelay - timeSinceLastAttempt);
        return {
          allowed: false,
          remaining: status.remaining,
          delaySeconds: waitTime,
          resetAt: new Date(now + waitTime * 1000),
          lockedUntil: null,
          message: `Please wait ${waitTime} seconds before trying again.`,
        };
      }
    }

    return {
      allowed: true,
      remaining: status.remaining,
      delaySeconds: 0,
      resetAt: status.resetAt,
      lockedUntil: null,
      message: 'Verification attempt allowed',
    };
  }

  /**
   * Record failed OTP verification attempt
   */
  async recordOtpFailure(identifier: string): Promise<{
    failureCount: number;
    lockedUntil: Date | null;
    nextAttemptDelay: number;
  }> {
    const failureKey = `otpfailure:${identifier}`;
    const failureData = await this.cacheService.get<OtpFailureData>(failureKey);
    const now = Date.now();

    const newFailureCount = (failureData?.failureCount || 0) + 1;
    const nextDelay = OTP_PROGRESSIVE_DELAYS[Math.min(newFailureCount + 1, 5)] || 60;

    // Lock account for 15 minutes after 5 consecutive failures
    let lockedUntil: number | null = null;
    if (newFailureCount >= 5) {
      lockedUntil = now + 15 * 60 * 1000; // 15 minute lockout
      this.logger.warn(`OTP verification locked for identifier ${identifier} until ${new Date(lockedUntil).toISOString()}`);
    }

    const newFailureData: OtpFailureData = {
      failureCount: newFailureCount,
      lastAttemptAt: now,
      lockedUntil,
    };

    // Store for 1 hour (failures reset after 1 hour of no attempts)
    await this.cacheService.set(failureKey, newFailureData, 3600);

    // Also increment the standard rate limit
    await this.increment(identifier, RateLimitType.OTP_VERIFY);

    this.logger.warn(`OTP verification failure #${newFailureCount} for ${identifier}`);

    return {
      failureCount: newFailureCount,
      lockedUntil: lockedUntil ? new Date(lockedUntil) : null,
      nextAttemptDelay: nextDelay,
    };
  }

  /**
   * Record successful OTP verification (resets failure count)
   */
  async recordOtpSuccess(identifier: string): Promise<void> {
    const failureKey = `otpfailure:${identifier}`;
    await this.cacheService.del(failureKey);
    await this.reset(identifier, RateLimitType.OTP_VERIFY);
    await this.reset(identifier, RateLimitType.OTP_REQUEST);
    this.logger.log(`OTP verification success for ${identifier}, failure count reset`);
  }

  /**
   * Get current OTP failure status for an identifier
   */
  async getOtpFailureStatus(identifier: string): Promise<{
    failureCount: number;
    isLocked: boolean;
    lockedUntil: Date | null;
    nextAttemptDelay: number;
  }> {
    const failureKey = `otpfailure:${identifier}`;
    const failureData = await this.cacheService.get<OtpFailureData>(failureKey);
    const now = Date.now();

    if (!failureData) {
      return {
        failureCount: 0,
        isLocked: false,
        lockedUntil: null,
        nextAttemptDelay: 0,
      };
    }

    const isLocked = failureData.lockedUntil ? failureData.lockedUntil > now : false;
    const nextDelay = OTP_PROGRESSIVE_DELAYS[Math.min(failureData.failureCount + 1, 5)] || 60;

    return {
      failureCount: failureData.failureCount,
      isLocked,
      lockedUntil: failureData.lockedUntil ? new Date(failureData.lockedUntil) : null,
      nextAttemptDelay: nextDelay,
    };
  }
}
