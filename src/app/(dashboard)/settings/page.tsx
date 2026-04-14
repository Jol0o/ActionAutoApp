"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import {
    FileText,
    Settings as SettingsIcon,
    Users,
    MapPin,
    Shield,
    Zap,
    Bell,
    CreditCard,
    Download,
    Share2,
    Trash2,
    Printer,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { AlertDialog } from "@/components/AlertDialog"
import { OrganizationMembersSettings } from "@/components/settings/org-members-settings"
import { DriverRequestsSettings } from "@/components/settings/driver-requests-settings"
import { DriverVerificationPanel } from "@/components/settings/driver-verification-panel"
import { BulkInviteDialog } from "@/components/admin/BulkInviteDialog"
import { Truck } from "lucide-react"

interface FileEntry {
    id: string
    name: string
    date: string
    size: string
    type: string
    url?: string
}

const INITIAL_FILES: FileEntry[] = [
    { id: "1", name: "Condition_Report_AA1024.pdf",           date: "12 mins ago",  size: "2.4 MB", type: "PDF" },
    { id: "2", name: "Inventory_Snapshot_Jan_14.xlsx",        date: "2 hours ago",  size: "1.1 MB", type: "XLSX" },
    { id: "3", name: "Market_Supply_Audit_Region_Utah.pdf",   date: "Yesterday",    size: "4.8 MB", type: "PDF" },
    { id: "4", name: "Recon_Efficiency_Weekly.pdf",           date: "Jan 12, 2026", size: "1.2 MB", type: "PDF" },
]

