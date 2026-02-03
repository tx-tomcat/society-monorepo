import { Module, forwardRef } from '@nestjs/common';
import { CompanionsController } from './controllers/companions.controller';
import { CompanionsService } from './services/companions.service';
import { CompanionTasks } from './tasks/companion.tasks';
import { PaymentsModule } from '../payments/payments.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [forwardRef(() => PaymentsModule), WalletModule],
  controllers: [CompanionsController],
  providers: [CompanionsService, CompanionTasks],
  exports: [CompanionsService],
})
export class CompanionsModule {}
