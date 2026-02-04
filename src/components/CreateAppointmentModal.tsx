"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, MapPin, Users, AlertCircle, Video, Link as LinkIcon } from "lucide-react"
import { Conversation } from "@/types/appointment"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserSearch } from "@/components/UserSearch"
import { GuestEmailInput } from "@/components/GuestEmailInput"
import { DatePicker } from "@/components/ui/date-picker"
import { TimePicker } from "@/components/ui/time-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CreateAppointmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateAppointment: (data: any) => Promise<void>
  conversations: Conversation[]
  preselectedConversation?: string
  preselectedDate?: Date
}

export function CreateAppointmentModal({
  open,
  onOpenChange,
  onCreateAppointment,
  conversations,
  preselectedConversation,
  preselectedDate
}: CreateAppointmentModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    startDate: preselectedDate || new Date(),
    startTime: '',
    endDate: preselectedDate || new Date(),
    endTime: '',
    location: '',
    type: 'in-person',
    entryType: 'appointment',
    conversationId: preselectedConversation || '',
    participants: [] as string[],
    guestEmails: [] as string[],
    meetingLink: '',
    notes: ''
  })

  // Update dates when preselectedDate changes
  React.useEffect(() => {
    if (preselectedDate) {
      setFormData(prev => ({
        ...prev,
        startDate: preselectedDate,
        endDate: preselectedDate
      }))
    }
  }, [preselectedDate])

  // Auto-populate preselected conversation
  React.useEffect(() => {
    if (preselectedConversation) {
      setFormData(prev => ({
        ...prev,
        conversationId: preselectedConversation
      }))
    }
  }, [preselectedConversation])

  const combineDateTime = (date: Date, timeString: string): string => {
    if (!timeString) return date.toISOString()

    const combined = new Date(date)
    const time = new Date(timeString)
    combined.setHours(time.getHours(), time.getMinutes(), 0, 0)
    return combined.toISOString()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate dates and times
      if (!formData.startTime || !formData.endTime) {
        setError('Please select both start and end times')
        setIsSubmitting(false)
        return
      }

      const startDateTime = combineDateTime(formData.startDate, formData.startTime)
      const endDateTime = combineDateTime(formData.endDate, formData.endTime)

      if (new Date(endDateTime) <= new Date(startDateTime)) {
        setError('End time must be after start time')
        setIsSubmitting(false)
        return
      }

      if (new Date(startDateTime) < new Date()) {
        setError('Cannot schedule in the past')
        setIsSubmitting(false)
        return
      }

      // Validate participants or guests
      if (formData.participants.length === 0 && formData.guestEmails.length === 0) {
        setError('Please add at least one participant or guest')
        setIsSubmitting(false)
        return
      }

      // Prepare data
      const appointmentData = {
        title: formData.title,
        description: formData.description || undefined,
        startTime: startDateTime,
        endTime: endDateTime,
        location: formData.location || undefined,
        type: formData.type,
        entryType: formData.entryType,
        conversationId: formData.conversationId || undefined,
        participants: formData.participants,
        guestEmails: formData.guestEmails.length > 0 ? formData.guestEmails : undefined,
        meetingLink: formData.meetingLink || undefined,
        notes: formData.notes || undefined
      }

      await onCreateAppointment(appointmentData)
      onOpenChange(false)

      // Reset form
      setFormData({
        title: '',
        description: '',
        startDate: new Date(),
        startTime: '',
        endDate: new Date(),
        endTime: '',
        location: '',
        type: 'in-person',
        entryType: 'appointment',
        conversationId: '',
        participants: [],
        guestEmails: [],
        meetingLink: '',
        notes: ''
      })
      setError(null)
    } catch (error: any) {
      console.error('Failed to create appointment:', error)
      setError(error.message || 'Failed to create appointment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule New {formData.entryType.charAt(0).toUpperCase() + formData.entryType.slice(1)}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Entry Type Selection */}
          <div className="space-y-2">
            <Label>Entry Type *</Label>
            <Tabs
              value={formData.entryType}
              onValueChange={(value) => setFormData({ ...formData, entryType: value })}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="appointment">Appointment</TabsTrigger>
                <TabsTrigger value="event">Event</TabsTrigger>
                <TabsTrigger value="task">Task</TabsTrigger>
                <TabsTrigger value="reminder">Reminder</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder={`e.g., ${formData.entryType === 'appointment' ? 'Vehicle Inspection' :
                  formData.entryType === 'event' ? 'Team Meeting' :
                    formData.entryType === 'task' ? 'Complete Report' :
                      'Call Client'
                }`}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Date and Time Pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <DatePicker
                value={formData.startDate}
                onChange={(date) => date && setFormData({ ...formData, startDate: date })}
                disablePastDates={true}
              />
            </div>

            <div className="space-y-2">
              <Label>Start Time *</Label>
              <TimePicker
                value={formData.startTime}
                onChange={(time) => setFormData({ ...formData, startTime: time })}
                placeholder="Select start time"
              />
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <DatePicker
                value={formData.endDate}
                onChange={(date) => date && setFormData({ ...formData, endDate: date })}
                disablePastDates={true}
              />
            </div>

            <div className="space-y-2">
              <Label>End Time *</Label>
              <TimePicker
                value={formData.endTime}
                onChange={(time) => setFormData({ ...formData, endTime: time })}
                placeholder="Select end time"
              />
            </div>
          </div>

          {/* Participants Section */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium flex items-center gap-2">
              <Users className="size-4" />
              Participants & Guests
            </h3>

            <UserSearch
              selectedUsers={formData.participants}
              onSelectUsers={(userIds) => setFormData({ ...formData, participants: userIds })}
              label="Internal Participants (Registered Users)"
              placeholder="Search and select participants..."
              multiple={true}
            />

            <GuestEmailInput
              emails={formData.guestEmails}
              onChange={(emails) => setFormData({ ...formData, guestEmails: emails })}
            />
          </div>

          {/* Meeting Details */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium">Meeting Details</h3>

            <div className="space-y-2">
              <Label htmlFor="type">Meeting Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-person">In-Person</SelectItem>
                  <SelectItem value="video">Video Call</SelectItem>
                  <SelectItem value="phone">Phone Call</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder="Meeting location or address"
                  className="pl-10"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>

            {formData.type === 'video' && (
              <div className="space-y-2">
                <Label htmlFor="meetingLink">Meeting Link</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="meetingLink"
                    type="url"
                    placeholder="https://zoom.us/j/... or Google Meet link"
                    className="pl-10"
                    value={formData.meetingLink}
                    onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Optional Fields */}
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="conversation">Link to Conversation (Optional)</Label>
              <Select
                value={formData.conversationId || 'none'}
                onValueChange={(value) => {
                  // Handle "none" value by setting empty string
                  setFormData({ ...formData, conversationId: value === 'none' ? '' : value })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a conversation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {conversations.map((conv) => (
                    <SelectItem key={conv._id} value={conv._id}>
                      {conv.type === 'group' ? conv.name : `Chat with ${conv.participants[0]?.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes or agenda items..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              {isSubmitting ? 'Creating...' : `Create ${formData.entryType.charAt(0).toUpperCase() + formData.entryType.slice(1)}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}