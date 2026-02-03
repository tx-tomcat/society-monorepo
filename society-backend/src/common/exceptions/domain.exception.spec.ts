import { HttpStatus } from '@nestjs/common';
import { DomainException, ErrorCode } from './domain.exception';

describe('DomainException', () => {
  it('should create exception with error code and message', () => {
    const exception = new DomainException(
      ErrorCode.BOOKING_NOT_FOUND,
      'Booking not found',
      HttpStatus.NOT_FOUND,
    );

    expect(exception.errorCode).toBe(ErrorCode.BOOKING_NOT_FOUND);
    expect(exception.message).toBe('Booking not found');
    expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
  });

  it('should include metadata in response', () => {
    const exception = new DomainException(
      ErrorCode.BOOKING_CONFLICT,
      'Booking conflict',
      HttpStatus.CONFLICT,
      { bookingId: '123' },
    );

    const response = exception.getResponse() as Record<string, unknown>;
    expect(response.errorCode).toBe(ErrorCode.BOOKING_CONFLICT);
    expect(response.metadata).toEqual({ bookingId: '123' });
  });
});
