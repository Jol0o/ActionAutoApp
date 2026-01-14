import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAuthCookie, setAuthCookie, deleteAuthCookie, AUTH_COOKIE_NAME } from './cookies';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Crucial for refresh token cookies from backend
});

// Request interceptor: Attach access token from cookie to every request
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getAuthCookie();
        if (token && config.headers) {
            // Log for debugging (obfuscated)
            console.log(`[Axios] Request: ${config.method?.toUpperCase()} ${config.url} | Token: ${token.substring(0, 10)}... (Len: ${token.length})`);
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            console.log(`[Axios] Request: ${config.method?.toUpperCase()} ${config.url} | NO Token found in cookies`);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 Unauthorized by trying to refresh the token
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle specific API error format if available
        const apiError = error.response?.data as any;
        const status = error.response?.status;
        const errorMessage = apiError?.message || error.message;

        // Log all errors for debugging
        console.error(`[Axios Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} | Status: ${status} | Message: ${errorMessage}`);

        // If we get a 401 and haven't tried refreshing yet
        if (status === 401 && !originalRequest._retry) {
            console.log(`[Auth] 401 detected. Attempting refresh...`);
            originalRequest._retry = true;

            try {
                // Call the refresh endpoint
                // Note: We use axios directly to avoid interceptor recursion
                const refreshResponse = await axios.post(
                    `${API_URL}/api/auth/refresh`,
                    {},
                    {
                        withCredentials: true,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );

                // Handle nested structures: data.data.tokens.access.token OR data.tokens.access.token
                const resData = refreshResponse.data;
                const newTokens = resData.data || resData;
                const newAccessToken = newTokens.tokens?.access?.token || newTokens.access?.token || resData.accessToken;

                if (!newAccessToken) {
                    console.error('[Auth] Refresh response missing access token:', resData);
                    throw new Error('No access token received during refresh');
                }

                console.log('[Auth] Refresh successful. Retrying original request.');

                // Update the access token cookie
                console.log(`[Auth] Updating cookie: ${AUTH_COOKIE_NAME}`);
                setAuthCookie(newAccessToken);

                // Retry the original request with the new token
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                }
                return apiClient(originalRequest);
            } catch (refreshError: any) {
                const rErr = refreshError.response?.data || refreshError.message;
                const rStatus = refreshError.response?.status;
                console.error(`[Auth] Refresh flow FAILED (${rStatus}). Clearing session. Error:`, rErr);

                // Refresh failed (e.g., refresh token expired or missing)
                deleteAuthCookie();

                // IMPORTANT: If we're already on the login page, don't keep redirecting
                if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                    console.warn('[Auth] Redirecting to login page');
                    // We don't use router.push here because we're outside React
                    // But we want to ensure we don't reload if we're in the middle of a signup/login
                    if (window.location.pathname !== '/signup') {
                        window.location.href = '/login';
                    }
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);
