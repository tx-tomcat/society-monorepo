import { Module } from '@nestjs/common';
import { SecurityModule } from '../security/security.module';
import { SmsModule } from '../sms/sms.module';
import { PhoneVerificationController } from './phone-verification.controller';
import { PhoneVerificationService } from './phone-verification.service';
import { PhoneVerifiedGuard } from './guards/phone-verified.guard';

@Module({
  imports: [SecurityModule, SmsModule],
  controllers: [PhoneVerificationController],
  providers: [PhoneVerificationService, PhoneVerifiedGuard],
  exports: [PhoneVerificationService, PhoneVerifiedGuard],
})
export class PhoneVerificationModule {}
