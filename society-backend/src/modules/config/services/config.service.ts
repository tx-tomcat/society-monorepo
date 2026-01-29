import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PlatformConfigDto } from '../dto/platform-config.dto';

// Default values (used when database config doesn't exist)
const DEFAULT_CONFIG: PlatformConfigDto = {
  platformFeePercent: 0.18,
  cancellationFeePercent: 0.50,
  minBookingHours: 1,
  maxBookingHours: 12,
  minAdvanceBookingHours: 2,
  maxAdvanceBookingDays: 30,
  freeCancellationHours: 24,
  supportEmail: 'support@luxe.vn',
  supportPhone: '+84 28 1234 5678',
  minAppVersion: '1.0.0',
  currentAppVersion: '1.0.0',
};

/**
 * Service for platform configuration
 * Reads from PlatformConfig table, with fallback to defaults
 */
@Injectable()
export class PlatformConfigService {
  private readonly logger = new Logger(PlatformConfigService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get platform configuration from database
   * Falls back to defaults if not found
   */
  async getPlatformConfig(): Promise<PlatformConfigDto> {
    try {
      // Get the first (and only) config record
      const config = await this.prisma.platformConfig.findFirst();

      if (config) {
        return {
          platformFeePercent: Number(config.platformFeePercent),
          cancellationFeePercent: Number(config.cancellationFeePercent),
          minBookingHours: config.minBookingHours,
          maxBookingHours: config.maxBookingHours,
          minAdvanceBookingHours: config.minAdvanceBookingHours,
          maxAdvanceBookingDays: config.maxAdvanceBookingDays,
          freeCancellationHours: config.freeCancellationHours,
          supportEmail: config.supportEmail ?? undefined,
          supportPhone: config.supportPhone ?? undefined,
          minAppVersion: config.minAppVersion,
          currentAppVersion: config.currentAppVersion,
        };
      }
    } catch (error) {
      this.logger.warn('Failed to fetch platform config from database, using defaults', error);
    }

    return DEFAULT_CONFIG;
  }

  /**
   * Update platform configuration (admin only)
   */
  async updatePlatformConfig(
    updates: Partial<PlatformConfigDto>,
    adminUserId: string,
  ): Promise<PlatformConfigDto> {
    // Get existing config or create new one
    const existingConfig = await this.prisma.platformConfig.findFirst();

    if (existingConfig) {
      // Update existing config
      const updated = await this.prisma.platformConfig.update({
        where: { id: existingConfig.id },
        data: {
          ...(updates.platformFeePercent !== undefined && {
            platformFeePercent: updates.platformFeePercent,
          }),
          ...(updates.cancellationFeePercent !== undefined && {
            cancellationFeePercent: updates.cancellationFeePercent,
          }),
          ...(updates.minBookingHours !== undefined && { minBookingHours: updates.minBookingHours }),
          ...(updates.maxBookingHours !== undefined && { maxBookingHours: updates.maxBookingHours }),
          ...(updates.minAdvanceBookingHours !== undefined && {
            minAdvanceBookingHours: updates.minAdvanceBookingHours,
          }),
          ...(updates.maxAdvanceBookingDays !== undefined && {
            maxAdvanceBookingDays: updates.maxAdvanceBookingDays,
          }),
          ...(updates.freeCancellationHours !== undefined && {
            freeCancellationHours: updates.freeCancellationHours,
          }),
          ...(updates.supportEmail !== undefined && { supportEmail: updates.supportEmail }),
          ...(updates.supportPhone !== undefined && { supportPhone: updates.supportPhone }),
          ...(updates.minAppVersion !== undefined && { minAppVersion: updates.minAppVersion }),
          ...(updates.currentAppVersion !== undefined && {
            currentAppVersion: updates.currentAppVersion,
          }),
          updatedBy: adminUserId,
        },
      });

      this.logger.log(`Platform config updated by admin ${adminUserId}:`, updates);

      return {
        platformFeePercent: Number(updated.platformFeePercent),
        cancellationFeePercent: Number(updated.cancellationFeePercent),
        minBookingHours: updated.minBookingHours,
        maxBookingHours: updated.maxBookingHours,
        minAdvanceBookingHours: updated.minAdvanceBookingHours,
        maxAdvanceBookingDays: updated.maxAdvanceBookingDays,
        freeCancellationHours: updated.freeCancellationHours,
        supportEmail: updated.supportEmail ?? undefined,
        supportPhone: updated.supportPhone ?? undefined,
        minAppVersion: updated.minAppVersion,
        currentAppVersion: updated.currentAppVersion,
      };
    } else {
      // Create new config with defaults merged with updates
      const newConfig = { ...DEFAULT_CONFIG, ...updates };

      const created = await this.prisma.platformConfig.create({
        data: {
          platformFeePercent: newConfig.platformFeePercent,
          cancellationFeePercent: newConfig.cancellationFeePercent,
          minBookingHours: newConfig.minBookingHours,
          maxBookingHours: newConfig.maxBookingHours,
          minAdvanceBookingHours: newConfig.minAdvanceBookingHours,
          maxAdvanceBookingDays: newConfig.maxAdvanceBookingDays,
          freeCancellationHours: newConfig.freeCancellationHours,
          supportEmail: newConfig.supportEmail,
          supportPhone: newConfig.supportPhone,
          minAppVersion: newConfig.minAppVersion,
          currentAppVersion: newConfig.currentAppVersion,
          updatedBy: adminUserId,
        },
      });

      this.logger.log(`Platform config created by admin ${adminUserId}:`, newConfig);

      return {
        platformFeePercent: Number(created.platformFeePercent),
        cancellationFeePercent: Number(created.cancellationFeePercent),
        minBookingHours: created.minBookingHours,
        maxBookingHours: created.maxBookingHours,
        minAdvanceBookingHours: created.minAdvanceBookingHours,
        maxAdvanceBookingDays: created.maxAdvanceBookingDays,
        freeCancellationHours: created.freeCancellationHours,
        supportEmail: created.supportEmail ?? undefined,
        supportPhone: created.supportPhone ?? undefined,
        minAppVersion: created.minAppVersion,
        currentAppVersion: created.currentAppVersion,
      };
    }
  }

  /**
   * Get default configuration values
   */
  getDefaultConfig(): PlatformConfigDto {
    return DEFAULT_CONFIG;
  }
}
