import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class ApiClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_URL,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000,
            withCredentials: true,
        });

        // ── Request interceptor ──────────────────────────────────────────────
        this.client.interceptors.request.use(
            async (config) => {
                const fullUrl = `${config.baseURL}${config.url}`;

                // Auto-inject native auth token if not already set
                if (typeof window !== 'undefined' && !config.headers.Authorization) {
                    try {
                        const token = (window as any).__AUTH_TOKEN__;
                        if (token) {
                            config.headers.Authorization = `Bearer ${token}`;
                        }
                    } catch (e) {
                        // Ignore
                    }
                }

                // Inject impersonation header if present
                if (typeof window !== 'undefined') {
                    const impersonatedOrgId = localStorage.getItem('admin_impersonate_org_id');
                    if (impersonatedOrgId) {
                        config.headers['x-impersonate-org-id'] = impersonatedOrgId;
                    }
                }

                return config;
            },
            (error) => {
                console.error('[apiClient] Request setup failed:', error);
                return Promise.reject(error);
            }
        );

        // ── Response interceptor ─────────────────────────────────────────────
        this.client.interceptors.response.use(
            (response) => {
                return response;
            },
            (error) => {
                // ── Silently ignore intentional request cancellations ─────────
                // When React Query cancels a stale fetch via AbortSignal, axios
                // throws a "canceled" / ERR_CANCELED error. This is expected
                // behaviour — not a real failure — so we suppress logging and
                // just forward the rejection so React Query can handle it cleanly.
                if (
                    axios.isCancel(error) ||
                    error?.code === 'ERR_CANCELED' ||
                    error?.message === 'canceled'
                ) {
                    return Promise.reject(error);
                }

                // Handle org suspension redirect
                if (error.response?.status === 403) {
                    const msg = error.response.data?.message || '';
                    if (msg.includes('Suspended') && typeof window !== 'undefined') {
                        window.location.href = '/suspended';
                    }
                }

                if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
                    const attemptedUrl = `${error.config?.baseURL}${error.config?.url}`;
                    console.error('[apiClient] NETWORK ERROR');
                    console.error('   Attempted URL:', attemptedUrl);
                    console.error('   This means: Cannot reach backend server');
                    console.error('   Check: Is backend running on http://localhost:5000?');
                } else if (error.response) {
                    console.error(
                        `[apiClient] Server responded with ${error.response.status}:`,
                        error.response.data
                    );
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

    // Extended timeout (120s) for long-running operations like Gmail sync.
    // Uses a one-off axios instance so the global 30s default is not affected.
    async syncPost<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        const syncClient = axios.create({
            baseURL: this.client.defaults.baseURL,
            headers: {
                'Content-Type': 'application/json',
                ...(config?.headers || {}),
            },
            timeout: 120000,
            withCredentials: true,
        });
        return syncClient.post<T>(url, data, config);
    }

    // ── Organization Methods ─────────────────────────────────────────────────
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

    // ── Invitation Methods ───────────────────────────────────────────────────
    async sendInvite(data: { email: string; role: string }, config?: AxiosRequestConfig) {
        return this.post('/api/invitations', data, config);
    }

    async validateInvite(token: string, config?: AxiosRequestConfig) {
        return this.get(`/api/invitations/validate/${token}`, config);
    }

    async acceptInvite(token: string, config?: AxiosRequestConfig) {
        return this.post('/api/invitations/accept', { token }, config);
    }

    // ── Driver Request Methods ───────────────────────────────────────────────
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

    // ── Auth Methods ─────────────────────────────────────────────────────────
    // ── Dashboard Methods ────────────────────────────────────────────────────
    async getDashboardMetrics(params: { period?: string; month?: string }, config?: AxiosRequestConfig) {
        return this.get('/api/dashboard/metrics', { ...config, params });
    }

    async completeOnboarding(role: string, config?: AxiosRequestConfig) {
        return this.post('/api/auth/complete-onboarding', { role }, config);
    }

    async broadcastPush(data: { roleTarget?: string, userIds?: string[], title: string, body: string, url?: string, image?: string, icon?: string }, config?: AxiosRequestConfig) {
        return this.post('/api/push/broadcast', data, config);
    }
}

export const apiClient = new ApiClient();
