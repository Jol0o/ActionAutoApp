"use client"

import * as React from "react"
import {
    Scan,
    Car,
    MapPin,
    TrendingUp,
    TrendingDown,
    Info,
    ChevronRight,
    Plus,
    History,
    CheckCircle2,
    AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"

export default function AppraisalsPage() {
    return (
        <div className="p-6 space-y-6 bg-background min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Vehicle Appraisal</h1>
                    <p className="text-muted-foreground text-sm">AI-powered valuation and market analysis for trade-ins and buying.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                        <History className="size-4" /> History
                    </Button>
                    <Button size="sm" className="gap-2 bg-primary">
                        <Scan className="size-4" /> New Appraisal
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Column: Appraisal Details */}
                <div className="xl:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm overflow-hidden">
                        <div className="bg-primary/5 p-6 border-b flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="size-16 bg-white rounded-lg border shadow-sm flex items-center justify-center">
                                    <Car className="size-10 text-primary/40" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">2019 Jeep Wrangler Unlimited Sport</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-mono text-muted-foreground">VIN: 1C4HJXDG...</span>
                                        <Badge variant="secondary" className="h-4 text-[10px] px-1 uppercase leading-none">Clean Title</Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Estimated Value</p>
                                <p className="text-3xl font-bold text-primary">$32,450</p>
                            </div>
                        </div>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <DetailItem label="Mileage" value="42,560 mi" />
                                <DetailItem label="Engine" value="3.6L V6" />
                                <DetailItem label="Drivetrain" value="4WD" />
                                <DetailItem label="Location" value="Lehi, UT" />
                            </div>
                        </CardContent>
                    </Card>

                    <Tabs defaultValue="condition" className="w-full">
                        <TabsList className="bg-transparent border-b w-full justify-start rounded-lg p-0 h-auto gap-8">
                            <TabsTrigger value="condition" className="rounded-lg border-b-2 border-transparent px-0 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none text-xs font-bold uppercase tracking-wider transition-all duration-300">Condition Grade</TabsTrigger>
                            <TabsTrigger value="comps" className="rounded-lg border-b-2 border-transparent px-0 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none text-xs font-bold uppercase tracking-wider transition-all duration-300">Market Comparables</TabsTrigger>
                            <TabsTrigger value="history" className="rounded-lg border-b-2 border-transparent px-0 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none text-xs font-bold uppercase tracking-wider transition-all duration-300">Vehicle History</TabsTrigger>
                        </TabsList>
                        <TabsContent value="condition" className="pt-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="md:col-span-1 border-none shadow-sm bg-primary/5">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-bold uppercase tracking-tight text-primary/60">Condition Score</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-center py-6">
                                        <div className="relative inline-flex items-center justify-center">
                                            <svg className="size-32 -rotate-90">
                                                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted" />
                                                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="364.4" strokeDashoffset="54.6" className="text-primary" />
                                            </svg>
                                            <div className="absolute flex flex-col items-center">
                                                <span className="text-4xl font-bold">8.5</span>
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Excellent</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-4 px-4 leading-relaxed">
                                            Vehicle is in superior mechanical and cosmetic condition according to Action Auto standards.
                                        </p>
                                    </CardContent>
                                </Card>
                                <div className="md:col-span-2 space-y-4">
                                    <ConditionRow label="Mechanical" score={9.0} />
                                    <ConditionRow label="Interior" score={8.2} />
                                    <ConditionRow label="Exterior" score={7.5} />
                                    <ConditionRow label="Tires / Wheels" score={9.5} />
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="comps" className="pt-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                            <div className="space-y-4">
                                <CompItem name="2019 Jeep Wrangler Sport (38k mi)" price="$34,200" distance="12 mi" source="Dealer" />
                                <CompItem name="2019 Jeep Wrangler Sport (45k mi)" price="$31,900" distance="24 mi" source="Private" />
                                <CompItem name="2018 Jeep Wrangler Sahara (52k mi)" price="$30,500" distance="5 mi" source="Auction" />
                            </div>
                        </TabsContent>
                        <TabsContent value="history" className="pt-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                            <div className="space-y-4">
                                <Card className="border-none shadow-sm">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                            <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="size-5 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold">Clean Title History</h4>
                                                <p className="text-xs text-muted-foreground mt-1">No accidents, salvage, or flood damage reported</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-none shadow-sm">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                            <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="size-5 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold">Service Records</h4>
                                                <p className="text-xs text-muted-foreground mt-1">12 service records found • Last: Oil change (3 months ago)</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-none shadow-sm">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                            <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="size-5 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold">Ownership History</h4>
                                                <p className="text-xs text-muted-foreground mt-1">2 previous owners • Personal use vehicle</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Column: Pricing Logic & Tools */}
                <div className="space-y-6">
                    <Card className="border-none shadow-md bg-white">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Pricing Guide</CardTitle>
                            <CardDescription className="text-xs">Consolidated values from major book providers.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="flex justify-between items-center group cursor-pointer border-b pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 bg-primary/100 rounded flex items-center justify-center text-white font-bold text-[10px]">KBB</div>
                                    <span className="text-sm font-medium text-foreground">Kelly Blue Book</span>
                                </div>
                                <span className="font-bold text-foreground">$31,800</span>
                            </div>
                            <div className="flex justify-between items-center group cursor-pointer border-b pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 bg-destructive/100 rounded flex items-center justify-center text-white font-bold text-[10px]">JDP</div>
                                    <span className="text-sm font-medium text-foreground">JD Power / NADA</span>
                                </div>
                                <span className="font-bold text-foreground">$32,150</span>
                            </div>
                            <div className="flex justify-between items-center group cursor-pointer border-b pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 bg-card dark:bg-slate-800 rounded flex items-center justify-center text-white font-bold text-[10px]">MMR</div>
                                    <span className="text-sm font-medium text-foreground">Manheim Market</span>
                                </div>
                                <span className="font-bold text-foreground">$29,900</span>
                            </div>

                            <div className="bg-secondary rounded-lg p-4 mt-4 border border-dashed overflow-hidden">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-muted-foreground uppercase">Target Buy Price</span>
                                    <Badge className="bg-primary/20 text-primary hover:bg-primary/20 h-5 px-1.5">+12.4% ROI</Badge>
                                </div>
                                <span className="text-2xl font-bold text-primary">$28,500</span>
                                <div className="flex  gap-2 mt-3">
                                    <Button size="sm" className="flex-1 bg-primary text-[10px] h-8">Accept Trade</Button>
                                    <Button variant="outline" size="sm" className="flex-1 text-[10px] h-8">Edit Logic</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="size-4 text-primary" />
                                <CardTitle className="text-sm font-bold">Market Intelligence</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 bg-white/5 rounded border border-white/10">
                                <p className="text-[10px] text-white/50 uppercase font-bold mb-1">Market Day Supply</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xl font-bold">14.2 Days</span>
                                    <span className="text-[10px] text-primary font-bold whitespace-nowrap bg-primary/10 px-1 rounded">High Demand</span>
                                </div>
                            </div>
                            <div className="p-3 bg-white/5 rounded border border-white/10">
                                <p className="text-[10px] text-white/50 uppercase font-bold mb-1">Retail Price Range</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xl font-bold">$34k - $38k</span>
                                    <TrendingUp className="size-4 text-white/20" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    )
}

