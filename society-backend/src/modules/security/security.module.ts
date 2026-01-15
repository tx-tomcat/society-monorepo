import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { CacheModule } from '../cache/cache.module';
import { RateLimiterService } from './services/rate-limiter.service';
import { FraudDetectionService } from './services/fraud-detection.service';
import { SecurityService } from './services/security.service';
import { CaptchaService } from './services/captcha.service';
import { SecurityController, SecurityAdminController } from './controllers/security.controller';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { IpBlockGuard } from './guards/ip-block.guard';

@Module({
  imports: [ConfigModule, PrismaModule, CacheModule],
  controllers: [SecurityController, SecurityAdminController],
  providers: [
    RateLimiterService,
    FraudDetectionService,
    SecurityService,
    CaptchaService,
    RateLimitGuard,
    IpBlockGuard,
  ],
  exports: [
    SecurityService,
    RateLimiterService,
    FraudDetectionService,
    CaptchaService,
    RateLimitGuard,
    IpBlockGuard,
  ],
})
export class SecurityModule {}
