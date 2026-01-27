import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsIP,
  Min,
  Max,
  MaxLength,
  IsArray,
} from 'class-validator';

export enum RateLimitType {
  LOGIN = 'login',
  API = 'api',
  MESSAGE = 'message',
  MATCH = 'match',
  PAYMENT = 'payment',
  UPLOAD = 'upload',
  OTP_REQUEST = 'otp_request',
  OTP_VERIFY = 'otp_verify',
}

export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  PASSWORD_CHANGE = 'password_change',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  BLOCKED_IP = 'blocked_ip',
  FRAUD_DETECTED = 'fraud_detected',
  ACCOUNT_LOCKOUT = 'account_lockout',
}

export enum FraudRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export class BlockIpDto {
  @IsIP()
  ip: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationHours?: number;
}

export class UnblockIpDto {
  @IsIP()
  ip: string;
}

export class ReportFraudDto {
  @IsString()
  userId: string;

  @IsEnum(FraudRiskLevel)
  riskLevel: FraudRiskLevel;

  @IsString()
  @MaxLength(100)
  fraudType: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  evidence?: Record<string, any>;
}

export class UpdateRateLimitDto {
  @IsEnum(RateLimitType)
  type: RateLimitType;

  @IsInt()
  @Min(1)
  @Max(10000)
  maxRequests: number;

  @IsInt()
  @Min(1)
  @Max(86400)
  windowSeconds: number;
}

export class SecurityConfigDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  maxLoginAttempts?: number;

  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(86400)
  lockoutDurationSeconds?: number;

  @IsOptional()
  @IsBoolean()
  requireStrongPassword?: boolean;

  @IsOptional()
  @IsBoolean()
  enableTwoFactor?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedOrigins?: string[];
}

export class SecurityEventFilterDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEnum(SecurityEventType)
  eventType?: SecurityEventType;

  @IsOptional()
  @IsIP()
  ip?: string;

  @IsOptional()
  startDate?: Date;

  @IsOptional()
  endDate?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
