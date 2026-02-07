import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import type {
  AddBankAccountData,
  WithdrawRequest,
} from '../api/services/earnings.service';
import { earningsService } from '../api/services/earnings.service';
import { useAuth } from './use-auth';

/**
 * React Query hook to fetch earnings overview (for companions)
 */
export function useEarningsOverview() {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['earnings', 'overview'],
    queryFn: () => earningsService.getEarningsOverview(),
    enabled: isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * React Query hook to fetch earnings transaction history (for companions)
 */
export function useTransactionHistory(
  page = 1,
  limit = 20,
  period?: 'week' | 'month' | 'year'
) {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['earnings', 'transactions', { page, limit, period }],
    queryFn: () =>
      earningsService.getTransactionHistory(page, limit, period),
    enabled: isSignedIn,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * React Query infinite query hook for paginated transaction history
 */
export function useInfiniteTransactionHistory(
  limit = 20,
  period?: 'week' | 'month' | 'year'
) {
  const { isSignedIn } = useAuth();

  return useInfiniteQuery({
    queryKey: ['earnings', 'transactions', 'infinite', { limit, period }],
    queryFn: ({ pageParam = 1 }) =>
      earningsService.getTransactionHistory(pageParam, limit, period),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / lastPage.limit);
      const nextPage = lastPage.page + 1;
      return nextPage <= totalPages ? nextPage : undefined;
    },
    enabled: isSignedIn,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * React Query hook to fetch withdrawal history (for companions)
 */
export function useWithdrawalHistory() {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['earnings', 'withdrawals'],
    queryFn: () => earningsService.getWithdrawalHistory(),
    enabled: isSignedIn,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * React Query mutation hook to request a withdrawal (for companions)
 */
export function useRequestWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: WithdrawRequest) =>
      earningsService.requestWithdrawal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
    },
  });
}

/**
 * React Query hook to fetch bank accounts (for companions)
 */
export function useBankAccounts() {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['bank-accounts'],
    queryFn: () => earningsService.getBankAccounts(),
    enabled: isSignedIn,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * React Query mutation hook to add a bank account (for companions)
 */
export function useAddBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddBankAccountData) =>
      earningsService.addBankAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });
}

/**
 * React Query mutation hook to delete a bank account (for companions)
 */
export function useDeleteBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) =>
      earningsService.deleteBankAccount(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });
}
