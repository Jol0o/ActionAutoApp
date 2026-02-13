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
        });

        // Add response interceptor for better error logging
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                console.error('[apiClient] Response error:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    message: error.message,
                    url: error.config?.url,
                });
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
}

export const apiClient = new ApiClient();