import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWalletDashboard, linkReferral, requestWithdrawal } from '../../lib/api/wallet';
import { useAlert } from '@/components/AlertDialog';

export const WALLET_QUERY_KEY = ['wallet'];

export const useWalletDashboard = () => {
    return useQuery({
        queryKey: WALLET_QUERY_KEY,
        queryFn: getWalletDashboard,
        staleTime: 1000 * 60 * 5, // Cache for 5 mins
    });
};

export const useLinkReferral = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: linkReferral,
        onSuccess: () => {
            // Invalidate the wallet dashboard so numbers update immediately if needed
            queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEY });
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to link referral code';
            console.error('[useWallet]', message);
            // We usually wouldn't toast here directly if it happens automatically on login, 
            // but we log it for debugging
        }
    });
};

export const useRequestWithdrawal = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: requestWithdrawal,
        onSuccess: () => {
            toast.success('Withdrawal request submitted for review!');
            queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEY });
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to request withdrawal. Try again.';
            toast.error(message);
        }
    });
};
