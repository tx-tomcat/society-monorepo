import { apiClient } from '../client';
import type {
  PaymentRequestStatus,
  PaymentRequestType,
} from '../enums';

// Re-export enums for convenience
export { PaymentRequestStatus, PaymentRequestType } from '../enums';

// ============ Types ============

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
  type: PaymentRequestType;
  amount: number;
  status: PaymentRequestStatus;
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

export interface CanPayResponse {
  canPay: boolean;
  balance: number;
}

export interface PaymentRequestStatusResponse {
  id: string;
  code: string;
  status: 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'FAILED';
  amount: number;
  bookingId: string | null;
  completedAt: string | null;
}

// ============ API Service ============

export const walletService = {
  /**
   * Create a topup payment request
   */
  createTopup: async (amount: number): Promise<TopupResponse> => {
    return apiClient.post<TopupResponse>('/wallet/topup', { amount });
  },

  /**
   * Create a booking payment request (QR for direct booking payment)
   */
  createBookingPaymentRequest: async (bookingId: string): Promise<BookingPaymentRequestResponse> => {
    return apiClient.post<BookingPaymentRequestResponse>('/wallet/booking-payment', { bookingId });
  },

  /**
   * Get wallet balance
   */
  getBalance: async (): Promise<WalletBalanceResponse> => {
    return apiClient.get<WalletBalanceResponse>('/wallet/balance');
  },

  /**
   * Get payment request transactions
   */
  getTransactions: async (
    page: number = 1,
    limit: number = 20,
    type?: PaymentRequestType | 'all',
  ): Promise<TransactionsResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(type && { type }),
    });
    return apiClient.get<TransactionsResponse>(`/wallet/transactions?${params}`);
  },

  /**
   * Check if user can pay from wallet
   */
  canPayFromWallet: async (amount: number): Promise<CanPayResponse> => {
    return apiClient.get<CanPayResponse>(`/wallet/can-pay?amount=${amount}`);
  },

  /**
   * Get payment request status (for polling)
   */
  getPaymentRequestStatus: async (
    requestId: string
  ): Promise<PaymentRequestStatusResponse> => {
    return apiClient.get<PaymentRequestStatusResponse>(
      `/wallet/payment-request/${requestId}/status`
    );
  },
};
