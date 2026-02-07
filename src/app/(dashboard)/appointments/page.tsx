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
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@clerk/nextjs"

export default function AppointmentsPage() {
  const { getToken } = useAuth()
  const [activeTab, setActiveTab] = React.useState("calendar")
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = React.useState(false)
  const [selectedAppointment, setSelectedAppointment] = React.useState<any>(null)
  const [preselectedDate, setPreselectedDate] = React.useState<Date | undefined>()
  const [preselectedConversation, setPreselectedConversation] = React.useState<string | undefined>()

  // Fetch appointments
  const {
    data: appointments = [],
    isLoading,
    refetch: refetchAppointments,
  } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const token = await getToken()
      const response = await apiClient.get('/api/appointments', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = response.data?.data || response.data
      return data.appointments || []
    },
  })

  // Fetch customer bookings count
  const { data: customerBookingsCount = 0 } = useQuery({
    queryKey: ['customer-bookings-count'],
    queryFn: async () => {
      const token = await getToken()
      const response = await apiClient.get('/api/appointments/customer-bookings/list', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = response.data?.data || response.data
      return data.appointments?.length || 0
    },
  })

  // Fetch conversations count
  const { data: conversationsCount = 0 } = useQuery({
    queryKey: ['conversations-count'],
    queryFn: async () => {
      const token = await getToken()
      const response = await apiClient.get('/api/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = response.data?.data || response.data
      return data.conversations?.length || 0
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
          <GoogleCalendarSyncButton />
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

      {/* Main Content Tabs */}
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
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : stats.upcoming === 0 ? (
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

      {/* Create Appointment Modal */}
      <CreateAppointmentModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreateAppointment={async (data) => {
          const token = await getToken()
          await apiClient.post('/api/appointments', data, {
            headers: { Authorization: `Bearer ${token}` },
          })
          refetchAppointments()
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
            onUpdate={async (id: string, data: any) => {
            await refetchAppointments()
            }}
            onDelete={async (id: string) => {
            setDetailsModalOpen(false)
            await refetchAppointments()
            }}
            onCancel={async (id: string) => {
            await refetchAppointments()
            }}
        />
        )}
    </div>
  )
}