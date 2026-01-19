import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import type { SendMessageData } from '../api/services/messaging.service';
import { messagingService } from '../api/services/messaging.service';
import { useAuth } from './use-auth';

/**
 * React Query hook to fetch conversations list
 */
export function useConversations() {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagingService.getConversations(1, 50),
    enabled: isSignedIn,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * React Query hook to fetch unread messages count
 */
export function useUnreadCount() {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['unread-count'],
    queryFn: () => messagingService.getUnreadCount(),
    enabled: isSignedIn,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  });
}

/**
 * React Query hook to fetch single conversation
 */
export function useConversation(conversationId: string) {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => messagingService.getConversation(conversationId),
    enabled: isSignedIn && !!conversationId,
    staleTime: 30 * 1000,
  });
}

/**
 * React Query infinite query hook to fetch messages with pagination
 */
export function useMessages(conversationId: string) {
  const { isSignedIn } = useAuth();

  return useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam = 1 }) =>
      messagingService.getMessages(conversationId, pageParam, 50),
    enabled: isSignedIn && !!conversationId,
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    staleTime: 10 * 1000,
  });
}

/**
 * React Query mutation hook to send a message
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      data,
    }: {
      conversationId: string;
      data: SendMessageData;
    }) => messagingService.sendMessage(conversationId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['messages', variables.conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/**
 * React Query mutation hook to mark conversation as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      messagingService.markAsRead(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({
        queryKey: ['conversation', conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
}

/**
 * React Query mutation hook to archive conversation
 */
export function useArchiveConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      messagingService.archiveConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/**
 * React Query hook to search messages
 */
export function useSearchMessages(query: string) {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['messages-search', query],
    queryFn: () => messagingService.searchMessages(query),
    enabled: isSignedIn && query.length >= 2,
    staleTime: 60 * 1000, // 1 minute
  });
}
