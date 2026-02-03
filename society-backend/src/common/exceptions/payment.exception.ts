import { HttpStatus } from '@nestjs/common';
import { DomainException, ErrorCode } from './domain.exception';

export class PaymentNotFoundException extends DomainException {
  constructor(paymentId: string) {
    super(
      ErrorCode.PAYMENT_NOT_FOUND,
      `Payment not found: ${paymentId}`,
      HttpStatus.NOT_FOUND,
      { paymentId },
    );
  }
}

export class PaymentFailedException extends DomainException {
  constructor(reason: string, provider?: string) {
    super(
      ErrorCode.PAYMENT_FAILED,
      `Payment failed: ${reason}`,
      HttpStatus.BAD_REQUEST,
      { reason, provider },
    );
  }
}

export class InsufficientFundsException extends DomainException {
  constructor(required: number, available: number) {
    super(
      ErrorCode.PAYMENT_INSUFFICIENT_FUNDS,
      `Insufficient funds: required ${required} VND, available ${available} VND`,
      HttpStatus.BAD_REQUEST,
      { required, available, shortage: required - available },
    );
  }
}

export class InvalidPaymentAmountException extends DomainException {
  constructor(amount: number, min?: number, max?: number) {
    super(
      ErrorCode.PAYMENT_INVALID_AMOUNT,
      `Invalid payment amount: ${amount} VND`,
      HttpStatus.BAD_REQUEST,
      { amount, min, max },
    );
  }
}

export class PaymentAlreadyProcessedException extends DomainException {
  constructor(paymentId: string, currentStatus: string) {
    super(
      ErrorCode.PAYMENT_ALREADY_PROCESSED,
      `Payment ${paymentId} already processed with status: ${currentStatus}`,
      HttpStatus.CONFLICT,
      { paymentId, currentStatus },
    );
  }
}
