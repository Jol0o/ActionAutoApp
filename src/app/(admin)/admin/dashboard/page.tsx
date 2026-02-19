'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, Users, Building2, Activity, ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ActivityGraph } from '@/components/admin/dashboard/ActivityGraph';
import { RecentActivity } from '@/components/admin/dashboard/RecentActivity';

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
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Mock data for chart
    const revenueData = [
        { name: 'Jan', revenue: financials?.mrr || 4500 },
        { name: 'Feb', revenue: (financials?.mrr || 4500) * 1.1 },
        { name: 'Mar', revenue: (financials?.mrr || 4500) * 1.05 },
        { name: 'Apr', revenue: (financials?.mrr || 4500) * 1.25 },
        { name: 'May', revenue: (financials?.mrr || 4500) * 1.2 },
        { name: 'Jun', revenue: (financials?.mrr || 4500) * 1.4 },
    ];

    return (
        <div className="space-y-6 container mx-auto">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
                    <p className="text-muted-foreground">
                        Real-time insights into platform performance.
                    </p>
                </div>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${financials?.mrr?.toLocaleString() || '0'}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                            <span className="text-green-500 font-medium">+20.1%</span>
                            <span className="ml-1">from last month</span>
                        </p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{financials?.activeSubscriptions || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Across all pricing tiers
                        </p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{systemStats?.organizations || 0}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                            <span className="text-green-500 font-medium">+12%</span>
                            <span className="ml-1">new this month</span>
                        </p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{systemStats?.users || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Active platform users
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts & Activity Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 shadow-sm">
                    <CardHeader>
                        <CardTitle>Revenue Overview</CardTitle>
                        <CardDescription>
                            Monthly Recurring Revenue (MRR) growth over the last 6 months.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `$${value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--background)',
                                            borderColor: 'var(--border)',
                                            borderRadius: '8px',
                                        }}
                                        itemStyle={{ color: 'var(--foreground)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="var(--primary)"
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-4 md:col-span-3 shadow-sm">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest system events and signups.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            <RecentActivity />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* System Activity Section */}
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
                <div className="col-span-7">
                    <ActivityGraph />
                </div>
            </div>
        </div>
    );
}
