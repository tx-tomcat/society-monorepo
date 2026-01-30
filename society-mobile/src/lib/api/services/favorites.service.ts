import { apiClient } from '../client';

// Simplified companion data returned by favorites API
export interface FavoriteCompanion {
  id: string; // CompanionProfile.id - use for navigation
  userId: string; // User.id
  displayName: string;
  avatar: string | null;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  isActive: boolean;
  isVerified: boolean;
}

export interface Favorite {
  id: string;
  companionId: string; // User.id (for add/remove operations)
  notes: string | null;
  addedAt: string;
  companion: FavoriteCompanion;
}

export interface FavoritesListResponse {
  favorites: Favorite[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Favorites API Service
 */
export const favoritesService = {
  /**
   * Get favorite companions
   */
  async getFavorites(page = 1, limit = 20): Promise<FavoritesListResponse> {
    return apiClient.get(`/favorites?page=${page}&limit=${limit}`);
  },

  /**
   * Add companion to favorites
   */
  async addFavorite(companionId: string): Promise<Favorite> {
    return apiClient.post('/favorites', { companionId });
  },

  /**
   * Toggle favorite status
   */
  async toggleFavorite(companionId: string): Promise<{ isFavorite: boolean }> {
    return apiClient.post(`/favorites/${companionId}/toggle`, {});
  },

  /**
   * Check if companion is favorited
   */
  async checkFavoriteStatus(
    companionId: string
  ): Promise<{ isFavorite: boolean }> {
    return apiClient.get(`/favorites/${companionId}/status`);
  },

  /**
   * Update favorite notes
   */
  async updateNotes(companionId: string, notes: string): Promise<Favorite> {
    return apiClient.put(`/favorites/${companionId}/notes`, { notes });
  },

  /**
   * Remove from favorites
   */
  async removeFavorite(companionId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/favorites/${companionId}`);
  },
};
