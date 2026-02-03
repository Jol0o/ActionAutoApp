"use client"

import * as React from "react"
import { Calendar, MessageSquare, Users, Clock, Video, Phone, MapPin, Plus, Search, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAppointments } from "@/hooks/useAppointments"
import { useConversations } from "@/hooks/useConversations"
import { CreateAppointmentModal } from "@/components/CreateAppointmentModal"
import { CreateConversationModal } from "@/components/CreateConversationModal"
import { ConversationPanel } from "@/components/ConversationPanel"
import { AppointmentCalendar } from "@/components/AppointmentCalendar"
import { useUser } from "@clerk/nextjs"
import { format } from "date-fns"
import { Appointment } from "@/types/appointment"

export default function AppointmentsPage() {
    const [activeTab, setActiveTab] = React.useState("calendar")
    const [searchQuery, setSearchQuery] = React.useState("")
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
    const [isCreateConversationOpen, setIsCreateConversationOpen] = React.useState(false)
    const [selectedConversation, setSelectedConversation] = React.useState<string | null>(null)

    const { user: currentUser } = useUser()

    const {
        appointments,
        isLoading: appointmentsLoading,
        createAppointment,
    } = useAppointments()

    const {
        conversations,
        isLoading: conversationsLoading,
        createConversation,
        sendMessage,
        deleteConversation
    } = useConversations()

    // Separate conversations with and without appointments
    const bookedConversations = React.useMemo(() =>
        conversations.filter(c => c.hasAppointment),
        [conversations]
    )

    const regularConversations = React.useMemo(() =>
        conversations.filter(c => !c.hasAppointment),
        [conversations]
    )

    const upcomingAppointments = React.useMemo(() =>
        appointments.filter(a =>
            new Date(a.startTime) > new Date() &&
            a.status !== 'cancelled'
        ),
        [appointments]
    )

    const handleDeleteConversation = async (conversationId: string) => {
        try {
            await deleteConversation(conversationId)
            // Clear selected conversation if it was deleted
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

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-card border-b border-border px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-500 p-2 rounded">
                            <Calendar className="size-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-foreground">Appointments</h1>
                            <p className="text-sm text-muted-foreground">
                                {upcomingAppointments.length} upcoming appointments
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => setIsCreateConversationOpen(true)}
                        >
                            <MessageSquare className="size-4" />
                            New Message
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => setActiveTab("conversations")}
                        >
                            <MessageSquare className="size-4" />
                            Messages ({conversations.length})
                        </Button>
                        <Button
                            size="sm"
                            className="gap-2 bg-green-500 hover:bg-green-600 text-white"
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            <Plus className="size-4" />
                            New Appointment
                        </Button>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Search appointments, conversations, or participants..."
                        className="pl-10 bg-background"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-6">
                        <TabsTrigger value="calendar" className="gap-2">
                            <Calendar className="size-4" />
                            Calendar View
                        </TabsTrigger>
                        <TabsTrigger value="list" className="gap-2">
                            <Clock className="size-4" />
                            Upcoming
                        </TabsTrigger>
                        <TabsTrigger value="conversations" className="gap-2">
                            <MessageSquare className="size-4" />
                            Conversations
                            {regularConversations.length > 0 && (
                                <Badge variant="secondary" className="ml-2">
                                    {regularConversations.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="booked" className="gap-2">
                            <Users className="size-4" />
                            Booked Appointments
                            {bookedConversations.length > 0 && (
                                <Badge variant="secondary" className="ml-2">
                                    {bookedConversations.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* Calendar View */}
                    <TabsContent value="calendar" className="mt-0">
                        <AppointmentCalendar
                            appointments={appointments}
                            onCreateAppointment={() => setIsCreateModalOpen(true)}
                            onSelectAppointment={(appointment) => { }}
                        />
                    </TabsContent>

                    {/* List View */}
                    <TabsContent value="list" className="mt-0">
                        <div className="grid grid-cols-1 gap-4">
                            {appointmentsLoading ? (
                                <Card>
                                    <CardContent className="p-12 text-center">
                                        <p className="text-muted-foreground">Loading appointments...</p>
                                    </CardContent>
                                </Card>
                            ) : upcomingAppointments.length === 0 ? (
                                <Card>
                                    <CardContent className="p-12 text-center">
                                        <Calendar className="size-16 text-muted-foreground/50 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-foreground mb-2">
                                            No Upcoming Appointments
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-6">
                                            Schedule your first appointment to get started
                                        </p>
                                        <Button onClick={() => setIsCreateModalOpen(true)}>
                                            Create Appointment
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                upcomingAppointments.map((appointment) => (
                                    <Card key={appointment._id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex gap-4 flex-1">
                                                    <div className="bg-green-100 dark:bg-green-950 p-3 rounded-lg">
                                                        {getAppointmentIcon(appointment.type)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-semibold text-foreground">
                                                                {appointment.title}
                                                            </h3>
                                                            <Badge className={getStatusColor(appointment.status)}>
                                                                {appointment.status}
                                                            </Badge>
                                                        </div>
                                                        {appointment.description && (
                                                            <p className="text-sm text-muted-foreground mb-3">
                                                                {appointment.description}
                                                            </p>
                                                        )}
                                                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="size-4" />
                                                                {format(new Date(appointment.startTime), 'PPp')}
                                                            </div>
                                                            {appointment.location && (
                                                                <div className="flex items-center gap-2">
                                                                    <MapPin className="size-4" />
                                                                    {appointment.location}
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-2">
                                                                <Users className="size-4" />
                                                                {appointment.participants.length} participant{appointment.participants.length !== 1 ? 's' : ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="gap-2"
                                                    onClick={() => {
                                                        if (appointment.conversationId) {
                                                            setSelectedConversation(appointment.conversationId);
                                                            setActiveTab("conversations");
                                                        }
                                                    }}
                                                >
                                                    View Details
                                                    <ChevronRight className="size-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    {/* Conversations */}
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
                                        <div className="divide-y">
                                            {conversationsLoading ? (
                                                <div className="p-8 text-center text-muted-foreground">
                                                    Loading conversations...
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
                                                            <div className="w-10 h-10 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center">
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
                                                                <div className="w-2 h-2 bg-green-500 rounded-full" />
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
                                                Start New Conversation
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Booked Appointments */}
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
                onOpenChange={setIsCreateModalOpen}
                onCreateAppointment={createAppointment}
                conversations={conversations}
            />

            <CreateConversationModal
                open={isCreateConversationOpen}
                onOpenChange={setIsCreateConversationOpen}
                onCreateConversation={createConversation}
            />
        </div>
    )
}