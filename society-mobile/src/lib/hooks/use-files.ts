import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  FileCategory,
  FileFilterParams,
  FileInfo,
} from '../api/services/files.service';
import { filesService } from '../api/services/files.service';
import { useAuth } from './use-auth';

/**
 * React Query hook to fetch user's files
 */
export function useMyFiles(filters?: FileFilterParams) {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['files', filters],
    queryFn: () => filesService.getMyFiles(filters),
    enabled: isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * React Query hook to fetch a single file by ID
 */
export function useFile(fileId: string | undefined) {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['files', fileId],
    queryFn: () => filesService.getFile(fileId!),
    enabled: isSignedIn && !!fileId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * React Query hook to get storage stats
 */
export function useStorageStats() {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['files', 'stats'],
    queryFn: () => filesService.getStorageStats(),
    enabled: isSignedIn,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Upload a single file using pre-signed URL (direct to R2)
 * Best for: Large files, profile photos
 */
export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      uri,
      category,
    }: {
      uri: string;
      category: FileCategory;
    }) => filesService.uploadWithPresignedUrl(uri, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
}

/**
 * Upload a single file directly through the backend
 * Best for: Small files, when you need immediate processing
 */
export function useUploadFileDirect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      uri,
      category,
      description,
      isPublic,
    }: {
      uri: string;
      category: FileCategory;
      description?: string;
      isPublic?: boolean;
    }) => filesService.uploadDirect(uri, category, { description, isPublic }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
}

/**
 * Upload multiple files in parallel
 * Returns results for each file (success or error)
 */
export function useUploadMultipleFiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      files,
      usePresignedUrl = true,
    }: {
      files: Array<{ uri: string; category: FileCategory }>;
      usePresignedUrl?: boolean;
    }) => filesService.uploadMultiple(files, { usePresignedUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
}

/**
 * Delete a file
 */
export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileId: string) => filesService.deleteFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
}

/**
 * Get a signed URL for private file access
 */
export function useSignedUrl(fileId: string | undefined, expiresIn?: number) {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['files', fileId, 'signed-url', expiresIn],
    queryFn: () => filesService.getSignedUrl(fileId!, expiresIn),
    enabled: isSignedIn && !!fileId,
    staleTime: (expiresIn || 3600) * 1000 * 0.9, // 90% of expiration time
  });
}

/**
 * Helper hook for uploading profile photos with progress tracking
 * This combines file upload with specific profile photo handling
 */
export function useUploadProfilePhotos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (localUris: string[]): Promise<FileInfo[]> => {
      const results = await filesService.uploadMultiple(
        localUris.map((uri) => ({ uri, category: 'profile_photo' as FileCategory })),
        { usePresignedUrl: true }
      );

      // Filter successful uploads
      const successfulUploads = results
        .filter((r): r is { success: true; file: FileInfo } => r.success)
        .map((r) => r.file);

      // If any failed, throw with details
      const failures = results.filter(
        (r): r is { success: false; error: string; uri: string } => !r.success
      );

      if (failures.length > 0 && successfulUploads.length === 0) {
        throw new Error(`All uploads failed: ${failures.map((f) => f.error).join(', ')}`);
      }

      return successfulUploads;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
}
