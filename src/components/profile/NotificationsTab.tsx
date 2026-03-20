import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
    Bell,
    BellRing,
    BellOff,
    Zap,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Loader2,
    SmartphoneNfc
} from 'lucide-react';
import { useWebPush } from '@/hooks/useWebPush';
import { NotificationPreferences } from '@/types/notification';
import { UserProfile } from '@/types/user';
import { cn } from '@/lib/utils';
import { allNotificationCategories } from './profile-constants';

interface NotificationsTabProps {
    preferences: NotificationPreferences | null;
    savingPreference: string | null;
    profile: UserProfile | null;
    handleEnableAllNotifications: () => void;
    handleDisableAllNotifications: () => void;
    handlePreferenceChange: (key: keyof NotificationPreferences, value: boolean) => void;
    getNotificationStats: () => { enabled: number; total: number };
}

const getNotificationCategoriesByRole = (role?: string) => {
    if (!role || role === 'super_admin' || role === 'admin') return allNotificationCategories;
    return allNotificationCategories.filter(category =>
        category.roles.includes(role) || category.roles.length === 0
    );
};

export const NotificationsTab: React.FC<NotificationsTabProps> = ({
    preferences,
    savingPreference,
    profile,
    handleEnableAllNotifications,
    handleDisableAllNotifications,
    handlePreferenceChange,
    getNotificationStats,
}) => {
    const { isSupported, isSubscribed, subscribe, unsubscribe, isLoading: isPushLoading } = useWebPush();

    if (!preferences) return null;

    return (
        <Card className="p-0 shadow-xl border border-green-100 dark:border-green-900 overflow-hidden hover-lift">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-green-500 via-emerald-500 to-teal-500 animate-gradient"></div>
            <CardHeader className="py-4 bg-linear-to-br from-green-50 to-emerald-50/50 dark:from-gray-900 dark:to-gray-800 border-b border-green-100 dark:border-green-900">
                <div className="flex items-center justify-between animate-fade-in-left">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-lg animate-bounce-in hover:scale-110 transition-transform">
                            <Bell className="size-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Notification Preferences</CardTitle>
                            <CardDescription>Control which notifications you receive</CardDescription>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            getNotificationStats().enabled > 0 ? "bg-green-500 animate-status-aura" : "bg-gray-400"
                        )} />
                        <span className="text-sm font-medium">
                            {getNotificationStats().enabled}/{getNotificationStats().total}
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Quick Actions:</span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEnableAllNotifications}
                        disabled={savingPreference !== null}
                        className="gap-2 border-green-200 hover:bg-green-50 hover:border-green-400 dark:border-green-800 dark:hover:bg-green-900/30 transition-all hover:scale-105"
                    >
                        <BellRing className="size-4 text-green-600" />
                        Enable All
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDisableAllNotifications}
                        disabled={savingPreference !== null}
                        className="gap-2 border-red-200 hover:bg-red-50 hover:border-red-400 dark:border-red-800 dark:hover:bg-red-900/30 transition-all hover:scale-105"
                    >
                        <BellOff className="size-4 text-red-600" />
                        Disable All
                    </Button>
                    <div className="hidden sm:block h-6 w-px bg-gray-300 dark:bg-gray-600" />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const importantKeys = ['passwordChanged', 'emailChanged', 'shipmentCreated', 'quoteCreated'];
                            importantKeys.forEach(key => {
                                if (!preferences[key as keyof NotificationPreferences]) {
                                    handlePreferenceChange(key as keyof NotificationPreferences, true);
                                }
                            });
                        }}
                        disabled={savingPreference !== null}
                        className="gap-2 border-amber-200 hover:bg-amber-50 hover:border-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/30 transition-all hover:scale-105"
                    >
                        <Zap className="size-4 text-amber-600" />
                        Important Only
                    </Button>
                </div>

                <div className="space-y-6">
                    {/* --- WEB PUSH DEVICE SETTINGS --- */}
                    <div className="p-5 rounded-2xl border-2 border-emerald-100 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/20 animate-slide-up">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <SmartphoneNfc className="size-6 text-white" />
                                </div>
                                <div className="space-y-0.5">
                                    <h3 className="font-bold text-base flex items-center gap-2">
                                        Push Notifications
                                        {isSupported && (
                                            <Badge variant="outline" className={cn(
                                                "text-[10px] h-4 px-1.5 font-bold uppercase tracking-tight",
                                                isSubscribed
                                                    ? "border-emerald-500 text-emerald-600 bg-emerald-50"
                                                    : "border-gray-300 text-gray-500 bg-gray-50 dark:bg-gray-800"
                                            )}>
                                                {isSubscribed ? "Active on this device" : "Inactive"}
                                            </Badge>
                                        )}
                                    </h3>
                                    <p className="text-xs text-muted-foreground max-w-[400px]">
                                        {isSupported
                                            ? "Enable real-time alerts on this browser to receive instant updates even when the app is closed."
                                            : "Your browser does not support Web Push notifications. Please use a modern browser like Chrome, Safari, or Edge."}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {isPushLoading && <Loader2 className="size-5 animate-spin text-emerald-600" />}
                                <Switch
                                    checked={isSubscribed}
                                    disabled={!isSupported || isPushLoading}
                                    onCheckedChange={(checked) => {
                                        if (checked) subscribe();
                                        else unsubscribe();
                                    }}
                                    className="data-[state=checked]:bg-emerald-600 data-[state=checked]:shadow-emerald-500/40"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 dark:bg-gray-800 mx-1" />

                    {getNotificationCategoriesByRole(profile?.role).map((category, categoryIndex) => {
                        const CategoryIcon = category.icon;
                        const categoryEnabled = category.items.filter(
                            item => preferences[item.key as keyof NotificationPreferences]
                        ).length;
                        const allEnabled = categoryEnabled === category.items.length;
                        const someEnabled = categoryEnabled > 0 && categoryEnabled < category.items.length;

                        return (
                            <div
                                key={category.title}
                                className="space-y-3 animate-slide-up"
                                style={{ animationDelay: `${categoryIndex * 0.1}s` }}
                            >
                                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-linear-to-br",
                                            category.color
                                        )}>
                                            <CategoryIcon className="size-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{category.title}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {categoryEnabled} of {category.items.length} enabled
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all",
                                            allEnabled && "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400",
                                            someEnabled && "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
                                            !categoryEnabled && "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                                        )}>
                                            {allEnabled ? (
                                                <>
                                                    <CheckCircle2 className="size-3" />
                                                    All On
                                                </>
                                            ) : someEnabled ? (
                                                <>
                                                    <AlertCircle className="size-3" />
                                                    Partial
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="size-3" />
                                                    All Off
                                                </>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2"
                                            onClick={() => {
                                                const turnOn = categoryEnabled < category.items.length;
                                                category.items.forEach(item => {
                                                    if (preferences[item.key as keyof NotificationPreferences] !== turnOn) {
                                                        handlePreferenceChange(item.key as keyof NotificationPreferences, turnOn);
                                                    }
                                                });
                                            }}
                                        >
                                            {categoryEnabled === category.items.length ? 'Disable' : 'Enable'} All
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pl-2">
                                    {category.items.map((item, itemIndex) => {
                                        const Icon = item.icon;
                                        const isEnabled = preferences[item.key as keyof NotificationPreferences];
                                        const isSaving = savingPreference === item.key;

                                        return (
                                            <div
                                                key={item.key}
                                                className={cn(
                                                    "group relative flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 hover-card-lift",
                                                    isEnabled
                                                        ? "border-green-300 bg-linear-to-br from-green-50 to-emerald-50/50 dark:border-green-700 dark:from-green-900/30 dark:to-emerald-900/20 shadow-sm"
                                                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900",
                                                    isSaving && "opacity-70 pointer-events-none"
                                                )}
                                                style={{ animationDelay: `${(categoryIndex * 0.1) + (itemIndex * 0.05)}s` }}
                                            >
                                                {isSaving && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 rounded-xl z-10">
                                                        <Loader2 className="size-5 animate-spin text-green-600" />
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300",
                                                        isEnabled
                                                            ? "bg-linear-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25"
                                                            : "bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700"
                                                    )}>
                                                        <Icon className={cn(
                                                            "size-5 transition-all duration-300",
                                                            isEnabled
                                                                ? "text-white"
                                                                : "text-gray-500 dark:text-gray-400"
                                                        )} />
                                                    </div>
                                                    <div>
                                                        <p className={cn(
                                                            "text-sm font-semibold transition-colors",
                                                            isEnabled && "text-green-700 dark:text-green-400"
                                                        )}>{item.label}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                                                    </div>
                                                </div>
                                                <Switch
                                                    checked={isEnabled}
                                                    onCheckedChange={(checked) => handlePreferenceChange(item.key as keyof NotificationPreferences, checked)}
                                                    disabled={isSaving}
                                                    className={cn(
                                                        "data-[state=checked]:bg-linear-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-emerald-600",
                                                        "transition-all duration-300"
                                                    )}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};
