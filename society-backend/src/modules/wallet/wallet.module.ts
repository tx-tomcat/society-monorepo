import { IdempotencyService } from '@/common/services/idempotency.service';
import { SepayService } from '@/modules/payments/services/sepay.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { SepayWebhookController, WalletController } from './wallet.controller';
import { WalletScheduler } from './wallet.scheduler';
import { WalletService } from './wallet.service';

@Module({
  imports: [ConfigModule, PrismaModule, ScheduleModule.forRoot()],
  controllers: [WalletController, SepayWebhookController],
  providers: [WalletService, SepayService, WalletScheduler, IdempotencyService],
  exports: [WalletService, SepayService],
})
export class WalletModule { }
