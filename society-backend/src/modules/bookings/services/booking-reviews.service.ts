import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ContentReviewService } from '@/modules/moderation/services/content-review.service';
import { ReviewWindowExpiredException } from '@/common/exceptions';
import { BookingStatus } from '@generated/enums';
import { SubmitReviewDto, EditReviewDto, DisputeReviewDto } from '../dto/booking.dto';

const REVIEW_WINDOW_DAYS = 7;
const EDIT_WINDOW_HOURS = 24;
const DISPUTE_WINDOW_DAYS = 7;

@Injectable()
export class BookingReviewsService {
  private readonly logger = new Logger(BookingReviewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly contentReviewService: ContentReviewService,
  ) {}

  async submitReview(
    userId: string,
    bookingId: string,
    dto: SubmitReviewDto,
  ) {
    // Booking.companion is a User, not CompanionProfile
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        companion: {
          select: {
            id: true,
            companionProfile: { select: { id: true, userId: true } },
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.hirerId !== userId) {
      throw new ForbiddenException('You can only review your own bookings');
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Can only review completed bookings');
    }

    // Check review window
    const daysSinceEnd = this.getDaysSince(booking.endDatetime);
    if (daysSinceEnd > REVIEW_WINDOW_DAYS) {
      throw new ReviewWindowExpiredException(REVIEW_WINDOW_DAYS);
    }

    // Check for existing review
    const existingReview = await this.prisma.review.findFirst({
      where: { bookingId, reviewerId: userId },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this booking');
    }

    // Content moderation using reviewText method
    if (dto.comment) {
      const contentCheck = await this.contentReviewService.reviewText(dto.comment);
      if (!contentCheck.isSafe) {
        throw new BadRequestException('Review contains inappropriate content');
      }
    }

    // Create review and update companion rating in transaction
    // Review uses revieweeId (User ID), not companionId
    const companionUserId = booking.companionId; // This is the User ID
    const companionProfileId = booking.companion.companionProfile?.id;

    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          bookingId,
          reviewerId: userId,
          revieweeId: companionUserId, // Review.revieweeId is the User ID
          rating: dto.rating,
          comment: dto.comment,
          tags: dto.tags,
          isVisible: dto.isVisible ?? true,
        },
      });

      // Recalculate companion rating if they have a profile
      if (companionProfileId) {
        const stats = await tx.review.aggregate({
          where: { revieweeId: companionUserId, isVisible: true },
          _avg: { rating: true },
          _count: { rating: true },
        });

        await tx.companionProfile.update({
          where: { id: companionProfileId },
          data: {
            ratingAvg: stats._avg.rating || 0,
            ratingCount: stats._count.rating,
          },
        });
      }

      this.logger.log(`Review submitted for booking ${bookingId}`, {
        reviewId: review.id,
        rating: dto.rating,
      });

      return review;
    });
  }

  async editReview(userId: string, reviewId: string, dto: EditReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        booking: true,
        reviewee: {
          select: {
            companionProfile: { select: { id: true } },
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.reviewerId !== userId) {
      throw new ForbiddenException('You can only edit your own reviews');
    }

    // Check edit window (24 hours)
    const hoursSinceCreation = this.getHoursSince(review.createdAt);
    if (hoursSinceCreation > EDIT_WINDOW_HOURS) {
      throw new BadRequestException(
        `Review can only be edited within ${EDIT_WINDOW_HOURS} hours`,
      );
    }

    // Content moderation using reviewText method
    if (dto.comment) {
      const contentCheck = await this.contentReviewService.reviewText(dto.comment);
      if (!contentCheck.isSafe) {
        throw new BadRequestException('Review contains inappropriate content');
      }
    }

    const companionProfileId = review.reviewee.companionProfile?.id;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id: reviewId },
        data: {
          rating: dto.rating,
          comment: dto.comment,
          tags: dto.tags,
        },
      });

      // Recalculate companion rating if rating changed
      if (dto.rating !== undefined && companionProfileId) {
        const stats = await tx.review.aggregate({
          where: { revieweeId: review.revieweeId, isVisible: true },
          _avg: { rating: true },
          _count: { rating: true },
        });

        await tx.companionProfile.update({
          where: { id: companionProfileId },
          data: {
            ratingAvg: stats._avg.rating || 0,
          },
        });
      }

      return updated;
    });
  }

  async disputeReview(userId: string, reviewId: string, _dto: DisputeReviewDto) {
    // Note: The Review model only has isDisputed flag, no reason or timestamp fields
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        booking: {
          include: { companion: true }, // companion is User
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only companion (reviewee) can dispute - booking.companionId is the User ID
    if (review.booking.companionId !== userId) {
      throw new ForbiddenException('Only the companion can dispute this review');
    }

    // Check dispute window
    const daysSinceReview = this.getDaysSince(review.createdAt);
    if (daysSinceReview > DISPUTE_WINDOW_DAYS) {
      throw new BadRequestException(
        `Reviews can only be disputed within ${DISPUTE_WINDOW_DAYS} days`,
      );
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        isDisputed: true,
        // Note: Schema doesn't have disputeReason or disputedAt fields
        // A Report could be created separately if needed for dispute reason
      },
    });
  }

  async canDisputeReview(userId: string, reviewId: string): Promise<{ canDispute: boolean; reason?: string }> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        booking: { include: { companion: true } }, // companion is User
      },
    });

    if (!review) {
      return { canDispute: false, reason: 'Review not found' };
    }

    // Only companion (reviewee) can dispute
    if (review.booking.companionId !== userId) {
      return { canDispute: false, reason: 'Only the companion can dispute this review' };
    }

    if (review.isDisputed) {
      return { canDispute: false, reason: 'Review has already been disputed' };
    }

    const daysSinceReview = this.getDaysSince(review.createdAt);
    if (daysSinceReview > DISPUTE_WINDOW_DAYS) {
      return { canDispute: false, reason: `Dispute window of ${DISPUTE_WINDOW_DAYS} days has expired` };
    }

    return { canDispute: true };
  }

  private getDaysSince(date: Date): number {
    return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  private getHoursSince(date: Date): number {
    return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
  }
}
