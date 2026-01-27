import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsProvider, SmsProviderResult } from '../sms-provider.interface';

interface SpeedSmsResponse {
  status: 'success' | 'error';
  code: string;
  data?: {
    tranId: string;
    totalSMS: number;
    totalPrice: number;
  };
  message?: string;
}

/**
 * SpeedSMS Provider
 *
 * Implements SMS OTP delivery via SpeedSMS API (https://speedsms.vn)
 * Supports both SMS (type 2/3) and Voice OTP
 *
 * API Documentation: https://speedsms.vn/sms-api-service/
 */
@Injectable()
export class SpeedSmsProvider implements SmsProvider {
  readonly name = 'speedsms';
  private readonly logger = new Logger(SpeedSmsProvider.name);
  private readonly baseUrl = 'https://api.speedsms.vn/index.php';

  private readonly accessToken: string;
  private readonly smsType: number;
  private readonly sender: string;
  private readonly useVoiceOtp: boolean;

  constructor(private configService: ConfigService) {
    this.accessToken = this.configService.get<string>('SPEEDSMS_ACCESS_TOKEN') || '';
    this.smsType = this.configService.get<number>('SPEEDSMS_TYPE') || 2;
    this.sender = this.configService.get<string>('SPEEDSMS_SENDER') || '';
    this.useVoiceOtp = this.configService.get<boolean>('SPEEDSMS_USE_VOICE_OTP') || false;

    if (!this.accessToken) {
      this.logger.warn('SpeedSMS access token not configured');
    }
  }

  isConfigured(): boolean {
    return !!this.accessToken;
  }

  async sendOtp(phoneNumber: string, otp: string): Promise<SmsProviderResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'SpeedSMS not configured',
      };
    }

    const normalizedPhone = this.normalizePhone(phoneNumber);

    try {
      if (this.useVoiceOtp) {
        return await this.sendVoiceOtp(normalizedPhone, otp);
      }
      return await this.sendSmsOtp(normalizedPhone, otp);
    } catch (error) {
      this.logger.error('SpeedSMS request failed', error);
      return {
        success: false,
        error: 'SMS service temporarily unavailable',
      };
    }
  }

  /**
   * Send OTP via SMS
   */
  private async sendSmsOtp(phone: string, otp: string): Promise<SmsProviderResult> {
    const message = `Ma xac thuc cua ban la: ${otp}. Ma co hieu luc trong 5 phut.`;

    const params = new URLSearchParams({
      'access-token': this.accessToken,
      to: phone,
      content: message,
      type: this.smsType.toString(),
      ...(this.sender && { sender: this.sender }),
    });

    const url = `${this.baseUrl}/sms/send?${params.toString()}`;
    const response = await fetch(url);
    const result: SpeedSmsResponse = await response.json();

    if (result.status === 'success' && result.code === '00') {
      this.logger.log(
        `SpeedSMS OTP sent to ${this.maskPhone(phone)}, tranId: ${result.data?.tranId}`,
      );
      return {
        success: true,
        messageId: result.data?.tranId,
      };
    }

    this.logger.error(`SpeedSMS error: ${result.code} - ${result.message}`);
    return {
      success: false,
      error: this.mapErrorCode(result.code),
    };
  }

  /**
   * Send OTP via Voice call
   */
  private async sendVoiceOtp(phone: string, otp: string): Promise<SmsProviderResult> {
    const params = new URLSearchParams({
      'access-token': this.accessToken,
      to: phone,
      content: otp, // Voice OTP only accepts numeric code
    });

    const url = `${this.baseUrl}/voice/otp?${params.toString()}`;
    const response = await fetch(url);
    const result: SpeedSmsResponse = await response.json();

    if (result.status === 'success' && result.code === '00') {
      this.logger.log(
        `SpeedSMS Voice OTP sent to ${this.maskPhone(phone)}, tranId: ${result.data?.tranId}`,
      );
      return {
        success: true,
        messageId: result.data?.tranId,
      };
    }

    this.logger.error(`SpeedSMS Voice error: ${result.code} - ${result.message}`);
    return {
      success: false,
      error: this.mapErrorCode(result.code),
    };
  }

  /**
   * Normalize Vietnam phone to SpeedSMS format (84xxxxxxxxx)
   */
  private normalizePhone(phone: string): string {
    let normalized = phone.replace(/\s+/g, '');
    if (normalized.startsWith('+84')) {
      normalized = '84' + normalized.slice(3);
    } else if (normalized.startsWith('0')) {
      normalized = '84' + normalized.slice(1);
    } else if (!normalized.startsWith('84')) {
      normalized = '84' + normalized;
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
   * Map SpeedSMS error codes to user-friendly messages
   */
  private mapErrorCode(code: string): string {
    const errors: Record<string, string> = {
      '007': 'Service temporarily blocked, please try again later',
      '101': 'Invalid request parameters',
      '105': 'Invalid phone number',
      '300': 'Service quota exceeded, please try again later',
      '500': 'SMS service temporarily unavailable',
    };
    return errors[code] || 'Failed to send verification code';
  }
}
