"use client"

import * as React from "react"
import { Calendar, MessageSquare, Users, Clock, Video, Phone, MapPin, Plus, Search, ChevronRight, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppointments } from "@/hooks/useAppointments"
import { useConversations } from "@/hooks/useConversations"
import { CreateAppointmentModal } from "@/components/CreateAppointmentModal"
import { AppointmentDetailsModal } from "@/components/AppointmentDetailsModal"
import { CreateConversationModal } from "@/components/CreateConversationModal"
import { ConversationPanel } from "@/components/ConversationPanel"
import { AppointmentCalendar } from "@/components/AppointmentCalendar"
import { useUser } from "@clerk/nextjs"
import { format } from "date-fns"
import { Appointment } from "@/types/appointment"
import { cn } from "@/lib/utils"

export default function AppointmentsPage() {
    const [activeTab, setActiveTab] = React.useState("calendar")
    const [searchQuery, setSearchQuery] = React.useState("")
    const [entryTypeFilter, setEntryTypeFilter] = React.useState<string>("all")
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
    const [isDetailsModalOpen, setIsDetailsModalOpen] = React.useState(false)
    const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null)
    const [preselectedDate, setPreselectedDate] = React.useState<Date | undefined>()
    const [isCreateConversationOpen, setIsCreateConversationOpen] = React.useState(false)
    const [selectedConversation, setSelectedConversation] = React.useState<string | null>(null)

    const { user: currentUser } = useUser()

    const {
        appointments,
        isLoading: appointmentsLoading,
        createAppointment,
        updateAppointment,
        cancelAppointment,
        deleteAppointment,
        getAppointmentById
    } = useAppointments()

    const {
        conversations,
        isLoading: conversationsLoading,
        createConversation,
        sendMessage,
        deleteConversation
    } = useConversations()

    // Filter appointments
    const filteredAppointments = React.useMemo(() => {
        let filtered = appointments

        // Filter by entry type
        if (entryTypeFilter !== "all") {
            filtered = filtered.filter(a => a.entryType === entryTypeFilter)
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(a =>
                a.title.toLowerCase().includes(query) ||
                a.description?.toLowerCase().includes(query) ||
                a.location?.toLowerCase().includes(query) ||
                a.participants.some(p => p.name.toLowerCase().includes(query))
            )
        }

        return filtered
    }, [appointments, entryTypeFilter, searchQuery])

    // Separate conversations
    const bookedConversations = React.useMemo(() =>
        conversations.filter(c => c.hasAppointment),
        [conversations]
    )

    const regularConversations = React.useMemo(() =>
        conversations.filter(c => !c.hasAppointment),
        [conversations]
    )

    const upcomingAppointments = React.useMemo(() =>
        filteredAppointments.filter(a =>
            new Date(a.startTime) > new Date() &&
            a.status !== 'cancelled'
        ),
        [filteredAppointments]
    )

    const handleSelectAppointment = async (appointment: Appointment) => {
        try {
            // Fetch full details
            const fullAppointment = await getAppointmentById(appointment._id)
            setSelectedAppointment(fullAppointment)
            setIsDetailsModalOpen(true)
        } catch (error) {
            console.error('Failed to fetch appointment details:', error)
        }
    }

    const handleCreateWithDate = (date?: Date) => {
        setPreselectedDate(date)
        setIsCreateModalOpen(true)
    }

    const handleDeleteConversation = async (conversationId: string) => {
        try {
            await deleteConversation(conversationId)
            if (selectedConversation === conversationId) {
                setSelectedConversation(null)
            }
        } catch (error) {
            console.error('Failed to delete conversation:', error)
        }
    }

    const getConversationName = (conversation: any) => {
        if (conversation.type === 'group') {
            return conversation.name || 'Group Chat'
        }

        const otherParticipant = conversation.participants.find(
            (p: any) => p._id !== currentUser?.id
        )

        return otherParticipant?.name || 'Unknown User'
    }

    const getAppointmentIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video className="size-4" />
            case 'phone': return <Phone className="size-4" />
            case 'in-person': return <MapPin className="size-4" />
            default: return <Calendar className="size-4" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
            case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
            case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
        }
    }

    const getEntryTypeColor = (entryType: string) => {
        switch (entryType) {
            case 'appointment': return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
            case 'event': return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
            case 'task': return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
            case 'reminder': return 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300'
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
        }
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            {/* Header */}
            <div className="bg-card border-b border-border px-4 sm:px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-500 p-2 rounded shrink-0">
                            <Calendar className="size-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-xl font-semibold text-foreground">Appointments & Calendar</h1>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                {upcomingAppointments.length} upcoming {entryTypeFilter !== "all" ? entryTypeFilter + 's' : 'items'}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 sm:flex-none gap-2 text-xs"
                            onClick={() => setIsCreateConversationOpen(true)}
                        >
                            <MessageSquare className="size-4" />
                            New Message
                        </Button>
                        <Button
                            size="sm"
                            className="flex-1 sm:flex-none gap-2 bg-green-500 hover:bg-green-600 text-white text-xs"
                            onClick={() => handleCreateWithDate()}
                        >
                            <Plus className="size-4" />
                            New Entry
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search appointments..."
                            className="pl-10 bg-background text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={entryTypeFilter} onValueChange={setEntryTypeFilter}>
                        <SelectTrigger className="w-full sm:w-[180px] text-sm">
                            <div className="flex items-center">
                                <Filter className="size-4 mr-2" />
                                <SelectValue />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="appointment">Appointments</SelectItem>
                            <SelectItem value="event">Events</SelectItem>
                            <SelectItem value="task">Tasks</SelectItem>
                            <SelectItem value="reminder">Reminders</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="p-3 sm:p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="overflow-x-auto scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
                        <TabsList className="mb-6 inline-flex w-auto sm:w-full min-w-full sm:min-w-0">
                            <TabsTrigger value="calendar" className="gap-2 text-xs sm:text-sm whitespace-nowrap">
                                <Calendar className="size-4" />
                                Calendar View
                            </TabsTrigger>
                            <TabsTrigger value="list" className="gap-2 text-xs sm:text-sm whitespace-nowrap">
                                <Clock className="size-4" />
                                Upcoming
                                {upcomingAppointments.length > 0 && (
                                    <Badge variant="secondary" className="ml-2 text-[10px]">
                                        {upcomingAppointments.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="conversations" className="gap-2 text-xs sm:text-sm whitespace-nowrap">
                                <MessageSquare className="size-4" />
                                Messages
                            </TabsTrigger>
                            <TabsTrigger value="booked" className="gap-2 text-xs sm:text-sm whitespace-nowrap">
                                <Users className="size-4" />
                                Booked
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Calendar View */}
                    <TabsContent value="calendar" className="mt-0">
                        <AppointmentCalendar
                            appointments={filteredAppointments}
                            onCreateAppointment={handleCreateWithDate}
                            onSelectAppointment={handleSelectAppointment}
                        />
                    </TabsContent>

                    {/* List View */}
                    <TabsContent value="list" className="mt-0">
                        <div className="grid grid-cols-1 gap-4">
                            {appointmentsLoading ? (
                                <Card>
                                    <CardContent className="p-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                                            <p className="text-muted-foreground">Loading appointments...</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : upcomingAppointments.length === 0 ? (
                                <Card>
                                    <CardContent className="p-12 text-center">
                                        <Calendar className="size-16 text-muted-foreground/50 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-foreground mb-2">
                                            No Upcoming Items
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-6">
                                            {entryTypeFilter !== "all"
                                                ? `No upcoming ${entryTypeFilter}s found`
                                                : 'Create your first entry to get started'}
                                        </p>
                                        <Button onClick={() => handleCreateWithDate()}>
                                            <Plus className="size-4 mr-2" />
                                            Create Entry
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                upcomingAppointments.map((appointment) => (
                                    <Card
                                        key={appointment._id}
                                        className="hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => handleSelectAppointment(appointment)}
                                    >
                                        <CardContent className="p-4 sm:p-6">
                                            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                                <div className="flex gap-3 sm:gap-4 flex-1">
                                                    <div className="bg-green-100 dark:bg-green-950 p-2.5 sm:p-3 rounded-lg flex-shrink-0 self-center">
                                                        {getAppointmentIcon(appointment.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
                                                                {appointment.title}
                                                            </h3>
                                                            <div className="flex gap-1">
                                                                <Badge className={cn("text-[9px] sm:text-[10px]", getEntryTypeColor(appointment.entryType))}>
                                                                    {appointment.entryType}
                                                                </Badge>
                                                                <Badge className={cn("text-[9px] sm:text-[10px]", getStatusColor(appointment.status))}>
                                                                    {appointment.status}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        {appointment.description && (
                                                            <p className="text-[11px] sm:text-sm text-muted-foreground mb-3 line-clamp-2">
                                                                {appointment.description}
                                                            </p>
                                                        )}
                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground">
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock className="size-3.5" />
                                                                {format(new Date(appointment.startTime), 'PPp')}
                                                            </div>
                                                            {appointment.location && (
                                                                <div className="flex items-center gap-1.5">
                                                                    <MapPin className="size-3.5" />
                                                                    <span className="truncate max-w-[150px] sm:max-w-none">{appointment.location}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-1.5">
                                                                <Users className="size-3.5" />
                                                                {appointment.participants.length}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="w-full sm:w-auto gap-2 text-xs"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleSelectAppointment(appointment)
                                                    }}
                                                >
                                                    View
                                                    <ChevronRight className="size-3.5" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    {/* Conversations Tab */}
                    <TabsContent value="conversations" className="mt-0">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                        <CardTitle className="text-base">Conversations</CardTitle>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-2"
                                            onClick={() => setIsCreateConversationOpen(true)}
                                        >
                                            <Plus className="size-4" />
                                            New
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="divide-y max-h-[600px] overflow-y-auto">
                                            {conversationsLoading ? (
                                                <div className="p-8 text-center text-muted-foreground">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                                                        <p className="text-sm">Loading conversations...</p>
                                                    </div>
                                                </div>
                                            ) : regularConversations.length === 0 ? (
                                                <div className="p-8 text-center">
                                                    <MessageSquare className="size-12 text-muted-foreground/50 mx-auto mb-2" />
                                                    <p className="text-sm text-muted-foreground mb-3">
                                                        No conversations yet
                                                    </p>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setIsCreateConversationOpen(true)}
                                                    >
                                                        Start a conversation
                                                    </Button>
                                                </div>
                                            ) : (
                                                regularConversations.map((conversation) => (
                                                    <button
                                                        key={conversation._id}
                                                        className={`w-full p-4 text-left hover:bg-accent transition-colors ${selectedConversation === conversation._id ? 'bg-accent' : ''
                                                            }`}
                                                        onClick={() => setSelectedConversation(conversation._id)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center flex-shrink-0">
                                                                {conversation.type === 'group' ? (
                                                                    <Users className="size-5 text-green-600 dark:text-green-400" />
                                                                ) : (
                                                                    <MessageSquare className="size-5 text-green-600 dark:text-green-400" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-sm truncate">
                                                                    {getConversationName(conversation)}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground truncate">
                                                                    {conversation.lastMessage || 'No messages yet'}
                                                                </p>
                                                            </div>
                                                            {conversation.messages.some(m => !m.readBy.includes(currentUser?.id || '')) && (
                                                                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                                                            )}
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="lg:col-span-2">
                                {selectedConversation ? (
                                    <ConversationPanel
                                        conversationId={selectedConversation}
                                        onSendMessage={sendMessage}
                                        onCreateAppointment={() => setIsCreateModalOpen(true)}
                                        onDeleteConversation={handleDeleteConversation}
                                    />
                                ) : (
                                    <Card>
                                        <CardContent className="p-12 text-center">
                                            <MessageSquare className="size-16 text-muted-foreground/50 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-foreground mb-2">
                                                Select a Conversation
                                            </h3>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                Choose a conversation from the list to view messages
                                            </p>
                                            <Button
                                                variant="outline"
                                                onClick={() => setIsCreateConversationOpen(true)}
                                            >
                                                <Plus className="size-4 mr-2" />
                                                Start New Conversation
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Booked Appointments Tab */}
                    <TabsContent value="booked" className="mt-0">
                        <div className="grid grid-cols-1 gap-4">
                            {bookedConversations.length === 0 ? (
                                <Card>
                                    <CardContent className="p-12 text-center">
                                        <Users className="size-16 text-muted-foreground/50 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-foreground mb-2">
                                            No Booked Appointments
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Conversations will appear here once appointments are scheduled
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                bookedConversations.map((conversation) => (
                                    <Card key={conversation._id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex gap-4 flex-1">
                                                    <div className="bg-blue-100 dark:bg-blue-950 p-3 rounded-lg">
                                                        <Calendar className="size-5 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-foreground mb-1">
                                                            {getConversationName(conversation)}
                                                        </h3>
                                                        {conversation.appointmentId && typeof conversation.appointmentId === 'object' && (
                                                            <div className="space-y-2">
                                                                <p className="text-sm text-muted-foreground">
                                                                    {conversation.appointmentId.title}
                                                                </p>
                                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                    <Clock className="size-4" />
                                                                    {format(new Date(conversation.appointmentId.startTime), 'PPp')}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedConversation(conversation._id);
                                                        setActiveTab("conversations");
                                                    }}
                                                >
                                                    <MessageSquare className="size-4 mr-2" />
                                                    View Chat
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Modals */}
            <CreateAppointmentModal
                open={isCreateModalOpen}
                onOpenChange={(open) => {
                    setIsCreateModalOpen(open)
                    if (!open) setPreselectedDate(undefined)
                }}
                onCreateAppointment={createAppointment}
                conversations={conversations}
                preselectedDate={preselectedDate}
            />

            <AppointmentDetailsModal
                open={isDetailsModalOpen}
                onOpenChange={setIsDetailsModalOpen}
                appointment={selectedAppointment}
                onUpdate={updateAppointment}
                onCancel={cancelAppointment}
                onDelete={deleteAppointment}
            />

            <CreateConversationModal
                open={isCreateConversationOpen}
                onOpenChange={setIsCreateConversationOpen}
                onCreateConversation={createConversation}
            />
        </div>
    )
}