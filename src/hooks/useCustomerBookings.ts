import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@clerk/nextjs'

interface CustomerBooking {
  _id: string
  title: string
  description?: string
  startTime: Date | string
  endTime: Date | string
  status: string
  customerBooking: {
    firstName: string
    lastName: string
    email: string
    phone: string
    isCustomerBooking: boolean
    bookingHistory?: {
      previousBookings: string[]
      totalBookings: number
      lastBookedAt: Date | string
    }
  }
  createdBy: {
    _id: string
    name: string
    email: string
  }
  location?: string
}

interface CustomerHistory {
  customer: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  bookings: CustomerBooking[]
  statistics: {
    total: number
    upcoming: number
    completed: number
    cancelled: number
  }
  bookedBy: Array<{
    organizerId: string
    organizerName: string
    count: number
  }>
}

export const useCustomerBookings = () => {
  const { getToken } = useAuth()
  const [bookings, setBookings] = useState<CustomerBooking[]>([])
  const [customerHistory, setCustomerHistory] = useState<CustomerHistory | null>(null)
  const [dateStatistics, setDateStatistics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomerBookings = async (filters: any = {}) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const token = await getToken()
      if (!token) {
        throw new Error('No authentication token')
      }

      const params = new URLSearchParams()
      
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status)
      }
      if (filters.startDate) {
        params.append('startDate', new Date(filters.startDate).toISOString())
      }
      if (filters.endDate) {
        params.append('endDate', new Date(filters.endDate).toISOString())
      }
      
      const queryString = params.toString()
      const url = queryString 
        ? `/api/appointments/customer-bookings/list?${queryString}`
        : '/api/appointments/customer-bookings/list'

      console.log('Fetching customer bookings from:', url)
      
      const response = await apiClient.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      console.log('Customer bookings response:', response.data)
      
      const data = response.data?.data || response.data
      const appointments = data.appointments || []
      
      console.log(`Loaded ${appointments.length} customer bookings`)
      setBookings(appointments)
      
    } catch (error: any) {
      console.error('Failed to fetch customer bookings:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load customer bookings'
      setError(errorMessage)
      setBookings([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCustomerHistory = async (
    email?: string,
    phone?: string,
    firstName?: string,
    lastName?: string
  ) => {
    try {
      setIsLoadingHistory(true)
      const token = await getToken()
      
      if (!token) {
        throw new Error('No authentication token')
      }

      const params = new URLSearchParams()
      if (email) params.append('email', email)
      if (phone) params.append('phone', phone)
      if (firstName) params.append('firstName', firstName)
      if (lastName) params.append('lastName', lastName)
      
      console.log('Fetching customer history with params:', params.toString())
      
      const response = await apiClient.get(
        `/api/appointments/customer-bookings/history?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      console.log('Customer history response:', response.data)
      
      const data = response.data?.data || response.data
      setCustomerHistory(data)
      
    } catch (error: any) {
      console.error('Failed to fetch customer history:', error)
      setCustomerHistory(null)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const fetchDateStatistics = async (date: Date) => {
    try {
      setIsLoadingStats(true)
      const token = await getToken()
      
      if (!token) {
        throw new Error('No authentication token')
      }

      const response = await apiClient.get(
        `/api/appointments/customer-bookings/date-stats?date=${date.toISOString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      const data = response.data?.data || response.data
      setDateStatistics(data)
      
    } catch (error) {
      console.error('Failed to fetch date statistics:', error)
      setDateStatistics(null)
    } finally {
      setIsLoadingStats(false)
    }
  }

  // Fetch bookings on mount
  useEffect(() => {
    fetchCustomerBookings()
  }, [])

  return {
    bookings,
    customerHistory,
    dateStatistics,
    isLoading,
    isLoadingHistory,
    isLoadingStats,
    error,
    fetchCustomerBookings,
    fetchCustomerHistory,
    fetchDateStatistics
  }
}