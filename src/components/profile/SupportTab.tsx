import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    HelpCircle,
    MessageSquare,
    Mail,
    Building2,
    AlertCircle
} from 'lucide-react';

interface SupportTabProps {
    setShowDeleteDialog: (show: boolean) => void;
}

export const SupportTab: React.FC<SupportTabProps> = ({
    setShowDeleteDialog,
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-0 shadow-xl border border-cyan-100 dark:border-cyan-900 overflow-hidden hover-lift">
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-cyan-500 to-blue-500 animate-gradient"></div>
                <CardHeader className="py-4 bg-linear-to-br from-cyan-50 to-blue-50/50 dark:from-gray-900 dark:to-gray-800 border-b border-cyan-100 dark:border-cyan-900">
                    <div className="flex items-center gap-3 animate-slide-in-left">
                        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                            <HelpCircle className="size-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Help & Support</CardTitle>
                            <CardDescription>Get help with your account</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 p-6 animate-fade-in-up">
                    <div className="relative animate-slide-up stagger-1">
                        <Button variant="outline" className="w-full justify-start opacity-60 hover:opacity-80 transition-opacity" disabled>
                            <MessageSquare className="size-4 mr-3" />Contact Support
                        </Button>
                        <Badge className="absolute top-1/2 right-3 -translate-y-1/2 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-[10px] animate-soft-pulse">Coming Soon</Badge>
                    </div>
                    <div className="relative animate-slide-up stagger-2">
                        <Button variant="outline" className="w-full justify-start opacity-60 hover:opacity-80 transition-opacity" disabled>
                            <HelpCircle className="size-4 mr-3" />FAQ & Documentation
                        </Button>
                        <Badge className="absolute top-1/2 right-3 -translate-y-1/2 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-[10px] animate-soft-pulse">Coming Soon</Badge>
                    </div>
                    <Button
                        variant="outline"
                        className="w-full justify-start btn-hover-scale animate-slide-up stagger-3"
                        onClick={() => window.open('https://mail.google.com/mail/?view=cm&to=support@actionautoutah.com&su=Support%20Request', '_blank')}
                    >
                        <Mail className="size-4 mr-3" />Email: support@actionautoutah.com
                    </Button>
                </CardContent>
            </Card>

            <Card className="p-0 shadow-xl border border-blue-100 dark:border-blue-900 overflow-hidden hover-lift">
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500 animate-gradient"></div>
                <CardHeader className="py-4 bg-linear-to-br from-blue-50 to-indigo-50/50 dark:from-gray-900 dark:to-gray-800 border-b border-blue-100 dark:border-blue-900">
                    <div className="flex items-center gap-3 animate-slide-in-right">
                        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg animate-bounce-in hover:scale-110 transition-transform">
                            <Building2 className="size-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">About ActionAutoUtah</CardTitle>
                            <CardDescription>Company information</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 p-6 animate-fade-in-up">
                    <div className="p-4 rounded-xl bg-linear-to-br from-blue-50 to-indigo-50/50 dark:from-gray-800 dark:to-gray-700 border border-blue-100 dark:border-blue-900 animate-slide-up stagger-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            ActionAutoUtah is your trusted partner for vehicle transport and logistics solutions.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm animate-slide-up stagger-2">
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-gray-800 border border-blue-100 dark:border-blue-900">
                            <p className="text-gray-500 dark:text-gray-400 text-xs">Version</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">1.0.0</p>
                        </div>
                        <div className="p-3 rounded-lg bg-indigo-50 dark:bg-gray-800 border border-indigo-100 dark:border-indigo-900">
                            <p className="text-gray-500 dark:text-gray-400 text-xs">Last Updated</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">Feb 2026</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="p-0 shadow-xl border border-red-200 dark:border-red-900 md:col-span-2 overflow-hidden hover-lift">
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-500 via-orange-500 to-rose-500 animate-gradient"></div>
                <CardHeader className="py-4 bg-linear-to-br from-red-50 to-orange-50/50 dark:from-gray-900 dark:to-gray-800 border-b border-red-200 dark:border-red-900">
                    <div className="flex items-center gap-3 animate-fade-in-down">
                        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg animate-bounce-in hover:scale-110 transition-transform">
                            <AlertCircle className="size-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl text-red-700 dark:text-red-400">Danger Zone</CardTitle>
                            <CardDescription>Irreversible actions</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 animate-slide-up">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">Delete Account</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Permanently delete your account and all associated data. This action cannot be undone.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950 btn-hover-scale animate-button-entry"
                            onClick={() => setShowDeleteDialog(true)}
                        >
                            Delete Account
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
