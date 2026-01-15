import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsPayload } from '../interfaces/notification.interface';
import {
  isValidVietnamPhone,
  toInternationalFormat,
} from '@/common/validators/vietnam-phone.validator';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly fromNumber: string;

  constructor(private readonly configService: ConfigService) {
    this.accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID') || '';
    this.authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN') || '';
    this.fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER') || '';

    if (!this.accountSid || !this.authToken) {
      this.logger.warn('Twilio credentials not configured');
    }
  }

  async send(payload: SmsPayload): Promise<{ success: boolean; error?: string }> {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      return { success: false, error: 'SMS service not configured' };
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      const formData = new URLSearchParams();
      formData.append('To', payload.to);
      formData.append('From', this.fromNumber);
      formData.append('Body', payload.body);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`,
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const error = await response.json();
        this.logger.error(`Twilio error: ${JSON.stringify(error)}`);
        return { success: false, error: error.message || 'SMS failed' };
      }

      const result = await response.json();
      this.logger.debug(`SMS sent: ${result.sid}`);

      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send SMS: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Format and validate Vietnamese phone numbers for SMS delivery
   * Uses the centralized Vietnam phone validator
   */
  formatPhoneNumber(phone: string): string {
    if (!isValidVietnamPhone(phone)) {
      this.logger.warn(`Invalid Vietnam phone number: ${phone}`);
      throw new BadRequestException('Invalid Vietnam phone number format');
    }

    return toInternationalFormat(phone);
  }

  // Common SMS notifications
  async sendVerificationCode(phone: string, code: string): Promise<{ success: boolean; error?: string }> {
    return this.send({
      to: this.formatPhoneNumber(phone),
      body: `Your Society verification code is: ${code}. Valid for 10 minutes.`,
    });
  }

  async sendMatchNotification(phone: string, matchName: string): Promise<{ success: boolean; error?: string }> {
    return this.send({
      to: this.formatPhoneNumber(phone),
      body: `You have a new match on Society! ${matchName} is waiting to connect with you.`,
    });
  }

  async sendCallReminder(phone: string, callerName: string, time: string): Promise<{ success: boolean; error?: string }> {
    return this.send({
      to: this.formatPhoneNumber(phone),
      body: `Reminder: You have a scheduled call with ${callerName} at ${time} on Society.`,
    });
  }
}
