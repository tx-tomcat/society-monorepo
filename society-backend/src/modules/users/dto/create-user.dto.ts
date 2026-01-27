import { IsVietnamPhone } from '@/common/validators/vietnam-phone.validator';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength
} from 'class-validator';

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


export class UpdateUserDto {

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @Transform(({ value }) => {
    // Handle case-insensitive gender from mobile app (male -> MALE)
    if (typeof value === 'string') {
      return value.toUpperCase();
    }
    return value;
  })
  @IsEnum(GenderDto)
  gender?: GenderDto;

  @IsOptional()
  @Transform(({ value }) => {
    // Handle ISO date strings from mobile app (2000-01-15 -> Date)
    if (typeof value === 'string') {
      return new Date(value);
    }
    return value;
  })
  @Type(() => Date)
  @IsDate()
  dateOfBirth?: Date;

  @IsOptional()
  @IsString()
  @IsVietnamPhone()
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  province?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  district?: string;
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

  @IsOptional()
  @IsString()
  @MaxLength(10)
  province?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  district?: string;

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
  @IsString()
  @MaxLength(10)
  province?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  district?: string;

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
