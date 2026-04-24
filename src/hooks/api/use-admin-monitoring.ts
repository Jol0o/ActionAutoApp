import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { 
    adminService, 
    AuditLogParams, 
    ActivityParams 
} from '@/lib/api/admin.service';
import { LogFilterParams } from '@/lib/types/monitoring';

export function useSystemHealth(pollInterval = 10000) {
    const { isLoaded, isSignedIn } = useAuth();

    return useQuery({
        queryKey: ['admin-system-health'],
        queryFn: () => adminService.getProcessStats(),
        enabled: !!isLoaded && !!isSignedIn,
        refetchInterval: pollInterval,
        staleTime: pollInterval / 2,
    });
}

export function useAuditExplorer(params: AuditLogParams) {
    const { isLoaded, isSignedIn } = useAuth();

    return useQuery({
        queryKey: ['admin-audit-logs', params],
        queryFn: () => adminService.getAuditLogs(params),
        enabled: !!isLoaded && !!isSignedIn,
        staleTime: 60000, // Audit logs are relatively static
    });
}

export function useAuditStats() {
    const { isLoaded, isSignedIn } = useAuth();

    return useQuery({
        queryKey: ['admin-audit-stats'],
        queryFn: () => adminService.getAuditStats(),
        enabled: !!isLoaded && !!isSignedIn,
        staleTime: 300000, // Every 5 mins
    });
}

export function useActivityFeed(params: ActivityParams) {
    const { isLoaded, isSignedIn } = useAuth();

    return useQuery({
        queryKey: ['admin-activity-feed', params],
        queryFn: () => adminService.getGlobalActivity(params),
        enabled: !!isLoaded && !!isSignedIn,
        refetchInterval: 30000,
    });
}

export function useSystemLogs(params: LogFilterParams, isPaused = false) {
    const { isLoaded, isSignedIn } = useAuth();
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['admin-system-logs', params],
        queryFn: () => adminService.getSystemLogs(params),
        enabled: !!isLoaded && !!isSignedIn && !isPaused,
        refetchInterval: isPaused ? undefined : 5000, 
    });

    const clearMutation = useMutation({
        mutationFn: () => adminService.clearSystemLogs(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-system-logs'] });
            queryClient.invalidateQueries({ queryKey: ['admin-log-stats'] });
        },
    });

    return {
        ...query,
        clearLogs: clearMutation.mutate,
        isClearing: clearMutation.isPending,
    };
}

export function useLogStats(params?: { from?: string; to?: string; interval?: string }) {
    const { isLoaded, isSignedIn } = useAuth();

    return useQuery({
        queryKey: ['admin-log-stats', params],
        queryFn: () => adminService.getLogStats(params),
        enabled: !!isLoaded && !!isSignedIn,
        refetchInterval: 15000, // Update frequency for the bar chart
    });
}
