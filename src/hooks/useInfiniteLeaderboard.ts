import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { apiClient } from '@/lib/api-client';
import { useCallback } from 'react';

export interface LeaderboardUser {
    id: string;
    name: string;
    role: string;
    calls: number;
    convs: number;
    appts: number;
    shipments: number;
    avatar: string;
    rank?: number;
}

export function useInfiniteLeaderboard(limit: number = 10) {
    const { isLoaded, isSignedIn, getToken } = useAuth();

    const getAuthHeaders = useCallback(async () => {
        const token = await getToken();
        return {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
    }, [getToken]);

    return useInfiniteQuery({
        queryKey: ['dashboard-leaderboard', limit],
        queryFn: async ({ pageParam = 0 }) => {
            const headers = await getAuthHeaders();
            const response = await apiClient.getLeaderboard({ page: pageParam as number, limit }, headers);
            return response.data?.data || response.data;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            // If the last page had fewer items than the limit, we've reached the end
            if (lastPage.length < limit) return undefined;
            return allPages.length; // Next page index
        },
        enabled: !!isLoaded && !!isSignedIn,
        staleTime: 60000, // 1 minute
    });
}
