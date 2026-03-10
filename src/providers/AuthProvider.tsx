"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { UserProfile } from '@/types/user';
import { toast } from 'sonner';

// --- TYPES & INTERFACES (Mimicking Clerk) ---

interface AuthContextType {
    user: UserProfile | null;
    accessToken: string | null;
    isLoaded: boolean;
    isSignedIn: boolean;
    organizationId: string | null;
    organizationRole: string | null;
    setAccessToken: (token: string | null) => void;
    setUser: (user: UserProfile | null) => void;
    getToken: () => Promise<string | null>;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
    signUpState: any;
    setSignUpState: (state: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [accessToken, setAccessTokenState] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [signUpState, setSignUpState] = useState<any>({ status: 'missing' });
    const router = useRouter();

    const setAccessToken = useCallback((token: string | null) => {
        if (typeof window !== 'undefined') {
            (window as any).__AUTH_TOKEN__ = token;
        }
        setAccessTokenState(token);
    }, []);

    // 1. Initial Load: Check if we have a valid session (via refresh token cookie)
    const refreshUser = useCallback(async () => {
        try {
            // Attempt silent refresh if we don't have a token in memory
            let currentToken = null;
            if (typeof window !== 'undefined') {
                currentToken = (window as any).__AUTH_TOKEN__;
            }

            if (!currentToken) {
                const tokenRes = await apiClient.post('/api/auth/refresh-tokens');
                currentToken = tokenRes.data?.data?.accessToken || tokenRes.data?.accessToken;
                if (currentToken) {
                    setAccessToken(currentToken);
                } else {
                    throw new Error("No session found");
                }
            }

            const response = await apiClient.get('/api/users/me');
            if (response.data?.success || response.data?.data) {
                const userData = response.data.data || response.data;
                setUser(userData);

                const token = response.data?.data?.accessToken || response.data?.accessToken;
                if (token) {
                    setAccessToken(token);
                }

                // --- UNIVERSAL AUTH GUARD & REDIRECTS ---
                if (typeof window !== 'undefined') {
                    const path = window.location.pathname;
                    const publicRoutes = ['/sign-in', '/sign-up', '/upgrade', '/auth/callback', '/verify-email'];
                    const isPublic = publicRoutes.some(r => path.startsWith(r));

                    // 1. Force Email Verification
                    if (!userData.emailVerified && !isPublic) {
                        console.log('[AuthProvider] Unverified user detected on private route. Redirecting to verify...');
                        router.push(`/verify-email?email=${encodeURIComponent(userData.email)}`);
                        return;
                    }

                    // 2. Prevent Verified/Logged-in users from hitting Auth pages (Sign-in/Sign-up)
                    if (isPublic && (path === '/sign-in' || path === '/sign-up')) {
                        if (userData.role === 'customer') router.push('/customer');
                        else if (userData.role === 'driver') router.push('/driver');
                        else if (userData.role === 'super_admin') router.push('/admin/dashboard');
                        else if (userData.role === 'admin' && !userData.organizationId) router.push('/org-selection');
                        else router.push('/');
                        return;
                    }

                    // 3. Forced Onboarding for Admin
                    if (!isPublic && userData.role === 'admin' && !userData.organizationId && path !== '/org-selection') {
                        console.log('[AuthProvider] Admin without organization detected. Redirecting to setup...');
                        router.push('/org-selection');
                        return;
                    }

                    // 4. Root Path Redirect
                    if (path === '/') {
                        if (userData.role === 'customer') router.push('/customer');
                        else if (userData.role === 'driver') router.push('/driver');
                        else if (userData.role === 'super_admin') router.push('/admin/dashboard');
                        else if (userData.role === 'admin' && !userData.organizationId) router.push('/org-selection');
                    }
                }
            } else {
                setUser(null);
                setAccessToken(null);

                // Force unauthenticated users out of private routes immediately
                if (typeof window !== 'undefined') {
                    const path = window.location.pathname;
                    const publicRoutes = ['/sign-in', '/sign-up', '/upgrade', '/auth/callback', '/verify-email'];
                    if (!publicRoutes.some(r => path.startsWith(r)) && path !== '/') {
                        router.push('/sign-in');
                    } else if (path === '/') {
                        // We also boot from root because '/' is the dealership dashboard
                        router.push('/sign-in');
                    }
                }
            }
        } catch (error) {
            setUser(null);
            setAccessToken(null);

            // Force unauthenticated users out of private routes immediately
            if (typeof window !== 'undefined') {
                const path = window.location.pathname;
                const publicRoutes = ['/sign-in', '/sign-up', '/upgrade', '/auth/callback'];
                if (!publicRoutes.some(r => path.startsWith(r)) && path !== '/') {
                    router.push('/sign-in');
                } else if (path === '/') {
                    // We also boot from root because '/' is the dealership dashboard
                    router.push('/sign-in');
                }
            }
        } finally {
            setIsLoaded(true);
        }
    }, [router]);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    // Removed redundant useEffect because setAccessToken handles this now.

    // 2. Token Management
    const getToken = useCallback(async () => {
        // If we have a token in memory and it's not expired (would need expiry check logic)
        if (accessToken) return accessToken;

        // Otherwise, try to refresh
        try {
            const response = await apiClient.post('/api/auth/refresh-tokens');
            const token = response.data?.data?.accessToken || response.data?.accessToken;
            if (token) {
                setAccessToken(token);
                return token;
            }
        } catch (e) {
            console.warn('[AuthProvider] Failed to refresh token');
        }
        return null;
    }, [accessToken]);

    // 3. Sign Out
    const signOut = useCallback(async () => {
        try {
            await apiClient.post('/api/auth/logout');
        } catch (e) {
            console.error('[AuthProvider] Logout failed:', e);
        } finally {
            setUser(null);
            setAccessToken(null);
            router.push('/sign-in');
            router.refresh();
        }
    }, [router]);

    const value = useMemo(() => ({
        user,
        accessToken,
        isLoaded,
        isSignedIn: !!user,
        organizationId: user?.organizationId || null,
        organizationRole: user?.organizationRole || null,
        setAccessToken,
        setUser,
        getToken,
        signOut,
        refreshUser,
        signUpState,
        setSignUpState
    }), [user, accessToken, isLoaded, getToken, signOut, refreshUser, signUpState, setSignUpState]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// --- SHADOW HOOKS (Compatibility Layer) ---

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');

    return {
        isLoaded: context.isLoaded,
        isSignedIn: context.isSignedIn,
        userId: context.user?._id || context.user?.clerkId || null,
        orgId: context.organizationId,
        orgRole: context.organizationRole,
        getToken: context.getToken,
        signOut: context.signOut
    };
}

export function useUser() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useUser must be used within an AuthProvider');

    // Mimic Clerk's User object structure
    const userProxy = context.user ? {
        id: context.user._id || context.user.clerkId,
        primaryEmailAddress: { emailAddress: context.user.email },
        fullName: context.user.name,
        firstName: context.user.firstName || context.user.name?.split(' ')[0] || '',
        lastName: context.user.lastName || context.user.name?.split(' ').slice(1).join(' ') || '',
        imageUrl: context.user.avatar || context.user.avatarUrl || '/placeholder-avatar.png',
        role: context.user.role,
        publicMetadata: {},
        unsafeMetadata: {},
        update: async (data: any) => {
            const res = await apiClient.patch('/api/users/me', data);
            context.refreshUser();
            return res.data;
        }
    } : null;

    return {
        isLoaded: context.isLoaded,
        isSignedIn: context.isSignedIn,
        user: userProxy
    };
}

export function useClerk() {
    const context = useContext(AuthContext);
    const router = useRouter();
    if (!context) throw new Error('useClerk must be used within an AuthProvider');

    return {
        signOut: context.signOut,
        openUserProfile: () => router.push('/profile'),
        user: context.user
    };
}

/**
 * useSignUp - Shadow hook for multi-step registration (used in DriverAuthForm)
 */
export function useSignUp() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useSignUp must be used within an AuthProvider");

