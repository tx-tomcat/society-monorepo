import { apiClient } from '../client';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface OccasionInfo {
  id: string;
  code: string;
  name: string;
  emoji: string;
}

export interface CompanionPhoto {
  id: string;
  url: string;
  isPrimary: boolean;
  position: number;
}

export interface CompanionService {
  id: string;
  occasionId: string;
  occasion: OccasionInfo;
  description?: string;
  priceAdjustment: number;
  isEnabled: boolean;
}

export interface CompanionServiceInput {
  occasionId: string;
  description?: string;
  priceAdjustment?: number;
  isEnabled?: boolean;
}

export interface CompanionAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface RecurringAvailabilitySlot {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // "09:00"
  endTime: string; // "18:00"
}

export interface AvailabilityException {
  date: string; // ISO date string
  available: boolean;
  reason?: string;
}

export interface UpdateAvailabilityInput {
  recurring: RecurringAvailabilitySlot[];
  exceptions?: AvailabilityException[];
}

/**
 * Input for creating a companion profile during onboarding
 */
export interface CreateCompanionProfileInput {
  bio?: string;
  heightCm?: number;
  languages?: string[];
  hourlyRate: number;
  halfDayRate?: number;
  fullDayRate?: number;
}

/**
 * Response from creating a companion profile
 */
export interface CreateCompanionProfileResponse {
  success: boolean;
  data: {
    id: string;
    userId: string;
    bio?: string;
    heightCm?: number;
    languages: string[];
    hourlyRate: number;
    halfDayRate?: number;
    fullDayRate?: number;
    isActive: boolean;
    verificationStatus: VerificationStatus;
  };
}

