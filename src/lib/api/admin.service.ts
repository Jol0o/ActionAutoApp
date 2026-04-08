import { apiClient } from "../api-client";
import { 
    SystemHealthStats, 
    AuditLogEntry, 
    AuditLogStats, 
    UserActivityEntry,
    LogBatchResponse,
    LogFilterParams,
    LogStatsEntry,
    SystemLogEntry
} from "../types/monitoring";

export interface AuditLogParams {
    page?: number;
    limit?: number;
    entityType?: string;
    action?: string;
    userId?: string;
    search?: string;
}

export interface ActivityParams {
    page?: number;
    limit?: number;
    type?: string;
}

class AdminService {
    // ── System Health ──────────────────────────────────────────────────────────
    async getProcessStats(): Promise<SystemHealthStats> {
        const response = await apiClient.get<{ data: SystemHealthStats }>('/api/admin/system/stats');
        return response.data?.data;
    }

    // ── Audit Logs ───────────────────────────────────────────────────────────
    async getAuditLogs(params: AuditLogParams): Promise<{ logs: AuditLogEntry[]; pagination: any }> {
        const response = await apiClient.get<{ data: { logs: AuditLogEntry[]; pagination: any } }>('/api/admin/audit-logs', { params });
        return response.data?.data;
    }

    async getAuditStats(): Promise<AuditLogStats[]> {
        const response = await apiClient.get<{ data: AuditLogStats[] }>('/api/admin/audit-logs/stats');
        return response.data?.data;
    }

    // ── User Activity ─────────────────────────────────────────────────────────
    async getGlobalActivity(params: ActivityParams): Promise<UserActivityEntry[]> {
        const response = await apiClient.get<{ data: UserActivityEntry[] }>('/api/activity/organization', { params });
        return response.data?.data;
    }

    // ── System Logs ───────────────────────────────────────────────────────────
    async getSystemLogs(params: LogFilterParams): Promise<{ logs: SystemLogEntry[]; pagination: any }> {
        const response = await apiClient.get<LogBatchResponse>('/api/admin/system/logs', { params });
        return response.data?.data;
    }

    async getLogStats(params?: { from?: string; to?: string; interval?: string }): Promise<LogStatsEntry[]> {
        const response = await apiClient.get<{ data: LogStatsEntry[] }>('/api/admin/system/logs/stats', { params });
        return response.data?.data;
    }

    async clearSystemLogs(): Promise<void> {
        await apiClient.post('/api/admin/system/logs/clear');
    }
}

export const adminService = new AdminService();
