import { HttpStatus } from '@nestjs/common';
import { DomainException, ErrorCode } from './domain.exception';

export class BookingNotFoundException extends DomainException {
  constructor(bookingId: string) {
    super(
      ErrorCode.BOOKING_NOT_FOUND,
      `Booking not found: ${bookingId}`,
      HttpStatus.NOT_FOUND,
      { bookingId },
    );
  }
}

export class BookingConflictException extends DomainException {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(ErrorCode.BOOKING_CONFLICT, message, HttpStatus.CONFLICT, metadata);
  }
}

export class BookingStateException extends DomainException {
  constructor(
    bookingId: string,
    currentState: string,
    expectedState: string,
  ) {
    super(
      ErrorCode.BOOKING_INVALID_STATE,
      `Booking ${bookingId} is in ${currentState} state, expected ${expectedState}`,
      HttpStatus.BAD_REQUEST,
      { bookingId, currentState, expectedState },
    );
  }
}

export class BookingFrequencyLimitException extends DomainException {
  constructor(limitType: string, limit: number, current: number) {
    super(
      ErrorCode.BOOKING_FREQUENCY_LIMIT,
      `${limitType} booking limit reached: ${current}/${limit}`,
      HttpStatus.TOO_MANY_REQUESTS,
      { limitType, limit, current },
    );
  }
}

export class DoubleBookingException extends DomainException {
  constructor(companionId: string, startTime: Date, endTime: Date) {
    super(
      ErrorCode.BOOKING_DOUBLE_BOOKING,
      `Companion ${companionId} already has a booking during this time`,
      HttpStatus.CONFLICT,
      {
        companionId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    );
  }
}

export class BookingCancellationDeniedException extends DomainException {
  constructor(bookingId: string, reason: string) {
    super(
      ErrorCode.BOOKING_CANCELLATION_DENIED,
      `Cannot cancel booking ${bookingId}: ${reason}`,
      HttpStatus.BAD_REQUEST,
      { bookingId, reason },
    );
  }
}

export class ReviewWindowExpiredException extends DomainException {
  constructor(windowDays: number) {
    super(
      ErrorCode.BOOKING_REVIEW_WINDOW_EXPIRED,
      `Review window of ${windowDays} days has expired`,
      HttpStatus.BAD_REQUEST,
      { windowDays },
    );
  }
}
