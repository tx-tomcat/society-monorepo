import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BookingsService } from './bookings.service';
import { PrismaService } from '@/prisma/prisma.service';
import { ContentReviewService } from '@/modules/moderation/services/content-review.service';
import { OccasionTrackingService } from '@/modules/occasions/services/occasion-tracking.service';
import { BookingStatus, PaymentStatus } from '@generated/client';
import { CreateBookingDto } from '../dto/booking.dto';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          or: jest.fn(() => Promise.resolve({ error: null })),
        })),
      })),
    })),
  })),
}));

describe('BookingsService', () => {
  let service: BookingsService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    companionProfile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    hirerProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    booking: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    review: {
      create: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    // Transaction mock - executes the callback with transaction-wrapped prisma methods
    $transaction: jest.fn().mockImplementation(async (callback) => {
      // Create a transaction context that mirrors the mock service
      const txContext = {
        booking: mockPrismaService.booking,
        user: mockPrismaService.user,
        companionProfile: mockPrismaService.companionProfile,
        hirerProfile: mockPrismaService.hirerProfile,
        review: mockPrismaService.review,
      };
      return callback(txContext);
    }),
  };

  const mockContentReviewService = {
    reviewText: jest.fn().mockResolvedValue({
      isSafe: true,
      flags: [],
      confidence: 0.8,
      suggestedAction: 'approve',
    }),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
      if (key === 'SUPABASE_SERVICE_KEY') return 'test-service-key';
      return null;
    }),
  };

  const mockOccasionTrackingService = {
    trackBookingCreated: jest.fn().mockResolvedValue(undefined),
    trackInteraction: jest.fn().mockResolvedValue(undefined),
    trackBatch: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ContentReviewService,
          useValue: mockContentReviewService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: OccasionTrackingService,
          useValue: mockOccasionTrackingService,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBooking', () => {
    const createBookingDto: CreateBookingDto = {
      companionId: 'user-comp-1',
      occasionId: 'occasion-casual-outing',
      startDatetime: '2025-02-01T18:00:00.000Z',
      endDatetime: '2025-02-01T21:00:00.000Z',
      locationAddress: 'Restaurant ABC, District 1, HCMC',
      locationLat: 10.762622,
      locationLng: 106.660172,
    };

    it('should create a new booking', async () => {
      const mockHirer = {
        id: 'hirer-user-1',
        fullName: 'Test Hirer',
        hirerProfile: { id: 'hirer-profile-1' },
      };

      const mockCompanion = {
        id: 'user-comp-1',
        fullName: 'Test Companion',
        companionProfile: {
          id: 'comp-1',
          hourlyRate: 500000,
          isActive: true,
        },
      };

      const mockBooking = {
        id: 'booking-1',
        bookingNumber: 'SOC-2025-ABCDEF',
        hirerId: 'hirer-user-1',
        companionId: 'user-comp-1',
        status: BookingStatus.PENDING,
        totalPrice: 1770000, // 3 hours * 500k + 18% fee
      };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockHirer)
        .mockResolvedValueOnce(mockCompanion);
      mockPrismaService.booking.findFirst.mockResolvedValue(null); // No overlapping booking
      mockPrismaService.booking.create.mockResolvedValue(mockBooking);

      const result = await service.createBooking('hirer-user-1', createBookingDto);

      expect(result.status).toBe(BookingStatus.PENDING);
      expect(result.bookingNumber).toBeDefined();
      expect(mockPrismaService.booking.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when companion not found', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce({ id: 'hirer-user-1', hirerProfile: null })
        .mockResolvedValueOnce(null);

      await expect(service.createBooking('hirer-user-1', createBookingDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when companion is not active', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce({ id: 'hirer-user-1', hirerProfile: null })
        .mockResolvedValueOnce({
          id: 'user-comp-1',
          companionProfile: { id: 'comp-1', hourlyRate: 500000, isActive: false },
        });

      await expect(service.createBooking('hirer-user-1', createBookingDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when companion has overlapping booking', async () => {
      const mockHirer = {
        id: 'hirer-user-1',
        fullName: 'Test Hirer',
        hirerProfile: { id: 'hirer-profile-1' },
      };

      const mockCompanion = {
        id: 'user-comp-1',
        fullName: 'Test Companion',
        companionProfile: {
          id: 'comp-1',
          hourlyRate: 500000,
          isActive: true,
        },
      };

      const overlappingBooking = {
        id: 'existing-booking',
        companionId: 'user-comp-1',
        startDatetime: new Date('2025-02-01T17:00:00.000Z'),
        endDatetime: new Date('2025-02-01T20:00:00.000Z'),
        status: BookingStatus.CONFIRMED,
      };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockHirer)
        .mockResolvedValueOnce(mockCompanion);
      mockPrismaService.booking.findFirst.mockResolvedValue(overlappingBooking);

      await expect(service.createBooking('hirer-user-1', createBookingDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('getHirerBookings', () => {
    it('should return hirer bookings', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          bookingNumber: 'SOC-2025-0001',
          status: BookingStatus.CONFIRMED,
          occasion: {
            id: 'occasion-casual-outing',
            code: 'casual_outing',
            emoji: '🍽️',
            nameEn: 'Casual Outing',
          },
          startDatetime: new Date('2025-02-01T18:00:00.000Z'),
          endDatetime: new Date('2025-02-01T21:00:00.000Z'),
          durationHours: 3,
          locationAddress: 'Restaurant ABC',
          totalPrice: 1770000,
          companion: {
            id: 'user-comp-1',
            fullName: 'Test Companion',
            companionProfile: {
              id: 'comp-1',
              ratingAvg: 4.5,
              photos: [{ url: 'photo1.jpg' }],
            },
          },
        },
      ];

      mockPrismaService.booking.findMany.mockResolvedValue(mockBookings);
      mockPrismaService.booking.count.mockResolvedValue(1);

      const result = await service.getHirerBookings('user-1', {});

      expect(result.bookings).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.bookings[0].companion?.displayName).toBe('Test Companion');
    });
  });

  describe('getCompanionBookings', () => {
    it('should return companion bookings', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          bookingNumber: 'SOC-2025-0001',
          status: BookingStatus.CONFIRMED,
          occasion: {
            id: 'occasion-family-intro',
            code: 'family_introduction',
            emoji: '👨‍👩‍👧',
            nameEn: 'Family Introduction',
          },
          startDatetime: new Date('2025-02-01T10:00:00.000Z'),
          endDatetime: new Date('2025-02-01T14:00:00.000Z'),
          durationHours: 4,
          locationAddress: 'Family Home, District 7',
          totalPrice: 2360000,
          hirer: {
            id: 'hirer-1',
            fullName: 'Test Hirer',
            avatarUrl: 'avatar.jpg',
            hirerProfile: { ratingAvg: 4.8 },
          },
        },
      ];

      mockPrismaService.booking.findMany.mockResolvedValue(mockBookings);
      mockPrismaService.booking.count.mockResolvedValue(1);

      const result = await service.getCompanionBookings('user-comp-1', {});

      expect(result.bookings).toHaveLength(1);
      expect(result.bookings[0].hirer?.displayName).toBe('Test Hirer');
    });
  });

  describe('getBookingDetail', () => {
    it('should return booking details for hirer', async () => {
      // Use ACTIVE status which always reveals phone regardless of date
      const today = new Date();
      const startDatetime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 18, 0, 0);
      const endDatetime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 21, 0, 0);

      const mockBooking = {
        id: 'booking-1',
        bookingNumber: 'SOC-2025-0001',
        hirerId: 'user-1',
        companionId: 'user-2',
        status: BookingStatus.ACTIVE, // ACTIVE always reveals phone
        occasion: { id: 'occasion-casual', code: 'casual_outing', emoji: '🍽️', nameEn: 'Casual Outing' },
        startDatetime,
        endDatetime,
        durationHours: 3,
        locationAddress: 'Restaurant ABC',
        locationLat: 10.762622,
        locationLng: 106.660172,
        specialRequests: null,
        basePrice: 1500000,
        platformFee: 270000,
        surgeFee: 0,
        totalPrice: 1770000,
        paymentStatus: PaymentStatus.HELD,
        requestExpiresAt: null,
        confirmedAt: new Date(),
        completedAt: null,
        cancelledAt: null,
        cancelReason: null,
        createdAt: new Date(),
        companion: {
          id: 'user-2',
          fullName: 'Companion Name',
          phone: '0907654321',
          companionProfile: {
            id: 'comp-1',
            ratingAvg: 4.5,
            photos: [{ url: 'photo1.jpg' }],
          },
        },
        hirer: {
          id: 'user-1',
          fullName: 'Hirer Name',
          avatarUrl: 'avatar.jpg',
          phone: '0901234567',
          hirerProfile: { ratingAvg: 5 },
        },
        reviews: [],
      };

      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);

      const result = await service.getBookingDetail('booking-1', 'user-1');

      expect(result.id).toBe('booking-1');
      expect(result.bookingNumber).toBe('SOC-2025-0001');
      expect(result.companion.phone).toBe('0907654321'); // Hirer can see companion phone for ACTIVE booking
    });

    it('should throw NotFoundException when booking not found', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(service.getBookingDetail('non-existent', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for unauthorized user', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        hirerId: 'other-user',
        companionId: 'another-user',
      });

      await expect(service.getBookingDetail('booking-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('should hide phone for CONFIRMED booking not on booking day', async () => {
      // Use tomorrow's date so phone should be hidden
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startDatetime = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 18, 0, 0);
      const endDatetime = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 21, 0, 0);

      const mockBooking = {
        id: 'booking-1',
        bookingNumber: 'SOC-2025-0002',
        hirerId: 'user-1',
        companionId: 'user-2',
        status: BookingStatus.CONFIRMED,
        occasion: { id: 'occasion-casual', code: 'casual_outing', emoji: '🍽️', nameEn: 'Casual Outing' },
        startDatetime,
        endDatetime,
        durationHours: 3,
        locationAddress: 'Restaurant ABC',
        locationLat: 10.762622,
        locationLng: 106.660172,
        specialRequests: null,
        basePrice: 1500000,
        platformFee: 270000,
        surgeFee: 0,
        totalPrice: 1770000,
        paymentStatus: PaymentStatus.HELD,
        requestExpiresAt: null,
        confirmedAt: new Date(),
        completedAt: null,
        cancelledAt: null,
        cancelReason: null,
        createdAt: new Date(),
        companion: {
          id: 'user-2',
          fullName: 'Companion Name',
          phone: '0907654321',
          companionProfile: {
            id: 'comp-1',
            ratingAvg: 4.5,
            photos: [{ url: 'photo1.jpg' }],
          },
        },
        hirer: {
          id: 'user-1',
          fullName: 'Hirer Name',
          avatarUrl: 'avatar.jpg',
          phone: '0901234567',
          hirerProfile: { ratingAvg: 5 },
        },
        reviews: [],
      };

      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);

      const result = await service.getBookingDetail('booking-1', 'user-1');

      expect(result.companion.phone).toBeNull(); // Phone hidden - not booking day
    });

    it('should reveal phone for ACTIVE booking regardless of date', async () => {
      // Use a past date
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const startDatetime = new Date(lastWeek.getFullYear(), lastWeek.getMonth(), lastWeek.getDate(), 18, 0, 0);
      const endDatetime = new Date(lastWeek.getFullYear(), lastWeek.getMonth(), lastWeek.getDate(), 21, 0, 0);

      const mockBooking = {
        id: 'booking-1',
        bookingNumber: 'SOC-2025-0003',
        hirerId: 'user-1',
        companionId: 'user-2',
        status: BookingStatus.ACTIVE,
        occasion: { id: 'occasion-casual', code: 'casual_outing', emoji: '🍽️', nameEn: 'Casual Outing' },
        startDatetime,
        endDatetime,
        durationHours: 3,
        locationAddress: 'Restaurant ABC',
        locationLat: 10.762622,
        locationLng: 106.660172,
        specialRequests: null,
        basePrice: 1500000,
        platformFee: 270000,
        surgeFee: 0,
        totalPrice: 1770000,
        paymentStatus: PaymentStatus.HELD,
        requestExpiresAt: null,
        confirmedAt: new Date(),
        completedAt: null,
        cancelledAt: null,
        cancelReason: null,
        createdAt: new Date(),
        companion: {
          id: 'user-2',
          fullName: 'Companion Name',
          phone: '0907654321',
          companionProfile: {
            id: 'comp-1',
            ratingAvg: 4.5,
            photos: [{ url: 'photo1.jpg' }],
          },
        },
        hirer: {
          id: 'user-1',
          fullName: 'Hirer Name',
          avatarUrl: 'avatar.jpg',
          phone: '0901234567',
          hirerProfile: { ratingAvg: 5 },
        },
        reviews: [],
      };

      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);

      const result = await service.getBookingDetail('booking-1', 'user-1');

      expect(result.companion.phone).toBe('0907654321'); // Phone revealed for ACTIVE
    });

    it('should reveal phone for COMPLETED booking', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const startDatetime = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 18, 0, 0);
      const endDatetime = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 21, 0, 0);

      const mockBooking = {
        id: 'booking-1',
        bookingNumber: 'SOC-2025-0004',
        hirerId: 'user-1',
        companionId: 'user-2',
        status: BookingStatus.COMPLETED,
        occasion: { id: 'occasion-casual', code: 'casual_outing', emoji: '🍽️', nameEn: 'Casual Outing' },
        startDatetime,
        endDatetime,
        durationHours: 3,
        locationAddress: 'Restaurant ABC',
        locationLat: 10.762622,
        locationLng: 106.660172,
        specialRequests: null,
        basePrice: 1500000,
        platformFee: 270000,
        surgeFee: 0,
        totalPrice: 1770000,
        paymentStatus: PaymentStatus.RELEASED,
        requestExpiresAt: null,
        confirmedAt: new Date(),
        completedAt: yesterday,
        cancelledAt: null,
        cancelReason: null,
        createdAt: new Date(),
        companion: {
          id: 'user-2',
          fullName: 'Companion Name',
          phone: '0907654321',
          companionProfile: {
            id: 'comp-1',
            ratingAvg: 4.5,
            photos: [{ url: 'photo1.jpg' }],
          },
        },
        hirer: {
          id: 'user-1',
          fullName: 'Hirer Name',
          avatarUrl: 'avatar.jpg',
          phone: '0901234567',
          hirerProfile: { ratingAvg: 5 },
        },
        reviews: [],
      };

      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);

      const result = await service.getBookingDetail('booking-1', 'user-1');

      expect(result.companion.phone).toBe('0907654321'); // Phone revealed for COMPLETED
    });

    it('should hide phone for PENDING booking', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startDatetime = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 18, 0, 0);
      const endDatetime = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 21, 0, 0);

      const mockBooking = {
        id: 'booking-1',
        bookingNumber: 'SOC-2025-0005',
        hirerId: 'user-1',
        companionId: 'user-2',
        status: BookingStatus.PENDING,
        occasion: { id: 'occasion-casual', code: 'casual_outing', emoji: '🍽️', nameEn: 'Casual Outing' },
        startDatetime,
        endDatetime,
        durationHours: 3,
        locationAddress: 'Restaurant ABC',
        locationLat: 10.762622,
        locationLng: 106.660172,
        specialRequests: null,
        basePrice: 1500000,
        platformFee: 270000,
        surgeFee: 0,
        totalPrice: 1770000,
        paymentStatus: PaymentStatus.PENDING,
        requestExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        confirmedAt: null,
        completedAt: null,
        cancelledAt: null,
        cancelReason: null,
        createdAt: new Date(),
        companion: {
          id: 'user-2',
          fullName: 'Companion Name',
          phone: '0907654321',
          companionProfile: {
            id: 'comp-1',
            ratingAvg: 4.5,
            photos: [{ url: 'photo1.jpg' }],
          },
        },
        hirer: {
          id: 'user-1',
          fullName: 'Hirer Name',
          avatarUrl: 'avatar.jpg',
          phone: '0901234567',
          hirerProfile: { ratingAvg: 5 },
        },
        reviews: [],
      };

      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);

      const result = await service.getBookingDetail('booking-1', 'user-1');

      expect(result.companion.phone).toBeNull(); // Phone hidden for PENDING
    });
  });

  describe('updateBookingStatus', () => {
    it('should allow companion to confirm pending booking', async () => {
      const mockBooking = {
        id: 'booking-1',
        companionId: 'user-1',
        hirerId: 'user-2',
        status: BookingStatus.PENDING,
      };

      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.HELD,
      });

      const result = await service.updateBookingStatus('booking-1', 'user-1', { status: BookingStatus.CONFIRMED });

      expect(result.status).toBe(BookingStatus.CONFIRMED);
      expect(result.paymentStatus).toBe(PaymentStatus.HELD);
    });

    it('should allow companion to start confirmed booking', async () => {
      const mockBooking = {
        id: 'booking-1',
        companionId: 'user-1',
        hirerId: 'user-2',
        status: BookingStatus.CONFIRMED,
      };

      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.ACTIVE,
      });

      const result = await service.updateBookingStatus('booking-1', 'user-1', { status: BookingStatus.ACTIVE });

      expect(result.status).toBe(BookingStatus.ACTIVE);
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      const mockBooking = {
        id: 'booking-1',
        companionId: 'user-1',
        hirerId: 'user-2',
        status: BookingStatus.COMPLETED,
      };

      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(
        service.updateBookingStatus('booking-1', 'user-1', { status: BookingStatus.CONFIRMED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when hirer tries to confirm', async () => {
      const mockBooking = {
        id: 'booking-1',
        companionId: 'user-2',
        hirerId: 'user-1',
        status: BookingStatus.PENDING,
      };

      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(
        service.updateBookingStatus('booking-1', 'user-1', { status: BookingStatus.CONFIRMED }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getBookingRequests', () => {
    it('should return pending booking requests for companion', async () => {
      const mockRequests = [
        {
          id: 'booking-1',
          bookingNumber: 'SOC-2025-0001',
          occasion: { id: 'occasion-wedding', code: 'wedding_attendance', emoji: '💒', nameEn: 'Wedding Attendance' },
          startDatetime: new Date('2025-02-15T08:00:00.000Z'),
          endDatetime: new Date('2025-02-15T16:00:00.000Z'),
          durationHours: 8,
          locationAddress: 'Wedding Venue, District 2',
          totalPrice: 4720000,
          specialRequests: 'Formal attire required',
          createdAt: new Date(),
          requestExpiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
          hirer: {
            id: 'hirer-1',
            fullName: 'Test Hirer',
            avatarUrl: null,
            hirerProfile: { ratingAvg: 4.5 },
          },
        },
      ];

      mockPrismaService.booking.findMany.mockResolvedValue(mockRequests);

      const result = await service.getBookingRequests('user-comp-1');

      expect(result.requests).toHaveLength(1);
      expect(result.requests[0].occasion?.code).toBe('wedding_attendance');
    });
  });

  describe('submitReview', () => {
    it('should create review for completed booking', async () => {
      const mockBooking = {
        id: 'booking-1',
        hirerId: 'user-1',
        companionId: 'user-2',
        status: BookingStatus.COMPLETED,
        reviews: [],
        companion: {
          id: 'user-2',
          companionProfile: { id: 'comp-1', ratingAvg: 4.5, ratingCount: 10 },
        },
      };

      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.review.create.mockResolvedValue({
        id: 'review-1',
        rating: 5,
        comment: 'Great experience',
        tags: ['friendly', 'punctual'],
      });
      mockPrismaService.review.aggregate.mockResolvedValue({
        _count: { rating: 11 },
        _avg: { rating: 4.55 },
      });
      mockPrismaService.companionProfile.update.mockResolvedValue({});

      const result = await service.submitReview('booking-1', 'user-1', {
        rating: 5,
        comment: 'Great experience',
        tags: ['friendly', 'punctual'],
      });

      expect(result.rating).toBe(5);
      expect(mockPrismaService.review.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          bookingId: 'booking-1',
          reviewerId: 'user-1',
          revieweeId: 'user-2',
          rating: 5,
        }),
      });
    });

    it('should throw BadRequestException for non-completed booking', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        hirerId: 'user-1',
        status: BookingStatus.CONFIRMED,
        reviews: [],
      });

      await expect(
        service.submitReview('booking-1', 'user-1', { rating: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when review already exists', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        hirerId: 'user-1',
        companionId: 'user-2',
        status: BookingStatus.COMPLETED,
        reviews: [{ id: 'existing-review' }],
      });

      await expect(
        service.submitReview('booking-1', 'user-1', { rating: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when non-hirer tries to review', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        hirerId: 'other-user',
        companionId: 'user-2',
        status: BookingStatus.COMPLETED,
        reviews: [],
      });

      await expect(
        service.submitReview('booking-1', 'user-1', { rating: 5 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject review with profanity', async () => {
      const mockBooking = {
        id: 'booking-1',
        hirerId: 'user-1',
        companionId: 'user-2',
        status: BookingStatus.COMPLETED,
        completedAt: new Date(),
        reviews: [],
        companion: {
          id: 'user-2',
          companionProfile: { id: 'comp-1', ratingAvg: 4.5, ratingCount: 10 },
        },
      };

      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockContentReviewService.reviewText.mockResolvedValue({
        isSafe: false,
        flags: ['profanity'],
        confidence: 0.9,
        suggestedAction: 'reject',
      });

      await expect(
        service.submitReview('booking-1', 'user-1', {
          rating: 1,
          comment: 'This person was a f***ing idiot',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockContentReviewService.reviewText).toHaveBeenCalledWith(
        'This person was a f***ing idiot',
      );
    });

    it('should allow review with clean content', async () => {
      const mockBooking = {
        id: 'booking-1',
        hirerId: 'user-1',
        companionId: 'user-2',
        status: BookingStatus.COMPLETED,
        completedAt: new Date(),
        reviews: [],
        companion: {
          id: 'user-2',
          companionProfile: { id: 'comp-1', ratingAvg: 4.5, ratingCount: 10 },
        },
      };

      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockContentReviewService.reviewText.mockResolvedValue({
        isSafe: true,
        flags: [],
        confidence: 0.95,
        suggestedAction: 'approve',
      });
      mockPrismaService.review.create.mockResolvedValue({
        id: 'review-1',
        rating: 5,
        comment: 'Great experience, very professional',
        tags: ['professional'],
      });
      mockPrismaService.review.aggregate.mockResolvedValue({
        _count: { rating: 11 },
        _avg: { rating: 4.95 },
      });
      mockPrismaService.companionProfile.update.mockResolvedValue({});

      const result = await service.submitReview('booking-1', 'user-1', {
        rating: 5,
        comment: 'Great experience, very professional',
        tags: ['professional'],
      });

      expect(result.rating).toBe(5);
      expect(mockContentReviewService.reviewText).toHaveBeenCalledWith(
        'Great experience, very professional',
      );
    });
  });

  describe('updateBookingLocation', () => {
    it('should update location for active booking', async () => {
      const mockBooking = {
        id: 'booking-1',
        hirerId: 'user-1',
        companionId: 'user-2',
        status: BookingStatus.ACTIVE,
      };

      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...mockBooking,
        locationLat: 10.8,
        locationLng: 106.7,
      });

      const result = await service.updateBookingLocation('booking-1', 'user-1', {
        latitude: 10.8,
        longitude: 106.7,
      });

      expect(result.success).toBe(true);
    });

    it('should throw BadRequestException for non-active booking', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        hirerId: 'user-1',
        companionId: 'user-2',
        status: BookingStatus.CONFIRMED,
      });

      await expect(
        service.updateBookingLocation('booking-1', 'user-1', { latitude: 10.8, longitude: 106.7 }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
