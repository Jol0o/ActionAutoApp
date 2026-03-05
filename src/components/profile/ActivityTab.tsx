import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    History,
    Activity,
    RefreshCw,
    Clock
} from 'lucide-react';
import { RecentActivity } from '@/types/user';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { activityIcons } from './profile-constants';

interface ActivityTabProps {
    activities: RecentActivity[];
    fetchProfile: () => void;
    addToast: (toast: any) => void;
}

export const ActivityTab: React.FC<ActivityTabProps> = ({
    activities,
    fetchProfile,
    addToast,
}) => {
    return (
        <Card className="p-0 shadow-xl border border-purple-100 dark:border-purple-900 overflow-hidden hover-lift">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 animate-gradient"></div>
            <CardHeader className="py-4 bg-gradient-to-br from-purple-50 to-violet-50/50 dark:from-gray-900 dark:to-gray-800 border-b border-purple-100 dark:border-purple-900">
                <div className="flex items-center justify-between animate-fade-in-left">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg animate-bounce-in hover:scale-110 transition-transform">
                            <History className="size-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Recent Activity</CardTitle>
                            <CardDescription>Your recent actions and events</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 animate-fade-in-right">
                        <Badge variant="outline" className="hidden sm:flex gap-1.5 border-purple-200 dark:border-purple-700">
                            <Activity className="size-3" />
                            {activities.length} events
                        </Badge>
                        <button
                            onClick={() => { fetchProfile(); addToast({ type: 'info', title: 'Refreshed', message: 'Activity events reloaded.' }); }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all hover:scale-105"
                        >
                            <RefreshCw className="size-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                {activities.length > 0 ? (
                    <ScrollArea className="h-[500px] pr-4">
                        <div className="relative">
                            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-violet-500 to-transparent" />

                            <div className="space-y-4">
                                {activities.map((activity, index) => (
                                    <div
                                        key={activity._id || index}
                                        className="relative flex items-start gap-4 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 hover:shadow-md hover:-translate-y-1 ml-2 animate-slide-up"
                                        style={{ animationDelay: `${index * 0.05}s` }}
                                    >
                                        <div className="absolute -left-4 top-6 w-3 h-3 rounded-full bg-purple-500 border-2 border-white dark:border-gray-900 shadow-md animate-pulse" />

                                        <div className={cn(
                                            "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-110 shadow-md",
                                            activity.type === 'login' && "bg-gradient-to-br from-green-500 to-emerald-600 text-white",
                                            activity.type === 'profile_update' && "bg-gradient-to-br from-blue-500 to-indigo-600 text-white",
                                            activity.type === 'password_change' && "bg-gradient-to-br from-amber-500 to-orange-600 text-white",
                                            activity.type === 'avatar_updated' && "bg-gradient-to-br from-purple-500 to-violet-600 text-white",
                                            activity.type === 'quote_created' && "bg-gradient-to-br from-cyan-500 to-blue-600 text-white",
                                            activity.type === 'shipment_created' && "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
                                            activity.type === 'google_calendar_connected' && "bg-gradient-to-br from-red-500 to-rose-600 text-white",
                                            !['login', 'profile_update', 'password_change', 'avatar_updated', 'quote_created', 'shipment_created', 'google_calendar_connected'].includes(activity.type) && "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                        )}>
                                            {activityIcons[activity.type] || <Activity className="size-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{activity.title}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{activity.description}</p>
                                                </div>
                                                <Badge variant="outline" className="text-[10px] flex-shrink-0 hidden sm:flex border-gray-300 dark:border-gray-600 font-medium">
                                                    {activity.type.replace(/_/g, ' ')}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 mt-3">
                                                <Clock className="size-3 text-gray-400" />
                                                <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                                                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="text-center py-16 animate-fade-in-up">
                        <div className="relative w-20 h-20 mx-auto mb-6">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-950 dark:to-violet-950 rounded-full animate-pulse-glow" />
                            <div className="relative w-full h-full flex items-center justify-center">
                                <History className="size-10 text-purple-400 dark:text-purple-500" />
                            </div>
                        </div>
                        <p className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No recent activity</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 max-w-[250px] mx-auto leading-relaxed">
                            Your actions like profile updates, logins, and changes will appear here
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
