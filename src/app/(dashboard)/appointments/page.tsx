"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, Users, Plus, RefreshCw } from "lucide-react"
import { AppointmentCalendar } from "@/components/AppointmentCalendar"
import { BookedTab } from "@/components/BookedTab"
import { ConversationPanelComplete } from "@/components/ConversationPanel"
import { CreateAppointmentModal } from "@/components/CreateAppointmentModal"
import { AppointmentDetailsModal } from "@/components/AppointmentDetailsModal"
import { GoogleCalendarConnect } from "@/components/GoogleCalendarConnect"
import { GoogleCalendarSyncButton } from "@/components/GoogleCalendarSyncButton"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@clerk/nextjs"

export default function AppointmentsPage() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = React.useState("calendar")
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = React.useState(false)
  const [selectedAppointment, setSelectedAppointment] = React.useState<any>(null)
  const [preselectedDate, setPreselectedDate] = React.useState<Date | undefined>()
  const [preselectedConversation, setPreselectedConversation] = React.useState<string | undefined>()

  // Check URL params for Google Calendar connection result
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('calendar_connected') === 'true') {
      console.log('[AppointmentsPage] Google Calendar connected, refreshing data...')
      // Clean up URL params after reading them
      window.history.replaceState({}, '', '/appointments')
      // Force refetch appointments after calendar connection
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['appointments'] })
      }, 1000)
    }
    if (params.get('calendar_error')) {
      console.error('[AppointmentsPage] Google Calendar connection error:', params.get('calendar_error'))
      window.history.replaceState({}, '', '/appointments')
    }
  }, [queryClient])

  // Helper to get auth headers
  const getAuthHeaders = async () => {
    const token = await getToken()
    return { headers: { Authorization: `Bearer ${token}` } }
  }

  // Fetch appointments with improved error handling and logging
  const {
    data: appointments = [],
    isLoading,
    refetch: refetchAppointments,
    error: appointmentsError,
    isFetching,
  } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      try {
        console.log('[AppointmentsPage] Fetching appointments...')
        const headers = await getAuthHeaders()
        const response = await apiClient.get('/api/appointments', headers)
        const data = response.data?.data || response.data
        const appts = data.appointments || []
        
        console.log('[AppointmentsPage] ✅ Fetched appointments:', {
          total: appts.length,
          sample: appts.slice(0, 3).map((a: any) => ({
            id: a._id,
            title: a.title,
            startTime: a.startTime,
            entryType: a.entryType,
            status: a.status
          }))
        })
        
        return appts
      } catch (error: any) {
        console.error('[AppointmentsPage] ❌ Error fetching appointments:', error)
        throw error
      }
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 0, // Always consider data stale
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid spam
  })

  // Fetch customer bookings count
  const { data: customerBookingsCount = 0, refetch: refetchCustomerBookings } = useQuery({
    queryKey: ['customer-bookings-count'],
    queryFn: async () => {
      try {
        const headers = await getAuthHeaders()
        const response = await apiClient.get('/api/appointments/customer-bookings/list', headers)
        const data = response.data?.data || response.data
        const count = data.appointments?.length || 0
        console.log('[AppointmentsPage] Customer bookings count:', count)
        return count
      } catch (error) {
        console.error('[AppointmentsPage] Error fetching customer bookings:', error)
        return 0
      }
    },
  })

  // Fetch conversations count
  const { data: conversationsCount = 0, refetch: refetchConversations } = useQuery({
    queryKey: ['conversations-count'],
    queryFn: async () => {
      try {
        const headers = await getAuthHeaders()
        const response = await apiClient.get('/api/conversations', headers)
        const data = response.data?.data || response.data
        const count = data.conversations?.length || 0
        console.log('[AppointmentsPage] Conversations count:', count)
        return count
      } catch (error) {
        console.error('[AppointmentsPage] Error fetching conversations:', error)
        return 0
      }
    },
  })

  // Calculate statistics
  const stats = React.useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const upcoming = appointments.filter((apt: any) => {
      const start = new Date(apt.startTime)
      return start >= today && apt.status !== 'cancelled'
    })

    const todayAppointments = appointments.filter((apt: any) => {
      const start = new Date(apt.startTime)
      return start >= today && start < tomorrow && apt.status !== 'cancelled'
    })

    return {
      total: appointments.length,
      upcoming: upcoming.length,
      today: todayAppointments.length,
      cancelled: appointments.filter((apt: any) => apt.status === 'cancelled').length,
    }
  }, [appointments])

  const handleCreateAppointment = () => {
    setPreselectedDate(undefined)
    setPreselectedConversation(undefined)
    setCreateModalOpen(true)
  }

  const handleDateClick = (date?: Date) => {
    setPreselectedDate(date)
    setPreselectedConversation(undefined)
    setCreateModalOpen(true)
  }

  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment(appointment)
    setDetailsModalOpen(true)
  }

  const handleCreateFromConversation = (conversationId: string) => {
    setPreselectedConversation(conversationId)
    setPreselectedDate(undefined)
    setCreateModalOpen(true)
  }

  // Update appointment handler
  const handleUpdateAppointment = async (id: string, data: any) => {
    try {
      console.log('[AppointmentsPage] Updating appointment:', id)
      const headers = await getAuthHeaders()
      await apiClient.patch(`/api/appointments/${id}`, data, headers)
      
      // Invalidate all appointment-related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['appointments'] }),
        queryClient.invalidateQueries({ queryKey: ['customer-bookings-count'] })
      ])
      
      console.log('[AppointmentsPage] ✅ Appointment updated successfully')
    } catch (error) {
      console.error('[AppointmentsPage] ❌ Error updating appointment:', error)
      throw error
    }
  }

  // Cancel appointment handler
  const handleCancelAppointment = async (id: string) => {
    try {
      console.log('[AppointmentsPage] Cancelling appointment:', id)
      const headers = await getAuthHeaders()
      await apiClient.post(`/api/appointments/${id}/cancel`, {}, headers)
      
      // Invalidate all appointment-related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['appointments'] }),
        queryClient.invalidateQueries({ queryKey: ['customer-bookings-count'] })
      ])
      
      console.log('[AppointmentsPage] ✅ Appointment cancelled successfully')
    } catch (error) {
      console.error('[AppointmentsPage] ❌ Error cancelling appointment:', error)
      throw error
    }
  }

  // Delete appointment handler
  const handleDeleteAppointment = async (id: string) => {
    try {
      console.log('[AppointmentsPage] Deleting appointment:', id)
      const headers = await getAuthHeaders()
      await apiClient.delete(`/api/appointments/${id}`, headers)
      setDetailsModalOpen(false)
      
      // Invalidate all appointment-related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['appointments'] }),
        queryClient.invalidateQueries({ queryKey: ['customer-bookings-count'] })
      ])
      
      console.log('[AppointmentsPage] ✅ Appointment deleted successfully')
    } catch (error) {
      console.error('[AppointmentsPage] ❌ Error deleting appointment:', error)
      throw error
    }
  }

  // Handle sync complete - IMPROVED with better logging and forced refetch
  const handleSyncComplete = async () => {
    console.log('[AppointmentsPage] 🔄 Sync completed, refreshing all data...')
    
    try {
      // Invalidate all queries simultaneously
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['appointments'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['customer-bookings-count'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['conversations-count'], refetchType: 'active' })
      ])
      
      console.log('[AppointmentsPage] ✅ All queries invalidated')
      
      // Force manual refetch as backup to ensure data updates
      setTimeout(async () => {
        console.log('[AppointmentsPage] 🔄 Force refetching all data...')
        const [apptResult, bookingsResult, convResult] = await Promise.all([
          refetchAppointments(),
          refetchCustomerBookings(),
          refetchConversations()
        ])
        
        console.log('[AppointmentsPage] ✅ Force refetch complete:', {
          appointments: {
            success: apptResult.isSuccess,
            count: apptResult.data?.length || 0
          },
          customerBookings: {
            success: bookingsResult.isSuccess,
            count: bookingsResult.data || 0
          },
          conversations: {
            success: convResult.isSuccess,
            count: convResult.data || 0
          }
        })
      }, 500)
    } catch (error) {
      console.error('[AppointmentsPage] ❌ Error refreshing data:', error)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">
            Manage your appointments, events, and conversations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GoogleCalendarSyncButton onSyncComplete={handleSyncComplete} />
          <Button onClick={handleCreateAppointment}>
            <Plus className="mr-2 h-4 w-4" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Google Calendar Connection */}
      <GoogleCalendarConnect />

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            {isFetching && (
              <p className="text-xs text-muted-foreground mt-1">Updating...</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcoming}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Bookings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerBookingsCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Error message if appointments failed to load */}
      {appointmentsError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">
              Failed to load appointments. Please try refreshing the page.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => refetchAppointments()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading appointments...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      {!isLoading && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="calendar">
              <Calendar className="mr-2 h-4 w-4" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              <Clock className="mr-2 h-4 w-4" />
              Upcoming
              {stats.upcoming > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {stats.upcoming}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="booked">
              <Users className="mr-2 h-4 w-4" />
              Booked
              {customerBookingsCount > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {customerBookingsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="conversations">
              Conversations
              {conversationsCount > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {conversationsCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Calendar View Tab */}
          <TabsContent value="calendar" className="space-y-4">
            <AppointmentCalendar
              appointments={appointments}
              onCreateAppointment={handleDateClick}
              onSelectAppointment={handleAppointmentClick}
            />
          </TabsContent>

          {/* Upcoming Appointments Tab */}
          <TabsContent value="upcoming" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.upcoming === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No upcoming appointments</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={handleCreateAppointment}
                    >
                      Create Appointment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointments
                      .filter((apt: any) => {
                        const start = new Date(apt.startTime)
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        return start >= today && apt.status !== 'cancelled'
                      })
                      .sort((a: any, b: any) =>
                        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                      )
                      .slice(0, 10)
                      .map((appointment: any) => (
                        <Card
                          key={appointment._id}
                          className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleAppointmentClick(appointment)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">{appointment.title}</h4>
                                  <Badge
                                    variant={
                                      appointment.status === 'confirmed' ? 'default' :
                                        appointment.status === 'cancelled' ? 'destructive' :
                                          'secondary'
                                    }
                                    className={appointment.status === 'confirmed' ? 'bg-green-500' : ''}
                                  >
                                    {appointment.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(appointment.startTime).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                  {' at '}
                                  {new Date(appointment.startTime).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })}
                                </p>
                                {appointment.location && (
                                  <p className="text-sm text-muted-foreground">
                                    Location: {appointment.location}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Booked (Customer Bookings) Tab */}
          <TabsContent value="booked" className="space-y-4">
            <BookedTab />
          </TabsContent>

          {/* Conversations Tab */}
          <TabsContent value="conversations" className="space-y-4">
            <ConversationPanelComplete
              onCreateAppointment={handleCreateFromConversation}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Create Appointment Modal */}
      <CreateAppointmentModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreateAppointment={async (data) => {
          try {
            console.log('[AppointmentsPage] Creating appointment:', data)
            const headers = await getAuthHeaders()
            await apiClient.post('/api/appointments', data, headers)
            
            // Invalidate all appointment-related queries
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ['appointments'] }),
              queryClient.invalidateQueries({ queryKey: ['customer-bookings-count'] })
            ])
            
            console.log('[AppointmentsPage] ✅ Appointment created successfully')
          } catch (error) {
            console.error('[AppointmentsPage] ❌ Error creating appointment:', error)
            throw error
          }
        }}
        conversations={[]}
        preselectedConversation={preselectedConversation}
        preselectedDate={preselectedDate}
      />

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <AppointmentDetailsModal
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          appointment={selectedAppointment}
          onUpdate={handleUpdateAppointment}
          onDelete={handleDeleteAppointment}
          onCancel={handleCancelAppointment}
        />
      )}
    </div>
  )
}