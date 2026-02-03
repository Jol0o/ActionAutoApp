'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Notification } from '@/types/notification';
import { useAuth } from '@clerk/nextjs';

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const pollDelayRef = useRef(30000); // Start with 30s

    const { getToken, isLoaded, isSignedIn } = useAuth();

    const fetchNotifications = useCallback(async () => {
        if (!isSignedIn) return;

        try {
            const token = await getToken();
            const response = await fetch(`${API_URL}/api/notifications`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setNotifications(data.data.notifications);
                setUnreadCount(data.data.unreadCount);
                setError(null);
                pollDelayRef.current = 30000; // Reset delay on success
            } else {
                const errorText = await response.text();
                // If unauthorized, stop polling
                if (response.status === 401) {
                    setError(null);
                    if (pollIntervalRef.current) {
                        clearInterval(pollIntervalRef.current);
                    }
                    return;
                }
                throw new Error(`Failed to fetch notifications: ${response.status}`);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setError('Failed to load notifications');
            pollDelayRef.current = Math.min(pollDelayRef.current * 2, 300000);
        } finally {
            setIsLoading(false);
        }
    }, [getToken, isSignedIn]);

    const markAsRead = useCallback(async (id: string) => {
        const notification = notifications.find(n => n._id === id);
        if (!notification) return;

        const wasUnread = !notification.isRead;
        // Optimistic update
        setNotifications(prev =>
            prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
        );
        if (wasUnread) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }

        try {
            const token = await getToken();
            const response = await fetch(`${API_URL}/api/notifications/${id}/read`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Added token
                },
            });

            if (!response.ok) {
                throw new Error('Failed to mark as read');
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
            await fetchNotifications();
        }
    }, [notifications, fetchNotifications, getToken]);

    const markAllAsRead = useCallback(async () => {
        const previousNotifications = [...notifications];
        const previousUnreadCount = unreadCount;
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);

        try {
            const token = await getToken();
            const response = await fetch(`${API_URL}/api/notifications/read-all`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Added token
                },
            });

            if (!response.ok) {
                throw new Error('Failed to mark all as read');
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
            setNotifications(previousNotifications);
            setUnreadCount(previousUnreadCount);
        }
    }, [notifications, unreadCount, getToken]);

    const deleteNotification = useCallback(async (id: string) => {
        const notification = notifications.find(n => n._id === id);
        if (!notification) return;

        const wasUnread = !notification.isRead;
        const previousNotifications = [...notifications];
        const previousUnreadCount = unreadCount;

        setNotifications(prev => prev.filter(n => n._id !== id));
        if (wasUnread) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }

        try {
            const token = await getToken();
            const response = await fetch(`${API_URL}/api/notifications/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Added token
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete notification');
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
            setNotifications(previousNotifications);
            setUnreadCount(previousUnreadCount);
        }
    }, [notifications, unreadCount, getToken]);

    const deleteAllRead = useCallback(async () => {
        const previousNotifications = [...notifications];
        setNotifications(prev => prev.filter(n => !n.isRead));

        try {
            const token = await getToken();
            const response = await fetch(`${API_URL}/api/notifications/read/all`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Added token
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete read notifications');
            }
        } catch (error) {
            console.error('Error deleting read notifications:', error);
            setNotifications(previousNotifications);
        }
    }, [notifications, getToken]);

    useEffect(() => {
        if (!isLoaded || !isSignedIn) {
            setIsLoading(false);
            setError(null);
            return;
        }

        fetchNotifications();

        const startPolling = () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
            pollIntervalRef.current = setInterval(() => {
                fetchNotifications();
            }, pollDelayRef.current);
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                }
            } else {
                fetchNotifications();
                startPolling();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        startPolling();

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
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
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
