import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { SmsProvider, SmsProviderResult } from '../sms-provider.interface';

interface AbenlaResponse {
  Code: number;
  Message?: string;
  SmsId?: string;
}

type AbenlaChannel = {
  label: string;
  serviceTypeId: string;
  brandName: string;
  messageFormatter: (otp: string) => string;
};

const ABENLA_API_URL = 'https://api.abenla.com/api/SendOTP';
const ABENLA_SUCCESS_CODES = new Set([203, 106]);
const ABENLA_AUTH_ERROR_CODES = new Set([101, 102, 103, 104, 107]);

/**
 * Abenla Provider
 *
 * Implements OTP delivery via Abenla API (https://abenla.com)
 * Supports multi-channel delivery with automatic fallback:
 *   1. Zalo OTP → 2. Voice OTP → 3. SMS OTP
 *
 * API Documentation: https://api.abenla.com
 */
@Injectable()
export class AbenlaProvider implements SmsProvider {
  readonly name = 'abenla';
  private readonly logger = new Logger(AbenlaProvider.name);

  private readonly loginName: string;
  private readonly sign: string;
  private readonly smsServiceTypeId: string;
  private readonly smsBrandName: string;
  private readonly zaloServiceTypeId: string;
  private readonly zaloBrandName: string;
  private readonly voiceServiceTypeId: string;
  private readonly voiceBrandName: string;

  constructor(private configService: ConfigService) {
    this.loginName = this.configService.get<string>('ABENLA_LOGIN_NAME') || '';
    const password = this.configService.get<string>('ABENLA_PASSWORD') || '';
    this.sign = password
      ? crypto.createHash('md5').update(password).digest('hex')
      : '';

    this.smsServiceTypeId = this.configService.get<string>('ABENLA_SMS_SERVICE_TYPE_ID') || '';
    this.smsBrandName = this.configService.get<string>('ABENLA_SMS_BRAND_NAME') || '';
    this.zaloServiceTypeId = this.configService.get<string>('ABENLA_ZALO_SERVICE_TYPE_ID') || '';
    this.zaloBrandName = this.configService.get<string>('ABENLA_ZALO_BRAND_NAME') || '';
    this.voiceServiceTypeId = this.configService.get<string>('ABENLA_VOICE_SERVICE_TYPE_ID') || '';
    this.voiceBrandName = this.configService.get<string>('ABENLA_VOICE_BRAND_NAME') || '';

    if (!this.loginName || !this.sign) {
      this.logger.warn('Abenla credentials not configured');
    } else {
      this.logger.log(
        `Abenla configured: loginName=${this.loginName}, ` +
        `channels=[${this.getConfiguredChannelLabels().join(', ') || 'none'}]`,
      );
    }
  }

  isConfigured(): boolean {
    return !!(this.loginName && this.sign && this.getChannels().length > 0);
  }

  async sendOtp(phoneNumber: string, otp: string): Promise<SmsProviderResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Abenla not configured',
      };
    }

    const normalizedPhone = this.normalizePhone(phoneNumber);
    const channels = this.getChannels(otp);
    const smsGuid = `otp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    let lastError: string | undefined;

    for (const channel of channels) {
      const result = await this.sendViaChannel(normalizedPhone, channel, smsGuid);

      if (result.success) {
        this.logger.log(`Abenla OTP sent via ${channel.label} to ${this.maskPhone(normalizedPhone)}`);
        return result;
      }

      if (result.error?.includes('Authentication')) {
        return result;
      }

      lastError = result.error;
      this.logger.warn(`Abenla ${channel.label} failed: ${result.error}`);
    }

    return {
      success: false,
      error: lastError || 'All Abenla delivery channels failed',
    };
  }

  private async sendViaChannel(
    phone: string,
    channel: AbenlaChannel,
    smsGuid: string,
  ): Promise<SmsProviderResult> {
    try {
      const query = new URLSearchParams({
        loginName: this.loginName,
        sign: this.sign,
        serviceTypeId: channel.serviceTypeId,
        phoneNumber: phone,
        message: channel.messageFormatter(''),
        detectCode: 'true',
        brandName: channel.brandName,
        callBack: 'false',
        smsGuid,
      });

      this.logger.log(`Abenla ${channel.label} request to ${this.maskPhone(phone)}`);

      const response = await fetch(`${ABENLA_API_URL}?${query.toString()}`);
      const result: AbenlaResponse = await response.json().catch(() => ({
        Code: 100,
        Message: 'Invalid response from Abenla API',
      }));

      this.logger.log(`Abenla ${channel.label} response: ${JSON.stringify(result)}`);

      if (ABENLA_SUCCESS_CODES.has(result.Code)) {
        return {
          success: true,
          messageId: result.SmsId || smsGuid,
        };
      }

      if (ABENLA_AUTH_ERROR_CODES.has(result.Code)) {
        this.logger.error(`Abenla authentication error: ${result.Code} - ${result.Message}`);
        return {
          success: false,
          error: 'Authentication failed with Abenla API',
        };
      }

      return {
        success: false,
        error: this.mapErrorCode(result.Code, result.Message),
      };
    } catch (error) {
      this.logger.error(`Abenla ${channel.label} request failed`, error);
      return {
        success: false,
        error: `Abenla ${channel.label} service temporarily unavailable`,
      };
    }
  }

  /**
   * Build ordered list of configured channels (Zalo → Voice → SMS)
   */
  private getChannels(otp?: string): AbenlaChannel[] {
    const channels: AbenlaChannel[] = [];

    if (this.zaloServiceTypeId && this.zaloBrandName) {
      channels.push({
        label: 'zalo',
        serviceTypeId: this.zaloServiceTypeId,
        brandName: this.zaloBrandName,
        messageFormatter: () => otp || '',
      });
    }

    if (this.voiceServiceTypeId && this.voiceBrandName) {
      channels.push({
        label: 'voice',
        serviceTypeId: this.voiceServiceTypeId,
        brandName: this.voiceBrandName,
        messageFormatter: () => otp || '',
      });
    }

    if (this.smsServiceTypeId && this.smsBrandName) {
      channels.push({
        label: 'sms',
        serviceTypeId: this.smsServiceTypeId,
        brandName: this.smsBrandName,
        messageFormatter: () => otp || '',
      });
    }

    return channels;
  }

  private getConfiguredChannelLabels(): string[] {
    return this.getChannels().map((c) => c.label);
  }

  /**
   * Normalize Vietnam phone to Abenla format (84xxxxxxxxx)
   */
  private normalizePhone(phone: string): string {
    let normalized = phone.replace(/[^\d]/g, '');
    if (normalized.startsWith('0')) {
      normalized = '84' + normalized.slice(1);
    } else if (normalized.startsWith('+84')) {
      normalized = normalized.slice(1);
    } else if (!normalized.startsWith('84')) {
      normalized = '84' + normalized;
    }
    return normalized;
  }

  private maskPhone(phone: string): string {
    if (phone.length < 6) return '***';
    return phone.slice(0, 4) + '****' + phone.slice(-2);
  }

  private mapErrorCode(code: number, message?: string): string {
    const errors: Record<number, string> = {
      100: 'Invalid request parameters',
      105: 'Invalid phone number format',
      108: 'Service type not supported',
      109: 'Insufficient balance',
      110: 'Phone number is blocked',
    };
    return errors[code] || message || 'Failed to send verification code';
  }
}
