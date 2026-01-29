import { IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

/**
 * Platform configuration response DTO
 */
export class PlatformConfigDto {
  /**
   * Platform fee percentage (e.g., 0.18 for 18%)
   */
  @IsNumber()
  @Min(0)
  @Max(1)
  platformFeePercent: number;

  /**
   * Minimum booking duration in hours
   */
  @IsNumber()
  @Min(1)
  minBookingHours: number;

  /**
   * Maximum booking duration in hours
   */
  @IsNumber()
  @Min(1)
  maxBookingHours: number;

  /**
   * Minimum advance booking time in hours
   */
  @IsNumber()
  @Min(0)
  minAdvanceBookingHours: number;

  /**
   * Maximum advance booking days
   */
  @IsNumber()
  @Min(1)
  maxAdvanceBookingDays: number;

  /**
   * Cancellation fee percentage if cancelled within grace period
   */
  @IsNumber()
  @Min(0)
  @Max(1)
  cancellationFeePercent: number;

  /**
   * Free cancellation window in hours before booking start
   */
  @IsNumber()
  @Min(0)
  freeCancellationHours: number;

  /**
   * Support email address
   */
  @IsString()
  @IsOptional()
  supportEmail?: string;

  /**
   * Support phone number
   */
  @IsString()
  @IsOptional()
  supportPhone?: string;

  /**
   * App version info for mobile clients
   */
  @IsString()
  @IsOptional()
  minAppVersion?: string;

  /**
   * Current app version
   */
  @IsString()
  @IsOptional()
  currentAppVersion?: string;
}

/**
 * DTO for updating platform configuration (all fields optional)
 */
export class UpdatePlatformConfigDto extends PlatformConfigDto {}
