import { apiClient } from './api-client';
import { AuthResponse, User, ApiResponse } from './types';
import { setAuthCookie, deleteAuthCookie, getAuthCookie, AUTH_COOKIE_NAME } from './cookies';

export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
}

/**
 * Login user and store access token in cookie
 */
export async function login(data: LoginData): Promise<{ user: User; accessToken: string }> {
    console.log('[AuthAPI] Initiating login request...');
    const response = await apiClient.post<AuthResponse>('/api/auth/login', data);
    const apiResponse = response.data;

    // Debug nested structure
    console.log('[AuthAPI] Login response structure:', JSON.stringify({
        hasData: !!apiResponse.data,
        hasTokens: !!apiResponse.data?.tokens,
        hasAccessToken: !!apiResponse.data?.tokens?.access?.token
    }));

    // Extract token and user from nested data structure
    const accessToken = apiResponse.data?.tokens?.access?.token || (apiResponse as any).accessToken;
    const user = apiResponse.data?.user || (apiResponse as any).user;

    if (!accessToken || !user) {
        throw new Error('Invalid response from server: Access token or user missing');
    }

    setAuthCookie(accessToken);
    return { user, accessToken };
}


/**
 * Register new user
 */
export async function register(data: RegisterData): Promise<{ user: User; accessToken: string }> {
    const response = await apiClient.post<AuthResponse>('/api/auth/register', data);
    const apiResponse = response.data;

    const accessToken = apiResponse.data?.tokens?.access?.token || (apiResponse as any).accessToken;
    const user = apiResponse.data?.user || (apiResponse as any).user;

    if (!accessToken || !user) {
        console.error('[AuthAPI] Failed to extract tokens or user. Response:', JSON.stringify(apiResponse));
        throw new Error('Invalid response from server: Access token or user missing');
    }

    setAuthCookie(accessToken);
    console.log(`[AuthAPI] Session established. Token saved to storage.`);
    return { user, accessToken };
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
    try {
        await apiClient.post('/api/auth/logout');
    } finally {
        deleteAuthCookie();
    }
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<User> {
    const response = await apiClient.get<any>('/api/auth/me');
    // Handle both { data: { user } } and { data: user }
    const userData = response.data.data || response.data.user || response.data;

    if (!userData || typeof userData !== 'object') {
        throw new Error('Invalid user data received from server');
    }

    return userData;
}
