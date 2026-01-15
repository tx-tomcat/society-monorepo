import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { IsVietnamPhone } from '@/common/validators/vietnam-phone.validator';

// ============================================
// Enums
// ============================================

export enum SosAlertType {
  EMERGENCY = 'EMERGENCY',
  UNCOMFORTABLE = 'UNCOMFORTABLE',
  HARASSMENT = 'HARASSMENT',
  SAFETY_CONCERN = 'SAFETY_CONCERN',
}

export enum SosAlertStatus {
  ACTIVE = 'ACTIVE',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED',
  CANCELLED = 'CANCELLED',
}

// ============================================
// Request DTOs
// ============================================

export class TriggerSosDto {
  @IsString()
  bookingId: string;

  @IsEnum(SosAlertType)
  alertType: SosAlertType;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsString()
  message?: string;
}

export class UpdateSosStatusDto {
  @IsEnum(SosAlertStatus)
  status: SosAlertStatus;

  @IsOptional()
  @IsString()
  notes?: string;
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

export class AddEmergencyContactDto {
  @IsString()
  name: string;

  @IsString()
  @IsVietnamPhone()
  phone: string;

  @IsOptional()
  @IsString()
  relationship?: string;

  @IsOptional()
  isPrimary?: boolean;
}

export class UpdateEmergencyContactDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @IsVietnamPhone()
  phone?: string;

  @IsOptional()
  @IsString()
  relationship?: string;

  @IsOptional()
  isPrimary?: boolean;
}

export class CancelSosDto {
  @IsString()
  alertId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class ResolveSosDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

// ============================================
// Response Types
// ============================================

export interface SosAlertResponse {
  id: string;
  alertType: SosAlertType;
  status: SosAlertStatus;
  latitude: number;
  longitude: number;
  message: string | null;
  booking: {
    id: string;
    occasion: string;
    location: string;
    otherParty: {
      displayName: string;
      phone: string | null;
    };
  };
  createdAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
}

export interface LocationTrackingResponse {
  bookingId: string;
  isTracking: boolean;
  lastLocation: {
    latitude: number;
    longitude: number;
    timestamp: string;
  } | null;
  trackingStartedAt: string | null;
}

export interface SafetySettingsResponse {
  sosEnabled: boolean;
  locationSharingEnabled: boolean;
  emergencyContacts: EmergencyContact[];
  autoShareLocationDuringBooking: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string | null;
  isPrimary: boolean;
}

export interface EmergencyContactResponse {
  id: string;
  name: string;
  phone: string;
  relationship: string | null;
  isPrimary: boolean;
  createdAt: string;
}

export interface EmergencyContactListResponse {
  contacts: EmergencyContactResponse[];
  total: number;
}

export interface TriggerSosResponse {
  id: string;
  status: SosAlertStatus;
  message: string;
  cancelDeadline: string;
}

export interface CancelSosResponse {
  success: boolean;
  message: string;
}
