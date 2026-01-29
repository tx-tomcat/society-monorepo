import {
  CACHE_KEYS,
  CACHE_TTL,
  CachePatternsService,
} from '@/modules/cache/cache-patterns.service';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ContextDto,
  CreateHolidayDto,
  CreateOccasionDto,
  DayType,
  HolidayDto,
  OccasionDetailDto,
  OccasionDto,
  OccasionsResponseDto,
  TimeSlot,
  UpdateHolidayDto,
  UpdateOccasionDto,
} from '../dto/occasion.dto';

@Injectable()
export class OccasionsService {
  constructor(
    private prisma: PrismaService,
    private cachePatterns: CachePatternsService,
  ) { }

  /**
   * Get contextual occasions based on current time, day, and active holidays
   */
  async getContextualOccasions(
    language: 'en' | 'vi' = 'vi',
    timezone: string = 'Asia/Ho_Chi_Minh',
  ): Promise<OccasionsResponseDto> {
    const context = await this.detectContext(timezone);

    // Build query conditions for contextual filtering
    const occasions = await this.prisma.occasion.findMany({
      where: {
        isActive: true,
        AND: [
          // Time slot filter: empty array or contains current time slot
          {
            OR: [
              { timeSlots: { isEmpty: true } },
              { timeSlots: { has: context.timeSlot } },
            ],
          },
          // Day type filter: empty array or contains current day type
          {
            OR: [
              { dayTypes: { isEmpty: true } },
              { dayTypes: { has: context.dayType } },
            ],
          },
          // Holiday filter: if no active holidays, only show non-holiday occasions
          // If holidays active, show matching holiday occasions OR non-holiday occasions
          context.activeHolidays.length > 0
            ? {
              OR: [
                { holidays: { isEmpty: true } },
                { holidays: { hasSome: context.activeHolidays } },
              ],
            }
            : { holidays: { isEmpty: true } },
        ],
      },
      orderBy: { displayOrder: 'asc' },
    });

    return {
      occasions: occasions.map((o) => this.mapToOccasionDto(o, language)),
      context,
    };
  }

  /**
   * Get all active occasions without context filtering
   * Cached for 24 hours since occasions rarely change
   */
  async getAllOccasions(language: 'en' | 'vi' = 'vi'): Promise<OccasionDto[]> {
    const cacheKey = `${CACHE_KEYS.occasionsAll()}:${language}`;

    const occasions = await this.cachePatterns.getOrFetch(
      cacheKey,
      CACHE_TTL.OCCASIONS,
      async () => {
        return this.prisma.occasion.findMany({
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        });
      },
    );
    if (!occasions) return [];
    return occasions.map((o) => this.mapToOccasionDto(o, language));
  }

  /**
   * Get occasion by ID
   */
  async getOccasionById(id: string): Promise<OccasionDetailDto> {
    const occasion = await this.prisma.occasion.findUnique({
      where: { id },
    });

    if (!occasion) {
      throw new NotFoundException(`Occasion with ID ${id} not found`);
    }

    return this.mapToOccasionDetailDto(occasion);
  }

  /**
   * Get occasion by code
   */
  async getOccasionByCode(code: string): Promise<OccasionDetailDto> {
    const occasion = await this.prisma.occasion.findUnique({
      where: { code },
    });

    if (!occasion) {
      throw new NotFoundException(`Occasion with code ${code} not found`);
    }

    return this.mapToOccasionDetailDto(occasion);
  }

  // ==================== Admin Methods ====================

  /**
   * List all occasions (admin)
   */
  async listAllOccasions(): Promise<OccasionDetailDto[]> {
    const occasions = await this.prisma.occasion.findMany({
      orderBy: { displayOrder: 'asc' },
    });

    return occasions.map((o) => this.mapToOccasionDetailDto(o));
  }

  /**
   * Create occasion (admin)
   */
  async createOccasion(dto: CreateOccasionDto): Promise<OccasionDetailDto> {
    const occasion = await this.prisma.occasion.create({
      data: {
        code: dto.code,
        emoji: dto.emoji,
        nameEn: dto.nameEn,
        nameVi: dto.nameVi,
        descriptionEn: dto.descriptionEn,
        descriptionVi: dto.descriptionVi,
        displayOrder: dto.displayOrder ?? 0,
        isActive: dto.isActive ?? true,
        timeSlots: dto.timeSlots ?? [],
        dayTypes: dto.dayTypes ?? [],
        holidays: dto.holidays ?? [],
      },
    });

    // Invalidate occasions cache for both languages
    await this.invalidateOccasionsCache();

    return this.mapToOccasionDetailDto(occasion);
  }

