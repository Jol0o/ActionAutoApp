"use client";

import React, { useState } from 'react';
import { Tabs as ShadcnTabs, TabsContent as ShadcnContent, TabsList as ShadcnList, TabsTrigger as ShadcnTrigger } from "@/components/ui/tabs";
import { Activity, ShieldAlert, HeartPulse, Terminal, LayoutDashboard } from "lucide-react";
import { OverviewTab } from './renderers/OverviewTab';
import { ActivityFeed } from './renderers/ActivityFeed';
import { HealthBoard } from './renderers/HealthBoard';
import { AuditExplorer } from './renderers/AuditExplorer';
import { LogTerminal } from './renderers/LogTerminal';

interface MonitoringShellProps {
    initialData: {
        systemStats?: any;
        financials?: any;
    }
}

export function MonitoringShell({ initialData }: MonitoringShellProps) {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="space-y-6 container mx-auto pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Admin Control Center</h2>
                    <p className="text-muted-foreground">
                        Unified observability and system management.
                    </p>
                </div>
            </div>

            <ShadcnTabs defaultValue="overview" className="space-y-6" onValueChange={setActiveTab}>
                <div className="overflow-x-auto pb-2">
                    <ShadcnList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-full md:w-auto">
                        <ShadcnTrigger value="overview" className="flex items-center gap-2">
                            <LayoutDashboard className="h-4 w-4" />
                            <span>Overview</span>
                        </ShadcnTrigger>
                        <ShadcnTrigger value="activity" className="flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            <span>Activity Feed</span>
                        </ShadcnTrigger>
                        <ShadcnTrigger value="health" className="flex items-center gap-2">
                            <HeartPulse className="h-4 w-4" />
                            <span>System Health</span>
                        </ShadcnTrigger>
                        <ShadcnTrigger value="audits" className="flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4" />
                            <span>Audit Explorer</span>
                        </ShadcnTrigger>
                        <ShadcnTrigger value="logs" className="flex items-center gap-2">
                            <Terminal className="h-4 w-4" />
                            <span>Cloud Logs</span>
                        </ShadcnTrigger>
                    </ShadcnList>
                </div>

                <ShadcnContent value="overview" className="space-y-4 outline-none">
                    <OverviewTab 
                        systemStats={initialData.systemStats} 
                        financials={initialData.financials} 
                    />
                </ShadcnContent>

                <ShadcnContent value="activity" className="outline-none">
                    <ActivityFeed />
                </ShadcnContent>

                <ShadcnContent value="health" className="outline-none">
                    <HealthBoard />
                </ShadcnContent>

                <ShadcnContent value="audits" className="outline-none">
                    <AuditExplorer />
                </ShadcnContent>

                <ShadcnContent value="logs" className="outline-none">
                    <LogTerminal />
                </ShadcnContent>
            </ShadcnTabs>
        </div>
    );
}
