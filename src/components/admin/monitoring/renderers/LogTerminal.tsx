"use client";

import React from 'react';
import { LogExplorer } from '../LogExplorer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Terminal, ShieldAlert } from 'lucide-react';

export function LogTerminal() {
    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Context Header */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Terminal className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">Cloud Log Explorer</h2>
                </div>
                <p className="text-sm text-muted-foreground max-w-2xl px-1">
                    Manage and debug your platform through structured logs. I have implemented high-performance database indexing 
                    to allow you to filter by time, severity, and keywords just like in Vercel.
                </p>
            </div>

            {/* The Explorer Container */}
            <LogExplorer />

            {/* Platform Security Reminder */}
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-start gap-4">
               <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
               <div className="space-y-1">
                    <p className="text-xs font-bold text-destructive uppercase tracking-widest">Administrator Security Policy</p>
                    <p className="text-[11px] text-destructive opacity-80 leading-relaxed">
                        I have automatically redacted sensitive data (Passwords, Tokens) from these logs. 
                        Wiping logs should only be done if the platform storage reaches critical levels, 
                        as it will permanently delete 30 days of forensic data history.
                    </p>
               </div>
            </div>
        </div>
    );
}
