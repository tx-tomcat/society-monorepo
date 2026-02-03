import { HttpStatus } from '@nestjs/common';
import {
  PaymentNotFoundException,
  PaymentFailedException,
  InsufficientFundsException,
  PaymentAlreadyProcessedException,
} from './payment.exception';
import { ErrorCode } from './domain.exception';

describe('Payment Exceptions', () => {
  describe('PaymentNotFoundException', () => {
    it('should create with payment ID', () => {
      const exception = new PaymentNotFoundException('payment-123');

      expect(exception.errorCode).toBe(ErrorCode.PAYMENT_NOT_FOUND);
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('InsufficientFundsException', () => {
    it('should include required and available amounts', () => {
      const exception = new InsufficientFundsException(500000, 300000);

      expect(exception.errorCode).toBe(ErrorCode.PAYMENT_INSUFFICIENT_FUNDS);
      const response = exception.getResponse() as Record<string, unknown>;
      expect(response.metadata).toEqual({
        required: 500000,
        available: 300000,
        shortage: 200000,
      });
    });
  });

  describe('PaymentAlreadyProcessedException', () => {
    it('should include payment ID and status', () => {
      const exception = new PaymentAlreadyProcessedException('pay-123', 'COMPLETED');

      expect(exception.errorCode).toBe(ErrorCode.PAYMENT_ALREADY_PROCESSED);
      expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
    });
  });
});
