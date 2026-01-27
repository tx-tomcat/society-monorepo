import { apiClient } from '../client';

// ============ Types ============

export interface TopupResponse {
  id: string;
  code: string;
  amount: number;
  qrUrl: string;
  deeplinks: Record<string, string>;
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
  deeplinks: Record<string, string>;
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

export interface CanPayResponse {
  canPay: boolean;
  balance: number;
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
    type?: 'TOPUP' | 'BOOKING' | 'all',
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
};
