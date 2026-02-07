import { apiClient } from '../client';

export type VerificationStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'FAILED'
  | 'EXPIRED';

export interface PhotoVerificationStatus {
  id: string;
  status: VerificationStatus;
  idFrontUrl: string;
  idBackUrl: string;
  selfieUrl: string;
  failureReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface SubmitPhotoVerificationInput {
  idFrontUrl: string;
  idBackUrl: string;
  selfieUrl: string;
}

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
  province?: string;
  district?: string;
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

const R2_DEV_URL_RE = /^https:\/\/pub-[a-z0-9]+\.r2\.dev\//;
const R2_CUSTOM_DOMAIN = 'https://static.hireme.vn/';

/**
 * Get the URL from a photo entry (handles both string and object formats)
 * Rewrites legacy R2 dev URLs to the custom domain
 */
export function getPhotoUrl(photo: CompanionPhoto | string | undefined): string | undefined {
  if (!photo) return undefined;
  const url = typeof photo === 'string' ? photo : photo.url;
  return url.replace(R2_DEV_URL_RE, R2_CUSTOM_DOMAIN);
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
  displayName?: string;
  bio?: string;
  heightCm?: number;
  languages?: string[];
  hourlyRate?: number;
}

// Boost tier enum matching backend
export const BoostTier = {
  STANDARD: 'STANDARD',
  PREMIUM: 'PREMIUM',
  SUPER: 'SUPER',
} as const;
export type BoostTier = (typeof BoostTier)[keyof typeof BoostTier];

export const BoostStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;
export type BoostStatus = (typeof BoostStatus)[keyof typeof BoostStatus];

export interface BoostPricing {
  tier: BoostTier;
  name: string;
  durationHours: number;
  price: number;
  multiplier: number;
  description: string;
}

export interface ActiveBoost {
  boost: {
    id: string;
    tier: BoostTier;
    status: BoostStatus;
    multiplier: number;
    startedAt: string | null;
    expiresAt: string | null;
    remainingHours: number | null;
  }
  hasActiveBoost: boolean;
}

export interface BoostHistoryItem {
  id: string;
  tier: BoostTier;
  status: BoostStatus;
  price: number;
  startedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface BoostPurchaseResult {
  boostId: string;
  tier: BoostTier;
  price: number;
  message: string;
  paymentRequestId: string;
  code: string;
  qrUrl: string;
  deeplinks: {
    appId: string;
    name: string;
    logo: string;
    deeplink: string;
  }[];
  accountInfo: {
    bankCode: string;
    accountNumber: string;
    accountName: string;
  };
  expiresAt: string;
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
   * Get my availability (authenticated)
   */
  async getMyAvailability(): Promise<{ recurring: CompanionAvailability[] }> {
    return apiClient.get('/companions/me/availability');
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
   * Set a photo as primary (authenticated)
   */
  async setPrimaryPhoto(photoId: string): Promise<{ success: boolean }> {
    return apiClient.patch(`/companions/me/photos/${photoId}/primary`);
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
    const response = await apiClient.get<{ pricing: BoostPricing[] }>('/companions/boosts/pricing');
    return response.pricing;
  },

  /**
   * Get active boost (authenticated)
   */
  async getActiveBoost(): Promise<ActiveBoost | null> {
    return apiClient.get('/companions/me/boost');
  },

  /**
   * Get boost history (authenticated)
   */
  async getBoostHistory(limit = 10): Promise<BoostHistoryItem[]> {
    return apiClient.get(`/companions/me/boost/history?limit=${limit}`);
  },

  /**
   * Purchase boost (authenticated)
   */
  async purchaseBoost(
    tier: BoostTier,
  ): Promise<BoostPurchaseResult> {
    return apiClient.post('/companions/me/boost', { tier });
  },

  /**
   * Cancel active boost (authenticated, no refund)
   */
  async cancelBoost(boostId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/companions/me/boost/${boostId}`);
  },

  /**
   * Get photo verification status (authenticated)
   */
  async getPhotoVerificationStatus(): Promise<PhotoVerificationStatus | null> {
    return apiClient.get('/companions/me/verification');
  },

  /**
   * Submit photo verification (authenticated)
   */
  async submitPhotoVerification(
    input: SubmitPhotoVerificationInput,
  ): Promise<PhotoVerificationStatus> {
    return apiClient.post('/companions/me/verification', input);
  },
};
