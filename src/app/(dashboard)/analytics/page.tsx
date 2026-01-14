"use client"

import * as React from "react"
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Users,
    Car,
    MapPin,
    Calendar,
    ChevronDown,
    Filter,
    Download,
    Info,
    PieChart as PieChartIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    RadialBarChart,
    RadialBar,
    PolarRadiusAxis,
    Label
} from "recharts"

const agingData = [
    { name: "0-15 Days", total: 12 },
    { name: "16-30 Days", total: 24 },
    { name: "31-45 Days", total: 18 },
    { name: "46-60 Days", total: 8 },
    { name: "60+ Days", total: 4 },
]

const marketShareData = [{ actionAuto: 35, competitors: 65 }]

const marketShareConfig = {
    actionAuto: {
        label: "Action Auto",
        color: "var(--chart-1)",
    },
    competitors: {
        label: "Competitors",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig

const marketShare = [
    { name: "Action Auto", value: 35 },
    { name: "Competitor A", value: 25 },
    { name: "Competitor B", value: 20 },
    { name: "Others", value: 20 },
]

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-5))']

const chartConfig = {
    total: {
        label: "Vehicles",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig

export default function AnalyticsPage() {
    return (
        <div className="p-6 space-y-6 bg-background min-h-screen">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dealer Analytics</h1>
                    <p className="text-muted-foreground text-sm">Actionable insights into market share, competitor strategies, and inventory performance.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                        <Download className="size-4" /> Export Data
                    </Button>
                    <Button size="sm" className="gap-2 bg-primary">
                        <Calendar className="size-4" /> Jan 2026 <ChevronDown className="size-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm flex flex-col">
                    <CardHeader className="items-center pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Market Share (Utah)</CardTitle>
                        <CardDescription className="text-[10px]">Action Auto vs Competitors</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-1 items-center pb-4">
                        <ChartContainer
                            config={marketShareConfig}
                            className="mx-auto aspect-square w-full max-w-[200px]"
                        >
                            <RadialBarChart
                                data={marketShareData}
                                endAngle={180}
                                innerRadius={60}
                                outerRadius={110}
                            >
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                                    <Label
                                        content={({ viewBox }) => {
                                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                return (
                                                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={(viewBox.cy || 0) - 10}
                                                            className="fill-foreground text-2xl font-bold"
                                                        >
                                                            35%
                                                        </tspan>
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={(viewBox.cy || 0) + 10}
                                                            className="fill-muted-foreground text-xs"
                                                        >
                                                            Market Share
                                                        </tspan>
                                                    </text>
                                                )
                                            }
                                        }}
                                    />
                                </PolarRadiusAxis>
                                <RadialBar
                                    dataKey="actionAuto"
                                    stackId="a"
                                    cornerRadius={5}
                                    fill="var(--color-actionAuto)"
                                    className="stroke-transparent stroke-2"
                                />
                                <RadialBar
                                    dataKey="competitors"
                                    fill="var(--color-competitors)"
                                    stackId="a"
                                    cornerRadius={5}
                                    className="stroke-transparent stroke-2"
                                />
                            </RadialBarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 border-none shadow-sm overflow-hidden p-0">
                    <CardHeader className="bg-slate-900 text-white py-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-bold uppercase tracking-wider">Inventory Aging Histogram</CardTitle>
                                <CardDescription className="text-white/50 text-[10px]">Distribution of vehicles by days on lot.</CardDescription>
                            </div>
                            <Badge className="bg-primary/20 text-primary border-primary/20 h-5">Healthy Turn</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <ChartContainer config={chartConfig} className="h-64 w-full">
                            <BarChart data={agingData} accessibilityLayer>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700 }}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700 }}
                                />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                <Bar dataKey="total" fill="var(--color-total)" radius={8} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm h-fit">
                    <CardHeader className="border-b">
                        <CardTitle className="text-lg font-bold">Price-to-Market Comparison</CardTitle>
                        <CardDescription>Competitive pricing efficiency vs. Local Utah Area.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            <ComparisonRow label="Sedans / EV" actionAuto="98.2%" market="101.5%" status="Aggressive" />
                            <ComparisonRow label="SUVs / Crossovers" actionAuto="99.5%" market="99.2%" status="Neutral" />
                            <ComparisonRow label="Trucks / 4x4" actionAuto="102.1%" market="97.8%" status="Premium" />
                            <ComparisonRow label="Performance" actionAuto="96.4%" market="104.2%" status="Liquidation" isHighDemand />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="border-b">
                        <CardTitle className="text-lg font-bold">Top Performing Dealers</CardTitle>
                        <CardDescription>Sales velocity and ADOL by regional partner.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y text-sm">
                            <div className="grid grid-cols-4 p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-secondary">
                                <span className="col-span-1">Dealer</span>
                                <span className="text-center">Active</span>
                                <span className="text-center">ADOL</span>
                                <span className="text-right">Sales</span>
                            </div>
                            <DealerRow name="Action Auto Lehi" active={42} adol={18} sales={124} isTop />
                            <DealerRow name="Action Auto Orem" active={38} adol={22} sales={108} />
                            <DealerRow name="Partner Elite UT" active={15} adol={45} sales={32} />
                            <DealerRow name="Mountain State" active={8} adol={58} sales={12} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function ComparisonRow({ label, actionAuto, market, status, isHighDemand }: { label: string, actionAuto: string, market: string, status: string, isHighDemand?: boolean }) {
    return (
        <div className="p-4 flex items-center justify-between hover:bg-secondary transition-colors">
            <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">{label}</span>
                {isHighDemand && <span className="text-[10px] text-primary font-bold uppercase tracking-tight">High Demand Segment</span>}
            </div>
            <div className="flex gap-8 text-right">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Action Auto</span>
                    <span className="text-sm font-black text-primary">{actionAuto}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Market</span>
                    <span className="text-sm font-bold text-muted-foreground">{market}</span>
                </div>
                <div className="w-20 text-right self-center">
                    <Badge className={`text-[9px] font-black uppercase h-5 px-1.5 ${status === 'Aggressive' ? 'bg-primary/20 text-primary hover:bg-primary/20' :
                        status === 'Premium' ? 'bg-primary/10 text-primary hover:bg-primary/10' :
                            status === 'Liquidation' ? 'bg-destructive/20 text-destructive hover:bg-destructive/20' :
                                'bg-secondary text-foreground hover:bg-secondary'
                        }`}>{status}</Badge>
                </div>
            </div>
        </div>
    )
}

function DealerRow({ name, active, adol, sales, isTop }: { name: string, active: number, adol: number, sales: number, isTop?: boolean }) {
    return (
        <div className="grid grid-cols-4 p-4 items-center group cursor-pointer hover:bg-secondary transition-colors">
            <span className="text-sm font-bold text-foreground flex items-center gap-1.5 min-w-0 truncate">
                {isTop && <TrendingUp className="size-3 text-primary shrink-0" />}
                {name}
            </span>
            <span className="text-sm font-bold text-muted-foreground text-center">{active}</span>
            <span className={`text-sm font-bold text-center ${adol < 20 ? 'text-primary' : adol > 50 ? 'text-destructive' : 'text-muted-foreground'}`}>{adol}d</span>
            <span className="text-sm font-black text-foreground text-right">{sales}</span>
        </div>
    )
}
