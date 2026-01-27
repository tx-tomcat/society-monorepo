import { useMutation, useQueryClient } from '@tanstack/react-query';

import type {
  CompanionServiceInput,
  CreateCompanionProfileInput,
  RecurringAvailabilitySlot,
  ServiceType,
} from '../api/services/companions.service';
import { companionsService } from '../api/services/companions.service';
import { FILE_VALIDATION, filesService } from '../api/services/files.service';
import type { FileInfo } from '../api/services/files.service';

/**
 * Full onboarding data structure
 */
export interface CompanionOnboardingData {
  // Profile
  displayName: string;
  bio: string;
  photoUrls: string[]; // URLs after upload

  // Pricing
  hourlyRate: number;
  minimumHours?: number;
  halfDayRate?: number;
  fullDayRate?: number;

  // Services (occasion IDs mapped to ServiceTypes)
  services: ServiceType[];

  // Availability
  availability: RecurringAvailabilitySlot[];
}

/**
 * Hook to upload profile photos during onboarding
 * Uploads local URIs to Cloudflare R2 and returns URLs
 */
export function useUploadOnboardingPhotos() {
  return useMutation({
    mutationFn: async (localUris: string[]): Promise<string[]> => {
      const results = await filesService.uploadMultiple(
        localUris.map((uri) => ({ uri, category: 'profile_photo' as const })),
        { usePresignedUrl: true }
      );

      // Extract URLs from successful uploads
      const urls = results
        .filter((r): r is { success: true; file: FileInfo } => r.success)
        .map((r) => r.file.url);

      // Check for failures
      const failures = results.filter(
        (r): r is { success: false; error: string; uri: string } => !r.success
      );

      if (failures.length > 0) {
        console.warn('Some photos failed to upload:', failures);
      }

      if (urls.length === 0) {
        throw new Error('All photo uploads failed');
      }

      return urls;
    },
  });
}

/**
 * Hook to create the companion profile
 * This is the first step after photos are uploaded
 */
export function useCreateCompanionProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCompanionProfileInput) =>
      companionsService.createCompanionProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['companion', 'me'] });
    },
  });
}

/**
 * Hook to add photos to the companion profile
 * Call this after creating the profile with photo URLs
 */
export function useAddCompanionPhotos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photoUrls: string[]) => {
      // Add photos sequentially, first one as primary
      const results = [];
      for (let i = 0; i < photoUrls.length; i++) {
        const photo = await companionsService.addPhotoByUrl(
          photoUrls[i],
          i === 0 // First photo is primary
        );
        results.push(photo);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companion', 'me'] });
    },
  });
}

/**
 * Hook to set companion services
 */
export function useSetCompanionServices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (services: CompanionServiceInput[]) =>
      companionsService.setServices(services),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companion', 'me'] });
    },
  });
}

/**
 * Hook to set companion availability
 */
export function useSetCompanionAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recurring: RecurringAvailabilitySlot[]) =>
      companionsService.setAvailability({ recurring }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companion', 'me'] });
    },
  });
}

/**
 * Hook to complete onboarding
 */
export function useCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => companionsService.completeOnboarding(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['companion', 'me'] });
    },
  });
}

/**
 * Comprehensive hook to submit all onboarding data at once
 * This orchestrates the full onboarding flow:
 * 1. Upload photos to R2
 * 2. Create companion profile
 * 3. Add photos to profile
 * 4. Set services
 * 5. Set availability
 * 6. Mark onboarding complete
 */
export function useSubmitCompanionOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      localPhotoUris: string[];
      profile: CreateCompanionProfileInput;
      services: CompanionServiceInput[];
      availability: RecurringAvailabilitySlot[];
    }) => {
      // Validate photo count (business rule, not file validation)
      const { min: minPhotos, max: maxPhotos } = FILE_VALIDATION.photoCount.profile;
      if (data.localPhotoUris.length < minPhotos) {
        throw new Error(`At least ${minPhotos} photos required`);
      }
      if (data.localPhotoUris.length > maxPhotos) {
        throw new Error(`Maximum ${maxPhotos} photos allowed`);
      }

      // Step 1: Upload photos (validation happens inside uploadMultiple via uploadWithPresignedUrl)
      const photoResults = await filesService.uploadMultiple(
        data.localPhotoUris.map((uri) => ({ uri, category: 'profile_photo' as const })),
        { usePresignedUrl: true }
      );

      const uploadedUrls = photoResults
        .filter((r): r is { success: true; file: FileInfo } => r.success)
        .map((r) => r.file.url);

      // Check upload failures
      const failures = photoResults.filter(
        (r): r is { success: false; error: string; uri: string } => !r.success
      );

      if (failures.length > 0) {
        throw new Error(`Failed to upload ${failures.length} photo(s): ${failures[0].error}`);
      }

      if (uploadedUrls.length < minPhotos) {
        throw new Error(`Only ${uploadedUrls.length} photo(s) uploaded. Minimum ${minPhotos} required.`);
      }

      // Step 2: Create companion profile
      await companionsService.createCompanionProfile(data.profile);

      // Step 3: Add photos to profile
      for (let i = 0; i < uploadedUrls.length; i++) {
        await companionsService.addPhotoByUrl(uploadedUrls[i], i === 0);
      }

      // Step 4: Set services
      if (data.services.length > 0) {
        await companionsService.setServices(data.services);
      }

      // Step 5: Set availability
      if (data.availability.length > 0) {
        await companionsService.setAvailability({ recurring: data.availability });
      }

      // Step 6: Complete onboarding
      await companionsService.completeOnboarding();

      return {
        success: true,
        photosUploaded: uploadedUrls.length,
        servicesSet: data.services.length,
        availabilitySlotsSet: data.availability.length,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['companion', 'me'] });
    },
  });
}
