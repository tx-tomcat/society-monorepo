import { Test, TestingModule } from '@nestjs/testing';
import { BookingScheduleService } from './booking-schedule.service';
import { PrismaService } from '@/prisma/prisma.service';
import { BookingStatus } from '@generated/enums';

describe('BookingScheduleService', () => {
  let service: BookingScheduleService;

  const mockPrismaService = {
    booking: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingScheduleService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BookingScheduleService>(BookingScheduleService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCompanionSchedule', () => {
    it('should return schedule grouped by date', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          bookingNumber: 'SOC-2026-001',
          status: BookingStatus.CONFIRMED,
          startDatetime: new Date('2026-02-05T10:00:00Z'),
          endDatetime: new Date('2026-02-05T14:00:00Z'),
          locationAddress: 'Location 1',
          occasion: { id: 'occ-1', code: 'EVENT', emoji: '🎉', nameEn: 'Event' },
          hirer: { fullName: 'John Doe', avatarUrl: 'https://example.com/avatar.jpg' },
        },
        {
          id: 'booking-2',
          bookingNumber: 'SOC-2026-002',
          status: BookingStatus.ACTIVE,
          startDatetime: new Date('2026-02-05T16:00:00Z'),
          endDatetime: new Date('2026-02-05T20:00:00Z'),
          locationAddress: 'Location 2',
          occasion: { id: 'occ-2', code: 'DINNER', emoji: '🍽️', nameEn: 'Dinner' },
          hirer: { fullName: 'Jane Smith', avatarUrl: null },
        },
        {
          id: 'booking-3',
          bookingNumber: 'SOC-2026-003',
          status: BookingStatus.CONFIRMED,
          startDatetime: new Date('2026-02-06T09:00:00Z'),
          endDatetime: new Date('2026-02-06T12:00:00Z'),
          locationAddress: 'Location 3',
          occasion: null,
          hirer: { fullName: 'Bob Wilson', avatarUrl: null },
        },
      ];

      mockPrismaService.booking.findMany.mockResolvedValue(mockBookings);

      const result = await service.getCompanionSchedule(
        'companion-1',
        '2026-02-01',
        '2026-02-28',
      );

      expect(result.schedule).toHaveLength(2); // 2 different dates
      expect(result.schedule[0].date).toBe('2026-02-05');
      expect(result.schedule[0].bookings).toHaveLength(2);
      expect(result.schedule[1].date).toBe('2026-02-06');
      expect(result.schedule[1].bookings).toHaveLength(1);
    });

    it('should return empty schedule for companion with no bookings', async () => {
      mockPrismaService.booking.findMany.mockResolvedValue([]);

      const result = await service.getCompanionSchedule(
        'companion-1',
        '2026-02-01',
        '2026-02-28',
      );

      expect(result.schedule).toHaveLength(0);
    });

    it('should filter by date range', async () => {
      await service.getCompanionSchedule('companion-1', '2026-02-01', '2026-02-28');

      expect(mockPrismaService.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companionId: 'companion-1',
            startDatetime: {
              gte: new Date('2026-02-01'),
              lte: new Date('2026-02-28'),
            },
            status: {
              in: [BookingStatus.CONFIRMED, BookingStatus.ACTIVE],
            },
          }),
        }),
      );
    });
  });

  describe('getBookingRequests', () => {
    const mockRequests = [
      {
        id: 'booking-1',
        bookingNumber: 'SOC-2026-001',
        startDatetime: new Date('2026-02-05T10:00:00Z'),
        endDatetime: new Date('2026-02-05T14:00:00Z'),
        durationHours: { toNumber: () => 4 },
        locationAddress: 'Location 1',
        totalPrice: 500000,
        specialRequests: 'Please be on time',
        createdAt: new Date('2026-02-03T08:00:00Z'),
        requestExpiresAt: new Date('2026-02-04T08:00:00Z'),
        occasion: { id: 'occ-1', code: 'EVENT', emoji: '🎉', nameEn: 'Event' },
        hirer: {
          id: 'hirer-1',
          fullName: 'John Doe',
          avatarUrl: 'https://example.com/avatar.jpg',
          hirerProfile: { ratingAvg: { toNumber: () => 4.5 } },
        },
      },
    ];

    it('should return pending booking requests', async () => {
      mockPrismaService.booking.findMany.mockResolvedValue(mockRequests);

      const result = await service.getBookingRequests('companion-1', { limit: 20 });

      expect(result.requests).toHaveLength(1);
      expect(result.requests[0].id).toBe('booking-1');
      expect(result.requests[0].hirer?.displayName).toBe('John Doe');
      expect(result.nextCursor).toBeNull();
    });

    it('should return cursor for pagination when more results exist', async () => {
      // Return limit + 1 to indicate more results
      const manyRequests = Array(21)
        .fill(null)
        .map((_, i) => ({
          ...mockRequests[0],
          id: `booking-${i}`,
        }));
      mockPrismaService.booking.findMany.mockResolvedValue(manyRequests);

      const result = await service.getBookingRequests('companion-1', { limit: 20 });

      expect(result.requests).toHaveLength(20);
      expect(result.nextCursor).toBe('booking-19');
    });

    it('should filter expired requests', async () => {
      await service.getBookingRequests('companion-1', {});

      expect(mockPrismaService.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: BookingStatus.PENDING,
            requestExpiresAt: { gt: expect.any(Date) },
          }),
        }),
      );
    });
  });

  describe('checkAvailability', () => {
    it('should return available=true when no conflicts', async () => {
      mockPrismaService.booking.findMany.mockResolvedValue([]);

      const result = await service.checkAvailability(
        'companion-1',
        new Date('2026-02-05T10:00:00Z'),
        new Date('2026-02-05T14:00:00Z'),
      );

      expect(result.available).toBe(true);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should return available=false with conflicts when overlapping bookings exist', async () => {
      const conflictingBooking = {
        id: 'booking-1',
        bookingNumber: 'SOC-2026-001',
        startDatetime: new Date('2026-02-05T12:00:00Z'),
        endDatetime: new Date('2026-02-05T16:00:00Z'),
        status: BookingStatus.CONFIRMED,
      };
      mockPrismaService.booking.findMany.mockResolvedValue([conflictingBooking]);

      const result = await service.checkAvailability(
        'companion-1',
        new Date('2026-02-05T10:00:00Z'),
        new Date('2026-02-05T14:00:00Z'),
      );

      expect(result.available).toBe(false);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].id).toBe('booking-1');
    });
  });

  describe('getUpcomingBookings', () => {
    it('should return confirmed/active bookings for companion', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          bookingNumber: 'SOC-2026-001',
          status: BookingStatus.CONFIRMED,
          startDatetime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          endDatetime: new Date(Date.now() + 28 * 60 * 60 * 1000),
          durationHours: { toNumber: () => 4 },
          locationAddress: 'Location 1',
          totalPrice: 500000,
        },
      ];

      mockPrismaService.booking.findMany.mockResolvedValue(mockBookings);

      const result = await service.getUpcomingBookings('companion-1', 10);

      expect(result).toHaveLength(1);
      expect(mockPrismaService.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companionId: 'companion-1',
            status: { in: [BookingStatus.CONFIRMED, BookingStatus.ACTIVE] },
            startDatetime: { gte: expect.any(Date) },
          }),
          take: 10,
        }),
      );
    });
  });
});
