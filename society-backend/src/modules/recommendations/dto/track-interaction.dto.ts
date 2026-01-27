import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export enum InteractionEventType {
  VIEW = 'VIEW',
  PROFILE_OPEN = 'PROFILE_OPEN',
  BOOKMARK = 'BOOKMARK',
  UNBOOKMARK = 'UNBOOKMARK',
  MESSAGE_SENT = 'MESSAGE_SENT',
  BOOKING_STARTED = 'BOOKING_STARTED',
  BOOKING_COMPLETED = 'BOOKING_COMPLETED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
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
