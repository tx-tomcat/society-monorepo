import { Injectable, Logger } from '@nestjs/common';

interface BankCallbackData {
  accountNumber?: string;
  verified?: boolean;
  annualIncome?: number;
  currency?: string;
}

@Injectable()
export class IncomeVerificationService {
  private readonly logger = new Logger(IncomeVerificationService.name);

  async verifyWithBank(userId: string, bankCode: string, accessToken: string) {
    this.logger.log(`Verifying income for user ${userId} with bank ${bankCode}`);
    return { status: 'pending', message: 'Verification in progress' };
  }

  async handleBankCallback(verificationId: string, data: BankCallbackData) {
    return { verified: data.verified ?? false };
  }
}
