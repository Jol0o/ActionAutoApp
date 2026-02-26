"use client"

import * as React from "react"
import { PremiumVehicleCard } from "@/components/customer/PremiumVehicleCard"
import type { Vehicle } from "@/types/inventory"
import { ChevronDown, RefreshCw } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { AxiosError } from "axios"
import { InventoryFilters } from "@/components/inventory-filters"
import { InventoryPagination } from "@/components/inventory-pagination"
import { useAuth } from "@clerk/nextjs"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

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


function ShopVehiclesContent() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { getToken } = useAuth()

    const [vehicles, setVehicles] = React.useState<Vehicle[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

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

    // Debounced search term to avoid rapid API calls
    const [debouncedSearch, setDebouncedSearch] = React.useState(filters.search)

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(filters.search)
        }, 500)
        return () => clearTimeout(timer)
    }, [filters.search])

    React.useEffect(() => {
        // Update URL when state changes
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit, debouncedSearch, filters.make, filters.model, filters.status, filters.year, filters.minPrice, filters.maxPrice, filters.minMileage, filters.maxMileage, filters.sortBy, filters.sortOrder])

    const fetchVehicles = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const token = await getToken()
            const response = await apiClient.get('/api/vehicles', {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                params: {
                    page,
                    limit,
                    ...filters,
                    search: debouncedSearch,
                }
            })

            const responseData = response.data?.data || response.data
            const vehiclesData = responseData.vehicles || []
            const paginationData = responseData.pagination || { total: 0, totalPages: 1 }

            setVehicles(vehiclesData)
            setTotal(paginationData.total)
            setTotalPages(paginationData.totalPages)

        } catch (err) {
            console.error('[Inventory] Error fetching vehicles:', err)
            const axiosError = err as AxiosError
            if (axiosError.code !== "ERR_CANCELED") {
                const apiErrorData = axiosError.response?.data as any
                const errorMessage = apiErrorData?.message || axiosError.message || 'Failed to load vehicles'
                setError(errorMessage)
                setVehicles([])
            }
        } finally {
            setIsLoading(false)
        }
    }

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

    if (error) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">Error Loading Vehicles</h2>
                        <p className="text-red-500/80 mb-4">{error}</p>
                        <button
                            onClick={fetchVehicles}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Retry Loading
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in flex flex-col min-h-full slide-in-from-bottom-4 duration-700">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                        Shop Vehicles
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl text-lg">
                        Browse our premium inventory. As an Action Auto Member, you unlock exclusive
                        <span className="text-green-600 dark:text-green-400 font-semibold mx-1">One Time Payment</span>
                        discounts on all vehicles.
                    </p>
                </div>
            </div>

            {/* Filters Section */}
            <div className="space-y-4 shrink-0">
                <InventoryFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onBulkFilterChange={handleBulkFilterChange}
                    onClearFilters={handleClearFilters}
                />

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-3">
                        <p className="text-sm font-medium text-muted-foreground">
                            <span className="font-bold text-foreground">{total}</span> Vehicles Found
                        </p>
                        <button
                            onClick={fetchVehicles}
                            disabled={isLoading}
                            className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
                            title="Refresh inventory"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">Sort by</span>
                        <div className="relative">
                            <select
                                value={currentSortValue}
                                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                                className="border border-border rounded px-3 py-1.5 pr-8 text-sm bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all cursor-pointer"
                            >
                                <option value="make-asc">Make (A-Z)</option>
                                <option value="make-desc">Make (Z-A)</option>
                                <option value="price-asc">Price: Low to High</option>
                                <option value="price-desc">Price: High to Low</option>
                                <option value="mileage-asc">Mileage: Low to High</option>
                                <option value="mileage-desc">Mileage: High to Low</option>
                                <option value="year-desc">Year: Newest</option>
                                <option value="year-asc">Year: Oldest</option>
                                <option value="age-asc">Newest on Lot</option>
                                <option value="age-desc">Oldest on Lot</option>
                                <option value="created-desc">Recently Added</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 pt-2">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-[450px] bg-zinc-100 dark:bg-zinc-900 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : vehicles.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-border/50">
                        <div className="max-w-lg mx-auto p-4">
                            <p className="text-xl font-semibold text-foreground mb-2">No vehicles found</p>
                            <p className="text-muted-foreground mb-6">
                                Try adjusting your filters or search terms to find what you're looking for.
                            </p>
                            <button
                                onClick={handleClearFilters}
                                className="inline-flex items-center gap-2 px-6 py-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold rounded-xl hover:opacity-90 transition-opacity"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {vehicles.map((vehicle) => (
                                <PremiumVehicleCard
                                    key={vehicle.id}
                                    vehicle={vehicle}
                                    onCheckAvailability={() => console.log("Checking availability:", vehicle.id)}
                                    onApplyNow={() => console.log("Applying for:", vehicle.id)}
                                    onCallUs={() => window.open("tel:+15555555555")}
                                />
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
        </div>
    )
}

export default function ShopVehiclesPage() {
    return (
        <React.Suspense fallback={
            <div className="p-8 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-r-transparent" />
                    <p className="text-muted-foreground font-medium">Preparing showroom...</p>
                </div>
            </div>
        }>
            <ShopVehiclesContent />
        </React.Suspense>
    )
}
