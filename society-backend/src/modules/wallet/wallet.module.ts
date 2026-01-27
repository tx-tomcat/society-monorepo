import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '@/prisma/prisma.module';
import { SepayService } from '@/modules/payments/services/sepay.service';
import { IdempotencyService } from '@/common/services/idempotency.service';
import { WalletService } from './wallet.service';
import { WalletController, SepayWebhookController } from './wallet.controller';
import { WalletScheduler } from './wallet.scheduler';

@Module({
  imports: [ConfigModule, PrismaModule, ScheduleModule.forRoot()],
  controllers: [WalletController, SepayWebhookController],
  providers: [WalletService, SepayService, WalletScheduler, IdempotencyService],
  exports: [WalletService, SepayService],
})
export class WalletModule {}
