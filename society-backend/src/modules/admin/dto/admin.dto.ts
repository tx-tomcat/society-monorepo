import {
    IsArray,
    IsBoolean,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    MaxLength,
    Min
} from 'class-validator';
import { UserRole, UserStatus } from '@generated/client';

export class UserSearchDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

export class UpdateUserRoleDto {
  @IsString()
  role: string;
}

export class UpdateUserStatusDto {
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class BroadcastNotificationDto {
  @IsString()
  @MaxLength(100)
  title: string;

  @IsString()
  @MaxLength(1000)
  body: string;

  @IsOptional()
  @IsString()
  targetAudience?: 'all' | 'companion' | 'hirer' | 'verified';

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  userIds?: string[];
}

export class VerificationApprovalDto {
  @IsBoolean()
  approved: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}

export class WithdrawalRejectionDto {
  @IsString()
  @MaxLength(500)
  reason: string;
}

// Re-export enums for convenience
export { UserRole, UserStatus };
