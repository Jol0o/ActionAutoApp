"use client"

import * as React from "react"
import {
    Search,
    TrendingUp,
    Car,
    Zap,
    DollarSign,
    BarChart3,
    Globe,
    MoreHorizontal,
    ChevronRight,
    Filter,
    CheckCircle2,
    AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

export default function AutoFinderPage() {
    return (
        <div className="p-6 space-y-6 bg-background min-h-screen">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Auto Finder</h1>
                    <p className="text-muted-foreground text-sm">Identifying high-margin inventory targets based on Utah market velocity.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                        <BarChart3 className="size-4" /> Market Data
                    </Button>
                    <Button size="sm" className="gap-2 bg-primary">
                        <Zap className="size-4" /> Run Profit Predictor
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Market Insights */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-none shadow-sm overflow-hidden p-0">
                        <CardHeader className="bg-slate-900 text-white py-2">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="size-4 text-primary" />
                                <CardTitle className="text-sm font-bold uppercase tracking-wider">Market Intelligence</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-6 space-y-4">
                                <InsightStat label="Top Selling Model" value="Tesla Model 3" change="+12% demand" />
                                <InsightStat label="Shortest Days to Sell" value="SUV / Hybrid" change="11 Days Avg" />
                                <InsightStat label="Market Gap" value="Compact Sedans" change="Low Supply" />
                                <Separator className="my-4" />
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Utah Search Trends</p>
                                    <Progress value={85} className="h-2 bg-secondary" />
                                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                                        <span>Electric / Hybrid</span>
                                        <span>85% Growth</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm p-0">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold uppercase tracking-tight">Active Sourcing Alerts</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 p-6">
                            <AlertCard
                                title="2022 Rivian R1T"
                                location="Utah Local Auction"
                                score={92}
                                profit="+$4,500 est."
                            />
                            <AlertCard
                                title="2021 Toyota RAV4 Hybrid"
                                location="Manheim Las Vegas"
                                score={88}
                                profit="+$3,200 est."
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Actionable Opportunities */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="flex flex-row items-center justify-between border-b">
                            <div>
                                <CardTitle className="text-lg font-bold">Recommended Targets</CardTitle>
                                <CardDescription>Vehicles matching your high-velocity sales profile.</CardDescription>
                            </div>
                            <div className="flex items-center border rounded-md p-1 bg-secondary">
                                <Button variant="ghost" size="sm" className="h-7 px-3 bg-card shadow-sm text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">Auction</Button>
                                <Button variant="ghost" size="sm" className="h-7 px-3 text-xs font-bold hover:bg-card hover:shadow-sm transition-colors cursor-pointer">FSBO</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 divide-y">
                                <OpportunityCard
                                    model="2021 Jeep Wrangler Rubicon"
                                    vin="1C4HJX..."
                                    auction="Manheim Salt Lake"
                                    run="Lane 4, #120"
                                    kbbValue="$42,500"
                                    targetBid="$38,000"
                                    score={94}
                                />
                                <OpportunityCard
                                    model="2022 Tesla Model Y Performance"
                                    vin="5YJYGC..."
                                    auction="Adesa Phoenix"
                                    run="Online Only"
                                    kbbValue="$48,900"
                                    targetBid="$44,500"
                                    score={89}
                                />
                                <OpportunityCard
                                    model="2020 Ford F-150 PowerBoost"
                                    vin="1FTEW..."
                                    auction="Manheim Denver"
                                    run="Lane 1, #22"
                                    kbbValue="$39,200"
                                    targetBid="$35,000"
                                    score={85}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function InsightStat({ label, value, change }: { label: string, value: string, change: string }) {
    return (
        <div className="flex items-center justify-between group cursor-pointer">
            <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">{label}</p>
                <p className="text-sm font-bold text-foreground">{value}</p>
            </div>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded leading-none">{change}</span>
        </div>
    )
}

function AlertCard({ title, location, score, profit }: { title: string, location: string, score: number, profit: string }) {
    return (
        <div className="p-3 border rounded-lg hover:border-primary/30 transition-colors shadow-sm cursor-pointer space-y-2">
            <div className="flex justify-between items-start">
                <h4 className="text-xs font-bold text-foreground">{title}</h4>
                <div className="flex items-center gap-1 text-[10px] font-bold text-primary">
                    <TrendingUp className="size-3" /> {profit}
                </div>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground">{location}</span>
                <Badge className="bg-primary/5 text-primary h-5 px-1.5 text-[9px] hover:bg-primary/5">{score} Score</Badge>
            </div>
        </div>
    )
}

function OpportunityCard({ model, vin, auction, run, kbbValue, targetBid, score }: { model: string, vin: string, auction: string, run: string, kbbValue: string, targetBid: string, score: number }) {
    return (
        <div className="p-4 hover:bg-secondary transition-colors cursor-pointer group">
            <div className="flex gap-4">
                <div className="size-16 bg-secondary rounded-lg flex flex-col items-center justify-center text-muted-foreground shrink-0 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                    <Car className="size-8" />
                    <span className="text-[8px] font-bold uppercase mt-1">Carketa</span>
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-bold text-sm text-foreground">{model}</h4>
                            <p className="text-xs text-muted-foreground font-mono">{vin}</p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                                <Zap className="size-3 text-accent-foreground" />
                                <span className="text-xs font-black text-primary">{score}</span>
                            </div>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">Carketa Score</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        <div className="space-y-0.5">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">Source</p>
                            <div className="flex items-center gap-1 text-[11px] font-bold text-foreground">
                                <Globe className="size-3 text-primary" /> {auction}
                            </div>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">Run List</p>
                            <p className="text-[11px] font-bold text-foreground">{run}</p>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">KBB Value</p>
                            <p className="text-[11px] font-bold text-foreground">{kbbValue}</p>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">Max Bid</p>
                            <p className="text-[11px] font-bold text-primary">{targetBid}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function Separator({ className }: { className?: string }) {
    return <div className={`h-[1px] bg-muted ${className}`} />
}