function DetailItem({ label, value }: { label: string, value: string }) {
    return (
        <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight mb-0.5">{label}</p>
            <p className="text-sm font-bold text-foreground">{value}</p>
        </div>
    )
}

function ConditionRow({ label, score }: { label: string, score: number }) {
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-foreground">{label}</span>
                <span className="text-xs font-bold text-primary">{score}/10</span>
            </div>
            <Progress value={score * 10} className="h-2 bg-muted" />
        </div>
    )
}

function CompItem({ name, price, distance, source }: { name: string, price: string, distance: string, source: string }) {
    return (
        <div className="flex items-center justify-between p-3 bg-white border rounded-lg hover:border-primary/30 transition-colors shadow-sm cursor-pointer group">
            <div className="flex items-center gap-4">
                <div className="size-10 bg-secondary rounded flex items-center justify-center text-muted-foreground shrink-0">
                    <Car className="size-5" />
                </div>
                <div>
                    <h4 className="text-sm font-bold group-hover:text-primary transition-colors">{name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{distance} away</span>
                        <span className="text-[8px] bg-secondary px-1 rounded border uppercase font-bold text-muted-foreground">{source}</span>
                    </div>
                </div>
            </div>
            <div className="text-right">
                <span className="text-lg font-bold text-foreground">{price}</span>
            </div>
        </div>
    )
}
