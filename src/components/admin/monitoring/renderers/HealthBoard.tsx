"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSystemHealth } from '@/hooks/api/use-admin-monitoring';
import { MetricGauge } from './MetricGauge';
import { GoldenSignalsChart } from './GoldenSignalsChart';
import { Cpu, HardDrive, Zap, Info, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function HealthBoard() {
    const [history, setHistory] = useState<any[]>([]);
    const { data, isLoading, error, refetch } = useSystemHealth(5000); // Poll every 5s for the Health tab

    // Effect: Update history buffer when new data arrives
    useEffect(() => {
        if (data) {
            setHistory(prev => {
                const newPoint = {
                    timestamp: data.timestamp || new Date().toISOString(),
                    requests: data.goldenSignals.traffic.requestsPerMinute / 60, // Normalize to Req/s
                    errors: data.goldenSignals.errors.rate,
                    latency: data.goldenSignals.latency.p95
                };
                
                const updated = [...prev, newPoint];
                // Keep last 30 points (approx 2.5 minutes at 5s interval)
                return updated.slice(-30);
            });
        }
    }, [data, data?.timestamp]);

    if (isLoading && history.length === 0) {
        return (
            <div className="h-[400px] flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-lg bg-muted/20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse font-medium">Connecting to system telemetry...</p>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive" className="my-10">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Telemetry Failure</AlertTitle>
                <AlertDescription className="flex flex-col gap-4">
                    <p>Unable to reach the system monitoring endpoint. Please verify the backend status.</p>
                    <Button variant="outline" size="sm" onClick={() => refetch()} className="w-fit">
                        Try Again
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Top Metrics Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricGauge 
                    title="CPU Utilization" 
                    value={data.performance.cpu} 
                    icon={<Cpu className="h-4 w-4" />}
                    subtitle="System & User load"
                />
                <MetricGauge 
                    title="Memory Usage" 
                    value={data.performance.memory} 
                    max={data.performance.memoryTotal}
                    unit=" MB"
                    icon={<HardDrive className="h-4 w-4" />}
                    subtitle="Resident Set Size (RSS)"
                />
                <MetricGauge 
                    title="System Uptime" 
                    value={data.performance.uptime / 3600} 
                    unit="h"
                    icon={<Zap className="h-4 w-4" />}
                    subtitle="Stability period"
                    colorThresholds={{ warning: 99.9, critical: 100 }} // Color context is different for uptime
                />
                <MetricGauge 
                    title="Error Rate" 
                    value={data.goldenSignals.errors.rate} 
                    unit="%"
                    icon={<AlertCircle className="h-4 w-4" />}
                    subtitle={`${data.goldenSignals.errors.total} total errors`}
                    colorThresholds={{ warning: 1, critical: 5 }}
                />
            </div>

            {/* Live Chart Section */}
            <div className="grid gap-6">
                <GoldenSignalsChart data={history} />
            </div>

            {/* Quick Info Grid */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border shadow-sm">
                    <div className="bg-primary/10 p-2 rounded-full">
                        <Info className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold">Real-time Polling</h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            Telemetry data is refreshed every 5 seconds to provide high-fidelity visibility into system performance.
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border shadow-sm">
                    <div className="bg-green-500/10 p-2 rounded-full">
                        <Zap className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold">Latency Goals</h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            Maintain P95 latency below 200ms to ensure a premium user experience across all devices.
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border shadow-sm">
                    <div className="bg-yellow-500/10 p-2 rounded-full">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold">Threshold Alerts</h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            Visual cues turn amber at 70% and red at 90% utilization to proactively flag saturation.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
