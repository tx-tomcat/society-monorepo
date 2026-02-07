import { SepayService } from '@/modules/payments/services/sepay.service';
import { PrismaService } from '@/prisma/prisma.service';
import { PaymentRequestStatus, PaymentRequestType } from '@generated/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { WALLET_EVENTS } from './events/wallet.events';
import { WalletService } from './wallet.service';

describe('WalletService', () => {
  let service: WalletService;
  let prismaService: PrismaService;
  let sepayService: SepayService;

  const mockUserId = 'user-123';
  const mockCode = 'HMABC1234';
  const mockExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

  const mockPrismaService = {
    paymentRequest: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    booking: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn(mockPrismaService)),
    invalidateCache: jest.fn(),
  };

  const mockSepayService = {
    generateCode: jest.fn().mockReturnValue(mockCode),
    generateQrUrl: jest.fn().mockReturnValue('https://qr.sepay.vn/img?test'),
    getBankDeeplinks: jest.fn().mockReturnValue({
      tpbank: 'https://link.tpb.vn/transfer?test',
      vietcombank: 'https://vcbdigibank.vietcombank.com.vn/transfer?test',
    }),
    getAccountInfo: jest.fn().mockReturnValue({
      bankCode: 'TPB',
      accountNumber: '1234567890',
      accountName: 'hireme VN',
    }),
    extractCode: jest.fn(),
    verifyWebhook: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(<T>(key: string, defaultValue?: T): T | number => {
      if (key === 'TOPUP_EXPIRY_MINUTES') return 30;
      return defaultValue as T;
    }),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SepayService, useValue: mockSepayService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    prismaService = module.get<PrismaService>(PrismaService);
    sepayService = module.get<SepayService>(SepayService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTopup', () => {
    const createTopupDto = { amount: 500000 };

    it('should create a topup request successfully', async () => {
      mockPrismaService.paymentRequest.findUnique.mockResolvedValue(null);
      mockPrismaService.paymentRequest.create.mockResolvedValue({
        id: 'request-123',
        code: mockCode,
        amount: createTopupDto.amount,
        expiresAt: mockExpiresAt,
      });

      const result = await service.createTopup(mockUserId, createTopupDto);

      expect(result).toEqual({
        id: 'request-123',
        code: mockCode,
        amount: createTopupDto.amount,
        qrUrl: 'https://qr.sepay.vn/img?test',
        deeplinks: {
          tpbank: 'https://link.tpb.vn/transfer?test',
          vietcombank: 'https://vcbdigibank.vietcombank.com.vn/transfer?test',
        },
        accountInfo: {
          bankCode: 'TPB',
          accountNumber: '1234567890',
          accountName: 'hireme VN',
        },
        expiresAt: mockExpiresAt.toISOString(),
      });

      expect(mockPrismaService.paymentRequest.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          code: mockCode,
          type: PaymentRequestType.TOPUP,
          amount: createTopupDto.amount,
          status: PaymentRequestStatus.PENDING,
          expiresAt: expect.any(Date),
        },
      });
    });

    it('should retry code generation if code already exists', async () => {
      const existingCode = { code: mockCode };
      mockPrismaService.paymentRequest.findUnique
        .mockResolvedValueOnce(existingCode)
        .mockResolvedValueOnce(existingCode)
        .mockResolvedValueOnce(null);

      mockPrismaService.paymentRequest.create.mockResolvedValue({
        id: 'request-123',
        code: mockCode,
        amount: createTopupDto.amount,
        expiresAt: mockExpiresAt,
      });

      await service.createTopup(mockUserId, createTopupDto);

      expect(mockSepayService.generateCode).toHaveBeenCalledTimes(3);
    });

    it('should throw BadRequestException after 10 failed attempts', async () => {
      mockPrismaService.paymentRequest.findUnique.mockResolvedValue({ code: mockCode });

      await expect(service.createTopup(mockUserId, createTopupDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createTopup(mockUserId, createTopupDto)).rejects.toThrow(
        'Unable to generate unique payment code',
      );
    });
  });

  describe('createBookingPaymentRequest', () => {
    const mockBookingId = 'booking-123';
    const createDto = { bookingId: mockBookingId };
    const mockBooking = {
      id: mockBookingId,
      totalPrice: 1000000,
      hirer: { id: mockUserId },
    };

    it('should create a booking payment request successfully', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.paymentRequest.findFirst.mockResolvedValue(null);
      mockPrismaService.paymentRequest.findUnique.mockResolvedValue(null);
      mockPrismaService.paymentRequest.create.mockResolvedValue({
        id: 'request-123',
        code: mockCode,
        amount: mockBooking.totalPrice,
        expiresAt: mockExpiresAt,
      });

      const result = await service.createBookingPaymentRequest(mockUserId, createDto);

      expect(result).toEqual({
        id: 'request-123',
        code: mockCode,
        amount: mockBooking.totalPrice,
        bookingId: mockBookingId,
        qrUrl: 'https://qr.sepay.vn/img?test',
        deeplinks: expect.any(Object),
        accountInfo: expect.any(Object),
        expiresAt: mockExpiresAt.toISOString(),
      });
    });

    it('should return existing pending request if exists', async () => {
      const existingRequest = {
        id: 'existing-123',
        code: 'HMEXIST01',
        amount: mockBooking.totalPrice,
        expiresAt: mockExpiresAt,
      };

      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.paymentRequest.findFirst.mockResolvedValue(existingRequest);

      const result = await service.createBookingPaymentRequest(mockUserId, createDto);

      expect(result.id).toBe('existing-123');
      expect(result.code).toBe('HMEXIST01');
      expect(mockPrismaService.paymentRequest.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if booking not found', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(service.createBookingPaymentRequest(mockUserId, createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if user is not the hirer', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        hirer: { id: 'different-user' },
      });

      await expect(service.createBookingPaymentRequest(mockUserId, createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createBookingPaymentRequest(mockUserId, createDto)).rejects.toThrow(
        'You are not authorized to pay for this booking',
      );
    });
  });

  describe('getBalance', () => {
    it('should calculate balance correctly', async () => {
      mockPrismaService.paymentRequest.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 2000000 } }) // topups
        .mockResolvedValueOnce({ _sum: { amount: 500000 } }) // spent
        .mockResolvedValueOnce({ _sum: { amount: 100000 } }); // pending

      const result = await service.getBalance(mockUserId);

      expect(result).toEqual({
        balance: 1500000,
        pendingTopups: 100000,
        currency: 'VND',
      });
    });

    it('should handle zero values', async () => {
      mockPrismaService.paymentRequest.aggregate
        .mockResolvedValueOnce({ _sum: { amount: null } })
        .mockResolvedValueOnce({ _sum: { amount: null } })
        .mockResolvedValueOnce({ _sum: { amount: null } });

      const result = await service.getBalance(mockUserId);

      expect(result).toEqual({
        balance: 0,
        pendingTopups: 0,
        currency: 'VND',
      });
    });

    it('should query with correct filters', async () => {
      mockPrismaService.paymentRequest.aggregate.mockResolvedValue({ _sum: { amount: 0 } });

      await service.getBalance(mockUserId);

      expect(mockPrismaService.paymentRequest.aggregate).toHaveBeenNthCalledWith(1, {
        where: {
          userId: mockUserId,
          type: PaymentRequestType.TOPUP,
          status: PaymentRequestStatus.COMPLETED,
        },
        _sum: { amount: true },
      });

      expect(mockPrismaService.paymentRequest.aggregate).toHaveBeenNthCalledWith(2, {
        where: {
          userId: mockUserId,
          type: { in: [PaymentRequestType.BOOKING, PaymentRequestType.BOOST] },
          status: PaymentRequestStatus.COMPLETED,
        },
        _sum: { amount: true },
      });

      expect(mockPrismaService.paymentRequest.aggregate).toHaveBeenNthCalledWith(3, {
        where: {
          userId: mockUserId,
          type: PaymentRequestType.TOPUP,
          status: PaymentRequestStatus.PENDING,
          expiresAt: { gt: expect.any(Date) },
        },
        _sum: { amount: true },
      });
    });
  });

  describe('getTransactions', () => {
    const mockTransactions = [
      {
        id: 'tx-1',
        code: 'HMABC1234',
        type: PaymentRequestType.TOPUP,
        amount: 500000,
        status: PaymentRequestStatus.COMPLETED,
        bookingId: null,
        gateway: 'sepay',
        createdAt: new Date('2024-01-15'),
        completedAt: new Date('2024-01-15'),
        expiresAt: new Date('2024-01-15'),
      },
      {
        id: 'tx-2',
        code: 'HMDEF5678',
        type: PaymentRequestType.BOOKING,
        amount: 200000,
        status: PaymentRequestStatus.PENDING,
        bookingId: 'booking-1',
        gateway: null,
        createdAt: new Date('2024-01-16'),
        completedAt: null,
        expiresAt: new Date('2024-01-16'),
      },
    ];

    it('should return paginated transactions', async () => {
      mockPrismaService.paymentRequest.findMany.mockResolvedValue(mockTransactions);
      mockPrismaService.paymentRequest.count.mockResolvedValue(2);

      const result = await service.getTransactions(mockUserId, { page: 1, limit: 20 });

      expect(result.transactions).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
    });

    it('should filter by type when provided', async () => {
      mockPrismaService.paymentRequest.findMany.mockResolvedValue([mockTransactions[0]]);
      mockPrismaService.paymentRequest.count.mockResolvedValue(1);

      await service.getTransactions(mockUserId, { page: 1, limit: 20, type: 'TOPUP' });

      expect(mockPrismaService.paymentRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUserId, type: 'TOPUP' },
        }),
      );
    });

    it('should not filter by type when "all"', async () => {
      mockPrismaService.paymentRequest.findMany.mockResolvedValue(mockTransactions);
      mockPrismaService.paymentRequest.count.mockResolvedValue(2);

      await service.getTransactions(mockUserId, { page: 1, limit: 20, type: 'all' });

      expect(mockPrismaService.paymentRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUserId },
        }),
      );
    });

    it('should calculate pagination correctly', async () => {
      mockPrismaService.paymentRequest.findMany.mockResolvedValue([]);
      mockPrismaService.paymentRequest.count.mockResolvedValue(45);

      const result = await service.getTransactions(mockUserId, { page: 2, limit: 10 });

      expect(mockPrismaService.paymentRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
      expect(result.pagination.totalPages).toBe(5);
    });
  });

  describe('processWebhook', () => {
    const mockWebhookPayload = {
      id: 12345,
      gateway: 'TPBank',
      transactionDate: '2024-01-15',
      accountNumber: '1234567890',
      code: null,
      content: 'Chuyen tien HMABC1234 nap vi',
      transferType: 'in' as const,
      transferAmount: 500000,
      accumulated: 1000000,
      subAccount: null,
      referenceCode: 'REF123',
      description: 'Transfer',
    };

    const mockRequest = {
      id: 'request-123',
      code: mockCode,
      amount: 500000,
      status: PaymentRequestStatus.PENDING,
      type: PaymentRequestType.TOPUP,
      bookingId: null,
    };

    beforeEach(() => {
      mockSepayService.extractCode.mockReturnValue(mockCode);
    });

    it('should process webhook and complete payment request', async () => {
      mockPrismaService.paymentRequest.findUnique.mockResolvedValue(mockRequest);
      mockPrismaService.paymentRequest.updateMany.mockResolvedValue({ count: 1 });

      await service.processWebhook(mockWebhookPayload);

      expect(mockPrismaService.paymentRequest.updateMany).toHaveBeenCalledWith({
        where: {
          id: mockRequest.id,
          status: PaymentRequestStatus.PENDING,
        },
        data: {
          status: PaymentRequestStatus.COMPLETED,
          completedAt: expect.any(Date),
          sepayId: mockWebhookPayload.id,
          gateway: mockWebhookPayload.gateway,
          referenceCode: mockWebhookPayload.referenceCode,
        },
      });
    });

    it('should ignore outgoing transfers', async () => {
      await service.processWebhook({ ...mockWebhookPayload, transferType: 'out' });

      expect(mockPrismaService.paymentRequest.findUnique).not.toHaveBeenCalled();
    });

    it('should handle missing HM code', async () => {
      mockSepayService.extractCode.mockReturnValue(null);

      await service.processWebhook(mockWebhookPayload);

      expect(mockPrismaService.paymentRequest.findUnique).not.toHaveBeenCalled();
    });

    it('should handle non-existent payment request', async () => {
      mockPrismaService.paymentRequest.findUnique.mockResolvedValue(null);

      await service.processWebhook(mockWebhookPayload);

      expect(mockPrismaService.paymentRequest.update).not.toHaveBeenCalled();
    });

    it('should skip already completed requests (idempotent)', async () => {
      mockPrismaService.paymentRequest.findUnique.mockResolvedValue({
        ...mockRequest,
        status: PaymentRequestStatus.COMPLETED,
      });

      await service.processWebhook(mockWebhookPayload);

      expect(mockPrismaService.paymentRequest.update).not.toHaveBeenCalled();
    });

    it('should skip expired requests', async () => {
      mockPrismaService.paymentRequest.findUnique.mockResolvedValue({
        ...mockRequest,
        status: PaymentRequestStatus.EXPIRED,
      });

      await service.processWebhook(mockWebhookPayload);

      expect(mockPrismaService.paymentRequest.update).not.toHaveBeenCalled();
    });

    it('should fail request on amount mismatch', async () => {
      mockPrismaService.paymentRequest.findUnique.mockResolvedValue(mockRequest);
      mockPrismaService.paymentRequest.update.mockResolvedValue({});

      await service.processWebhook({ ...mockWebhookPayload, transferAmount: 100000 });

      expect(mockPrismaService.paymentRequest.update).toHaveBeenCalledWith({
        where: { id: mockRequest.id },
        data: {
          status: PaymentRequestStatus.FAILED,
          gateway: mockWebhookPayload.gateway,
          sepayId: mockWebhookPayload.id,
          referenceCode: mockWebhookPayload.referenceCode,
        },
      });
    });

    it('should update booking status for booking payments', async () => {
      const bookingRequest = {
        ...mockRequest,
        type: PaymentRequestType.BOOKING,
        bookingId: 'booking-123',
      };
      mockPrismaService.paymentRequest.findUnique.mockResolvedValue(bookingRequest);
      mockPrismaService.paymentRequest.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.booking.update.mockResolvedValue({});

      await service.processWebhook(mockWebhookPayload);

      expect(mockPrismaService.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-123' },
        data: { paymentStatus: 'PAID' },
      });
    });

    it('should emit boost payment completed event for boost payments', async () => {
      const boostRequest = {
        ...mockRequest,
        type: PaymentRequestType.BOOST,
        boostId: 'boost-123',
      };
      mockPrismaService.paymentRequest.findUnique.mockResolvedValue(boostRequest);
      mockPrismaService.paymentRequest.updateMany.mockResolvedValue({ count: 1 });

      await service.processWebhook(mockWebhookPayload);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        WALLET_EVENTS.BOOST_PAYMENT_COMPLETED,
        expect.objectContaining({ boostId: 'boost-123' }),
      );
    });
  });

  describe('canPayFromWallet', () => {
    it('should return true when balance is sufficient', async () => {
      mockPrismaService.paymentRequest.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 1000000 } })
        .mockResolvedValueOnce({ _sum: { amount: 0 } })
        .mockResolvedValueOnce({ _sum: { amount: 0 } });

      const result = await service.canPayFromWallet(mockUserId, 500000);

      expect(result).toBe(true);
    });

    it('should return false when balance is insufficient', async () => {
      mockPrismaService.paymentRequest.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 100000 } })
        .mockResolvedValueOnce({ _sum: { amount: 0 } })
        .mockResolvedValueOnce({ _sum: { amount: 0 } });

      const result = await service.canPayFromWallet(mockUserId, 500000);

      expect(result).toBe(false);
    });

    it('should return true when balance equals amount', async () => {
      mockPrismaService.paymentRequest.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 500000 } })
        .mockResolvedValueOnce({ _sum: { amount: 0 } })
        .mockResolvedValueOnce({ _sum: { amount: 0 } });

      const result = await service.canPayFromWallet(mockUserId, 500000);

      expect(result).toBe(true);
    });
  });

  describe('cleanupExpiredRequests', () => {
    it('should mark expired requests as EXPIRED', async () => {
      mockPrismaService.paymentRequest.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.cleanupExpiredRequests();

      expect(result).toBe(5);
      expect(mockPrismaService.paymentRequest.updateMany).toHaveBeenCalledWith({
        where: {
          status: PaymentRequestStatus.PENDING,
          expiresAt: { lt: expect.any(Date) },
        },
        data: { status: PaymentRequestStatus.EXPIRED },
      });
    });

    it('should return 0 when no expired requests', async () => {
      mockPrismaService.paymentRequest.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.cleanupExpiredRequests();

      expect(result).toBe(0);
    });
  });
});
