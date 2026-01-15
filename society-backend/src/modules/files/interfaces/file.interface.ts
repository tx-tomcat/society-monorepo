export interface FileInfo {
  id: string;
  userId: string;
  filename: string;
  originalFilename: string;
  contentType: string;
  size: number;
  category: string;
  url: string;
  thumbnailUrl: string | null;
  variants: FileVariant[];
  isPublic: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface FileVariant {
  size: string;
  url: string;
  width: number;
  height: number;
}

export interface UploadUrlResult {
  uploadUrl: string;
  fileId: string;
  publicUrl: string;
  expiresAt: Date;
}

export interface ImageProcessingResult {
  id: string;
  variants: FileVariant[];
  thumbnailUrl: string;
}

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  byCategory: Record<string, { count: number; size: number }>;
}

export interface SignedUrlOptions {
  expiresIn?: number; // seconds
  contentType?: string;
  contentDisposition?: string;
}
