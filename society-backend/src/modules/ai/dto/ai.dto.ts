import { IsOptional, IsString } from 'class-validator';

/**
 * AI DTOs - Minimal implementation for companion booking platform
 * DTOs will be added as AI features are implemented in future phases
 */

export class ContentModerationDto {
  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  contentType?: 'text' | 'image_url';
}
