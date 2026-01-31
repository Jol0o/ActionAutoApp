"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Users, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserSearch } from "@/components/UserSearch"

interface CreateConversationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateConversation: (data: any) => Promise<void>
}

export function CreateConversationModal({
  open,
  onOpenChange,
  onCreateConversation
}: CreateConversationModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [conversationType, setConversationType] = React.useState<'direct' | 'group'>('direct')
  const [formData, setFormData] = React.useState({
    type: 'direct' as 'direct' | 'group',
    participants: [] as string[],
    name: ''
  })

  React.useEffect(() => {
    setFormData(prev => ({ ...prev, type: conversationType }))
  }, [conversationType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate participants
      if (formData.participants.length === 0) {
        setError('Please select at least one participant')
        setIsSubmitting(false)
        return
      }

      // Validate group name
      if (formData.type === 'group' && !formData.name.trim()) {
        setError('Please enter a group name')
        setIsSubmitting(false)
        return
      }

      // For direct messages, ensure only 1 participant is selected
      if (formData.type === 'direct' && formData.participants.length > 1) {
        setError('Direct messages can only have one participant')
        setIsSubmitting(false)
        return
      }

      await onCreateConversation({
        type: formData.type,
        participants: formData.participants,
        ...(formData.type === 'group' && { name: formData.name })
      })

      onOpenChange(false)
      
      // Reset form
      setFormData({
        type: 'direct',
        participants: [],
        name: ''
      })
      setConversationType('direct')
      setError(null)
    } catch (error: any) {
      console.error('Failed to create conversation:', error)
      setError(error.message || 'Failed to create conversation. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>

        <Tabs value={conversationType} onValueChange={(v) => setConversationType(v as 'direct' | 'group')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="direct" className="gap-2">
              <MessageSquare className="size-4" />
              Direct Message
            </TabsTrigger>
            <TabsTrigger value="group" className="gap-2">
              <Users className="size-4" />
              Group Chat
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="direct" className="mt-0 space-y-4">
              <UserSearch
                selectedUsers={formData.participants}
                onSelectUsers={(userIds) => setFormData({ ...formData, participants: userIds })}
                label="Select User *"
                placeholder="Search user by name or email..."
                multiple={false}
              />
              <p className="text-sm text-muted-foreground">
                Start a one-on-one conversation with another user
              </p>
            </TabsContent>

            <TabsContent value="group" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">Group Name *</Label>
                <Input
                  id="groupName"
                  placeholder="e.g., Sales Team"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required={formData.type === 'group'}
                />
              </div>

              <UserSearch
                selectedUsers={formData.participants}
                onSelectUsers={(userIds) => setFormData({ ...formData, participants: userIds })}
                label="Add Members *"
                placeholder="Search users by name or email..."
                multiple={true}
              />
              <p className="text-sm text-muted-foreground">
                Create a group chat with multiple participants
              </p>
            </TabsContent>

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
                {isSubmitting ? 'Creating...' : 'Start Conversation'}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}