"use client";

import React from 'react';
import { 
    Calendar, 
    Search, 
    Filter, 
    ChevronDown, 
    Clock, 
    AlertCircle, 
    Info,
    ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { LogFilterParams } from '@/lib/types/monitoring';

interface LogFilterSidebarProps {
    filters: LogFilterParams;
    onFilterChange: (filters: LogFilterParams) => void;
}

const TIMELINE_OPTIONS = [
    { label: 'Last 30 minutes', value: '30m' },
    { label: 'Last hour', value: '1h' },
    { label: 'Last 12 hours', value: '12h' },
    { label: 'Last 24 hours', value: '24h' },
    { label: 'Last 3 days', value: '3d' },
    { label: 'Last week', value: '7d' },
];

const LOG_LEVELS = [
    { label: 'Error', value: 'ERROR', icon: ShieldAlert, color: 'text-red-500' },
    { label: 'Warning', value: 'WARN', icon: AlertCircle, color: 'text-yellow-500' },
    { label: 'Info', value: 'INFO', icon: Info, color: 'text-blue-500' },
    { label: 'Debug', value: 'DEBUG', icon: Clock, color: 'text-gray-500' },
];

export function LogFilterSidebar({ filters, onFilterChange }: LogFilterSidebarProps) {
    const handleTimelineChange = (value: string) => {
        const now = new Date();
        let from = new Date();

        switch (value) {
            case '30m': from = new Date(now.getTime() - 30 * 60 * 1000); break;
            case '1h': from = new Date(now.getTime() - 60 * 60 * 1000); break;
            case '12h': from = new Date(now.getTime() - 12 * 60 * 60 * 1000); break;
            case '24h': from = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
            case '3d': from = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); break;
            case '7d': from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
        }

        onFilterChange({ ...filters, from: from.toISOString(), to: now.toISOString(), page: 1 });
    };

    const handleLevelToggle = (level: string, checked: boolean) => {
        const currentLevels = filters.level ? filters.level.split(',') : [];
        let newLevels;

        if (checked) {
            newLevels = [...currentLevels, level];
        } else {
            newLevels = currentLevels.filter(l => l !== level);
        }

        onFilterChange({ 
            ...filters, 
            level: newLevels.length > 0 ? newLevels.join(',') : undefined,
            page: 1 
        });
    };

    return (
        <div className="w-[300px] border-r bg-card h-full flex flex-col pt-6 px-4 space-y-8 animate-in slide-in-from-left duration-300">
            {/* Timeline Filter */}
            <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Timeline
                </Label>
                <Select onValueChange={handleTimelineChange} defaultValue="30m">
                    <SelectTrigger className="w-full h-9 bg-muted/40 border-none shadow-inner">
                        <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                        {TIMELINE_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Level Filter */}
            <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Filter className="h-3 w-3" />
                    Console Levels
                </Label>
                <div className="space-y-2.5">
                    {LOG_LEVELS.map(level => {
                        const Icon = level.icon;
                        const isChecked = filters.level?.includes(level.value) ?? false;

                        return (
                            <div key={level.value} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <Checkbox 
                                        id={`level-${level.value}`}
                                        checked={isChecked}
                                        onCheckedChange={(checked) => handleLevelToggle(level.value, !!checked)}
                                        className="data-[state=checked]:bg-primary"
                                    />
                                    <Label 
                                        htmlFor={`level-${level.value}`}
                                        className={cn(
                                            "text-sm font-medium cursor-pointer transition-colors duration-200",
                                            isChecked ? level.color : "text-muted-foreground/70 group-hover:text-foreground"
                                        )}
                                    >
                                        <Icon className="h-3.5 w-3.5 inline mr-2 opacity-70" />
                                        {level.label}
                                    </Label>
                                </div>
                                <span className={cn(
                                    "text-[10px] tabular-nums font-mono px-1.5 py-0.5 rounded-full bg-muted/50",
                                    isChecked ? level.color : "text-muted-foreground"
                                )}>
                                    {/* Placeholder for counts if implemented later */}
                                    *
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Advanced Filters (Placeholders for Paths, Methods, etc) */}
            <div className="space-y-4 pt-4 border-t opacity-50 select-none">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Path</span>
                    <ChevronDown className="h-3 w-3" />
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Request Path</span>
                    <ChevronDown className="h-3 w-3" />
                </div>
            </div>

            <div className="flex-1" />

            <div className="pb-6">
                <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                    I have implemented this sidebar to give you granular control over your cloud logs, matching the search capabilities of Vercel production environments.
                </p>
            </div>
        </div>
    );
}
