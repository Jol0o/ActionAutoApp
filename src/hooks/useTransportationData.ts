// hooks/useTransportationData.ts

import * as React from "react"
import { apiClient } from "@/lib/api-client"
import { AxiosError } from "axios"
import { Vehicle, ShippingQuoteFormData } from "@/types/inventory"
import { Shipment, Quote, ShipmentStats } from "@/types/transportation"
import { MOCK_VEHICLES } from "@/data/mockVehicles"

export function useTransportationData() {
    const [isLoading, setIsLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const [shipments, setShipments] = React.useState<Shipment[]>([])
    const [quotes, setQuotes] = React.useState<Quote[]>([])
    const [vehicles, setVehicles] = React.useState<Vehicle[]>([])
    const [stats, setStats] = React.useState<ShipmentStats>({
        all: 0,
        'Available for Pickup': 0,
        'Cancelled': 0,
        'Delivered': 0,
        'Dispatched': 0,
        'In-Route': 0
    })

    const extractData = React.useCallback((response: any) => {
        if (response.data?.data !== undefined) {
            return response.data.data
        }
        return response.data
    }, [])

    const transformVehicles = React.useCallback((vehicleData: any[]): Vehicle[] => {
        return vehicleData.map((v: any) => {
            let vehicleId: string
            if (typeof v._id === 'object' && v._id !== null) {
                vehicleId = v._id.toString()
            } else if (v.id) {
                vehicleId = String(v.id)
            } else if (v._id) {
                vehicleId = String(v._id)
            } else {
                vehicleId = `temp-${Math.random()}`
            }

            React.useEffect(() => {
        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return {
                id: vehicleId,
                stockNumber: v.stockNumber || 'N/A',
                year: v.year || 0,
                make: v.make || 'Unknown',
                model: v.modelName || v.model || 'Unknown',
                trim: v.trim || '',
                price: v.price || 0,
                mileage: v.mileage || 0,
                vin: v.vin || 'N/A',
                image: v.image || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
                location: v.location || 'Unknown',
                color: v.color || 'N/A',
                transmission: v.transmission || 'Automatic',
                fuelType: v.fuelType || 'Gasoline'
            }
        })
    }, [])

    const fetchData = React.useCallback(async () => {
        setIsLoading(true)
        setError(null)
        
        try {
            const [shipmentsRes, quotesRes, vehiclesRes, statsRes] = await Promise.all([
                apiClient.get('/api/shipments'),
                apiClient.get('/api/quotes'),
                apiClient.get('/api/vehicles'),
                apiClient.get('/api/shipments/stats')
            ])

            setShipments(extractData(shipmentsRes) || [])
            setQuotes(extractData(quotesRes) || [])
            
            const vehicleData = extractData(vehiclesRes) || []
            
            if (!vehicleData || vehicleData.length === 0) {
                console.log('⚠️ No vehicles from API, using MOCK DATA')
                setVehicles(MOCK_VEHICLES)
            } else {
                setVehicles(transformVehicles(vehicleData))
            }

            const statsData = extractData(statsRes)
            if (statsData && typeof statsData === 'object') {
                setStats(statsData)
            }

        } catch (error) {
            console.error('❌ Error fetching data:', error)
            const axiosError = error as AxiosError
            const errorMessage = (axiosError.response?.data as any)?.message || axiosError.message || 'Failed to load data'
            setError(errorMessage)
            setVehicles(MOCK_VEHICLES)
        } finally {
            setIsLoading(false)
        }
    }, [extractData, transformVehicles])

    const handleCalculateQuote = React.useCallback(async (formData: ShippingQuoteFormData) => {
        try {
            const isValidMongoId = formData.vehicleId && /^[0-9a-fA-F]{24}$/.test(formData.vehicleId)
            
            const payload: any = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                fromZip: formData.fromZip,
                toZip: formData.zipCode,
                fromAddress: formData.fromAddress,
                toAddress: formData.fullAddress,
                units: formData.units,
                enclosedTrailer: formData.enclosedTrailer,
                vehicleInoperable: formData.vehicleInoperable
            }
            
            if (isValidMongoId) {
                payload.vehicleId = formData.vehicleId
            }
            
            if (formData.vehicleId) {
                const vehicle = vehicles.find(v => v.id === formData.vehicleId)
                if (vehicle) {
                    payload.vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                    payload.vehicleImage = vehicle.image
                    payload.vin = vehicle.vin
                    payload.stockNumber = vehicle.stockNumber
                    payload.vehicleLocation = vehicle.location
                }
            }
            
            const response = await apiClient.post('/api/quotes', payload)
            const data = response.data?.data || response.data
            await fetchData()
            alert(`Quote created! Rate: $${data.rate}, ETA: ${data.eta.min}-${data.eta.max} days`)
        } catch (error) {
            console.error('❌ Error creating quote:', error)
            const axiosError = error as AxiosError
            const errorMessage = (axiosError.response?.data as any)?.message || axiosError.message || 'Unknown error'
            alert('Failed to create quote: ' + errorMessage)
        }
    }, [vehicles, fetchData])

    const handleCreateShipment = React.useCallback(async (quoteId: string) => {
        try {
            await apiClient.post('/api/shipments', { quoteId })
            await fetchData()
            alert('Shipment created successfully!')
        } catch (error) {
            console.error('Error creating shipment:', error)
            const axiosError = error as AxiosError
            const errorMessage = (axiosError.response?.data as any)?.message || axiosError.message || 'Unknown error'
            alert('Failed to create shipment: ' + errorMessage)
        }
    }, [fetchData])

    return {
        isLoading,
        error,
        shipments,
        quotes,
        vehicles,
        stats,
        fetchData,
        handleCalculateQuote,
        handleCreateShipment
    }
}