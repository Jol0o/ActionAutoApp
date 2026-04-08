import { IUser } from "./types";

export interface SystemHealthStats {
    performance: {
        cpu: number;
        memory: number;
        memoryTotal: number;
        uptime: number;
    };
    goldenSignals: {
        traffic: {
            requestsTotal: number;
            requestsPerMinute: number;
        };
        errors: {
            total: number;
            rate: number;
            count4xx: number;
            count5xx: number;
        };
        latency: {
            p50: number;
            p95: number;
            p99: number;
        };
    };
    timestamp: string;
}

export interface AuditLogEntry {
    _id: string;
    entityType: string;
    entityId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'OTHER';
    reason?: string;
    performedBy?: IUser | string | null;
    changes?: Record<string, any>;
    timestamp: string;
}

export interface AuditLogStats {
    date: string;
    breakdown: Record<string, number>;
    total: number;
}

export interface UserActivityEntry {
    _id: string;
    userId: IUser | string;
    organizationId?: string;
    type: string;
    title: string;
    description: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
}

export interface LogBatchResponse {
    statusCode: number;
    data: {
        logs: SystemLogEntry[];
        pagination: any;
    };
    message: string;
    success: boolean;
}

export interface SystemLogEntry {
    _id: string;
    timestamp: string;
    level: string;
    message: string;
    req?: {
        id: string;
        method: string;
        url: string;
        remoteAddress: string;
        userId?: string;
        organizationId?: string;
    };
    res?: {
        statusCode: number;
    };
    err?: any;
    context?: string;
    env: string;
}

export interface LogFilterParams {
    level?: string;
    search?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
    requestId?: string;
    userId?: string;
    organizationId?: string;
}

export interface LogStatsEntry {
    _id: string; // ISO string represented date/hour
    count: number;
    errors: number;
    warnings: number;
}
