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
            async (config) => {
                const fullUrl = `${config.baseURL}${config.url}`;
                console.log(`[apiClient] ${config.method?.toUpperCase()} ${fullUrl}`);

                // --- AUTHENTICATION INJECTION START ---
                try {
                    if (typeof window !== 'undefined' && (window as any).Clerk?.session) {
                        const token = await (window as any).Clerk.session.getToken();
                        if (token) {
                            config.headers.Authorization = `Bearer ${token}`;
                        }
                    }
                } catch (err) {
                    console.error('[apiClient] Error fetching Clerk Token:', err);
                }
                // --- AUTHENTICATION INJECTION END ---

                // --- IMPERSONATION INJECTION START ---
                if (typeof window !== 'undefined') {
                    const impersonatedOrgId = localStorage.getItem('admin_impersonate_org_id');
                    if (impersonatedOrgId) {
                        config.headers['x-impersonate-org-id'] = impersonatedOrgId;
                        console.log('[apiClient] 🕵️ Impersonating Org:', impersonatedOrgId);
                    }
                }
                // --- IMPERSONATION INJECTION END ---

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
                // --- SUSPENSION HANDLING START ---
                if (error.response && error.response.status === 403) {
                    const msg = error.response.data?.message || '';
                    if (msg.includes('Suspended')) {
                        if (typeof window !== 'undefined') {
                            window.location.href = '/suspended';
                        }
                    }
                }
                // --- SUSPENSION HANDLING END ---

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

    // Organization Methods
    async createOrganization(data: { name: string; slug: string }, config?: AxiosRequestConfig) {
        return this.post('/api/organizations', data, config);
    }

    async getOrganization(id: string, config?: AxiosRequestConfig) {
        return this.get(`/api/organizations/${id}`, config);
    }

    async updateOrganization(id: string, data: any, config?: AxiosRequestConfig) {
        return this.patch(`/api/organizations/${id}`, data, config);
    }

    async getUserOrganizations(config?: AxiosRequestConfig) {
        return this.get('/api/users/me/organizations', config);
    }

    async selectOrganization(organizationId: string, config?: AxiosRequestConfig) {
        return this.post('/api/users/me/select-org', { organizationId }, config);
    }

    async getMembers(id: string, config?: AxiosRequestConfig) {
        return this.get(`/api/organizations/${id}/members`, config);
    }

    async removeMember(orgId: string, userId: string, config?: AxiosRequestConfig) {
        return this.delete(`/api/organizations/${orgId}/members/${userId}`, config);
    }

    // Invitation Methods
    async sendInvite(data: { email: string; role: string }, config?: AxiosRequestConfig) {
        return this.post('/api/invitations', data, config);
    }

    async validateInvite(token: string, config?: AxiosRequestConfig) {
        return this.get(`/api/invitations/validate/${token}`, config);
    }

    async acceptInvite(token: string, config?: AxiosRequestConfig) {
        return this.post('/api/invitations/accept', { token }, config);
    }

    // Driver Request Methods
    async createDriverRequest(data?: Record<string, unknown>, config?: AxiosRequestConfig) {
        return this.post('/api/driver-requests', data, config);
    }

    async getDriverRequestStatus(config?: AxiosRequestConfig) {
        return this.get('/api/driver-requests/my-status', config);
    }

    async getDriverRequests(params?: { status?: string }, config?: AxiosRequestConfig) {
        return this.get('/api/driver-requests', { ...config, params });
    }

    async approveDriverRequest(id: string, config?: AxiosRequestConfig) {
        return this.patch(`/api/driver-requests/${id}/approve`, {}, config);
    }

    async rejectDriverRequest(id: string, config?: AxiosRequestConfig) {
        return this.patch(`/api/driver-requests/${id}/reject`, {}, config);
    }
}

export const apiClient = new ApiClient();