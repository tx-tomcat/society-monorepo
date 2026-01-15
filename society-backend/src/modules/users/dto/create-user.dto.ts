import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsVietnamPhone } from '@/common/validators/vietnam-phone.validator';

export enum UserRoleDto {
  HIRER = 'HIRER',
  COMPANION = 'COMPANION',
}

export enum GenderDto {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export class CreateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsOptional()
  @IsString()
  @IsVietnamPhone()
  phone?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @IsEnum(UserRoleDto)
  @IsOptional()
  role?: UserRoleDto;
}

export class RegisterUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @IsVietnamPhone()
  phone?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @IsOptional()
  @IsEnum(GenderDto)
  gender?: GenderDto;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateOfBirth?: Date;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsEnum(UserRoleDto)
  role: UserRoleDto;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsEnum(GenderDto)
  gender?: GenderDto;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateOfBirth?: Date;

  @IsOptional()
  @IsString()
  @IsVietnamPhone()
  phone?: string;
}

export class CreateHirerProfileDto {
  // Hirer profiles are auto-created, no extra fields needed initially
}

export class CreateCompanionProfileDto {
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
  @IsString({ each: true })
  languages?: string[];

  @IsInt()
  @Min(100000) // Minimum 100,000 VND
  hourlyRate: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  halfDayRate?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  fullDayRate?: number;
}

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

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;
}
