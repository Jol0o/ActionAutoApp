"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Truck, Search, Menu, Plus, RefreshCw, X, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ShippingQuoteModal } from "@/components/shipping-quote-modal"
import { QuoteResultModal } from "@/components/QuoteResultModal"
import { TransportationSidebar } from "@/components/TransportationSidebar"
import { ShipmentCard } from "@/components/ShipmentCard"
import { QuoteCard } from "@/components/QuoteCard"
import { useRouter } from "next/navigation"
import { useTransportationData, PER_PAGE_OPTIONS, PerPageOption } from "@/hooks/useTransportationData"
import { useLoadsData } from "@/hooks/useLoadsData"
import { useAlert, AlertDialog } from "@/components/AlertDialog"
import { Quote } from "@/types/transportation"
import { LoadCard } from "@/components/LoadCard"
import { ChevronLeft, ChevronRight } from "lucide-react"

// ── Pagination UI ──────────────────────────────────────────────────────────────

function getPageNumbers(current: number, total: number): (number | "…")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const pages: (number | "…")[] = [1]
    if (current > 3) pages.push("…")
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i)
    if (current < total - 2) pages.push("…")
    if (total > 1) pages.push(total)
    return pages
}

// Per-page selector shown at the top of each list
function PerPageSelector({
    limit,
    total,
    onLimitChange,
}: {
    limit: PerPageOption
    total: number
    onLimitChange: (l: PerPageOption) => void
}) {
    return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Per page:</span>
            <select
                value={limit}
                onChange={(e) => onLimitChange(Number(e.target.value) as PerPageOption)}
                className="h-7 rounded border border-border bg-background text-xs text-foreground px-2 pr-6 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-green-500"
            >
                {PER_PAGE_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                ))}
            </select>
            {total > 0 && (
                <span className="text-muted-foreground/60">({total} total)</span>
            )}
        </div>
    )
}

// Centered page-number navigation shown at the bottom of each list
function PaginationBar({
    page,
    pagination,
    onPageChange,
}: {
    page: number
    pagination: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean } | null
    onPageChange: (p: number) => void
}) {
    if (!pagination || pagination.totalPages <= 1) return null
    const totalPages = pagination.totalPages

    return (
        <div className="flex justify-center pt-2">
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    className="h-7 w-7 flex items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <ChevronLeft className="size-3.5" />
                </button>
                {getPageNumbers(page, totalPages).map((p, i) =>
                    p === "…" ? (
                        <span key={`ellipsis-${i}`} className="w-7 text-center text-xs text-muted-foreground">…</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p as number)}
                            className={`h-7 w-7 rounded text-xs font-medium transition-colors ${
                                page === p
                                    ? "bg-green-500 text-white"
                                    : "border border-border text-muted-foreground hover:bg-muted"
                            }`}
                        >
                            {p}
                        </button>
                    )
                )}
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="h-7 w-7 flex items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <ChevronRight className="size-3.5" />
                </button>
            </div>
        </div>
    )
}

export default function TransportationPage() {
    return (
        <React.Suspense fallback={null}>
            <TransportationPageInner />
        </React.Suspense>
    )
}

