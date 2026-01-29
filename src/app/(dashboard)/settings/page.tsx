"use client"

import * as React from "react"
import {
    FileText,
    Settings as SettingsIcon,
    Users,
    MapPin,
    ShieldCheck,
    Database,
    Bell,
    CreditCard,
    Download,
    Share2,
    Trash2,
    MoreVertical,
    ChevronRight,
    Printer
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

export default function UtilitiesPage() {
    return (
        <div className="p-6 space-y-6 bg-background min-h-screen">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">System Global</h1>
                    <p className="text-muted-foreground text-sm">Manage operational reports, team permissions, and platform settings.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                        <Share2 className="size-4" /> Share Access
                    </Button>
                    <Button size="sm" className="gap-2 bg-primary">
                        <Printer className="size-4" /> Bulk Print
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="reports" className="w-full">
                <TabsList className="bg-card border p-1 rounded-lg h-11 w-fit mb-6">
                    <TabsTrigger value="reports" className="gap-2 text-[11px] font-bold uppercase tracking-wider px-6 data-[state=active]:bg-secondary shadow-none">
                        <FileText className="size-4" /> Reports
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="gap-2 text-[11px] font-bold uppercase tracking-wider px-6 data-[state=active]:bg-secondary shadow-none">
                        <SettingsIcon className="size-4" /> Settings
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="reports" className="m-0 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ReportCard
                            title="Condition Reports"
                            description="Detailed mechanical and cosmetic inspections for every vehicle."
                            count={124}
                            icon={<FileText className="size-5 text-primary" />}
                        />
                        <ReportCard
                            title="Inventory Health"
                            description="Daily audit of ADOL, pricing efficiency, and status flow."
                            count={12}
                            icon={<ShieldCheck className="size-5 text-primary" />}
                        />
                        <ReportCard
                            title="Financial Audits"
                            description="Inventory value analysis and projected profit trends."
                            count={8}
                            icon={<CreditCard className="size-5 text-accent-foreground" />}
                        />
                    </div>

                    <Card className="border-none shadow-sm bg-card">
                        <CardHeader className="border-b">
                            <CardTitle className="text-lg font-bold">Recent Generated Files</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                <FileRow name="Condition_Report_AA1024.pdf" date="12 mins ago" size="2.4 MB" type="PDF" />
                                <FileRow name="Inventory_Snapshot_Jan_14.xlsx" date="2 hours ago" size="1.1 MB" type="XLSX" />
                                <FileRow name="Market_Supply_Audit_Region_Utah.pdf" date="Yesterday" size="4.8 MB" type="PDF" />
                                <FileRow name="Recon_Efficiency_Weekly.pdf" date="Jan 12, 2026" size="1.2 MB" type="PDF" />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="m-0">
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                        <div className="xl:col-span-1 space-y-2">
                            <SettingNavItem label="Account Details" icon={<Users className="size-4" />} active />
                            <SettingNavItem label="Locations" icon={<MapPin className="size-4" />} />
                            <SettingNavItem label="Notifications" icon={<Bell className="size-4" />} />
                            <SettingNavItem label="Integrations" icon={<Database className="size-4" />} />
                            <SettingNavItem label="Security / RBAC" icon={<ShieldCheck className="size-4" />} />
                        </div>

                        <div className="xl:col-span-3 space-y-6">
                            <Card className="border-none shadow-sm bg-card">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold">General Settings</CardTitle>
                                    <CardDescription>Configure your primary dealership identity and data syncing.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Dealership Name</label>
                                            <Input value="Action Auto Utah" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Primary Location</label>
                                            <Input value="Lehi, UT" />
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <h4 className="text-sm font-bold text-foreground">Auto-Sync DMS</h4>
                                            <p className="text-xs text-muted-foreground">Automatically pull VIN-level data from your dealer management system.</p>
                                        </div>
                                        <Switch checked />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <h4 className="text-sm font-bold text-foreground">Public Condition Reports</h4>
                                            <p className="text-xs text-muted-foreground">Make condition reports accessible via public URL for VDP pages.</p>
                                        </div>
                                        <Switch checked />
                                    </div>
                                    <Separator />
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" size="sm">Cancel</Button>
                                        <Button size="sm" className="bg-primary px-8">Save Changes</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function ReportCard({ title, description, count, icon }: { title: string, description: string, count: number, icon: React.ReactNode }) {
    return (
        <Card className="border-none shadow-sm hover:ring-1 hover:ring-primary/20 transition-all cursor-pointer bg-card">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="size-10 bg-secondary rounded-lg flex items-center justify-center border shrink-0">
                        {icon}
                    </div>
                    <Badge variant="outline" className="h-5 text-[10px] font-bold text-muted-foreground">{count} Files</Badge>
                </div>
                <h3 className="font-bold text-sm text-foreground mb-1">{title}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed italic">{description}</p>
            </CardContent>
        </Card>
    )
}

function FileRow({ name, date, size, type }: { name: string, date: string, size: string, type: string }) {
    return (
        <div className="p-4 flex items-center justify-between group hover:bg-secondary transition-colors">
            <div className="flex items-center gap-4">
                <div className="size-10 bg-secondary rounded flex items-center justify-center text-muted-foreground shrink-0">
                    <FileText className="size-5" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{name}</h4>
                    <div className="flex items-center gap-3 mt-0.5 border-none">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{date}</span>
                        <span className="text-[10px] font-bold text-muted-foreground">{size}</span>
                        <Badge className="bg-secondary text-muted-foreground hover:bg-secondary h-4 px-1 text-[8px] border-none">{type}</Badge>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Download className="size-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Share2 className="size-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></Button>
            </div>
        </div>
    )
}

function SettingNavItem({ label, icon, active }: { label: string, icon: React.ReactNode, active?: boolean }) {
    return (
        <div className={`p-3 flex items-center justify-between rounded-lg cursor-pointer transition-colors ${active ? 'bg-primary text-primary-foreground font-bold shadow-md' : 'hover:bg-secondary font-medium text-muted-foreground'}`}>
            <div className="flex items-center gap-3">
                {icon}
                <span className="text-xs uppercase tracking-tight leading-none">{label}</span>
            </div>
            <ChevronRight className={`size-3 ${active ? 'opacity-50' : 'text-muted-foreground'}`} />
        </div>
    )
}