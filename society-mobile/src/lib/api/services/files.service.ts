import * as FileSystem from 'expo-file-system/legacy';

import { apiClient } from '../client';

/**
 * Validation constants matching backend limits
 */
export const FILE_VALIDATION = {
  // Size limits per category (in bytes)
  maxSize: {
    profile_photo: 10 * 1024 * 1024, // 10MB
    verification_doc: 20 * 1024 * 1024, // 20MB
    message_attachment: 25 * 1024 * 1024, // 25MB
    event_image: 15 * 1024 * 1024, // 15MB
    gift_image: 5 * 1024 * 1024, // 5MB
    experience_image: 15 * 1024 * 1024, // 15MB
    invoice_pdf: 5 * 1024 * 1024, // 5MB
    other: 10 * 1024 * 1024, // 10MB
  } as const,

  // Allowed content types per category
  allowedTypes: {
    profile_photo: ['image/jpeg', 'image/png', 'image/webp'],
    verification_doc: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    message_attachment: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
    event_image: ['image/jpeg', 'image/png', 'image/webp'],
    gift_image: ['image/jpeg', 'image/png', 'image/webp'],
    experience_image: ['image/jpeg', 'image/png', 'image/webp'],
    invoice_pdf: ['application/pdf'],
    other: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  } as const,

  // Photo count limits
  photoCount: {
    profile: { min: 3, max: 6 },
  } as const,
} as const;

/**
 * File validation error
 */
export class FileValidationError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_TYPE' | 'FILE_TOO_LARGE' | 'FILE_NOT_FOUND' | 'TOO_FEW_FILES' | 'TOO_MANY_FILES'
  ) {
    super(message);
    this.name = 'FileValidationError';
  }
}

/**
 * Validate a file before upload
 */
export async function validateFile(
  uri: string,
  category: FileCategory
): Promise<{ valid: true; size: number; mimeType: string } | { valid: false; error: FileValidationError }> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      return {
        valid: false,
        error: new FileValidationError('File does not exist', 'FILE_NOT_FOUND'),
      };
    }

    const size = fileInfo.size || 0;
    const extension = uri.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      pdf: 'application/pdf',
    };
    const mimeType = mimeTypes[extension || ''] || 'application/octet-stream';

    // Check file type
    const allowedTypes = FILE_VALIDATION.allowedTypes[category];
    if (!allowedTypes.includes(mimeType as never)) {
      const allowedExtensions = allowedTypes.map((t) => t.split('/')[1]).join(', ');
      return {
        valid: false,
        error: new FileValidationError(
          `Invalid file type. Allowed: ${allowedExtensions}`,
          'INVALID_TYPE'
        ),
      };
    }

    // Check file size
    const maxSize = FILE_VALIDATION.maxSize[category];
    if (size > maxSize) {
      const maxSizeMB = Math.round(maxSize / 1024 / 1024);
      return {
        valid: false,
        error: new FileValidationError(
          `File too large. Maximum size: ${maxSizeMB}MB`,
          'FILE_TOO_LARGE'
        ),
      };
    }

    return { valid: true, size, mimeType };
  } catch {
    return {
      valid: false,
      error: new FileValidationError('Could not read file', 'FILE_NOT_FOUND'),
    };
  }
}

/**
 * Validate multiple files (e.g., for profile photos)
 */
export async function validateFiles(
  uris: string[],
  category: FileCategory,
  options?: { minCount?: number; maxCount?: number }
): Promise<
  | { valid: true; files: Array<{ uri: string; size: number; mimeType: string }> }
  | { valid: false; error: FileValidationError; failedUri?: string }
