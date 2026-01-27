import { apiClient } from '../client';

// Types
export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';
export type DayType = 'weekday' | 'weekend';

export interface Occasion {
  id: string;
  code: string;
  emoji: string;
  name: string;
  description: string | null;
  displayOrder: number;
}

export interface OccasionContext {
  timeSlot: TimeSlot;
  dayType: DayType;
  activeHolidays: string[];
}

export interface OccasionsResponse {
  occasions: Occasion[];
  context: OccasionContext;
}

/**
 * Occasions API Service
 * Fetches dynamically managed occasions from the backend
 */
export const occasionsService = {
  /**
   * Get contextual occasions based on current time, day, and active holidays
   * The backend automatically determines the context
   */
  async getContextualOccasions(timezone?: string): Promise<OccasionsResponse> {
    const query = timezone ? `?timezone=${encodeURIComponent(timezone)}` : '';
    return apiClient.get(`/occasions${query}`);
  },

  /**
   * Get all active occasions without context filtering
   * Useful for admin views or when showing all available options
   */
  async getAllOccasions(): Promise<Occasion[]> {
    return apiClient.get('/occasions/all');
  },

  /**
   * Get a specific occasion by ID
   */
  async getOccasionById(id: string): Promise<Occasion> {
    return apiClient.get(`/occasions/${id}`);
  },
};
