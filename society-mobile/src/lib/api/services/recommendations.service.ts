import { apiClient } from '../client';

export type InteractionEventType =
  | 'VIEW'
  | 'PROFILE_OPEN'
  | 'BOOKMARK'
  | 'UNBOOKMARK'
  | 'MESSAGE_SENT'
  | 'BOOKING_STARTED'
  | 'BOOKING_COMPLETED'
  | 'BOOKING_CANCELLED';

export interface EmbeddedCompanionData {
  id: string;
  userId: string;
  displayName: string;
  age?: number | null;
  bio?: string | null;
  avatar?: string | null;
  heightCm?: number | null;
  gender?: string | null;
  languages: string[];
  hourlyRate: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isActive: boolean;
  photos: { id: string; url: string; isPrimary: boolean; position: number }[];
  services: { occasionId: string; occasion?: { id: string; nameEn: string; nameVi: string; emoji: string } }[];
}

export interface ScoredCompanion {
  companionId: string;
  score: number;
  reason: string;
  breakdown: {
    preferenceMatch: number;
    profileQuality: number;
    availability: number;
    popularity: number;
    behavioralAffinity: number;
  };
  companion: EmbeddedCompanionData;
}

export interface RecommendationsResponse {
  companions: ScoredCompanion[];
  hasMore: boolean;
  total: number;
  strategy: 'cold_start' | 'hybrid';
}

export interface TeaserResponse {
  companions: ScoredCompanion[];
}

export interface TrackInteractionInput {
  companionId: string;
  eventType: InteractionEventType;
  dwellTimeMs?: number;
  sessionId?: string;
}

export const recommendationsService = {
  /**
   * Get full paginated recommendations for "For You" tab
   */
  async getForYou(params?: {
    limit?: number;
    offset?: number;
  }): Promise<RecommendationsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.offset) queryParams.append('offset', String(params.offset));
    const query = queryParams.toString();
    return apiClient.get(`/recommendations/for-you${query ? `?${query}` : ''}`);
  },

  /**
   * Get teaser recommendations for home dashboard
   */
  async getTeaser(limit?: number): Promise<TeaserResponse> {
    const query = limit ? `?limit=${limit}` : '';
    return apiClient.get(`/recommendations/for-you/teaser${query}`);
  },

  /**
   * Track user interaction with a companion
   */
  async trackInteraction(
    data: TrackInteractionInput
  ): Promise<{ success: boolean }> {
    return apiClient.post('/recommendations/interactions', data);
  },

  /**
   * Force refresh recommendations
   */
  async refresh(): Promise<{ success: boolean }> {
    return apiClient.post('/recommendations/refresh', {});
  },
};
