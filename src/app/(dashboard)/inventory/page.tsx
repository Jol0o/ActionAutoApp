"use client"

import * as React from "react"
import { ChevronDown, RefreshCw } from "lucide-react"
import { CarInventoryCard } from "@/components/car-inventory-card"
import { PremiumVehicleCard } from "@/components/customer/PremiumVehicleCard"
import { ShippingQuoteModal } from "@/components/shipping-quote-modal"
import { VehicleDetailsModal } from "@/components/vehicle-details-modal"
import { VehicleInquiryModal } from "@/components/vehicle-inquiry-modal"
import { FinanceApplicationModal } from "@/components/finance-application-modal"
import type { Vehicle, ShippingQuoteFormData } from "@/types/inventory"
import { apiClient } from "@/lib/api-client"
import { AxiosError } from "axios"
import { InventoryFilters } from "@/components/inventory-filters"
import { InventoryPagination } from "@/components/inventory-pagination"
import { useAuth } from "@/providers/AuthProvider"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useInventoryActions } from "@/hooks/useInventoryActions"
import { LayoutGrid, Table as TableIcon } from "lucide-react"

type SortOption =
    | "price-asc"
    | "price-desc"
    | "mileage-asc"
    | "mileage-desc"
    | "year-desc"
    | "createdAt-desc"
    | "year-asc"
    | "make-asc"
    | "make-desc"
    | "model-asc"
    | "model-desc"
    | "stockNumber-asc"
    | "stockNumber-desc"
    | "location-asc"
    | "location-desc"
    | "age-asc"
    | "age-desc"
    | "status-asc"
    | "status-desc"
    | "created-asc"
    | "created-desc"
    | "recent-asc"
    | "recent-desc"
    | "cost-asc"
    | "cost-desc"