> {
  const { minCount, maxCount } = options || {};

  // Check count limits
  if (minCount !== undefined && uris.length < minCount) {
    return {
      valid: false,
      error: new FileValidationError(
        `At least ${minCount} file(s) required. You have ${uris.length}.`,
        'TOO_FEW_FILES'
      ),
    };
  }

  if (maxCount !== undefined && uris.length > maxCount) {
    return {
      valid: false,
      error: new FileValidationError(
        `Maximum ${maxCount} file(s) allowed. You have ${uris.length}.`,
        'TOO_MANY_FILES'
      ),
    };
  }

  // Validate each file
  const validatedFiles: Array<{ uri: string; size: number; mimeType: string }> = [];
  for (const uri of uris) {
    const result = await validateFile(uri, category);
    if (!result.valid) {
      return { valid: false, error: result.error, failedUri: uri };
    }
    validatedFiles.push({ uri, size: result.size, mimeType: result.mimeType });
  }

  return { valid: true, files: validatedFiles };
}

/**
 * File categories matching backend FileCategory enum
 */
export type FileCategory =
  | 'profile_photo'
  | 'verification_doc'
  | 'message_attachment'
  | 'event_image'
  | 'gift_image'
  | 'experience_image'
  | 'invoice_pdf'
  | 'other';

export type ImageSize = 'thumbnail' | 'small' | 'medium' | 'large' | 'original';

export interface FileVariant {
  size: ImageSize;
  url: string;
  width: number;
  height: number;
}

export interface FileInfo {
  id: string;
  userId: string;
  filename: string;
  originalFilename: string;
  contentType: string;
  size: number;
  category: FileCategory;
  url: string;
  thumbnailUrl: string | null;
  variants: FileVariant[];
  isPublic: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface GetUploadUrlRequest {
  filename: string;
  contentType: string;
  size: number;
  category: FileCategory;
}

export interface UploadUrlResult {
  uploadUrl: string;
  fileId: string;
  publicUrl: string;
  expiresAt: string;
}

export interface UploadFileRequest {
  category: FileCategory;
  description?: string;
  isPublic?: boolean;
}

export interface FileFilterParams {
  category?: FileCategory;
  isPublic?: boolean;
  limit?: number;
  offset?: number;
}

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  byCategory: Record<string, { count: number; size: number }>;
}

/**
 * Get file info from a local URI
 */
async function getFileInfo(uri: string): Promise<{
  size: number;
  name: string;
  mimeType: string;
}> {
  const fileInfo = await FileSystem.getInfoAsync(uri);
  if (!fileInfo.exists) {
    throw new Error('File does not exist');
  }

  // Extract filename from URI
  const name = uri.split('/').pop() || 'file';

  // Determine mime type from extension
  const extension = name.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    pdf: 'application/pdf',
    mp3: 'audio/mpeg',
    ogg: 'audio/ogg',
  };

  return {
    size: fileInfo.size || 0,
    name,
    mimeType: mimeTypes[extension || ''] || 'application/octet-stream',
  };
}

/**
 * Files API Service
 * Handles file uploads to Cloudflare R2 via backend
 */
