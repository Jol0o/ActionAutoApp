"use client"

import * as React from "react"
import { ChevronDown, RefreshCw } from "lucide-react"
import { CarInventoryCard } from "@/components/car-inventory-card"
import { ShippingQuoteModal } from "@/components/shipping-quote-modal"
import { VehicleDetailsModal } from "@/components/vehicle-details-modal"
import type { Vehicle, ShippingQuoteFormData } from "@/types/inventory"
import { apiClient } from "@/lib/api-client"
import { AxiosError } from "axios"
import { InventoryFilters } from "@/components/inventory-filters"
import { InventoryPagination } from "@/components/inventory-pagination"
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


function InventoryContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = React.useState(false)
  const [selectedDetailVehicle, setSelectedDetailVehicle] = React.useState<Vehicle | null>(null)
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
      console.log('[Inventory] Fetching vehicles with params:', {
        page, limit, ...filters, search: debouncedSearch
      })

      const response = await apiClient.get('/api/vehicles', {
        params: {
          page,
          limit,
          ...filters,
          search: debouncedSearch,
          // Map frontend sort option to API params if needed, or keeping it simple
          // The API expects sortBy and sortOrder separately which we are managing in filters state
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
      // Only set error if it's not a cancellation
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
    setPage(1) // Reset to first page on filter change
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

  // NEW State for shipping rates (vehicleId -> rate)
  const [shippingRates, setShippingRates] = React.useState<Record<string, number>>({})

  const handleCalculateQuote = async (formData: ShippingQuoteFormData) => {
    try {
      console.log('[Quote] Submitting quote request:', formData)

      const response = await apiClient.post('/api/quotes', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        vehicleId: formData.vehicleId,
        fromZip: formData.fromZip,
        toZip: formData.zipCode,
        fromAddress: formData.fromAddress,
        toAddress: formData.fullAddress,
        units: formData.units,
        enclosedTrailer: formData.enclosedTrailer,
        vehicleInoperable: formData.vehicleInoperable
      })

      const data = response.data?.data || response.data
      console.log('[Quote] Quote created successfully:', data)

      // Store the rate for this vehicle
      if (formData.vehicleId) {
        setShippingRates(prev => ({
          ...prev,
          [formData.vehicleId!]: data.rate
        }))
      }

      alert(`Quote created successfully! Rate: $${data.rate}, ETA: ${data.eta.min}-${data.eta.max} days`)

      // Explicitly close the shipping modal (it might do this itself but ensuring here is fine)
      setIsModalOpen(false)

    } catch (error) {
      console.error('[Quote] Error creating quote:', error)
      const axiosError = error as AxiosError
      const apiErrorData = axiosError.response?.data as any
      const errorMessage = apiErrorData?.message || axiosError.message || 'Unknown error'
      alert('Failed to create quote: ' + errorMessage)
    }
  }


  const handleVehicleClick = (vehicle: Vehicle) => {
    setSelectedDetailVehicle(vehicle)
    setDetailsModalOpen(true)
  }

  const handleQuoteFromDetails = () => {
    if (selectedDetailVehicle) {
      // DO NOT close the details modal
      // setDetailsModalOpen(false) 
      setIsModalOpen(true)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Inventory</h2>
            <p className="text-red-600 mb-4">{error}</p>
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
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <div className="border-b bg-background sticky top-0 z-10 shadow-sm">
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
              <button
                onClick={fetchVehicles}
                disabled={isLoading}
                className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 transition-colors"
                title="Refresh inventory"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Sort by</span>
              <div className="relative">
                <select
                  value={currentSortValue}
                  onChange={(e) => handleSortChange(e.target.value as SortOption)}
                  className="border rounded px-3 py-1.5 pr-8 text-sm bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all cursor-pointer"
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
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-8xl mx-auto px-4 py-8 w-full">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-[400px] bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-background border rounded-lg p-12 max-w-lg mx-auto shadow-sm">
              <p className="text-xl font-semibold text-gray-900 mb-2">No vehicles found</p>
              <p className="text-gray-500 mb-6">
                Try adjusting your filters or search terms to find what you're looking for.
              </p>
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {vehicles.map((vehicle) => (
                <CarInventoryCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onGetQuote={() => setIsModalOpen(true)}
                  onVehicleClick={handleVehicleClick}
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

      <ShippingQuoteModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        vehicles={vehicles}
        defaultVehicle={selectedDetailVehicle}
        onCalculate={handleCalculateQuote}
      />

      <VehicleDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        vehicle={selectedDetailVehicle}
        onQuoteClick={handleQuoteFromDetails}
        shippingQuote={selectedDetailVehicle ? shippingRates[selectedDetailVehicle.id] : null}
      />
    </div>
  )
}

export default function InventoryPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-muted/20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-r-transparent" />
          <p className="text-muted-foreground">Loading inventory...</p>
        </div>
      </div>
    }>
      <InventoryContent />
    </React.Suspense>
  )
}