export default function UtilitiesPage() {
    const searchParams = useSearchParams();
    const defaultTab = searchParams.get('tab') || 'reports';

    const [files, setFiles] = React.useState<FileEntry[]>(INITIAL_FILES)
    const [deleteTarget, setDeleteTarget] = React.useState<FileEntry | null>(null)
    const [isDeleting, setIsDeleting] = React.useState(false)

    const handleDownload = async (file: FileEntry) => {
        toast.loading(`Preparing ${file.name}…`, { id: `dl-${file.id}` })
        try {
            let href: string
            let needsRevoke = false

            if (file.url) {
                // Fetch the real file and stream it as a blob so the browser shows Save As
                const res = await fetch(file.url)
                if (!res.ok) throw new Error("Download failed")
                const blob = await res.blob()
                href = URL.createObjectURL(blob)
                needsRevoke = true
            } else {
                // No backend URL yet — create a placeholder blob so the save dialog still opens
                const blob = new Blob([`${file.name}\n\nPlaceholder file.`], { type: "application/octet-stream" })
                href = URL.createObjectURL(blob)
                needsRevoke = true
            }

            const a = document.createElement("a")
            a.href = href
            a.download = file.name
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            if (needsRevoke) setTimeout(() => URL.revokeObjectURL(href), 10_000)

            toast.success(`${file.name} downloaded`, { id: `dl-${file.id}` })
        } catch {
            toast.error("Download failed. Please try again.", { id: `dl-${file.id}` })
        }
    }

    const handleShare = async (file: FileEntry) => {
        const shareUrl = file.url || `${window.location.origin}/reports/${file.id}`
        try {
            if (navigator.share) {
                await navigator.share({ title: file.name, url: shareUrl })
            } else {
                await navigator.clipboard.writeText(shareUrl)
                toast.success("Link copied to clipboard")
            }
        } catch {
            // User cancelled share or clipboard failed
        }
    }

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return
        setIsDeleting(true)
        try {
            // Replace with real API call when backend endpoint is available
            await new Promise((r) => setTimeout(r, 800))
            setFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id))
            toast.success(`${deleteTarget.name} deleted`)
            setDeleteTarget(null)
        } catch {
            toast.error("Failed to delete file. Please try again.")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="p-4 md:p-6 space-y-6 bg-background min-h-screen">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg sm:text-xl font-bold truncate">Action Auto Utah</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">System Administrator Settings</p>
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

            <Tabs defaultValue={defaultTab} className="w-full">
                <TabsList className="bg-card border p-1 rounded-lg h-11 w-fit mb-6">
                    <TabsTrigger value="reports" className="gap-2 text-[11px] font-bold uppercase tracking-wider px-2 md:px-6 data-[state=active]:bg-secondary shadow-none">
                        <FileText className="size-4 hidden md:block" /> Reports
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="gap-2 text-[11px] font-bold uppercase tracking-wider px-2 md:px-6 data-[state=active]:bg-secondary shadow-none">
                        <SettingsIcon className="size-4 hidden md:block" /> Settings
                    </TabsTrigger>
                    <TabsTrigger value="dealership" className="gap-2 text-[11px] font-bold uppercase tracking-wider px-2 md:px-6 data-[state=active]:bg-secondary shadow-none">
                        <MapPin className="size-4 hidden md:block" /> Organization
                    </TabsTrigger>
                    <TabsTrigger value="drivers" className="gap-2 text-[11px] font-bold uppercase tracking-wider px-2 md:px-6 data-[state=active]:bg-secondary shadow-none">
                        <Truck className="size-4 hidden md:block" /> Drivers
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
                            icon={<Shield className="size-5 text-primary" />}
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
                            {files.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <FileText className="size-8 mb-2 opacity-40" />
                                    <p className="text-sm">No files yet</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {files.map((file) => (
                                        <FileRow
                                            key={file.id}
                                            file={file}
                                            onDownload={() => handleDownload(file)}
                                            onShare={() => handleShare(file)}
                                            onDelete={() => setDeleteTarget(file)}
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <AlertDialog
                        open={!!deleteTarget}
                        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
                        type="warning"
                        title="Delete File"
                        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                        confirmText={isDeleting ? "Deleting…" : "Delete"}
                        cancelText="Cancel"
                        onConfirm={handleDeleteConfirm}
                    />
                </TabsContent>

                <TabsContent value="settings" className="m-0">
                    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">System Settings</h1>
                            <p className="text-xs sm:text-sm text-muted-foreground">Manage your dealership profile, security preferences, and global configurations.</p>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
                            {/* Settings Navigation */}
                            <div className="xl:col-span-1 space-y-2">
                                <SettingNavItem label="Account Details" icon={<Users className="size-4" />} active />
                                <SettingNavItem label="Locations & Inventory" icon={<MapPin className="size-4" />} />
                                <SettingNavItem label="Security / RBAC" icon={<Shield className="size-4" />} />
                                <SettingNavItem label="Notifications" icon={<Bell className="size-4" />} />
                                <SettingNavItem label="Integrations" icon={<Zap className="size-4" />} />
                            </div>

                            {/* Main Settings Content */}
                            <div className="xl:col-span-3 space-y-4 sm:space-y-6">
                                <Card className="border-none shadow-sm  overflow-hidden">
                                    <CardHeader>
                                        <CardTitle className="text-base sm:text-lg">Dealership Profile</CardTitle>
                                        <CardDescription className="text-xs sm:text-sm">Information about your primary dealership location.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                    </div>
                </TabsContent>

                <TabsContent value="dealership" className="m-0">
                    <Card className="border-none shadow-sm bg-card p-0 overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b py-4">
                            <CardTitle className="text-lg font-bold">Dealership Management</CardTitle>
                            <CardDescription>Manage your dealership profile, invites, and team roles.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 min-h-[400px]">
                            <div className="flex justify-end mb-4">
                                <BulkInviteDialog />
                            </div>
                            <OrganizationMembersSettings />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="drivers" className="m-0">
                    <Card className="border-none shadow-sm bg-card p-0 overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b py-4">
                            <CardTitle className="text-lg font-bold">Driver Management</CardTitle>
                            <CardDescription>Review and manage driver access requests.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 min-h-[400px] space-y-8">
                            <DriverRequestsSettings />
                            <Separator />
                            <DriverVerificationPanel />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function ReportCard({ title, description, count, icon }: { title: string, description: string, count: number, icon: React.ReactNode }) {
    return (
        <Card className="border-none shadow-sm hover:ring-1 hover:ring-primary/20 transition-all cursor-pointer bg-card p-0 md:p-4">
            <CardContent className="p-2 md:p-6">
                <div className="flex gap-2 md:items-center justify-between mb-4">
                    <div className="size-10 bg-secondary rounded-lg flex items-center justify-center border shrink-0">
                        {icon}
                    </div>
                    <Badge variant="outline" className="h-5 text-[10px] font-bold text-muted-foreground">{count} Files</Badge>
                </div>
                <h3 className="font-bold text-xs md:text-sm text-foreground mb-1">{title}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed italic">{description}</p>
            </CardContent>
        </Card>
    )
}

function FileRow({
    file,
    onDownload,
    onShare,
    onDelete,
}: {
    file: FileEntry
    onDownload: () => void
    onShare: () => void
    onDelete: () => void
}) {
    return (
        <div className="p-4 flex items-center justify-between group hover:bg-secondary transition-colors overflow-hidden">
            <div className="flex w-3/4 items-center gap-4 overflow-hidden text-clip">
                <div className="size-10 bg-secondary rounded flex items-center justify-center text-muted-foreground shrink-0">
                    <FileText className="size-5" />
                </div>
                <div>
                    <h4 className="text-sm font-bold overflow-hidden text-foreground group-hover:text-primary transition-colors text-ellipsis md:text-clip">{file.name}</h4>
                    <div className="flex items-center gap-3 mt-0.5 border-none">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{file.date}</span>
                        <span className="text-[10px] font-bold text-muted-foreground">{file.size}</span>
                        <Badge className="bg-secondary text-muted-foreground hover:bg-secondary h-4 px-1 text-[8px] border-none">{file.type}</Badge>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onDownload} title="Download">
                    <Download className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onShare} title="Share">
                    <Share2 className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onDelete} title="Delete">
                    <Trash2 className="size-4" />
                </Button>
            </div>
        </div>
    )
}

function SettingNavItem({ label, icon, active }: { label: string, icon: React.ReactNode, active?: boolean }) {
    return (
        <button
            className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${active ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-secondary'
                }`}
        >
            <div className={`transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                {icon}
            </div>
            {label}
        </button>
    )
}
