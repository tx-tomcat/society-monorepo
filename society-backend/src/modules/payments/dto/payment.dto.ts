import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  MaxLength,
  IsUUID,
} from 'class-validator';

export enum PaymentProvider {
  VNPAY = 'VNPAY',
  MOMO = 'MOMO',
  STRIPE = 'STRIPE',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export class CreateBookingPaymentDto {
  @IsUUID()
  bookingId: string;

  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @IsOptional()
  @IsString()
  returnUrl?: string;
}

export class RefundRequestDto {
  @IsString()
  @MaxLength(1000)
  reason: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  amount?: number; // Partial refund amount
}

// VNPay specific
export class VnpayCallbackDto {
  vnp_TmnCode: string;
  vnp_Amount: string;
  vnp_BankCode: string;
  vnp_BankTranNo?: string;
  vnp_CardType?: string;
  vnp_PayDate?: string;
  vnp_OrderInfo: string;
  vnp_TransactionNo: string;
  vnp_ResponseCode: string;
  vnp_TransactionStatus: string;
  vnp_TxnRef: string;
  vnp_SecureHash: string;
}

// Momo specific
export class MomoCallbackDto {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  orderInfo: string;
  orderType: string;
  transId: number;
  resultCode: number;
  message: string;
  payType: string;
  responseTime: number;
  extraData: string;
  signature: string;
}

// Bank transfer webhook - incoming payment notification
// Example note formats: "order-123", "ORDER-abc123", "booking-uuid"
export class BankTransferWebhookDto {
  @IsString()
  transactionId: string; // Bank's transaction reference

  @IsInt()
  @Min(1)
  amount: number; // Amount in VND

  @IsString()
  transferNote: string; // Contains order reference like "order-123"

  @IsString()
  senderAccount?: string; // Sender's bank account (optional)

  @IsString()
  senderName?: string; // Sender's name (optional)

  @IsString()
  bankCode: string; // Bank code (e.g., VCB, TCB, MB)

  @IsString()
  signature: string; // HMAC signature for verification

  @IsOptional()
  @IsString()
  timestamp?: string; // Transaction timestamp from bank
}
