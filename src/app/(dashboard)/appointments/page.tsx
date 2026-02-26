"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, Users, Plus, RefreshCw, Mail } from "lucide-react"
import { AppointmentCalendar } from "@/components/AppointmentCalendar"
import { BookedTab } from "@/components/BookedTab"
import { LeadsTab } from "@/components/LeadsTab"
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
  const [activeTab, setActiveTab] = React.useState("leads")
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = React.useState(false)
  const [selectedAppointment, setSelectedAppointment] = React.useState<any>(null)
  const [preselectedDate, setPreselectedDate] = React.useState<Date | undefined>()

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('calendar_connected') === 'true') {
      window.history.replaceState({}, '', '/appointments')
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['appointments'] })
      }, 1000)
    }
    if (params.get('calendar_error')) {
      window.history.replaceState({}, '', '/appointments')
    }
  }, [queryClient])

  const getAuthHeaders = async () => {
    const token = await getToken()
    return { headers: { Authorization: `Bearer ${token}` } }
  }

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
        const headers = await getAuthHeaders()
        const response = await apiClient.get('/api/appointments', headers)
        const data = response.data?.data || response.data
        return data.appointments || []
      } catch (error: any) {
        console.error('[AppointmentsPage] ❌ Error fetching appointments:', error)
        throw error
      }
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  })

  const { data: customerBookingsCount = 0, refetch: refetchCustomerBookings } = useQuery({
    queryKey: ['customer-bookings-count'],
    queryFn: async () => {
      try {
        const headers = await getAuthHeaders()
        const response = await apiClient.get('/api/appointments/customer-bookings/list', headers)
        const data = response.data?.data || response.data
        return data.appointments?.length || 0
      } catch (error) {
        return 0
      }
    },
  })

  const stats = React.useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return {
      total: appointments.length,
      upcoming: appointments.filter((apt: any) => {
        const start = new Date(apt.startTime)
        return start >= today && apt.status !== 'cancelled'
      }).length,
      today: appointments.filter((apt: any) => {
        const start = new Date(apt.startTime)
        return start >= today && start < tomorrow && apt.status !== 'cancelled'
      }).length,
      cancelled: appointments.filter((apt: any) => apt.status === 'cancelled').length,
    }
  }, [appointments])

  const handleCreateAppointment = React.useCallback(() => {
    console.log('[AppointmentsPage] New Appointment clicked — opening modal')
    setPreselectedDate(undefined)
    setCreateModalOpen(true)
  }, [])

  const handleDateClick = React.useCallback((date?: Date) => {
    setPreselectedDate(date)
    setCreateModalOpen(true)
  }, [])

  const handleAppointmentClick = React.useCallback((appointment: any) => {
    setSelectedAppointment(appointment)
    setDetailsModalOpen(true)
  }, [])

  const handleUpdateAppointment = async (id: string, data: any) => {
    try {
      const headers = await getAuthHeaders()
      await apiClient.patch(`/api/appointments/${id}`, data, headers)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['appointments'] }),
        queryClient.invalidateQueries({ queryKey: ['customer-bookings-count'] }),
      ])
    } catch (error) {
      throw error
    }
  }

  const handleCancelAppointment = async (id: string) => {
    try {
      const headers = await getAuthHeaders()
      await apiClient.post(`/api/appointments/${id}/cancel`, {}, headers)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['appointments'] }),
        queryClient.invalidateQueries({ queryKey: ['customer-bookings-count'] }),
      ])
    } catch (error) {
      throw error
    }
  }

  const handleDeleteAppointment = async (id: string) => {
    try {
      const headers = await getAuthHeaders()
      await apiClient.delete(`/api/appointments/${id}`, headers)
      setDetailsModalOpen(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['appointments'] }),
        queryClient.invalidateQueries({ queryKey: ['customer-bookings-count'] }),
      ])
    } catch (error) {
      throw error
    }
  }

  const handleSyncComplete = async () => {
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['appointments'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['customer-bookings-count'], refetchType: 'active' }),
      ])
      setTimeout(async () => {
        await Promise.all([refetchAppointments(), refetchCustomerBookings()])
      }, 500)
    } catch (error) {
      console.error('[AppointmentsPage] ❌ Error refreshing data:', error)
    }
  }

  const handleCreateAppointmentSubmit = async (data: any) => {
    const headers = await getAuthHeaders()
    await apiClient.post('/api/appointments', data, headers)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['appointments'] }),
      queryClient.invalidateQueries({ queryKey: ['customer-bookings-count'] }),
    ])
  }

  return (
    <>
      <div className="container mx-auto py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Appointments</h1>
            <p className="text-muted-foreground">
              Manage your leads, appointments, and events
            </p>
          </div>
          <div className="flex items-center gap-2">
            <GoogleCalendarSyncButton onSyncComplete={handleSyncComplete} />
            <Button type="button" onClick={handleCreateAppointment}>
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

        {/* Error */}
        {appointmentsError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-sm text-red-600">
                Failed to load appointments. Please try refreshing the page.
              </p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => refetchAppointments()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
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

        {/* Tabs — always rendered, not gated by isLoading */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="leads">
              <Mail className="mr-2 h-4 w-4" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Calendar className="mr-2 h-4 w-4" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              <Clock className="mr-2 h-4 w-4" />
              Upcoming
              {stats.upcoming > 0 && (
                <Badge className="ml-2" variant="secondary">{stats.upcoming}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="booked">
              <Users className="mr-2 h-4 w-4" />
              Booked
              {customerBookingsCount > 0 && (
                <Badge className="ml-2" variant="secondary">{customerBookingsCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="space-y-4">
            <LeadsTab />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            {!isLoading && (
              <AppointmentCalendar
                appointments={appointments}
                onCreateAppointment={handleDateClick}
                onSelectAppointment={handleAppointmentClick}
              />
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : stats.upcoming === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No upcoming appointments</p>
                    <Button type="button" variant="outline" className="mt-4" onClick={handleCreateAppointment}>
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
                                      appointment.status === 'confirmed' ? 'default'
                                        : appointment.status === 'cancelled' ? 'destructive'
                                        : 'secondary'
                                    }
                                    className={appointment.status === 'confirmed' ? 'bg-green-500' : ''}
                                  >
                                    {appointment.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(appointment.startTime).toLocaleDateString('en-US', {
                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                                  })}
                                  {' at '}
                                  {new Date(appointment.startTime).toLocaleTimeString('en-US', {
                                    hour: 'numeric', minute: '2-digit',
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

          <TabsContent value="booked" className="space-y-4">
            <BookedTab />
          </TabsContent>
        </Tabs>
      </div>

      {/*
        MODALS ARE OUTSIDE THE CONTAINER DIV — this is intentional and important.

        shadcn's <Dialog> renders via a React portal into document.body. However,
        if any ancestor element has CSS properties that create a new stacking
        context (transform, filter, will-change, isolation, etc.) or overflow:hidden,
        the portal overlay can appear clipped or invisible even though React thinks
        it's mounted. Placing modals as siblings to the page <div> (inside a <>
        Fragment) ensures they are completely unaffected by container styles.
      */}
      <CreateAppointmentModal
        open={createModalOpen}
        onOpenChange={(open) => {
          console.log('[AppointmentsPage] CreateModal open state changing to:', open)
          setCreateModalOpen(open)
          if (!open) setPreselectedDate(undefined)
        }}
        onCreateAppointment={handleCreateAppointmentSubmit}
        conversations={[]}
        preselectedDate={preselectedDate}
      />

      {selectedAppointment && (
        <AppointmentDetailsModal
          open={detailsModalOpen}
          onOpenChange={(open) => {
            setDetailsModalOpen(open)
            if (!open) setSelectedAppointment(null)
          }}
          appointment={selectedAppointment}
          onUpdate={handleUpdateAppointment}
          onDelete={handleDeleteAppointment}
          onCancel={handleCancelAppointment}
        />
      )}
    </>
  )
}