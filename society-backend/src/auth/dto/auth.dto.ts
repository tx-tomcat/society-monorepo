import { IsEmail, IsString, IsOptional, IsEnum, Length } from 'class-validator';

export enum UserType {
  HIRER = 'hirer',
  COMPANION = 'companion',
}

/**
 * DTO for sending magic link
 */
export class SendMagicLinkDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(UserType)
  userType?: 'hirer' | 'companion';

  @IsOptional()
  @IsString()
  captchaToken?: string;
}

/**
 * DTO for verifying OTP (mobile apps)
 */
export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  token: string;

  @IsOptional()
  @IsString()
  captchaToken?: string;
}

/**
 * DTO for exchanging auth code (magic link callback)
 */
export class ExchangeCodeDto {
  @IsString()
  code: string;
}

/**
 * DTO for refreshing token
 */
export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

/**
 * DTO for checking OTP status
 */
export class CheckOtpStatusDto {
  @IsEmail()
  email: string;
}
