import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

// ============================================
// Request DTOs
// ============================================

export class CreateBankAccountDto {
  @IsString()
  bankName: string;

  @IsString()
  accountNumber: string;

  @IsString()
  accountHolder: string;
}

export class WithdrawFundsDto {
  @IsNumber()
  @Min(100000) // Minimum 100,000 VND
  amount: number;

  @IsString()
  bankAccountId: string;
}

export class GetTransactionsQueryDto {
  @IsOptional()
  @IsEnum(['earning', 'withdrawal', 'bonus', 'refund'])
  type?: string;

  @IsOptional()
  @IsEnum(['week', 'month', 'year'])
  period?: 'week' | 'month' | 'year';

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}

// ============================================
// Response Types
// ============================================

export interface EarningsOverviewResponse {
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  periodStats: PeriodStats;
}

export interface PeriodStats {
  thisWeek: PeriodData;
  thisMonth: PeriodData;
  thisYear: PeriodData;
}

export interface PeriodData {
  amount: number;
  bookings: number;
  change: number;
}

export interface TransactionItem {
  id: string;
  type: 'earning' | 'withdrawal' | 'bonus' | 'refund';
  description: string;
  amount: number;
  createdAt: string;
  status: 'completed' | 'pending' | 'failed';
  bookingId?: string;
}

export interface BankAccountItem {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isDefault: boolean;
  createdAt: string;
}

export interface WithdrawalResponse {
  id: string;
  amount: number;
  fee: number;
  netAmount: number;
  bankAccount: {
    bankName: string;
    accountNumber: string;
  };
  estimatedArrival: string;
  status: string;
}
