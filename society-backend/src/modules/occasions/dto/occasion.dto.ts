import {
  IsString,
  IsBoolean,
  IsInt,
  IsArray,
  IsOptional,
  IsEnum,
  Min,
  IsIn,
} from 'class-validator';

// Occasion event types for tracking
export const OCCASION_EVENT_TYPES = ['VIEW', 'SELECT', 'BOOKING_CREATED'] as const;
export type OccasionEventType = (typeof OCCASION_EVENT_TYPES)[number];

// Time slot and day type constants
export const TIME_SLOTS = ['morning', 'afternoon', 'evening', 'night'] as const;
export const DAY_TYPES = ['weekday', 'weekend'] as const;

export type TimeSlot = (typeof TIME_SLOTS)[number];
export type DayType = (typeof DAY_TYPES)[number];

// Response DTOs
export class OccasionDto {
  id: string;
  code: string;
  emoji: string;
  name: string;
  description: string | null;
  displayOrder: number;
}

export class OccasionDetailDto extends OccasionDto {
  nameEn: string;
  nameVi: string;
  descriptionEn: string | null;
  descriptionVi: string | null;
  isActive: boolean;
  timeSlots: string[];
  dayTypes: string[];
  holidays: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class ContextDto {
  timeSlot: TimeSlot;
  dayType: DayType;
  activeHolidays: string[];
}

export class OccasionsResponseDto {
  occasions: OccasionDto[];
  context: ContextDto;
}

// Request DTOs
export class CreateOccasionDto {
  @IsString()
  code: string;

  @IsString()
  emoji: string;

  @IsString()
  nameEn: string;

  @IsString()
  nameVi: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsOptional()
  @IsString()
  descriptionVi?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(TIME_SLOTS, { each: true })
  timeSlots?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(DAY_TYPES, { each: true })
  dayTypes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  holidays?: string[];
}

export class UpdateOccasionDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  emoji?: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsOptional()
  @IsString()
  nameVi?: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsOptional()
  @IsString()
  descriptionVi?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  timeSlots?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dayTypes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  holidays?: string[];
}

// Holiday DTOs
export class HolidayDto {
  id: string;
  code: string;
  nameEn: string;
  nameVi: string;
  startDate: Date;
  endDate: Date;
  isRecurring: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateHolidayDto {
  @IsString()
  code: string;

  @IsString()
  nameEn: string;

  @IsString()
  nameVi: string;

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateHolidayDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsOptional()
  @IsString()
  nameVi?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// Tracking DTOs
export class TrackOccasionInteractionDto {
  @IsString()
  occasionId: string;

  @IsIn(OCCASION_EVENT_TYPES, {
    message: `eventType must be one of: ${OCCASION_EVENT_TYPES.join(', ')}`,
  })
  eventType: OccasionEventType;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class TrackOccasionBatchDto {
  @IsArray()
  occasionIds: string[];

  @IsIn(OCCASION_EVENT_TYPES, {
    message: `eventType must be one of: ${OCCASION_EVENT_TYPES.join(', ')}`,
  })
  eventType: OccasionEventType;

  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class OccasionMetricsDto {
  occasionId: string;
  code: string;
  name: string;
  viewCount: number;
  selectCount: number;
  bookingCount: number;
  conversionRate: number; // bookingCount / selectCount
}
