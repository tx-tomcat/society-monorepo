import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SignedUrlOptions } from '../interfaces/file.interface';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID') || '';
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY') || '';

    // Support both R2_ENDPOINT (full URL) and R2_ACCOUNT_ID (just the ID)
    let endpoint = this.configService.get<string>('R2_ENDPOINT');
    if (!endpoint) {
      const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
      if (accountId) {
        endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
      }
    }

    if (!endpoint) {
      this.logger.error('R2 storage not configured: Missing R2_ENDPOINT or R2_ACCOUNT_ID');
    }

    // Support both R2_BUCKET and R2_BUCKET_NAME
    this.bucket = this.configService.get<string>('R2_BUCKET')
      || this.configService.get<string>('R2_BUCKET_NAME')
      || 'hireme-files';
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL') || '';

    this.logger.log(`R2 Config: endpoint=${endpoint}, bucket=${this.bucket}, hasAccessKey=${!!accessKeyId}, hasSecretKey=${!!secretAccessKey}`);

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: endpoint || '',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // Required for R2 compatibility
    });
  }

  async uploadFile(
    key: string,
    body: Buffer | Uint8Array | string,
    contentType: string,
    metadata?: Record<string, string>,
  ): Promise<string> {
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          Metadata: metadata,
        }),
      );

      return this.getPublicUrl(key);
    } catch (error: any) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      throw error;
    }
  }

  async getSignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 3600,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async getSignedDownloadUrl(
    key: string,
    options: SignedUrlOptions = {},
  ): Promise<string> {
    const { expiresIn = 3600, contentDisposition } = options;

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: contentDisposition,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch (error: any) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      throw error;
    }
  }

  async deleteFiles(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.deleteFile(key)));
  }

  async getFileMetadata(key: string): Promise<{ size: number; contentType: string } | null> {
    try {
      const response = await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      return {
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
      };
    } catch {
      return null;
    }
  }

  async listFiles(prefix: string, maxKeys = 1000): Promise<string[]> {
    const response = await this.s3Client.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
      }),
    );

    return (response.Contents || []).map((obj) => obj.Key!);
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }

  generateKey(userId: string, category: string, filename: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = filename.split('.').pop() || '';
    return `${category}/${userId}/${timestamp}-${random}.${extension}`;
  }
}
