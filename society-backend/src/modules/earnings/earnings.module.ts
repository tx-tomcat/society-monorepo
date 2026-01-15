import { Module } from '@nestjs/common';
import { EarningsController } from './controllers/earnings.controller';
import { EarningsService } from './services/earnings.service';
import { VerificationModule } from '../verification/verification.module';

@Module({
  imports: [VerificationModule],
  controllers: [EarningsController],
  providers: [EarningsService],
  exports: [EarningsService],
})
export class EarningsModule {}
