import { HttpException, HttpStatus } from '@nestjs/common';

export enum ErrorCode {
  // Booking errors (1xxx)
  BOOKING_NOT_FOUND = 'BOOKING_1001',
  BOOKING_CONFLICT = 'BOOKING_1002',
  BOOKING_INVALID_STATE = 'BOOKING_1003',
  BOOKING_FREQUENCY_LIMIT = 'BOOKING_1004',
  BOOKING_DOUBLE_BOOKING = 'BOOKING_1005',
  BOOKING_CANCELLATION_DENIED = 'BOOKING_1006',
  BOOKING_REVIEW_WINDOW_EXPIRED = 'BOOKING_1007',

  // Payment errors (2xxx)
  PAYMENT_NOT_FOUND = 'PAYMENT_2001',
  PAYMENT_FAILED = 'PAYMENT_2002',
  PAYMENT_INSUFFICIENT_FUNDS = 'PAYMENT_2003',
  PAYMENT_INVALID_AMOUNT = 'PAYMENT_2004',
  PAYMENT_ALREADY_PROCESSED = 'PAYMENT_2005',

  // Companion errors (3xxx)
  COMPANION_NOT_FOUND = 'COMPANION_3001',
  COMPANION_NOT_AVAILABLE = 'COMPANION_3002',
  COMPANION_PROFILE_INCOMPLETE = 'COMPANION_3003',
  COMPANION_BOOST_ACTIVE = 'COMPANION_3004',

  // User errors (4xxx)
  USER_NOT_FOUND = 'USER_4001',
  USER_SUSPENDED = 'USER_4002',
  USER_ACCESS_DENIED = 'USER_4003',

  // Validation errors (5xxx)
  VALIDATION_FAILED = 'VALIDATION_5001',
  INVALID_INPUT = 'VALIDATION_5002',
}

export class DomainException extends HttpException {
  constructor(
    public readonly errorCode: ErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super(
      {
        statusCode: status,
        errorCode,
        message,
        metadata,
        timestamp: new Date().toISOString(),
      },
      status,
    );
  }
}
