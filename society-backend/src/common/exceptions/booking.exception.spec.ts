import { HttpStatus } from '@nestjs/common';
import {
  BookingNotFoundException,
  BookingConflictException,
  BookingStateException,
  BookingFrequencyLimitException,
  DoubleBookingException,
  ReviewWindowExpiredException,
} from './booking.exception';
import { ErrorCode } from './domain.exception';

describe('Booking Exceptions', () => {
  describe('BookingNotFoundException', () => {
    it('should create with booking ID', () => {
      const exception = new BookingNotFoundException('booking-123');

      expect(exception.errorCode).toBe(ErrorCode.BOOKING_NOT_FOUND);
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(exception.message).toContain('booking-123');
    });
  });

  describe('DoubleBookingException', () => {
    it('should include companion and time details', () => {
      const exception = new DoubleBookingException(
        'companion-456',
        new Date('2026-02-03T10:00:00Z'),
        new Date('2026-02-03T12:00:00Z'),
      );

      expect(exception.errorCode).toBe(ErrorCode.BOOKING_DOUBLE_BOOKING);
      expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
      const response = exception.getResponse() as Record<string, unknown>;
      expect(response.metadata).toHaveProperty('companionId', 'companion-456');
    });
  });

  describe('BookingFrequencyLimitException', () => {
    it('should include limit type and current count', () => {
      const exception = new BookingFrequencyLimitException('daily', 5, 5);

      expect(exception.errorCode).toBe(ErrorCode.BOOKING_FREQUENCY_LIMIT);
      expect(exception.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    });
  });

  describe('ReviewWindowExpiredException', () => {
    it('should include window duration', () => {
      const exception = new ReviewWindowExpiredException(7);

      expect(exception.errorCode).toBe(ErrorCode.BOOKING_REVIEW_WINDOW_EXPIRED);
      expect(exception.message).toContain('7 days');
    });
  });
});
