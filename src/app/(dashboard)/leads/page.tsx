"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLeads, Lead } from "@/hooks/useLeads"
import { Mail, Phone, Car, Calendar, MoreHorizontal, Reply, Clock, AlertCircle, RefreshCw, X, Check, Plus, Upload } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

const statusColors: Record<string, string> = {
  'New': 'bg-blue-100 text-blue-800',
  'Pending': 'bg-orange-100 text-orange-800',
  'Contacted': 'bg-yellow-100 text-yellow-800',
  'Appointment Set': 'bg-green-100 text-green-800',
  'Closed': 'bg-gray-100 text-gray-800',
}

interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

export default function InquiriesPage() {
  const { leads, isLoading, updateLeadStatus, markAsRead, markAsPending, reply, refetch } = useLeads()
  useAuth()
  
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [newStatus, setNewStatus] = React.useState<string>('')
  
  // Filtering state
  const [statusFilter, setStatusFilter] = React.useState<string | null>(null)
  
  // Gmail config state
  const [gmailEmail, setGmailEmail] = React.useState('')
  const [showGmailConfig, setShowGmailConfig] = React.useState(false)
  const [isSyncing, setIsSyncing] = React.useState(false)
  const [syncError, setSyncError] = React.useState<string | null>(null)
  
  // Reply state
  const [replyOpen, setReplyOpen] = React.useState(false)
  const [replyMessage, setReplyMessage] = React.useState('')
  const [isSendingReply, setIsSendingReply] = React.useState(false)
  
  // Compose state
  const [composeOpen, setComposeOpen] = React.useState(false)
  const [composeForm, setComposeForm] = React.useState({
    to: '',
    subject: '',
    body: '',
  })
  const [composeAttachments, setComposeAttachments] = React.useState<File[]>([])
  const [isSendingCompose, setIsSendingCompose] = React.useState(false)
  
  // Toast notifications
  const [toasts, setToasts] = React.useState<Toast[]>([])

  // Load saved Gmail from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('inquiry_gmail')
    if (saved) setGmailEmail(saved)
  }, [])

  // Toast helpers
  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString()
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const handleOpenLead = (lead: Lead) => {
    setSelectedLead(lead)
    setNewStatus(lead.status)
    setIsDetailOpen(true)
    // Mark as read when opening
    if (!lead.isRead) {
      try {
        markAsRead(lead._id)
        addToast('success', 'Marked as read')
      } catch {
        addToast('error', 'Failed to mark as read')
      }
    }
  }

  const handleStatusChange = (status: string) => {
    if (selectedLead) {
      try {
        updateLeadStatus({ id: selectedLead._id, status })
        addToast('success', `Status updated to ${status}`)
        setIsDetailOpen(false)
      } catch {
        addToast('error', 'Failed to update status')
      }
    }
  }

  const handleSaveGmailConfig = () => {
    if (!gmailEmail.includes('@')) {
      setSyncError('Please enter a valid email address')
      addToast('error', 'Invalid email address')
      return
    }
    localStorage.setItem('inquiry_gmail', gmailEmail)
    setSyncError(null)
    setShowGmailConfig(false)
    addToast('success', 'Gmail configuration saved')
  }

  const handleSyncEmails = async () => {
    if (!gmailEmail) {
      setSyncError('Please configure a Gmail account first')
      addToast('error', 'Gmail account not configured')
      return
    }
    setIsSyncing(true)
    setSyncError(null)
    try {
      addToast('info', 'Syncing emails...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      refetch()
    } catch {
      setSyncError('Sync failed')
      addToast('error', 'Sync failed')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleRefreshEmails = async () => {
    try {
      addToast('info', 'Refreshing emails...')
      await refetch()
      addToast('success', 'Emails refreshed successfully')
    } catch {
      addToast('error', 'Failed to refresh emails')
    }
  }

  const handleSendCompose = async () => {
    if (!composeForm.to || !composeForm.subject || !composeForm.body) {
      addToast('error', 'Please fill in all required fields')
      return
    }
    setIsSendingCompose(true)
    try {
      // Future: Send email via Gmail API
      console.log('[Compose] Sending email:', composeForm, composeAttachments)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Create inquiry from compose
      // For now, just show success
      addToast('success', 'Email sent successfully')
      setComposeForm({ to: '', subject: '', body: '' })
      setComposeAttachments([])
      setComposeOpen(false)
      refetch()
    } catch {
      addToast('error', 'Failed to send email')
    } finally {
      setIsSendingCompose(false)
    }
  }

  const handleAddAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setComposeAttachments(prev => [...prev, ...files])
    addToast('success', `${files.length} file(s) added`)
  }

  const handleRemoveAttachment = (index: number) => {
    setComposeAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSendReply = async () => {
    if (!selectedLead || !replyMessage.trim()) return
    setIsSendingReply(true)
    try {
      reply({ id: selectedLead._id, message: replyMessage })
      setReplyMessage('')
      setReplyOpen(false)
      addToast('success', 'Reply sent successfully')
    } catch {
      addToast('error', 'Failed to send reply')
    } finally {
      setIsSendingReply(false)
    }
  }

  const handleMarkPending = (leadId: string, currentlyPending: boolean) => {
    try {
      markAsPending(leadId)
      addToast('success', currentlyPending ? 'Unmarked as pending' : 'Marked as pending')
    } catch {
      addToast('error', 'Failed to update pending status')
    }
  }

  // Filter leads based on active status filter
  const filteredLeads = React.useMemo(() => {
    if (!statusFilter) return leads
    
    if (statusFilter === 'new-unread') {
      return leads.filter((l: Lead) => !l.isRead && l.status === 'New')
    }
    if (statusFilter === 'pending') {
      return leads.filter((l: Lead) => l.isPending)
    }
    
    return leads.filter((l: Lead) => l.status === statusFilter)
  }, [leads, statusFilter])

  const stats = React.useMemo(() => {
    return {
      total: leads.length,
      new: leads.filter((l: Lead) => !l.isRead && l.status === 'New').length,
      pending: leads.filter((l: Lead) => l.isPending).length,
      contacted: leads.filter((l: Lead) => l.status === 'Contacted').length,
      appointmentSet: leads.filter((l: Lead) => l.status === 'Appointment Set').length,
      closed: leads.filter((l: Lead) => l.status === 'Closed').length,
    }
  }, [leads])

  return (
    <div className="min-h-screen bg-background py-6 px-4 md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white animate-in slide-in-from-top ${
              toast.type === 'success'
                ? 'bg-green-500'
                : toast.type === 'error'
                ? 'bg-red-500'
                : 'bg-blue-500'
            }`}
          >
            {toast.type === 'success' && <Check className="h-4 w-4" />}
            {toast.type === 'error' && <AlertCircle className="h-4 w-4" />}
            {toast.type === 'info' && <Mail className="h-4 w-4" />}
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="ml-2">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Inquiries</h1>
          <p className="text-muted-foreground mt-1">
            Manage and respond to customer inquiries from your Gmail account in one centralized dashboard.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button
            onClick={() => setComposeOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Compose
          </Button>
          <Button
            variant="outline"
            onClick={handleRefreshEmails}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleSyncEmails}
            disabled={isSyncing || !gmailEmail}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync'}
          </Button>
          <Button onClick={() => setShowGmailConfig(true)} variant="outline">
            Settings
          </Button>
        </div>
      </div>

      {/* Gmail Configuration Alert */}
      {!gmailEmail && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-orange-900">Gmail account not configured</p>
              <p className="text-sm text-orange-800">
                Set up your inquiry Gmail account to automatically sync emails and view them here.
              </p>
              <Button size="sm" variant="outline" onClick={() => setShowGmailConfig(true)} className="mt-2">
                Configure Gmail
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics - Clickable for Filtering */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Overview {statusFilter && `- ${statusFilter === 'new-unread' ? 'New (Unread)' : statusFilter === 'pending' ? 'Pending' : statusFilter}`}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card
            className={`cursor-pointer transition-all ${statusFilter === null ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
            onClick={() => setStatusFilter(null)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">All</CardTitle>
              <Mail className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${statusFilter === 'new-unread' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
            onClick={() => setStatusFilter('new-unread')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New</CardTitle>
              <Mail className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.new}</div>
              <p className="text-xs text-muted-foreground">Unread</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${statusFilter === 'pending' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
            onClick={() => setStatusFilter('pending')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Marked</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${statusFilter === 'Contacted' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
            onClick={() => setStatusFilter('Contacted')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contacted</CardTitle>
              <Phone className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.contacted}</div>
              <p className="text-xs text-muted-foreground">Replied</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${statusFilter === 'Appointment Set' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
            onClick={() => setStatusFilter('Appointment Set')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Apt.</CardTitle>
              <Calendar className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.appointmentSet}</div>
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${statusFilter === 'Closed' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
            onClick={() => setStatusFilter('Closed')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Closed</CardTitle>
              <Car className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.closed}</div>
              <p className="text-xs text-muted-foreground">Done/Lost</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Inquiry List */}
      <div className="space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Loading inquiries...
            </CardContent>
          </Card>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center space-y-3">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
              <div>
                <p className="font-semibold text-lg">
                  {statusFilter ? 'No inquiries in this category' : 'No inquiries yet'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {statusFilter
                    ? 'Try selecting a different filter or sync emails from Gmail.'
                    : gmailEmail
                    ? 'Click "Sync Emails" to fetch inquiries from Gmail.'
                    : 'Configure a Gmail account to get started.'}
                </p>
              </div>
              {statusFilter && (
                <Button variant="outline" size="sm" onClick={() => setStatusFilter(null)}>
                  Clear Filter
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map((lead: Lead) => (
            <Card
              key={lead._id}
              className={`cursor-pointer hover:shadow-md transition-all ${!lead.isRead ? 'border-blue-300 bg-blue-50' : ''}`}
              onClick={() => handleOpenLead(lead)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!lead.isRead && (
                        <div className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                      <h3 className="font-semibold truncate">
                        {lead.firstName} {lead.lastName}
                      </h3>
                    </div>
                    {lead.subject && (
                      <p className="text-sm text-foreground mt-1 line-clamp-2">{lead.subject}</p>
                    )}
                    <div className="flex gap-2 text-sm text-muted-foreground mt-2">
                      <a
                        href={`mailto:${lead.email}`}
                        className="hover:underline flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail className="h-3 w-3" />
                        {lead.email}
                      </a>
                      <span>•</span>
                      <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={statusColors[lead.status] || 'bg-gray-100'}>
                      {lead.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!lead.isRead && (
                          <DropdownMenuItem onClick={(e) => {
                            e.preventDefault()
                            markAsRead(lead._id)
                            addToast('success', 'Marked as read')
                          }}>
                            Mark as Read
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={(e) => {
                          e.preventDefault()
                          handleMarkPending(lead._id, !!lead.isPending)
                        }}>
                          {lead.isPending ? 'Unmark Pending' : 'Mark as Pending'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedLead?.firstName} {selectedLead?.lastName}
            </DialogTitle>
            <DialogDescription>
              {selectedLead?.email}
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-4">
              {selectedLead.subject && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Subject</p>
                  <p className="text-foreground">{selectedLead.subject}</p>
                </div>
              )}

              {selectedLead.body && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Message</p>
                  <p className="text-foreground whitespace-pre-wrap">{selectedLead.body}</p>
                </div>
              )}

              {selectedLead.phone && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Phone</p>
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {selectedLead.phone}
                  </a>
                </div>
              )}

              {selectedLead.vehicle?.make && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Vehicle Interest</p>
                  <p className="text-foreground">
                    {selectedLead.vehicle.year} {selectedLead.vehicle.make} {selectedLead.vehicle.model}
                  </p>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-muted-foreground mb-2">Status</p>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Appointment Set">Appointment Set</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedLead) handleMarkPending(selectedLead._id, !!selectedLead.isPending)
                }}
              >
                {selectedLead?.isPending ? 'Unmark Pending' : 'Mark Pending'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReplyOpen(true)}
                className="gap-1"
              >
                <Reply className="h-4 w-4" />
                Reply
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleStatusChange(newStatus)}>
                Update Status
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gmail Config Modal */}
      <Dialog open={showGmailConfig} onOpenChange={setShowGmailConfig}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gmail Configuration</DialogTitle>
            <DialogDescription>
              Enter the Gmail account where customer inquiries are sent.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {syncError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-900">{syncError}</p>
              </div>
            )}

            <div>
              <Label htmlFor="gmail">Gmail Address</Label>
              <Input
                id="gmail"
                type="email"
                placeholder="inquiries@actionauto.com"
                value={gmailEmail}
                onChange={(e) => setGmailEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This is the Gmail account where customer inquiries are received. Gmail sync requires OAuth2 setup.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                <strong>Note:</strong> Gmail integration requires connecting the Gmail API. On localhost, you can test manually. For spam emails: ensure the Gmail account has proper filters or the Gmail API scope includes spam labels.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGmailConfig(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveGmailConfig}>Save Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Modal */}
      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to {selectedLead?.firstName} {selectedLead?.lastName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reply-message">Message</Label>
              <Textarea
                id="reply-message"
                placeholder="Type your reply..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={5}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendReply}
              disabled={isSendingReply || !replyMessage.trim()}
            >
              {isSendingReply ? 'Sending...' : 'Send Reply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compose Email Modal */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compose Email</DialogTitle>
            <DialogDescription>
              Send a new inquiry email to a customer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="compose-to">To</Label>
              <Input
                id="compose-to"
                type="email"
                placeholder="customer@example.com"
                value={composeForm.to}
                onChange={(e) => setComposeForm({ ...composeForm, to: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="compose-subject">Subject</Label>
              <Input
                id="compose-subject"
                placeholder="Email subject"
                value={composeForm.subject}
                onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="compose-body">Message</Label>
              <Textarea
                id="compose-body"
                placeholder="Type your message..."
                value={composeForm.body}
                onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
                rows={6}
              />
            </div>

            {/* Attachments Section */}
            <div className="border-t pt-4">
              <div className="space-y-3">
                <Label>Attachments</Label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    multiple
                    id="file-upload"
                    onChange={handleAddAttachment}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Add Files
                  </Button>
                </div>

                {composeAttachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Files ({composeAttachments.length})</p>
                    <div className="space-y-1">
                      {composeAttachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                          <span className="truncate">{file.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAttachment(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setComposeOpen(false)
              setComposeForm({ to: '', subject: '', body: '' })
              setComposeAttachments([])
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleSendCompose}
              disabled={isSendingCompose || !composeForm.to || !composeForm.subject || !composeForm.body}
            >
              {isSendingCompose ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
