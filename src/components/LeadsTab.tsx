"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLeads, Lead } from "@/hooks/useLeads"
import { Mail, Phone, Calendar, MoreHorizontal, X, Send, Clock3, XCircle, LockOpen, Lock, ChevronLeft, RefreshCw } from "lucide-react"
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

const statusConfig = {
  'New': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100', icon: <Mail className="h-3 w-3" /> },
  'Pending': { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100', icon: <Clock3 className="h-3 w-3" /> },
  'Contacted': { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100', icon: <Phone className="h-3 w-3" /> },
  'Appointment Set': { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100', icon: <Calendar className="h-3 w-3" /> },
  'Closed': { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100', icon: <XCircle className="h-3 w-3" /> },
}

interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
  timestamp: Date
}

const cleanHTMLContent = (html: string): string => {
  if (!html) return ''
  return html
    .replace(/<!doctype[^>]*>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\r\n/g, '\n')
    .trim()
}

export function LeadsTab() {
  const { leads, isLoading, updateLeadStatus, markAsRead, reply, refetch } = useLeads()
  const { getToken } = useAuth()
  
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null)
  const [statusFilter, setStatusFilter] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [loggedInEmail, setLoggedInEmail] = React.useState('')
  const [gmailSynced, setGmailSynced] = React.useState(false)
  const [showGmailConfig, setShowGmailConfig] = React.useState(false)
  const [syncError, setSyncError] = React.useState<string | null>(null)
  const [isGoogleConnected, setIsGoogleConnected] = React.useState(false)
  const [lastSyncTime, setLastSyncTime] = React.useState<Date | null>(null)
  const [syncCountdown, setSyncCountdown] = React.useState(0)
  
  const [replyMessage, setReplyMessage] = React.useState('')
  const [isSendingReply, setIsSendingReply] = React.useState(false)
  
  const [appointmentOpen, setAppointmentOpen] = React.useState(false)
  const [appointmentForm, setAppointmentForm] = React.useState({ date: '', time: '', notes: '', locationOrVehicle: '' })
  
  const [toasts, setToasts] = React.useState<Toast[]>([])
  const [selectedLeadClosed, setSelectedLeadClosed] = React.useState(false)
  const [messageThreads, setMessageThreads] = React.useState<Record<string, Array<{id: string, sender: string, senderEmail: string, message: string, timestamp: Date, isOwn: boolean}>>>({})
  const [userName, setUserName] = React.useState('')
  const [isSyncing, setIsSyncing] = React.useState(false)
  const [savedAppointments, setSavedAppointments] = React.useState<Record<string, any>>({})

  React.useEffect(() => {
    const saved = localStorage.getItem('inquiry_gmail_synced') === 'true'
    setGmailSynced(saved)

    const checkConnection = async () => {
      try {
        const token = await getToken()
        const response = await apiClient.get('/api/google-calendar/status', { headers: { Authorization: `Bearer ${token}` } })
        const connected = response.data?.data?.connected || false
        if (connected && !saved) {
          setGmailSynced(true)
          localStorage.setItem('inquiry_gmail_synced', 'true')
        }
      } catch (e) {}
    }
    
    checkConnection()
    
    if (saved) {
      const syncInterval = setInterval(async () => {
        try {
          const token = await getToken()
          const result = await apiClient.post('/api/leads/sync-gmail', {}, { headers: { Authorization: `Bearer ${token}` } })
          const newCount = result.data?.syncedCount || 0
          if (newCount > 0) {
            addToast('success', `Auto-synced: ${newCount} new inquiry${newCount > 1 ? 'ies' : ''}`)
          }
          setLastSyncTime(new Date())
          setSyncCountdown(60)
          await refetch()
        } catch (error) {
          console.error('Auto-sync failed:', error)
        }
      }, 60000)

      const countdownInterval = setInterval(() => {
        setSyncCountdown(prev => prev > 0 ? prev - 1 : 0)
      }, 1000)

      return () => {
        clearInterval(syncInterval)
        clearInterval(countdownInterval)
      }
    }
  }, [getToken, gmailSynced])

  React.useEffect(() => {
    const getEmail = async () => {
      try {
        const token = await getToken()
        const response = await apiClient.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        setLoggedInEmail(response.data?.email || '')
        setUserName(response.data?.name || response.data?.email || '')
      } catch (error) {
        console.log('Could not fetch email')
      }
    }
    getEmail()
  }, [getToken])

  React.useEffect(() => {
    if (showGmailConfig) {
      const check = async () => {
        try {
          const token = await getToken()
          const response = await apiClient.get('/api/google-calendar/status', { headers: { Authorization: `Bearer ${token}` } })
          const connected = response.data?.data?.connected || false
          setIsGoogleConnected(connected)
          if (connected) {
            setGmailSynced(true)
            localStorage.setItem('inquiry_gmail_synced', 'true')
          }
        } catch { setIsGoogleConnected(false) }
      }
      check()
    }
  }, [showGmailConfig, getToken])

  React.useEffect(() => {
    if (isGoogleConnected) {
      setGmailSynced(true)
      localStorage.setItem('inquiry_gmail_synced', 'true')
    }
  }, [isGoogleConnected])

  React.useEffect(() => {
    if (selectedLead) {
      const fetchThreadMessages = async () => {
        try {
          const token = await getToken()
          if (!token) {
            console.warn('No auth token available for thread fetch')
            return
          }
          const response = await apiClient.get(`/api/leads/${selectedLead._id}/thread`, { headers: { Authorization: `Bearer ${token}` } })
          const messages = response.data?.data?.messages || []
          console.log(`[Thread] Fetched ${messages.length} messages for lead ${selectedLead._id}`)
          setMessageThreads(prev => ({
            ...prev,
            [selectedLead._id]: messages
          }))
        } catch (error) {
          console.error('[Thread] Failed to fetch thread messages:', error)
          // Still set empty array so lead renders without messages
          setMessageThreads(prev => ({
            ...prev,
            [selectedLead._id]: []
          }))
        }
      }
      fetchThreadMessages()
    }
  }, [selectedLead, getToken])

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const isDuplicate = toasts.some(t => t.message === message && t.type === type)
    if (isDuplicate) return
    const id = Math.random().toString()
    setToasts(prev => [...prev, { id, type, message, timestamp: new Date() }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000)
  }

  const getInitials = (firstName: string | undefined, lastName: string | undefined): string => {
    if (!firstName && !lastName) return 'U'
    const fn = (firstName || '')[0] || ''
    const ln = (lastName || '')[0] || ''
    return (fn + ln).toUpperCase() || 'U'
  }

  const handleStatusChange = (status: string) => {
    if (!selectedLead) return
    try {
      updateLeadStatus({ id: selectedLead._id, status })
      setSelectedLead(prev => prev ? { ...prev, status: status as any } : null)
      addToast('success', `Status updated to ${status}`)
    } catch {
      addToast('error', 'Failed to update status')
    }
  }

  const handleSendReply = async () => {
    if (!selectedLead || !replyMessage.trim()) return
    setIsSendingReply(true)
    try {
      const token = await getToken()
      if (!token) {
        addToast('error', 'Authentication required')
        return
      }
      console.log(`[Reply] Sending reply to lead ${selectedLead._id}`)
      await apiClient.post(`/api/leads/${selectedLead._id}/reply`, { message: replyMessage }, { headers: { Authorization: `Bearer ${token}` } })
      
      setReplyMessage('')
      addToast('success', 'Reply sent successfully')
      updateLeadStatus({ id: selectedLead._id, status: 'Contacted' })
      setSelectedLead(prev => prev ? { ...prev, status: 'Contacted' } : null)
      
      // Refresh thread messages after a brief delay
      setTimeout(async () => {
        try {
          const newToken = await getToken()
          if (!newToken) return
          console.log(`[Reply] Refreshing thread messages for lead ${selectedLead._id}`)
          const response = await apiClient.get(`/api/leads/${selectedLead._id}/thread`, { headers: { Authorization: `Bearer ${newToken}` } })
          const messages = response.data?.data?.messages || []
          console.log(`[Reply] Refreshed thread with ${messages.length} messages`)
          setMessageThreads(prev => ({
            ...prev,
            [selectedLead._id]: messages
          }))
        } catch (e) {
          console.warn('[Reply] Could not refresh thread messages:', e)
        }
      }, 1000)
      
      await refetch()
    } catch (error) {
      console.error('[Reply] Failed to send reply:', error)
      addToast('error', 'Failed to send reply')
    } 
    finally { 
      setIsSendingReply(false) 
    }
  }

  const handleSyncEmails = async () => {
    try {
      setIsSyncing(true)
      setSyncError(null)
      addToast('info', 'Refreshing inquiries...')
      const token = await getToken()
      const result = await apiClient.post('/api/leads/sync-gmail', {}, { headers: { Authorization: `Bearer ${token}` } })
      const syncedCount = result.data?.syncedCount || 0
      setGmailSynced(true)
      localStorage.setItem('inquiry_gmail_synced', 'true')
      setLastSyncTime(new Date())
      setSyncCountdown(60)
      if (syncedCount > 0) {
        addToast('success', `Refreshed! ${syncedCount} new inquiry${syncedCount > 1 ? 'ies' : ''} imported`)
      } else {
        addToast('info', 'Already up to date')
      }
      await refetch()
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || 'Failed to refresh inquiries. Please reconnect your Gmail.'
      setSyncError(errorMsg)
      addToast('error', errorMsg)
      setGmailSynced(false)
      localStorage.removeItem('inquiry_gmail_synced')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSetAppointment = async () => {
    if (!selectedLead || !appointmentForm.date || !appointmentForm.time) {
      addToast('error', 'Date and time are required')
      return
    }
    try {
      const token = await getToken()
      if (!token) {
        addToast('error', 'Authentication required')
        return
      }
      console.log(`[Appointment] Saving appointment for lead ${selectedLead._id}`, appointmentForm)
      await apiClient.post(
        `/api/leads/${selectedLead._id}/appointment`,
        {
          date: appointmentForm.date,
          time: appointmentForm.time,
          notes: appointmentForm.notes,
          locationOrVehicle: appointmentForm.locationOrVehicle
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      console.log(`[Appointment] Appointment saved successfully`)
      updateLeadStatus({ id: selectedLead._id, status: 'Appointment Set' })
      setSelectedLead(prev => prev ? { ...prev, status: 'Appointment Set', appointment: appointmentForm } : null)
      addToast('success', 'Appointment saved successfully')
      setAppointmentOpen(false)
      setAppointmentForm({ date: '', time: '', notes: '', locationOrVehicle: '' })
      await refetch()
    } catch (error: any) {
      console.error('[Appointment] Failed to save appointment:', error)
      addToast('error', error?.response?.data?.message || 'Failed to save appointment')
    }
  }

  const handleCloseLead = () => {
    if (!selectedLead) return
    handleStatusChange('Closed')
    setSelectedLeadClosed(true)
  }

  const handleReopenLead = () => {
    if (!selectedLead) return
    handleStatusChange('Pending')
    setSelectedLeadClosed(false)
  }

  const filteredLeads = React.useMemo(() => {
    let filtered = leads
    if (statusFilter) {
      if (statusFilter === 'New') {
        filtered = filtered.filter((l: Lead) => l.status === 'New')
      } else {
        filtered = filtered.filter((l: Lead) => l.status === statusFilter)
      }
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((l: Lead) =>
        l.firstName.toLowerCase().includes(query) ||
        l.lastName.toLowerCase().includes(query) ||
        l.email.toLowerCase().includes(query) ||
        l.senderEmail?.toLowerCase().includes(query) ||
        l.subject?.toLowerCase().includes(query)
      )
    }

    const groupedByEmail: Record<string, Lead[]> = {}
    filtered.forEach((lead: Lead) => {
      const email = lead.senderEmail || lead.email
      if (!groupedByEmail[email]) {
        groupedByEmail[email] = []
      }
      groupedByEmail[email].push(lead)
    })

    const merged = Object.values(groupedByEmail).map((group: Lead[]) => {
      const latestLead = group.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      return {
        ...latestLead,
        _emailGroup: group,
        _emailCount: group.length
      }
    })

    return merged
  }, [leads, statusFilter, searchQuery])

  const stats = React.useMemo(() => ({
    total: leads.length,
    new: leads.filter((l: Lead) => l.status === 'New').length,
    pending: leads.filter((l: Lead) => l.status === 'Pending').length,
    contacted: leads.filter((l: Lead) => l.status === 'Contacted').length,
    appointmentSet: leads.filter((l: Lead) => l.status === 'Appointment Set').length,
    closed: leads.filter((l: Lead) => l.status === 'Closed').length,
  }), [leads])

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const formatDate = (date: Date) => date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  const formatFullDateTime = (date: Date) => date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })


  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 rounded-lg">
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="h-full w-full flex flex-col gap-4 p-4 overflow-hidden">
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm pointer-events-none">
          {toasts.map((toast) => (
            <div key={toast.id} className={`pointer-events-auto flex flex-col px-4 py-3 rounded-lg shadow-lg backdrop-blur text-white animate-in slide-in-from-top-2 border overflow-hidden ${
              toast.type === 'success' ? 'bg-emerald-600/95 border-emerald-500' :
              toast.type === 'error' ? 'bg-red-600/95 border-red-500' :
              'bg-blue-600/95 border-blue-500'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <span className="text-sm font-medium">{toast.message}</span>
                  <p className="text-xs opacity-75 mt-1">{toast.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="ml-3 hover:opacity-80 shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="w-full h-0.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white/40 animate-fadeOut origin-left" style={{ animationDuration: '6s' }}></div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Inquiries & Leads</h2>
              {loggedInEmail && gmailSynced && <p className="text-sm text-green-600 dark:text-green-400 mt-1">Synced from: {loggedInEmail}</p>}
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <Button onClick={handleSyncEmails} disabled={!gmailSynced || isSyncing} variant="outline" className="gap-2 text-xs">
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} /> {isSyncing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button onClick={() => setShowGmailConfig(true)} variant="outline" className="text-xs">
                Settings
              </Button>
            </div>
          </div>
          {gmailSynced && lastSyncTime && (
            <div className="text-xs text-muted-foreground">
              Last sync: {formatTime(lastSyncTime)} • {formatDate(lastSyncTime)} ({syncCountdown}s)
            </div>
          )}
        </div>

        {!gmailSynced && (
          <Card className="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/30">
            <CardContent className="pt-5 pb-5 flex items-start gap-3">
              <div className="flex-1">
                <p className="font-semibold text-amber-900 dark:text-amber-100 text-sm">Gmail not synced</p>
                <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">Click Settings to connect your Gmail and start importing inquiries.</p>
              </div>
              <Button onClick={() => setShowGmailConfig(true)} size="sm" className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white">
                Setup
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="relative">
          <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <Input placeholder="Search inquiries..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-10 rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { filter: null, label: 'All', value: stats.total },
            { filter: 'New', label: 'New', value: stats.new },
            { filter: 'Pending', label: 'Pending', value: stats.pending },
            { filter: 'Contacted', label: 'Contacted', value: stats.contacted },
            { filter: 'Appointment Set', label: 'Appt', value: stats.appointmentSet },
            { filter: 'Closed', label: 'Closed', value: stats.closed },
          ].map((stat, idx) => (
            <div key={idx} className="relative">
              <button
                onClick={() => setStatusFilter(stat.filter)}
                className={`w-full px-2 sm:px-3 py-2 rounded-lg transition-all text-xs font-semibold truncate ${
                  statusFilter === stat.filter
                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400'
                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {stat.label} <span className="ml-1 font-bold text-xs">{stat.value}</span>
              </button>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-hidden grid grid-cols-1 gap-4" style={{ gridTemplateColumns: 'minmax(0, 0.6fr) minmax(0, 1.4fr)' }}>
          <div className={`${selectedLead ? 'hidden sm:block' : ''} h-full overflow-hidden flex`}>
            <Card className="w-full h-full overflow-hidden flex flex-col shadow-lg border-t-4 border-blue-600 dark:border-blue-400">
              <CardHeader className="pb-3 border-b bg-white dark:bg-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white truncate">Messages</CardTitle>
                  <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2 py-1 rounded-full font-semibold shrink-0">{filteredLeads.length}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-slate-200 dark:scrollbar-thumb-blue-600 dark:scrollbar-track-slate-800">
                {isLoading ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">Loading...</div>
                ) : filteredLeads.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto opacity-20 mb-2" />
                    <p className="text-sm">No inquiries found</p>
                  </div>
                ) : (
                  filteredLeads.map((lead: any) => (
                    <div key={lead._id} className={`border-b p-3.5 cursor-pointer transition-all ${selectedLead?._id === lead._id ? 'bg-blue-50 dark:bg-slate-700 border-l-4 border-blue-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-l-4 border-transparent'}`} onClick={() => { setSelectedLead(lead); if (!lead.isRead) markAsRead(lead._id); setSelectedLeadClosed(lead.status === 'Closed') }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{lead.firstName} {lead.lastName}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">{lead.senderEmail || lead.email}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {lead._emailCount > 1 && <Badge className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100">{lead._emailCount}</Badge>}
                          {!lead.isRead && <Badge className="text-xs bg-blue-600 text-white">New</Badge>}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate mb-2 line-clamp-1">{lead.subject || '(No subject)'}</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-slate-500 dark:text-slate-500">{new Date(lead.createdAt).toLocaleDateString([], {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</p>
                        <Badge className={statusConfig[lead.status as keyof typeof statusConfig]?.color} variant="secondary">
                          {statusConfig[lead.status as keyof typeof statusConfig]?.icon}
                          <span className="ml-1 text-xs">{lead.status}</span>
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className={`${!selectedLead ? 'hidden sm:block' : ''} h-full w-full overflow-hidden flex`}>
            {selectedLead ? (
              <Card className="w-full h-full flex flex-col shadow-lg overflow-hidden bg-white dark:bg-slate-900">
                <CardHeader className="border-b pb-3 bg-slate-50 dark:bg-slate-800">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 flex-1">
                        <button
                          onClick={() => setSelectedLead(null)}
                          className="sm:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0"
                          title="Back to list"
                        >
                          <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">{selectedLead.firstName} {selectedLead.lastName}</h2>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 truncate">{selectedLead.senderEmail || selectedLead.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={`${statusConfig[selectedLead.status as keyof typeof statusConfig]?.color} shrink-0`}>
                          {statusConfig[selectedLead.status as keyof typeof statusConfig]?.icon}
                          <span className="ml-1 text-xs">{selectedLead.status}</span>
                        </Badge>
                        <button
                          onClick={() => setSelectedLead(null)}
                          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          title="Close"
                        >
                          <X className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div>
                        <p className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Subject</p>
                        <p className="font-medium text-slate-900 dark:text-white mt-0.5 truncate cursor-help" title={selectedLead.subject || '(No subject)'}>{selectedLead.subject || '(No subject)'}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">To</p>
                        <p className="font-medium text-slate-900 dark:text-white mt-0.5 truncate">{loggedInEmail || 'Your email'}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Date</p>
                        <p className="font-medium text-slate-900 dark:text-white mt-0.5">{new Date(selectedLead.createdAt).toLocaleDateString()}</p>
                      </div>
                      {selectedLead.phone && (
                        <div>
                          <p className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Phone</p>
                          <p className="font-medium text-slate-900 dark:text-white mt-0.5 truncate">{selectedLead.phone}</p>
                        </div>
                      )}
                    </div>
                    {(selectedLead as any).appointment && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Appointment Date</p>
                          <p className="font-medium text-slate-900 dark:text-white mt-0.5">{new Date((selectedLead as any).appointment.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Time</p>
                          <p className="font-medium text-slate-900 dark:text-white mt-0.5">{(selectedLead as any).appointment.time}</p>
                        </div>
                        {(selectedLead as any).appointment.location && (
                          <div>
                            <p className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Location</p>
                            <p className="font-medium text-slate-900 dark:text-white mt-0.5 truncate">{(selectedLead as any).appointment.location}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950 scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-slate-200 dark:scrollbar-thumb-blue-600 dark:scrollbar-track-slate-800">
                  <div className="flex justify-start">
                    <div className="max-w-xl w-full bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{getInitials(selectedLead.firstName, selectedLead.lastName)}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{selectedLead.firstName} {selectedLead.lastName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{formatFullDateTime(new Date(selectedLead.createdAt))}</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{cleanHTMLContent(selectedLead.body || '')}</p>
                    </div>
                  </div>

                  {messageThreads[selectedLead._id]?.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xl w-full rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow ${
                        msg.isOwn
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                      }`}>
                        {!msg.isOwn && (
                          <div className="flex items-center gap-2 mb-3 pb-3 border-b opacity-80" style={{ borderColor: msg.isOwn ? 'rgba(255,255,255,0.2)' : undefined }}>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-gradient-to-br from-slate-400 to-slate-600 text-white">{msg.sender.substring(0, 2).toUpperCase()}</div>
                            <p className="text-xs truncate">{msg.sender}</p>
                          </div>
                        )}
                        {msg.isOwn && (
                          <div className="flex items-center gap-2 mb-3 pb-3 border-b opacity-80" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-white/20 text-white">YOU</div>
                            <p className="text-xs truncate">You</p>
                          </div>
                        )}
                        <p className="text-sm leading-relaxed">{msg.message}</p>
                        <p className={`text-xs mt-2 ${msg.isOwn ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                          {formatFullDateTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {!selectedLeadClosed ? (
                  <div className="border-t p-3 space-y-2 bg-white dark:bg-slate-900">
                    <div>
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2 block">Reply</Label>
                      <Textarea placeholder="Type your response..." value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} rows={3} className="text-sm resize-none dark:bg-slate-800 border-slate-300 dark:border-slate-600 max-h-48 overflow-y-auto" />
                    </div>
                    <div className="flex gap-2 items-center justify-between flex-wrap">
                      <div className="flex gap-2 flex-wrap">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="gap-1 text-xs">
                              <MoreHorizontal className="h-4 w-4" /> Status
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {Object.keys(statusConfig).filter(s => s !== selectedLead.status).map(status => (
                              <DropdownMenuItem key={status} onClick={() => { handleStatusChange(status); setSelectedLead(prev => prev ? { ...prev, status: status as any } : null) }} className="cursor-pointer text-xs">
                                {statusConfig[status as keyof typeof statusConfig].icon}
                                <span className="ml-2">{status}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button size="sm" variant="outline" onClick={() => setAppointmentOpen(true)} className="gap-1 text-xs">
                          <Calendar className="h-4 w-4" /> Appointment
                        </Button>
                        <Button onClick={handleCloseLead} size="sm" variant="outline" className="gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950">
                          <XCircle className="h-4 w-4" /> Close
                        </Button>
                      </div>
                      <Button onClick={handleSendReply} disabled={isSendingReply || !replyMessage.trim()} size="sm" className="gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">
                        <Send className="h-4 w-4" /> {isSendingReply ? 'Sending...' : 'Send'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-t p-4 flex items-center justify-between bg-slate-100 dark:bg-slate-800">
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Inquiry Closed</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">This conversation is archived</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleReopenLead} className="gap-1 text-xs">
                      <LockOpen className="h-4 w-4" /> Reopen
                    </Button>
                  </div>
                )}

                <div className="border-t p-3 bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 text-center">
                  {lastSyncTime && <span>Synced: {formatDate(lastSyncTime)} at {formatTime(lastSyncTime)}</span>}
                </div>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center shadow-lg">
                <CardContent className="text-center">
                  <Mail className="h-20 w-20 text-muted-foreground mx-auto opacity-10 mb-4" />
                  <p className="text-muted-foreground text-lg">Select an inquiry to view</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        </div>
      
      <Dialog open={showGmailConfig} onOpenChange={setShowGmailConfig}>
        <DialogContent className="max-w-md dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>Gmail Setup</DialogTitle>
            <DialogDescription>Connect your Gmail to auto-sync inquiries</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <GoogleCalendarConnect title="Google Account" description="Connect to sync inquiries" features={['Sync inquiries', 'Auto-refresh every 60 seconds', 'Real-time notifications']} />
            {isGoogleConnected && (
              <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-emerald-900 dark:text-emerald-100 uppercase tracking-wide">Current Gmail Account</p>
                  <span className="text-xs bg-emerald-200 dark:bg-emerald-700 text-emerald-900 dark:text-emerald-100 px-2 py-1 rounded">Connected</span>
                </div>
                {loggedInEmail && <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">{loggedInEmail}</p>}
              </div>
            )}
            {syncError && <div className="bg-red-50 dark:bg-red-950 p-3 rounded text-sm text-red-900 dark:text-red-100">{syncError}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGmailConfig(false)}>Close</Button>
            <Button onClick={handleSyncEmails} disabled={!isGoogleConnected} className="bg-blue-600 hover:bg-blue-700">Sync Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={appointmentOpen} onOpenChange={setAppointmentOpen}>
        <DialogContent className="dark:bg-slate-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Schedule Appointment</DialogTitle>
            <DialogDescription>with {selectedLead?.firstName} {selectedLead?.lastName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-bold text-muted-foreground">DATE *</Label>
              <Input type="date" value={appointmentForm.date} onChange={(e) => setAppointmentForm({...appointmentForm, date: e.target.value})} className="dark:bg-slate-800 mt-1" />
            </div>
            <div>
              <Label className="text-xs font-bold text-muted-foreground">TIME *</Label>
              <Input type="time" value={appointmentForm.time} onChange={(e) => setAppointmentForm({...appointmentForm, time: e.target.value})} className="dark:bg-slate-800 mt-1" />
            </div>
            <div>
              <Label className="text-xs font-bold text-muted-foreground">LOCATION / VEHICLE</Label>
              <Input placeholder="e.g., Showroom, Test Drive Route, or Vehicle Model" value={appointmentForm.locationOrVehicle} onChange={(e) => setAppointmentForm({...appointmentForm, locationOrVehicle: e.target.value})} className="dark:bg-slate-800 mt-1" />
            </div>
            <div>
              <Label className="text-xs font-bold text-muted-foreground">NOTES</Label>
              <Textarea placeholder="Additional details..." value={appointmentForm.notes} onChange={(e) => setAppointmentForm({...appointmentForm, notes: e.target.value})} rows={3} className="dark:bg-slate-800 mt-1" />
            </div>
            {selectedLead?.phone && (
              <div className="bg-blue-50 dark:bg-blue-950 rounded p-3 text-xs border border-blue-200 dark:border-blue-800">
                <p className="font-semibold text-blue-900 dark:text-blue-100">{selectedLead.phone}</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setAppointmentOpen(false); setAppointmentForm({ date: '', time: '', notes: '', locationOrVehicle: '' }) }} className="text-xs">Cancel</Button>
            <Button onClick={handleSetAppointment} disabled={!appointmentForm.date || !appointmentForm.time} className="bg-emerald-600 hover:bg-emerald-700 text-xs">Save & Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div>

      <style jsx>{`
        @keyframes fadeOut {
          0% { opacity: 0.4; width: 100%; }
          90% { opacity: 0.4; width: 0%; }
          100% { opacity: 0; width: 0%; }
        }
        .animate-fadeOut {
          animation: fadeOut 6s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
