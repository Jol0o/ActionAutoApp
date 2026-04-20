'use client';

import * as React from "react"
import { useOrg } from "@/hooks/useOrg"
import { useAuth } from "@/providers/AuthProvider"
import { DashboardShell } from "./DashboardShell"
import { CustomerShell } from "./CustomerShell"
import { PublicShell } from "./PublicShell"

interface ContextualShellProps {
    children: React.ReactNode;
    hideNav?: boolean;
    hideThemeToggle?: boolean;
    logoText?: string;
    logoIcon?: string;
}

export function ContextualShell({ 
    children,
    hideNav,
    hideThemeToggle,
    logoText,
    logoIcon
}: ContextualShellProps) {
    const { isLoaded, userRole, isSuperAdmin } = useOrg()
    const { isSignedIn } = useAuth()

    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground animate-pulse">Loading context...</p>
                </div>
            </div>
        )
    }

    // Role-based Layout Selection
    // Staff/Admin Path
    if (isSignedIn && (userRole === 'admin' || userRole === 'employee' || userRole === 'super_admin' || isSuperAdmin)) {
        return <DashboardShell>{children}</DashboardShell>
    }

    // Customer Path
    if (isSignedIn && userRole === 'customer') {
        return <CustomerShell>{children}</CustomerShell>
    }

    // Default Guest/Public Path
    return (
        <PublicShell 
            hideNav={hideNav} 
            hideThemeToggle={hideThemeToggle}
            logoText={logoText}
            logoIcon={logoIcon}
        >
            {children}
        </PublicShell>
    )
}
