import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../cache/cache.service';
import { SmsProvider, SmsProviderResult } from '../sms-provider.interface';

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

/**
 * Zalo ZNS Provider
 *
 * Implements SMS OTP delivery via Zalo Notification Service
 * Requires user to have Zalo installed and registered
 *
 * API Documentation: https://developers.zalo.me/docs/zns
 */
@Injectable()
export class ZnsProvider implements SmsProvider {
  readonly name = 'zalo_zns';
  private readonly logger = new Logger(ZnsProvider.name);
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

  isConfigured(): boolean {
    return !!(this.appId && this.appSecret && this.refreshToken && this.templateId);
  }

  async sendOtp(phoneNumber: string, otp: string): Promise<SmsProviderResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Zalo ZNS not configured',
      };
    }

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
          `ZNS OTP sent to ${this.maskPhone(normalizedPhone)}, msg_id: ${result.data?.msg_id}`,
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
   * Get or refresh Zalo access token
   */
  private async getAccessToken(): Promise<string> {
    const cached = await this.cacheService.get<string>(ACCESS_TOKEN_CACHE_KEY);
    if (cached) {
      return cached;
    }

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
   * Normalize Vietnam phone to Zalo format (84xxxxxxxxx)
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
}
