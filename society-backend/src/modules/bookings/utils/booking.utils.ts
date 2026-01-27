import { OccasionInfo } from '../dto/booking.dto';

/**
 * Utility functions for booking-related data transformations
 */
export class BookingUtils {
  /**
   * Map Prisma Occasion to DTO OccasionInfo
   * Extracts only the fields needed for API responses
   */
  static mapOccasion(
    occasion: { id: string; code: string; emoji: string; nameEn: string } | null,
  ): OccasionInfo | null {
    if (!occasion) return null;

    return {
      id: occasion.id,
      code: occasion.code,
      emoji: occasion.emoji,
      name: occasion.nameEn,
    };
  }

  /**
   * Reusable Prisma select clause for occasions
   * Use in queries: include: { occasion: { select: BookingUtils.OCCASION_SELECT } }
   */
  static readonly OCCASION_SELECT = {
    id: true,
    code: true,
    emoji: true,
    nameEn: true,
  } as const;
}
