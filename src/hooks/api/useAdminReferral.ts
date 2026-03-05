import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getPendingWithdrawals,
    getWithdrawalAudit,
    approveWithdrawal,
    rejectWithdrawal
} from '../../lib/api/admin-referral';
import { toast } from 'sonner';

export const ADMIN_WITHDRAWALS_KEY = ['admin', 'withdrawals'];
export const WITHDRAWAL_AUDIT_KEY = (id: string) => ['admin', 'withdrawal', id, 'audit'];

export const useAdminPendingWithdrawals = () => {
    return useQuery({
        queryKey: ADMIN_WITHDRAWALS_KEY,
        queryFn: getPendingWithdrawals,
    });
};

export const useWithdrawalAudit = (transactionId: string, enabled: boolean) => {
    return useQuery({
        queryKey: WITHDRAWAL_AUDIT_KEY(transactionId),
        queryFn: () => getWithdrawalAudit(transactionId),
        enabled: enabled && !!transactionId,
    });
};

export const useApproveWithdrawal = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: approveWithdrawal,
        onSuccess: () => {
            toast.success('Withdrawal approved successfully');
            queryClient.invalidateQueries({ queryKey: ADMIN_WITHDRAWALS_KEY });
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to approve withdrawal';
            toast.error(message);
        }
    });
};

export const useRejectWithdrawal = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, reason }: { id: string, reason: string }) => rejectWithdrawal(id, reason),
        onSuccess: () => {
            toast.success('Withdrawal rejected');
            queryClient.invalidateQueries({ queryKey: ADMIN_WITHDRAWALS_KEY });
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to reject withdrawal';
            toast.error(message);
        }
    });
};