export interface Companion {
  id: string;
  userId: string;
  displayName: string; // Name returned directly from API
  age?: number | null;
  bio?: string | null;
  avatar?: string | null;
  heightCm?: number | null;
  gender?: string | null;
  languages?: string[];
  hourlyRate: number;
  halfDayRate?: number | null;
  fullDayRate?: number | null;
  rating: number;
  reviewCount: number;
  responseRate?: number;
  acceptanceRate?: number;
  completedBookings?: number;
  verificationStatus?: VerificationStatus;
  isVerified: boolean;
  isFeatured: boolean;
  isActive?: boolean;
  isHidden?: boolean;
  photos: (CompanionPhoto | string)[];
  services: CompanionService[];
  availability?: CompanionAvailability[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Type guard to check if a photo entry is a CompanionPhoto object
 */
export function isCompanionPhoto(photo: CompanionPhoto | string): photo is CompanionPhoto {
  return typeof photo !== 'string' && 'url' in photo;
}

/**
 * Get the URL from a photo entry (handles both string and object formats)
 */
export function getPhotoUrl(photo: CompanionPhoto | string | undefined): string | undefined {
  if (!photo) return undefined;
  return typeof photo === 'string' ? photo : photo.url;
}

/**
 * Get the primary photo URL from a companion's photos array
 */
export function getPrimaryPhotoUrl(photos: (CompanionPhoto | string)[] | undefined): string | undefined {
  if (!photos?.length) return undefined;
  // Look for primary photo first (only in object format)
  const primaryPhoto = photos.find((p) => isCompanionPhoto(p) && p.isPrimary);
  if (primaryPhoto) return getPhotoUrl(primaryPhoto);
  // Fall back to first photo
  return getPhotoUrl(photos[0]);
}

export interface CompanionFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  occasionId?: string;
  date?: string;
  rating?: number;
  languages?: string[];
  gender?: string;
  verified?: boolean;
  page?: number;
  limit?: number;
  sort?: 'rating' | 'price_asc' | 'price_desc' | 'popular' | 'distance';
}

export interface CompanionListResponse {
  companions: Companion[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CompanionReview {
  id: string;
  bookingId: string;
  reviewerId: string;
  rating: number;
  comment?: string;
  tags?: string[];
  createdAt: string;
  reviewer: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
}

export interface CompanionReviewsResponse {
  reviews: CompanionReview[];
  total: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
}

export interface UpdateCompanionProfileData {
  bio?: string;
  heightCm?: number;
  languages?: string[];
  hourlyRate?: number;
  halfDayRate?: number;
  fullDayRate?: number;
}

export interface BoostPricing {
  duration: number;
  price: number;
  label: string;
}

export interface ActiveBoost {
  id: string;
  startedAt: string;
  expiresAt: string;
  durationHours: number;
}

/**
 * Companions API Service
 */
export const companionsService = {
  // ============================================
  // Onboarding Methods
  // ============================================

  /**
   * Create a companion profile during onboarding
   * This transforms the user into a companion
   */
  async createCompanionProfile(
    data: CreateCompanionProfileInput
  ): Promise<CreateCompanionProfileResponse> {
    return apiClient.post('/users/companion-profile', data);
  },

  /**
   * Add a photo to companion profile by URL
   * Use this after uploading the image via filesService
   */
  async addPhotoByUrl(url: string, isPrimary = false): Promise<CompanionPhoto> {
    return apiClient.post('/companions/me/photos', { url, isPrimary });
  },

  /**
   * Update services offered (for onboarding)
   * Maps occasion IDs to service types
   */
  async setServices(services: CompanionServiceInput[]): Promise<CompanionService[]> {
    return apiClient.put('/companions/me/services', { services });
  },

  /**
   * Set availability schedule (for onboarding)
   * Uses recurring slots format expected by backend
   */
  async setAvailability(data: UpdateAvailabilityInput): Promise<{ success: boolean }> {
    return apiClient.put('/companions/me/availability', data);
  },

  /**
   * Complete onboarding - marks the user as fully onboarded
   */
  async completeOnboarding(): Promise<{ success: boolean }> {
    return apiClient.post('/users/onboarding/complete', {});
  },

  // ============================================
  // Browse/Discovery Methods
  // ============================================

  /**
   * Browse companions with filters (public)
   */
  async getCompanions(filters?: CompanionFilters): Promise<CompanionListResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString();
    return apiClient.get(`/companions${query ? `?${query}` : ''}`);
  },

  /**
   * Get companion by ID (public)
   */
  async getCompanion(companionId: string): Promise<Companion> {
    return apiClient.get(`/companions/${companionId}`);
  },

  /**
   * Get companion availability (public)
   */
  async getCompanionAvailability(
    companionId: string,
    startDate: string,
    endDate: string
  ): Promise<CompanionAvailability[]> {
    return apiClient.get(
      `/companions/${companionId}/availability?startDate=${startDate}&endDate=${endDate}`
    );
  },

  /**
   * Get companion reviews (public)
   */
  async getCompanionReviews(
    companionId: string,
    page = 1,
    limit = 10
  ): Promise<CompanionReviewsResponse> {
    return apiClient.get(
      `/companions/${companionId}/reviews?page=${page}&limit=${limit}`
    );
  },

  /**
   * Get my companion profile (authenticated)
   */
  async getMyProfile(): Promise<Companion> {
    return apiClient.get('/companions/me/profile');
  },

  /**
   * Update my companion profile (authenticated)
   */
  async updateMyProfile(data: UpdateCompanionProfileData): Promise<Companion> {
    return apiClient.put('/companions/me/profile', data);
  },

  /**
   * Update availability (authenticated)
   * @deprecated Use setAvailability instead for recurring slots format
   */
  async updateAvailability(
    recurring: RecurringAvailabilitySlot[],
    exceptions?: AvailabilityException[]
  ): Promise<{ success: boolean }> {
    return apiClient.put('/companions/me/availability', { recurring, exceptions });
  },

  /**
   * Add photo to profile by URL (authenticated)
   */
  async addPhoto(url: string, isPrimary = false): Promise<CompanionPhoto> {
    return apiClient.post('/companions/me/photos', { url, isPrimary });
  },

  /**
   * Remove photo from profile (authenticated)
   */
  async removePhoto(photoId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/companions/me/photos/${photoId}`);
  },

  /**
   * Update services offered (authenticated)
   */
  async updateServices(services: CompanionServiceInput[]): Promise<CompanionService[]> {
    return apiClient.put('/companions/me/services', { services });
  },

  /**
   * Get boost pricing (public)
   */
  async getBoostPricing(): Promise<BoostPricing[]> {
    return apiClient.get('/companions/boosts/pricing');
  },

  /**
   * Get active boost (authenticated)
   */
  async getActiveBoost(): Promise<ActiveBoost | null> {
    return apiClient.get('/companions/me/boost');
  },

  /**
   * Purchase boost (authenticated)
   */
  async purchaseBoost(durationHours: number): Promise<ActiveBoost> {
    return apiClient.post('/companions/me/boost', { durationHours });
  },
};
