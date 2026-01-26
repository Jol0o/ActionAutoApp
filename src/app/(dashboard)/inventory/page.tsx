"use client"

import * as React from "react"
import { ChevronDown, RefreshCw } from "lucide-react"
import { CarInventoryCard } from "@/components/car-inventory-card"
import { ShippingQuoteModal } from "@/components/shipping-quote-modal"
import type { Vehicle, ShippingQuoteFormData } from "@/types/inventory"
import { apiClient } from "@/lib/api-client"
import { AxiosError } from "axios"

type SortOption =
  | "make-asc"
  | "price-low"
  | "price-high"
  | "mileage-low"
  | "mileage-high"
  | "year-latest"

export default function InventoryPage() {
  const [sortBy, setSortBy] = React.useState<SortOption>("price-high")
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('[Inventory] Fetching vehicles from API...')
      
      const response = await apiClient.get('/api/vehicles', {
        params: {
          status: 'all',
          limit: 1000,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }
      })
      
      console.log('[Inventory] API Response:', response.data)
      
      const responseData = response.data?.data || response.data
      const vehiclesData = responseData.vehicles || responseData || []
      
      if (!Array.isArray(vehiclesData)) {
        console.error('[Inventory] Invalid response format:', responseData)
        throw new Error('Invalid response format from server')
      }
      
      console.log(`[Inventory] Found ${vehiclesData.length} vehicles`)
      
      const transformedVehicles: Vehicle[] = vehiclesData.map((v: any) => ({
        id: v.id || v._id,
        stockNumber: v.stockNumber || 'N/A',
        year: v.year,
        make: v.make,
        model: v.model || v.modelName,
        trim: v.trim || '',
        price: v.price || 0,
        mileage: v.mileage || 0,
        vin: v.vin,
        image: v.image || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
        location: v.location || 'Unknown',
        color: v.color || 'N/A',
        transmission: v.transmission || 'Automatic',
        fuelType: v.fuelType || 'Gasoline'
      }))
      
      setVehicles(transformedVehicles)
      console.log('[Inventory] Vehicles loaded successfully')
    } catch (err) {
      console.error('[Inventory] Error fetching vehicles:', err)
      const axiosError = err as AxiosError
      const apiErrorData = axiosError.response?.data as any
      const errorMessage = apiErrorData?.message || axiosError.message || 'Failed to load vehicles'
      setError(errorMessage)
      setVehicles([])
    } finally {
      setIsLoading(false)
    }
  }

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
      
      alert(`Quote created successfully! Rate: $${data.rate}, ETA: ${data.eta.min}-${data.eta.max} days`)
    } catch (error) {
      console.error('[Quote] Error creating quote:', error)
      const axiosError = error as AxiosError
      const apiErrorData = axiosError.response?.data as any
      const errorMessage = apiErrorData?.message || axiosError.message || 'Unknown error'
      alert('Failed to create quote: ' + errorMessage)
    }
  }

  const sortedVehicles = React.useMemo(() => {
    const list = [...vehicles]
    switch (sortBy) {
      case "make-asc":
        return list.sort((a, b) => a.make.localeCompare(b.make))
      case "price-low":
        return list.sort((a, b) => a.price - b.price)
      case "price-high":
        return list.sort((a, b) => b.price - a.price)
      case "mileage-low":
        return list.sort((a, b) => a.mileage - b.mileage)
      case "mileage-high":
        return list.sort((a, b) => b.mileage - a.mileage)
      case "year-latest":
        return list.sort((a, b) => b.year - a.year)
      default:
        return list
    }
  }, [sortBy, vehicles])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-lg">Loading inventory...</p>
        </div>
      </div>
    )
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
    <div className="min-h-screen bg-muted/20">
      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <p className="text-sm">
              <span className="font-bold">RESULTS:</span> {vehicles.length}
            </p>
            <button
              onClick={fetchVehicles}
              disabled={isLoading}
              className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
              title="Refresh inventory"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm">Sort by</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="border rounded px-3 py-1.5 pr-8 text-sm bg-white"
              >
                <option value="make-asc">Make Ascending</option>
                <option value="price-low">Price Low</option>
                <option value="price-high">Price High</option>
                <option value="mileage-low">Mileage Low</option>
                <option value="mileage-high">Mileage High</option>
                <option value="year-latest">Year Latest</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-4 py-8">
        {vehicles.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
              <p className="text-lg text-gray-600 mb-4">No vehicles found in inventory.</p>
              <p className="text-sm text-gray-500 mb-4">
                Import vehicles through the FTP server or add them manually through the admin dashboard.
              </p>
              <button
                onClick={fetchVehicles}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Inventory
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
            {sortedVehicles.map((vehicle) => (
              <CarInventoryCard
                key={vehicle.id}
                vehicle={vehicle}
                onGetQuote={() => setIsModalOpen(true)}
              />
            ))}
          </div>
        )}
      </div>

      <ShippingQuoteModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        vehicles={sortedVehicles}
        onCalculate={handleCalculateQuote}
      />
    </div>
  )
}