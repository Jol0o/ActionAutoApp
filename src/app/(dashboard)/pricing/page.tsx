"use client"

import * as React from "react"
import {
    DollarSign,
    TrendingDown,
    TrendingUp,
    BarChart3,
    Eye,
    MousePointerClick,
    ArrowRight,
    ChevronDown,
    Filter,
    Download,
    AlertTriangle,
    Info,
    Car
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

export default function PricingPage() {
    return (
        <div className="p-6 space-y-6 bg-background min-h-screen">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Inventory Pricing</h1>
                    <p className="text-muted-foreground text-sm">Dynamic pricing engine utilizing live VDP/SRP metrics and 1M+ daily market updates.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                        <Download className="size-4" /> Export Report
                    </Button>
                    <Button size="sm" className="gap-2 bg-primary">
                        <TrendingDown className="size-4" /> Run ProfitBuilder
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <AnalyticCard title="Avg. VDP Views" value="42.5" subValue="+12%" subLabel="last 7 days" icon={<Eye className="size-4" />} />
                <AnalyticCard title="Conversion Rate" value="3.2%" subValue="-0.5%" subLabel="market avg" icon={<MousePointerClick className="size-4" />} />
                <AnalyticCard title="Price-to-Market" value="98.4%" subValue="-1.2%" subLabel="competitive" icon={<DollarSign className="size-4" />} />
                <AnalyticCard title="Market Day Supply" value="18.2" subValue="Hot" subLabel="utah region" icon={<BarChart3 className="size-4" />} color="text-primary" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="flex flex-row items-center justify-between border-b">
                            <div>
                                <CardTitle className="text-lg font-bold">Pricing Opportunities</CardTitle>
                                <CardDescription>Units requiring price adjustments based on aging and interest.</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="gap-2 text-[10px] h-8">
                                    <Filter className="size-3" /> Filters
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                <PricingRow
                                    vehicle="2022 Tesla Model 3"
                                    days={52}
                                    vdp={12}
                                    currentPrice="$34,500"
                                    suggestedPrice="$33,900"
                                    reason="Low VDP, Aged 45+"
                                />
                                <PricingRow
                                    vehicle="2021 Ford F-150 Lariat"
                                    days={12}
                                    vdp={88}
                                    currentPrice="$48,900"
                                    suggestedPrice="$49,500"
                                    isIncrease
                                    reason="High Clicks, Low Supply"
                                />
                                <PricingRow
                                    vehicle="2020 Toyota RAV4"
                                    days={82}
                                    vdp={4}
                                    currentPrice="$26,400"
                                    suggestedPrice="$24,900"
                                    isUrgent
                                    reason="Critical Aging (80+ Days)"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-none shadow-md bg-slate-900 text-white">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Zap className="size-4 text-accent-foreground" />
                                <CardTitle className="text-sm font-bold uppercase">Pricing Logic</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between text-[11px] font-bold text-white/50 uppercase">
                                    <span>Aging Threshold</span>
                                    <span>Action</span>
                                </div>
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-white/80">Day 15-30</span>
                                    <span className="text-accent-foreground">Apply -1.5%</span>
                                </div>
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-white/80">Day 31-45</span>
                                    <span className="text-accent-foreground">Apply -3.0%</span>
                                </div>
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-white/80">Day 46+</span>
                                    <span className="text-destructive font-bold">Aggressive Drop</span>
                                </div>
                            </div>
                            <Separator className="bg-white/10" />
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Info className="size-4 text-primary shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-white/60 leading-relaxed italic">
                                        Logic is currently synced with Manheim (MMR) and JD Power daily feeds. Last sync: 12 minutes ago.
                                    </p>
                                </div>
                                <Button className="w-full bg-primary font-bold text-xs h-9 uppercase tracking-wider">Configure Logic</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold uppercase tracking-tight">Market Supply Gap</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-2">
                            <div className="space-y-4">
                                <div className="text-center p-4 bg-secondary rounded-lg border">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">SUV Segment (Utah)</p>
                                    <p className="text-2xl font-bold text-foreground">12.4 Units</p>
                                    <p className="text-[10px] font-bold text-destructive mt-1">Critically Low Supply</p>
                                </div>
                                <p className="text-[10px] text-muted-foreground leading-relaxed text-center italic">
                                    Recommendation: Maintain prices for all SUV inventory. Margin protection is currently +4.2% higher than market avg.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function AnalyticCard({ title, value, subValue, subLabel, icon, color }: { title: string, value: string, subValue: string, subLabel: string, icon: React.ReactNode, color?: string }) {
    return (
        <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{title}</span>
                    <div className="size-8 bg-secondary rounded flex items-center justify-center text-muted-foreground">{icon}</div>
                </div>
                <div>
                    <span className={`text-2xl font-bold ${color || 'text-foreground'}`}>{value}</span>
                    <div className="flex items-center gap-1 mt-1">
                        <span className={`text-[10px] font-bold ${subValue.startsWith('+') ? 'text-primary' : 'text-muted-foreground'}`}>{subValue}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{subLabel}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function PricingRow({ vehicle, days, vdp, currentPrice, suggestedPrice, reason, isIncrease, isUrgent }: { vehicle: string, days: number, vdp: number, currentPrice: string, suggestedPrice: string, reason: string, isIncrease?: boolean, isUrgent?: boolean }) {
    return (
        <div className={`p-4 flex items-center justify-between group transition-colors hover:bg-secondary ${isUrgent ? 'bg-destructive/10/10' : ''}`}>
            <div className="flex gap-4 min-w-0 flex-1">
                <div className={`size-10 rounded flex items-center justify-center shrink-0 ${isUrgent ? 'bg-destructive/20 text-destructive' : 'bg-secondary text-muted-foreground'}`}>
                    <Car className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-foreground truncate">{vehicle}</h4>
                    <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{days} Days on lot</span>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase">
                            <Eye className="size-3" /> {vdp} VDP
                        </div>
                        <span className="text-[10px] font-bold text-primary uppercase">{reason}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-6">
                <div className="text-right">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Current</p>
                    <p className="text-sm font-bold text-muted-foreground line-through">{currentPrice}</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
                <div className="text-right">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Suggested</p>
                    <div className="flex items-center gap-1 justify-end">
                        {isIncrease ? <TrendingUp className="size-3 text-primary" /> : <TrendingDown className="size-3 text-primary" />}
                        <p className={`text-sm font-bold ${isIncrease ? 'text-primary' : 'text-primary'}`}>{suggestedPrice}</p>
                    </div>
                </div>
                <Button size="sm" className={`h-8 font-bold text-xs ${isIncrease ? 'bg-primary hover:bg-primary/90' : ''}`}>Apply</Button>
            </div>
        </div>
    )
}

function Zap({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4 14.71 12 2.29l1.71 6.86H20l-8 12.42-1.71-6.86H4Z" />
        </svg>
    )
}
