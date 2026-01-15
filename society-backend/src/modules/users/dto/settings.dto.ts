import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  showOnlineStatus?: boolean;

  @IsOptional()
  @IsBoolean()
  showReadReceipts?: boolean;

  @IsOptional()
  @IsBoolean()
  discoveryEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(100)
  ageRangeMin?: number;

  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(100)
  ageRangeMax?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  distanceKm?: number;
}

export class PrivacySettingsDto {
  @IsOptional()
  @IsBoolean()
  showOnlineStatus?: boolean;

  @IsOptional()
  @IsBoolean()
  showReadReceipts?: boolean;

  @IsOptional()
  @IsBoolean()
  discoveryEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  profileVisible?: boolean;
}
