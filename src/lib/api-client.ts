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
            config.headers.Authorization = `Bearer ${token}`;
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

        // Only log errors that aren't expected auth failures
        const isAuthEndpoint = originalRequest.url?.includes('/api/auth/');
        const isExpectedAuthError = status === 401 && isAuthEndpoint;

        if (!isExpectedAuthError) {
            console.error(`[Axios Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} | Status: ${status} | Message: ${errorMessage}`);
        }

        // If we get a 401 and haven't tried refreshing yet
        // ALSO: Skip refresh if the failed request was specifically the login call
        const isLoginRequest = originalRequest.url?.includes('/api/auth/login');
        const isMeRequest = originalRequest.url?.includes('/api/auth/me');

        if (status === 401 && !originalRequest._retry && !isLoginRequest && !isMeRequest) {
            console.log(`[Auth] 401 detected. Attempting refresh...`);
            originalRequest._retry = true;

            try {
                // Call the refresh endpoint
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
                setAuthCookie(newAccessToken);

                // Retry the original request with the new token
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                }
                return apiClient(originalRequest);
            } catch (refreshError: any) {
                const rStatus = refreshError.response?.status;
                
                // Only log if it's not a 401 (which is expected when refresh token expires)
                if (rStatus !== 401) {
                    const rErr = refreshError.response?.data || refreshError.message;
                    console.error(`[Auth] Refresh flow FAILED (${rStatus}). Error:`, rErr);
                } else {
                    console.log('[Auth] Refresh token expired. User needs to log in again.');
                }

                // Refresh failed (e.g., refresh token expired or missing)
                deleteAuthCookie();

                // IMPORTANT: If we're already on the login page, don't keep redirecting
                if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                    // We don't use router.push here because we're outside React
                    // But we want to ensure we don't reload if we're in the middle of a signup/login
                    const publicPaths = ['/signup', '/reset-password', '/forgot-password', '/inventory-public'];
                    if (!publicPaths.includes(window.location.pathname)) {
                        console.log('[Auth] Redirecting to login page');
                        window.location.href = '/login';
                    }
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);