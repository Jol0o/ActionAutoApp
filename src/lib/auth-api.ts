import { apiClient } from './api-client';
import { AuthResponse, User } from './types';
import { setAuthCookie, deleteAuthCookie } from './cookies';

export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
}

export interface ForgotPasswordData {
    email: string;
}

export interface ResetPasswordData {
    token: string;
    password: string;
}


/**
 * Login user and store access token in cookie
 */
export async function login(data: LoginData): Promise<{ user: User; accessToken: string }> {
    console.log('[AuthAPI] Initiating login request...');
    const response = await apiClient.post<AuthResponse | { accessToken: string, user: User }>('/api/auth/login', data);
    const apiResponse = response.data;

    // Extract token and user from nested data structure
    const accessToken = 'data' in apiResponse ? apiResponse.data?.tokens?.access?.token : apiResponse.accessToken;
    const user = 'data' in apiResponse ? apiResponse.data?.user : apiResponse.user;

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
    const response = await apiClient.post<AuthResponse | { accessToken: string, user: User }>('/api/auth/register', data);
    const apiResponse = response.data;

    const accessToken = 'data' in apiResponse ? apiResponse.data?.tokens?.access?.token : apiResponse.accessToken;
    const user = 'data' in apiResponse ? apiResponse.data?.user : apiResponse.user;

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
    const response = await apiClient.get<unknown>('/api/auth/me');
    const data = response.data as { data?: User | { user: User }, user?: User };
    // Handle both { data: { user } } and { data: user }
    const userData = data.data ? (('user' in data.data) ? data.data.user : data.data) : data.user || data;

    if (!userData || typeof userData !== 'object') {
        throw new Error('Invalid user data received from server');
    }

    return userData as User;
}

/**
 * Request password reset link
 */
export async function forgotPassword(data: ForgotPasswordData): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/api/auth/forgot-password', data);
    return response.data;
}

/**
 * Reset password with token
 */
export async function resetPassword(data: ResetPasswordData): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/api/auth/reset-password', data);
    return response.data;
}