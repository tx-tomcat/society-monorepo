import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PushService } from './push.service';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';

export type DeliveryChannels = {
  push?: boolean;
  email?: boolean;
  sms?: boolean;
};

export type DeliveryPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
};

export type UserWithSettings = {
  id: string;
  email: string | null;
  phone: string | null;
  settings: {
    pushNotifications: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
  } | null;
  pushTokens: Array<{ id: string; token: string }>;
};

export type DeliveryResult = {
  push?: { sent: number; failed: number };
  email?: { success: boolean; error?: string };
  sms?: { success: boolean; error?: string };
  attemptedChannels: number;
  successfulChannels: number;
  failedChannels: number;
};

/**
 * Shared notification delivery logic used by both:
 * - NotificationsService (sync delivery fallback)
 * - NotificationProcessor (async queue delivery)
 *
 * This service owns the actual delivery logic to prevent duplication.
 */
@Injectable()
export class NotificationDeliveryService {
  private readonly logger = new Logger(NotificationDeliveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  /**
   * Deliver notification to all enabled channels in parallel
   */
  async deliverToChannels(
    user: UserWithSettings,
    channels: DeliveryChannels,
    payload: DeliveryPayload,
    notificationId: string,
  ): Promise<DeliveryResult> {
    const results = await Promise.allSettled([
      // Push notification
      channels.push && user.settings?.pushNotifications && user.pushTokens.length > 0
        ? this.sendPushNotifications(user.pushTokens, payload, notificationId)
        : Promise.resolve({ skipped: true }),

      // Email notification
      channels.email && user.settings?.emailNotifications && user.email
        ? this.sendEmailNotification(user.email, payload, notificationId)
        : Promise.resolve({ skipped: true }),

      // SMS notification
      channels.sms && user.settings?.smsNotifications && user.phone
        ? this.sendSmsNotification(user.phone, payload, notificationId)
        : Promise.resolve({ skipped: true }),
    ]);

    // Count successes and failures
    let attemptedChannels = 0;
    let successfulChannels = 0;
    let failedChannels = 0;

    const deliveryResult: DeliveryResult = {
      attemptedChannels: 0,
      successfulChannels: 0,
      failedChannels: 0,
    };

    // Process push result
    if (results[0].status === 'fulfilled') {
      const value = results[0].value as { skipped?: boolean; sent?: number; failed?: number };
      if (!value.skipped) {
        attemptedChannels++;
        if (value.sent && value.sent > 0) {
          successfulChannels++;
          deliveryResult.push = { sent: value.sent, failed: value.failed || 0 };
        } else {
          failedChannels++;
          deliveryResult.push = { sent: 0, failed: value.failed || 0 };
        }
      }
    } else {
      attemptedChannels++;
      failedChannels++;
      this.logger.error('Push delivery failed', results[0].reason);
    }

    // Process email result
    if (results[1].status === 'fulfilled') {
      const value = results[1].value as { skipped?: boolean; success?: boolean; error?: string };
      if (!value.skipped) {
        attemptedChannels++;
        if (value.success) {
          successfulChannels++;
          deliveryResult.email = { success: true };
        } else {
          failedChannels++;
          deliveryResult.email = { success: false, error: value.error };
        }
      }
    } else {
      attemptedChannels++;
      failedChannels++;
      this.logger.error('Email delivery failed', results[1].reason);
    }

    // Process SMS result
    if (results[2].status === 'fulfilled') {
      const value = results[2].value as { skipped?: boolean; success?: boolean; error?: string };
      if (!value.skipped) {
        attemptedChannels++;
        if (value.success) {
          successfulChannels++;
          deliveryResult.sms = { success: true };
        } else {
          failedChannels++;
          deliveryResult.sms = { success: false, error: value.error };
        }
      }
    } else {
      attemptedChannels++;
      failedChannels++;
      this.logger.error('SMS delivery failed', results[2].reason);
    }

    deliveryResult.attemptedChannels = attemptedChannels;
    deliveryResult.successfulChannels = successfulChannels;
    deliveryResult.failedChannels = failedChannels;

    return deliveryResult;
  }

  private async sendPushNotifications(
    tokens: Array<{ id: string; token: string }>,
    payload: DeliveryPayload,
    notificationId: string,
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const { id: tokenId, token } of tokens) {
      const result = await this.pushService.sendToDevice({
        token,
        title: payload.title,
        body: payload.body,
        data: payload.data,
      });

      if (result.success) {
        sent++;
      } else {
        failed++;
        // Deactivate invalid tokens
        if (result.error?.includes('NotRegistered')) {
          await this.prisma.pushToken.update({
            where: { id: tokenId },
            data: { isActive: false },
          });
        }
      }

      // Log delivery
      await this.logDelivery(notificationId, 'push', result.success, result.error);
    }

    return { sent, failed };
  }

  private async sendEmailNotification(
    email: string,
    payload: DeliveryPayload,
    notificationId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const result = await this.emailService.send({
      to: email,
      subject: payload.title,
      html: `<p>${payload.body}</p>${payload.actionUrl ? `<a href="${payload.actionUrl}">View</a>` : ''}`,
    });

    await this.logDelivery(notificationId, 'email', result.success, result.error);
    return { success: result.success, error: result.error };
  }

  private async sendSmsNotification(
    phone: string,
    payload: DeliveryPayload,
    notificationId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const result = await this.smsService.send({
      to: this.smsService.formatPhoneNumber(phone),
      body: `${payload.title}: ${payload.body}`,
    });

    await this.logDelivery(notificationId, 'sms', result.success, result.error);
    return { success: result.success, error: result.error };
  }

  private async logDelivery(
    notificationId: string,
    channel: string,
    success: boolean,
    error?: string,
  ): Promise<void> {
    await this.prisma.notificationLog.create({
      data: {
        notificationId,
        channel,
        status: success ? 'delivered' : 'failed',
        errorMessage: error,
      },
    });
  }
}