function TransportationPageInner() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [activeTab, setActiveTab] = React.useState("shipments")
    const [searchQuery, setSearchQuery] = React.useState(searchParams.get("search") || "")
    const [selectedStatus, setSelectedStatus] = React.useState("all")
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)
    const [isQuoteModalOpen, setIsQuoteModalOpen] = React.useState(false)
    const [isQuoteResultModalOpen, setIsQuoteResultModalOpen] = React.useState(false)
    const [calculatedQuote, setCalculatedQuote] = React.useState<Quote | null>(null)

    const { showAlert, alert, hideAlert } = useAlert()

    const {
        isLoading,
        isSilentRefreshing,
        error,
        shipments,
        shipmentsPagination,
        shipmentsPage,
        shipmentsLimit,
        changeShipmentsPage,
        changeShipmentsLimit,
        quotes,
        quotesPagination,
        quotesPage,
        quotesLimit,
        changeQuotesPage,
        changeQuotesLimit,
        vehicles,
        stats,
        hasNewEntries,
        dismissNewEntries,
        fetchData,
        handleCalculateQuote,
        handleCreateShipment,
        handleDeleteQuote,
        handleDeleteShipment,
        handleUpdateQuote,
        handleUpdateShipment
    } = useTransportationData()

    const {
        loads,
        pagination: loadsPagination,
        page: loadsPage,
        limit: loadsLimit,
        changePage: changeLoadsPage,
        changeLimit: changeLoadsLimit,
        stats: loadStats,
        isLoading: isLoadsLoading,
        error: loadsError,
        fetchLoads,
        handleDeleteLoad,
        deletingId,
    } = useLoadsData(
        activeTab === "load-board" ? searchQuery : undefined,
        activeTab === "load-board" ? selectedStatus : undefined,
    )

    // Refetch when tab becomes visible again (covers navigation back from create-load page
    // and browser tab switching) — catches socket events missed while page was hidden
    React.useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                fetchData({ silent: true })
                fetchLoads()
            }
        }
        document.addEventListener('visibilitychange', handleVisibility)
        return () => document.removeEventListener('visibilitychange', handleVisibility)
    }, [fetchData, fetchLoads])

    // Auto-dismiss new entries banner after 8 seconds
    React.useEffect(() => {
        if (!hasNewEntries) return
        const timer = setTimeout(() => dismissNewEntries(), 8000)
        return () => clearTimeout(timer)
    }, [hasNewEntries, dismissNewEntries])