    const { signUpState, setSignUpState } = context;

    const signUp = {
        create: async (data: any) => {
            try {
                const response = await apiClient.post('/api/auth/register', {
                    email: data.emailAddress,
                    password: data.password,
                    name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.emailAddress.split('@')[0],
                    role: data.role || 'customer'
                });

                const token = response.data?.data?.accessToken || response.data?.accessToken;
                const userObj = response.data?.data?.user || response.data?.user;

                if (token) {
                    context?.setAccessToken(token);
                    context?.setUser(userObj);
                    return { status: 'complete', createdSessionId: 'local_session', targetUrl: userObj?.role === 'driver' ? '/driver' : '/' };
                }

                setSignUpState({
                    emailAddress: data.emailAddress,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    status: 'needs_verification'
                });
                return { status: 'needs_verification' };
            } catch (e: any) {
                throw { errors: [{ longMessage: e.response?.data?.message || 'Registration failed' }] };
            }
        },
        createDealership: async (data: any) => {
            try {
                const response = await apiClient.post('/api/auth/register-dealership', {
                    name: data.name,
                    email: data.email,
                    password: data.password,
                    dealershipName: data.dealershipName,
                    dealershipSlug: data.dealershipSlug
                });

                const userObj = response.data?.data?.user || response.data?.user;

                setSignUpState({
                    emailAddress: data.email,
                    firstName: data.name,
                    status: 'needs_verification'
                });

                return { status: 'needs_verification' };
            } catch (e: any) {
                throw { errors: [{ longMessage: e.response?.data?.message || 'Dealership registration failed' }] };
            }
        },
        prepareEmailAddressVerification: async (params: any) => {
            try {
                const emailToVerify = params?.email || signUpState.emailAddress;
                await apiClient.post('/api/auth/resend-otp', { email: emailToVerify });
                return { status: 'pending' };
            } catch (e: any) {
                throw { errors: [{ longMessage: e.response?.data?.message || 'Failed to resend verification code' }] };
            }
        },
        attemptEmailAddressVerification: async (params: any) => {
            try {
                // Use provided email or fallback to state
                console.log('[AuthProvider] attemptEmailAddressVerification called with:', params);
                const emailToVerify = params.email || signUpState.emailAddress;
                console.log('[AuthProvider] Computed emailToVerify:', emailToVerify);

                const response = await apiClient.post('/api/auth/verify-email', {
                    email: emailToVerify,
                    otp: params.code
                });

                const token = response.data?.data?.accessToken || response.data?.accessToken;
                const userObj = response.data?.data?.user || response.data?.user;

                if (token) {
                    context?.setAccessToken(token);
                    context?.setUser(userObj);
                    return { status: 'complete', createdSessionId: 'local_session' };
                }
                return { status: 'failed' };
            } catch (e: any) {
                throw { errors: [{ longMessage: e.response?.data?.message || 'Verification failed' }] };
            }
        },
    };

