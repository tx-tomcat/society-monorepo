import { Module } from '@nestjs/common';
import { VerificationController } from './controllers/verification.controller';
import { VerificationService } from './services/verification.service';
import { IncomeVerificationService } from './services/income-verification.service';
import { EducationVerificationService } from './services/education-verification.service';
import { ZktlsService } from './services/zktls.service';

@Module({
  controllers: [VerificationController],
  providers: [
    VerificationService,
    IncomeVerificationService,
    EducationVerificationService,
    ZktlsService,
  ],
  exports: [VerificationService],
})
export class VerificationModule {}
