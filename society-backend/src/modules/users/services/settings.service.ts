import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateSettingsDto } from '../dto/settings.dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSettings(userId: string) {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Create default settings if not exist
      return this.prisma.userSettings.create({
        data: { userId },
      });
    }

    return settings;
  }

  async updateSettings(userId: string, updateData: UpdateSettingsDto) {
    const settings = await this.prisma.userSettings.upsert({
      where: { userId },
      update: {
        language: updateData.language,
        timezone: updateData.timezone,
        pushNotifications: updateData.pushNotifications,
        emailNotifications: updateData.emailNotifications,
        smsNotifications: updateData.smsNotifications,
        showOnlineStatus: updateData.showOnlineStatus,
      },
      create: {
        userId,
        language: updateData.language,
        timezone: updateData.timezone,
        pushNotifications: updateData.pushNotifications,
        emailNotifications: updateData.emailNotifications,
        smsNotifications: updateData.smsNotifications,
        showOnlineStatus: updateData.showOnlineStatus,
      },
    });

    this.logger.log(`Updated settings for user: ${userId}`);
    return settings;
  }

  async getNotificationPreferences(userId: string) {
    const settings = await this.getSettings(userId);

    return {
      pushNotifications: settings.pushNotifications,
      emailNotifications: settings.emailNotifications,
      smsNotifications: settings.smsNotifications,
    };
  }

  async updateNotificationPreferences(
    userId: string,
    preferences: {
      pushNotifications?: boolean;
      emailNotifications?: boolean;
      smsNotifications?: boolean;
    },
  ) {
    return this.prisma.userSettings.update({
      where: { userId },
      data: preferences,
    });
  }

  async getPrivacySettings(userId: string) {
    const settings = await this.getSettings(userId);

    return {
      showOnlineStatus: settings.showOnlineStatus,
    };
  }

  async updatePrivacySettings(
    userId: string,
    privacy: {
      showOnlineStatus?: boolean;
    },
  ) {
    return this.prisma.userSettings.update({
      where: { userId },
      data: privacy,
    });
  }
}
