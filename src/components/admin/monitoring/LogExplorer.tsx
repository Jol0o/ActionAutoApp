"use client";

import React, { useState, useEffect } from 'react';
import { LogFilterSidebar } from './LogFilterSidebar';
import { LogHistogram } from './LogHistogram';
import { AdvancedLogTable } from './AdvancedLogTable';
import { useSystemLogs, useLogStats } from '@/hooks/api/use-admin-monitoring';
import { LogFilterParams } from '@/lib/types/monitoring';
import { Button } from '@/components/ui/button';
import { Play, Pause, Trash2, Download, Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2 } from 'lucide-react';

export function LogExplorer() {
    const [isPaused, setIsPaused] = useState(false);
    const [filters, setFilters] = useState<LogFilterParams>({
        page: 1,
        limit: 50,
        // Default to last 30 minutes
        from: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        to: new Date().toISOString(),
    });

    // Hooks for data
    const { 
        data: logResponse, 
        isLoading: isLogsLoading, 
        isFetching,
        clearLogs, 
        isClearing 
    } = useSystemLogs(filters, isPaused);

    const { 
        data: stats, 
        isLoading: isStatsLoading 
    } = useLogStats({ 
        from: filters.from, 
        to: filters.to 
    });

    const handleFilterChange = (newFilters: LogFilterParams) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleRefresh = () => {
        setFilters(prev => ({ 
            ...prev, 
            to: new Date().toISOString(),
            page: 1 
        }));
        toast.info("Logs refreshed to latest");
    };

    const handleTraceRequest = (requestId: string) => {
        setFilters(prev => ({
            ...prev,
            search: requestId,
            // Expand timeline to 24h to ensure we find related logs
            from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString(),
            page: 1
        }));
        toast.info(`Tracing Request ID: ${requestId.slice(0, 8)}...`);
    };

    return (
        <div className="flex h-[800px] w-full border rounded-xl overflow-hidden bg-background shadow-2xl animate-in zoom-in-95 duration-500">
            {/* Sidebar Controls */}
            <LogFilterSidebar 
                filters={filters} 
                onFilterChange={handleFilterChange} 
            />

            {/* Main Log Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Visual Histogram */}
                <LogHistogram 
                    data={stats} 
                    isLoading={isStatsLoading} 
                />

                {/* Toolbar */}
                <div className="h-14 border-b flex items-center justify-between px-6 bg-muted/20">
                    <div className="flex items-center gap-3">
                        <Button 
                            variant={isPaused ? "secondary" : "outline"} 
                            size="sm" 
                            onClick={() => setIsPaused(!isPaused)}
                            className="h-8 shadow-sm transition-all active:scale-95"
                        >
                            {isPaused ? <Play className="h-3.5 w-3.5 mr-2" /> : <Pause className="h-3.5 w-3.5 mr-2" />}
                            {isPaused ? "Resident Stream Paused" : "Live Stream Active"}
                        </Button>
                        
                        <div className="h-4 w-[1px] bg-white/10 mx-1" />

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 shadow-sm text-destructive hover:text-white hover:bg-destructive transition-all active:scale-95"
                                >
                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                    Wipe
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Wipe Production Cloud Logs?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete 30 days of forensic history from both the 
                                        database and the flat recovery file. This cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Keep History</AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={() => {
                                            clearLogs();
                                            toast.error("Cloud logs permanently wiped.");
                                        }} 
                                        className="bg-destructive text-destructive-foreground"
                                    >
                                        {isClearing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Confirm Wipe
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        
                        <div className="h-4 w-[1px] bg-white/10 mx-1" />

                        <div className="relative w-64">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground opacity-50" />
                            <Input 
                                placeholder="Search messages, paths, req ids..." 
                                className="pl-9 h-8 text-[11px] bg-background border-none shadow-inner"
                                value={filters.search || ''}
                                onChange={(e) => handleFilterChange({ search: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isFetching && !isLogsLoading && (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary mr-2" />
                        )}
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={handleRefresh}
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => window.print()}
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* The Advanced Table */}
                <AdvancedLogTable 
                    logs={logResponse?.logs} 
                    isLoading={isLogsLoading} 
                    onTraceRequest={handleTraceRequest}
                />

                {/* Footer Status */}
                <div className="h-8 border-t flex items-center justify-between px-4 bg-muted/40 select-none">
                   <div className="flex items-center gap-4">
                        <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
                            Source: SystemLog-v2
                        </span>
                        <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
                            Status: {isPaused ? 'Paused' : 'Indexing'}
                        </span>
                   </div>
                   <p className="text-[9px] text-muted-foreground italic opacity-50">
                        I've optimized this explorer for high-density debugging, exactly like the Vercel logs you shared.
                   </p>
                </div>
            </div>
        </div>
    );
}
