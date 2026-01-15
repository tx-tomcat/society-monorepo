export interface ConversationResponse {
  id: string;
  bookingId?: string;
  participant1Id: string;
  participant2Id: string;
  lastMessageAt: Date | null;
  participant1LastReadAt: Date | null;
  participant2LastReadAt: Date | null;
  isArchivedBy1: boolean;
  isArchivedBy2: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationParticipant {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  isOnline?: boolean;
}

export interface ConversationLastMessage {
  id: string;
  content: string | null;
  contentType: string;
  senderId: string;
  createdAt: Date;
}

export interface ConversationSummary {
  id: string;
  bookingId?: string;
  otherUser?: ConversationParticipant;
  name?: string;
  avatarUrl?: string | null;
  isGroup: boolean;
  lastMessage: ConversationLastMessage | null;
  unreadCount: number;
  isArchived: boolean;
  createdAt: Date;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  contentType: string;
  mediaUrl: string | null;
  mediaMetadata: Record<string, unknown> | null;
  replyTo: {
    id: string;
    content?: string | null;
    senderId?: string;
  } | null;
  reactions: MessageReactionResponse[];
  isEdited: boolean;
  editedAt: Date | null;
  isDeleted: boolean;
  createdAt: Date;
}

export interface MessageReactionResponse {
  id: string;
  reaction: string;
  userId: string;
  createdAt: Date;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  isTyping: boolean;
  timestamp: Date;
}

export interface ReadReceipt {
  conversationId: string;
  userId: string;
  lastReadAt: Date;
  lastReadMessageId?: string;
}

// WebSocket events
export interface WsMessageEvent {
  type: 'message:new' | 'message:deleted' | 'message:edited' | 'message:reaction';
  payload: MessageResponse | { messageId: string } | { messageId: string; reaction: string; userId: string };
}

export interface WsTypingEvent {
  type: 'typing:start' | 'typing:stop';
  conversationId: string;
  userId: string;
}

export interface WsPresenceEvent {
  type: 'user:online' | 'user:offline';
  userId: string;
  timestamp: Date;
}
