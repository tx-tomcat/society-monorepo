import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { BookingCancellationService } from './booking-cancellation.service';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationsService } from '@/modules/notifications/services/notifications.service';
import { BookingStatus, PaymentStatus, StrikeType } from '@generated/enums';
import { BookingCancellationDeniedException } from '@/common/exceptions';

describe('BookingCancellationService', () => {
  let service: BookingCancellationService;

  const mockPrismaService = {
    booking: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    userStrike: {
      create: jest.fn(),
    },
    bookingCancellation: {
      create: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(async (callback) => {
      return callback(mockPrismaService);
    }),
  };

  const mockNotificationsService = {
    notifyBookingCancelled: jest.fn().mockResolvedValue(undefined),
    notifyBookingDeclined: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingCancellationService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<BookingCancellationService>(BookingCancellationService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateRefundPolicy', () => {
    const booking = {
      startDatetime: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours from now
      totalPrice: 1000000,
      platformFee: 180000,
    };

    it('should return 100% refund if >48h before start', () => {
      const result = service.calculateRefundPolicy(booking);

      expect(result.refundPercentage).toBe(100);
      expect(result.refundToHirer).toBe(1000000);
      expect(result.releaseToCompanion).toBe(0);
    });

    it('should return 50% refund if 24-48h before start', () => {
      const booking36h = {
        ...booking,
        startDatetime: new Date(Date.now() + 36 * 60 * 60 * 1000), // 36 hours from now
      };

      const result = service.calculateRefundPolicy(booking36h);

      expect(result.refundPercentage).toBe(50);
      expect(result.refundToHirer).toBe(500000);
      expect(result.releaseToCompanion).toBe(410000); // 50% of (totalPrice - platformFee)
    });

    it('should return 0% refund if <24h before start', () => {
      const booking12h = {
        ...booking,
        startDatetime: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
      };

      const result = service.calculateRefundPolicy(booking12h);

      expect(result.refundPercentage).toBe(0);
      expect(result.refundToHirer).toBe(0);
      expect(result.releaseToCompanion).toBe(820000); // Full companion earnings
    });
  });

  describe('cancelBooking', () => {
    const mockBooking = {
      id: 'booking-123',
      bookingNumber: 'SOC-2026-ABC123',
      hirerId: 'hirer-1',
      companionId: 'companion-1',
      status: BookingStatus.CONFIRMED,
      startDatetime: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72h from now
      totalPrice: 1000000,
      platformFee: 180000,
      hirer: { id: 'hirer-1', fullName: 'John Hirer' },
      companion: { id: 'companion-1', fullName: 'Jane Companion' },
    };

    it('should cancel a confirmed booking by hirer', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
        paymentStatus: PaymentStatus.REFUNDED,
      });

      const result = await service.cancelBooking('hirer-1', 'booking-123', {
        reason: 'Plans changed',
      });

      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(result.refundDetails.refundPercentage).toBe(100);
      expect(mockPrismaService.booking.update).toHaveBeenCalled();
    });

    it('should cancel a confirmed booking by companion', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
        paymentStatus: PaymentStatus.REFUNDED,
      });

      const result = await service.cancelBooking('companion-1', 'booking-123', {
        reason: 'Emergency',
      });

      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(mockNotificationsService.notifyBookingCancelled).toHaveBeenCalled();
    });

    it('should throw if booking not found', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.cancelBooking('hirer-1', 'booking-123', { reason: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if user is not part of booking', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(
        service.cancelBooking('random-user', 'booking-123', { reason: 'Test' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw if booking is already completed', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.COMPLETED,
      });

      await expect(
        service.cancelBooking('hirer-1', 'booking-123', { reason: 'Test' }),
      ).rejects.toThrow(BookingCancellationDeniedException);
    });

    it('should issue strike for late cancellation by hirer', async () => {
      const lateBooking = {
        ...mockBooking,
        startDatetime: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12h from now
      };
      mockPrismaService.booking.findUnique.mockResolvedValue(lateBooking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...lateBooking,
        status: BookingStatus.CANCELLED,
      });

      const result = await service.cancelBooking('hirer-1', 'booking-123', {
        reason: 'Late cancel',
      });

      expect(result.strikeIssued).toBe(true);
      expect(mockPrismaService.userStrike.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'hirer-1',
          type: StrikeType.LATE_CANCELLATION,
        }),
      });
    });
  });

  describe('declineBooking', () => {
    const mockPendingBooking = {
      id: 'booking-123',
      bookingNumber: 'SOC-2026-ABC123',
      hirerId: 'hirer-1',
      companionId: 'companion-1',
      status: BookingStatus.PENDING,
      companion: { fullName: 'Jane Companion' },
    };

    it('should decline a pending booking request', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockPendingBooking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...mockPendingBooking,
        status: BookingStatus.CANCELLED,
        paymentStatus: PaymentStatus.REFUNDED,
      });

      const result = await service.declineBooking('companion-1', 'booking-123', 'Not available');

      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(result.paymentStatus).toBe(PaymentStatus.REFUNDED);
      expect(mockNotificationsService.notifyBookingDeclined).toHaveBeenCalled();
    });

    it('should throw if user is not the companion', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockPendingBooking);

      await expect(
        service.declineBooking('hirer-1', 'booking-123', 'Test'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw if booking is not pending', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...mockPendingBooking,
        status: BookingStatus.CONFIRMED,
      });

      await expect(
        service.declineBooking('companion-1', 'booking-123', 'Test'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('emergencyCancellation', () => {
    const mockBooking = {
      id: 'booking-123',
      bookingNumber: 'SOC-2026-ABC123',
      hirerId: 'hirer-1',
      companionId: 'companion-1',
      status: BookingStatus.CONFIRMED,
      startDatetime: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12h from now (late)
      totalPrice: 1000000,
      platformFee: 180000,
    };

    it('should process emergency cancellation', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
        paymentStatus: PaymentStatus.PENDING,
      });

      const result = await service.emergencyCancellation('hirer-1', 'booking-123', {
        emergencyType: 'medical',
        description: 'Hospital visit required',
      });

      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(result.emergencyType).toBe('medical');
      expect(result.verificationRequired).toBe(true);
      expect(result.isLateCancel).toBe(true);
    });

    it('should create pending strike for late emergency cancellation', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      });

      await service.emergencyCancellation('hirer-1', 'booking-123', {
        emergencyType: 'medical',
        description: 'Hospital visit',
      });

      expect(mockPrismaService.userStrike.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'hirer-1',
          type: StrikeType.LATE_CANCELLATION,
          reason: expect.stringContaining('pending verification'),
        }),
      });
    });

    it('should throw if booking cannot be cancelled at this stage', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.COMPLETED,
      });

      await expect(
        service.emergencyCancellation('hirer-1', 'booking-123', {
          emergencyType: 'medical',
          description: 'Test',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getEmergencyCancellationHistory', () => {
    it('should return emergency cancellation history', async () => {
      const mockCancellations = [
        {
          id: 'booking-1',
          bookingNumber: 'SOC-2026-001',
          cancelReason: 'EMERGENCY: medical - Hospital visit',
          cancelledAt: new Date(),
          paymentStatus: PaymentStatus.REFUNDED,
        },
        {
          id: 'booking-2',
          bookingNumber: 'SOC-2026-002',
          cancelReason: 'EMERGENCY: family - Family emergency',
          cancelledAt: new Date(),
          paymentStatus: PaymentStatus.PENDING,
        },
      ];

      mockPrismaService.booking.findMany.mockResolvedValue(mockCancellations);

      const result = await service.getEmergencyCancellationHistory('user-1');

      expect(result.total).toBe(2);
      expect(result.verified).toBe(1);
      expect(result.pending).toBe(1);
      expect(result.cancellations).toHaveLength(2);
    });
  });
});