const handleCalculateQuoteWrapper = async (formData: any) => {
        try {
            const quote = await handleCalculateQuote(formData)
            setCalculatedQuote(quote)
            setIsQuoteModalOpen(false)
            setIsQuoteResultModalOpen(true)
        } catch (error) {
            showAlert({
                type: "error",
                title: "Error Creating Quote",
                message: error instanceof Error ? error.message : "Failed to create quote. Please try again."
            })
        }
    }

    const handleCreateShipmentFromQuote = async () => {
        if (!calculatedQuote) return

        try {
            await handleCreateShipment(calculatedQuote._id)
            setIsQuoteResultModalOpen(false)
            setCalculatedQuote(null)
            setActiveTab("shipments")
            showAlert({
                type: "success",
                title: "Shipment Created",
                message: "The shipment has been created successfully and is now available in the shipments list."
            })
        } catch (error) {
            showAlert({
                type: "error",
                title: "Error Creating Shipment",
                message: error instanceof Error ? error.message : "Failed to create shipment. Please try again."
            })
        }
    }

    const handleViewQuoteDetails = () => {
        setIsQuoteResultModalOpen(false)
        setCalculatedQuote(null)
        setActiveTab("drafts")
    }

    const filteredShipments = React.useMemo(() => {
        let filtered = shipments

        if (selectedStatus !== 'all') {
            filtered = filtered.filter(s => s.status === selectedStatus)
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(s => {
                const quote = s.quoteId
                const preserved = s.preservedQuoteData
                return (
                    quote?.firstName?.toLowerCase().includes(query) ||
                    quote?.lastName?.toLowerCase().includes(query) ||
                    quote?.vin?.toLowerCase().includes(query) ||
                    quote?.stockNumber?.toLowerCase().includes(query) ||
                    preserved?.firstName?.toLowerCase().includes(query) ||
                    preserved?.lastName?.toLowerCase().includes(query) ||
                    preserved?.vin?.toLowerCase().includes(query) ||
                    preserved?.stockNumber?.toLowerCase().includes(query) ||
                    s.trackingNumber?.toLowerCase().includes(query)
                )
            })
        }

        return filtered
    }, [shipments, selectedStatus, searchQuery])

    const filteredQuotes = React.useMemo(() => {
        if (!searchQuery) return quotes
        const query = searchQuery.toLowerCase()
        return quotes.filter(q =>
            q.firstName?.toLowerCase().includes(query) ||
            q.lastName?.toLowerCase().includes(query) ||
            q.vin?.toLowerCase().includes(query) ||
            q.stockNumber?.toLowerCase().includes(query) ||
            q.email?.toLowerCase().includes(query)
        )
    }, [quotes, searchQuery])


    if (error && !isLoading && shipments.length === 0 && quotes.length === 0) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-border">
                    <CardContent className="p-6 text-center">
                        <h3 className="text-lg font-medium text-destructive mb-2">Error Loading Data</h3>
                        <p className="text-sm text-muted-foreground mb-4">{error}</p>
                        <Button onClick={() => fetchData()} className="bg-green-500 hover:bg-green-600 text-white">
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <AlertDialog {...alert} onOpenChange={hideAlert} />

            {/* New entries banner */}
            {hasNewEntries && (
                <div className="bg-green-50 dark:bg-green-950 border-b border-green-200 dark:border-green-800 px-3 sm:px-4 md:px-6 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0"></span>
                        New entries detected — the list has been refreshed automatically.
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900"
                        onClick={dismissNewEntries}
                    >
                        <X className="w-3.5 h-3.5" />
                    </Button>
                </div>
            )}

            {/* Header */}
            <div className="bg-card border-b border-border px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden h-8 w-8 -ml-1 border-none hover:bg-secondary"
                                onClick={() => setIsSidebarOpen(true)}
                            >
                                <Menu className="size-5" />
                            </Button>
                            <div className="bg-green-500 p-1.5 sm:p-2 rounded shrink-0">
                                <Truck className="size-4 sm:size-5 text-white" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-foreground truncate">
                                    Transport
                                </h1>
                                {vehicles.length > 0 && (
                                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                        {vehicles.length} vehicles
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-1.5 sm:gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex gap-1 sm:gap-2 text-[10px] sm:text-xs h-7 sm:h-9 px-2 sm:px-4 border-border"
                                onClick={() => {
                                    const params = new URLSearchParams()
                                    if (searchQuery) params.set("search", searchQuery)
                                    if (selectedStatus !== "all") params.set("status", selectedStatus)
                                    if (activeTab !== "shipments") params.set("tab", activeTab)
                                    const query = params.toString()
                                    router.push(`/transportation/create-load${query ? `?${query}` : ""}`)
                                }}
                            >
                                <Plus className="size-3.5 sm:size-4" />
                                <span className="hidden sm:inline">CREATE LOAD</span>
                            </Button>
                            <Button
                                size="sm"
                                className="gap-1 sm:gap-2 bg-green-500 hover:bg-green-600 text-white text-[10px] sm:text-xs h-7 sm:h-9 px-2 sm:px-4"
                                onClick={() => setIsQuoteModalOpen(true)}
                            >
                                <Plus className="size-3.5 sm:size-4" />
                                <span className="hidden xxs:inline">NEW QUOTE</span>
                                <span className="xxs:hidden">NEW</span>
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 size-3.5 sm:size-4 text-muted-foreground" />
                            <Input
                                placeholder={
                                    activeTab === "load-board"
                                        ? "Search by load #, city, state, make, model, or VIN..."
                                        : "Search by name, VIN, stock, or tracking number..."
                                }
                                className="pl-8 sm:pl-10 w-full text-sm h-8 sm:h-10 bg-background border-border text-foreground"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Live status bar */}
                    <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground border-t border-border pt-2">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                Live
                            </span>
                            {isSilentRefreshing && (
                                <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                                    · <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Refreshing
                                </span>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 gap-1 text-[10px] sm:text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => fetchData()}
                            disabled={isLoading || isSilentRefreshing}
                        >
                            <RefreshCw className={`w-3 h-3 ${isLoading || isSilentRefreshing ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── Mobile Tab Bar (always visible on small screens) ── */}
            <div className="lg:hidden border-b border-border bg-card px-3">
                <div className="flex">
                    {([
                        { key: "shipments",  label: "SHIPS" },
                        { key: "drafts",     label: "DRAFTS" },
                        { key: "load-board", label: "LOADS" },
                    ] as const).map(t => (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className={`flex-1 py-2.5 text-[11px] font-semibold tracking-wide transition-colors border-b-2 ${
                                activeTab === t.key
                                    ? "border-green-500 text-green-600 dark:text-green-400"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex relative">
                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                <TransportationSidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    selectedStatus={selectedStatus}
                    setSelectedStatus={setSelectedStatus}
                    stats={stats}
                    loadStats={loadStats}
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                />

                {/* Main Content */}
                <div className="flex-1 p-3 sm:p-4 md:p-6 bg-background">
                    {activeTab === "load-board" ? (
                        loadsError && !isLoadsLoading && loads.length === 0 ? (
                            <Card className="border-border">
                                <CardContent className="p-6 sm:p-8 md:p-12 text-center">
                                    <Truck className="size-10 sm:size-12 md:size-16 text-muted-foreground/50 mx-auto mb-3 sm:mb-4" />
                                    <h3 className="text-sm sm:text-base md:text-lg font-medium text-destructive mb-2">
                                        Failed to Load Loads
                                    </h3>
                                    <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 px-2 sm:px-4">
                                        {loadsError}
                                    </p>
                                    <Button
                                        className="bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm h-8 sm:h-9"
                                        onClick={fetchLoads}
                                    >
                                        Retry
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : isLoadsLoading ? (
                            <div className="space-y-3 sm:space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <Card key={i} className="border-border overflow-hidden">
                                        <CardContent className="p-0">
                                            <div className="h-1 w-full bg-muted" />
                                            <div className="p-4 sm:p-5 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-2">
                                                        <Skeleton className="h-4 w-32" />
                                                        <Skeleton className="h-3 w-24" />
                                                    </div>
                                                    <Skeleton className="h-6 w-16 rounded-full" />
                                                </div>
                                                <div className="grid grid-cols-[1fr_auto_1fr] gap-2">
                                                    <Skeleton className="h-16 rounded-lg" />
                                                    <Skeleton className="h-4 w-8 rounded" />
                                                    <Skeleton className="h-16 rounded-lg" />
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <Skeleton className="h-14 rounded-md" />
                                                    <Skeleton className="h-14 rounded-md" />
                                                    <Skeleton className="h-14 rounded-md" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : loads.length === 0 ? (
                            <Card className="border-border">
                                <CardContent className="p-6 sm:p-8 md:p-12 text-center">
                                    <Truck className="size-10 sm:size-12 md:size-16 text-muted-foreground/50 mx-auto mb-3 sm:mb-4" />
                                    <h3 className="text-sm sm:text-base md:text-lg font-medium text-foreground mb-2">
                                        No Loads Found
                                    </h3>
                                    <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 px-2 sm:px-4">
                                        {searchQuery
                                            ? "No loads match your search criteria."
                                            : "No loads have been posted yet. Create a load to get started."}
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                        <Button
                                            className="bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm h-8 sm:h-9"
                                            onClick={() => router.push("/transportation/create-load")}
                                        >
                                            Create Load
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="text-xs sm:text-sm h-8 sm:h-9"
                                            onClick={fetchLoads}
                                        >
                                            Refresh
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3 sm:space-y-4">
                                <PerPageSelector
                                    limit={loadsLimit}
                                    total={loadsPagination?.total ?? 0}
                                    onLimitChange={changeLoadsLimit}
                                />
                                {loads.map((load) => (
                                    <LoadCard
                                        key={load._id}
                                        load={load}
                                        onDelete={handleDeleteLoad}
                                        isDeleting={deletingId === load._id}
                                    />
                                ))}
                                <PaginationBar
                                    page={loadsPage}
                                    pagination={loadsPagination}
                                    onPageChange={changeLoadsPage}
                                />
                            </div>
                        )
                    ) : activeTab === "shipments" ? (
                        isLoading ? (
                            <div className="space-y-3 sm:space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <Card key={i} className="border-border overflow-hidden">
                                        <CardContent className="p-0">
                                            <Skeleton className="w-full h-40 sm:h-56 md:h-64 rounded-none" />
                                            <div className="p-4 sm:p-5 space-y-3">
                                                <div className="flex justify-between">
                                                    <div className="space-y-2">
                                                        <Skeleton className="h-4 w-40" />
                                                        <Skeleton className="h-3 w-28" />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Skeleton className="h-8 w-16 rounded-md" />
                                                        <Skeleton className="h-8 w-16 rounded-md" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <Skeleton className="h-20 rounded-lg" />
                                                    <Skeleton className="h-20 rounded-lg" />
                                                </div>
                                                <Skeleton className="h-40 w-full rounded-lg" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : filteredShipments.length === 0 ? (
                            <Card className="border-border">
                                <CardContent className="p-6 sm:p-8 md:p-12 text-center">
                                    <Truck className="size-10 sm:size-12 md:size-16 text-muted-foreground/50 mx-auto mb-3 sm:mb-4" />
                                    <h3 className="text-sm sm:text-base md:text-lg font-medium text-foreground mb-2">
                                        No Shipments Found
                                    </h3>
                                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-4 sm:mb-6 px-2 sm:px-4">
                                        {searchQuery
                                            ? "No shipments match your search criteria."
                                            : "You don't have any shipments yet. Start by creating a quote."}
                                    </p>
                                    <Button
                                        className="bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm h-8 sm:h-9 md:h-10"
                                        onClick={() => setIsQuoteModalOpen(true)}
                                    >
                                        Create New Quote
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3 sm:space-y-4">
                                <PerPageSelector
                                    limit={shipmentsLimit}
                                    total={shipmentsPagination?.total ?? 0}
                                    onLimitChange={changeShipmentsLimit}
                                />
                                {filteredShipments.map((shipment) => (
                                    <ShipmentCard
                                        key={shipment._id}
                                        shipment={shipment}
                                        onDelete={handleDeleteShipment}
                                        onUpdate={handleUpdateShipment}
                                    />
                                ))}
                                <PaginationBar
                                    page={shipmentsPage}
                                    pagination={shipmentsPagination}
                                    onPageChange={changeShipmentsPage}
                                />
                            </div>
                        )
                    ) : (
                        isLoading ? (
                            <div className="space-y-3 sm:space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <Card key={i} className="border-border overflow-hidden">
                                        <CardContent className="p-0">
                                            <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-100 dark:divide-gray-700">
                                                <div className="w-full lg:w-1/3 p-4 sm:p-6 space-y-3">
                                                    <Skeleton className="h-4 w-24" />
                                                    <Skeleton className="h-40 w-full rounded-lg" />
                                                    <Skeleton className="h-4 w-3/4" />
                                                    <Skeleton className="h-4 w-1/2" />
                                                </div>
                                                <div className="w-full lg:w-2/3 p-4 sm:p-6 space-y-4">
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-24 w-full rounded-lg" />
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <Skeleton className="h-16 rounded-lg" />
                                                        <Skeleton className="h-16 rounded-lg" />
                                                        <Skeleton className="h-16 rounded-lg" />
                                                    </div>
                                                    <Skeleton className="h-20 w-full rounded-lg" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : filteredQuotes.length === 0 ? (
                            <Card className="border-border">
                                <CardContent className="p-6 sm:p-8 md:p-12 text-center">
                                    <Package className="size-10 sm:size-12 md:size-16 text-muted-foreground/50 mx-auto mb-3 sm:mb-4" />
                                    <h3 className="text-sm sm:text-base md:text-lg font-medium text-foreground mb-2">
                                        No Drafts Found
                                    </h3>
                                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-4 sm:mb-6 px-2 sm:px-4">
                                        {searchQuery
                                            ? "No quotes match your search criteria."
                                            : "You don't have any draft quotes yet. Create a new quote to get started."}
                                    </p>
                                    <Button
                                        className="bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm h-8 sm:h-9 md:h-10"
                                        onClick={() => setIsQuoteModalOpen(true)}
                                    >
                                        Create New Quote
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3 sm:space-y-4">
                                <PerPageSelector
                                    limit={quotesLimit}
                                    total={quotesPagination?.total ?? 0}
                                    onLimitChange={changeQuotesLimit}
                                />
                                {filteredQuotes.map((quote) => (
                                    <QuoteCard
                                        key={quote._id}
                                        quote={quote}
                                        onCreateShipment={handleCreateShipment}
                                        onDelete={handleDeleteQuote}
                                        onUpdate={handleUpdateQuote}
                                    />
                                ))}
                                <PaginationBar
                                    page={quotesPage}
                                    pagination={quotesPagination}
                                    onPageChange={changeQuotesPage}
                                />
                            </div>
                        )
                    )}
                </div>
            </div>

            <ShippingQuoteModal
                open={isQuoteModalOpen}
                onOpenChange={setIsQuoteModalOpen}
                vehicles={vehicles}
                onCalculate={handleCalculateQuoteWrapper}
            />

            <QuoteResultModal
                open={isQuoteResultModalOpen}
                onOpenChange={setIsQuoteResultModalOpen}
                quote={calculatedQuote}
                onCreateShipment={handleCreateShipmentFromQuote}
                onViewQuote={handleViewQuoteDetails}
            />
        </div>
    )
}
