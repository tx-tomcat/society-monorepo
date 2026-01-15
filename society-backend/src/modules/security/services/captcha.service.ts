import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../cache/cache.service';

export enum CaptchaProvider {
  HCAPTCHA = 'hcaptcha',
  RECAPTCHA = 'recaptcha',
}

interface CaptchaVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

interface BruteForceData {
  failureCount: number;
  lastAttemptAt: number;
  captchaRequiredSince: number | null;
}

const BRUTE_FORCE_THRESHOLD = 3; // Require CAPTCHA after 3 failures
const BRUTE_FORCE_WINDOW_SECONDS = 900; // 15 minute window
const CAPTCHA_COOLDOWN_SECONDS = 300; // Reset after 5 minutes of no attempts

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);
  private readonly provider: CaptchaProvider;
  private readonly secretKey: string;
  private readonly siteKey: string;
  private readonly enabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {
    // Default to hCaptcha, but support reCAPTCHA via config
    const providerConfig = this.configService.get<string>('CAPTCHA_PROVIDER', 'hcaptcha');
    this.provider = providerConfig === 'recaptcha' ? CaptchaProvider.RECAPTCHA : CaptchaProvider.HCAPTCHA;

    this.secretKey = this.configService.get<string>('CAPTCHA_SECRET_KEY', '');
    this.siteKey = this.configService.get<string>('CAPTCHA_SITE_KEY', '');
    this.enabled = this.configService.get<boolean>('CAPTCHA_ENABLED', false);

    if (this.enabled && !this.secretKey) {
      this.logger.warn('CAPTCHA is enabled but CAPTCHA_SECRET_KEY is not set');
    }
  }

  /**
   * Check if CAPTCHA is required for a given identifier (IP or email)
   */
  async isCaptchaRequired(identifier: string): Promise<{
    required: boolean;
    failureCount: number;
    threshold: number;
  }> {
    if (!this.enabled) {
      return { required: false, failureCount: 0, threshold: BRUTE_FORCE_THRESHOLD };
    }

    const key = `bruteforce:${identifier}`;
    const data = await this.cacheService.get<BruteForceData>(key);

    if (!data) {
      return { required: false, failureCount: 0, threshold: BRUTE_FORCE_THRESHOLD };
    }

    return {
      required: data.failureCount >= BRUTE_FORCE_THRESHOLD,
      failureCount: data.failureCount,
      threshold: BRUTE_FORCE_THRESHOLD,
    };
  }

  /**
   * Record a failed authentication attempt
   */
  async recordFailedAttempt(identifier: string): Promise<{
    failureCount: number;
    captchaRequired: boolean;
    threshold: number;
  }> {
    const key = `bruteforce:${identifier}`;
    const now = Date.now();

    const data = await this.cacheService.get<BruteForceData>(key);

    let newData: BruteForceData;
    if (!data) {
      newData = {
        failureCount: 1,
        lastAttemptAt: now,
        captchaRequiredSince: null,
      };
    } else {
      newData = {
        failureCount: data.failureCount + 1,
        lastAttemptAt: now,
        captchaRequiredSince: data.captchaRequiredSince,
      };
    }

    // Mark when CAPTCHA became required
    if (newData.failureCount >= BRUTE_FORCE_THRESHOLD && !newData.captchaRequiredSince) {
      newData.captchaRequiredSince = now;
      this.logger.warn(`CAPTCHA now required for ${identifier} after ${newData.failureCount} failures`);
    }

    await this.cacheService.set(key, newData, BRUTE_FORCE_WINDOW_SECONDS);

    return {
      failureCount: newData.failureCount,
      captchaRequired: this.enabled && newData.failureCount >= BRUTE_FORCE_THRESHOLD,
      threshold: BRUTE_FORCE_THRESHOLD,
    };
  }

  /**
   * Record a successful authentication (resets brute force counter)
   */
  async recordSuccessfulAttempt(identifier: string): Promise<void> {
    const key = `bruteforce:${identifier}`;
    await this.cacheService.del(key);
    this.logger.debug(`Brute force counter reset for ${identifier}`);
  }

  /**
   * Verify CAPTCHA token with the provider
   */
  async verifyCaptcha(token: string, remoteIp?: string): Promise<boolean> {
    if (!this.enabled) {
      this.logger.debug('CAPTCHA verification skipped - CAPTCHA is disabled');
      return true;
    }

    if (!token) {
      throw new BadRequestException({
        message: 'CAPTCHA token is required',
        error: 'CAPTCHA_REQUIRED',
      });
    }

    // Validate token format (alphanumeric with common special chars, reasonable length)
    if (!/^[a-zA-Z0-9_\-\.]{20,2000}$/.test(token)) {
      this.logger.warn('Invalid CAPTCHA token format');
      return false;
    }

    if (!this.secretKey) {
      this.logger.error('CAPTCHA verification failed - secret key not configured');
      return false;
    }

    try {
      const verifyUrl = this.getVerifyUrl();
      const formData = this.buildVerifyFormData(token, remoteIp);

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        this.logger.error(`CAPTCHA provider returned error status: ${response.status}`);
        return false;
      }

      const result: CaptchaVerifyResponse = await response.json();

      if (!result.success) {
        this.logger.warn(`CAPTCHA verification failed: ${JSON.stringify(result['error-codes'])}`);
        return false;
      }

      this.logger.debug('CAPTCHA verification successful');
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.error('CAPTCHA verification timeout');
      } else {
        this.logger.error(`CAPTCHA verification error: ${error}`);
      }
      return false;
    }
  }

  /**
   * Combined check: verify CAPTCHA if required
   */
  async validateCaptchaIfRequired(
    identifier: string,
    captchaToken?: string,
    remoteIp?: string,
  ): Promise<{ valid: boolean; captchaRequired: boolean; message?: string }> {
    const status = await this.isCaptchaRequired(identifier);

    if (!status.required) {
      return { valid: true, captchaRequired: false };
    }

    // CAPTCHA is required
    if (!captchaToken) {
      return {
        valid: false,
        captchaRequired: true,
        message: 'CAPTCHA verification required due to multiple failed attempts',
      };
    }

    // Verify the provided CAPTCHA
    const isValid = await this.verifyCaptcha(captchaToken, remoteIp);

    if (!isValid) {
      return {
        valid: false,
        captchaRequired: true,
        message: 'CAPTCHA verification failed. Please try again.',
      };
    }

    return { valid: true, captchaRequired: true };
  }

  /**
   * Get brute force status for an identifier
   */
  async getBruteForceStatus(identifier: string): Promise<{
    failureCount: number;
    captchaRequired: boolean;
    threshold: number;
    captchaRequiredSince: Date | null;
    windowSeconds: number;
  }> {
    const key = `bruteforce:${identifier}`;
    const data = await this.cacheService.get<BruteForceData>(key);

    if (!data) {
      return {
        failureCount: 0,
        captchaRequired: false,
        threshold: BRUTE_FORCE_THRESHOLD,
        captchaRequiredSince: null,
        windowSeconds: BRUTE_FORCE_WINDOW_SECONDS,
      };
    }

    return {
      failureCount: data.failureCount,
      captchaRequired: this.enabled && data.failureCount >= BRUTE_FORCE_THRESHOLD,
      threshold: BRUTE_FORCE_THRESHOLD,
      captchaRequiredSince: data.captchaRequiredSince ? new Date(data.captchaRequiredSince) : null,
      windowSeconds: BRUTE_FORCE_WINDOW_SECONDS,
    };
  }

  /**
   * Get CAPTCHA configuration for client
   */
  getCaptchaConfig(): {
    enabled: boolean;
    provider: CaptchaProvider;
    siteKey: string;
    threshold: number;
  } {
    return {
      enabled: this.enabled,
      provider: this.provider,
      siteKey: this.enabled ? this.siteKey : '',
      threshold: BRUTE_FORCE_THRESHOLD,
    };
  }

  // ============================================
  // Private helpers
  // ============================================

  private getVerifyUrl(): string {
    if (this.provider === CaptchaProvider.RECAPTCHA) {
      return 'https://www.google.com/recaptcha/api/siteverify';
    }
    return 'https://api.hcaptcha.com/siteverify';
  }

  private buildVerifyFormData(token: string, remoteIp?: string): URLSearchParams {
    const params = new URLSearchParams();
    params.append('secret', this.secretKey);
    params.append('response', token);

    if (remoteIp) {
      // Validate IP format before including
      const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
      const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

      if (ipv4Regex.test(remoteIp) || ipv6Regex.test(remoteIp)) {
        params.append('remoteip', remoteIp);
      } else {
        this.logger.debug(`Skipping invalid IP format: ${remoteIp}`);
      }
    }

    return params;
  }
}
