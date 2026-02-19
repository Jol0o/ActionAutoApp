'use client';

import React from 'react';
import { adminStore } from '@/store/admin-store';
import { Button } from '@/components/ui/button';
import { XCircle, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ImpersonationBanner() {
    const { isImpersonating, stopImpersonation, impersonatedOrgId } = adminStore.useStore();
    const router = useRouter();

    if (!isImpersonating) return null;

    const handleExit = () => {
        stopImpersonation();
        // Hard redirect to admin dashboard to ensure state is cleared and we leave the org context
        window.location.href = '/admin/dashboard';
    };

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-4 bg-amber-600 text-white px-6 py-3 rounded-full shadow-lg animate-in slide-in-from-bottom-5">
            <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span className="font-medium text-sm">
                    Impersonating Organization ({impersonatedOrgId})
                </span>
            </div>
            <Button
                variant="secondary"
                size="sm"
                className="h-7 text-xs bg-white text-amber-900 hover:bg-amber-100 border-none"
                onClick={handleExit}
            >
                <XCircle className="mr-1 h-3 w-3" />
                Exit View
            </Button>
        </div>
    );
}
