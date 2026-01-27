import { Global, Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../cache/cache.service';
import { SMS_PROVIDER, SmsProvider } from './sms-provider.interface';
import { ZnsProvider } from './providers/zns.provider';
import { SpeedSmsProvider } from './providers/speedsms.provider';

type SmsProviderType = 'zns' | 'speedsms' | 'auto';

/**
 * SMS Module
 *
 * Provides SMS/OTP delivery abstraction with multiple provider support.
 *
 * Configuration:
 * - SMS_PROVIDER=zns       → Use Zalo ZNS only
 * - SMS_PROVIDER=speedsms  → Use SpeedSMS only
 * - SMS_PROVIDER=auto      → Auto-select first configured provider (default)
 *
 * Provider priority in auto mode: zns → speedsms
 */
@Global()
@Module({
  providers: [
    ZnsProvider,
    SpeedSmsProvider,
    {
      provide: SMS_PROVIDER,
      useFactory: (
        configService: ConfigService,
        znsProvider: ZnsProvider,
        speedSmsProvider: SpeedSmsProvider,
      ): SmsProvider => {
        const logger = new Logger('SmsModule');
        const providerType = (configService.get<string>('SMS_PROVIDER') || 'auto') as SmsProviderType;

        // Explicit provider selection
        if (providerType === 'zns') {
          if (!znsProvider.isConfigured()) {
            logger.warn('ZNS provider selected but not configured');
          }
          logger.log('Using Zalo ZNS as SMS provider');
          return znsProvider;
        }

        if (providerType === 'speedsms') {
          if (!speedSmsProvider.isConfigured()) {
            logger.warn('SpeedSMS provider selected but not configured');
          }
          logger.log('Using SpeedSMS as SMS provider');
          return speedSmsProvider;
        }

        // Auto-select first configured provider
        if (znsProvider.isConfigured()) {
          logger.log('Auto-selected Zalo ZNS as SMS provider');
          return znsProvider;
        }

        if (speedSmsProvider.isConfigured()) {
          logger.log('Auto-selected SpeedSMS as SMS provider');
          return speedSmsProvider;
        }

        // Fallback to ZNS (will fail gracefully on send)
        logger.warn('No SMS provider configured, defaulting to ZNS');
        return znsProvider;
      },
      inject: [ConfigService, ZnsProvider, SpeedSmsProvider],
    },
  ],
  exports: [SMS_PROVIDER, ZnsProvider, SpeedSmsProvider],
})
export class SmsModule {}
