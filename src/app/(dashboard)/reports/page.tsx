"use client"

import * as React from "react"
import {
    FileText,
    CreditCard,
    ShieldCheck,
    Download,
    Share2,
    Trash2,
    Printer,
    Search,
    ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

export default function ReportsPage() {
    return (
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 bg-background min-h-screen">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Operational Reports</h1>
                    <p className="text-muted-foreground text-xs sm:text-sm">Generate and manage digital condition reports, inventory audits, and financial summaries.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none gap-2 text-xs sm:text-sm">
                        <Share2 className="size-3.5 sm:size-4" /> Share
                    </Button>
                    <Button size="sm" className="flex-1 sm:flex-none gap-2 bg-primary text-xs sm:text-sm">
                        <Printer className="size-3.5 sm:size-4" /> Bulk Print
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ReportCard
                    title="Digital Condition Reports"
                    description="Detailed mechanical and cosmetic inspections for every vehicle."
                    count={124}
                    icon={<FileText className="size-5 text-primary" />}
                />
                <ReportCard
                    title="Inventory Health Audit"
                    description="Daily audit of ADOL, pricing efficiency, and status flow."
                    count={12}
                    icon={<ShieldCheck className="size-5 text-primary" />}
                />
                <ReportCard
                    title="Profit Forecasts"
                    description="Inventory value analysis and projected profit trends."
                    count={8}
                    icon={<CreditCard className="size-5 text-accent-foreground" />}
                />
            </div>

            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b px-4 sm:px-6 gap-4 py-4">
                    <div>
                        <CardTitle className="text-base sm:text-lg font-bold">Recent Files</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">All reports generated in the last 30 days.</CardDescription>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Filter by vehicle..." className="pl-8 h-9 text-sm" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y">
                        <FileRow name="Condition_Report_AA1024.pdf" date="12 mins ago" size="2.4 MB" type="PDF" />
                        <FileRow name="Inventory_Snapshot_Jan_14.xlsx" date="2 hours ago" size="1.1 MB" type="XLSX" />
                        <FileRow name="Market_Supply_Audit_Region_Utah.pdf" date="Yesterday" size="4.8 MB" type="PDF" />
                        <FileRow name="Recon_Efficiency_Weekly.pdf" date="Jan 12, 2026" size="1.2 MB" type="PDF" />
                        <FileRow name="Sales_Projection_Q1_2026.pdf" date="Jan 10, 2026" size="3.5 MB" type="PDF" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function ReportCard({ title, description, count, icon }: { title: string, description: string, count: number, icon: React.ReactNode }) {
    return (
        <Card className="border-none shadow-sm hover:ring-1 hover:ring-primary/20 transition-all cursor-pointer bg-white group">
            <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="size-8 sm:size-10 bg-secondary rounded-lg flex items-center justify-center border shrink-0">
                        {React.cloneElement(icon as React.ReactElement<any>, { className: "size-4 sm:size-5 text-primary" })}
                    </div>
                    <Badge variant="outline" className="h-5 text-[9px] sm:text-[10px] font-bold text-muted-foreground border-border">{count} Files</Badge>
                </div>
                <h3 className="font-bold text-xs sm:text-sm text-foreground mb-1 group-hover:text-primary transition-colors">{title}</h3>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed italic line-clamp-2">{description}</p>
            </CardContent>
        </Card>
    )
}

function FileRow({ name, date, size, type }: { name: string, date: string, size: string, type: string }) {
    return (
        <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between group hover:bg-secondary transition-colors gap-3">
            <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                <div className="size-9 sm:size-10 bg-secondary rounded flex items-center justify-center text-muted-foreground shrink-0 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                    <FileText className="size-4 sm:size-5" />
                </div>
                <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-foreground transition-colors truncate">{name}</h4>
                    <div className="flex items-center gap-2 sm:gap-3 mt-0.5">
                        <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase">{date}</span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground">{size}</span>
                        <Badge className="bg-secondary text-muted-foreground hover:bg-secondary h-4 px-1 text-[7px] sm:text-[8px] border-none">{type}</Badge>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-end gap-1 sm:gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Button variant="secondary" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary active:scale-95"><Download className="size-3.5 sm:size-4" /></Button>
                <Button variant="secondary" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary active:scale-95"><Share2 className="size-3.5 sm:size-4" /></Button>
                <Button variant="secondary" size="icon" className="h-8 w-8 text-destructive hover:text-white hover:bg-destructive active:scale-95"><Trash2 className="size-3.5 sm:size-4" /></Button>
            </div>
        </div>
    )
}
