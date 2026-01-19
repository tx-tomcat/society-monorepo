import { apiClient } from '../client';
import type { Companion, ServiceType } from './companions.service';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'disputed'
  | 'expired';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'held'
  | 'released'
  | 'refunded'
  | 'partial_refund'
  | 'failed';

export interface BookingPricing {
  hourlyRate: number;
  hours: number;
  basePrice: number;
  platformFee: number;
  surgeFee: number;
  totalPrice: number;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  hirerId: string;
  companionId: string;
  status: BookingStatus;
  occasionType: ServiceType;
  startDatetime: string;
  endDatetime: string;
  durationHours: number;
  locationAddress: string;
  locationLat?: number;
  locationLng?: number;
  specialRequests?: string;
  basePrice: number;
  platformFee: number;
  surgeFee: number;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  cancelledBy?: string;
  cancelReason?: string;
  requestExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
  companion: Companion;
  hirer: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    isVerified: boolean;
    trustScore: number;
  };
}

export interface CreateBookingData {
  companionId: string;
  occasionType: ServiceType;
  startDatetime: string;
  endDatetime: string;
  locationAddress: string;
  locationLat?: number;
  locationLng?: number;
  specialRequests?: string;
}

export interface BookingListResponse {
  bookings: Booking[];
  total: number;
  page: number;
  limit: number;
}

export interface BookingReview {
  id: string;
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
  tags?: string[];
  isVisible: boolean;
  createdAt: string;
}

export interface SubmitReviewData {
  rating: number;
  comment?: string;
  tags?: string[];
}

export interface BookingScheduleItem {
  date: string;
  bookings: Booking[];
}

/**
 * Bookings API Service
 */
export const bookingsService = {
  /**
   * Create a new booking (hirer)
   */
  async createBooking(data: CreateBookingData): Promise<Booking> {
    return apiClient.post('/bookings', data);
  },

  /**
   * Get hirer's bookings
   */
  async getHirerBookings(
    status?: BookingStatus,
    page = 1,
    limit = 20
  ): Promise<BookingListResponse> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (status) params.append('status', status);
    return apiClient.get(`/bookings/hirer?${params}`);
  },

  /**
   * Get companion's bookings
   */
  async getCompanionBookings(
    status?: BookingStatus,
    page = 1,
    limit = 20
  ): Promise<BookingListResponse> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (status) params.append('status', status);
    return apiClient.get(`/bookings/companion?${params}`);
  },

  /**
   * Get pending booking requests (companion)
   */
  async getBookingRequests(): Promise<Booking[]> {
    return apiClient.get('/bookings/companion/requests');
  },

  /**
   * Get companion schedule
   */
  async getCompanionSchedule(
    startDate: string,
    endDate: string
  ): Promise<BookingScheduleItem[]> {
    return apiClient.get(
      `/bookings/companion/schedule?startDate=${startDate}&endDate=${endDate}`
    );
  },

  /**
   * Get booking by ID
   */
  async getBooking(bookingId: string): Promise<Booking> {
    return apiClient.get(`/bookings/${bookingId}`);
  },

  /**
   * Update booking status
   */
  async updateBookingStatus(
    bookingId: string,
    status: BookingStatus
  ): Promise<Booking> {
    return apiClient.put(`/bookings/${bookingId}/status`, { status });
  },

  /**
   * Accept booking (companion)
   */
  async acceptBooking(bookingId: string): Promise<Booking> {
    return apiClient.put(`/bookings/${bookingId}/status`, {
      status: 'confirmed',
    });
  },

  /**
   * Decline booking (companion)
   */
  async declineBooking(bookingId: string, reason?: string): Promise<Booking> {
    return apiClient.post(`/bookings/${bookingId}/decline`, { reason });
  },

  /**
   * Cancel booking
   */
  async cancelBooking(bookingId: string, reason?: string): Promise<Booking> {
    return apiClient.put(`/bookings/${bookingId}/status`, {
      status: 'cancelled',
      reason,
    });
  },

  /**
   * Complete booking
   */
  async completeBooking(bookingId: string): Promise<Booking> {
    return apiClient.put(`/bookings/${bookingId}/status`, {
      status: 'completed',
    });
  },

  /**
   * Submit review for booking
   */
  async submitReview(
    bookingId: string,
    data: SubmitReviewData
  ): Promise<BookingReview> {
    return apiClient.post(`/bookings/${bookingId}/review`, data);
  },

  /**
   * Edit review
   */
  async editReview(
    reviewId: string,
    data: SubmitReviewData
  ): Promise<BookingReview> {
    return apiClient.put(`/bookings/reviews/${reviewId}`, data);
  },

  /**
   * Emergency cancel booking
   */
  async emergencyCancel(bookingId: string, reason: string): Promise<Booking> {
    return apiClient.post(`/bookings/${bookingId}/emergency-cancel`, {
      reason,
    });
  },
};
