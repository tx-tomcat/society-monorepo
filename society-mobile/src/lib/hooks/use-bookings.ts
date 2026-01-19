import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  BookingStatus,
  CreateBookingData,
  SubmitReviewData,
} from '../api/services/bookings.service';
import { bookingsService } from '../api/services/bookings.service';
import { useAuth } from './use-auth';

/**
 * React Query hook to fetch hirer's bookings
 */
export function useBookings(status?: BookingStatus, page = 1, limit = 20) {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['bookings', 'hirer', { status, page, limit }],
    queryFn: () =>
      bookingsService.getHirerBookings(status, page, limit),
    enabled: isSignedIn,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * React Query hook to fetch companion's bookings
 */
export function useCompanionBookings(
  status?: BookingStatus,
  page = 1,
  limit = 20
) {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['bookings', 'companion', { status, page, limit }],
    queryFn: () =>
      bookingsService.getCompanionBookings(status, page, limit),
    enabled: isSignedIn,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * React Query hook to fetch single booking
 */
export function useBooking(bookingId: string) {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingsService.getBooking(bookingId),
    enabled: isSignedIn && !!bookingId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * React Query mutation hook to create a booking
 */
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBookingData) =>
      bookingsService.createBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

/**
 * React Query mutation hook to update booking status
 */
export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      status,
    }: {
      bookingId: string;
      status: BookingStatus;
    }) => bookingsService.updateBookingStatus(bookingId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({
        queryKey: ['booking', variables.bookingId],
      });
    },
  });
}

/**
 * React Query mutation hook to cancel a booking
 */
export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      reason,
    }: {
      bookingId: string;
      reason?: string;
    }) => bookingsService.cancelBooking(bookingId, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({
        queryKey: ['booking', variables.bookingId],
      });
    },
  });
}

/**
 * React Query mutation hook to accept a booking (for companions)
 */
export function useAcceptBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) =>
      bookingsService.acceptBooking(bookingId),
    onSuccess: (_, bookingId) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
    },
  });
}

/**
 * React Query mutation hook to decline a booking (for companions)
 */
export function useDeclineBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      reason,
    }: {
      bookingId: string;
      reason?: string;
    }) => bookingsService.declineBooking(bookingId, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({
        queryKey: ['booking', variables.bookingId],
      });
    },
  });
}

/**
 * React Query mutation hook to complete a booking (for companions)
 */
export function useCompleteBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) =>
      bookingsService.completeBooking(bookingId),
    onSuccess: (_, bookingId) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
    },
  });
}

/**
 * React Query mutation hook to submit a review for a booking
 */
export function useSubmitBookingReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      data,
    }: {
      bookingId: string;
      data: SubmitReviewData;
    }) => bookingsService.submitReview(bookingId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['booking', variables.bookingId],
      });
      queryClient.invalidateQueries({ queryKey: ['companion'] });
    },
  });
}

/**
 * React Query hook to fetch pending booking requests (for companions)
 */
export function useBookingRequests() {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['bookings', 'requests'],
    queryFn: () => bookingsService.getBookingRequests(),
    enabled: isSignedIn,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * React Query hook to fetch companion schedule
 */
export function useCompanionSchedule(startDate: string, endDate: string) {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['bookings', 'schedule', startDate, endDate],
    queryFn: () =>
      bookingsService.getCompanionSchedule(startDate, endDate),
    enabled: isSignedIn && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * React Query mutation hook for emergency cancellation
 */
export function useEmergencyCancel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      reason,
    }: {
      bookingId: string;
      reason: string;
    }) => bookingsService.emergencyCancel(bookingId, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({
        queryKey: ['booking', variables.bookingId],
      });
    },
  });
}
