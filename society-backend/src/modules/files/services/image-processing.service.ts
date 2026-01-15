import { Injectable, Logger } from '@nestjs/common';
import { ImageSize } from '../dto/file.dto';

interface SizeConfig {
  width: number;
  height: number;
}

const SIZE_CONFIGS: Record<ImageSize, SizeConfig> = {
  [ImageSize.THUMBNAIL]: { width: 150, height: 150 },
  [ImageSize.SMALL]: { width: 300, height: 300 },
  [ImageSize.MEDIUM]: { width: 600, height: 600 },
  [ImageSize.LARGE]: { width: 1200, height: 1200 },
  [ImageSize.ORIGINAL]: { width: 0, height: 0 },
};

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);

  async processImage(
    buffer: Buffer,
    sizes: ImageSize[] = [ImageSize.THUMBNAIL, ImageSize.MEDIUM, ImageSize.LARGE],
    quality = 80,
  ): Promise<Map<ImageSize, { buffer: Buffer; width: number; height: number }>> {
    const results = new Map<ImageSize, { buffer: Buffer; width: number; height: number }>();

    // Since we removed sharp, we just return the original buffer for all requested sizes
    // without resizing. Width and height will be 0 as we can't read metadata.
    for (const size of sizes) {
      results.set(size, {
        buffer,
        width: 0,
        height: 0,
      });
    }

    return results;
  }

  async createThumbnail(buffer: Buffer, width = 150, height = 150): Promise<Buffer> {
    // Return original buffer without resizing
    return buffer;
  }

  async optimizeImage(buffer: Buffer, quality = 80): Promise<Buffer> {
    // Return original buffer without optimization
    return buffer;
  }

  async getImageMetadata(buffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
  }> {
    // Return default metadata since we can't read it
    return {
      width: 0,
      height: 0,
      format: 'unknown',
      size: buffer.length,
    };
  }

  async stripExifData(buffer: Buffer): Promise<Buffer> {
    return buffer;
  }

  async blurFaces(buffer: Buffer, regions: Array<{ x: number; y: number; width: number; height: number }>): Promise<Buffer> {
    return buffer;
  }

  async addWatermark(buffer: Buffer, watermarkText: string): Promise<Buffer> {
    return buffer;
  }

  isValidImageType(contentType: string): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return validTypes.includes(contentType);
  }

  async convertToWebp(buffer: Buffer, quality = 80): Promise<Buffer> {
    return buffer;
  }
}
