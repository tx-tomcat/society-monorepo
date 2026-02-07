import { apiClient } from '../client';

export type EarningsStatus =
  | 'pending'
  | 'available'
  | 'withdrawn'
  | 'cancelled';

export type WithdrawalStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export interface Earning {
  id: string;
  companionId: string;
  bookingId: string;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  status: EarningsStatus;
  releasedAt?: string;
  createdAt: string;
  booking?: {
    bookingNumber: string;
    occasionType: string;
    completedAt: string;
  };
}

export interface EarningsOverview {
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  totalWithdrawn: number;
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
  weeklyChange: number;
  monthlyChange: number;
}

export interface EarningsTransaction {
  id: string;
  type: 'earning' | 'withdrawal' | 'refund' | 'bonus';
  amount: number;
  status: string;
  description: string;
  createdAt: string;
}

export interface EarningsHistoryResponse {
  transactions: EarningsTransaction[];
  total: number;
  page: number;
  limit: number;
}

export interface BankAccount {
  id: string;
  companionId: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isPrimary: boolean;
  isVerified: boolean;
  createdAt: string;
}

export interface AddBankAccountData {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface Withdrawal {
  id: string;
  companionId: string;
  bankAccountId: string;
  amount: number;
  status: WithdrawalStatus;
  requestedAt: string;
  completedAt?: string;
  bankAccount: BankAccount;
}

export interface WithdrawalHistoryItem {
  id: string;
  amount: number;
  status: WithdrawalStatus;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  requestedAt: string;
  completedAt: string | null;
}

export interface WithdrawRequest {
  bankAccountId: string;
  amount: number;
}

/**
 * Earnings API Service
 */
export const earningsService = {
  /**
   * Get earnings overview
   */
  async getEarningsOverview(): Promise<EarningsOverview> {
    return apiClient.get('/companion/earnings');
  },

  /**
   * Get earnings transaction history
   */
  async getTransactionHistory(
    page = 1,
    limit = 20,
    period?: 'week' | 'month' | 'year'
  ): Promise<EarningsHistoryResponse> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (period) params.append('period', period);
    return apiClient.get(`/companion/earnings/transactions?${params}`);
  },

  /**
   * Get bank accounts
   */
  async getBankAccounts(): Promise<{ accounts: BankAccount[] }> {
    return apiClient.get('/companion/earnings/bank-accounts');
  },

  /**
   * Add bank account
   */
  async addBankAccount(data: AddBankAccountData): Promise<BankAccount> {
    return apiClient.post('/companion/earnings/bank-accounts', data);
  },

  /**
   * Delete bank account
   */
  async deleteBankAccount(accountId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/companion/earnings/bank-accounts/${accountId}`);
  },

  /**
   * Get withdrawal history
   */
  async getWithdrawalHistory(): Promise<{ withdrawals: WithdrawalHistoryItem[] }> {
    return apiClient.get('/companion/earnings/withdrawals');
  },

  /**
   * Request withdrawal
   */
  async requestWithdrawal(data: WithdrawRequest): Promise<Withdrawal> {
    return apiClient.post('/companion/earnings/withdraw', data);
  },
};
