import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { CreateMessageDto, UpdateMessageDto } from '../dto/message.dto';
import { MessageResponse, ConversationResponse, MessageReactionResponse, PaginationMeta } from '../interfaces/messaging.interface';
import { filterMessageContent } from '../../../common/utils/content-filter.utils';

// Message rate limiting configuration
const MESSAGE_RATE_LIMIT = {
  MAX_MESSAGES: 10, // Maximum messages per window
  WINDOW_MS: 60 * 1000, // 1 minute window
} as const;

// In-memory rate limit store (for production, use Redis)
interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const messageRateLimits = new Map<string, RateLimitEntry>();

// Supabase message types
type MessageContentType = 'TEXT' | 'IMAGE' | 'VOICE' | 'GIF' | 'SYSTEM';

interface SupabaseMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  content_type: MessageContentType;
  media_url: string | null;
  media_metadata: Record<string, unknown> | null;
  reply_to_id: string | null;
  is_edited: boolean;
  edited_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
}

interface SupabaseConversation {
  id: string;
  booking_id: string;
  participant1_id: string;
  participant2_id: string;
  last_message_at: string | null;
  participant1_last_read_at: string | null;
  participant2_last_read_at: string | null;
  is_archived_by_1: boolean;
  is_archived_by_2: boolean;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);
  private supabase: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_SERVICE_KEY')!,
    );
  }

  /**
   * Create a conversation when users match
   */
  async createConversation(
    matchId: string,
    participant1Id: string,
    participant2Id: string,
  ): Promise<ConversationResponse> {
    const { data, error } = await this.supabase
      .from('conversations')
      .insert({
        match_id: matchId,
        participant1_id: participant1Id,
        participant2_id: participant2Id,
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create conversation', error);
      throw new BadRequestException('Failed to create conversation');
    }

    return this.mapConversation(data);
  }

  /**
   * Get conversation by match ID
   */
  async getConversationByMatch(matchId: string): Promise<ConversationResponse | null> {
    const { data, error } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('match_id', matchId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapConversation(data);
  }

  /**
   * Get user's conversations
   */
  async getConversations(userId: string): Promise<ConversationResponse[]> {
    const { data, error } = await this.supabase
      .from('conversations')
      .select('*')
      .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) {
      this.logger.error('Failed to fetch conversations', error);
      throw new BadRequestException('Failed to fetch conversations');
    }

    return (data || []).map(c => this.mapConversation(c));
  }

  /**
   * Get messages in a conversation
   */
  async getMessages(
    userId: string,
    conversationId: string,
    page = 1,
    limit = 50,
  ): Promise<{ data: MessageResponse[]; meta: PaginationMeta }> {
    // Verify user is participant
    const conversation = await this.getConversationById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      throw new ForbiddenException('Not a participant of this conversation');
    }

    const offset = (page - 1) * limit;

    // Get messages
    const { data: messages, error, count } = await this.supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.logger.error('Failed to fetch messages', error);
      throw new BadRequestException('Failed to fetch messages');
    }

    // Get reactions for these messages
    const messageIds = (messages || []).map(m => m.id);
    const { data: reactions } = await this.supabase
      .from('message_reactions')
      .select('*')
      .in('message_id', messageIds);

    const reactionsMap = new Map<string, any[]>();
    (reactions || []).forEach(r => {
      if (!reactionsMap.has(r.message_id)) {
        reactionsMap.set(r.message_id, []);
      }
      reactionsMap.get(r.message_id)!.push({
        id: r.id,
        reaction: r.reaction,
        userId: r.user_id,
        createdAt: r.created_at,
      });
    });

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: (messages || []).map(msg => this.mapMessage(msg, reactionsMap.get(msg.id) || [])),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Send a message
   */
  async sendMessage(
    userId: string,
    conversationId: string,
    dto: CreateMessageDto,
  ): Promise<MessageResponse> {
    // Check message rate limit (10 messages per minute)
    this.checkMessageRateLimit(userId);

    // Verify user is participant
    const conversation = await this.getConversationById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      throw new ForbiddenException('Not a participant of this conversation');
    }

    // Check if booking exists and is in a valid state for messaging
    if (conversation.bookingId) {
      const booking = await this.prisma.booking.findUnique({
        where: { id: conversation.bookingId },
      });

      if (!booking) {
        throw new BadRequestException('Cannot send message - booking not found');
      }

      // Allow messaging for confirmed, in-progress, or completed bookings
      const validStatuses = ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'];
      if (!validStatuses.includes(booking.status)) {
        throw new BadRequestException('Cannot send message - booking is not active');
      }
    }

    // Validate reply
    if (dto.replyToId) {
      const { data: replyTo } = await this.supabase
        .from('messages')
        .select('id, conversation_id')
        .eq('id', dto.replyToId)
        .single();

      if (!replyTo || replyTo.conversation_id !== conversationId) {
        throw new BadRequestException('Invalid reply message');
      }
    }

    // Filter message content for prohibited patterns (phone numbers, emails, social media)
    if (dto.content && dto.contentType === 'TEXT') {
      const filterResult = filterMessageContent(dto.content);
      if (filterResult.isBlocked) {
        throw new BadRequestException(filterResult.message);
      }
    }

    // Create message
    const { data: message, error } = await this.supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: dto.content,
        content_type: dto.contentType || 'TEXT',
        media_url: dto.mediaUrl,
        media_metadata: dto.mediaMetadata,
        reply_to_id: dto.replyToId,
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to send message', error);
      throw new BadRequestException('Failed to send message');
    }

    this.logger.log(`Message sent in conversation ${conversationId} by user ${userId}`);

    // Send push notification to the other participant
    const recipientId = conversation.participant1Id === userId
      ? conversation.participant2Id
      : conversation.participant1Id;

    // Get sender name for notification
    this.prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true },
    }).then((sender) => {
      if (sender) {
        this.notificationsService
          .notifyNewMessage(recipientId, sender.fullName, conversationId)
          .catch((err) =>
            this.logger.warn(`Failed to send new message notification: ${err.message}`),
          );
      }
    }).catch((err) =>
      this.logger.warn(`Failed to get sender for notification: ${err.message}`),
    );

    // Realtime broadcast happens automatically via Supabase Realtime

    return this.mapMessage(message, []);
  }

  /**
   * Edit a message
   */
  async editMessage(
    userId: string,
    messageId: string,
    dto: UpdateMessageDto,
  ): Promise<MessageResponse> {
    const { data: message } = await this.supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.sender_id !== userId) {
      throw new ForbiddenException('Can only edit your own messages');
    }

    if (message.is_deleted) {
      throw new BadRequestException('Cannot edit deleted message');
    }

    // Check if message is too old to edit (24 hours)
    const editWindow = 24 * 60 * 60 * 1000;
    if (Date.now() - new Date(message.created_at).getTime() > editWindow) {
      throw new BadRequestException('Message is too old to edit');
    }

    // Filter edited content for prohibited patterns
    if (dto.content && message.content_type === 'TEXT') {
      const filterResult = filterMessageContent(dto.content);
      if (filterResult.isBlocked) {
        throw new BadRequestException(filterResult.message);
      }
    }

    const { data: updated, error } = await this.supabase
      .from('messages')
      .update({
        content: dto.content,
        is_edited: true,
        edited_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Failed to edit message');
    }

    return this.mapMessage(updated, []);
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(userId: string, messageId: string) {
    const { data: message } = await this.supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.sender_id !== userId) {
      throw new ForbiddenException('Can only delete your own messages');
    }

    const { error } = await this.supabase
      .from('messages')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        content: null,
      })
      .eq('id', messageId);

    if (error) {
      throw new BadRequestException('Failed to delete message');
    }

    return { success: true };
  }

  /**
   * Add/remove reaction
   */
  async addReaction(userId: string, messageId: string, reaction: string) {
    const { data: message } = await this.supabase
      .from('messages')
      .select('*, conversations!inner(*)')
      .eq('id', messageId)
      .single();

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const conv = message.conversations;
    if (conv.participant1_id !== userId && conv.participant2_id !== userId) {
      throw new ForbiddenException('Not a participant of this conversation');
    }

    // Check if reaction exists
    const { data: existing } = await this.supabase
      .from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('reaction', reaction)
      .single();

    if (existing) {
      // Remove reaction (toggle off)
      await this.supabase
        .from('message_reactions')
        .delete()
        .eq('id', existing.id);

      return { action: 'removed' };
    }

    // Add reaction
    await this.supabase
      .from('message_reactions')
      .insert({
        message_id: messageId,
        user_id: userId,
        reaction,
      });

    return { action: 'added' };
  }

  /**
   * Mark conversation as read
   */
  async markAsRead(userId: string, conversationId: string) {
    const conversation = await this.getConversationById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const updateField = conversation.participant1Id === userId
      ? 'participant1_last_read_at'
      : 'participant2_last_read_at';

    await this.supabase
      .from('conversations')
      .update({ [updateField]: new Date().toISOString() })
      .eq('id', conversationId);

    return { success: true };
  }

  /**
   * Archive/unarchive conversation
   */
  async archiveConversation(userId: string, conversationId: string, archive = true) {
    const conversation = await this.getConversationById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const updateField = conversation.participant1Id === userId
      ? 'is_archived_by_1'
      : 'is_archived_by_2';

    await this.supabase
      .from('conversations')
      .update({ [updateField]: archive })
      .eq('id', conversationId);

    return { success: true };
  }

  /**
   * Search messages
   */
  async searchMessages(
    userId: string,
    query: string,
    conversationId?: string,
    page = 1,
    limit = 20,
  ) {
    // Get user's conversation IDs
    const { data: conversations } = await this.supabase
      .from('conversations')
      .select('id')
      .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`);

    const conversationIds = conversationId
      ? [conversationId]
      : (conversations || []).map(c => c.id);

    if (conversationId && !conversationIds.includes(conversationId)) {
      throw new ForbiddenException('Not a participant of this conversation');
    }

    const offset = (page - 1) * limit;

    const { data, count } = await this.supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .in('conversation_id', conversationIds)
      .ilike('content', `%${query}%`)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: (data || []).map(msg => this.mapMessage(msg, [])),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  // ============================================
  // Private helpers
  // ============================================

  /**
   * Check and update message rate limit for a user
   * Returns true if message is allowed, throws if rate limited
   */
  private checkMessageRateLimit(userId: string): { allowed: boolean; remainingMessages: number; resetIn: number } {
    const now = Date.now();
    const key = `msg:${userId}`;
    const entry = messageRateLimits.get(key);

    // Clean up old entries periodically (simple garbage collection)
    if (Math.random() < 0.01) { // 1% chance on each check
      for (const [k, v] of messageRateLimits.entries()) {
        if (now - v.windowStart > MESSAGE_RATE_LIMIT.WINDOW_MS * 2) {
          messageRateLimits.delete(k);
        }
      }
    }

    if (!entry || now - entry.windowStart > MESSAGE_RATE_LIMIT.WINDOW_MS) {
      // Start new window
      messageRateLimits.set(key, { count: 1, windowStart: now });
      return {
        allowed: true,
        remainingMessages: MESSAGE_RATE_LIMIT.MAX_MESSAGES - 1,
        resetIn: MESSAGE_RATE_LIMIT.WINDOW_MS,
      };
    }

    if (entry.count >= MESSAGE_RATE_LIMIT.MAX_MESSAGES) {
      // Rate limited
      const resetIn = MESSAGE_RATE_LIMIT.WINDOW_MS - (now - entry.windowStart);
      throw new BadRequestException(
        `You are sending messages too quickly. Please wait ${Math.ceil(resetIn / 1000)} seconds before sending another message.`
      );
    }

    // Increment count
    entry.count++;
    const remainingMessages = MESSAGE_RATE_LIMIT.MAX_MESSAGES - entry.count;
    const resetIn = MESSAGE_RATE_LIMIT.WINDOW_MS - (now - entry.windowStart);

    return { allowed: true, remainingMessages, resetIn };
  }

  private async getConversationById(id: string): Promise<ConversationResponse | null> {
    const { data } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    return data ? this.mapConversation(data) : null;
  }

  private mapConversation(conv: SupabaseConversation): ConversationResponse {
    return {
      id: conv.id,
      bookingId: conv.booking_id,
      participant1Id: conv.participant1_id,
      participant2Id: conv.participant2_id,
      lastMessageAt: conv.last_message_at ? new Date(conv.last_message_at) : null,
      participant1LastReadAt: conv.participant1_last_read_at ? new Date(conv.participant1_last_read_at) : null,
      participant2LastReadAt: conv.participant2_last_read_at ? new Date(conv.participant2_last_read_at) : null,
      isArchivedBy1: conv.is_archived_by_1,
      isArchivedBy2: conv.is_archived_by_2,
      createdAt: new Date(conv.created_at),
      updatedAt: new Date(conv.updated_at),
    };
  }

  private mapMessage(msg: SupabaseMessage, reactions: MessageReactionResponse[]): MessageResponse {
    return {
      id: msg.id,
      conversationId: msg.conversation_id,
      senderId: msg.sender_id,
      content: msg.content,
      contentType: msg.content_type,
      mediaUrl: msg.media_url,
      mediaMetadata: msg.media_metadata,
      replyTo: msg.reply_to_id ? { id: msg.reply_to_id } : null,
      reactions,
      isEdited: msg.is_edited,
      editedAt: msg.edited_at ? new Date(msg.edited_at) : null,
      isDeleted: msg.is_deleted,
      createdAt: new Date(msg.created_at),
    };
  }
}
