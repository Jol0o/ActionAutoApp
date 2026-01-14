"use client"

import * as React from "react"
import {
    AlertCircle,
    Clock,
    TrendingDown,
    Car,
    AlertTriangle,
    ShieldAlert,
    ChevronRight,
    MoreVertical,
    ArrowRight,
    Zap,
    Filter,
    Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

export default function NeedsAttentionPage() {
    return (
        <div className="p-6 space-y-6 bg-background min-h-screen">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Needs Attention</h1>
                    <p className="text-muted-foreground text-sm">Automated alerts for inventory that is lagging, over-priced, or stuck in workflow.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                        <Filter className="size-4" /> Filter Alerts
                    </Button>
                    <Button size="sm" className="gap-2 bg-destructive hover:bg-destructive/90">
                        <ShieldAlert className="size-4" /> Resolve All
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AlertStat label="Critical Aging" count={4} subLabel="60+ Days" icon={<Clock className="size-4 text-destructive" />} />
                <AlertStat label="Stalled Recon" count={6} subLabel=">48h in stage" icon={<ShieldAlert className="size-4 text-accent-foreground" />} />
                <AlertStat label="Pricing Gaps" count={3} subLabel=">10% vs Market" icon={<TrendingDown className="size-4 text-primary" />} />
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <AlertTriangle className="size-4 text-destructive" /> High Priority Issues
                    </h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <IssueCard
                        type="Aging Alarm"
                        vehicle="2020 Toyota RAV4 XLE"
                        detail="82 Days on Lot (Target: 45)"
                        impact="-$1,200 Forecast"
                        priority="critical"
                    />
                    <IssueCard
                        type="Stalled Workflow"
                        vehicle="2018 Ford Mustang"
                        detail="8 Days in 'Body / Paint' (Target: 3)"
                        impact="Technician: Sarah K."
                        priority="high"
                    />
                    <IssueCard
                        type="Price Gap"
                        vehicle="2022 Tesla Model 3"
                        detail="Priced at 112% of Market (Target: 98%)"
                        impact="0 VDP views last 48h"
                        priority="high"
                    />
                    <IssueCard
                        type="Missing Data"
                        vehicle="2023 Honda CR-V"
                        detail="No Photography uploaded (Recon Complete)"
                        impact="Ready for Frontline"
                        priority="medium"
                    />
                </div>
            </div>
        </div>
    )
}

function AlertStat({ label, count, subLabel, icon }: { label: string, count: number, subLabel: string, icon: React.ReactNode }) {
    return (
        <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{label}</p>
                    <p className="text-3xl font-black text-foreground my-1">{count}</p>
                    <p className="text-[10px] font-bold text-muted-foreground">{subLabel}</p>
                </div>
                <div className="size-12 bg-secondary rounded-lg flex items-center justify-center border">
                    {icon}
                </div>
            </CardContent>
        </Card>
    )
}

function IssueCard({ type, vehicle, detail, impact, priority }: { type: string, vehicle: string, detail: string, impact: string, priority: string }) {
    return (
        <Card className={`border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer group ${priority === 'critical' ? 'ring-1 ring-destructive/20 bg-destructive/10/10' : ''}`}>
            <CardContent className="p-4 flex items-center gap-6">
                <div className={`size-12 rounded-lg flex items-center justify-center shrink-0 ${priority === 'critical' ? 'bg-destructive/20 text-destructive' :
                        priority === 'high' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground'
                    }`}>
                    <AlertCircle className="size-6" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black uppercase ${priority === 'critical' ? 'text-destructive' :
                                        priority === 'high' ? 'text-accent-foreground' : 'text-muted-foreground'
                                    }`}>{type}</span>
                                <Badge variant="secondary" className="h-4 text-[8px] uppercase px-1 leading-none">{priority}</Badge>
                            </div>
                            <h4 className="font-bold text-sm text-foreground leading-tight mt-0.5">{vehicle}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{detail}</p>
                        </div>
                    </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                    <p className={`text-[10px] font-black uppercase ${priority === 'critical' ? 'text-destructive' : 'text-muted-foreground'}`}>{impact}</p>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold">Ignore</Button>
                        <Button size="sm" className={`h-8 px-4 text-xs font-bold ${priority === 'critical' ? 'bg-destructive hover:bg-destructive/90' : ''}`}>Resolve Now</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
