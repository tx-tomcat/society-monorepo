import { apiClient } from '../client';

export type MessageType = 'text' | 'image' | 'location' | 'system';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: MessageType;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  bookingId?: string;
  hirerId: string;
  companionId: string;
  lastMessageAt?: string;
  isActive: boolean;
  createdAt: string;
  lastMessage?: Message;
  otherUser: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    isOnline: boolean;
  };
  unreadCount: number;
}

export interface ConversationsResponse {
  conversations: Conversation[];
  total: number;
  page: number;
  limit: number;
}

export interface MessagesResponse {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface SendMessageData {
  content: string;
  messageType?: MessageType;
}

/**
 * Messaging API Service
 */
export const messagingService = {
  /**
   * Get conversations list
   */
  async getConversations(
    page = 1,
    limit = 20
  ): Promise<ConversationsResponse> {
    return apiClient.get(`/conversations?page=${page}&limit=${limit}`);
  },

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<{ count: number }> {
    return apiClient.get('/conversations/unread-count');
  },

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    return apiClient.get(`/conversations/${conversationId}`);
  },

  /**
   * Get messages in conversation
   */
  async getMessages(
    conversationId: string,
    page = 1,
    limit = 50
  ): Promise<MessagesResponse> {
    return apiClient.get(
      `/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
    );
  },

  /**
   * Send message
   */
  async sendMessage(
    conversationId: string,
    data: SendMessageData
  ): Promise<Message> {
    return apiClient.post(`/conversations/${conversationId}/messages`, data);
  },

  /**
   * Mark conversation as read
   */
  async markAsRead(conversationId: string): Promise<{ success: boolean }> {
    return apiClient.post(`/conversations/${conversationId}/read`, {});
  },

  /**
   * Archive conversation
   */
  async archiveConversation(
    conversationId: string
  ): Promise<{ success: boolean }> {
    return apiClient.post(`/conversations/${conversationId}/archive`, {});
  },

  /**
   * Search messages
   */
  async searchMessages(query: string): Promise<Message[]> {
    return apiClient.get(`/messages/search?q=${encodeURIComponent(query)}`);
  },
};
