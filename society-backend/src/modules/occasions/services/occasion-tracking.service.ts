import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { OccasionEventType as PrismaOccasionEventType, Prisma } from '@generated/client';
import {
  TrackOccasionInteractionDto,
  TrackOccasionBatchDto,
  OccasionMetricsDto,
  OccasionEventType,
} from '../dto/occasion.dto';

@Injectable()
export class OccasionTrackingService {
  private readonly logger = new Logger(OccasionTrackingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Track a single occasion interaction (fire-and-forget pattern)
   *
   * @remarks
   * This method performs async database writes. HTTP endpoints should use fire-and-forget
   * pattern (don't await, catch errors) for optimal UX.
   *
   * @example
   * // HTTP endpoint (fire-and-forget)
   * this.trackingService.trackInteraction(userId, dto).catch(err => logger.warn(err));
   */
  async trackInteraction(
    userId: string | null,
    dto: TrackOccasionInteractionDto,
  ): Promise<void> {
    try {
      await this.prisma.raw.occasionInteraction.create({
        data: {
          userId,
          occasionId: dto.occasionId,
          eventType: dto.eventType as PrismaOccasionEventType,
          sessionId: dto.sessionId,
          metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });

      this.logger.debug(
        `Tracked ${dto.eventType} for occasion ${dto.occasionId}`,
      );
    } catch (error) {
      // Log but don't throw - this is best-effort tracking
      // Fire-and-forget callers expect this to fail silently
      this.logger.warn(
        `Failed to track occasion interaction: occasionId=${dto.occasionId}, eventType=${dto.eventType}`,
        error instanceof Error ? error.stack : error,
      );
      // Don't re-throw - tracking failures should not affect user experience
    }
  }

  /**
   * Track batch occasion views (fire-and-forget pattern)
   * Used when multiple occasions are displayed at once
   *
   * @example
   * // HTTP endpoint (fire-and-forget)
   * this.trackingService.trackBatch(userId, dto).catch(err => logger.warn(err));
   */
  async trackBatch(
    userId: string | null,
    dto: TrackOccasionBatchDto,
  ): Promise<void> {
    if (dto.occasionIds.length === 0) return;

    try {
      await this.prisma.raw.occasionInteraction.createMany({
        data: dto.occasionIds.map((occasionId) => ({
          userId,
          occasionId,
          eventType: dto.eventType as PrismaOccasionEventType,
          sessionId: dto.sessionId,
          metadata: {},
        })),
        skipDuplicates: true,
      });

      this.logger.debug(
        `Tracked batch ${dto.eventType} for ${dto.occasionIds.length} occasions`,
      );
    } catch (error) {
      // Log but don't throw - this is best-effort tracking
      this.logger.warn(
        `Failed to track batch occasion interactions: eventType=${dto.eventType}, count=${dto.occasionIds.length}`,
        error instanceof Error ? error.stack : error,
      );
      // Don't re-throw - tracking failures should not affect user experience
    }
  }

  /**
   * Track occasion selection when user picks an occasion for booking
   */
  async trackSelection(
    userId: string | null,
    occasionId: string,
    sessionId?: string,
  ): Promise<void> {
    return this.trackInteraction(userId, {
      occasionId,
      eventType: 'SELECT',
      sessionId,
    });
  }

  /**
   * Track when a booking is created with a specific occasion
   * Called from bookings service when booking is confirmed
   */
  async trackBookingCreated(
    userId: string,
    occasionId: string,
    bookingId: string,
  ): Promise<void> {
    return this.trackInteraction(userId, {
      occasionId,
      eventType: 'BOOKING_CREATED',
      metadata: { bookingId },
    });
  }

  /**
   * Get occasion usage metrics (admin endpoint)
   * Returns aggregated metrics for all occasions
   * Optimized to use groupBy instead of N+1 queries
   */
  async getMetrics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<OccasionMetricsDto[]> {
    const dateFilter = {
      ...(startDate && { gte: startDate }),
      ...(endDate && { lte: endDate }),
    };

    // Fetch all occasions
    const occasions = await this.prisma.occasion.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });

    // Fetch all counts in 3 queries using groupBy (instead of 3*N queries)
    const [viewCounts, selectCounts, bookingCounts] = await Promise.all([
      this.prisma.raw.occasionInteraction.groupBy({
        by: ['occasionId'],
        where: {
          eventType: 'VIEW',
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        },
        _count: { id: true },
      }),
      this.prisma.raw.occasionInteraction.groupBy({
        by: ['occasionId'],
        where: {
          eventType: 'SELECT',
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        },
        _count: { id: true },
      }),
      this.prisma.raw.occasionInteraction.groupBy({
        by: ['occasionId'],
        where: {
          eventType: 'BOOKING_CREATED',
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        },
        _count: { id: true },
      }),
    ]);

    // Create lookup maps for O(1) access
    const viewMap = new Map(viewCounts.map((c) => [c.occasionId, c._count.id]));
    const selectMap = new Map(selectCounts.map((c) => [c.occasionId, c._count.id]));
    const bookingMap = new Map(bookingCounts.map((c) => [c.occasionId, c._count.id]));

    // Build metrics array
    const metrics: OccasionMetricsDto[] = occasions.map((occasion) => {
      const viewCount = viewMap.get(occasion.id) ?? 0;
      const selectCount = selectMap.get(occasion.id) ?? 0;
      const bookingCount = bookingMap.get(occasion.id) ?? 0;

      return {
        occasionId: occasion.id,
        code: occasion.code,
        name: occasion.nameVi,
        viewCount,
        selectCount,
        bookingCount,
        conversionRate: selectCount > 0 ? bookingCount / selectCount : 0,
      };
    });

    // Sort by booking count (most popular first)
    return metrics.sort((a, b) => b.bookingCount - a.bookingCount);
  }

  /**
   * Get top occasions by usage for a time period
   */
  async getTopOccasions(
    limit: number = 10,
    eventType: OccasionEventType = 'BOOKING_CREATED',
    days: number = 30,
  ): Promise<{ occasionId: string; code: string; name: string; count: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.prisma.raw.$queryRaw<
      { occasion_id: string; count: bigint }[]
    >`
      SELECT occasion_id, COUNT(*) as count
      FROM occasion_interactions
      WHERE event_type = ${eventType}::\"OccasionEventType\"
        AND created_at >= ${startDate}
      GROUP BY occasion_id
      ORDER BY count DESC
      LIMIT ${limit}
    `;

    const occasionIds = result.map((r) => r.occasion_id);
    const occasions = await this.prisma.occasion.findMany({
      where: { id: { in: occasionIds } },
    });

    const occasionMap = new Map(occasions.map((o) => [o.id, o]));

    return result.map((r) => {
      const occasion = occasionMap.get(r.occasion_id);
      return {
        occasionId: r.occasion_id,
        code: occasion?.code ?? 'unknown',
        name: occasion?.nameVi ?? 'Unknown',
        count: Number(r.count),
      };
    });
  }
}
