import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = (token: string): Socket => {
  if (socket && socket.connected) {
    return socket;
  }

  const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinConversation = (conversationId: string) => {
  if (socket && socket.connected) {
    socket.emit('join_conversation', conversationId);
  }
};

export const leaveConversation = (conversationId: string) => {
  if (socket && socket.connected) {
    socket.emit('leave_conversation', conversationId);
  }
};

export const emitTypingStart = (conversationId: string) => {
  if (socket && socket.connected) {
    socket.emit('typing_start', { conversationId });
  }
};

export const emitTypingStop = (conversationId: string) => {
  if (socket && socket.connected) {
    socket.emit('typing_stop', { conversationId });
  }
};