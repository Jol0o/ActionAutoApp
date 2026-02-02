"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Video, 
  Phone, 
  Mail,
  Edit2,
  Save,
  X,
  Trash2,
  Ban,
  CheckCircle,
  AlertCircle,
  Link as LinkIcon
} from "lucide-react"
import { Appointment } from "@/types/appointment"
import { format } from "date-fns"
import { useAuth } from "@/context/AuthContext"
import { DatePicker } from "@/components/ui/date-picker"
import { TimePicker } from "@/components/ui/time-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AppointmentDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: Appointment | null
  onUpdate: (id: string, data: any) => Promise<void>
  onCancel: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function AppointmentDetailsModal({
  open,
  onOpenChange,
  appointment,
  onUpdate,
  onCancel,
  onDelete
}: AppointmentDetailsModalProps) {
  const { user: currentUser } = useAuth()
  const [isEditing, setIsEditing] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [editData, setEditData] = React.useState<any>({})

  React.useEffect(() => {
    if (appointment) {
      setEditData({
        title: appointment.title,
        description: appointment.description || '',
        startDate: new Date(appointment.startTime),
        startTime: appointment.startTime,
        endDate: new Date(appointment.endTime),
        endTime: appointment.endTime,
        location: appointment.location || '',
        type: appointment.type,
        meetingLink: appointment.meetingLink || '',
        notes: appointment.notes || ''
      })
    }
  }, [appointment])

  if (!appointment) return null

  const isCreator = appointment.createdBy._id === currentUser?._id
  const canEdit = isCreator
  const canCancel = isCreator && appointment.status !== 'cancelled'
  const canDelete = isCreator

  const getTypeIcon = (type: string) => {
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

  const handleSave = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const startDateTime = new Date(editData.startDate)
      const startTime = new Date(editData.startTime)
      startDateTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0)

      const endDateTime = new Date(editData.endDate)
      const endTime = new Date(editData.endTime)
      endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0)

      if (endDateTime <= startDateTime) {
        setError('End time must be after start time')
        setIsSubmitting(false)
        return
      }

      await onUpdate(appointment._id, {
        title: editData.title,
        description: editData.description || undefined,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        location: editData.location || undefined,
        type: editData.type,
        meetingLink: editData.meetingLink || undefined,
        notes: editData.notes || undefined
      })

      setIsEditing(false)
      setError(null)
    } catch (error: any) {
      setError(error.message || 'Failed to update')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return

    setIsSubmitting(true)
    try {
      await onCancel(appointment._id)
      onOpenChange(false)
    } catch (error: any) {
      setError(error.message || 'Failed to cancel')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this appointment? This action cannot be undone.')) return

    setIsSubmitting(true)
    try {
      await onDelete(appointment._id)
      onOpenChange(false)
    } catch (error: any) {
      setError(error.message || 'Failed to delete')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {isEditing ? 'Edit ' : ''}
              {appointment.entryType.charAt(0).toUpperCase() + appointment.entryType.slice(1)} Details
            </DialogTitle>
            <div className="flex gap-2">
              <Badge className={getEntryTypeColor(appointment.entryType)}>
                {appointment.entryType}
              </Badge>
              <Badge className={getStatusColor(appointment.status)}>
                {appointment.status}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label>Title</Label>
            {isEditing ? (
              <Input
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              />
            ) : (
              <p className="text-lg font-semibold">{appointment.title}</p>
            )}
          </div>

          {/* Description */}
          {(isEditing || appointment.description) && (
            <div className="space-y-2">
              <Label>Description</Label>
              {isEditing ? (
                <Textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={3}
                />
              ) : (
                <p className="text-muted-foreground">{appointment.description}</p>
              )}
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="size-4" />
                Start
              </Label>
              {isEditing ? (
                <>
                  <DatePicker
                    value={editData.startDate}
                    onChange={(date) => date && setEditData({ ...editData, startDate: date })}
                  />
                  <TimePicker
                    value={editData.startTime}
                    onChange={(time) => setEditData({ ...editData, startTime: time })}
                  />
                </>
              ) : (
                <p className="text-sm">
                  {format(new Date(appointment.startTime), 'PPP')}
                  <br />
                  <span className="text-muted-foreground">
                    {format(new Date(appointment.startTime), 'p')}
                  </span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="size-4" />
                End
              </Label>
              {isEditing ? (
                <>
                  <DatePicker
                    value={editData.endDate}
                    onChange={(date) => date && setEditData({ ...editData, endDate: date })}
                  />
                  <TimePicker
                    value={editData.endTime}
                    onChange={(time) => setEditData({ ...editData, endTime: time })}
                  />
                </>
              ) : (
                <p className="text-sm">
                  {format(new Date(appointment.endTime), 'PPP')}
                  <br />
                  <span className="text-muted-foreground">
                    {format(new Date(appointment.endTime), 'p')}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Type & Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              {isEditing ? (
                <Select
                  value={editData.type}
                  onValueChange={(value) => setEditData({ ...editData, type: value })}
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
              ) : (
                <div className="flex items-center gap-2">
                  {getTypeIcon(appointment.type)}
                  <span className="text-sm capitalize">{appointment.type.replace('-', ' ')}</span>
                </div>
              )}
            </div>

            {(isEditing || appointment.location) && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="size-4" />
                  Location
                </Label>
                {isEditing ? (
                  <Input
                    value={editData.location}
                    onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                  />
                ) : (
                  <p className="text-sm">{appointment.location}</p>
                )}
              </div>
            )}
          </div>

          {/* Meeting Link */}
          {(isEditing || appointment.meetingLink) && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <LinkIcon className="size-4" />
                Meeting Link
              </Label>
              {isEditing ? (
                <Input
                  type="url"
                  value={editData.meetingLink}
                  onChange={(e) => setEditData({ ...editData, meetingLink: e.target.value })}
                />
              ) : (
                <a 
                  href={appointment.meetingLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {appointment.meetingLink}
                </a>
              )}
            </div>
          )}

          {/* Participants */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="size-4" />
              Participants ({appointment.participants.length})
            </Label>
            <div className="flex flex-wrap gap-2">
              {appointment.participants.map((participant) => (
                <Badge key={participant._id} variant="outline" className="gap-2">
                  {participant.avatar ? (
                    <img src={participant.avatar} alt="" className="size-4 rounded-full" />
                  ) : (
                    <div className="size-4 rounded-full bg-green-100 dark:bg-green-950" />
                  )}
                  {participant.name}
                  {participant._id === appointment.createdBy._id && (
                    <span className="text-xs text-muted-foreground">(Organizer)</span>
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Guests */}
          {appointment.guestEmails.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="size-4" />
                External Guests ({appointment.guestEmails.length})
              </Label>
              <div className="space-y-2">
                {appointment.guestEmails.map((guest, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                    <span className="text-sm">{guest.email}</span>
                    <Badge 
                      variant="outline"
                      className={
                        guest.status === 'accepted' ? 'border-green-500 text-green-700' :
                        guest.status === 'declined' ? 'border-red-500 text-red-700' :
                        'border-gray-300 text-gray-600'
                      }
                    >
                      {guest.status === 'accepted' && <CheckCircle className="size-3 mr-1" />}
                      {guest.status === 'declined' && <X className="size-3 mr-1" />}
                      {guest.status === 'pending' && <Clock className="size-3 mr-1" />}
                      {guest.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {(isEditing || appointment.notes) && (
            <div className="space-y-2">
              <Label>Notes</Label>
              {isEditing ? (
                <Textarea
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  rows={3}
                />
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{appointment.notes}</p>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
            <p>Created by: {appointment.createdBy.name} ({appointment.createdBy.email})</p>
            <p>Created: {format(new Date(appointment.createdAt), 'PPp')}</p>
            {appointment.updatedAt !== appointment.createdAt && (
              <p>Last updated: {format(new Date(appointment.updatedAt), 'PPp')}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-between border-t pt-4">
            <div className="flex gap-2">
              {canDelete && !isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete
                </Button>
              )}
              {canCancel && !isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  <Ban className="size-4 mr-2" />
                  Cancel Appointment
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false)
                      setError(null)
                    }}
                    disabled={isSubmitting}
                  >
                    <X className="size-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <Save className="size-4 mr-2" />
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                  >
                    Close
                  </Button>
                  {canEdit && (
                    <Button
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Edit2 className="size-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}