import { apiClient } from '../client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatResponse {
  message: ChatMessage;
  suggestions?: string[];
}

export interface SuggestRepliesResponse {
  suggestions: string[];
}

/**
 * AI API Service
 */
export const aiService = {
  /**
   * Send message to AI chat
   */
  async chat(
    message: string,
    getToken: () => Promise<string | null>
  ): Promise<ChatResponse> {
    return apiClient.post('/ai/chat', { message }, { getToken });
  },

  /**
   * Get AI-suggested replies for an incoming message
   */
  async suggestReplies(
    incomingMessage: string,
    getToken: () => Promise<string | null>
  ): Promise<SuggestRepliesResponse> {
    return apiClient.post(
      '/ai/suggest-replies',
      { incomingMessage },
      { getToken }
    );
  },

  /**
   * Generate AI profile suggestions
   */
  async generateProfileSuggestions(
    userData: {
      interests?: string[];
      bio?: string;
      location?: string;
    },
    getToken: () => Promise<string | null>
  ): Promise<{ suggestions: string[] }> {
    return apiClient.post('/ai/profile-suggestions', userData, { getToken });
  },
};
