import { useState } from 'react';
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

  // Fetch all conversations
  const {
    data: conversations = [],
    isLoading,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const token = await getToken();
      const response = await apiClient.get('/api/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data?.data || response.data;
      return data.conversations || [];
    },
  });

  // Fetch specific conversation
  const fetchConversation = async (conversationId: string) => {
    try {
      const token = await getToken();
      const response = await apiClient.get(`/api/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('Failed to fetch conversation:', error);
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
      const token = await getToken();
      const response = await apiClient.post('/api/conversations', data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to create conversation');
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
      const token = await getToken();
      const response = await apiClient.post(
        `/api/conversations/${conversationId}/messages`,
        { content, type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data?.data || response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to send message');
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
      setError(error.response?.data?.message || 'Failed to add external email');
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
      const token = await getToken();
      const response = await apiClient.post(
        '/api/conversations/sync-gmail',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to sync Gmail');
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
    error,
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