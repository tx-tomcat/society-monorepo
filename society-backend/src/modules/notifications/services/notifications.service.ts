import { NotificationType } from '@generated/client';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateNotificationDto,
  RegisterPushTokenDto,
  SendNotificationDto,
  UpdatePreferencesDto,
} from '../dto/notification.dto';
import { NotificationResult } from '../interfaces/notification.interface';
import { EmailService } from './email.service';
import { PushService } from './push.service';
import { SmsService } from './sms.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  async create(dto: CreateNotificationDto): Promise<string> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        data: dto.data || {},
        actionUrl: dto.actionUrl,
      },
    });

    return notification.id;
  }

  async send(dto: SendNotificationDto): Promise<NotificationResult> {
    // Create in-app notification
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        data: dto.data || {},
        actionUrl: dto.actionUrl,
      },
    });

    const result: NotificationResult = {
      notificationId: notification.id,
      channels: {
        inApp: true,
      },
    };

    // Get user settings
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      include: {
        settings: true,
        pushTokens: { where: { isActive: true } },
      },
    });

    if (!user) {
      return result;
    }

    // Send push notification
    if (dto.sendPush !== false && user.settings?.pushNotifications) {
      for (const token of user.pushTokens) {
        const pushResult = await this.pushService.sendToDevice({
          token: token.token,
          title: dto.title,
          body: dto.body,
          data: dto.data,
        });

        result.channels.push = pushResult;

        // Log delivery
        await this.logDelivery(notification.id, 'push', pushResult.success, pushResult.error);

        // Deactivate invalid tokens
        if (!pushResult.success && pushResult.error?.includes('NotRegistered')) {
          await this.prisma.pushToken.update({
            where: { id: token.id },
            data: { isActive: false },
          });
        }
      }
    }

    // Send email notification
    if (dto.sendEmail && user.settings?.emailNotifications && user.email) {
      const emailResult = await this.emailService.send({
        to: user.email,
        subject: dto.title,
        html: `<p>${dto.body}</p>${dto.actionUrl ? `<a href="${dto.actionUrl}">View</a>` : ''}`,
      });

      result.channels.email = emailResult;
      await this.logDelivery(notification.id, 'email', emailResult.success, emailResult.error);
    }

    // Send SMS notification
    if (dto.sendSms && user.settings?.smsNotifications && user.phone) {
      const smsResult = await this.smsService.send({
        to: this.smsService.formatPhoneNumber(user.phone),
        body: `${dto.title}: ${dto.body}`,
      });

      result.channels.sms = smsResult;
      await this.logDelivery(notification.id, 'sms', smsResult.success, smsResult.error);
    }

    return result;
  }

  async getNotifications(userId: string, page = 1, limit = 20, unreadOnly = false) {
    return this.prisma.paginate('Notification', {
      page,
      limit,
      where: {
        userId,
        ...(unreadOnly && { isRead: false }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { success: true };
  }

  async deleteNotification(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return { success: true };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async registerPushToken(userId: string, dto: RegisterPushTokenDto) {
    // Deactivate existing tokens with same token value
    await this.prisma.pushToken.updateMany({
      where: { token: dto.token },
      data: { isActive: false },
    });

    // Create or update token
    const token = await this.prisma.pushToken.upsert({
      where: {
        id: dto.deviceId || 'new',
      },
      update: {
        token: dto.token,
        platform: dto.platform,
        isActive: true,
      },
      create: {
        userId,
        token: dto.token,
        platform: dto.platform,
        isActive: true,
      },
    });

    return { tokenId: token.id };
  }

  async removePushToken(userId: string, tokenId: string) {
    const token = await this.prisma.pushToken.findUnique({
      where: { id: tokenId },
    });

    if (!token || token.userId !== userId) {
      throw new NotFoundException('Token not found');
    }

    await this.prisma.pushToken.delete({
      where: { id: tokenId },
    });

    return { success: true };
  }

  async getPreferences(userId: string) {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    return {
      pushNotifications: settings?.pushNotifications ?? true,
      emailNotifications: settings?.emailNotifications ?? true,
      smsNotifications: settings?.smsNotifications ?? false,
    };
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    await this.prisma.userSettings.upsert({
      where: { userId },
      update: {
        ...(dto.pushNotifications !== undefined && { pushNotifications: dto.pushNotifications }),
        ...(dto.emailNotifications !== undefined && { emailNotifications: dto.emailNotifications }),
        ...(dto.smsNotifications !== undefined && { smsNotifications: dto.smsNotifications }),
      },
      create: {
        userId,
        pushNotifications: dto.pushNotifications ?? true,
        emailNotifications: dto.emailNotifications ?? true,
        smsNotifications: dto.smsNotifications ?? false,
      },
    });

    return { success: true };
  }

  // Helper to send specific notification types

  /**
   * Notify companion of a new booking request
   */
  async notifyBookingRequest(companionId: string, hirerName: string, bookingId: string) {
    await this.send({
      userId: companionId,
      type: NotificationType.BOOKING_REQUEST,
      title: 'New Booking Request',
      body: `${hirerName} wants to book your services`,
      data: { bookingId },
      actionUrl: `/bookings/${bookingId}`,
      sendPush: true,
      sendEmail: true,
    });
  }

  /**
   * Notify hirer that booking is confirmed
   */
  async notifyBookingConfirmed(hirerId: string, companionName: string, bookingId: string) {
    await this.send({
      userId: hirerId,
      type: NotificationType.BOOKING_CONFIRMED,
      title: 'Booking Confirmed',
      body: `${companionName} has confirmed your booking`,
      data: { bookingId },
      actionUrl: `/bookings/${bookingId}`,
      sendPush: true,
      sendEmail: true,
    });
  }

  /**
   * Notify hirer that booking was declined
   */
  async notifyBookingDeclined(hirerId: string, companionName: string, bookingId: string) {
    await this.send({
      userId: hirerId,
      type: NotificationType.BOOKING_DECLINED,
      title: 'Booking Declined',
      body: `${companionName} was unable to accept your booking`,
      data: { bookingId },
      actionUrl: `/bookings/${bookingId}`,
      sendPush: true,
    });
  }

  /**
   * Notify user of a booking cancellation
   */
  async notifyBookingCancelled(userId: string, bookingId: string, cancelledBy: string) {
    await this.send({
      userId,
      type: NotificationType.BOOKING_CANCELLED,
      title: 'Booking Cancelled',
      body: `Your booking has been cancelled by ${cancelledBy}`,
      data: { bookingId },
      actionUrl: `/bookings/${bookingId}`,
      sendPush: true,
      sendEmail: true,
    });
  }

  /**
   * Send booking reminder
   */
  async notifyBookingReminder(userId: string, bookingId: string, timeUntil: string) {
    await this.send({
      userId,
      type: NotificationType.BOOKING_REMINDER,
      title: 'Upcoming Booking',
      body: `Your booking starts in ${timeUntil}`,
      data: { bookingId },
      actionUrl: `/bookings/${bookingId}`,
      sendPush: true,
    });
  }

  /**
   * Notify user of new message
   */
  async notifyNewMessage(recipientId: string, senderName: string, conversationId: string) {
    await this.send({
      userId: recipientId,
      type: NotificationType.NEW_MESSAGE,
      title: 'New Message',
      body: `${senderName} sent you a message`,
      data: { conversationId },
      actionUrl: `/conversations/${conversationId}`,
      sendPush: true,
    });
  }

  /**
   * Notify companion of new review
   */
  async notifyNewReview(companionId: string, hirerName: string, rating: number, bookingId: string) {
    await this.send({
      userId: companionId,
      type: NotificationType.NEW_REVIEW,
      title: 'New Review',
      body: `${hirerName} left you a ${rating}-star review`,
      data: { bookingId },
      actionUrl: `/reviews`,
      sendPush: true,
    });
  }

  /**
   * Notify companion of payment received
   */
  async notifyPaymentReceived(companionId: string, amount: number, currency: string) {
    await this.send({
      userId: companionId,
      type: NotificationType.PAYMENT_RECEIVED,
      title: 'Payment Received',
      body: `You received ${currency} ${amount.toLocaleString()}`,
      actionUrl: '/earnings',
      sendPush: true,
    });
  }

  /**
   * Notify user of withdrawal completion
   */
  async notifyWithdrawalCompleted(userId: string, amount: number, currency: string) {
    await this.send({
      userId,
      type: NotificationType.WITHDRAWAL_COMPLETED,
      title: 'Withdrawal Complete',
      body: `${currency} ${amount.toLocaleString()} has been sent to your account`,
      actionUrl: '/earnings',
      sendPush: true,
      sendEmail: true,
    });
  }

  /**
   * Notify user of account verification
   */
  async notifyAccountVerified(userId: string, verificationType: string) {
    await this.send({
      userId,
      type: NotificationType.ACCOUNT_VERIFIED,
      title: 'Verification Complete',
      body: `Your ${verificationType} has been verified`,
      actionUrl: '/profile',
      sendPush: true,
      sendEmail: true,
    });
  }

  private async logDelivery(
    notificationId: string,
    channel: string,
    success: boolean,
    error?: string,
  ) {
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
