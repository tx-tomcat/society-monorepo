import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { SecurityModule } from '../security/security.module';
import { CompanionsModule } from '../companions/companions.module';
import { VnpayService } from './services/vnpay.service';
import { MomoService } from './services/momo.service';
import { BankTransferService } from './services/bank-transfer.service';
import { PaymentsService } from './services/payments.service';
import { PaymentsController } from './controllers/payments.controller';
import { WebhooksController } from './controllers/webhooks.controller';

@Module({
  imports: [ConfigModule, PrismaModule, SecurityModule, forwardRef(() => CompanionsModule)],
  controllers: [PaymentsController, WebhooksController],
  providers: [VnpayService, MomoService, BankTransferService, PaymentsService],
  exports: [PaymentsService, VnpayService, MomoService, BankTransferService],
})
export class PaymentsModule {}
