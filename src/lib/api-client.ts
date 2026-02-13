import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://xj3pd14h-5000.asse.devtunnels.ms';

// This will log when the module loads
console.log('[apiClient] Initialized with baseURL:', API_URL);

class ApiClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_URL,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000,
            withCredentials: true, // Important for CORS with credentials
        });

        this.client.interceptors.request.use(
            (config) => {
                const fullUrl = `${config.baseURL}${config.url}`;
                console.log(`[apiClient] ${config.method?.toUpperCase()} ${fullUrl}`);
                return config;
            },
            (error) => {
                console.error('[apiClient] Request setup failed:', error);
                return Promise.reject(error);
            }
        );

        this.client.interceptors.response.use(
            (response) => {
                console.log(`[apiClient] Response ${response.status} from ${response.config.url}`);
                return response;
            },
            (error) => {
                if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
                    const attemptedUrl = `${error.config?.baseURL}${error.config?.url}`;
                    console.error('[apiClient] NETWORK ERROR');
                    console.error('   Attempted URL:', attemptedUrl);
                    console.error('   This means: Cannot reach backend server');
                    console.error('   Check: Is backend running on http://localhost:5000?');
                } else if (error.response) {
                    console.error(`[apiClient] Server responded with ${error.response.status}:`, error.response.data);
                } else {
                    console.error('[apiClient] Error:', error.message);
                }
                return Promise.reject(error);
            }
        );
    }

    async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.client.get<T>(url, config);
    }

    async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.client.post<T>(url, data, config);
    }

    async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.client.patch<T>(url, data, config);
    }

    async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.client.delete<T>(url, config);
    }

    async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return this.client.put<T>(url, data, config);
    }
}

export const apiClient = new ApiClient();