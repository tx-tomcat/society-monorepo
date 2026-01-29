import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsProvider, SmsProviderResult } from '../sms-provider.interface';

interface EsmsResponse {
  CodeResult: string;
  SMSID?: string;
  ErrorMessage?: string;
}

/**
 * eSMS Provider for Zalo ZNS
 *
 * Implements OTP delivery via eSMS Zalo ZNS API
 * Sends Zalo notifications to users with registered Zalo accounts
 *
 * API Documentation: https://developers.esms.vn/esms-api/ham-gui-tin/tin-nhan-zalo
 */
@Injectable()
export class EsmsProvider implements SmsProvider {
  readonly name = 'esms_zns';
  private readonly logger = new Logger(EsmsProvider.name);
  private readonly apiUrl = 'https://rest.esms.vn/MainService.svc/json/SendZaloMessage_V6/';

  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly oaId: string;
  private readonly templateId: string;
  private readonly sandbox: boolean;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ESMS_API_KEY') || '';
    this.secretKey = this.configService.get<string>('ESMS_SECRET_KEY') || '';
    this.oaId = this.configService.get<string>('ESMS_OAID') || '';
    this.templateId = this.configService.get<string>('ESMS_OTP_TEMPLATE_ID') || '';
    this.sandbox = this.configService.get<string>('ESMS_SANDBOX') === 'true';

    if (!this.apiKey || !this.secretKey) {
      this.logger.warn('eSMS credentials not configured');
    } else {
      this.logger.log(
        `eSMS configured: apiKey=${this.apiKey.slice(0, 4)}...${this.apiKey.slice(-4)}, ` +
        `oaId=${this.oaId || 'not set'}, sandbox=${this.sandbox}`,
      );
    }
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.secretKey && this.oaId && this.templateId);
  }

  async sendOtp(phoneNumber: string, otp: string): Promise<SmsProviderResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'eSMS ZNS not configured',
      };
    }

    const normalizedPhone = this.normalizePhone(phoneNumber);

    try {
      const requestBody = {
        ApiKey: this.apiKey,
        SecretKey: this.secretKey,
        OAID: this.oaId,
        Phone: normalizedPhone,
        TempID: this.templateId,
        TempData: {
          otp: otp,
        },
        SendingMode: '1',
        RequestId: `otp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        ...(this.sandbox && { Sandbox: '1' }),
      };

      this.logger.log(`eSMS ZNS request to ${this.maskPhone(normalizedPhone)}`);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result: EsmsResponse = await response.json();
      this.logger.log(`eSMS response: ${JSON.stringify(result)}`);

      if (result.CodeResult === '100') {
        this.logger.log(
          `eSMS ZNS OTP sent to ${this.maskPhone(normalizedPhone)}, SMSID: ${result.SMSID}`,
        );
        return {
          success: true,
          messageId: result.SMSID,
        };
      }

      this.logger.error(`eSMS error: ${result.CodeResult} - ${result.ErrorMessage}`);
      return {
        success: false,
        error: this.mapErrorCode(result.CodeResult, result.ErrorMessage),
      };
    } catch (error) {
      this.logger.error('eSMS request failed', error);
      return {
        success: false,
        error: 'Zalo notification service temporarily unavailable',
      };
    }
  }

  /**
   * Normalize Vietnam phone to eSMS format (0xxxxxxxxx)
   */
  private normalizePhone(phone: string): string {
    let normalized = phone.replace(/\s+/g, '');
    if (normalized.startsWith('+84')) {
      normalized = '0' + normalized.slice(3);
    } else if (normalized.startsWith('84')) {
      normalized = '0' + normalized.slice(2);
    } else if (!normalized.startsWith('0')) {
      normalized = '0' + normalized;
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
   * Map eSMS error codes to user-friendly messages
   */
  private mapErrorCode(code: string, message?: string): string {
    const errors: Record<string, string> = {
      '101': 'Authentication failed',
      '789': 'Template not configured for this Zalo OA',
      '99': 'Unknown error occurred',
    };
    return errors[code] || message || 'Failed to send Zalo notification';
  }
}
