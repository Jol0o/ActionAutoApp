"use client"

import * as React from "react"
import { Truck, Search, Menu, Filter, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ShippingQuoteModal } from "@/components/shipping-quote-modal"
import { QuoteResultModal } from "@/components/QuoteResultModal"
import { TransportationSidebar } from "@/components/TransportationSidebar"
import { ShipmentCard } from "@/components/ShipmentCard"
import { QuoteCard } from "@/components/QuoteCard"
import { useTransportationData } from "@/hooks/useTransportationData"
import { useAlert } from "@/components/AlertDialog"
import { Quote, Shipment } from "@/types/transportation"

export default function TransportationPage() {
    const [activeTab, setActiveTab] = React.useState("shipments")
    const [searchQuery, setSearchQuery] = React.useState("")
    const [selectedStatus, setSelectedStatus] = React.useState("all")
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)
    const [isQuoteModalOpen, setIsQuoteModalOpen] = React.useState(false)
    const [isQuoteResultModalOpen, setIsQuoteResultModalOpen] = React.useState(false)
    const [calculatedQuote, setCalculatedQuote] = React.useState<Quote | null>(null)

    const { showAlert, AlertComponent } = useAlert()

    const {
        isLoading,
        error,
        shipments,
        quotes,
        vehicles,
        stats,
        fetchData,
        handleCalculateQuote,
        handleCreateShipment,
        handleDeleteQuote,
        handleDeleteShipment,
        handleUpdateQuote,
        handleUpdateShipment
    } = useTransportationData()

    React.useEffect(() => {
        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

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
                return (
                    quote?.firstName?.toLowerCase().includes(query) ||
                    quote?.lastName?.toLowerCase().includes(query) ||
                    quote?.vin?.toLowerCase().includes(query) ||
                    quote?.stockNumber?.toLowerCase().includes(query) ||
                    s.trackingNumber?.toLowerCase().includes(query)
                )
            })
        }

        return filtered
    }, [shipments, selectedStatus, searchQuery])

    if (error && !isLoading && vehicles.length === 0) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-border">
                    <CardContent className="p-6 text-center">
                        <h3 className="text-lg font-medium text-destructive mb-2">Error Loading Data</h3>
                        <p className="text-sm text-muted-foreground mb-4">{error}</p>
                        <Button onClick={fetchData} className="bg-green-500 hover:bg-green-600 text-white">
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <AlertComponent />
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
                                className="hidden xs:flex gap-1 sm:gap-2 text-[10px] sm:text-xs h-7 sm:h-9 px-2 sm:px-4 border-border"
                                onClick={() => setActiveTab("drafts")}
                            >
                                <span>QUOTES</span>
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
                                placeholder="Search by name, VIN, stock, or tracking number..."
                                className="pl-8 sm:pl-10 w-full text-sm h-8 sm:h-10 bg-background border-border text-foreground"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
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
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                />

                {/* Main Content */}
                <div className="flex-1 p-3 sm:p-4 md:p-6 bg-background">
                    {activeTab === "shipments" ? (
                        isLoading ? (
                            <Card className="border-border">
                                <CardContent className="p-12 text-center">
                                    <p className="text-muted-foreground">Loading shipments...</p>
                                </CardContent>
                            </Card>
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
                                {filteredShipments.map((shipment) => (
                                    <ShipmentCard
                                        key={shipment._id}
                                        shipment={shipment}
                                        onDelete={handleDeleteShipment}
                                        onUpdate={handleUpdateShipment}
                                    />
                                ))}
                            </div>
                        )
                    ) : (
                        <div className="space-y-3 sm:space-y-4">
                            {quotes.length === 0 ? (
                                <Card className="border-border">
                                    <CardContent className="p-12 text-center">
                                        <h3 className="text-lg font-medium text-foreground mb-2">No Quotes Found</h3>
                                        <p className="text-sm text-muted-foreground mb-6">Create a new quote to get started.</p>
                                        <Button
                                            className="bg-green-500 hover:bg-green-600 text-white"
                                            onClick={() => setIsQuoteModalOpen(true)}
                                        >
                                            Create Quote
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                quotes.map((quote) => (
                                    <QuoteCard
                                        key={quote._id}
                                        quote={quote}
                                        onCreateShipment={handleCreateShipment}
                                        onDelete={handleDeleteQuote}
                                        onUpdate={handleUpdateQuote}
                                    />
                                ))
                            )}
                        </div>
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