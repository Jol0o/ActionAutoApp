import { apiClient } from '../api-client';

export interface Transaction {
    _id: string;
    type: 'deposit' | 'withdrawal' | 'adjustment';
    status: 'pending' | 'completed' | 'rejected';
    amount: number;
    note: string;
    createdAt: string;
    withdrawalMethod?: {
        type: string;
        details?: string;
    };
}

export interface WalletDashboardData {
    walletBalance: number;
    totalEarned: number;
    referralCode: string;
    pendingLeads: number;
    recentTransactions: Transaction[];
}

export const getWalletDashboard = async () => {
    const response = await apiClient.get<{ success: boolean; data: WalletDashboardData }>('/api/customer/wallet');
    return response.data.data;
};

export const linkReferral = async (referralCode: string) => {
    const response = await apiClient.post<{ success: boolean; data: any }>('/api/customer/wallet/link-referral', { referralCode });
    return response.data;
};

export const requestWithdrawal = async (data: { amount: number; methodType: string; methodDetails: string }) => {
    const response = await apiClient.post<{ success: boolean; data: any }>('/api/customer/wallet/withdraw', data);
    return response.data;
};
