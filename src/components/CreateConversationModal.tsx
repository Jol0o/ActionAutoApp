"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Plus, X } from "lucide-react"
import { useConversations } from "@/hooks/useConversations"

interface CreateConversationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (conversation: any) => void
}

export function CreateConversationModal({
  open,
  onOpenChange,
  onSuccess
}: CreateConversationModalProps) {
  const { createConversation, isCreatingConversation, error } = useConversations()
  
  const [type, setType] = React.useState<'direct' | 'group' | 'external'>('direct')
  const [name, setName] = React.useState('')
  const [subject, setSubject] = React.useState('')
  const [externalEmails, setExternalEmails] = React.useState<string[]>([])
  const [emailInput, setEmailInput] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data: any = {
      type,
      participants: [], // In real app, you'd select internal users
    }

    if (type === 'group' && name) {
      data.name = name
    }

    if (type === 'external') {
      data.externalEmails = externalEmails
      data.subject = subject || 'Message from Action Auto'
    }

    createConversation(data, {
      onSuccess: (conversation: any) => {
        onSuccess?.(conversation)
        onOpenChange(false)
        resetForm()
      }
    })
  }

  const addEmail = () => {
    if (emailInput && isValidEmail(emailInput)) {
      setExternalEmails([...externalEmails, emailInput.toLowerCase().trim()])
      setEmailInput('')
    }
  }

  const removeEmail = (email: string) => {
    setExternalEmails(externalEmails.filter(e => e !== email))
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const resetForm = () => {
    setType('direct')
    setName('')
    setSubject('')
    setExternalEmails([])
    setEmailInput('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Start New Conversation</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Conversation Type</Label>
            <Select value={type} onValueChange={(value: any) => setType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="direct">Direct Message</SelectItem>
                <SelectItem value="group">Group Chat</SelectItem>
                <SelectItem value="external">External Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 'group' && (
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter group name"
              />
            </div>
          )}

          {type === 'external' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Message subject"
                />
              </div>

              <div className="space-y-2">
                <Label>External Email Addresses</Label>
                <div className="flex gap-2">
                  <Input
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addEmail()
                      }
                    }}
                    placeholder="customer@example.com"
                  />
                  <Button type="button" onClick={addEmail} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {externalEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {externalEmails.map((email) => (
                      <div
                        key={email}
                        className="flex items-center gap-2 bg-blue-100 dark:bg-blue-950 px-3 py-1 rounded-full text-sm"
                      >
                        <span>{email}</span>
                        <button
                          type="button"
                          onClick={() => removeEmail(email)}
                          className="hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreatingConversation}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreatingConversation || (type === 'external' && externalEmails.length === 0)}>
              {isCreatingConversation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Conversation'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}