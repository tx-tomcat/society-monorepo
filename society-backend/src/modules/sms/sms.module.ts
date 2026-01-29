import { Global, Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../cache/cache.service';
import { SMS_PROVIDER, SmsProvider } from './sms-provider.interface';
import { ZnsProvider } from './providers/zns.provider';
import { SpeedSmsProvider } from './providers/speedsms.provider';
import { EsmsProvider } from './providers/esms.provider';

type SmsProviderType = 'zns' | 'speedsms' | 'esms' | 'auto';

/**
 * SMS Module
 *
 * Provides SMS/OTP delivery abstraction with multiple provider support.
 *
 * Configuration:
 * - SMS_PROVIDER=zns       → Use Zalo ZNS only (direct API)
 * - SMS_PROVIDER=speedsms  → Use SpeedSMS only
 * - SMS_PROVIDER=esms      → Use eSMS Zalo ZNS
 * - SMS_PROVIDER=auto      → Auto-select first configured provider (default)
 *
 * Provider priority in auto mode: esms → zns → speedsms
 */
@Global()
@Module({
  providers: [
    ZnsProvider,
    SpeedSmsProvider,
    EsmsProvider,
    {
      provide: SMS_PROVIDER,
      useFactory: (
        configService: ConfigService,
        znsProvider: ZnsProvider,
        speedSmsProvider: SpeedSmsProvider,
        esmsProvider: EsmsProvider,
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

        if (providerType === 'esms') {
          if (!esmsProvider.isConfigured()) {
            logger.warn('eSMS provider selected but not configured');
          }
          logger.log('Using eSMS Zalo ZNS as SMS provider');
          return esmsProvider;
        }

        // Auto-select first configured provider (priority: esms → zns → speedsms)
        if (esmsProvider.isConfigured()) {
          logger.log('Auto-selected eSMS Zalo ZNS as SMS provider');
          return esmsProvider;
        }

        if (znsProvider.isConfigured()) {
          logger.log('Auto-selected Zalo ZNS as SMS provider');
          return znsProvider;
        }

        if (speedSmsProvider.isConfigured()) {
          logger.log('Auto-selected SpeedSMS as SMS provider');
          return speedSmsProvider;
        }

        // Fallback to eSMS (will fail gracefully on send)
        logger.warn('No SMS provider configured, defaulting to eSMS');
        return esmsProvider;
      },
      inject: [ConfigService, ZnsProvider, SpeedSmsProvider, EsmsProvider],
    },
  ],
  exports: [SMS_PROVIDER, ZnsProvider, SpeedSmsProvider, EsmsProvider],
})
export class SmsModule {}
