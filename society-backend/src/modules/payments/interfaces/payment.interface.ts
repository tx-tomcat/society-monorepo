import { PaymentProvider } from '../dto/payment.dto';

export interface PaymentInitResult {
  paymentId: string;
  provider: PaymentProvider;
  paymentUrl: string;
  expiresAt?: Date;
}

export interface PaymentCallbackResult {
  success: boolean;
  paymentId: string;
  transactionId?: string;
  amount: number;
  error?: string;
}

export interface PaymentHistoryItem {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  paidAt: Date | null;
  createdAt: Date;
}

export interface PaymentDetails {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  providerTxnId: string | null;
  paidAt: Date | null;
  releasedAt: Date | null;
  refundedAt: Date | null;
  createdAt: Date;
  booking: {
    id: string;
    startDatetime: Date;
    durationHours: number;
    totalPrice: number;
    companion: {
      id: string;
      fullName: string | null;
    };
  };
}
