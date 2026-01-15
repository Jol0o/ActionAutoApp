'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@/lib/types';
import * as authApi from '@/lib/auth-api';
import { getAuthCookie, deleteAuthCookie } from '@/lib/cookies';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (data: authApi.LoginData) => Promise<void>;
    register: (data: authApi.RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    const clearError = useCallback(() => setError(null), []);

    const fetchUser = useCallback(async () => {
        const token = getAuthCookie();

        // --- Storage Diagnostics ---
        if (token) {
            console.log('[AuthContext] Token detected during initialization.');
        } else {
            console.warn('[AuthContext] No token found in Cookie or LocalStorage.');
            if (typeof document !== 'undefined') {
                console.log('[AuthContext] Available cookies:', document.cookie || 'NONE');
            }
        }
        // -------------------------

        if (!token) {
            console.log('[AuthContext] No access token found. Attempting to recover session via refresh token...');
        }

        // Only fetch if we don't have a user yet
        if (user) {
            setIsLoading(false);
            return;
        }

        try {
            console.log('[AuthContext] Fetching user profile...');
            const userData = await authApi.getCurrentUser();
            console.log('[AuthContext] Session initialized for:', userData.name);
            setUser(userData);
        } catch (err: any) {
            console.error('[AuthContext] Profile fetch failed:', err.response?.data || err.message);

            // If unauthorized, clear invalid session
            if (err.response?.status === 401) {
                console.warn('[AuthContext] 401 from backend. Token likely invalid.');
                deleteAuthCookie();
                setUser(null);

                // Only redirect if not already on public pages
                const isPublic = pathname === '/login' || pathname === '/signup' || pathname === '/inventory-public';
                if (!isPublic) router.push('/login');
            }
        } finally {
            setIsLoading(false);
        }
    }, [user, pathname, router]);

    useEffect(() => {
        // Run once on mount
        fetchUser();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const login = async (data: authApi.LoginData) => {
        setIsLoading(true);
        setError(null);
        try {
            const { user } = await authApi.login(data);
            setUser(user);
            router.push('/');
        } catch (err: any) {
            console.error('Login error:', err.response?.data || err.message);
            setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (data: authApi.RegisterData) => {
        setIsLoading(true);
        setError(null);
        try {
            const { user } = await authApi.register(data);
            setUser(user);
            router.push('/');
        } catch (err: any) {
            console.error('Registration error:', err.response?.data || err.message);
            setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setUser(null);
            router.push('/login');
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                error,
                login,
                register,
                logout,
                clearError,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
