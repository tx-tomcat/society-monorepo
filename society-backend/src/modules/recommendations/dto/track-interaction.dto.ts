import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export enum InteractionEventType {
  VIEW = 'VIEW',
  PROFILE_OPEN = 'PROFILE_OPEN',
  BOOKMARK = 'BOOKMARK',
  UNBOOKMARK = 'UNBOOKMARK',
  MESSAGE_SENT = 'MESSAGE_SENT',
  BOOKING_STARTED = 'BOOKING_STARTED',
  BOOKING_COMPLETED = 'BOOKING_COMPLETED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  // Feed-specific signals
  SKIP = 'SKIP',
  DWELL_VIEW = 'DWELL_VIEW',
  DWELL_PAUSE = 'DWELL_PAUSE',
  PHOTO_BROWSE = 'PHOTO_BROWSE',
  REVISIT = 'REVISIT',
  NOT_INTERESTED = 'NOT_INTERESTED',
  SHARE = 'SHARE',
}

export class TrackInteractionDto {
  @IsUUID()
  companionId: string;

  @IsEnum(InteractionEventType)
  eventType: InteractionEventType;

  @IsOptional()
  @IsInt()
  @Min(0)
  dwellTimeMs?: number;

  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class BatchTrackInteractionDto {
  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackInteractionDto)
  events: TrackInteractionDto[];
}
