import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@clerk/nextjs';

interface Conversation {
  _id: string;
  type: 'direct' | 'group' | 'channel' | 'external';
  name?: string;
  participants: Array<{
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  }>;
  externalEmails: Array<{
    email: string;
    name?: string;
    addedAt: Date;
  }>;
  messages: Array<{
    _id: string;
    sender?: any;
    senderEmail?: string;
    senderName?: string;
    content: string;
    type: string;
    isFromExternal: boolean;
    createdAt: Date;
  }>;
  lastMessage?: string;
  lastMessageAt?: Date;
  gmailThreadId?: string;
  metadata?: {
    subject?: string;
  };
}

export const useConversations = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Fetch all conversations with proper error handling
  const {
    data: conversations = [],
    isLoading,
    error: queryError,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      try {
        console.log('[useConversations] Fetching conversations...');
        const token = await getToken();
        
        if (!token) {
          console.error('[useConversations] No auth token available');
          throw new Error('Not authenticated');
        }

        console.log('[useConversations] Making API request to /api/conversations');
        const response = await apiClient.get('/api/conversations', {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('[useConversations] Raw response:', response);
        
        // Handle different response formats
        let conversationsData = [];
        
        if (response.data?.data?.conversations) {
          conversationsData = response.data.data.conversations;
        } else if (response.data?.conversations) {
          conversationsData = response.data.conversations;
        } else if (Array.isArray(response.data?.data)) {
          conversationsData = response.data.data;
        } else if (Array.isArray(response.data)) {
          conversationsData = response.data;
        } else {
          console.warn('[useConversations] Unexpected response format:', response.data);
          conversationsData = [];
        }

        console.log('[useConversations] Parsed conversations:', conversationsData.length, 'items');
        return conversationsData;
      } catch (error: any) {
        console.error('[useConversations] Error fetching conversations:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  // Set error state from query error
  React.useEffect(() => {
    if (queryError) {
      const errorMessage = (queryError as any)?.response?.data?.message 
        || (queryError as any)?.message 
        || 'Failed to load conversations';
      setError(errorMessage);
      console.error('[useConversations] Query error:', errorMessage);
    } else {
      setError(null);
    }
  }, [queryError]);

  // Fetch specific conversation
  const fetchConversation = async (conversationId: string) => {
    try {
      console.log('[useConversations] Fetching conversation:', conversationId);
      const token = await getToken();
      const response = await apiClient.get(`/api/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('[useConversations] Failed to fetch conversation:', error);
      throw error;
    }
  };

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (data: {
      type: string;
      name?: string;
      participants: string[];
      externalEmails?: string[];
      subject?: string;
    }) => {
      console.log('[useConversations] Creating conversation:', data);
      const token = await getToken();
      const response = await apiClient.post('/api/conversations', data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      console.log('[useConversations] Conversation created successfully');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create conversation';
      console.error('[useConversations] Create error:', errorMessage);
      setError(errorMessage);
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      conversationId,
      content,
      type = 'text',
    }: {
      conversationId: string;
      content: string;
      type?: string;
    }) => {
      console.log('[useConversations] Sending message to:', conversationId);
      const token = await getToken();
      const response = await apiClient.post(
        `/api/conversations/${conversationId}/messages`,
        { content, type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data?.data || response.data;
    },
    onSuccess: (_, variables) => {
      console.log('[useConversations] Message sent successfully');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to send message';
      console.error('[useConversations] Send message error:', errorMessage);
      setError(errorMessage);
    },
  });

  // Add external email mutation
  const addExternalEmailMutation = useMutation({
    mutationFn: async ({
      conversationId,
      email,
    }: {
      conversationId: string;
      email: string;
    }) => {
      console.log('[useConversations] Adding external email:', email);
      const token = await getToken();
      const response = await apiClient.post(
        `/api/conversations/${conversationId}/external-email`,
        { email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data?.data || response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to add external email';
      console.error('[useConversations] Add email error:', errorMessage);
      setError(errorMessage);
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const token = await getToken();
      await apiClient.patch(
        `/api/conversations/${conversationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Sync Gmail mutation
  const syncGmailMutation = useMutation({
    mutationFn: async () => {
      console.log('[useConversations] Syncing Gmail...');
      const token = await getToken();
      const response = await apiClient.post(
        '/api/conversations/sync-gmail',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data?.data || response.data;
    },
    onSuccess: (data) => {
      console.log('[useConversations] Gmail synced:', data);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to sync Gmail';
      console.error('[useConversations] Sync Gmail error:', errorMessage);
      setError(errorMessage);
    },
  });

  // Archive conversation mutation
  const archiveConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const token = await getToken();
      await apiClient.patch(
        `/api/conversations/${conversationId}/archive`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  return {
    conversations,
    isLoading,
    error: error || (queryError ? 'Failed to load conversations' : null),
    fetchConversation,
    createConversation: createConversationMutation.mutate,
    isCreatingConversation: createConversationMutation.isPending,
    sendMessage: sendMessageMutation.mutate,
    isSendingMessage: sendMessageMutation.isPending,
    addExternalEmail: addExternalEmailMutation.mutate,
    isAddingEmail: addExternalEmailMutation.isPending,
    markAsRead: markAsReadMutation.mutate,
    syncGmail: syncGmailMutation.mutate,
    isSyncingGmail: syncGmailMutation.isPending,
    archiveConversation: archiveConversationMutation.mutate,
    refetchConversations,
  };
};