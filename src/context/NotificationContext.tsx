'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Notification } from '@/types/notification';
import { useAuth } from '@clerk/nextjs';
import { getSocket } from '@/lib/socket.client';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    deleteAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const POLL_INTERVAL = 20000;
const MAX_BACKOFF = 300000;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const backoffRef = useRef(POLL_INTERVAL);
    const fetchRef = useRef<(() => Promise<void>) | undefined>(undefined);
    const { getToken, isLoaded, isSignedIn } = useAuth();

    const fetchNotifications = useCallback(async () => {
        if (!isSignedIn) {
            setIsLoading(false);
            return;
        }

        try {
            const token = await getToken();
            if (!token) {
                setIsLoading(false);
                return;
            }

            const res = await fetch(`${API_URL}/api/notifications`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.ok) {
                const data = await res.json();
                setNotifications(data.data.notifications);
                setUnreadCount(data.data.unreadCount);
                setError(null);
                backoffRef.current = POLL_INTERVAL;
            } else if (res.status === 401) {
                setError(null);
            } else if (res.status === 404) {
                setNotifications([]);
                setUnreadCount(0);
                setError(null);
            } else {
                throw new Error(`HTTP ${res.status}`);
            }
        } catch {
            setError('Failed to load notifications');
            backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF);
        } finally {
            setIsLoading(false);
        }
    }, [getToken, isSignedIn]);

    fetchRef.current = fetchNotifications;

    const markAsRead = useCallback(async (id: string) => {
        const target = notifications.find(n => n._id === id);
        if (!target || target.isRead) return;

        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/api/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
        } catch {
            fetchRef.current?.();
        }
    }, [notifications, getToken]);

    const markAllAsRead = useCallback(async () => {
        const snapshot = [...notifications];
        const prevCount = unreadCount;
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);

        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/api/notifications/read-all`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
        } catch {
            setNotifications(snapshot);
            setUnreadCount(prevCount);
        }
    }, [notifications, unreadCount, getToken]);

    const deleteNotification = useCallback(async (id: string) => {
        const target = notifications.find(n => n._id === id);
        if (!target) return;

        const snapshot = [...notifications];
        const prevCount = unreadCount;
        const wasUnread = !target.isRead;

        setNotifications(prev => prev.filter(n => n._id !== id));
        if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/api/notifications/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
        } catch {
            setNotifications(snapshot);
            setUnreadCount(prevCount);
        }
    }, [notifications, unreadCount, getToken]);

    const deleteAllRead = useCallback(async () => {
        const snapshot = [...notifications];
        setNotifications(prev => prev.filter(n => !n.isRead));

        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/api/notifications/read/all`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error();
        } catch {
            setNotifications(snapshot);
        }
    }, [notifications, getToken]);

    useEffect(() => {
        if (!isLoaded || !isSignedIn) {
            setIsLoading(false);
            return;
        }

        fetchNotifications();

        const startPolling = () => {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = setInterval(() => fetchRef.current?.(), backoffRef.current);
        };

        const stopPolling = () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };

        const onVisibilityChange = () => {
            if (document.hidden) {
                stopPolling();
            } else {
                fetchRef.current?.();
                startPolling();
            }
        };

        startPolling();
        document.addEventListener('visibilitychange', onVisibilityChange);

        const socket = getSocket();
        const cleanups: Array<() => void> = [];

        if (socket) {
            const onNew = (notification: Notification) => {
                setNotifications(prev => {
                    if (prev.some(n => n._id === notification._id)) return prev;
                    return [notification, ...prev];
                });
                setUnreadCount(prev => prev + 1);
            };

            const onRead = ({ notificationId }: { notificationId: string }) => {
                setNotifications(prev =>
                    prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            };

            const onReadAll = () => {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
            };

            socket.on('notification:new', onNew);
            socket.on('notification:read', onRead);
            socket.on('notification:readAll', onReadAll);

            cleanups.push(
                () => socket.off('notification:new', onNew),
                () => socket.off('notification:read', onRead),
                () => socket.off('notification:readAll', onReadAll)
            );
        }

        return () => {
            stopPolling();
            document.removeEventListener('visibilitychange', onVisibilityChange);
            cleanups.forEach(fn => fn());
        };
    }, [fetchNotifications, isLoaded, isSignedIn]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                isLoading,
                error,
                fetchNotifications,
                markAsRead,
                markAllAsRead,
                deleteNotification,
                deleteAllRead,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within NotificationProvider');
    return context;
}