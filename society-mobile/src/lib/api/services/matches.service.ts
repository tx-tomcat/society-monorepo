import { apiClient } from '../client';

export interface Match {
  id: string;
  userId: string;
  matchedUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  matchedUser: {
    id: string;
    fullName: string;
    profileImageUrl: string;
    bio: string;
  };
}

export interface SwipeData {
  userId: string;
  direction: 'like' | 'pass';
}

/**
 * Matches API Service
 */
export const matchesService = {
  /**
   * Get all matches for current user
   */
  async getMatches(getToken: () => Promise<string | null>): Promise<Match[]> {
    return apiClient.get('/matches', { getToken });
  },

  /**
   * Swipe on a user profile
   */
  async swipe(
    data: SwipeData,
    getToken: () => Promise<string | null>
  ): Promise<{ match: boolean; matchId?: string }> {
    return apiClient.post('/matches/swipe', data, { getToken });
  },

  /**
   * Get match details
   */
  async getMatch(
    matchId: string,
    getToken: () => Promise<string | null>
  ): Promise<Match> {
    return apiClient.get(`/matches/${matchId}`, { getToken });
  },
};
