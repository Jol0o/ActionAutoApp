"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface MetricGaugeProps {
    title: string;
    value: number;
    max?: number;
    unit?: string;
    icon?: React.ReactNode;
    subtitle?: string;
    colorThresholds?: {
        warning: number;
        critical: number;
    };
}

export const MetricGauge = React.memo(({ 
    title, 
    value, 
    max,
    unit = '%', 
    icon, 
    subtitle,
    colorThresholds = { warning: 70, critical: 90 }
}: MetricGaugeProps) => {
    
    // Calculate percentage for gauge fill and status coloring
    const percentage = max ? (value / max) * 100 : value;

    // Determine color based on thresholds
    const getStatusColor = (val: number) => {
        if (val >= colorThresholds.critical) return 'text-destructive';
        if (val >= colorThresholds.warning) return 'text-warning text-yellow-500';
        return 'text-primary';
    };

    const getProgressColor = (val: number) => {
        if (val >= colorThresholds.critical) return 'bg-destructive';
        if (val >= colorThresholds.warning) return 'bg-yellow-500';
        return 'bg-primary';
    };

    return (
        <Card className="shadow-sm overflow-hidden border-l-4" style={{ borderLeftColor: percentage >= colorThresholds.critical ? 'var(--destructive)' : percentage >= colorThresholds.warning ? '#eab308' : 'var(--primary)' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className="text-muted-foreground">{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline justify-between mb-2">
                    <div className={cn("text-2xl font-bold transition-colors", getStatusColor(percentage))}>
                        {value.toFixed(1)}{unit}
                    </div>
                </div>
                <Progress 
                    value={percentage} 
                    className="h-2 bg-muted" 
                    indicatorClassName={getProgressColor(percentage)}
                />
                {subtitle && (
                    <p className="text-xs text-muted-foreground mt-2 font-medium">
                        {subtitle}
                    </p>
                )}
            </CardContent>
        </Card>
    );
});

MetricGauge.displayName = 'MetricGauge';
