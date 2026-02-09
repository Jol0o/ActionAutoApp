import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { initializeSocket, disconnectSocket, joinConversation, leaveConversation } from '@/lib/socket.client';

interface Message {
  _id: string;
  sender: any;
  senderEmail?: string;
  senderName?: string;
  content: string;
  type: string;
  isFromExternal: boolean;
  createdAt: Date;
}

interface TypingUser {
  userId: string;
  conversationId: string;
  typing: boolean;
}

export const useSocket = () => {
  const { getToken } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [newMessage, setNewMessage] = useState<{ conversationId: string; message: Message } | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    const setupSocket = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const socket = initializeSocket(token);

        socket.on('connect', () => {
          console.log('Socket connected');
          setIsConnected(true);
        });

        socket.on('disconnect', () => {
          console.log('Socket disconnected');
          setIsConnected(false);
        });

        socket.on('new_message', (data: { conversationId: string; message: Message }) => {
          console.log('New message received:', data);
          setNewMessage(data);
        });

        socket.on('user_typing', (data: TypingUser) => {
          console.log('User typing:', data);
          setTypingUsers((prev) => {
            if (data.typing) {
              return [...prev.filter(u => u.userId !== data.userId), data];
            } else {
              return prev.filter(u => u.userId !== data.userId);
            }
          });
        });

        socket.on('conversation_updated', (data: any) => {
          console.log('Conversation updated:', data);
        });

        return () => {
          disconnectSocket();
        };
      } catch (error) {
        console.error('Failed to setup socket:', error);
      }
    };

    setupSocket();

    return () => {
      disconnectSocket();
    };
  }, [getToken]);

  return {
    isConnected,
    newMessage,
    typingUsers,
    joinConversation,
    leaveConversation,
  };
};