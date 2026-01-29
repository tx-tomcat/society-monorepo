import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '@/prisma/prisma.service';
import { BookingStatus } from '@generated/client';

describe('DashboardService', () => {
  let service: DashboardService;

  const mockPrismaService = {
    companionProfile: {
      findUnique: jest.fn(),
    },
    booking: {
      findMany: jest.fn(),
    },
    review: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboard', () => {
    it('should return dashboard data for companion', async () => {
      const mockCompanion = {
        id: 'comp-1',
        userId: 'user-1',
        ratingAvg: 4.5,
        ratingCount: 10,
        responseRate: 95,
        completedBookings: 49,
        totalBookings: 50,
      };

      const now = new Date();
      const futureTime = new Date(now);
      futureTime.setHours(futureTime.getHours() + 2);

      const mockTodaysBookings = [
        {
          id: 'booking-1',
          status: BookingStatus.CONFIRMED,
          startDatetime: futureTime,
          endDatetime: new Date(futureTime.getTime() + 3 * 60 * 60 * 1000),
          locationAddress: 'Coffee Shop',
          occasionId: 'occasion-1',
          occasion: { id: 'occasion-1', code: 'cafe', nameEn: 'Cafe Meetup', emoji: '☕' },
          basePrice: 300000,
          totalPrice: 354000,
          createdAt: new Date(),
          updatedAt: new Date(),
          hirer: { id: 'hirer-1', fullName: 'John', avatarUrl: null },
        },
      ];

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(18, 0, 0, 0);

      const mockUpcomingBookings = [
        {
          id: 'booking-2',
          status: BookingStatus.CONFIRMED,
          startDatetime: tomorrow,
          endDatetime: new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000),
          locationAddress: 'Restaurant',
          occasionId: 'occasion-2',
          occasion: { id: 'occasion-2', code: 'business_meeting', nameEn: 'Business Meeting', emoji: '💼' },
          basePrice: 1270000,
          totalPrice: 1500000,
          createdAt: new Date(),
          updatedAt: new Date(),
          hirer: { id: 'hirer-2', fullName: 'Jane', avatarUrl: null },
        },
      ];

      mockPrismaService.companionProfile.findUnique.mockResolvedValue(mockCompanion);
      mockPrismaService.booking.findMany
        .mockResolvedValueOnce(mockTodaysBookings) // Today's bookings
        .mockResolvedValueOnce([]) // Completed today bookings (for earnings)
        .mockResolvedValueOnce(mockUpcomingBookings) // Upcoming bookings
        .mockResolvedValueOnce(mockTodaysBookings) // Recent activity bookings
        .mockResolvedValueOnce([]); // This month's bookings for stats

      mockPrismaService.review.findMany.mockResolvedValue([]);

      const result = await service.getDashboard('user-1');

      expect(result.todaysSummary.bookingsCount).toBe(1);
      expect(result.upcomingBookings).toHaveLength(1);
      expect(result.stats.rating).toBe(4.5);
    });

    it('should throw NotFoundException when companion not found', async () => {
      mockPrismaService.companionProfile.findUnique.mockResolvedValue(null);

      await expect(service.getDashboard('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should calculate next booking correctly', async () => {
      const now = new Date();
      const futureTime = new Date(now);
      futureTime.setHours(futureTime.getHours() + 2);

      const mockCompanion = {
        id: 'comp-1',
        ratingAvg: 4.5,
        ratingCount: 5,
        responseRate: 90,
        completedBookings: 19,
        totalBookings: 20,
      };

      const mockTodaysBookings = [
        {
          id: 'booking-1',
          status: BookingStatus.CONFIRMED,
          startDatetime: futureTime,
          endDatetime: new Date(futureTime.getTime() + 4 * 60 * 60 * 1000),
          locationAddress: 'Event Venue',
          occasionId: 'occasion-3',
          occasion: { id: 'occasion-3', code: 'wedding', nameEn: 'Wedding', emoji: '💒' },
          basePrice: 850000,
          totalPrice: 1000000,
          createdAt: new Date(),
          updatedAt: new Date(),
          hirer: { id: 'hirer-1', fullName: 'Event Host', avatarUrl: null },
        },
      ];

      mockPrismaService.companionProfile.findUnique.mockResolvedValue(mockCompanion);
      mockPrismaService.booking.findMany
        .mockResolvedValueOnce(mockTodaysBookings) // Today's bookings
        .mockResolvedValueOnce([]) // Completed today bookings
        .mockResolvedValueOnce([]) // Upcoming bookings
        .mockResolvedValueOnce([]) // Recent activity
        .mockResolvedValueOnce([]); // This month stats
      mockPrismaService.review.findMany.mockResolvedValue([]);

      const result = await service.getDashboard('user-1');

      expect(result.todaysSummary.nextBooking).toBeDefined();
      expect(result.todaysSummary.nextBooking?.id).toBe('booking-1');
    });
  });
});
