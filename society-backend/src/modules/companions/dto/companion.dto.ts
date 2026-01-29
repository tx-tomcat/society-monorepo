import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsArray,
  IsNumber,
  IsDateString,
  Min,
  Max,
  IsEnum,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender, BoostStatus } from '@generated/client';

// ============================================
// Query DTOs
// ============================================

export class BrowseCompanionsQueryDto {
  @IsOptional()
  @IsString()
  occasionId?: string; // Occasion ID to filter by

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxPrice?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  verified?: boolean;

  // Location-based filtering
  @IsOptional()
  @IsString()
  @MaxLength(10)
  province?: string; // Vietnamese province/city code (e.g., "HCM", "HN")

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100) // Max 100km radius
  radiusKm?: number = 25; // Default 25km radius

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sort?: 'rating' | 'price_asc' | 'price_desc' | 'popular' | 'distance';
}

export class GetAvailabilityQueryDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

// ============================================
// Companion Profile DTOs
// ============================================

export class UpdateCompanionProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  @IsInt()
  @Min(140)
  @Max(220)
  heightCm?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsInt()
  @Min(100000)
  hourlyRate?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  halfDayRate?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  fullDayRate?: number;
}

// ============================================
// Photo DTOs
// ============================================

export class AddPhotoDto {
  @IsString()
  url: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

// ============================================
// Service DTOs
// ============================================

export class ServiceItemDto {
  @IsString()
  occasionId: string; // Occasion ID from database

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsInt()
  priceAdjustment?: number;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

export class UpdateServicesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceItemDto)
  services: ServiceItemDto[];
}

// ============================================
// Availability DTOs
// ============================================

export class AvailabilitySlotDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsString()
  startTime: string; // "09:00"

  @IsString()
  endTime: string; // "18:00"
}

export class AvailabilityExceptionDto {
  @IsDateString()
  date: string;

  @IsBoolean()
  available: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateAvailabilityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  recurring: AvailabilitySlotDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityExceptionDto)
  exceptions?: AvailabilityExceptionDto[];
}

// ============================================
// Response Types
// ============================================

export interface OccasionInfo {
  id: string;
  code: string;
  name: string;
  emoji: string;
}

export interface CompanionListItem {
  id: string;
  userId: string;
  displayName: string;
  age: number | null;
  avatar: string | null;
  gender: Gender | null;
  hourlyRate: number;
  halfDayRate: number | null;
  fullDayRate: number | null;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isFeatured: boolean;
  isBoosted?: boolean;
  boostMultiplier?: number | null;
  services: OccasionInfo[];
  photos: string[];
  isAvailable: boolean;
  distanceKm?: number | null; // Distance from search location
}

export interface CompanionServiceItem {
  occasionId: string;
  occasion: OccasionInfo;
  description: string | null;
  priceAdjustment: number;
}

export interface CompanionProfileResponse {
  id: string;
  userId: string;
  displayName: string;
  age: number | null;
  bio: string | null;
  avatar: string | null;
  photos: string[];
  gender: Gender | null;
  heightCm: number | null;
  languages: string[];
  hourlyRate: number;
  halfDayRate: number | null;
  fullDayRate: number | null;
  rating: number;
  reviewCount: number;
  responseRate: number;
  acceptanceRate: number;
  completedBookings: number;
  isVerified: boolean;
  isFeatured: boolean;
  services: CompanionServiceItem[];
  memberSince: string;
  reviews: ReviewItem[];
  availability: {
    nextAvailable: string | null;
    thisWeek: DayAvailability[];
  };
}

export interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  occasion: OccasionInfo | null;
  date: string;
  reviewer: {
    name: string;
    avatar: string | null;
  };
}

export interface DayAvailability {
  date: string;
  slots: string[];
}

export interface AvailabilitySlot {
  start: string;
  end: string;
}

export interface DayAvailabilityDetail {
  date: string;
  isAvailable: boolean;
  slots: AvailabilitySlot[];
  bookedSlots: AvailabilitySlot[];
}

// ============================================
// Profile Boost DTOs
// ============================================

export enum BoostTierEnum {
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  SUPER = 'SUPER',
}

export class PurchaseBoostDto {
  @IsEnum(BoostTierEnum)
  tier: BoostTierEnum;

  @IsOptional()
  @IsString()
  returnUrl?: string;
}

export interface BoostPricing {
  tier: BoostTierEnum;
  name: string;
  durationHours: number;
  price: number;
  multiplier: number;
  description: string;
}

export interface ActiveBoostInfo {
  id: string;
  tier: BoostTierEnum;
  status: BoostStatus;
  multiplier: number;
  startedAt: Date | null;
  expiresAt: Date | null;
  remainingHours: number | null;
}

export interface BoostHistoryItem {
  id: string;
  tier: BoostTierEnum;
  status: BoostStatus;
  price: number;
  startedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface BoostPurchaseResult {
  boostId: string;
  tier: BoostTierEnum;
  price: number;
  paymentUrl?: string;
  message: string;
}
