import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  MaxLength,
  IsObject,
} from 'class-validator';

// Local enum for message content types (matches Supabase)
export enum MessageContentType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VOICE = 'VOICE',
  GIF = 'GIF',
  SYSTEM = 'SYSTEM',
}

export class CreateMessageDto {
  @IsString()
  @MaxLength(5000)
  content: string;

  @IsOptional()
  @IsEnum(MessageContentType)
  contentType?: MessageContentType;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsObject()
  mediaMetadata?: Record<string, any>;

  @IsOptional()
  @IsUUID()
  replyToId?: string;
}

export class UpdateMessageDto {
  @IsString()
  @MaxLength(5000)
  content: string;
}

export class MessageReactionDto {
  @IsString()
  @MaxLength(50)
  reaction: string; // emoji or reaction type
}

export class ReportMessageDto {
  @IsString()
  @MaxLength(500)
  reason: string;
}

export class MarkReadDto {
  @IsOptional()
  @IsUUID()
  lastReadMessageId?: string;
}

export class SearchMessagesDto {
  @IsString()
  @MaxLength(200)
  query: string;
}