function InventoryContent() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { getToken } = useAuth()

    const [vehicles, setVehicles] = React.useState<Vehicle[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const [isPremiumView, setIsPremiumView] = React.useState(true)
    const [shippingRates, setShippingRates] = React.useState<Record<string, number>>({})

    const {
        selectedVehicle,
        openModals,
        setDetailsOpen,
        setInquiryOpen,
        setFinanceOpen,
        setShippingOpen,
        handleVehicleClick,
        handleCheckAvailability,
        handleApplyNow,
        handleCallUs,
        handleVideo,
        handleGetQuote
    } = useInventoryActions()

    // Pagination State
    const [page, setPage] = React.useState(Number(searchParams.get("page")) || 1)
    const [limit, setLimit] = React.useState(Number(searchParams.get("limit")) || 12)
    const [total, setTotal] = React.useState(0)
    const [totalPages, setTotalPages] = React.useState(1)

    // Filter State
    const [filters, setFilters] = React.useState<any>({
        search: searchParams.get("search") || "",
        make: searchParams.get("make") || undefined,
        model: searchParams.get("model") || undefined,
        status: searchParams.get("status") || "all",
        year: searchParams.get("year") ? Number(searchParams.get("year")) : undefined,
        minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
        maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
        minMileage: searchParams.get("minMileage") ? Number(searchParams.get("minMileage")) : undefined,
        maxMileage: searchParams.get("maxMileage") ? Number(searchParams.get("maxMileage")) : undefined,
        bodyStyle: searchParams.get("bodyStyle") || undefined,
        location: searchParams.get("location") || undefined,
        sortBy: searchParams.get("sortBy") || "make",
        sortOrder: searchParams.get("sortOrder") || "asc"
    })

    // Debounced search term
    const [debouncedSearch, setDebouncedSearch] = React.useState(filters.search)

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(filters.search)
        }, 500)
        return () => clearTimeout(timer)
    }, [filters.search])

    React.useEffect(() => {
        const params = new URLSearchParams()
        params.set("page", page.toString())
        params.set("limit", limit.toString())

        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== "" && filters[key] !== "all") {
                params.set(key, filters[key])
            }
        })

        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        fetchVehicles()
    }, [page, limit, debouncedSearch, filters.make, filters.model, filters.status, filters.year, filters.minPrice, filters.maxPrice, filters.minMileage, filters.maxMileage, filters.sortBy, filters.sortOrder])

    const fetchVehicles = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const token = await getToken()
            const response = await apiClient.get('/api/vehicles', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page,
                    limit,
                    ...filters,
                    search: debouncedSearch,
                }
            })

            const responseData = response.data?.data || response.data
            setVehicles(responseData.vehicles || [])
            setTotal(responseData.pagination?.total || 0)
            setTotalPages(responseData.pagination?.totalPages || 1)

        } catch (err) {
            console.error('[Inventory] Error fetching vehicles:', err)
            const axiosError = err as AxiosError
            if (axiosError.code !== "ERR_CANCELED") {
                setError((axiosError.response?.data as any)?.message || axiosError.message || 'Failed to load vehicles')
            }
        } finally {
            setIsLoading(false)
        }
    }

    // Auto-modal logic removed as we now use dedicated vehicle pages

    const handleFilterChange = (key: string, value: any) => {
        setFilters((prev: any) => ({ ...prev, [key]: value }))
        setPage(1)
    }

    const handleBulkFilterChange = (newFilters: any) => {
        setFilters((prev: any) => ({ ...prev, ...newFilters }))
        setPage(1)
    }

    const handleClearFilters = () => {
        setFilters({
            search: "",
            make: undefined,
            model: undefined,
            status: "all",
            year: undefined,
            minPrice: undefined,
            maxPrice: undefined,
            minMileage: undefined,
            maxMileage: undefined,
            bodyStyle: undefined,
            location: undefined,
            sortBy: "make",
            sortOrder: "asc"
        })
        setPage(1)
    }

    const handleSortChange = (value: SortOption) => {
        let sortBy = "createdAt"
        let sortOrder = "desc"

        switch (value) {
            case "price-asc": sortBy = "price"; sortOrder = "asc"; break;
            case "price-desc": sortBy = "price"; sortOrder = "desc"; break;
            case "mileage-asc": sortBy = "mileage"; sortOrder = "asc"; break;
            case "mileage-desc": sortBy = "mileage"; sortOrder = "desc"; break;
            case "year-desc": sortBy = "year"; sortOrder = "desc"; break;
            case "createdAt-desc": sortBy = "createdAt"; sortOrder = "desc"; break;
            case "year-asc": sortBy = "year"; sortOrder = "asc"; break;
            case "make-asc": sortBy = "make"; sortOrder = "asc"; break;
            case "make-desc": sortBy = "make"; sortOrder = "desc"; break;
            case "model-asc": sortBy = "model"; sortOrder = "asc"; break;
            case "model-desc": sortBy = "model"; sortOrder = "desc"; break;
            case "stockNumber-asc": sortBy = "stockNumber"; sortOrder = "asc"; break;
            case "stockNumber-desc": sortBy = "stockNumber"; sortOrder = "desc"; break;
            case "location-asc": sortBy = "location"; sortOrder = "asc"; break;
            case "location-desc": sortBy = "location"; sortOrder = "desc"; break;
            case "age-asc": sortBy = "age"; sortOrder = "asc"; break;
            case "age-desc": sortBy = "age"; sortOrder = "desc"; break;
            case "status-asc": sortBy = "status"; sortOrder = "asc"; break;
            case "status-desc": sortBy = "status"; sortOrder = "desc"; break;
            case "created-asc": sortBy = "created"; sortOrder = "asc"; break;
            case "created-desc": sortBy = "created"; sortOrder = "desc"; break;
            case "recent-asc": sortBy = "recent"; sortOrder = "asc"; break;
            case "recent-desc": sortBy = "recent"; sortOrder = "desc"; break;
            case "cost-asc": sortBy = "cost"; sortOrder = "asc"; break;
            case "cost-desc": sortBy = "cost"; sortOrder = "desc"; break;
        }

        setFilters((prev: any) => ({ ...prev, sortBy, sortOrder }))
    }

    const currentSortValue = React.useMemo(() => {
        if (filters.sortBy === 'price' && filters.sortOrder === 'asc') return 'price-asc';
        if (filters.sortBy === 'price' && filters.sortOrder === 'desc') return 'price-desc';
        if (filters.sortBy === 'mileage' && filters.sortOrder === 'asc') return 'mileage-asc';
        if (filters.sortBy === 'mileage' && filters.sortOrder === 'desc') return 'mileage-desc';
        if (filters.sortBy === 'year' && filters.sortOrder === 'desc') return 'year-desc';
        if (filters.sortBy === 'make' && filters.sortOrder === 'asc') return 'make-asc';
        return 'make-asc';
    }, [filters.sortBy, filters.sortOrder])

    const handleCalculateQuote = async (formData: ShippingQuoteFormData) => {
        try {
            const token = await getToken()
            const response = await apiClient.post('/api/quotes', {
                ...formData,
                toZip: formData.zipCode,
                toAddress: formData.fullAddress,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })

            const data = response.data?.data || response.data
            if (formData.vehicleId) {
                setShippingRates(prev => ({ ...prev, [formData.vehicleId!]: data.rate }))
            }

            alert(`Quote created successfully! Rate: $${data.rate}`)
            setShippingOpen(false)

        } catch (error) {
            console.error('[Quote] Error creating quote:', error)
            alert('Failed to create quote')
        }
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Inventory</h2>
                        <p className="text-destructive/80 mb-4">{error}</p>
                        <button onClick={fetchVehicles} className="inline-flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors">
                            <RefreshCw className="h-4 w-4" /> Retry Loading
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <div className="border-b bg-card sticky top-0 z-10 shadow-sm">
                <div className="max-w-8xl mx-auto px-4 py-4 space-y-4">
                    <InventoryFilters
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onBulkFilterChange={handleBulkFilterChange}
                        onClearFilters={handleClearFilters}
                    />

                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <p className="text-sm font-medium text-muted-foreground">
                                <span className="font-bold text-foreground">{total}</span> Vehicles Found
                            </p>
                            <button onClick={fetchVehicles} disabled={isLoading} className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors">
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                             <span className="text-sm font-medium text-foreground">Sort by</span>
                             <div className="relative">
                                 <select
                                     value={currentSortValue}
                                     onChange={(e) => handleSortChange(e.target.value as SortOption)}
                                     className="border border-border rounded px-3 py-1.5 pr-8 text-sm bg-card text-foreground focus:ring-2 focus:ring-ring outline-none transition-all cursor-pointer"
                                 >
                                     <option value="make-asc">Make (A-Z)</option>
                                     <option value="make-desc">Make (Z-A)</option>
                                     <option value="price-asc">Price: Low to High</option>
                                     <option value="price-desc">Price: High to Low</option>
                                     <option value="year-desc">Year: Newest</option>
                                     <option value="created-desc">Recently Added</option>
                                 </select>
                                 <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                             </div>
                         </div>

                         <div className="flex items-center bg-muted/30 p-1 rounded-lg border border-border/50">
                            <button onClick={() => setIsPremiumView(false)} className={`p-1.5 rounded-md transition-all ${!isPremiumView ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button onClick={() => setIsPremiumView(true)} className={`p-1.5 rounded-md transition-all ${isPremiumView ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                <TableIcon className="w-4 h-4" />
                            </button>
                         </div>
                      </div>
                </div>
            </div>

            <div className="flex-1 max-w-8xl mx-auto px-4 py-8 w-full">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-[400px] bg-muted rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className={`grid gap-6 items-stretch ${isPremiumView ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
                            {vehicles.map((vehicle) => (
                                isPremiumView ? (
                                    <PremiumVehicleCard
                                        key={vehicle.id}
                                        vehicle={vehicle}
                                        shippingPrice={shippingRates[vehicle.id]}
                                        onGetQuote={handleGetQuote}
                                        onVehicleClick={handleVehicleClick}
                                        onCheckAvailability={handleCheckAvailability}
                                        onApplyNow={handleApplyNow}
                                        onCallUs={handleCallUs}
                                        onVideo={handleVideo}
                                    />
                                ) : (
                                    <CarInventoryCard
                                        key={vehicle.id}
                                        vehicle={vehicle}
                                        shippingPrice={shippingRates[vehicle.id]}
                                        onGetQuote={handleGetQuote}
                                        onVehicleClick={handleVehicleClick}
                                        onCheckAvailability={handleCheckAvailability}
                                        onApplyNow={handleApplyNow}
                                        onCallUs={handleCallUs}
                                        onVideo={handleVideo}
                                    />
                                )
                            ))}
                        </div>

                        <InventoryPagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            limit={limit}
                            onLimitChange={setLimit}
                            totalCount={total}
                        />
                    </div>
                )}
            </div>

            <ShippingQuoteModal
                open={openModals.shipping}
                onOpenChange={setShippingOpen}
                vehicles={vehicles}
                defaultVehicle={selectedVehicle}
                onCalculate={handleCalculateQuote}
            />


            <VehicleDetailsModal
                isOpen={openModals.details}
                onClose={() => setDetailsOpen(false)}
                vehicle={selectedVehicle}
                onQuoteClick={() => setShippingOpen(true)}
                onInquiryClick={handleCheckAvailability}
                onApplyNow={handleApplyNow}
                shippingQuote={selectedVehicle ? shippingRates[selectedVehicle.id] : null}
            />

            <VehicleInquiryModal
                isOpen={openModals.inquiry}
                onClose={() => setInquiryOpen(false)}
                vehicle={selectedVehicle}
            />

            <FinanceApplicationModal
                isOpen={openModals.finance}
                onClose={() => setFinanceOpen(false)}
                vehicle={selectedVehicle}
            />
        </div>
    )
}

export default function InventoryPage() {
    return (
        <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center p-8">Loading...</div>}>
            <InventoryContent />
        </React.Suspense>
    )
}