export const filesService = {
  /**
   * Get a pre-signed upload URL from the backend
   * Use this for direct-to-storage uploads (more efficient for large files)
   */
  async getUploadUrl(request: GetUploadUrlRequest): Promise<UploadUrlResult> {
    return apiClient.post('/files/upload-url', request);
  },

  /**
   * Upload a file using pre-signed URL (two-step upload)
   * 1. Validate file (type and size)
   * 2. Get upload URL from backend
   * 3. Upload directly to R2 storage
   *
   * Best for: Large files, profile photos, verification docs
   */
  async uploadWithPresignedUrl(
    localUri: string,
    category: FileCategory
  ): Promise<FileInfo> {
    console.log('[Upload] Starting upload for:', localUri);

    // Step 1: Validate file before upload
    const validation = await validateFile(localUri, category);
    if (!validation.valid) {
      console.log('[Upload] Validation failed:', validation.error.message);
      throw validation.error;
    }
    console.log('[Upload] Validation passed:', { size: validation.size, mimeType: validation.mimeType });

    // Get file info from validation result
    const name = localUri.split('/').pop() || 'file';
    const fileInfo = {
      size: validation.size,
      name,
      mimeType: validation.mimeType,
    };

    // Step 2: Get pre-signed upload URL
    console.log('[Upload] Getting presigned URL...');
    const uploadResult = await this.getUploadUrl({
      filename: fileInfo.name,
      contentType: fileInfo.mimeType,
      size: fileInfo.size,
      category,
    });
    console.log('[Upload] Got presigned URL, fileId:', uploadResult.fileId);

    // Step 3: Upload directly to R2 using the pre-signed URL
    console.log('[Upload] Uploading to R2...');
    const uploadResponse = await FileSystem.uploadAsync(
      uploadResult.uploadUrl,
      localUri,
      {
        httpMethod: 'PUT',
        headers: {
          'Content-Type': fileInfo.mimeType,
        },
      }
    );
    console.log('[Upload] R2 response status:', uploadResponse.status, 'body:', uploadResponse.body);

    if (uploadResponse.status !== 200) {
      throw new Error(`Upload to R2 failed with status ${uploadResponse.status}: ${uploadResponse.body}`);
    }

    // Return the file info
    console.log('[Upload] Getting file info for:', uploadResult.fileId);
    const file = await this.getFile(uploadResult.fileId);
    console.log('[Upload] File info retrieved:', file.id);
    return file;
  },

  /**
   * Upload file directly through the backend
   * Uses multipart form data
   *
   * Best for: Small files, when you need immediate processing
   */
  async uploadDirect(
    localUri: string,
    category: FileCategory,
    options?: { description?: string; isPublic?: boolean }
  ): Promise<FileInfo> {
    console.log('[Upload Direct] Starting for:', localUri, 'category:', category);

    // Step 1: Validate file before upload
    const validation = await validateFile(localUri, category);
    if (!validation.valid) {
      console.log('[Upload Direct] Validation failed:', validation.error.message);
      throw validation.error;
    }
    console.log('[Upload Direct] Validation passed');

    // Get file info from validation result
    const name = localUri.split('/').pop() || 'file';
    const fileInfo = {
      size: validation.size,
      name,
      mimeType: validation.mimeType,
    };

    // Create form data
    const formData = new FormData();
    formData.append('file', {
      uri: localUri,
      name: fileInfo.name,
      type: fileInfo.mimeType,
    } as unknown as Blob);
    formData.append('category', category);
    if (options?.description) {
      formData.append('description', options.description);
    }
    if (options?.isPublic !== undefined) {
      formData.append('isPublic', String(options.isPublic));
    }

    console.log('[Upload Direct] Sending to backend with category:', category);

    return apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Upload multiple files in parallel
   * Returns array of file info or errors
   */
  async uploadMultiple(
    files: Array<{ uri: string; category: FileCategory }>,
    options?: { usePresignedUrl?: boolean }
  ): Promise<Array<{ success: true; file: FileInfo } | { success: false; error: string; uri: string }>> {
    const uploadMethod = options?.usePresignedUrl
      ? (uri: string, cat: FileCategory) => this.uploadWithPresignedUrl(uri, cat)
      : (uri: string, cat: FileCategory) => this.uploadDirect(uri, cat);

    const results = await Promise.allSettled(
      files.map(async ({ uri, category }) => {
        const file = await uploadMethod(uri, category);
        return { success: true as const, file };
      })
    );

    console.log('results', results);

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return {
        success: false as const,
        error: result.reason?.message || 'Upload failed',
        uri: files[index].uri,
      };
    });
  },

  /**
   * Get file by ID
   */
  async getFile(fileId: string): Promise<FileInfo> {
    return apiClient.get(`/files/${fileId}`);
  },

  /**
   * Get my files with optional filters
   */
  async getMyFiles(filters?: FileFilterParams): Promise<FileInfo[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString();
    return apiClient.get(`/files${query ? `?${query}` : ''}`);
  },

  /**
   * Get a signed URL for private file access
   */
  async getSignedUrl(fileId: string, expiresIn?: number): Promise<{ url: string }> {
    const query = expiresIn ? `?expiresIn=${expiresIn}` : '';
    return apiClient.get(`/files/${fileId}/signed-url${query}`);
  },

  /**
   * Delete a file
   */
  async deleteFile(fileId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/files/${fileId}`);
  },

  /**
   * Get storage stats for current user
   */
  async getStorageStats(): Promise<StorageStats> {
    return apiClient.get('/files/stats/me');
  },
};
