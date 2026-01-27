import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from './modules/cache/cache.module';
import { PrismaModule } from './prisma/prisma.module';
import { SupabaseModule } from './supabase/supabase.module';
import { IdempotentInterceptor } from './common/interceptors/idempotent.interceptor';
import { IdempotencyService } from './common/services/idempotency.service';

// Core modules
import { AdminModule } from './modules/admin/admin.module';
import { AiModule } from './modules/ai/ai.module';
import { FilesModule } from './modules/files/files.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReferralModule } from './modules/referral/referral.module';
import { SecurityModule } from './modules/security/security.module';
import { UsersModule } from './modules/users/users.module';
import { VerificationModule } from './modules/verification/verification.module';
import { SmsModule } from './modules/sms/sms.module';
import { PhoneVerificationModule } from './modules/phone-verification/phone-verification.module';

// Companion Booking System modules
import { BookingsModule } from './modules/bookings/bookings.module';
import { CompanionsModule } from './modules/companions/companions.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { EarningsModule } from './modules/earnings/earnings.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { OccasionsModule } from './modules/occasions/occasions.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { SafetyModule } from './modules/safety/safety.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { QueueModule } from './modules/queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [() => ({
        // Supabase
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
        JWT_SECRET: process.env.JWT_SECRET,

        // Database (Prisma)
        DATABASE_URL: process.env.DATABASE_URL,
        DIRECT_URL: process.env.DIRECT_URL,

        // Supabase Anon Key (for client-side auth)
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,

        // AI Services
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,

        // Social Media
        TWITTER_API_KEY: process.env.TWITTER_API_KEY,
        LINKEDIN_API_KEY: process.env.LINKEDIN_API_KEY,
        TWITTER_CONSUMER_KEY: process.env.TWITTER_CONSUMER_KEY,
        TWITTER_CONSUMER_SECRET: process.env.TWITTER_CONSUMER_SECRET,

        // URLs
        CLIENT_URL: process.env.CLIENT_URL,
        SERVER_URL: process.env.SERVER_URL,

        // Redis
        REDIS_HOST: process.env.REDIS_HOST || 'localhost',
        REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
        REDIS_PASSWORD: process.env.REDIS_PASSWORD,
        REDIS_TLS: process.env.NODE_ENV === 'production',
        REDIS_URL: process.env.REDIS_URL,

        // Payments
        VNPAY_TMN_CODE: process.env.VNPAY_TMN_CODE,
        VNPAY_HASH_SECRET: process.env.VNPAY_HASH_SECRET,
        VNPAY_URL: process.env.VNPAY_URL,
        MOMO_PARTNER_CODE: process.env.MOMO_PARTNER_CODE,
        MOMO_ACCESS_KEY: process.env.MOMO_ACCESS_KEY,
        MOMO_SECRET_KEY: process.env.MOMO_SECRET_KEY,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

        // Notifications
        SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
        TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
        TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,

        // File Storage (Cloudflare R2)
        R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
        R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
        R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
        R2_ENDPOINT: process.env.R2_ENDPOINT,
        R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,

        // zkTLS Verification
        ZKTLS_API_KEY: process.env.ZKTLS_API_KEY,
        ZKTLS_API_URL: process.env.ZKTLS_API_URL,

        // Monitoring
        SENTRY_DSN: process.env.SENTRY_DSN,
      })],
    }),

    // Core Infrastructure
    PrismaModule,
    ScheduleModule.forRoot(),
    CacheModule,
    QueueModule,
    SmsModule,

    // Auth
    AuthModule,
    SupabaseModule,

    // Core modules
    UsersModule,
    VerificationModule,
    MessagingModule,
    AiModule,
    NotificationsModule,
    PaymentsModule,
    ModerationModule,
    AdminModule,
    FilesModule,
    SecurityModule,
    ReferralModule,
    PhoneVerificationModule,

    // Companion Booking System
    CompanionsModule,
    BookingsModule,
    DashboardModule,
    EarningsModule,
    FavoritesModule,
    OccasionsModule,
    RecommendationsModule,
    SafetyModule,
    WalletModule,
  ],
  controllers: [AppController],
  providers: [
    // Global idempotency support for mutation endpoints
    IdempotencyService,
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotentInterceptor,
    },
  ],
})
export class AppModule { } 
