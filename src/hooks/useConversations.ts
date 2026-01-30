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
    const response = await apiClient.post('/api/conversations', data);
    const conversation = response.data?.data || response.data;
    
    setConversations(prev => [conversation, ...prev]);
    return conversation;
  }, []);

  const sendMessage = useCallback(async (conversationId: string, data: {
    content: string;
    type?: 'text' | 'file' | 'image' | 'appointment';
    metadata?: any;
  }) => {
    const response = await apiClient.post(`/api/conversations/${conversationId}/messages`, data);
    const updated = response.data?.data || response.data;
    
    setConversations(prev => 
      prev.map(c => c._id === conversationId ? updated : c)
    );
    return updated;
  }, []);

  const markAsRead = useCallback(async (conversationId: string) => {
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
    markAsRead
  };
}