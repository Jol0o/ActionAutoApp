"use client"

import * as React from "react"
import {
    FileText,
    Download,
    Archive,
    MapPin,
    CreditCard,
    Truck,
    CheckSquare,
    Calendar,
    HardDrive,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportCategory = "Transportation" | "Driver Tracker" | "Billings"
type TabValue = "ALL" | "Transportation" | "Driver Tracker" | "Billings"

interface Report {
    id: string
    title: string
    description: string
    category: ReportCategory
    date: string
    size: string
    format: "PDF"
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const REPORTS: Report[] = [
    // Transportation — left empty intentionally (teammate will fill)
    // Driver Tracker
    {
        id: "dt-001",
        title: "Driver Activity Summary",
        description: "Daily activity logs and summaries for all active drivers",
        category: "Driver Tracker",
        date: "Mar 2, 2026",
        size: "1.2 MB",
        format: "PDF",
    },
    {
        id: "dt-002",
        title: "Trip Completion Report",
        description: "Completed trips with timestamps, routes, and durations",
        category: "Driver Tracker",
        date: "Mar 1, 2026",
        size: "2.0 MB",
        format: "PDF",
    },
    {
        id: "dt-003",
        title: "Driver Performance Metrics",
        description: "On-time delivery rate, distance covered, and efficiency scores",
        category: "Driver Tracker",
        date: "Feb 28, 2026",
        size: "1.7 MB",
        format: "PDF",
    },
    {
        id: "dt-004",
        title: "Live Route History",
        description: "Historical GPS route data and stops for all tracked drivers",
        category: "Driver Tracker",
        date: "Feb 25, 2026",
        size: "3.1 MB",
        format: "PDF",
    },
    {
        id: "dt-005",
        title: "Driver Status Overview",
        description: "Active, idle, and offline driver breakdown by date range",
        category: "Driver Tracker",
        date: "Feb 20, 2026",
        size: "0.9 MB",
        format: "PDF",
    },
    // Billings
    {
        id: "bi-001",
        title: "Payment Summary Report",
        description: "All succeeded, pending, and failed payments for the period",
        category: "Billings",
        date: "Mar 1, 2026",
        size: "1.5 MB",
        format: "PDF",
    },
    {
        id: "bi-002",
        title: "Invoice History",
        description: "Complete invoice log with numbers, customers, and amounts",
        category: "Billings",
        date: "Mar 1, 2026",
        size: "2.2 MB",
        format: "PDF",
    },
    {
        id: "bi-003",
        title: "Revenue Analysis",
        description: "Monthly revenue breakdown by payment status and source",
        category: "Billings",
        date: "Feb 28, 2026",
        size: "1.8 MB",
        format: "PDF",
    },
    {
        id: "bi-004",
        title: "Driver Payout Report",
        description: "All driver payouts processed via Stripe Connect",
        category: "Billings",
        date: "Feb 25, 2026",
        size: "1.1 MB",
        format: "PDF",
    },
    {
        id: "bi-005",
        title: "Outstanding Payments",
        description: "Overdue and pending invoices with customer contact details",
        category: "Billings",
        date: "Feb 20, 2026",
        size: "0.8 MB",
        format: "PDF",
    },
]

// ─── Category badge classes (light + dark) ────────────────────────────────────

const BADGE_CLASS: Record<ReportCategory, string> = {
    Transportation:
        "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    "Driver Tracker":
        "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    Billings:
        "bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
}

const TABS: TabValue[] = ["ALL", "Transportation", "Driver Tracker", "Billings"]

// ─── Tab Icon ─────────────────────────────────────────────────────────────────

function TabIcon({ tab }: { tab: TabValue }) {
    if (tab === "ALL") return <CheckSquare className="size-3.5" />
    if (tab === "Transportation") return <Truck className="size-3.5" />
    if (tab === "Driver Tracker") return <MapPin className="size-3.5" />
    return <CreditCard className="size-3.5" />
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
    const [activeTab, setActiveTab] = React.useState<TabValue>("ALL")
    const [selected, setSelected] = React.useState<Set<string>>(new Set())

    const filtered = React.useMemo(() => {
        if (activeTab === "ALL") return REPORTS
        return REPORTS.filter((r) => r.category === activeTab)
    }, [activeTab])

    const counts: Record<ReportCategory, number> = {
        Transportation: 0,
        "Driver Tracker": REPORTS.filter((r) => r.category === "Driver Tracker").length,
        Billings: REPORTS.filter((r) => r.category === "Billings").length,
    }

    const isAllSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id))
    const selectedCount = selected.size

    function toggleSelect(id: string) {
        setSelected((prev) => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    function toggleSelectAll() {
        setSelected((prev) => {
            const next = new Set(prev)
            if (isAllSelected) {
                filtered.forEach((r) => next.delete(r.id))
            } else {
                filtered.forEach((r) => next.add(r.id))
            }
            return next
        })
    }

    function handlePdf() {
        const picks = REPORTS.filter((r) => selected.has(r.id))
        if (picks.length === 0) return toast.info("Select at least one report to download.")
        if (picks.length === 1) return toast.success(`Downloading "${picks[0].title}" as PDF…`)
        toast.info("Select only 1 report to download as PDF. Use ZIP for multiple.")
    }

    function handleZip() {
        const picks = REPORTS.filter((r) => selected.has(r.id))
        if (picks.length < 2) return toast.info("Select 2 or more reports to download as ZIP.")
        toast.success(`Downloading ${picks.length} reports as ZIP…`)
    }

    return (
        <div className="p-4 sm:p-6 space-y-5 min-h-screen">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                        Reports Dashboard
                    </h1>
                    <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                        View, filter, and download reports across all categories
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-xs sm:text-sm border-border"
                        onClick={handlePdf}
                        disabled={selectedCount === 0}
                    >
                        <FileText className="size-3.5 sm:size-4" />
                        PDF
                    </Button>
                    <Button
                        size="sm"
                        className="gap-2 text-xs sm:text-sm"
                        onClick={handleZip}
                        disabled={selectedCount < 2}
                    >
                        <Archive className="size-3.5 sm:size-4" />
                        ZIP
                    </Button>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="border-b border-border">
                <div className="flex">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                activeTab === tab
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <TabIcon tab={tab} />
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Stats bar ── */}
            <Card className="border-border shadow-sm">
                <CardContent className="px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-6">
                            <StatItem label="Total Reports" value={REPORTS.length} />
                            <div className="w-px h-8 bg-border" />
                            <StatItem label="Selected" value={selectedCount} highlight />
                            <div className="w-px h-8 bg-border hidden sm:block" />
                            <StatItem label="Transportation" value={counts["Transportation"]} muted />
                            <StatItem label="Driver Tracker" value={counts["Driver Tracker"]} muted />
                            <StatItem label="Billings" value={counts["Billings"]} muted />
                        </div>
                        <button
                            onClick={toggleSelectAll}
                            className="text-sm font-medium text-primary hover:underline underline-offset-2 transition-colors"
                        >
                            {isAllSelected ? "Deselect All" : "Select All"}
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* ── Report Cards Grid ── */}
            {filtered.length === 0 ? (
                <EmptyState tab={activeTab} />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((report) => (
                        <ReportCard
                            key={report.id}
                            report={report}
                            isSelected={selected.has(report.id)}
                            onToggle={() => toggleSelect(report.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Stat Item ────────────────────────────────────────────────────────────────

function StatItem({
    label,
    value,
    highlight,
    muted,
}: {
    label: string
    value: number
    highlight?: boolean
    muted?: boolean
}) {
    return (
        <div className="flex flex-col">
            <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
            <span
                className={`text-xl font-bold leading-tight ${
                    highlight
                        ? "text-primary"
                        : muted
                        ? "text-muted-foreground"
                        : "text-foreground"
                }`}
            >
                {value}
            </span>
        </div>
    )
}

// ─── Report Card ──────────────────────────────────────────────────────────────

function ReportCard({
    report,
    isSelected,
    onToggle,
}: {
    report: Report
    isSelected: boolean
    onToggle: () => void
}) {
    return (
        <div
            onClick={onToggle}
            className={`relative rounded-xl border shadow-sm cursor-pointer transition-all duration-150 p-5 space-y-4 group bg-card ${
                isSelected
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50 hover:shadow-md"
            }`}
        >
            {/* Checkbox */}
            <div className="absolute top-3.5 right-3.5">
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={onToggle}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>

            {/* Icon */}
            <div className="size-11 bg-muted rounded-lg flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors border border-border">
                <FileText className="size-5" />
            </div>

            {/* Title & Description */}
            <div className="space-y-1 pr-6">
                <h3 className="font-bold text-sm text-foreground leading-snug">{report.title}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {report.description}
                </p>
            </div>

            {/* Category Badge */}
            <Badge variant="outline" className={`text-[10px] font-semibold px-2 py-0.5 ${BADGE_CLASS[report.category]}`}>
                {report.category}
            </Badge>

            {/* Meta */}
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    {report.date}
                </span>
                <span className="flex items-center gap-1">
                    <HardDrive className="size-3" />
                    {report.size}
                </span>
                <span className="font-semibold">• {report.format}</span>
            </div>

            {/* Per-card download (hover, only when not selected) */}
            {!isSelected && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        toast.success(`Downloading "${report.title}" as PDF…`)
                    }}
                    className="absolute bottom-3.5 right-3.5 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary"
                >
                    <Download className="size-4" />
                </button>
            )}
        </div>
    )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: TabValue }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <div className="size-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <FileText className="size-6" />
            </div>
            <div>
                <p className="font-semibold text-foreground text-sm">No reports yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    {tab === "Transportation"
                        ? "Transportation reports are coming soon. Your teammate is working on this section."
                        : `No reports found under ${tab}.`}
                </p>
            </div>
        </div>
    )
}
