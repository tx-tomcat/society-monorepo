import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { walletService, WalletBalanceResponse, TransactionsResponse, TopupResponse } from '../api/services/wallet.service';

// Query keys
export const walletKeys = {
  all: ['wallet'] as const,
  balance: () => [...walletKeys.all, 'balance'] as const,
  transactions: (page: number, type?: string) => [...walletKeys.all, 'transactions', page, type] as const,
  canPay: (amount: number) => [...walletKeys.all, 'can-pay', amount] as const,
};

/**
 * Get wallet balance
 */
export function useWalletBalance() {
  return useQuery<WalletBalanceResponse>({
    queryKey: walletKeys.balance(),
    queryFn: () => walletService.getBalance(),
  });
}

/**
 * Get wallet transactions
 */
export function useWalletTransactions(page: number = 1, type?: 'TOPUP' | 'BOOKING' | 'all') {
  return useQuery<TransactionsResponse>({
    queryKey: walletKeys.transactions(page, type),
    queryFn: () => walletService.getTransactions(page, 20, type),
  });
}

/**
 * Check if can pay from wallet
 */
export function useCanPayFromWallet(amount: number) {
  return useQuery({
    queryKey: walletKeys.canPay(amount),
    queryFn: () => walletService.canPayFromWallet(amount),
    enabled: amount > 0,
  });
}

/**
 * Create topup mutation
 */
export function useCreateTopup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amount: number) => walletService.createTopup(amount),
    onSuccess: () => {
      // Invalidate balance and transactions after creating topup
      queryClient.invalidateQueries({ queryKey: walletKeys.balance() });
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}

/**
 * Create booking payment request mutation
 */
export function useCreateBookingPaymentRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => walletService.createBookingPaymentRequest(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}
