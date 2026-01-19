import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  PaymentProvider,
  RefundRequest,
} from '../api/services/payments.service';
import { paymentsService } from '../api/services/payments.service';
import { useAuth } from './use-auth';

/**
 * React Query mutation hook to create a booking payment
 */
export function useCreateBookingPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      provider,
    }: {
      bookingId: string;
      provider: PaymentProvider;
    }) => paymentsService.createBookingPayment(bookingId, provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

/**
 * React Query hook to fetch single payment
 */
export function usePayment(paymentId: string) {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['payment', paymentId],
    queryFn: () => paymentsService.getPayment(paymentId),
    enabled: isSignedIn && !!paymentId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * React Query hook to fetch payment history
 */
export function usePaymentHistory(page = 1, limit = 20) {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['payments', 'history', { page, limit }],
    queryFn: () => paymentsService.getPaymentHistory(page, limit),
    enabled: isSignedIn,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * React Query mutation hook to request a refund
 */
export function useRequestRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      paymentId,
      data,
    }: {
      paymentId: string;
      data: RefundRequest;
    }) => paymentsService.requestRefund(paymentId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['payment', variables.paymentId],
      });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}
