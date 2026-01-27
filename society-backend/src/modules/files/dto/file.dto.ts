import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export enum FileCategory {
  PROFILE_PHOTO = 'profile_photo',
  VERIFICATION_DOC = 'verification_doc',
  MESSAGE_ATTACHMENT = 'message_attachment',
  EVENT_IMAGE = 'event_image',
  GIFT_IMAGE = 'gift_image',
  EXPERIENCE_IMAGE = 'experience_image',
  INVOICE_PDF = 'invoice_pdf',
  OTHER = 'other',
}

export enum ImageSize {
  THUMBNAIL = 'thumbnail', // 150x150
  SMALL = 'small', // 300x300
  MEDIUM = 'medium', // 600x600
  LARGE = 'large', // 1200x1200
  ORIGINAL = 'original',
}

export class UploadFileDto {
  @IsEnum(FileCategory)
  category: FileCategory;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class GetUploadUrlDto {
  @IsString()
  @MaxLength(200)
  filename: string;

  @IsString()
  contentType: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50 * 1024 * 1024) // 50MB max
  size: number;

  @IsEnum(FileCategory)
  category: FileCategory;
}

export class ProcessImageDto {
  @IsString()
  fileId: string;

  @IsOptional()
  sizes?: ImageSize[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  quality?: number;
}

export class DeleteFileDto {
  @IsString()
  fileId: string;
}

export class FileFilterDto {
  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPublic?: boolean;

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
