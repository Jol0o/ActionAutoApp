"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLeads, Lead } from "@/hooks/useLeads"
import {
  Mail,
  Phone,
  Car,
  Calendar,
  MoreHorizontal,
  Reply,
  AlertCircle,
  RefreshCw,
  X,
  Check,
  Plus,
  Upload,
  Send,
  Inbox,
  Clock3,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { GoogleCalendarConnect } from "@/components/GoogleCalendarConnect"
import { apiClient } from "@/lib/api-client"
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
  'New': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  'Pending': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
  'Contacted': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  'Appointment Set': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  'Closed': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
}

const statusButtonMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'New': {
    label: 'New',
    color: 'bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800',
    icon: <Inbox className="h-4 w-4" />,
  },
  'Pending': {
    label: 'Not Replied',
    color: 'bg-orange-100 hover:bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-100 dark:hover:bg-orange-800',
    icon: <Clock3 className="h-4 w-4" />,
  },
  'Contacted': {
    label: 'Contacted',
    color: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 dark:hover:bg-yellow-800',
    icon: <CheckCircle className="h-4 w-4" />,
  },
  'Appointment Set': {
    label: 'Appointment',
    color: 'bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-800',
    icon: <Calendar className="h-4 w-4" />,
  },
  'Closed': {
    label: 'Closed',
    color: 'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
    icon: <XCircle className="h-4 w-4" />,
  },
}

interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
  timestamp: Date
}

