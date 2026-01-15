import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PushNotificationPayload } from '../interfaces/notification.interface';

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly fcmServerKey: string;
  private readonly retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 1000,  // Start with 1 second
    maxDelayMs: 10000,  // Max 10 seconds
  };

  constructor(private readonly configService: ConfigService) {
    this.fcmServerKey = this.configService.get<string>('FIREBASE_SERVER_KEY') || '';
    if (!this.fcmServerKey) {
      this.logger.warn('Firebase server key not configured');
    }
  }

  /**
   * Sleep for a given number of milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(attempt: number): number {
    // Exponential backoff: baseDelay * 2^attempt with jitter
    const delay = this.retryConfig.baseDelayMs * Math.pow(2, attempt);
    const jitter = Math.random() * 0.3 * delay; // Add up to 30% jitter
    return Math.min(delay + jitter, this.retryConfig.maxDelayMs);
  }

  /**
   * Check if error is retryable (transient network issues, rate limits, etc.)
   */
  private isRetryableError(error: string): boolean {
    const retryablePatterns = [
      'UNAVAILABLE',
      'INTERNAL',
      'timeout',
      'ETIMEDOUT',
      'ECONNRESET',
      'ECONNREFUSED',
      'socket hang up',
      '429', // Rate limited
      '500', // Internal server error
      '502', // Bad gateway
      '503', // Service unavailable
      '504', // Gateway timeout
    ];
    return retryablePatterns.some(pattern =>
      error.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  async sendToDevice(payload: PushNotificationPayload): Promise<{ success: boolean; error?: string; retryCount?: number }> {
    if (!this.fcmServerKey) {
      return { success: false, error: 'Push notifications not configured' };
    }

    let lastError = '';
    let retryCount = 0;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `key=${this.fcmServerKey}`,
          },
          body: JSON.stringify({
            to: payload.token,
            notification: {
              title: payload.title,
              body: payload.body,
              sound: payload.sound || 'default',
              badge: payload.badge,
            },
            data: payload.data || {},
            priority: 'high',
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          lastError = `HTTP ${response.status}: ${errorText}`;
          this.logger.error(`FCM error: ${lastError}`);

          // Check if we should retry
          if (attempt < this.retryConfig.maxRetries && this.isRetryableError(lastError)) {
            retryCount++;
            const delay = this.calculateBackoffDelay(attempt);
            this.logger.warn(`Retrying push notification (attempt ${attempt + 1}/${this.retryConfig.maxRetries}) after ${delay}ms`);
            await this.sleep(delay);
            continue;
          }

          return { success: false, error: lastError, retryCount };
        }

        const result = await response.json() as { success?: number; results?: Array<{ error?: string }> };

        if (result.success === 0) {
          lastError = result.results?.[0]?.error || 'Unknown FCM error';

          // Check if we should retry
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
        return { success: true, retryCount };

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        lastError = errorMessage;
        this.logger.error(`Failed to send push notification: ${errorMessage}`);

        // Check if we should retry
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

  async sendToMultipleDevices(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string | number | boolean>,
  ): Promise<{ success: number; failure: number; retryCount?: number }> {
    if (!this.fcmServerKey || tokens.length === 0) {
      return { success: 0, failure: tokens.length };
    }

    let lastFailure = tokens.length;
    let retryCount = 0;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `key=${this.fcmServerKey}`,
          },
          body: JSON.stringify({
            registration_ids: tokens,
            notification: {
              title,
              body,
              sound: 'default',
            },
            data: data || {},
            priority: 'high',
          }),
        });

        if (!response.ok) {
          const errorText = `HTTP ${response.status}`;

          // Check if we should retry
          if (attempt < this.retryConfig.maxRetries && this.isRetryableError(errorText)) {
            retryCount++;
            const delay = this.calculateBackoffDelay(attempt);
            this.logger.warn(`Retrying bulk push (attempt ${attempt + 1}/${this.retryConfig.maxRetries}) after ${delay}ms`);
            await this.sleep(delay);
            continue;
          }

          return { success: 0, failure: tokens.length, retryCount };
        }

        const result = await response.json() as { success?: number; failure?: number };

        // If all failed with retryable error, retry
        if (result.success === 0 && attempt < this.retryConfig.maxRetries) {
          retryCount++;
          const delay = this.calculateBackoffDelay(attempt);
          this.logger.warn(`Retrying bulk push (attempt ${attempt + 1}/${this.retryConfig.maxRetries}) after ${delay}ms`);
          await this.sleep(delay);
          continue;
        }

        if (retryCount > 0) {
          this.logger.log(`Bulk push completed after ${retryCount} retries`);
        }

        return {
          success: result.success || 0,
          failure: result.failure || 0,
          retryCount,
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to send bulk push: ${errorMessage}`);

        // Check if we should retry
        if (attempt < this.retryConfig.maxRetries && this.isRetryableError(errorMessage)) {
          retryCount++;
          const delay = this.calculateBackoffDelay(attempt);
          this.logger.warn(`Retrying bulk push (attempt ${attempt + 1}/${this.retryConfig.maxRetries}) after ${delay}ms`);
          await this.sleep(delay);
          continue;
        }

        return { success: 0, failure: tokens.length, retryCount };
      }
    }

    return { success: 0, failure: lastFailure, retryCount };
  }

  // APNS for iOS (would need separate implementation with apple-pn library)
  async sendApns(payload: PushNotificationPayload): Promise<{ success: boolean; error?: string }> {
    // For production, implement APNS support
    // Using FCM for both iOS and Android simplifies things
    return this.sendToDevice(payload);
  }
}
