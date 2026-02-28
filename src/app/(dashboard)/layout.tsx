'use client';

import * as React from 'react';

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Input } from "@/components/ui/input"
import { Search, ChevronDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser, useClerk, useOrganization } from "@clerk/nextjs"
import { NotificationBell } from "@/components/NotificationBell"
import { NotificationProvider } from "@/context/NotificationContext"
import { ThemeProvider } from "@/context/ThemeContext"
import { ProfileProvider, useProfileContext } from "@/context/ProfileContext"
import { ProfileToastProvider } from "@/components/ProfileToast"
import { useRouter } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


import { useOrg } from "@/hooks/useOrg"
import { adminStore } from "@/store/admin-store"

function DashboardLayoutContent({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { user } = useUser();
    const { signOut } = useClerk();
    const { avatarUrl } = useProfileContext();
    // Use custom hook for organization context
    const { organization, isLoaded, isSuperAdmin, isDriver } = useOrg();
    const router = useRouter();
    const { isImpersonating } = adminStore.useStore();

    React.useEffect(() => {
        // Wait until org context is fully loaded before making routing decisions
        if (!isLoaded) return;

        // Bypass & Redirect for Super Admin
        // FAILSAFE: If impersonating, DO NOT redirect to admin dashboard
        if (isSuperAdmin && !isImpersonating) {
            if (window.location.pathname === '/' || window.location.pathname === '/org-selection') {
                router.push('/admin/dashboard');
            }
            return;
        }

        // Drivers don't belong to an org — send them to their own dashboard
        if (isDriver) {
            router.push('/driver');
            return;
        }

        // If no organization is found, redirect to selection/onboarding
        if (!organization) {
            router.push('/org-selection');
        }
    }, [isLoaded, organization, isSuperAdmin, isDriver, router, isImpersonating]);

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center justify-between px-2 sm:px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center justify-between gap-2 sm:gap-4 flex-1">


                        <div className="flex items-center gap-2 text-sm text-muted-foreground border-r pr-4 h-8">
                            <SidebarTrigger className="-ml-1" />
                            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground border-r pr-4 h-8">
                                <span className="font-medium whitespace-nowrap">Location:</span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 gap-1 font-normal">
                                            All Locations <ChevronDown className="size-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuItem>All Locations</DropdownMenuItem>
                                        <DropdownMenuItem>Lehi, UT</DropdownMenuItem>
                                        <DropdownMenuItem>Orem, UT</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="relative max-w-md w-full hidden sm:block">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search Inventory..."
                                    className="w-full bg-background pl-8 h-9"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
                                <Plus className="size-5" />
                            </Button>

                            {/* Notification Bell */}
                            <NotificationBell />

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={avatarUrl || user?.imageUrl} alt={user?.fullName || ''} />
                                            <AvatarFallback>{user?.firstName?.substring(0, 1).toUpperCase() || "AA"}</AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {user?.primaryEmailAddress?.emailAddress}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
                                        Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>Settings</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => signOut()}>Log out</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-hidden bg-background">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ThemeProvider>
            <ProfileProvider>
                <ProfileToastProvider>
                    <NotificationProvider>
                        <DashboardLayoutContent>
                            {children}
                        </DashboardLayoutContent>
                    </NotificationProvider>
                </ProfileToastProvider>
            </ProfileProvider>
        </ThemeProvider>
    );
}