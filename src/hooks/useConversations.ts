import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiClient } from '@/lib/api-client';
import { AxiosError } from 'axios';
import { Conversation, Message } from '@/types/appointment';


export function useConversations() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { getToken, isLoaded, isSignedIn } = useAuth();

    const fetchConversations = useCallback(async () => {
        if (!isSignedIn) return;

        try {
            setIsLoading(true);
            const token = await getToken();
            const response = await apiClient.get('/api/conversations', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data?.data || response.data;
            setConversations(data || []);
            setError(null);
        } catch (err) {
            const axiosError = err as AxiosError;
            const message = (axiosError.response?.data as any)?.message || 'Failed to fetch conversations';
            console.error('Error fetching conversations:', message);
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [getToken, isSignedIn]);

    const createConversation = useCallback(async (participantIds: string[]) => {
        try {
            const token = await getToken();
            const response = await apiClient.post('/api/conversations', { participantIds }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const newConversation = response.data?.data || response.data;
            setConversations(prev => [newConversation, ...prev]);
            return newConversation;
        } catch (err) {
            const axiosError = err as AxiosError;
            const message = (axiosError.response?.data as any)?.message || 'Failed to create conversation';
            throw new Error(message);
        }
    }, [getToken]);

    const sendMessage = useCallback(async (conversationId: string, content: string) => {
        try {
            const token = await getToken();
            const response = await apiClient.post(`/api/conversations/${conversationId}/messages`, { content }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const newMessage = response.data?.data || response.data;

            // Optimistically update conversation with new message
            setConversations(prev => prev.map(c => {
                if (c._id === conversationId) {
                    return {
                        ...c,
                        messages: [...c.messages, newMessage],
                        lastMessage: content,
                        updatedAt: new Date().toISOString()
                    };
                }
                return c;
            }));

            return newMessage;
        } catch (err) {
            const axiosError = err as AxiosError;
            const message = (axiosError.response?.data as any)?.message || 'Failed to send message';
            throw new Error(message);
        }
    }, [getToken]);

    const deleteConversation = useCallback(async (conversationId: string) => {
        try {
            const token = await getToken();
            await apiClient.delete(`/api/conversations/${conversationId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConversations(prev => prev.filter(c => c._id !== conversationId));
        } catch (err) {
            const axiosError = err as AxiosError;
            const message = (axiosError.response?.data as any)?.message || 'Failed to delete conversation';
            throw new Error(message);
        }
    }, [getToken]);

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            fetchConversations();
        } else if (isLoaded && !isSignedIn) {
            setIsLoading(false);
        }
    }, [fetchConversations, isLoaded, isSignedIn]);

    return {
        conversations,
        isLoading,
        error,
        fetchConversations,
        createConversation,
        sendMessage,
        deleteConversation
    };
}