export function LeadsTab() {
  const {
    leads,
    isLoading,
    updateLeadStatus,
    markAsRead,
    markAsPending,
    refetch,
    isSyncingGmail,
  } = useLeads()
  const { getToken, userId } = useAuth()

  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null)

  // Filtering state
  const [statusFilter, setStatusFilter] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')

  // Gmail config state
  const [loggedInEmail, setLoggedInEmail] = React.useState('')
  const [gmailSynced, setGmailSynced] = React.useState(false)
  const [showGmailConfig, setShowGmailConfig] = React.useState(false)
  const [syncError, setSyncError] = React.useState<string | null>(null)
  const [isGoogleConnected, setIsGoogleConnected] = React.useState(false)
  const [isCheckingGoogle, setIsCheckingGoogle] = React.useState(false)

  // Auto-sync state
  const [autoSyncEnabled, setAutoSyncEnabled] = React.useState(false)
  const [lastSyncTime, setLastSyncTime] = React.useState<string>('')

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

  // Appointment dialog state
  const [appointmentOpen, setAppointmentOpen] = React.useState(false)
  const [appointmentForm, setAppointmentForm] = React.useState({
    date: '',
    time: '',
    notes: '',
  })

  // Toast notifications
  const [toasts, setToasts] = React.useState<Toast[]>([])

  // Load saved Gmail from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('inquiry_gmail_synced') === 'true'
    setGmailSynced(saved)
    const autoSync = localStorage.getItem('inquiry_auto_sync') === 'true'
    setAutoSyncEnabled(autoSync)
  }, [])

  // Check Google Calendar connection
  React.useEffect(() => {
    if (showGmailConfig) {
      checkGoogleConnection()
    }
  }, [showGmailConfig])

  // Setup auto-sync interval
  React.useEffect(() => {
    if (!autoSyncEnabled || !gmailSynced) return

    const syncInterval = setInterval(async () => {
      try {
        await handleAutoSync()
      } catch (error) {
        console.error('Auto-sync failed:', error)
      }
    }, 5 * 60 * 1000)

    return () => clearInterval(syncInterval)
  }, [autoSyncEnabled, gmailSynced])

  // Get logged-in user email from Clerk
  React.useEffect(() => {
    const getEmail = async () => {
      try {
        const token = await getToken()
        const response = await apiClient.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const email = response.data?.email || userId || ''
        setLoggedInEmail(email)
        localStorage.setItem('inquiry_gmail', email)
      } catch (error) {
        console.error('Failed to get logged-in email:', error)
      }
    }
    getEmail()
  }, [getToken, userId])

  const checkGoogleConnection = async () => {
    try {
      setIsCheckingGoogle(true)
      const token = await getToken()
      const response = await apiClient.get('/api/google-calendar/status', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = response.data?.data || response.data
      setIsGoogleConnected(data.connected || false)
    } catch (error) {
      console.error('Failed to check Google connection:', error)
      setIsGoogleConnected(false)
    } finally {
      setIsCheckingGoogle(false)
    }
  }

  // Toast helpers
  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString()
    const timestamp = new Date()
    setToasts((prev) => [...prev, { id, type, message, timestamp }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const formatToastTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleOpenLead = (lead: Lead) => {
    setSelectedLead(lead)
    if (!lead.isRead) {
      try {
        markAsRead(lead._id)
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
        setSelectedLead((prev) => (prev ? { ...prev, status: status as Lead['status'] } : null))
      } catch {
        addToast('error', 'Failed to update status')
      }
    }
  }

  const handleSaveGmailConfig = async () => {
    if (!isGoogleConnected) {
      setSyncError('Please connect your Google Account first to sync Gmail')
      return
    }

    setSyncError(null)
    setShowGmailConfig(false)
    await handleSyncEmails()
  }

  const handleAutoSync = async () => {
    try {
      const token = await getToken()
      const response = await apiClient.post(
        '/api/leads/sync-gmail',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setLastSyncTime(new Date().toLocaleTimeString())
      const syncedCount = response.data?.syncedCount || 0
      if (syncedCount > 0) {
        addToast('success', `Auto-synced! ${syncedCount} new inquiries imported.`)
      }
      await refetch()
    } catch (error) {
      console.error('[Auto-sync Error]', error)
    }
  }

  const handleSyncEmails = async () => {
    try {
      addToast('info', 'Syncing emails from Gmail...')
      const token = await getToken()
      const result = await apiClient.post(
        '/api/leads/sync-gmail',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const syncedCount = result.data?.syncedCount || 0
      setGmailSynced(true)
      localStorage.setItem('inquiry_gmail_synced', 'true')
      setLastSyncTime(new Date().toLocaleTimeString())
      addToast('success', `Gmail synced! ${syncedCount} new inquiries imported.`)
      await refetch()
    } catch (error: any) {
      console.error('[Sync Error]', error)
      setGmailSynced(false)
      localStorage.setItem('inquiry_gmail_synced', 'false')
      const errorMsg = error?.response?.data?.message || 'Failed to sync Gmail'
      addToast('error', errorMsg)
    }
  }

  const handleRefreshEmails = async () => {
    try {
      addToast('info', 'Refreshing inquiries...')
      await refetch()
      addToast('success', 'Inquiries refreshed successfully')
    } catch {
      addToast('error', 'Failed to refresh inquiries')
    }
  }

  const handleSendCompose = async () => {
    if (!gmailSynced || !loggedInEmail) {
      addToast('error', 'Gmail must be synced first. Please configure your Google Account.')
      return
    }
    if (!composeForm.to || !composeForm.subject || !composeForm.body) {
      addToast('error', 'Please fill in all required fields')
      return
    }
    setIsSendingCompose(true)
    try {
      const token = await getToken()
      await apiClient.post('/api/leads/send-email', composeForm, {
        headers: { Authorization: `Bearer ${token}` },
      })
      addToast('success', 'Email sent successfully')
      setComposeForm({ to: '', subject: '', body: '' })
      setComposeAttachments([])
      setComposeOpen(false)
      await refetch()
    } catch (error: any) {
      addToast('error', error?.response?.data?.message || 'Failed to send email')
    } finally {
      setIsSendingCompose(false)
    }
  }

  const handleAddAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setComposeAttachments((prev) => [...prev, ...files])
    addToast('success', `${files.length} file(s) added`)
  }

  const handleRemoveAttachment = (index: number) => {
    setComposeAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSendReply = async () => {
    if (!selectedLead || !replyMessage.trim()) return
    setIsSendingReply(true)
    try {
      const token = await getToken()
      await apiClient.post(
        `/api/leads/${selectedLead._id}/reply`,
        { message: replyMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setReplyMessage('')
      setReplyOpen(false)
      addToast('success', 'Reply sent successfully')
      updateLeadStatus({ id: selectedLead._id, status: 'Contacted' })
      setSelectedLead((prev) => (prev ? { ...prev, status: 'Contacted' } : null))
      await refetch()
    } catch {
      addToast('error', 'Failed to send reply')
    } finally {
      setIsSendingReply(false)
    }
  }

  const handleMarkPending = (leadId: string, currentlyPending: boolean) => {
    try {
      markAsPending(leadId)
      addToast('success', currentlyPending ? 'Unmarked as pending' : 'Marked for follow-up')
    } catch {
      addToast('error', 'Failed to update status')
    }
  }

  const handleSetAppointment = () => {
    if (selectedLead && appointmentForm.date && appointmentForm.time) {
      try {
        updateLeadStatus({ id: selectedLead._id, status: 'Appointment Set' })
        addToast('success', 'Appointment scheduled')
        setSelectedLead((prev) => (prev ? { ...prev, status: 'Appointment Set' } : null))
        setAppointmentOpen(false)
        setAppointmentForm({ date: '', time: '', notes: '' })
      } catch {
        addToast('error', 'Failed to schedule appointment')
      }
    }
  }

  // Filter and search leads
  const filteredLeads = React.useMemo(() => {
    let filtered = leads

    if (statusFilter) {
      if (statusFilter === 'new-unread') {
        filtered = filtered.filter((l: Lead) => !l.isRead && l.status === 'New')
      } else if (statusFilter === 'pending') {
        filtered = filtered.filter((l: Lead) => l.isPending)
      } else {
        filtered = filtered.filter((l: Lead) => l.status === statusFilter)
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (l: Lead) =>
          l.firstName.toLowerCase().includes(query) ||
          l.lastName.toLowerCase().includes(query) ||
          l.email.toLowerCase().includes(query) ||
          l.subject?.toLowerCase().includes(query) ||
          l.senderEmail?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [leads, statusFilter, searchQuery])

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
    <div className="space-y-6">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white animate-in slide-in-from-top ${
              toast.type === 'success'
                ? 'bg-green-500 dark:bg-green-600'
                : toast.type === 'error'
                ? 'bg-red-500 dark:bg-red-600'
                : 'bg-blue-500 dark:bg-blue-600'
            }`}
          >
            {toast.type === 'success' && <Check className="h-4 w-4" />}
            {toast.type === 'error' && <AlertCircle className="h-4 w-4" />}
            {toast.type === 'info' && <Mail className="h-4 w-4" />}
            <div className="flex-1">
              <span className="text-sm font-medium">{toast.message}</span>
              <span className="text-xs opacity-75 ml-2">{formatToastTime(toast.timestamp)}</span>
            </div>
            <button onClick={() => removeToast(toast.id)} className="ml-2">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Leads Header Actions */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Manage customer inquiries and conversations
        </p>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button
            onClick={() => {
              if (!gmailSynced) {
                addToast('error', 'Please sync Gmail first')
                return
              }
              setComposeOpen(true)
            }}
            disabled={!gmailSynced}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Compose
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefreshEmails} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          {gmailSynced && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncEmails}
              disabled={isSyncingGmail}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncingGmail ? 'animate-spin' : ''}`} />
              {isSyncingGmail ? 'Syncing...' : 'Sync Now'}
            </Button>
          )}
          <Button onClick={() => setShowGmailConfig(true)} variant="outline" size="sm">
            Settings
          </Button>
        </div>
      </div>


      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="dark:bg-slate-900 pl-10 shadow-sm border-slate-200 dark:border-slate-700"
          />
        </div>

        {/* Statistics - Clickable for Filtering */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-3">
          <Card
            className={`cursor-pointer transition-all ${
              statusFilter === null
                ? 'ring-2 ring-blue-500 shadow-md bg-blue-50 dark:bg-blue-950'
                : 'hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            onClick={() => setStatusFilter(null)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-semibold">All</CardTitle>
              <Mail className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">inquiries</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              statusFilter === 'new-unread'
                ? 'ring-2 ring-blue-500 shadow-md bg-blue-50 dark:bg-blue-950'
                : 'hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            onClick={() => setStatusFilter('new-unread')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-semibold">New</CardTitle>
              <Mail className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats.new}</div>
              <p className="text-xs text-muted-foreground mt-1">unread</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              statusFilter === 'Contacted'
                ? 'ring-2 ring-blue-500 shadow-md bg-blue-50 dark:bg-blue-950'
                : 'hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            onClick={() => setStatusFilter('Contacted')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-semibold">Contacted</CardTitle>
              <Phone className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats.contacted}</div>
              <p className="text-xs text-muted-foreground mt-1">replied</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hidden sm:block ${
              statusFilter === 'Appointment Set'
                ? 'ring-2 ring-blue-500 shadow-md bg-blue-50 dark:bg-blue-950'
                : 'hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            onClick={() => setStatusFilter('Appointment Set')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-semibold">Apt.</CardTitle>
              <Calendar className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats.appointmentSet}</div>
              <p className="text-xs text-muted-foreground mt-1">scheduled</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hidden md:block ${
              statusFilter === 'Closed'
                ? 'ring-2 ring-blue-500 shadow-md bg-blue-50 dark:bg-blue-950'
                : 'hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            onClick={() => setStatusFilter('Closed')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-semibold">Closed</CardTitle>
              <Car className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats.closed}</div>
              <p className="text-xs text-muted-foreground mt-1">done</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Split View: List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
        {/* Left: Inquiry List */}
        <div className="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto">
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
                    {searchQuery || statusFilter ? 'No inquiries match' : 'No inquiries yet'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || statusFilter
                      ? 'Try adjusting your filters'
                      : 'Sync your Gmail to get started'}
                  </p>
                </div>
                {(searchQuery || statusFilter) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('')
                      setStatusFilter(null)
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredLeads.map((lead: Lead) => (
              <Card
                key={lead._id}
                className={`cursor-pointer hover:shadow-md transition-all ${
                  selectedLead?._id === lead._id ? 'ring-2 ring-blue-500' : ''
                } ${
                  !lead.isRead
                    ? 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'dark:hover:bg-slate-800'
                }`}
                onClick={() => handleOpenLead(lead)}
              >
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate text-sm">
                          {lead.firstName} {lead.lastName}
                        </h3>
                        {!lead.isRead && (
                          <Badge
                            variant="outline"
                            className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 mt-1"
                          >
                            New
                          </Badge>
                        )}
                      </div>
                      <Badge className={statusColors[lead.status] || 'bg-gray-100'}>
                        {lead.status === 'Appointment Set' ? 'Apt' : lead.status}
                      </Badge>
                    </div>
                    {lead.subject && (
                      <p className="text-xs text-foreground line-clamp-2">{lead.subject}</p>
                    )}
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{lead.email}</span>
                      <span>&bull;</span>
                      <span className="shrink-0">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Right: Inquiry Details */}
        <div className="lg:col-span-2">
          {selectedLead ? (
            <Card className="max-h-[600px] overflow-y-auto flex flex-col">
              {/* Header */}
              <CardHeader className="border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {selectedLead.firstName} {selectedLead.lastName}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      From: {selectedLead.senderEmail || selectedLead.email}
                    </p>
                    {selectedLead.senderName &&
                      selectedLead.senderName !== selectedLead.email && (
                        <p className="text-xs text-muted-foreground">
                          ({selectedLead.senderName})
                        </p>
                      )}
                  </div>
                  <Badge className={statusColors[selectedLead.status] || 'bg-gray-100'}>
                    {selectedLead.status}
                  </Badge>
                </div>
              </CardHeader>

              {/* Email Details */}
              <CardContent className="flex-1 space-y-4 pt-6">
                <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4">
                  <div>
                    <p className="text-muted-foreground font-semibold mb-1">From:</p>
                    <p className="truncate">
                      {selectedLead.senderEmail || selectedLead.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-semibold mb-1">To:</p>
                    <p className="truncate">{loggedInEmail}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-semibold mb-1">Date:</p>
                    <p>{new Date(selectedLead.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-semibold mb-1">Status:</p>
                    <Badge className={statusColors[selectedLead.status] || 'bg-gray-100'}>
                      {selectedLead.status}
                    </Badge>
                  </div>
                </div>

                {selectedLead.subject && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Subject</p>
                    <p className="text-foreground font-medium">{selectedLead.subject}</p>
                  </div>
                )}

                {selectedLead.body && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Message</p>
                    <div className="bg-muted p-4 rounded-lg text-sm text-foreground whitespace-pre-wrap break-words max-h-[200px] overflow-y-auto">
                      {selectedLead.body.replace(/(<([^>]+)>)/gi, '')}
                    </div>
                  </div>
                )}

                <div className="space-y-3 border-t pt-4">
                  {selectedLead.phone && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Phone</p>
                      <a
                        href={`tel:${selectedLead.phone}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {selectedLead.phone}
                      </a>
                    </div>
                  )}

                  {selectedLead.vehicle?.make && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">
                        Vehicle Interest
                      </p>
                      <p className="text-foreground">
                        {selectedLead.vehicle.year} {selectedLead.vehicle.make}{' '}
                        {selectedLead.vehicle.model}
                      </p>
                    </div>
                  )}

                  {selectedLead.comments && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Notes</p>
                      <p className="text-foreground text-sm">{selectedLead.comments}</p>
                    </div>
                  )}
                </div>
              </CardContent>

              {/* Actions */}
              <div className="border-t p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(statusButtonMap).map(([status, info]) => (
                    <Button
                      key={status}
                      variant={selectedLead.status === status ? 'default' : 'outline'}
                      size="sm"
                      className={selectedLead.status === status ? '' : info.color}
                      onClick={() => handleStatusChange(status)}
                    >
                      {info.icon}
                      <span className="text-xs">{info.label}</span>
                    </Button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReplyOpen(true)}
                    className="flex-1 gap-2"
                  >
                    <Reply className="h-4 w-4" />
                    Reply
                  </Button>

                  {selectedLead.status !== 'Appointment Set' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAppointmentOpen(true)}
                      className="flex-1 gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      Schedule
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!selectedLead.isRead && (
                        <DropdownMenuItem
                          onClick={() => {
                            markAsRead(selectedLead._id)
                            addToast('success', 'Marked as read')
                          }}
                        >
                          Mark as Read
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => {
                          handleMarkPending(selectedLead._id, !!selectedLead.isPending)
                        }}
                      >
                        {selectedLead.isPending ? 'Unmark Follow-up' : 'Mark for Follow-up'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const email = selectedLead.senderEmail || selectedLead.email
                          window.location.href = `mailto:${email}`
                        }}
                      >
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          handleStatusChange('Closed')
                        }}
                      >
                        Close Inquiry
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {lastSyncTime && gmailSynced && (
                  <p className="text-xs text-muted-foreground text-center">
                    Last synced: {lastSyncTime}
                  </p>
                )}
              </div>
            </Card>
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <CardContent className="text-center space-y-4">
                <Mail className="h-16 w-16 text-muted-foreground mx-auto opacity-30" />
                <div>
                  <p className="text-lg font-semibold text-muted-foreground">
                    Select an inquiry to view details
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Click on any inquiry from the list to view its full message and details
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Google Account Config Dialog */}
      <Dialog open={showGmailConfig} onOpenChange={setShowGmailConfig}>
        <DialogContent className="max-w-md dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-xl">Google Account Setup</DialogTitle>
            <DialogDescription className="text-sm">
              Connect your Google Account to sync and manage inquiries
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Step 1: Connect Google Account</Label>
              <GoogleCalendarConnect
                title="Google Account"
                description="Connect your Google Account to manage inquiries and emails"
                showFeatures={true}
                features={[
                  'Sync inquiries from Gmail',
                  'Send and receive emails',
                  'Real-time notifications',
                  'Auto-import email threads',
                ]}
              />
            </div>

            {isGoogleConnected && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-sm text-green-900 dark:text-green-100 font-medium">
                  ✓ Google Account connected successfully
                </p>
                {loggedInEmail && (
                  <p className="text-xs text-green-800 dark:text-green-200 mt-1">
                    Email: <span className="font-mono">{loggedInEmail}</span>
                  </p>
                )}
              </div>
            )}

            {syncError && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-900 dark:text-red-100 font-medium">
                  ⚠ {syncError}
                </p>
              </div>
            )}

            {isGoogleConnected && (
              <div className="space-y-3 border-t pt-4">
                <Label className="text-sm font-semibold">Step 2: Auto-Sync Settings</Label>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                  <input
                    type="checkbox"
                    id="auto-sync"
                    checked={autoSyncEnabled}
                    onChange={(e) => {
                      setAutoSyncEnabled(e.target.checked)
                      localStorage.setItem('inquiry_auto_sync', e.target.checked.toString())
                    }}
                    className="h-4 w-4 rounded border-slate-300 cursor-pointer"
                  />
                  <label htmlFor="auto-sync" className="text-sm cursor-pointer">
                    Automatically sync inquiries every 5 minutes
                  </label>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowGmailConfig(false)}>
              Close
            </Button>
            <Button
              onClick={handleSaveGmailConfig}
              disabled={!isGoogleConnected || isCheckingGoogle || isSyncingGmail}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSyncingGmail ? 'Syncing...' : 'Sync Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent className="dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-lg">Reply to {selectedLead?.firstName}</DialogTitle>
            <DialogDescription className="text-sm">
              Responding to:{' '}
              <span className="font-mono text-xs">
                {selectedLead?.senderEmail || selectedLead?.email}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Original Message:
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                {selectedLead?.subject}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-3">
                {selectedLead?.body?.substring(0, 200)}...
              </p>
            </div>

            <div>
              <Label htmlFor="reply-message" className="font-semibold">
                Your Reply
              </Label>
              <Textarea
                id="reply-message"
                placeholder="Type your reply..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={5}
                className="dark:bg-slate-800 border-slate-300 dark:border-slate-600"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setReplyOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendReply}
              disabled={isSendingReply || !replyMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Send className="h-4 w-4" />
              {isSendingReply ? 'Sending...' : 'Send Reply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Scheduling Dialog */}
      <Dialog open={appointmentOpen} onOpenChange={setAppointmentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Appointment</DialogTitle>
            <DialogDescription>
              with {selectedLead?.firstName} {selectedLead?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="apt-date">Date</Label>
              <Input
                id="apt-date"
                type="date"
                value={appointmentForm.date}
                onChange={(e) =>
                  setAppointmentForm({ ...appointmentForm, date: e.target.value })
                }
                className="dark:bg-slate-900"
              />
            </div>

            <div>
              <Label htmlFor="apt-time">Time</Label>
              <Input
                id="apt-time"
                type="time"
                value={appointmentForm.time}
                onChange={(e) =>
                  setAppointmentForm({ ...appointmentForm, time: e.target.value })
                }
                className="dark:bg-slate-900"
              />
            </div>

            <div>
              <Label htmlFor="apt-notes">Notes (Optional)</Label>
              <Textarea
                id="apt-notes"
                placeholder="Add any notes about this appointment..."
                value={appointmentForm.notes}
                onChange={(e) =>
                  setAppointmentForm({ ...appointmentForm, notes: e.target.value })
                }
                rows={3}
                className="dark:bg-slate-900"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAppointmentOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSetAppointment}
              disabled={!appointmentForm.date || !appointmentForm.time}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compose Email Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compose New Email</DialogTitle>
            <DialogDescription>Send a new inquiry or follow-up message</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
              <p className="text-sm">
                <span className="font-semibold">From:</span> {loggedInEmail}
              </p>
            </div>

            <div>
              <Label htmlFor="compose-to">To *</Label>
              <Input
                id="compose-to"
                type="email"
                placeholder="customer@example.com"
                value={composeForm.to}
                onChange={(e) => setComposeForm({ ...composeForm, to: e.target.value })}
                className="dark:bg-slate-900"
              />
            </div>

            <div>
              <Label htmlFor="compose-subject">Subject *</Label>
              <Input
                id="compose-subject"
                placeholder="Email subject"
                value={composeForm.subject}
                onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                className="dark:bg-slate-900"
              />
            </div>

            <div>
              <Label htmlFor="compose-body">Message *</Label>
              <Textarea
                id="compose-body"
                placeholder="Type your message..."
                value={composeForm.body}
                onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
                rows={6}
                className="dark:bg-slate-900"
              />
            </div>

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
                    <p className="text-sm font-semibold">
                      Files ({composeAttachments.length})
                    </p>
                    <div className="space-y-1">
                      {composeAttachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-muted p-2 rounded text-sm dark:bg-slate-800"
                        >
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
            <Button
              variant="outline"
              onClick={() => {
                setComposeOpen(false)
                setComposeForm({ to: '', subject: '', body: '' })
                setComposeAttachments([])
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendCompose}
              disabled={
                isSendingCompose ||
                !composeForm.to ||
                !composeForm.subject ||
                !composeForm.body
              }
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {isSendingCompose ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}