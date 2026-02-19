'use client';

import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Separator } from "@/components/ui/separator";
import { NotificationProvider } from "@/context/NotificationContext";
import { NotificationBell } from "@/components/NotificationBell";

function AdminLayoutContent({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <SidebarProvider>
            <AdminSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <span className="font-medium">Admin Dashboard</span>
                    </div>
                    <NotificationBell />
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-4 md:p-8">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

export default function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <NotificationProvider>
            <AdminLayoutContent>
                {children}
            </AdminLayoutContent>
        </NotificationProvider>
    );
}
