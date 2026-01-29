import { apiClient } from '../client';
import type { PaymentStatus } from './bookings.service';
// Re-export PaymentStatus from bookings.service.ts for consumers of payments.service
export type { PaymentStatus } from './bookings.service';

// PaymentProvider enum values must match backend enum (uppercase)
export type PaymentProvider = 'VNPAY' | 'MOMO' | 'STRIPE' | 'BANK_TRANSFER';

export interface Payment {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  providerTxnId?: string;
  status: PaymentStatus;
  paidAt?: string;
  releasedAt?: string;
  refundedAt?: string;
  createdAt: string;
}

export interface PaymentInitiateResponse {
  paymentId: string;
  paymentUrl: string;
  qrCode?: string;
  expiresAt: string;
}

export interface PaymentHistoryResponse {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
}

export interface RefundRequest {
  reason: string;
  amount?: number;
}

export interface RefundResponse {
  success: boolean;
  refundId: string;
  amount: number;
  status: string;
}

/**
 * Payments API Service
 */
export const paymentsService = {
  /**
   * Create booking payment
   */
  async createBookingPayment(
    bookingId: string,
    provider: PaymentProvider
  ): Promise<PaymentInitiateResponse> {
    return apiClient.post('/payments/booking', { bookingId, provider });
  },

  /**
   * Get payment history
   */
  async getPaymentHistory(
    page = 1,
    limit = 20
  ): Promise<PaymentHistoryResponse> {
    return apiClient.get(`/payments/history?page=${page}&limit=${limit}`);
  },

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string): Promise<Payment> {
    return apiClient.get(`/payments/${paymentId}`);
  },

  /**
   * Request refund
   */
  async requestRefund(
    paymentId: string,
    data: RefundRequest
  ): Promise<RefundResponse> {
    return apiClient.post(`/payments/${paymentId}/refund`, data);
  },
};
