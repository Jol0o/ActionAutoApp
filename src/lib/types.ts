export type UserRole = 'Admin' | 'Manager' | 'Viewer';

export interface User {
    id: string;
    _id?: string; // Some backends use _id
    email: string;
    name: string;
    role: UserRole;
    avatar?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    statusCode: number;
    message: string;
    data: T;
}

export interface AuthTokens {
    access: {
        token: string;
        expires: string;
    };
    refresh: {
        token: string;
        expires: string;
    };
}

export interface AuthData {
    user: User;
    tokens: AuthTokens;
}

export type AuthResponse = ApiResponse<AuthData>;

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}
