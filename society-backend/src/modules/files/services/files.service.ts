import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { StorageService } from './storage.service';
import { ImageProcessingService } from './image-processing.service';
import {
  UploadFileDto,
  GetUploadUrlDto,
  ProcessImageDto,
  FileFilterDto,
  FileCategory,
  ImageSize,
} from '../dto/file.dto';
import {
  FileInfo,
  FileVariant,
  UploadUrlResult,
  ImageProcessingResult,
  StorageStats,
} from '../interfaces/file.interface';

const MAX_FILE_SIZES: Record<FileCategory, number> = {
  [FileCategory.PROFILE_PHOTO]: 10 * 1024 * 1024, // 10MB
  [FileCategory.VERIFICATION_DOC]: 20 * 1024 * 1024, // 20MB
  [FileCategory.MESSAGE_ATTACHMENT]: 25 * 1024 * 1024, // 25MB
  [FileCategory.EVENT_IMAGE]: 15 * 1024 * 1024, // 15MB
  [FileCategory.GIFT_IMAGE]: 5 * 1024 * 1024, // 5MB
  [FileCategory.EXPERIENCE_IMAGE]: 15 * 1024 * 1024, // 15MB
  [FileCategory.INVOICE_PDF]: 5 * 1024 * 1024, // 5MB
  [FileCategory.OTHER]: 10 * 1024 * 1024, // 10MB
};

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly imageProcessingService: ImageProcessingService,
  ) {}

  async getUploadUrl(userId: string, dto: GetUploadUrlDto): Promise<UploadUrlResult> {
    // Validate file size
    const maxSize = MAX_FILE_SIZES[dto.category];
    if (dto.size > maxSize) {
      throw new BadRequestException(`File size exceeds maximum of ${maxSize / (1024 * 1024)}MB`);
    }

    // Validate content type
    const allowedTypes = this.getAllowedContentTypes(dto.category);
    if (!allowedTypes.includes(dto.contentType)) {
      throw new BadRequestException(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
    }

    // Generate storage key
    const key = this.storageService.generateKey(userId, dto.category, dto.filename);
    const publicUrl = this.storageService.getPublicUrl(key);

    // Create file record with schema-matching fields
    const file = await this.prisma.file.create({
      data: {
        userId,
        filename: key.split('/').pop()!,
        originalFilename: dto.filename,
        mimeType: dto.contentType,
        sizeBytes: dto.size,
        storageKey: key,
        cdnUrl: publicUrl,
        isPublic: dto.category === FileCategory.PROFILE_PHOTO,
        metadata: { category: dto.category },
      },
    });

    // Generate signed upload URL
    const uploadUrl = await this.storageService.getSignedUploadUrl(
      key,
      dto.contentType,
      3600, // 1 hour
    );

    return {
      uploadUrl,
      fileId: file.id,
      publicUrl: file.cdnUrl || publicUrl,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    };
  }

  async uploadFile(
    userId: string,
    buffer: Buffer,
    dto: UploadFileDto & { filename: string; contentType: string },
  ): Promise<FileInfo> {
    // Validate file size
    const maxSize = MAX_FILE_SIZES[dto.category];
    if (buffer.length > maxSize) {
      throw new BadRequestException(`File size exceeds maximum of ${maxSize / (1024 * 1024)}MB`);
    }

    const key = this.storageService.generateKey(userId, dto.category, dto.filename);

    // Process image if applicable
    let processedBuffer = buffer;
    let thumbnailUrl: string | null = null;
    let variants: FileVariant[] = [];

    if (this.imageProcessingService.isValidImageType(dto.contentType)) {
      // Strip EXIF data for privacy
      processedBuffer = await this.imageProcessingService.stripExifData(buffer);

      // Optimize image
      processedBuffer = await this.imageProcessingService.optimizeImage(processedBuffer);

      // Create thumbnail
      const thumbnail = await this.imageProcessingService.createThumbnail(processedBuffer);
      const thumbnailKey = key.replace(/\.[^.]+$/, '_thumb.jpg');
      thumbnailUrl = await this.storageService.uploadFile(thumbnailKey, thumbnail, 'image/jpeg');

      // Create variants
      const processed = await this.imageProcessingService.processImage(
        processedBuffer,
        [ImageSize.SMALL, ImageSize.MEDIUM],
      );

      for (const [size, data] of processed) {
        const variantKey = key.replace(/\.[^.]+$/, `_${size}.jpg`);
        const variantUrl = await this.storageService.uploadFile(variantKey, data.buffer, 'image/jpeg');
        variants.push({
          size,
          url: variantUrl,
          width: data.width,
          height: data.height,
        });
      }
    }

    // Upload original file
    const url = await this.storageService.uploadFile(key, processedBuffer, dto.contentType);

    // Save to database with schema-matching fields
    const file = await this.prisma.file.create({
      data: {
        userId,
        filename: key.split('/').pop()!,
        originalFilename: dto.filename,
        mimeType: dto.contentType,
        sizeBytes: processedBuffer.length,
        storageKey: key,
        cdnUrl: url,
        variants: { items: variants, thumbnailUrl } as any,
        isPublic: dto.isPublic ?? dto.category === FileCategory.PROFILE_PHOTO,
        metadata: {
          category: dto.category,
          description: dto.description,
        },
      },
    });

    this.logger.log(`File uploaded: ${file.id} by user ${userId}`);

    return this.mapFileToInfo(file);
  }

  async processImage(dto: ProcessImageDto): Promise<ImageProcessingResult> {
    const file = await this.prisma.file.findUnique({
      where: { id: dto.fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    const fileUrl = file.cdnUrl || this.storageService.getPublicUrl(file.storageKey);

    // Fetch original file
    const response = await fetch(fileUrl);
    const buffer = Buffer.from(await response.arrayBuffer());

    // Process image
    const processed = await this.imageProcessingService.processImage(
      buffer,
      dto.sizes || [ImageSize.THUMBNAIL, ImageSize.SMALL, ImageSize.MEDIUM, ImageSize.LARGE],
      dto.quality || 80,
    );

    const variants: FileVariant[] = [];
    let thumbnailUrl: string | null = null;

    for (const [size, data] of processed) {
      const variantKey = file.storageKey.replace(/\.[^.]+$/, `_${size}.jpg`);
      const variantUrl = await this.storageService.uploadFile(variantKey, data.buffer, 'image/jpeg');

      variants.push({
        size,
        url: variantUrl,
        width: data.width,
        height: data.height,
      });

      if (size === ImageSize.THUMBNAIL) {
        thumbnailUrl = variantUrl;
      }
    }

    // Update file record
    await this.prisma.file.update({
      where: { id: dto.fileId },
      data: {
        variants: { items: variants, thumbnailUrl } as any,
      },
    });

    return {
      id: file.id,
      variants,
      thumbnailUrl: thumbnailUrl || '',
    };
  }

  async getFile(userId: string, fileId: string): Promise<FileInfo> {
    const file = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        OR: [{ userId }, { isPublic: true }],
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return this.mapFileToInfo(file);
  }

  async getMyFiles(userId: string, filters: FileFilterDto): Promise<FileInfo[]> {
    const files = await this.prisma.file.findMany({
      where: {
        userId,
        ...(filters.isPublic !== undefined && { isPublic: filters.isPublic }),
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 20,
      skip: filters.offset || 0,
    });

    // Filter by category from metadata if specified
    let filteredFiles = files;
    if (filters.category) {
      filteredFiles = files.filter((f) => {
        const metadata = f.metadata as Record<string, any> | null;
        return metadata?.category === filters.category;
      });
    }

    return filteredFiles.map((f) => this.mapFileToInfo(f));
  }

  async deleteFile(userId: string, fileId: string): Promise<void> {
    const file = await this.prisma.file.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Delete from storage
    await this.storageService.deleteFile(file.storageKey);

    // Delete variants from JSON field
    const variantsData = file.variants as { items?: FileVariant[]; thumbnailUrl?: string } | null;
    if (variantsData?.items && variantsData.items.length > 0) {
      const variantKeys = variantsData.items.map((v: FileVariant) =>
        file.storageKey.replace(/\.[^.]+$/, `_${v.size}.jpg`),
      );
      await this.storageService.deleteFiles(variantKeys);
    }

    // Delete thumbnail
    if (variantsData?.thumbnailUrl) {
      const thumbnailKey = file.storageKey.replace(/\.[^.]+$/, '_thumb.jpg');
      await this.storageService.deleteFile(thumbnailKey);
    }

    // Delete from database
    await this.prisma.file.delete({ where: { id: fileId } });

    this.logger.log(`File deleted: ${fileId}`);
  }

  async getSignedUrl(userId: string, fileId: string, expiresIn = 3600): Promise<string> {
    const file = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        OR: [{ userId }, { isPublic: true }],
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return this.storageService.getSignedDownloadUrl(file.storageKey, { expiresIn });
  }

  async getStorageStats(userId?: string): Promise<StorageStats> {
    const where = userId ? { userId } : {};

    const files = await this.prisma.file.aggregate({
      where,
      _count: true,
      _sum: { sizeBytes: true },
    });

    // Get all files to calculate by-category stats from metadata
    const allFiles = await this.prisma.file.findMany({
      where,
      select: { sizeBytes: true, metadata: true },
    });

    const categoryStats: Record<string, { count: number; size: number }> = {};
    for (const f of allFiles) {
      const metadata = f.metadata as Record<string, any> | null;
      const category = metadata?.category || 'OTHER';
      if (!categoryStats[category]) {
        categoryStats[category] = { count: 0, size: 0 };
      }
      categoryStats[category].count++;
      categoryStats[category].size += f.sizeBytes;
    }

    return {
      totalFiles: files._count,
      totalSize: files._sum.sizeBytes || 0,
      byCategory: categoryStats,
    };
  }

  private getAllowedContentTypes(category: FileCategory): string[] {
    switch (category) {
      case FileCategory.PROFILE_PHOTO:
      case FileCategory.EVENT_IMAGE:
      case FileCategory.GIFT_IMAGE:
      case FileCategory.EXPERIENCE_IMAGE:
        return ['image/jpeg', 'image/png', 'image/webp'];

      case FileCategory.VERIFICATION_DOC:
        return ['image/jpeg', 'image/png', 'application/pdf'];

      case FileCategory.MESSAGE_ATTACHMENT:
        return [
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/pdf',
          'audio/mpeg',
          'audio/ogg',
        ];

      case FileCategory.INVOICE_PDF:
        return ['application/pdf'];

      default:
        return ['image/jpeg', 'image/png', 'application/pdf'];
    }
  }

  private mapFileToInfo(file: any): FileInfo {
    const metadata = file.metadata as Record<string, any> | null;
    const variantsData = file.variants as { items?: FileVariant[]; thumbnailUrl?: string } | null;

    return {
      id: file.id,
      userId: file.userId,
      filename: file.filename,
      originalFilename: file.originalFilename,
      contentType: file.mimeType,
      size: file.sizeBytes,
      category: metadata?.category || 'OTHER',
      url: file.cdnUrl || '',
      thumbnailUrl: variantsData?.thumbnailUrl || null,
      variants: variantsData?.items || [],
      isPublic: file.isPublic,
      metadata: metadata || {},
      createdAt: file.createdAt,
    };
  }
}
