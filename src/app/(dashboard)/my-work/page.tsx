"use client"

import * as React from "react"
import {
    ClipboardCheck,
    Clock,
    AlertCircle,
    MessageSquare,
    Car,
    ChevronRight,
    CheckCircle2,
    Zap,
    MoreVertical,
    Calendar,
    Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function MyWorkPage() {
    return (
        <div className="p-6 space-y-6 bg-background min-h-screen">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Work</h1>
                    <p className="text-muted-foreground text-sm">Welcome back, Sarah. You have <span className="text-primary font-bold">12</span> tasks requiring attention today.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                        <Filter className="size-4" /> Filter
                    </Button>
                    <Button size="sm" className="gap-2 bg-primary">
                        <Calendar className="size-4" /> Schedule Out
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Stats/Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className="border-none shadow-sm h-fit">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold uppercase tracking-tight text-muted-foreground">Today's Focus</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FocusItem icon={<AlertCircle className="size-4 text-destructive" />} label="Urgent Alerts" count={3} color="text-destructive" />
                            <FocusItem icon={<Clock className="size-4 text-accent-foreground" />} label="Pending Review" count={5} color="text-accent-foreground" />
                            <FocusItem icon={<Car className="size-4 text-primary" />} label="Recon Tasks" count={4} color="text-primary" />
                            <FocusItem icon={<CheckCircle2 className="size-4 text-primary" />} label="Completed" count={18} color="text-primary" />
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-primary text-white">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-2">
                                <Zap className="size-5 text-accent-foreground" />
                                <h3 className="font-bold text-sm uppercase">Efficiency Streak</h3>
                            </div>
                            <p className="text-2xl font-bold">94%</p>
                            <p className="text-[10px] text-white/70 leading-relaxed">
                                You're processing vehicles 15% faster than last month. Keep it up!
                            </p>
                            <Button variant="secondary" size="sm" className="w-full text-xs h-8">View History</Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Task Feed */}
                <div className="lg:col-span-3">
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="bg-transparent h-auto p-0 border-b w-full justify-start rounded-lg gap-8 mb-6">
                            <TabsTrigger value="all" className="rounded-lg border-b-2 border-transparent px-0 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none text-xs font-bold uppercase tracking-wider transition-all duration-300">All Tasks</TabsTrigger>
                            <TabsTrigger value="approvals" className="rounded-lg border-b-2 border-transparent px-0 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none text-xs font-bold uppercase tracking-wider transition-all duration-300">Approvals</TabsTrigger>
                            <TabsTrigger value="recon" className="rounded-lg border-b-2 border-transparent px-0 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none text-xs font-bold uppercase tracking-wider transition-all duration-300">Recondition</TabsTrigger>
                        </TabsList>

                        <TabsContent value="all" className="m-0">
                            <div className="grid grid-cols-1 gap-4">
                                <TaskCard
                                    title="Approve Repair Order"
                                    vehicle="2021 Ford F-150 Lariat"
                                    id="RO-9024"
                                    priority="high"
                                    dueDate="Due in 2h"
                                />
                                <TaskCard
                                    title="Upload Final Detailing Photos"
                                    vehicle="2022 Tesla Model 3"
                                    id="PH-1123"
                                    priority="medium"
                                    dueDate="Due Today"
                                />
                                <TaskCard
                                    title="Review Condition Report"
                                    vehicle="2023 Honda CR-V"
                                    id="CR-5541"
                                    priority="low"
                                    dueDate="Due Tomorrow"
                                />
                                <TaskCard
                                    title="Mechanical Inspection Failed"
                                    vehicle="2020 Toyota RAV4"
                                    id="INS-0092"
                                    priority="high"
                                    dueDate="Expiring"
                                    isAlert
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="approvals" className="m-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                            <div className="grid grid-cols-1 gap-4">
                                <TaskCard
                                    title="Approve Repair Order"
                                    vehicle="2021 Ford F-150 Lariat"
                                    id="RO-9024"
                                    priority="high"
                                    dueDate="Due in 2h"
                                />
                                <TaskCard
                                    title="Approve Price Adjustment"
                                    vehicle="2022 Toyota Camry"
                                    id="PA-4523"
                                    priority="medium"
                                    dueDate="Due Today"
                                />
                                <TaskCard
                                    title="Transportation Quote Approval"
                                    vehicle="2023 BMW X5"
                                    id="TQ-8891"
                                    priority="low"
                                    dueDate="Due Tomorrow"
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="recon" className="m-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                            <div className="grid grid-cols-1 gap-4">
                                <TaskCard
                                    title="Upload Final Detailing Photos"
                                    vehicle="2022 Tesla Model 3"
                                    id="PH-1123"
                                    priority="medium"
                                    dueDate="Due Today"
                                />
                                <TaskCard
                                    title="Mechanical Inspection Failed"
                                    vehicle="2020 Toyota RAV4"
                                    id="INS-0092"
                                    priority="high"
                                    dueDate="Expiring"
                                    isAlert
                                />
                                <TaskCard
                                    title="Body Work Sign-Off Required"
                                    vehicle="2021 Honda Accord"
                                    id="BW-3341"
                                    priority="high"
                                    dueDate="Due in 4h"
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}

function FocusItem({ icon, label, count, color }: { icon: React.ReactNode, label: string, count: number, color: string }) {
    return (
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary cursor-pointer group transition-colors">
            <div className="flex items-center gap-3">
                {icon}
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{label}</span>
            </div>
            <span className={`text-sm font-bold ${color}`}>{count}</span>
        </div>
    )
}

function TaskCard({ title, vehicle, id, priority, dueDate, isAlert }: { title: string, vehicle: string, id: string, priority: string, dueDate: string, isAlert?: boolean }) {
    return (
        <Card className={`border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer group ${isAlert ? 'ring-1 ring-destructive/20 bg-destructive/10' : ''}`}>
            <CardContent className="p-4 flex items-center gap-4">
                <div className={`size-12 rounded-lg flex items-center justify-center shrink-0 ${isAlert ? 'bg-destructive/20 text-destructive' : 'bg-secondary text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary transition-colors'}`}>
                    <ClipboardCheck className="size-6" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                        <div>
                            <h4 className="font-bold text-sm text-foreground leading-tight">{title}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">{vehicle} • <span className="font-mono uppercase">{id}</span></p>
                        </div>
                        <Badge
                            variant="secondary"
                            className={`h-5 px-2 text-[10px] rounded-full uppercase font-bold tracking-tight ${priority === 'high' ? 'bg-destructive/10 text-destructive border-destructive/30' :
                                priority === 'medium' ? 'bg-accent text-accent-foreground border-accent/30' :
                                    'bg-secondary text-muted-foreground border-border'
                                }`}
                        >
                            {priority}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase">
                            <Clock className="size-3" /> {dueDate}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase">
                            <MessageSquare className="size-3" /> 2 Comments
                        </div>
                        {isAlert && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-destructive uppercase">
                                <AlertCircle className="size-3" /> Action Required
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <Button size="sm" className={`h-8 px-4 text-xs font-bold ${isAlert ? 'bg-destructive hover:bg-destructive/90' : ''}`}>Complete</Button>
                    <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold">Details</Button>
                </div>
            </CardContent>
        </Card>
    )
}
