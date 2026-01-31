import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Conversation } from '@/types/appointment';
import { AxiosError } from 'axios';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async (params?: {
    hasAppointment?: boolean;
    includeArchived?: boolean;
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiClient.get('/api/conversations', { params });
      const data = response.data?.data || response.data;
      
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      const axiosError = err as AxiosError;
      const message = (axiosError.response?.data as any)?.message || 'Failed to fetch conversations';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createConversation = useCallback(async (data: {
    type: 'direct' | 'group';
    participants: string[];
    name?: string;
  }) => {
    try {
      const response = await apiClient.post('/api/conversations', data);
      const conversation = response.data?.data || response.data;
      
      setConversations(prev => [conversation, ...prev]);
      return conversation;
    } catch (err) {
      const axiosError = err as AxiosError;
      const message = (axiosError.response?.data as any)?.message || 'Failed to create conversation';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const sendMessage = useCallback(async (conversationId: string, data: {
    content: string;
    type?: 'text' | 'file' | 'image' | 'appointment';
    metadata?: any;
  }) => {
    try {
      const response = await apiClient.post(`/api/conversations/${conversationId}/messages`, data);
      const updated = response.data?.data || response.data;
      
      setConversations(prev => 
        prev.map(c => c._id === conversationId ? updated : c)
      );
      return updated;
    } catch (err) {
      const axiosError = err as AxiosError;
      const message = (axiosError.response?.data as any)?.message || 'Failed to send message';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      await apiClient.post(`/api/conversations/${conversationId}/read`);
      
      setConversations(prev => 
        prev.map(c => {
          if (c._id === conversationId) {
            return {
              ...c,
              messages: c.messages.map(m => ({
                ...m,
                readBy: [...new Set([...m.readBy, 'currentUser'])]
              }))
            };
          }
          return c;
        })
      );
    } catch (err) {
      const axiosError = err as AxiosError;
      const message = (axiosError.response?.data as any)?.message || 'Failed to mark as read';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      await apiClient.delete(`/api/conversations/${conversationId}`);
      
      // Remove from state
      setConversations(prev => prev.filter(c => c._id !== conversationId));
    } catch (err) {
      const axiosError = err as AxiosError;
      const message = (axiosError.response?.data as any)?.message || 'Failed to delete conversation';
      setError(message);
      throw new Error(message);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    isLoading,
    error,
    fetchConversations,
    createConversation,
    sendMessage,
    markAsRead,
    deleteConversation
  };
}