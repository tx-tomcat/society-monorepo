import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { BookingReviewsService } from './booking-reviews.service';
import { PrismaService } from '@/prisma/prisma.service';
import { ContentReviewService } from '@/modules/moderation/services/content-review.service';
import { BookingStatus } from '@generated/enums';
import { ReviewWindowExpiredException } from '@/common/exceptions';

describe('BookingReviewsService', () => {
  let service: BookingReviewsService;

  const mockPrismaService = {
    booking: {
      findUnique: jest.fn(),
    },
    review: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
    },
    companionProfile: {
      update: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(async (callback) => {
      return callback(mockPrismaService);
    }),
  };

  const mockContentReviewService = {
    reviewText: jest.fn().mockResolvedValue({ isSafe: true, flags: [], confidence: 0.9 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingReviewsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ContentReviewService, useValue: mockContentReviewService },
      ],
    }).compile();

    service = module.get<BookingReviewsService>(BookingReviewsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitReview', () => {
    // Booking.companion is a User with optional companionProfile
    const mockBooking = {
      id: 'booking-123',
      hirerId: 'hirer-1',
      companionId: 'companion-user-1', // User ID
      status: BookingStatus.COMPLETED,
      endDatetime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      companion: {
        id: 'companion-user-1',
        companionProfile: { id: 'profile-1', userId: 'companion-user-1' },
      },
    };

    it('should submit a review for completed booking', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.review.findFirst.mockResolvedValue(null);
      mockPrismaService.review.create.mockResolvedValue({
        id: 'review-1',
        rating: 5,
        comment: 'Great experience',
      });
      mockPrismaService.review.aggregate.mockResolvedValue({
        _avg: { rating: 4.5 },
        _count: { rating: 10 },
      });

      const result = await service.submitReview('hirer-1', 'booking-123', {
        rating: 5,
        comment: 'Great experience',
      });

      expect(result.id).toBe('review-1');
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.review.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          bookingId: 'booking-123',
          reviewerId: 'hirer-1',
          revieweeId: 'companion-user-1', // Uses revieweeId, not companionId
          rating: 5,
          comment: 'Great experience',
        }),
      });
    });

    it('should throw if booking not found', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.submitReview('hirer-1', 'booking-123', { rating: 5 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if user is not the hirer', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(
        service.submitReview('wrong-user', 'booking-123', { rating: 5 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw if booking is not completed', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.PENDING,
      });

      await expect(
        service.submitReview('hirer-1', 'booking-123', { rating: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if review window expired (>7 days)', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        endDatetime: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      });

      await expect(
        service.submitReview('hirer-1', 'booking-123', { rating: 5 }),
      ).rejects.toThrow(ReviewWindowExpiredException);
    });

    it('should throw if review already exists', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.review.findFirst.mockResolvedValue({ id: 'existing-review' });

      await expect(
        service.submitReview('hirer-1', 'booking-123', { rating: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject review with inappropriate content', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.review.findFirst.mockResolvedValue(null);
      mockContentReviewService.reviewText.mockResolvedValueOnce({
        isSafe: false,
        flags: ['profanity'],
        confidence: 0.9,
      });

      await expect(
        service.submitReview('hirer-1', 'booking-123', {
          rating: 5,
          comment: 'Inappropriate content here',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update companion profile rating after review', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.review.findFirst.mockResolvedValue(null);
      mockPrismaService.review.create.mockResolvedValue({
        id: 'review-1',
        rating: 5,
      });
      mockPrismaService.review.aggregate.mockResolvedValue({
        _avg: { rating: 4.75 },
        _count: { rating: 20 },
      });

      await service.submitReview('hirer-1', 'booking-123', { rating: 5 });

      expect(mockPrismaService.companionProfile.update).toHaveBeenCalledWith({
        where: { id: 'profile-1' },
        data: {
          ratingAvg: 4.75,
          ratingCount: 20,
        },
      });
    });
  });

  describe('editReview', () => {
    const mockReview = {
      id: 'review-1',
      reviewerId: 'hirer-1',
      revieweeId: 'companion-user-1',
      rating: 4,
      comment: 'Good',
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      booking: { id: 'booking-123' },
      reviewee: {
        companionProfile: { id: 'profile-1' },
      },
    };

    it('should edit review within 24 hours', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(mockReview);
      mockPrismaService.review.update.mockResolvedValue({
        ...mockReview,
        rating: 5,
        comment: 'Updated comment',
      });
      mockPrismaService.review.aggregate.mockResolvedValue({
        _avg: { rating: 4.5 },
        _count: { rating: 10 },
      });

      const result = await service.editReview('hirer-1', 'review-1', {
        rating: 5,
        comment: 'Updated comment',
      });

      expect(result.rating).toBe(5);
      expect(mockPrismaService.review.update).toHaveBeenCalled();
    });

    it('should throw if edit window expired (>24 hours)', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue({
        ...mockReview,
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
      });

      await expect(
        service.editReview('hirer-1', 'review-1', { rating: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if user is not the reviewer', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(mockReview);

      await expect(
        service.editReview('wrong-user', 'review-1', { rating: 5 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('disputeReview', () => {
    const mockReview = {
      id: 'review-1',
      reviewerId: 'hirer-1',
      revieweeId: 'companion-user-1',
      isDisputed: false,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      booking: {
        id: 'booking-123',
        companionId: 'companion-user-1', // User ID
        companion: { id: 'companion-user-1' },
      },
    };

    it('should allow companion to dispute review within 7 days', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(mockReview);
      mockPrismaService.review.update.mockResolvedValue({
        ...mockReview,
        isDisputed: true,
      });

      const result = await service.disputeReview(
        'companion-user-1',
        'review-1',
        { reason: 'Unfair review' },
      );

      expect(result.isDisputed).toBe(true);
      expect(mockPrismaService.review.update).toHaveBeenCalledWith({
        where: { id: 'review-1' },
        data: { isDisputed: true },
      });
    });

    it('should throw if user is not the companion', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(mockReview);

      await expect(
        service.disputeReview('hirer-1', 'review-1', { reason: 'Reason' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw if dispute window expired (>7 days)', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue({
        ...mockReview,
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      });

      await expect(
        service.disputeReview('companion-user-1', 'review-1', { reason: 'Reason' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('canDisputeReview', () => {
    const mockReview = {
      id: 'review-1',
      reviewerId: 'hirer-1',
      isDisputed: false,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      booking: {
        id: 'booking-123',
        companionId: 'companion-user-1',
        companion: { id: 'companion-user-1' },
      },
    };

    it('should return canDispute: true for valid companion', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(mockReview);

      const result = await service.canDisputeReview('companion-user-1', 'review-1');

      expect(result.canDispute).toBe(true);
    });

    it('should return canDispute: false if review not found', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue(null);

      const result = await service.canDisputeReview('companion-user-1', 'review-1');

      expect(result.canDispute).toBe(false);
      expect(result.reason).toBe('Review not found');
    });

    it('should return canDispute: false if already disputed', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue({
        ...mockReview,
        isDisputed: true,
      });

      const result = await service.canDisputeReview('companion-user-1', 'review-1');

      expect(result.canDispute).toBe(false);
      expect(result.reason).toContain('already been disputed');
    });

    it('should return canDispute: false if dispute window expired', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue({
        ...mockReview,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      });

      const result = await service.canDisputeReview('companion-user-1', 'review-1');

      expect(result.canDispute).toBe(false);
      expect(result.reason).toContain('expired');
    });
  });
});