    return {
        isLoaded: true,
        signUp,
        signUpState,
        setActive: async (params: any) => {
            // In our case, setActive is handled by setAccessToken and setUser in context
            // This is just to satisfy the API
            return;
        }
    };
}

/**
 * useSignIn - Shadow hook for standard login
 */
export function useSignIn() {
    const context = useContext(AuthContext);
    const router = useRouter();

    const signIn = {
        create: async (data: any) => {
            try {
                const response = await apiClient.post('/api/auth/login', {
                    email: data.identifier,
                    password: data.password
                });

                const token = response.data?.data?.accessToken || response.data?.accessToken;
                const userObj = response.data?.data?.user || response.data?.user;

                if (token) {
                    context?.setAccessToken(token);
                    context?.setUser(userObj);

                    let targetUrl = '/';
                    if (userObj?.role === 'customer') targetUrl = '/customer';
                    else if (userObj?.role === 'driver') targetUrl = '/driver';
                    else if (userObj?.role === 'super_admin') targetUrl = '/admin/dashboard';

                    return { status: 'complete', createdSessionId: 'local_session', targetUrl };
                }
                return { status: 'needs_upgrade', factor: 'password' };
            } catch (e: any) {
                if (e.response?.data?.message === 'LEGACY_USER_UPGRADE_REQUIRED') {
                    return { status: 'needs_upgrade', factor: 'otp' };
                }
                throw { errors: [{ longMessage: e.response?.data?.message || 'Login failed' }] };
            }
        }
    };

    return {
        isLoaded: true,
        signIn,
        setActive: async () => { }
    };
}