  /**
   * Update occasion (admin)
   */
  async updateOccasion(
    id: string,
    dto: UpdateOccasionDto,
  ): Promise<OccasionDetailDto> {
    const existing = await this.prisma.occasion.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Occasion with ID ${id} not found`);
    }

    const occasion = await this.prisma.occasion.update({
      where: { id },
      data: {
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.emoji !== undefined && { emoji: dto.emoji }),
        ...(dto.nameEn !== undefined && { nameEn: dto.nameEn }),
        ...(dto.nameVi !== undefined && { nameVi: dto.nameVi }),
        ...(dto.descriptionEn !== undefined && {
          descriptionEn: dto.descriptionEn,
        }),
        ...(dto.descriptionVi !== undefined && {
          descriptionVi: dto.descriptionVi,
        }),
        ...(dto.displayOrder !== undefined && { displayOrder: dto.displayOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.timeSlots !== undefined && { timeSlots: dto.timeSlots }),
        ...(dto.dayTypes !== undefined && { dayTypes: dto.dayTypes }),
        ...(dto.holidays !== undefined && { holidays: dto.holidays }),
      },
    });

    // Invalidate occasions cache for both languages
    await this.invalidateOccasionsCache();

    return this.mapToOccasionDetailDto(occasion);
  }

  /**
   * Delete occasion (admin)
   */
  async deleteOccasion(id: string): Promise<void> {
    const existing = await this.prisma.occasion.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Occasion with ID ${id} not found`);
    }

    await this.prisma.occasion.delete({ where: { id } });

    // Invalidate occasions cache for both languages
    await this.invalidateOccasionsCache();
  }

  // ==================== Holiday Methods ====================

  /**
   * Get active holidays for a specific date
   */
  async getActiveHolidays(date: Date = new Date()): Promise<string[]> {
    const holidays = await this.prisma.holiday.findMany({
      where: {
        isActive: true,
      },
    });

    const activeHolidayCodes: string[] = [];
    const currentYear = date.getFullYear();

    for (const holiday of holidays) {
      let startDate = new Date(holiday.startDate);
      let endDate = new Date(holiday.endDate);

      // For recurring holidays, adjust year to current year
      if (holiday.isRecurring) {
        startDate = new Date(
          currentYear,
          startDate.getMonth(),
          startDate.getDate(),
        );
        endDate = new Date(currentYear, endDate.getMonth(), endDate.getDate());

        // Handle year boundary (e.g., Dec 31 - Jan 2)
        if (endDate < startDate) {
          // Check if date is in December or January
          if (date.getMonth() === 11) {
            // December
            endDate = new Date(currentYear + 1, endDate.getMonth(), endDate.getDate());
          } else if (date.getMonth() === 0) {
            // January
            startDate = new Date(currentYear - 1, startDate.getMonth(), startDate.getDate());
          }
        }
      }

      if (date >= startDate && date <= endDate) {
        activeHolidayCodes.push(holiday.code);
      }
    }

    return activeHolidayCodes;
  }

  /**
   * List all holidays (admin)
   */
  async listAllHolidays(): Promise<HolidayDto[]> {
    const holidays = await this.prisma.holiday.findMany({
      orderBy: { startDate: 'asc' },
    });

    return holidays.map((h) => ({
      id: h.id,
      code: h.code,
      nameEn: h.nameEn,
      nameVi: h.nameVi,
      startDate: h.startDate,
      endDate: h.endDate,
      isRecurring: h.isRecurring,
      isActive: h.isActive,
      createdAt: h.createdAt,
      updatedAt: h.updatedAt,
    }));
  }

  /**
   * Create holiday (admin)
   */
  async createHoliday(dto: CreateHolidayDto): Promise<HolidayDto> {
    const holiday = await this.prisma.holiday.create({
      data: {
        code: dto.code,
        nameEn: dto.nameEn,
        nameVi: dto.nameVi,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isRecurring: dto.isRecurring ?? true,
        isActive: dto.isActive ?? true,
      },
    });

    return {
      id: holiday.id,
      code: holiday.code,
      nameEn: holiday.nameEn,
      nameVi: holiday.nameVi,
      startDate: holiday.startDate,
      endDate: holiday.endDate,
      isRecurring: holiday.isRecurring,
      isActive: holiday.isActive,
      createdAt: holiday.createdAt,
      updatedAt: holiday.updatedAt,
    };
  }

  /**
   * Update holiday (admin)
   */
  async updateHoliday(id: string, dto: UpdateHolidayDto): Promise<HolidayDto> {
    const existing = await this.prisma.holiday.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Holiday with ID ${id} not found`);
    }

    const holiday = await this.prisma.holiday.update({
      where: { id },
      data: {
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.nameEn !== undefined && { nameEn: dto.nameEn }),
        ...(dto.nameVi !== undefined && { nameVi: dto.nameVi }),
        ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
        ...(dto.isRecurring !== undefined && { isRecurring: dto.isRecurring }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return {
      id: holiday.id,
      code: holiday.code,
      nameEn: holiday.nameEn,
      nameVi: holiday.nameVi,
      startDate: holiday.startDate,
      endDate: holiday.endDate,
      isRecurring: holiday.isRecurring,
      isActive: holiday.isActive,
      createdAt: holiday.createdAt,
      updatedAt: holiday.updatedAt,
    };
  }

  /**
   * Delete holiday (admin)
   */
  async deleteHoliday(id: string): Promise<void> {
    const existing = await this.prisma.holiday.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Holiday with ID ${id} not found`);
    }

    await this.prisma.holiday.delete({ where: { id } });
  }

  // ==================== Helper Methods ====================

  /**
   * Invalidate occasions cache for all languages
   */
  private async invalidateOccasionsCache(): Promise<void> {
    await Promise.all([
      this.cachePatterns.invalidate(`${CACHE_KEYS.occasionsAll()}:en`),
      this.cachePatterns.invalidate(`${CACHE_KEYS.occasionsAll()}:vi`),
    ]);
  }

  /**
   * Detect current context (time slot, day type, active holidays)
   */
  private async detectContext(
    timezone: string = 'Asia/Ho_Chi_Minh',
  ): Promise<ContextDto> {
    const now = new Date();

    // Get local time in specified timezone
    const localTimeStr = now.toLocaleString('en-US', { timeZone: timezone });
    const localTime = new Date(localTimeStr);

    const hour = localTime.getHours();
    const dayOfWeek = localTime.getDay();

    // Determine time slot
    let timeSlot: TimeSlot;
    if (hour >= 5 && hour < 12) {
      timeSlot = 'morning';
    } else if (hour >= 12 && hour < 17) {
      timeSlot = 'afternoon';
    } else if (hour >= 17 && hour < 21) {
      timeSlot = 'evening';
    } else {
      timeSlot = 'night';
    }

    // Determine day type
    const dayType: DayType =
      dayOfWeek === 0 || dayOfWeek === 6 ? 'weekend' : 'weekday';

    // Get active holidays
    const activeHolidays = await this.getActiveHolidays(now);

    return { timeSlot, dayType, activeHolidays };
  }

  /**
   * Map database occasion to DTO with localized name/description
   */
  private mapToOccasionDto(
    occasion: {
      id: string;
      code: string;
      emoji: string;
      nameEn: string;
      nameVi: string;
      descriptionEn: string | null;
      descriptionVi: string | null;
      displayOrder: number;
    },
    language: 'en' | 'vi',
  ): OccasionDto {
    return {
      id: occasion.id,
      code: occasion.code,
      emoji: occasion.emoji,
      name: language === 'vi' ? occasion.nameVi : occasion.nameEn,
      description:
        language === 'vi' ? occasion.descriptionVi : occasion.descriptionEn,
      displayOrder: occasion.displayOrder,
    };
  }

  /**
   * Map database occasion to detailed DTO
   */
  private mapToOccasionDetailDto(occasion: {
    id: string;
    code: string;
    emoji: string;
    nameEn: string;
    nameVi: string;
    descriptionEn: string | null;
    descriptionVi: string | null;
    displayOrder: number;
    isActive: boolean;
    timeSlots: string[];
    dayTypes: string[];
    holidays: string[];
    createdAt: Date;
    updatedAt: Date;
  }): OccasionDetailDto {
    return {
      id: occasion.id,
      code: occasion.code,
      emoji: occasion.emoji,
      name: occasion.nameVi,
      description: occasion.descriptionVi,
      nameEn: occasion.nameEn,
      nameVi: occasion.nameVi,
      descriptionEn: occasion.descriptionEn,
      descriptionVi: occasion.descriptionVi,
      displayOrder: occasion.displayOrder,
      isActive: occasion.isActive,
      timeSlots: occasion.timeSlots,
      dayTypes: occasion.dayTypes,
      holidays: occasion.holidays,
      createdAt: occasion.createdAt,
      updatedAt: occasion.updatedAt,
    };
  }
}
