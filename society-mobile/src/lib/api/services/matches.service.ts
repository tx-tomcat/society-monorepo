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
  async getMatches(): Promise<Match[]> {
    return apiClient.get('/matches');
  },

  /**
   * Swipe on a user profile
   */
  async swipe(data: SwipeData): Promise<{ match: boolean; matchId?: string }> {
    return apiClient.post('/matches/swipe', data);
  },

  /**
   * Get match details
   */
  async getMatch(matchId: string): Promise<Match> {
    return apiClient.get(`/matches/${matchId}`);
  },
};
