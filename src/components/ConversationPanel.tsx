"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Calendar, Paperclip, Trash2, MoreVertical } from "lucide-react"
import { useConversations } from "@/hooks/useConversations"
import { useUser } from "@clerk/nextjs"
import { format } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConversationPanelProps {
  conversationId: string
  onSendMessage: (conversationId: string, data: any) => Promise<void>
  onCreateAppointment: () => void
  onDeleteConversation?: (conversationId: string) => Promise<void>
}

export function ConversationPanel({
  conversationId,
  onSendMessage,
  onCreateAppointment,
  onDeleteConversation
}: ConversationPanelProps) {
  const [message, setMessage] = React.useState('')
  const [isSending, setIsSending] = React.useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const { conversations } = useConversations()
  const { user: currentUser } = useUser()
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const conversation = conversations.find(c => c._id === conversationId)

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [conversation?.messages])

  const handleSend = async () => {
    if (!message.trim()) return

    setIsSending(true)
    try {
      await onSendMessage(conversationId, { content: message })
      setMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleDelete = async () => {
    if (onDeleteConversation) {
      try {
        await onDeleteConversation(conversationId)
        setShowDeleteDialog(false)
      } catch (error) {
        console.error('Failed to delete conversation:', error)
      }
    }
  }

  if (!conversation) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Conversation not found</p>
        </CardContent>
      </Card>
    )
  }

  // Get the conversation name/title
  const getConversationTitle = () => {
    if (conversation.type === 'group') {
      return conversation.name || 'Group Chat'
    }

    // For direct messages, find the other participant
    // Note: Assuming participants still use MongoDB IDs in the backend. 
    // This comparison might need adjustment if users are fully migrated to Clerk IDs in backend.
    const otherParticipant = conversation.participants.find(
      p => p._id !== currentUser?.id
    )

    return otherParticipant?.name || 'Unknown User'
  }

  return (
    <>
      <Card className="flex flex-col h-[600px]">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              {getConversationTitle()}
              {conversation.type === 'group' && (
                <span className="text-xs text-muted-foreground font-normal">
                  ({conversation.participants.length} members)
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={onCreateAppointment}
              >
                <Calendar className="size-4" />
                Schedule
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="size-4 mr-2" />
                    Delete Conversation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {conversation.messages.map((msg, idx) => {
              const sender = conversation.participants.find(p => p._id === msg.senderId)
              const isCurrentUser = msg.senderId === currentUser?.id

              return (
                <div
                  key={msg._id || idx}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${isCurrentUser
                      ? 'bg-green-500 text-white'
                      : 'bg-muted'
                      }`}
                  >
                    {!isCurrentUser && sender && (
                      <p className="text-xs font-medium mb-1">
                        {sender.name}
                      </p>
                    )}
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${isCurrentUser ? 'text-white/70' : 'text-muted-foreground'}`}>
                      {format(new Date(msg.createdAt), 'p')}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Button variant="ghost" size="icon">
              <Paperclip className="size-4" />
            </Button>
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              disabled={isSending}
            />
            <Button
              onClick={handleSend}
              disabled={isSending || !message.trim()}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation with {getConversationTitle()}?
              This action cannot be undone and all messages will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}