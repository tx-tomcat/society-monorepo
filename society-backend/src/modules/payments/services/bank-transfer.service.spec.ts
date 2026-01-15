import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { BankTransferService } from './bank-transfer.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaymentStatus, EarningsStatus } from '@generated/client';

describe('BankTransferService', () => {
  let service: BankTransferService;
  let prismaService: PrismaService;
  let configService: ConfigService;

  const mockWebhookSecret = 'test-webhook-secret';

  const mockPrismaService = {
    payment: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    earning: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'BANK_WEBHOOK_SECRET') return mockWebhookSecret;
      if (key === 'MERCHANT_BANK_ACCOUNT') return '123456789';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BankTransferService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<BankTransferService>(BankTransferService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('extractOrderReference', () => {
    it('should extract order reference from "order-123" format', () => {
      expect(service.extractOrderReference('order-123')).toBe('123');
      expect(service.extractOrderReference('ORDER-abc123')).toBe('abc123');
      expect(service.extractOrderReference('order_456')).toBe('456');
    });

    it('should extract order reference from "booking-uuid" format', () => {
      expect(service.extractOrderReference('booking-abc123')).toBe('abc123');
      expect(service.extractOrderReference('BOOKING_xyz789')).toBe('xyz789');
    });

    it('should extract order reference from "pay-123" format', () => {
      expect(service.extractOrderReference('pay-123')).toBe('123');
      expect(service.extractOrderReference('PAY_abc')).toBe('abc');
    });

    it('should extract order reference from "ref-123" format', () => {
      expect(service.extractOrderReference('ref-123')).toBe('123');
      expect(service.extractOrderReference('REF_abc456')).toBe('abc456');
    });

    it('should extract generic alphanumeric reference (8+ chars)', () => {
      // When no specific pattern matches, it extracts generic alphanumeric sequences
      // Using short words so first match is the ID
      expect(service.extractOrderReference('hi abc12345678')).toBe('abc12345678');
    });

    it('should return null for invalid transfer notes', () => {
      expect(service.extractOrderReference('')).toBeNull();
      expect(service.extractOrderReference('hi')).toBeNull();
      expect(service.extractOrderReference('test')).toBeNull();
    });

    it('should handle transfer notes with extra text', () => {
      expect(service.extractOrderReference('Payment for order-123 from John')).toBe('123');
      expect(service.extractOrderReference('booking-abc123 - dinner reservation')).toBe('abc123');
    });
  });

  describe('verifySignature', () => {
    it('should verify valid signature', () => {
      const payload = {
        transactionId: 'txn-001',
        amount: 1000000,
        transferNote: 'order-123',
        bankCode: 'VCB',
        timestamp: '2024-01-15T10:00:00Z',
        signature: '',
        senderAccount: '123',
        senderName: 'Test',
      };

      // Generate correct signature
      const signData = `${payload.transactionId}|${payload.amount}|${payload.transferNote}|${payload.bankCode}|${payload.timestamp}`;
      payload.signature = crypto
        .createHmac('sha256', mockWebhookSecret)
        .update(signData)
        .digest('hex');

      expect(service.verifySignature(payload)).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = {
        transactionId: 'txn-001',
        amount: 1000000,
        transferNote: 'order-123',
        bankCode: 'VCB',
        signature: 'invalid-signature',
        senderAccount: '123',
        senderName: 'Test',
      };

      expect(service.verifySignature(payload)).toBe(false);
    });
  });

  describe('processIncomingPayment', () => {
    const validPayload = {
      transactionId: 'txn-001',
      amount: 1000000,
      transferNote: 'order-payment-123',
      bankCode: 'VCB',
      timestamp: '2024-01-15T10:00:00Z',
      signature: '',
      senderAccount: '123456',
      senderName: 'Test User',
    };

    beforeEach(() => {
      // Generate valid signature for all tests
      const signData = `${validPayload.transactionId}|${validPayload.amount}|${validPayload.transferNote}|${validPayload.bankCode}|${validPayload.timestamp}`;
      validPayload.signature = crypto
        .createHmac('sha256', mockWebhookSecret)
        .update(signData)
        .digest('hex');
    });

    it('should process valid payment successfully', async () => {
      const mockPayment = {
        id: 'payment-123',
        bookingId: 'booking-456',
        amount: 1000000,
        status: PaymentStatus.PENDING,
        booking: {
          companionId: 'companion-789',
        },
      };

      // First findFirst for payment lookup, second for duplicate check
      mockPrismaService.payment.findFirst
        .mockResolvedValueOnce(mockPayment) // Payment lookup
        .mockResolvedValueOnce(null); // Duplicate check returns null (no duplicate)
      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);
      mockPrismaService.payment.update.mockResolvedValue({ ...mockPayment, status: PaymentStatus.HELD });
      mockPrismaService.earning.findUnique.mockResolvedValue(null);
      mockPrismaService.earning.create.mockResolvedValue({});

      const result = await service.processIncomingPayment(validPayload);

      expect(result.success).toBe(true);
      expect(result.paymentId).toBe('payment-123');
      expect(mockPrismaService.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'payment-123' },
          data: expect.objectContaining({
            status: PaymentStatus.HELD,
            providerTxnId: 'txn-001',
          }),
        }),
      );
    });

    it('should reject invalid signature', async () => {
      const invalidPayload = { ...validPayload, signature: 'invalid' };

      const result = await service.processIncomingPayment(invalidPayload);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid signature');
    });

    it('should reject when no matching payment found', async () => {
      mockPrismaService.payment.findFirst.mockResolvedValue(null);
      mockPrismaService.payment.findMany.mockResolvedValue([]);

      const result = await service.processIncomingPayment(validPayload);

      expect(result.success).toBe(false);
      expect(result.message).toBe('No matching pending payment found');
    });

    it('should reject duplicate transactions', async () => {
      const mockPayment = {
        id: 'payment-123',
        bookingId: 'booking-456',
        amount: 1000000,
        status: PaymentStatus.PENDING,
        booking: { companionId: 'companion-789' },
      };

      const mockExistingTxn = {
        id: 'payment-old',
        providerTxnId: 'txn-001',
      };

      mockPrismaService.payment.findFirst
        .mockResolvedValueOnce(mockPayment) // First call for finding payment
        .mockResolvedValueOnce(mockExistingTxn); // Second call for duplicate check

      const result = await service.processIncomingPayment(validPayload);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Transaction already processed');
    });

    it('should reject amount mismatch exceeding tolerance', async () => {
      const mockPayment = {
        id: 'payment-123',
        bookingId: 'booking-456',
        amount: 2000000, // Expected amount is 2M, received 1M (50% difference)
        status: PaymentStatus.PENDING,
        booking: { companionId: 'companion-789' },
      };

      mockPrismaService.payment.findFirst.mockResolvedValue(mockPayment);

      const result = await service.processIncomingPayment(validPayload);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Amount mismatch');
    });

    it('should create earnings record on successful payment', async () => {
      const mockPayment = {
        id: 'payment-123',
        bookingId: 'booking-456',
        amount: 1000000,
        status: PaymentStatus.PENDING,
        booking: {
          companionId: 'companion-789',
        },
      };

      // First findFirst for payment lookup, second for duplicate check
      mockPrismaService.payment.findFirst
        .mockResolvedValueOnce(mockPayment) // Payment lookup
        .mockResolvedValueOnce(null); // Duplicate check returns null (no duplicate)
      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);
      mockPrismaService.payment.update.mockResolvedValue({ ...mockPayment, status: PaymentStatus.HELD });
      mockPrismaService.earning.findUnique.mockResolvedValue(null);
      mockPrismaService.earning.create.mockResolvedValue({});

      await service.processIncomingPayment(validPayload);

      expect(mockPrismaService.earning.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          companionId: 'companion-789',
          bookingId: 'booking-456',
          grossAmount: 1000000,
          platformFee: 180000, // 18%
          netAmount: 820000, // 82%
          status: EarningsStatus.PENDING,
        }),
      });
    });
  });

  describe('isConfigured', () => {
    it('should return true when webhook secret is configured', () => {
      expect(service.isConfigured()).toBe(true);
    });
  });
});
