import * as React from "react"
import { apiClient } from "@/lib/api-client"
import { AxiosError } from "axios"
import { Vehicle, ShippingQuoteFormData } from "@/types/inventory"
import { Shipment, Quote, ShipmentStats } from "@/types/transportation"
import { useAuth } from "@clerk/nextjs"

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
    const { getToken, isLoaded, isSignedIn } = useAuth();

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
        if (!isSignedIn) return;

        setIsLoading(true)
        setError(null)

        try {
            console.log('[TransportationData] Fetching all data...')

            const token = await getToken();
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            const [shipmentsRes, quotesRes, vehiclesRes, statsRes] = await Promise.all([
                apiClient.get('/api/shipments', config),
                apiClient.get('/api/quotes', config),
                apiClient.get('/api/vehicles', { ...config, params: { status: 'all', limit: 0 } }),
                apiClient.get('/api/shipments/stats', config)
            ])

            const shipmentsData = extractData(shipmentsRes) || []
            const quotesData = extractData(quotesRes) || []
            const vehiclesResponse = extractData(vehiclesRes)
            const vehicleData = vehiclesResponse?.vehicles || vehiclesResponse || []
            const statsData = extractData(statsRes)

            console.log('[TransportationData] Fetched:', {
                shipments: shipmentsData.length,
                quotes: quotesData.length,
                vehicles: vehicleData.length
            })

            setShipments(shipmentsData)
            setQuotes(quotesData)
            setVehicles(transformVehicles(vehicleData))

            if (statsData && typeof statsData === 'object') {
                setStats(statsData)
            }

        } catch (error) {
            console.error('[TransportationData] Error fetching data:', error)
            const axiosError = error as AxiosError
            const errorMessage = (axiosError.response?.data as any)?.message || axiosError.message || 'Failed to load data'
            setError(errorMessage)
            setShipments([])
            setQuotes([])
            setVehicles([])
        } finally {
            setIsLoading(false)
        }
    }, [extractData, transformVehicles, getToken, isSignedIn])

    const handleCalculateQuote = React.useCallback(async (formData: ShippingQuoteFormData) => {
        try {
            console.log('[TransportationData] Creating quote...')

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

            const token = await getToken();
            const response = await apiClient.post('/api/quotes', payload, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = response.data?.data || response.data

            console.log('[TransportationData] Quote created successfully')
            await fetchData()

            return data
        } catch (error) {
            console.error('[TransportationData] Error creating quote:', error)
            const axiosError = error as AxiosError
            const errorMessage = (axiosError.response?.data as any)?.message || axiosError.message || 'Unknown error'
            throw new Error('Failed to create quote: ' + errorMessage)
        }
    }, [vehicles, fetchData, getToken])

    const handleCreateShipment = React.useCallback(async (quoteId: string) => {
        try {
            console.log('[TransportationData] Creating shipment for quote:', quoteId)

            const token = await getToken();
            await apiClient.post('/api/shipments', {
                quoteId,
                requestedPickupDate: new Date(),
                autoDeleteQuote: true
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            setQuotes(prev => prev.filter(q => q._id !== quoteId))

            console.log('[TransportationData] Shipment created successfully')
            await fetchData()

            return true
        } catch (error) {
            console.error('[TransportationData] Error creating shipment:', error)
            const axiosError = error as AxiosError
            const errorMessage = (axiosError.response?.data as any)?.message || axiosError.message || 'Unknown error'
            throw new Error('Failed to create shipment: ' + errorMessage)
        }
    }, [fetchData, getToken])

    const handleDeleteQuote = React.useCallback(async (quoteId: string) => {
        try {
            console.log('[TransportationData] Deleting quote:', quoteId)

            const token = await getToken();
            await apiClient.delete(`/api/quotes/${quoteId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            setQuotes(prev => prev.filter(q => q._id !== quoteId))

            console.log('[TransportationData] Quote deleted successfully')
        } catch (error) {
            console.error('[TransportationData] Error deleting quote:', error)
            const axiosError = error as AxiosError
            const errorMessage = (axiosError.response?.data as any)?.message || axiosError.message || 'Unknown error'
            throw new Error('Failed to delete quote: ' + errorMessage)
        }
    }, [getToken])

    const handleDeleteShipment = React.useCallback(async (shipmentId: string) => {
        try {
            console.log('[TransportationData] Deleting shipment:', shipmentId)

            const token = await getToken();
            await apiClient.delete(`/api/shipments/${shipmentId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            setShipments(prev => prev.filter(s => s._id !== shipmentId))
            setStats(prev => ({
                ...prev,
                all: Math.max(0, prev.all - 1)
            }))

            console.log('[TransportationData] Shipment deleted successfully')
            return true
        } catch (error) {
            console.error('[TransportationData] Error deleting shipment:', error)
            const axiosError = error as AxiosError
            const errorMessage = (axiosError.response?.data as any)?.message || axiosError.message || 'Unknown error'
            throw new Error('Failed to delete shipment: ' + errorMessage)
        }
    }, [getToken])

    const handleUpdateQuote = React.useCallback(async (quoteId: string, updatedQuote: Partial<Quote>) => {
        try {
            console.log('[TransportationData] Updating quote:', quoteId)

            const token = await getToken();
            const response = await apiClient.put(`/api/quotes/${quoteId}`, updatedQuote, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            const data = extractData(response)

            setQuotes(prev =>
                prev.map(quote =>
                    quote._id === quoteId ? { ...quote, ...data } : quote
                )
            )

            console.log('[TransportationData] Quote updated successfully')
            await fetchData()

            return data
        } catch (error) {
            console.error('[TransportationData] Error updating quote:', error)
            const axiosError = error as AxiosError
            const errorMessage = (axiosError.response?.data as any)?.message || axiosError.message || 'Unknown error'
            throw new Error('Failed to update quote: ' + errorMessage)
        }
    }, [extractData, fetchData, getToken])

    const handleUpdateShipment = React.useCallback(async (shipmentId: string, updatedShipment: Partial<Shipment>) => {
        try {
            console.log('[TransportationData] Updating shipment:', shipmentId)

            const token = await getToken();
            const response = await apiClient.put(`/api/shipments/${shipmentId}`, updatedShipment, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            const data = extractData(response)

            setShipments(prev =>
                prev.map(shipment =>
                    shipment._id === shipmentId ? { ...shipment, ...data } : shipment
                )
            )

            console.log('[TransportationData] Shipment updated successfully')
            await fetchData()

            return data
        } catch (error) {
            console.error('[TransportationData] Error updating shipment:', error)
            const axiosError = error as AxiosError
            const errorMessage = (axiosError.response?.data as any)?.message || axiosError.message || 'Unknown error'
            throw new Error('Failed to update shipment: ' + errorMessage)
        }
    }, [extractData, fetchData, getToken])

    return {
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
    }
}