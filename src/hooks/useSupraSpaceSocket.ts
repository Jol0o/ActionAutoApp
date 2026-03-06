'use client';

import * as React from 'react';
import { io, Socket } from 'socket.io-client';

export interface SSMessage {
  _id: string;
  conversationId: string;
  sender: { _id: string; fullName: string; username: string; avatar?: string };
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  attachments: Array<{
    url: string;
    originalName: string;
    mimeType: string;
    size: number;
    thumbnailUrl?: string;
  }>;
  replyTo?: SSMessage | null;
  readBy: string[];
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
}

export interface SSConversation {
  _id: string;
  type: 'direct' | 'group';
  name?: string;
  avatar?: string;
  members: Array<{ _id: string; fullName: string; username: string; avatar?: string; role: string }>;
  admins: string[];
  lastMessage?: SSMessage;
  lastMessageAt?: string;
  createdBy: string;
}

export interface PresenceMap {
  [userId: string]: 'online' | 'offline';
}

export interface TypingMap {
  [conversationId: string]: Array<{ userId: string; fullName: string }>;
}

interface UseSupraSpaceReturn {
  socket: Socket | null;
  isConnected: boolean;
  presence: PresenceMap;
  typing: TypingMap;
  // Actions
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendTypingStart: (conversationId: string) => void;
  sendTypingStop: (conversationId: string) => void;
  markRead: (conversationId: string) => void;
}

export function useSupraSpaceSocket(token: string | null): UseSupraSpaceReturn {
  const socketRef = React.useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const [presence, setPresence] = React.useState<PresenceMap>({});
  const [typing, setTyping] = React.useState<TypingMap>({});

  React.useEffect(() => {
    if (!token) return;

    // ── Transport strategy ──────────────────────────────────────────────────
    // Dev tunnels (devtunnels.ms, ngrok, etc.) often block raw WebSocket
    // upgrades. Starting with 'polling' first lets Socket.io establish the
    // connection over HTTP, then it upgrades to WebSocket automatically.
    // On a direct localhost connection this adds no overhead.
    const socket = io(process.env.NEXT_PUBLIC_API_URL || '', {
      path: '/socket/supraspace',
      auth: { token },
      transports: ['polling', 'websocket'],  // polling first → upgrade to ws
      upgrade: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      // Force new connection (don't reuse a stale socket from HMR)
      forceNew: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[SupraSpace] ✅ Connected via', socket.io.engine.transport.name, '| id:', socket.id);
      setIsConnected(true);
    });

    socket.io.engine.on('upgrade', (transport: any) => {
      console.log('[SupraSpace] 🔼 Upgraded transport to:', transport.name);
    });

    socket.on('disconnect', (reason) => {
      console.log('[SupraSpace] ❌ Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[SupraSpace] Connection error:', err.message);
      // If websocket fails, engine will automatically retry with polling
    });

    socket.on('presence:update', ({ userId, status }: { userId: string; status: 'online' | 'offline' }) => {
      setPresence((prev) => ({ ...prev, [userId]: status }));
    });

    socket.on('typing:start', ({ conversationId, userId, fullName }: any) => {
      setTyping((prev) => {
        const existing = prev[conversationId] || [];
        if (existing.find((t) => t.userId === userId)) return prev;
        return { ...prev, [conversationId]: [...existing, { userId, fullName }] };
      });
    });

    socket.on('typing:stop', ({ conversationId, userId }: any) => {
      setTyping((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).filter((t) => t.userId !== userId),
      }));
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [token]);

  // ── Stable action callbacks ────────────────────────────────────────────────
  const joinConversation = React.useCallback((conversationId: string) => {
    socketRef.current?.emit('join:conversation', { conversationId });
  }, []);

  const leaveConversation = React.useCallback((conversationId: string) => {
    socketRef.current?.emit('leave:conversation', { conversationId });
  }, []);

  const sendTypingStart = React.useCallback((conversationId: string) => {
    socketRef.current?.emit('typing:start', { conversationId });
  }, []);

  const sendTypingStop = React.useCallback((conversationId: string) => {
    socketRef.current?.emit('typing:stop', { conversationId });
  }, []);

  const markRead = React.useCallback((conversationId: string) => {
    socketRef.current?.emit('mark:read', { conversationId });
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    presence,
    typing,
    joinConversation,
    leaveConversation,
    sendTypingStart,
    sendTypingStop,
    markRead,
  };
}