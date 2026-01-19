import { apiClient } from '../client';

export type ServiceType =
  | 'FAMILY_INTRODUCTION'
  | 'WEDDING_ATTENDANCE'
  | 'TET_COMPANIONSHIP'
  | 'BUSINESS_EVENT'
  | 'CASUAL_OUTING'
  | 'CLASS_REUNION'
  | 'OTHER';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface CompanionPhoto {
  id: string;
  url: string;
  isPrimary: boolean;
  order: number;
}

export interface CompanionService {
  type: ServiceType;
  description?: string;
  isAvailable: boolean;
}

export interface CompanionAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface Companion {
  id: string;
  userId: string;
  bio?: string;
  heightCm?: number;
  languages?: string[];
  hourlyRate: number;
  halfDayRate?: number;
  fullDayRate?: number;
  ratingAvg: number;
  ratingCount: number;
  totalBookings: number;
  completedBookings: number;
  verificationStatus: VerificationStatus;
  isFeatured: boolean;
  isActive: boolean;
  isHidden: boolean;
  photos: CompanionPhoto[];
  services: CompanionService[];
  availability: CompanionAvailability[];
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    gender?: string;
    isVerified: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CompanionFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  serviceType?: ServiceType;
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
    date?: string
  ): Promise<CompanionAvailability[]> {
    const query = date ? `?date=${date}` : '';
    return apiClient.get(`/companions/${companionId}/availability${query}`);
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
   */
  async updateAvailability(
    availability: CompanionAvailability[]
  ): Promise<CompanionAvailability[]> {
    return apiClient.put('/companions/me/availability', { availability });
  },

  /**
   * Add photo to profile (authenticated)
   */
  async addPhoto(file: FormData): Promise<CompanionPhoto> {
    return apiClient.post('/companions/me/photos', file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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
  async updateServices(services: CompanionService[]): Promise<CompanionService[]> {
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
