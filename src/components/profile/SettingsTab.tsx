'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/context/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SettingsTab: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="max-w-2xl space-y-6 animate-fade-in-up">
            <Card className="shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-500 to-gray-600"></div>
                <CardHeader className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-600 to-gray-700 flex items-center justify-center shadow-lg">
                            {theme === 'dark' ? (
                                <Moon className="size-6 text-white" />
                            ) : (
                                <Sun className="size-6 text-white" />
                            )}
                        </div>
                        <div>
                            <CardTitle>Display Preferences</CardTitle>
                            <CardDescription>Customize your viewing experience</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className={cn(
                            "flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                            theme === 'dark'
                                ? "border-blue-600 bg-blue-900/20"
                                : "border-gray-200 hover:border-slate-400 bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:hover:border-slate-600"
                        )}>
                            <div className="flex-1">
                                <Label className="text-base font-semibold cursor-pointer">Dark Mode</Label>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {theme === 'dark' ? '🌙 Night mode is active' : '☀️ Day mode is active'}
                                </p>
                            </div>
                            <Switch
                                checked={theme === 'dark'}
                                onCheckedChange={toggleTheme}
                                className="data-[state=checked]:bg-blue-600"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <div className={cn(
                                "p-4 rounded-xl border-2 transition-all text-center cursor-pointer",
                                theme === 'light'
                                    ? "border-amber-400 bg-amber-50 dark:bg-amber-900/30"
                                    : "border-gray-300 dark:border-gray-600"
                            )}>
                                <Sun className="size-8 mx-auto mb-2 text-amber-500" />
                                <p className="font-semibold text-sm">Light</p>
                            </div>
                            <div className={cn(
                                "p-4 rounded-xl border-2 transition-all text-center cursor-pointer",
                                theme === 'dark'
                                    ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30"
                                    : "border-gray-300 dark:border-gray-600"
                            )}>
                                <Moon className="size-8 mx-auto mb-2 text-blue-500" />
                                <p className="font-semibold text-sm">Dark</p>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                            Your theme preference is saved to your account and synced across all devices.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-lg border border-gray-200 dark:border-gray-800">
                <CardHeader className="bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <CardTitle className="text-lg">Accessibility</CardTitle>
                    <CardDescription>Accessibility settings coming soon</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Additional accessibility options will be available in future updates.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};
