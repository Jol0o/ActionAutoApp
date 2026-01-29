'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { User } from '@/lib/types';
import * as authApi from '@/lib/auth-api';
import { getAuthCookie, deleteAuthCookie } from '@/lib/cookies';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    message: string | null;
    login: (data: authApi.LoginData) => Promise<void>;
    register: (data: authApi.RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
    clearMessage: () => void;
    forgotPassword: (data: authApi.ForgotPasswordData) => Promise<void>;
    resetPassword: (data: authApi.ResetPasswordData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    const clearError = useCallback(() => setError(null), []);
    const clearMessage = useCallback(() => setMessage(null), []);

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
        } catch (err: unknown) {
            // If unauthorized, clear invalid session
            if (axios.isAxiosError(err) && err.response?.status === 401) {
                console.error('[AuthContext] Profile fetch failed:', err.response?.data?.message || err.message);
                console.warn('[AuthContext] 401 from backend. Token likely invalid.');
                deleteAuthCookie();
                setUser(null);

                // Only redirect if not already on public pages
                const isPublic = pathname === '/login' || pathname === '/signup' || pathname === '/inventory-public' || pathname === '/reset-password' || pathname === '/forgot-password';
                if (!isPublic) router.push('/login');
            } else {
                console.error('[AuthContext] Profile fetch failed:', err);
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
        } catch (err: unknown) {
            let message = 'Login failed. Please check your credentials.';
            if (axios.isAxiosError(err) && err.response?.data?.message) {
                message = err.response.data.message;
            } else if (err instanceof Error) {
                message = err.message;
            }
            console.error('Login error:', message);
            setError(message);
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
        } catch (err: unknown) {
            let message = 'Registration failed. Please try again.';
            if (axios.isAxiosError(err) && err.response?.data?.message) {
                message = err.response.data.message;
            } else if (err instanceof Error) {
                message = err.message;
            }
            console.error('Registration error:', message);
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const forgotPassword = async (data: authApi.ForgotPasswordData) => {
        setIsLoading(true);
        setError(null);
        setMessage(null);
        try {
            const response = await authApi.forgotPassword(data);
            setMessage(response.message);
        } catch (err: unknown) {
            let message = 'Failed to send reset link.';
            if (axios.isAxiosError(err) && err.response?.data?.message) {
                message = err.response.data.message;
            } else if (err instanceof Error) {
                message = err.message;
            }
            console.error('Forgot password error:', message);
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const resetPassword = async (data: authApi.ResetPasswordData) => {
        setIsLoading(true);
        setError(null);
        setMessage(null);
        try {
            const response = await authApi.resetPassword(data);
            setMessage(response.message);
            // On successful password reset, redirect to login after a short delay
            // to allow the user to see the success message.
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err: unknown) {
            let message = 'Failed to reset password. The token may be invalid or expired.';
            if (axios.isAxiosError(err) && err.response?.data?.message) {
                message = err.response.data.message;
            } else if (err instanceof Error) {
                message = err.message;
            }
            console.error('Reset password error:', message);
            setError(message);
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
                message,
                login,
                register,
                logout,
                clearError,
                clearMessage,
                forgotPassword,
                resetPassword,
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
