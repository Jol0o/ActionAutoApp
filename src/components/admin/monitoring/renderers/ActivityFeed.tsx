"use client";

import React, { useMemo } from 'react';
import { useActivityFeed } from '@/hooks/api/use-admin-monitoring';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
    Activity, 
    Truck, 
    UserPlus, 
    DollarSign, 
    ClipboardList, 
    ShieldCheck, 
    AlertCircle, 
    Calendar,
    Loader2,
    Building2,
    RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

// Mapping for activity icons based on type
const getActivityIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('load')) return <Truck className="h-4 w-4" />;
    if (t.includes('driver')) return <UserPlus className="h-4 w-4" />;
    if (t.includes('payment') || t.includes('billing')) return <DollarSign className="h-4 w-4" />;
    if (t.includes('appointment') || t.includes('meeting')) return <Calendar className="h-4 w-4" />;
    if (t.includes('user') || t.includes('auth')) return <ShieldCheck className="h-4 w-4" />;
    if (t.includes('organization')) return <Building2 className="h-4 w-4" />;
    if (t.includes('error') || t.includes('failed')) return <AlertCircle className="h-4 w-4 text-destructive" />;
    return <ClipboardList className="h-4 w-4" />;
};

// Mapping for activity colors
const getActivityColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('load')) return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    if (t.includes('driver')) return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    if (t.includes('payment') || t.includes('billing')) return 'bg-green-500/10 text-green-600 border-green-500/20';
    if (t.includes('user') || t.includes('auth')) return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    if (t.includes('error') || t.includes('failed')) return 'bg-destructive/10 text-destructive border-destructive/20';
    return 'bg-muted text-muted-foreground border-muted-foreground/20';
};

export function ActivityFeed() {
    const { data: events, isLoading, isFetching, refetch } = useActivityFeed({ limit: 50 });

    if (isLoading && !events) {
        return (
            <div className="h-[400px] flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-lg bg-muted/20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse font-medium">Synchronizing business events...</p>
            </div>
        );
    }

    return (
        <Card className="shadow-sm border-none bg-muted/20">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Live Activity Stream
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Real-time pipeline of organization-wide business events.
                        </CardDescription>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => refetch()} 
                        disabled={isFetching}
                        className="h-8 shadow-sm"
                    >
                        {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <RefreshCw className="h-3.5 w-3.5 mr-2" />}
                        {isFetching ? "Syncing..." : "Sync Feed"}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[700px] pr-4">
                    <div className="space-y-6 relative ml-3 border-l pb-10">
                        {events?.map((event, idx) => (
                            <div key={event._id} className="relative pl-8 animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                                {/* Timeline Node */}
                                <div className={`absolute -left-3 top-0 h-6 w-6 rounded-full border-2 border-background flex items-center justify-center z-10 shadow-sm ${getActivityColor(event.type)}`}>
                                    {getActivityIcon(event.type)}
                                </div>
                                
                                <div className="flex flex-col gap-1.5 p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold tracking-tight">{event.title}</span>
                                            <Badge variant="outline" className={`text-[10px] uppercase font-semibold h-4 ${getActivityColor(event.type)}`}>
                                                {event.type}
                                            </Badge>
                                        </div>
                                        <span className="text-[10px] font-mono text-muted-foreground uppercase">
                                            {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {event.description}
                                    </p>

                                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {Object.entries(event.metadata).slice(0, 3).map(([key, val]) => (
                                                <Badge key={key} variant="outline" className="text-[9px] bg-muted/50 font-mono">
                                                    {key}: {String(val)}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                    
                                    <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground font-medium pb-1 border-b border-dashed">
                                        <div className="flex items-center gap-1">
                                            <Building2 className="h-3 w-3" />
                                            <span>Org: {event.organizationId?.slice(-6).toUpperCase() || 'Global'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <ShieldCheck className="h-3 w-3" />
                                            <span>IP: {event.ipAddress || 'Hidden'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {!events || events.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-48 text-center px-10">
                                <Activity className="h-10 w-10 text-muted-foreground opacity-20 mb-4" />
                                <p className="text-sm font-medium text-muted-foreground italic">
                                    The activity stream is currently tranquil. 
                                </p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground font-medium">
                        Showing last 50 operational events.
                    </p>
                    <Badge variant="secondary" className="text-[9px] font-bold">
                        AUTO-REFRESH: 30S
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}

ActivityFeed.displayName = 'ActivityFeed';
