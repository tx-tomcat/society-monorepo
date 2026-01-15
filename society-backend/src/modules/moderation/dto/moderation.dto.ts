import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsDate,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    MaxLength,
    Min,
} from 'class-validator';
import {
    ModerationActionType as PrismaModerationActionType,
    ModerationContentType as PrismaModerationContentType,
    ModerationStatus as PrismaModerationStatus,
} from '@generated/client';

// Re-export Prisma enums for use throughout the module
export const ModerationContentType = PrismaModerationContentType;
export type ModerationContentType = PrismaModerationContentType;

export const ModerationStatus = PrismaModerationStatus;
export type ModerationStatus = PrismaModerationStatus;

export const ModerationActionType = PrismaModerationActionType;
export type ModerationActionType = PrismaModerationActionType;

export class ReportUserDto {
  @IsUUID()
  reportedUserId: string;

  @IsString()
  @MaxLength(100)
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsUUID()
  relatedContentId?: string;

  @IsOptional()
  @IsEnum(PrismaModerationContentType)
  contentType?: PrismaModerationContentType;
}

export class ReportContentDto {
  @IsEnum(PrismaModerationContentType)
  contentType: PrismaModerationContentType;

  @IsUUID()
  contentId: string;

  @IsString()
  @MaxLength(100)
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class ModerationActionDto {
  @IsEnum(PrismaModerationActionType)
  action: PrismaModerationActionType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class SuspendUserDto {
  @IsString()
  @MaxLength(1000)
  reason: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  suspendUntil?: Date;

  @IsOptional()
  @IsBoolean()
  isPermanent?: boolean;
}

export class LiftSuspensionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class AppealDto {
  @IsString()
  @MaxLength(5000)
  appealText: string;
}

export class ReviewAppealDto {
  @IsEnum(['APPROVED', 'DENIED'])
  decision: 'APPROVED' | 'DENIED';

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class ModerationQueueFilterDto {
  @IsOptional()
  @IsEnum(PrismaModerationContentType)
  contentType?: PrismaModerationContentType;

  @IsOptional()
  @IsEnum(PrismaModerationStatus)
  status?: PrismaModerationStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  minPriority?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}

export class BulkModerationDto {
  @IsArray()
  @IsUUID('4', { each: true })
  queueIds: string[];

  @IsEnum(PrismaModerationActionType)
  action: PrismaModerationActionType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
