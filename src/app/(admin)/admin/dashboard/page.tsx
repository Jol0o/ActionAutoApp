'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from "@/providers/AuthProvider";
import { apiClient } from '@/lib/api-client';
import { Loader2 } from 'lucide-react';
import { MonitoringShell } from '@/components/admin/monitoring/MonitoringShell';
import { BroadcastPushCard } from '@/components/admin/dashboard/BroadcastPushCard';

interface SystemStats {
    organizations: number;
    users: number;
}

interface FinancialStats {
    mrr: number;
    totalRevenue: number;
    activeSubscriptions: number;
}

interface ApiResponse<T> {
    statusCode: number;
    data: T;
    message: string;
    success: boolean;
}

export default function AdminDashboardPage() {
    const { getToken } = useAuth();

    // 1. Fetch System Stats
    const { data: systemStats, isLoading: statsLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const token = await getToken();
            const res = await apiClient.get<ApiResponse<SystemStats>>('/api/admin/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data?.data;
        }
    });

    // 2. Fetch Financials
    const { data: financials, isLoading: financeLoading } = useQuery({
        queryKey: ['admin-financials'],
        queryFn: async () => {
            const token = await getToken();
            const res = await apiClient.get<ApiResponse<FinancialStats>>('/api/admin/financials', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data?.data;
        }
    });

    const isLoading = statsLoading || financeLoading;

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse">Initializing Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <MonitoringShell
            initialData={{ systemStats, financials }}
        />
    );
}
