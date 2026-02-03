import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

// ============ Request DTOs ============

export class CreateTopupDto {
  @IsInt()
  @Min(100000, { message: 'Minimum topup amount is 100,000 VND' })
  @Max(50000000, { message: 'Maximum topup amount is 50,000,000 VND' })
  amount: number;
}

export class CreateBookingPaymentRequestDto {
  @IsUUID()
  bookingId: string;
}

export class GetTransactionsQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  type?: 'TOPUP' | 'BOOKING' | 'all';
}

// ============ Response DTOs ============

export interface BankDeeplinkInfo {
  appId: string;
  name: string;
  logo: string;
  deeplink: string;
}

export interface TopupResponse {
  id: string;
  code: string;
  amount: number;
  qrUrl: string;
  deeplinks: BankDeeplinkInfo[];
  accountInfo: {
    bankCode: string;
    accountNumber: string;
    accountName: string;
  };
  expiresAt: string;
}

export interface BookingPaymentRequestResponse {
  id: string;
  code: string;
  amount: number;
  bookingId: string;
  qrUrl: string;
  deeplinks: BankDeeplinkInfo[];
  accountInfo: {
    bankCode: string;
    accountNumber: string;
    accountName: string;
  };
  expiresAt: string;
}

export interface WalletBalanceResponse {
  balance: number;
  pendingTopups: number;
  currency: string;
}

export interface PaymentRequestItem {
  id: string;
  code: string;
  type: 'TOPUP' | 'BOOKING';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'FAILED';
  bookingId: string | null;
  gateway: string | null;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string;
}

export interface TransactionsResponse {
  transactions: PaymentRequestItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaymentRequestStatusResponse {
  id: string;
  code: string;
  status: 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'FAILED';
  amount: number;
  bookingId: string | null;
  completedAt: string | null;
}

// ============ SePay Webhook DTO ============

export class SepayWebhookDto {
  @IsInt()
  id: number;

  @IsString()
  gateway: string;

  @IsString()
  transactionDate: string;

  @IsString()
  accountNumber: string;

  @IsOptional()
  @IsString()
  code: string | null;

  @IsString()
  content: string;

  @IsString()
  transferType: string;

  @IsInt()
  transferAmount: number;

  @IsInt()
  accumulated: number;

  @IsOptional()
  @IsString()
  subAccount: string | null;

  @IsString()
  referenceCode: string;

  @IsOptional()
  @IsString()
  description: string;
}
