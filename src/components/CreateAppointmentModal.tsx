"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, MapPin, Users, AlertCircle } from "lucide-react"
import { Conversation } from "@/types/appointment"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserSearch } from "@/components/UserSearch"

interface CreateAppointmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateAppointment: (data: any) => Promise<void>
  conversations: Conversation[]
  preselectedConversation?: string
}

export function CreateAppointmentModal({
  open,
  onOpenChange,
  onCreateAppointment,
  conversations,
  preselectedConversation
}: CreateAppointmentModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    type: 'in-person',
    conversationId: preselectedConversation || '',
    participants: [] as string[]
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate dates
      if (formData.startTime && formData.endTime) {
        const start = new Date(formData.startTime)
        const end = new Date(formData.endTime)
        
        if (end <= start) {
          setError('End time must be after start time')
          setIsSubmitting(false)
          return
        }
      }

      // Validate participants
      if (formData.participants.length === 0) {
        setError('Please select at least one participant')
        setIsSubmitting(false)
        return
      }

      await onCreateAppointment(formData)
      onOpenChange(false)
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        location: '',
        type: 'in-person',
        conversationId: '',
        participants: []
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule New Appointment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Appointment Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Vehicle Inspection"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add details about the appointment..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* PARTICIPANT SELECTION - NEW */}
          <UserSearch
            selectedUsers={formData.participants}
            onSelectUsers={(userIds) => setFormData({ ...formData, participants: userIds })}
            label="Participants *"
            placeholder="Search and select participants..."
            multiple={true}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="startTime"
                  type="datetime-local"
                  className="pl-10"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="endTime"
                  type="datetime-local"
                  className="pl-10"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Appointment Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in-person">In-Person</SelectItem>
                <SelectItem value="phone">Phone Call</SelectItem>
                <SelectItem value="video">Video Call</SelectItem>
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
                placeholder="Meeting location or link"
                className="pl-10"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conversation">Link to Conversation (Optional)</Label>
            <Select
              value={formData.conversationId}
              onValueChange={(value) => setFormData({ ...formData, conversationId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a conversation" />
              </SelectTrigger>
              <SelectContent>
                {conversations.map((conv) => (
                  <SelectItem key={conv._id} value={conv._id}>
                    {conv.type === 'group' ? conv.name : `Chat with ${conv.participants[0]?.name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end">
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
              {isSubmitting ? 'Creating...' : 'Create Appointment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}