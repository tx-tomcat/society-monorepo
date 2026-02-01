import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsArray,
  Min,
  Max,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { BookingStatus, PaymentStatus } from '@generated/client';

// ============================================
// Request DTOs
// ============================================

export class CreateBookingDto {
  @IsUUID()
  companionId: string; // User ID of the companion

  @IsOptional()
  @IsString()
  occasionId?: string; // ID of the selected occasion (CUID format)

  @IsDateString()
  startDatetime: string;

  @IsDateString()
  endDatetime: string;

  @IsString()
  @MaxLength(500)
  locationAddress: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  locationLat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  locationLng?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  specialRequests?: string;
}

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus)
  status: BookingStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class GetBookingsQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    // Support comma-separated statuses: "PENDING,CONFIRMED" -> ["PENDING", "CONFIRMED"]
    if (typeof value === 'string') {
      return value.includes(',') ? value.split(',').map(s => s.trim()) : [value];
    }
    return value;
  })
  @IsArray()
  @IsEnum(BookingStatus, { each: true })
  status?: BookingStatus[];

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}

export class GetBookingRequestsQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @IsOptional()
  @IsUUID()
  cursor?: string; // Cursor-based pagination using booking ID
}

export class SubmitReviewDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean = true;
}

export class EditReviewDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateLocationDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}

export class DeclineBookingDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export const EmergencyCancellationReason = {
  MEDICAL: 'medical',
  FAMILY: 'family',
  ACCIDENT: 'accident',
  WEATHER: 'weather',
  OTHER: 'other',
} as const;

export type EmergencyCancellationType = typeof EmergencyCancellationReason[keyof typeof EmergencyCancellationReason];

export class EmergencyCancellationDto {
  @IsString()
  emergencyType: EmergencyCancellationType;

  @IsString()
  @MaxLength(1000)
  description: string;

  @IsOptional()
  @IsString()
  proofDocumentUrl?: string; // URL to uploaded proof (medical certificate, etc.)
}

export class DisputeReviewDto {
  @IsString()
  @MaxLength(1000)
  reason: string;
}

// ============================================
// Response Types
// ============================================

export interface OccasionInfo {
  id: string;
  code: string;
  emoji: string;
  name: string;
}

export interface CompanionPhoto {
  id: string;
  url: string;
  isPrimary: boolean;
  position: number;
}

export interface BookingListItem {
  id: string;
  bookingNumber: string;
  status: BookingStatus;
  occasion: OccasionInfo | null;
  startDatetime: string;
  endDatetime: string;
  durationHours: number;
  locationAddress: string;
  totalPrice: number;
  createdAt: string;
  companion?: {
    id: string;
    userId: string;
    displayName: string;
    avatar: string | null;
    photos?: CompanionPhoto[];
    rating: number;
    reviewCount?: number;
  };
  hirer?: {
    id: string;
    displayName: string;
    avatar: string | null;
    rating: number;
  };
}

export interface BookingDetailResponse {
  id: string;
  bookingNumber: string;
  status: BookingStatus;
  occasion: OccasionInfo | null;
  startDatetime: string;
  endDatetime: string;
  durationHours: number;
  locationAddress: string;
  locationLat: number | null;
  locationLng: number | null;
  specialRequests: string | null;
  basePrice: number;
  platformFee: number;
  surgeFee: number;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  companion: {
    id: string;
    userId: string;
    displayName: string;
    avatar: string | null;
    photos?: CompanionPhoto[];
    rating: number;
    reviewCount?: number;
    isVerified?: boolean;
    phone: string | null;
  };
  hirer: {
    id: string;
    displayName: string;
    avatar: string | null;
    rating: number;
    phone: string | null;
  };
  review: ReviewInfo | null;
  requestExpiresAt: string | null;
  confirmedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
}

export interface ReviewInfo {
  id: string;
  rating: number;
  comment: string | null;
  tags: string[];
  createdAt: string;
}

export interface BookingRequestItem {
  id: string;
  bookingNumber: string;
  occasion: OccasionInfo | null;
  startDatetime: string;
  endDatetime: string;
  durationHours: number;
  locationAddress: string;
  totalPrice: number;
  specialRequests: string | null;
  hirer?: {
    id: string;
    displayName: string;
    avatar: string | null;
    rating: number;
  };
  createdAt: string;
  requestExpiresAt: string;
}

export interface ScheduleDay {
  date: string;
  bookings: ScheduleBooking[];
}

export interface ScheduleBooking {
  id: string;
  bookingNumber: string;
  startTime: string;
  endTime: string;
  occasion: OccasionInfo | null;
  status: BookingStatus;
  hirer: {
    displayName: string;
    avatar: string | null;
  };
  locationAddress: string;
}
