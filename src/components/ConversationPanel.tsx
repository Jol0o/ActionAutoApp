"use client"

import * as React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Send, Search, Calendar, Plus, Loader2, MessageSquare, 
  Mail, RefreshCw, AlertCircle, ExternalLink 
} from "lucide-react"
import { format } from "date-fns"
import { useConversations } from "@/hooks/useConversations"
import { useSocket } from "@/hooks/useSocket"
import { CreateConversationModal } from "@/components/CreateConversationModal"
import { emitTypingStart, emitTypingStop } from "@/lib/socket.client"

interface ConversationPanelCompleteProps {
  onCreateAppointment?: (conversationId: string) => void
}

export function ConversationPanelComplete({ onCreateAppointment }: ConversationPanelCompleteProps) {
  const {
    conversations,
    isLoading,
    error,
    sendMessage,
    isSendingMessage,
    syncGmail,
    isSyncingGmail,
    refetchConversations,
  } = useConversations()

  const { isConnected, newMessage, joinConversation, leaveConversation } = useSocket()

  const [selectedConversation, setSelectedConversation] = React.useState<any>(null)
  const [messageText, setMessageText] = React.useState("")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [isTyping, setIsTyping] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined)

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConversation?.messages])

  // Handle new messages from socket
  React.useEffect(() => {
    if (newMessage && selectedConversation?._id === newMessage.conversationId) {
      // Refresh conversation to get new message
      refetchConversations()
    }
  }, [newMessage, selectedConversation, refetchConversations])

  // Join/leave conversation rooms
  React.useEffect(() => {
    if (selectedConversation) {
      joinConversation(selectedConversation._id)
      return () => {
        leaveConversation(selectedConversation._id)
      }
    }
  }, [selectedConversation, joinConversation, leaveConversation])

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || isSendingMessage) return

    const content = messageText
    setMessageText("")

    sendMessage({
      conversationId: selectedConversation._id,
      content,
      type: 'text',
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value)

    if (!isTyping && selectedConversation) {
      setIsTyping(true)
      emitTypingStart(selectedConversation._id)
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      if (selectedConversation) {
        emitTypingStop(selectedConversation._id)
      }
    }, 1000)
  }

  const filteredConversations = React.useMemo(() => {
    if (!conversations) return []
    
    if (!searchQuery) return conversations

    const query = searchQuery.toLowerCase()
    return conversations.filter((conv: any) => {
      const name = conv.name?.toLowerCase() || ''
      const participantNames = conv.participants.map((p: any) => p.name.toLowerCase()).join(' ')
      const externalEmails = conv.externalEmails.map((e: any) => e.email.toLowerCase()).join(' ')
      
      return name.includes(query) || participantNames.includes(query) || externalEmails.includes(query)
    })
  }, [conversations, searchQuery])

  const getConversationName = (conv: any) => {
    if (conv.name) return conv.name
    if (conv.externalEmails.length > 0) {
      return conv.externalEmails[0].email
    }
    return conv.participants.map((p: any) => p.name).join(', ')
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handleSyncGmail = () => {
    syncGmail(undefined, {
      onSuccess: () => {
        refetchConversations()
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading conversations...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Conversations</h2>
          <Badge variant={isConnected ? "default" : "secondary"} className={isConnected ? "bg-green-500" : ""}>
            {isConnected ? "Connected" : "Offline"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncGmail}
            disabled={isSyncingGmail}
          >
            {isSyncingGmail ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Sync Gmail</span>
          </Button>
          <Button onClick={() => setCreateModalOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[600px]">
        {/* Conversations List */}
        <Card className="col-span-4">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  No conversations found
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setCreateModalOpen(true)}
                  >
                    Start a conversation
                  </Button>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredConversations.map((conv: any) => (
                    <button
                      key={conv._id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-muted ${
                        selectedConversation?._id === conv._id ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage src={conv.participants[0]?.avatar} />
                          <AvatarFallback>
                            {conv.type === 'external' ? <Mail className="h-4 w-4" /> : getInitials(getConversationName(conv))}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm truncate flex items-center gap-2">
                              {getConversationName(conv)}
                              {conv.type === 'external' && (
                                <Badge variant="outline" className="text-xs">
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Email
                                </Badge>
                              )}
                            </span>
                          </div>
                          {conv.lastMessage && (
                            <p className="text-xs text-muted-foreground truncate">
                              {conv.lastMessage}
                            </p>
                          )}
                          {conv.lastMessageAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(conv.lastMessageAt), 'MMM d, p')}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Messages Panel */}
        <Card className="col-span-8 flex flex-col">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={selectedConversation.participants[0]?.avatar} />
                      <AvatarFallback>
                        {selectedConversation.type === 'external' ? (
                          <Mail className="h-4 w-4" />
                        ) : (
                          getInitials(getConversationName(selectedConversation))
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        {getConversationName(selectedConversation)}
                        {selectedConversation.type === 'external' && (
                          <Badge variant="outline">
                            <Mail className="h-3 w-3 mr-1" />
                            External Email
                          </Badge>
                        )}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {selectedConversation.type === 'external'
                          ? `${selectedConversation.externalEmails.length} external recipient(s)`
                          : `${selectedConversation.participants.length} participant(s)`}
                      </p>
                    </div>
                  </div>
                  
                  {onCreateAppointment && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCreateAppointment(selectedConversation._id)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-4 overflow-hidden">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-4">
                    {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                      selectedConversation.messages.map((message: any) => (
                        <div
                          key={message._id}
                          className={`flex items-start gap-3 ${
                            message.isFromExternal ? 'bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg' : ''
                          }`}
                        >
                          <Avatar className="h-8 w-8">
                            {message.sender ? (
                              <>
                                <AvatarImage src={message.sender.avatar} />
                                <AvatarFallback>
                                  {getInitials(message.sender.name)}
                                </AvatarFallback>
                              </>
                            ) : (
                              <AvatarFallback>
                                <Mail className="h-4 w-4" />
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {message.sender?.name || message.senderEmail || 'External'}
                              </span>
                              {message.isFromExternal && (
                                <Badge variant="outline" className="text-xs">
                                  <Mail className="h-3 w-3 mr-1" />
                                  Email
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(message.createdAt), 'MMM d, p')}
                              </span>
                            </div>
                            
                            {message.type === 'appointment' ? (
                              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                                  <Calendar className="h-4 w-4" />
                                  <span className="font-medium text-sm">{message.content}</span>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-foreground bg-muted rounded-lg p-3 whitespace-pre-wrap">
                                {message.content}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-12">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No messages yet</p>
                        <p className="text-xs">Start the conversation!</p>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder={
                      selectedConversation.type === 'external'
                        ? "Type message (will be sent via Gmail)..."
                        : "Type a message..."
                    }
                    value={messageText}
                    onChange={handleTyping}
                    onKeyPress={handleKeyPress}
                    disabled={isSendingMessage}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!messageText.trim() || isSendingMessage}
                  >
                    {isSendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {selectedConversation.type === 'external' && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Messages will be sent to: {selectedConversation.externalEmails.map((e: any) => e.email).join(', ')}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      <CreateConversationModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={(conversation) => {
          setSelectedConversation(conversation)
          refetchConversations()
        }}
      />
    </div>
  )
}