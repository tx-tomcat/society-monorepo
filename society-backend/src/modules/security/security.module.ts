import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { CacheModule } from '../cache/cache.module';
import { IpBlockGuard } from './guards/ip-block.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { CaptchaService } from './services/captcha.service';
import { FraudDetectionService } from './services/fraud-detection.service';
import { RateLimiterService } from './services/rate-limiter.service';
import { SecurityService } from './services/security.service';

@Module({
  imports: [ConfigModule, PrismaModule, CacheModule],
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
export class SecurityModule { }
