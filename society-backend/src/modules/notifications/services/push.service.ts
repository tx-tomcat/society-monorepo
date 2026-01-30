import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PushNotificationPayload } from '../interfaces/notification.interface';

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

interface ExpoPushMessage {
  to: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
  ttl?: number;
  expiration?: number;
  categoryId?: string;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: string;
  };
}

interface ExpoPushReceipt {
  status: 'ok' | 'error';
  message?: string;
  details?: {
    error?: string;
  };
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly expoAccessToken: string;
  private readonly retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
  };

  constructor(private readonly configService: ConfigService) {
    this.expoAccessToken = this.configService.get<string>('EXPO_ACCESS_TOKEN') || '';
    if (!this.expoAccessToken) {
      this.logger.warn('Expo access token not configured - push notifications will still work but without enhanced features');
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateBackoffDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelayMs * Math.pow(2, attempt);
    const jitter = Math.random() * 0.3 * delay;
    return Math.min(delay + jitter, this.retryConfig.maxDelayMs);
  }

  private isRetryableError(error: string): boolean {
    const retryablePatterns = [
      'UNAVAILABLE',
      'INTERNAL',
      'timeout',
      'ETIMEDOUT',
      'ECONNRESET',
      'ECONNREFUSED',
      'socket hang up',
      '429',
      '500',
      '502',
      '503',
      '504',
    ];
    return retryablePatterns.some(pattern =>
      error.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Check if a token is an Expo push token
   */
  private isExpoPushToken(token: string): boolean {
    return token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[');
  }

  /**
   * Get the notification channel for Android based on notification type
   */
  private getChannelId(data?: Record<string, unknown>): string {
    const type = data?.type as string | undefined;
    if (!type) return 'default';

    const channelMap: Record<string, string> = {
      BOOKING_REQUEST: 'bookings',
      BOOKING_CONFIRMED: 'bookings',
      BOOKING_DECLINED: 'bookings',
      BOOKING_CANCELLED: 'bookings',
      BOOKING_REMINDER: 'reminders',
      BOOKING_COMPLETED: 'bookings',
      NEW_MESSAGE: 'messages',
      PAYMENT_RECEIVED: 'payments',
      WITHDRAWAL_COMPLETED: 'payments',
    };

    return channelMap[type] || 'default';
  }

  /**
   * Send push notification to a single device via Expo Push API
   */
  async sendToDevice(payload: PushNotificationPayload): Promise<{ success: boolean; error?: string; retryCount?: number }> {
    const token = payload.token;

    // Validate Expo push token format
    if (!this.isExpoPushToken(token)) {
      this.logger.warn(`Invalid Expo push token format: ${token.substring(0, 20)}...`);
      return { success: false, error: 'Invalid Expo push token format' };
    }

    const message: ExpoPushMessage = {
      to: token,
      title: payload.title,
      body: payload.body,
      data: payload.data as Record<string, unknown>,
      sound: payload.sound === 'default' ? 'default' : null,
      badge: payload.badge,
      channelId: this.getChannelId(payload.data as Record<string, unknown>),
      priority: 'high',
      ttl: 86400, // 24 hours
    };

    let lastError = '';
    let retryCount = 0;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        };

        // Add authorization if access token is configured
        if (this.expoAccessToken) {
          headers['Authorization'] = `Bearer ${this.expoAccessToken}`;
        }

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers,
          body: JSON.stringify(message),
        });

        if (!response.ok) {
          const errorText = await response.text();
          lastError = `HTTP ${response.status}: ${errorText}`;
          this.logger.error(`Expo push error: ${lastError}`);

          if (attempt < this.retryConfig.maxRetries && this.isRetryableError(lastError)) {
            retryCount++;
            const delay = this.calculateBackoffDelay(attempt);
            this.logger.warn(`Retrying push notification (attempt ${attempt + 1}/${this.retryConfig.maxRetries}) after ${delay}ms`);
            await this.sleep(delay);
            continue;
          }

          return { success: false, error: lastError, retryCount };
        }

        const result = await response.json() as { data: ExpoPushTicket };
        const ticket = result.data;

        if (ticket.status === 'error') {
          lastError = ticket.message || ticket.details?.error || 'Unknown Expo push error';

          // Handle specific Expo errors
          if (ticket.details?.error === 'DeviceNotRegistered') {
            this.logger.warn(`Device not registered, token should be removed: ${token.substring(0, 30)}...`);
            return { success: false, error: 'DeviceNotRegistered', retryCount };
          }

          if (attempt < this.retryConfig.maxRetries && this.isRetryableError(lastError)) {
            retryCount++;
            const delay = this.calculateBackoffDelay(attempt);
            this.logger.warn(`Retrying push notification (attempt ${attempt + 1}/${this.retryConfig.maxRetries}) after ${delay}ms`);
            await this.sleep(delay);
            continue;
          }

          return { success: false, error: lastError, retryCount };
        }

        // Success
        if (retryCount > 0) {
          this.logger.log(`Push notification succeeded after ${retryCount} retries`);
        }

        this.logger.debug(`Push notification sent successfully, ticket: ${ticket.id}`);
        return { success: true, retryCount };

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        lastError = errorMessage;
        this.logger.error(`Failed to send push notification: ${errorMessage}`);

        if (attempt < this.retryConfig.maxRetries && this.isRetryableError(errorMessage)) {
          retryCount++;
          const delay = this.calculateBackoffDelay(attempt);
          this.logger.warn(`Retrying push notification (attempt ${attempt + 1}/${this.retryConfig.maxRetries}) after ${delay}ms`);
          await this.sleep(delay);
          continue;
        }

        return { success: false, error: errorMessage, retryCount };
      }
    }

    return { success: false, error: lastError, retryCount };
  }

  /**
   * Send push notifications to multiple devices via Expo Push API
   * Expo supports batching up to 100 messages per request
   */
  async sendToMultipleDevices(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string | number | boolean>,
  ): Promise<{ success: number; failure: number; retryCount?: number }> {
    if (tokens.length === 0) {
      return { success: 0, failure: 0 };
    }

    // Filter valid Expo tokens
    const validTokens = tokens.filter(token => this.isExpoPushToken(token));
    const invalidCount = tokens.length - validTokens.length;

    if (invalidCount > 0) {
      this.logger.warn(`Filtered out ${invalidCount} invalid Expo push tokens`);
    }

    if (validTokens.length === 0) {
      return { success: 0, failure: tokens.length };
    }

    const channelId = this.getChannelId(data as Record<string, unknown>);

    // Create messages array for batch sending
    const messages: ExpoPushMessage[] = validTokens.map(token => ({
      to: token,
      title,
      body,
      data: data as Record<string, unknown>,
      sound: 'default',
      channelId,
      priority: 'high',
      ttl: 86400,
    }));

    // Expo allows max 100 messages per request, batch if needed
    const BATCH_SIZE = 100;
    let totalSuccess = 0;
    let totalFailure = invalidCount;
    let totalRetryCount = 0;

    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
      const batch = messages.slice(i, i + BATCH_SIZE);
      const result = await this.sendBatch(batch);
      totalSuccess += result.success;
      totalFailure += result.failure;
      totalRetryCount += result.retryCount || 0;
    }

    return {
      success: totalSuccess,
      failure: totalFailure,
      retryCount: totalRetryCount,
    };
  }

  /**
   * Send a batch of messages to Expo Push API
   */
  private async sendBatch(messages: ExpoPushMessage[]): Promise<{ success: number; failure: number; retryCount?: number }> {
    let lastFailure = messages.length;
    let retryCount = 0;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        };

        if (this.expoAccessToken) {
          headers['Authorization'] = `Bearer ${this.expoAccessToken}`;
        }

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers,
          body: JSON.stringify(messages),
        });

        if (!response.ok) {
          const errorText = `HTTP ${response.status}`;

          if (attempt < this.retryConfig.maxRetries && this.isRetryableError(errorText)) {
            retryCount++;
            const delay = this.calculateBackoffDelay(attempt);
            this.logger.warn(`Retrying bulk push (attempt ${attempt + 1}/${this.retryConfig.maxRetries}) after ${delay}ms`);
            await this.sleep(delay);
            continue;
          }

          return { success: 0, failure: messages.length, retryCount };
        }

        const result = await response.json() as { data: ExpoPushTicket[] };
        const tickets = result.data;

        let success = 0;
        let failure = 0;

        for (const ticket of tickets) {
          if (ticket.status === 'ok') {
            success++;
          } else {
            failure++;
            if (ticket.details?.error === 'DeviceNotRegistered') {
              this.logger.warn('Device not registered - token should be removed');
            }
          }
        }

        if (retryCount > 0) {
          this.logger.log(`Bulk push completed after ${retryCount} retries`);
        }

        return { success, failure, retryCount };

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to send bulk push: ${errorMessage}`);

        if (attempt < this.retryConfig.maxRetries && this.isRetryableError(errorMessage)) {
          retryCount++;
          const delay = this.calculateBackoffDelay(attempt);
          this.logger.warn(`Retrying bulk push (attempt ${attempt + 1}/${this.retryConfig.maxRetries}) after ${delay}ms`);
          await this.sleep(delay);
          continue;
        }

        return { success: 0, failure: messages.length, retryCount };
      }
    }

    return { success: 0, failure: lastFailure, retryCount };
  }

  /**
   * Check push receipt status (optional - for debugging delivery issues)
   */
  async getReceipts(receiptIds: string[]): Promise<Record<string, ExpoPushReceipt>> {
    if (receiptIds.length === 0) {
      return {};
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (this.expoAccessToken) {
        headers['Authorization'] = `Bearer ${this.expoAccessToken}`;
      }

      const response = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ids: receiptIds }),
      });

      if (!response.ok) {
        this.logger.error(`Failed to get push receipts: HTTP ${response.status}`);
        return {};
      }

      const result = await response.json() as { data: Record<string, ExpoPushReceipt> };
      return result.data;

    } catch (error) {
      this.logger.error(`Error getting push receipts: ${error}`);
      return {};
    }
  }

  // Keep sendApns for backwards compatibility - delegates to sendToDevice
  async sendApns(payload: PushNotificationPayload): Promise<{ success: boolean; error?: string }> {
    return this.sendToDevice(payload);
  }
}
