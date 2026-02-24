"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useLeads, Lead } from "@/hooks/useLeads"
import {
  Mail, Phone, Calendar, MoreHorizontal, X, Send, Clock3,
  XCircle, LockOpen, Lock, ChevronLeft, RefreshCw, Search,
  CheckCircle2, AlertCircle, Info, ChevronDown,
} from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { GoogleCalendarConnect } from "@/components/GoogleCalendarConnect"
import { apiClient } from "@/lib/api-client"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ─── Status config ────────────────────────────────────────────────────────────

const statusConfig = {
  'New':              { badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',   dot: 'bg-emerald-500',  icon: <Mail    className="h-3 w-3" /> },
  'Pending':          { badge: 'bg-amber-500/10  text-amber-700  dark:text-amber-300  border-amber-500/20',        dot: 'bg-amber-500',    icon: <Clock3  className="h-3 w-3" /> },
  'Contacted':        { badge: 'bg-blue-500/10   text-blue-700   dark:text-blue-300   border-blue-500/20',         dot: 'bg-blue-500',     icon: <Phone   className="h-3 w-3" /> },
  'Appointment Set':  { badge: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20',       dot: 'bg-violet-500',   icon: <Calendar className="h-3 w-3" /> },
  'Closed':           { badge: 'bg-rose-500/10   text-rose-700   dark:text-rose-300   border-rose-500/20',         dot: 'bg-rose-500',     icon: <XCircle className="h-3 w-3" /> },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cleanHTML = (html: string) => {
  if (!html) return ''
  return html
    .replace(/<!doctype[^>]*>/gi, '').replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/\r\n/g, '\n').trim()
}

function getInitials(a?: string, b?: string) {
  return ((a?.[0] || '') + (b?.[0] || '')).toUpperCase() || 'U'
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
function fmtDate(d: Date) {
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
function fmtFull(d: Date) {
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast { id: string; type: 'success' | 'error' | 'info'; message: string; ts: Date }

function ToastStack({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  const icons = {
    success: <CheckCircle2 className="h-4 w-4 shrink-0" />,
    error:   <AlertCircle  className="h-4 w-4 shrink-0" />,
    info:    <Info         className="h-4 w-4 shrink-0" />,
  }
  const colors = {
    success: 'bg-emerald-600/95 border-emerald-500',
    error:   'bg-rose-600/95 border-rose-500',
    info:    'bg-blue-600/95 border-blue-500',
  }
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-xs pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-white border animate-in slide-in-from-top-2 ${colors[t.type]}`}>
          {icons[t.type]}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug">{t.message}</p>
            <p className="text-[10px] opacity-60 mt-0.5">{fmtTime(t.ts)}</p>
          </div>
          <button onClick={() => dismiss(t.id)} className="hover:opacity-70 transition-opacity">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const cfg = statusConfig[status as keyof typeof statusConfig]
  if (!cfg) return null
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${cfg.badge}`}>
      {cfg.icon} {status}
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LeadsTab() {
  const { leads, isLoading, updateLeadStatus, markAsRead, reply, refetch } = useLeads()
  const { getToken } = useAuth()

  const [selectedLead, setSelectedLead]           = React.useState<Lead | null>(null)
  const [statusFilter, setStatusFilter]           = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery]             = React.useState('')
  const [loggedInEmail, setLoggedInEmail]         = React.useState('')
  const [gmailSynced, setGmailSynced]             = React.useState(false)
  const [showGmailConfig, setShowGmailConfig]     = React.useState(false)
  const [syncError, setSyncError]                 = React.useState<string | null>(null)
  const [isGoogleConnected, setIsGoogleConnected] = React.useState(false)
  const [lastSyncTime, setLastSyncTime]           = React.useState<Date | null>(null)
  const [syncCountdown, setSyncCountdown]         = React.useState(0)
  const [replyMessage, setReplyMessage]           = React.useState('')
  const [isSendingReply, setIsSendingReply]       = React.useState(false)
  const [appointmentOpen, setAppointmentOpen]     = React.useState(false)
  const [appointmentForm, setAppointmentForm]     = React.useState({ date: '', time: '', notes: '', locationOrVehicle: '' })
  const [toasts, setToasts]                       = React.useState<Toast[]>([])
  const [selectedLeadClosed, setSelectedLeadClosed] = React.useState(false)
  const [messageThreads, setMessageThreads]       = React.useState<Record<string, any[]>>({})
  const [isSyncing, setIsSyncing]                 = React.useState(false)

  // ── Effects ────────────────────────────────────────────────────────────────

  React.useEffect(() => {
    const saved = localStorage.getItem('inquiry_gmail_synced') === 'true'
    setGmailSynced(saved)
    const checkConnection = async () => {
      try {
        const token = await getToken()
        const res = await apiClient.get('/api/google-calendar/status', { headers: { Authorization: `Bearer ${token}` } })
        if (res.data?.data?.connected && !saved) {
          setGmailSynced(true)
          localStorage.setItem('inquiry_gmail_synced', 'true')
        }
      } catch {}
    }
    checkConnection()
    if (saved) {
      const syncInterval = setInterval(async () => {
        try {
          const token = await getToken()
          const result = await apiClient.post('/api/leads/sync-gmail', {}, { headers: { Authorization: `Bearer ${token}` } })
          const n = result.data?.syncedCount || 0
          if (n > 0) addToast('success', `Auto-synced: ${n} new entr${n > 1 ? 'ies' : 'y'}`)
          setLastSyncTime(new Date()); setSyncCountdown(60); await refetch()
        } catch {}
      }, 60000)
      const cd = setInterval(() => setSyncCountdown(p => p > 0 ? p - 1 : 0), 1000)
      return () => { clearInterval(syncInterval); clearInterval(cd) }
    }
  }, [getToken, gmailSynced])

  React.useEffect(() => {
    const get = async () => {
      try {
        const token = await getToken()
        const res = await apiClient.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        setLoggedInEmail(res.data?.email || '')
      } catch {}
    }
    get()
  }, [getToken])

  React.useEffect(() => {
    if (showGmailConfig) {
      const check = async () => {
        try {
          const token = await getToken()
          const res = await apiClient.get('/api/google-calendar/status', { headers: { Authorization: `Bearer ${token}` } })
          const connected = res.data?.data?.connected || false
          setIsGoogleConnected(connected)
          if (connected) { setGmailSynced(true); localStorage.setItem('inquiry_gmail_synced', 'true') }
        } catch { setIsGoogleConnected(false) }
      }
      check()
    }
  }, [showGmailConfig, getToken])

  React.useEffect(() => {
    if (isGoogleConnected) { setGmailSynced(true); localStorage.setItem('inquiry_gmail_synced', 'true') }
  }, [isGoogleConnected])

  React.useEffect(() => {
    if (!selectedLead) return
    const fetch = async () => {
      try {
        const token = await getToken()
        if (!token) return
        const res = await apiClient.get(`/api/leads/${selectedLead._id}/thread`, { headers: { Authorization: `Bearer ${token}` } })
        setMessageThreads(p => ({ ...p, [selectedLead._id]: res.data?.data?.messages || [] }))
      } catch {
        setMessageThreads(p => ({ ...p, [selectedLead._id]: [] }))
      }
    }
    fetch()
  }, [selectedLead, getToken])

  // ── Helpers ────────────────────────────────────────────────────────────────

  const addToast = (type: Toast['type'], message: string) => {
    if (toasts.some(t => t.message === message && t.type === type)) return
    const id = Math.random().toString()
    setToasts(p => [...p, { id, type, message, ts: new Date() }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 6000)
  }

  const handleStatusChange = (status: string) => {
    if (!selectedLead) return
    updateLeadStatus({ id: selectedLead._id, status })
    setSelectedLead(p => p ? { ...p, status: status as any } : null)
    addToast('success', `Status → ${status}`)
  }

  const handleSendReply = async () => {
    if (!selectedLead || !replyMessage.trim()) return
    setIsSendingReply(true)
    try {
      const token = await getToken()
      if (!token) { addToast('error', 'Auth required'); return }
      await apiClient.post(`/api/leads/${selectedLead._id}/reply`, { message: replyMessage }, { headers: { Authorization: `Bearer ${token}` } })
      setReplyMessage('')
      addToast('success', 'Reply sent')
      updateLeadStatus({ id: selectedLead._id, status: 'Contacted' })
      setSelectedLead(p => p ? { ...p, status: 'Contacted' } : null)
      setTimeout(async () => {
        try {
          const t = await getToken()
          if (!t) return
          const res = await apiClient.get(`/api/leads/${selectedLead._id}/thread`, { headers: { Authorization: `Bearer ${t}` } })
          setMessageThreads(p => ({ ...p, [selectedLead._id]: res.data?.data?.messages || [] }))
        } catch {}
      }, 1000)
      await refetch()
    } catch { addToast('error', 'Failed to send reply') }
    finally { setIsSendingReply(false) }
  }

  const handleSyncEmails = async () => {
    try {
      setIsSyncing(true); setSyncError(null); addToast('info', 'Refreshing…')
      const token = await getToken()
      const result = await apiClient.post('/api/leads/sync-gmail', {}, { headers: { Authorization: `Bearer ${token}` } })
      const n = result.data?.syncedCount || 0
      setGmailSynced(true); localStorage.setItem('inquiry_gmail_synced', 'true')
      setLastSyncTime(new Date()); setSyncCountdown(60)
      addToast(n > 0 ? 'success' : 'info', n > 0 ? `${n} new entr${n > 1 ? 'ies' : 'y'} imported` : 'Already up to date')
      await refetch()
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to refresh. Reconnect Gmail.'
      setSyncError(msg); addToast('error', msg)
      setGmailSynced(false); localStorage.removeItem('inquiry_gmail_synced')
    } finally { setIsSyncing(false) }
  }

  const handleSetAppointment = async () => {
    if (!selectedLead || !appointmentForm.date || !appointmentForm.time) { addToast('error', 'Date and time required'); return }
    try {
      const token = await getToken()
      if (!token) { addToast('error', 'Auth required'); return }
      await apiClient.post(`/api/leads/${selectedLead._id}/appointment`, appointmentForm, { headers: { Authorization: `Bearer ${token}` } })
      updateLeadStatus({ id: selectedLead._id, status: 'Appointment Set' })
      setSelectedLead(p => p ? { ...p, status: 'Appointment Set', appointment: appointmentForm } : null)
      addToast('success', 'Appointment saved')
      setAppointmentOpen(false)
      setAppointmentForm({ date: '', time: '', notes: '', locationOrVehicle: '' })
      await refetch()
    } catch (err: any) { addToast('error', err?.response?.data?.message || 'Failed') }
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const filteredLeads = React.useMemo(() => {
    let f = leads
    if (statusFilter) f = f.filter((l: Lead) => l.status === statusFilter)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      f = f.filter((l: Lead) =>
        l.firstName.toLowerCase().includes(q) || l.lastName.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) || l.senderEmail?.toLowerCase().includes(q) ||
        l.subject?.toLowerCase().includes(q)
      )
    }
    const byEmail: Record<string, Lead[]> = {}
    f.forEach((l: Lead) => { const e = l.senderEmail || l.email; (byEmail[e] = byEmail[e] || []).push(l) })
    return Object.values(byEmail).map((g: Lead[]) => {
      const latest = g.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      return { ...latest, _emailGroup: g, _emailCount: g.length }
    })
  }, [leads, statusFilter, searchQuery])

  const stats = React.useMemo(() => ({
    total: leads.length,
    new: leads.filter((l: Lead) => l.status === 'New').length,
    pending: leads.filter((l: Lead) => l.status === 'Pending').length,
    contacted: leads.filter((l: Lead) => l.status === 'Contacted').length,
    appointmentSet: leads.filter((l: Lead) => l.status === 'Appointment Set').length,
    closed: leads.filter((l: Lead) => l.status === 'Closed').length,
  }), [leads])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">

      <ToastStack toasts={toasts} dismiss={(id) => setToasts(p => p.filter(t => t.id !== id))} />

      {/* ── Section header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Inquiries & Leads</h2>
          {gmailSynced && loggedInEmail && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
              Synced · {loggedInEmail}
              {lastSyncTime && <span className="text-muted-foreground/50 ml-1">· {fmtTime(lastSyncTime)} ({syncCountdown}s)</span>}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSyncEmails}
            disabled={!gmailSynced || isSyncing}
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 rounded-lg"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Refreshing…' : 'Refresh'}
          </Button>
          <Button onClick={() => setShowGmailConfig(true)} variant="outline" size="sm" className="h-8 text-xs rounded-lg">
            Settings
          </Button>
        </div>
      </div>

      {/* ── Gmail not connected banner ── */}
      {!gmailSynced && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Gmail not connected</p>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">Connect your Gmail to start importing inquiries automatically.</p>
          </div>
          <Button onClick={() => setShowGmailConfig(true)} size="sm" className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 rounded-lg">
            Setup
          </Button>
        </div>
      )}

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
        <Input
          placeholder="Search by name, email, or subject…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 text-sm rounded-xl border-border/50 bg-card focus-visible:ring-emerald-500/30"
        />
      </div>

      {/* ── Filter pills ── */}
      <div className="flex flex-wrap gap-2">
        {[
          { filter: null,               label: 'All',       value: stats.total },
          { filter: 'New',              label: 'New',       value: stats.new },
          { filter: 'Pending',          label: 'Pending',   value: stats.pending },
          { filter: 'Contacted',        label: 'Contacted', value: stats.contacted },
          { filter: 'Appointment Set',  label: 'Appt',      value: stats.appointmentSet },
          { filter: 'Closed',           label: 'Closed',    value: stats.closed },
        ].map((s, i) => (
          <button
            key={i}
            onClick={() => setStatusFilter(s.filter)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
              statusFilter === s.filter
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-card text-foreground border-border/50 hover:border-emerald-500/40 hover:text-emerald-600'
            }`}
          >
            {s.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
              statusFilter === s.filter ? 'bg-white/20' : 'bg-muted/60'
            }`}>{s.value}</span>
          </button>
        ))}
      </div>

      {/* ── Two-pane layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1.45fr)] gap-4 min-h-[600px]">

        {/* ── List pane ── */}
        <div className={`${selectedLead ? 'hidden lg:flex' : 'flex'} flex-col rounded-2xl border border-border/50 bg-card overflow-hidden`}>
          {/* pane header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">Messages</p>
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {filteredLeads.length}
            </span>
          </div>

          {/* pane body */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-xs text-muted-foreground/50">Loading…</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Mail className="h-10 w-10 text-muted-foreground/10" />
                <p className="text-xs text-muted-foreground/40">No inquiries found</p>
              </div>
            ) : (
              filteredLeads.map((lead: any) => {
                const isSelected = selectedLead?._id === lead._id
                return (
                  <div
                    key={lead._id}
                    onClick={() => { setSelectedLead(lead); if (!lead.isRead) markAsRead(lead._id); setSelectedLeadClosed(lead.status === 'Closed') }}
                    className={`px-4 py-3.5 cursor-pointer transition-all group ${
                      isSelected
                        ? 'bg-emerald-500/5 border-l-2 border-emerald-500'
                        : 'border-l-2 border-transparent hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* avatar */}
                        <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {getInitials(lead.firstName, lead.lastName)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-none truncate">{lead.firstName} {lead.lastName}</p>
                          <p className="text-[11px] text-muted-foreground/50 truncate mt-0.5">{lead.senderEmail || lead.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0 mt-0.5">
                        {lead._emailCount > 1 && (
                          <span className="text-[9px] font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded-full">
                            {lead._emailCount}
                          </span>
                        )}
                        {!lead.isRead && (
                          <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1" />
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground/60 truncate mb-2">{lead.subject || '(No subject)'}</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] text-muted-foreground/40">{fmtFull(new Date(lead.createdAt))}</p>
                      <StatusPill status={lead.status} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ── Detail pane ── */}
        <div className={`${!selectedLead ? 'hidden lg:flex' : 'flex'} flex-col rounded-2xl border border-border/50 bg-card overflow-hidden`}>
          {selectedLead ? (
            <>
              {/* Detail header */}
              <div className="px-5 py-4 border-b border-border/50 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={() => setSelectedLead(null)}
                      className="lg:hidden p-1.5 rounded-lg hover:bg-muted/40 transition-colors shrink-0"
                    >
                      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {getInitials(selectedLead.firstName, selectedLead.lastName)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold leading-tight truncate">{selectedLead.firstName} {selectedLead.lastName}</h3>
                      <p className="text-xs text-muted-foreground/50 truncate">{selectedLead.senderEmail || selectedLead.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusPill status={selectedLead.status} />
                    <button onClick={() => setSelectedLead(null)} className="p-1.5 rounded-lg hover:bg-muted/40 transition-colors">
                      <X className="h-4 w-4 text-muted-foreground/50" />
                    </button>
                  </div>
                </div>

                {/* Meta grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Subject', value: selectedLead.subject || '(No subject)' },
                    { label: 'To', value: loggedInEmail || 'Your email' },
                    { label: 'Date', value: new Date(selectedLead.createdAt).toLocaleDateString() },
                    ...(selectedLead.phone ? [{ label: 'Phone', value: selectedLead.phone }] : []),
                  ].map(m => (
                    <div key={m.label}>
                      <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/40 font-medium">{m.label}</p>
                      <p className="text-xs font-semibold truncate mt-0.5" title={m.value}>{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Appointment details */}
                {(selectedLead as any).appointment && (
                  <>
                    <Separator className="opacity-40" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { label: 'Appt Date', value: new Date((selectedLead as any).appointment.date).toLocaleDateString() },
                        { label: 'Time', value: (selectedLead as any).appointment.time },
                        ...((selectedLead as any).appointment.location ? [{ label: 'Location', value: (selectedLead as any).appointment.location }] : []),
                      ].map(m => (
                        <div key={m.label}>
                          <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/40 font-medium">{m.label}</p>
                          <p className="text-xs font-semibold truncate mt-0.5">{m.value}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Message thread */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-muted/10">
                {/* Original message */}
                <div className="flex justify-start">
                  <div className="max-w-2xl w-full rounded-xl border border-border/50 bg-card p-4">
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border/40">
                      <div className="h-7 w-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {getInitials(selectedLead.firstName, selectedLead.lastName)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold">{selectedLead.firstName} {selectedLead.lastName}</p>
                        <p className="text-[10px] text-muted-foreground/50">{fmtFull(new Date(selectedLead.createdAt))}</p>
                      </div>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">{cleanHTML(selectedLead.body || '')}</p>
                  </div>
                </div>

                {/* Thread messages */}
                {messageThreads[selectedLead._id]?.map((msg: any) => (
                  <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-2xl w-full rounded-xl border p-4 ${
                      msg.isOwn
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-card border-border/50'
                    }`}>
                      <div className={`flex items-center gap-2 mb-3 pb-3 border-b ${msg.isOwn ? 'border-white/20' : 'border-border/40'}`}>
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${msg.isOwn ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>
                          {msg.isOwn ? 'YOU' : msg.sender.substring(0, 2).toUpperCase()}
                        </div>
                        <p className={`text-xs font-medium ${msg.isOwn ? 'text-white/80' : 'text-muted-foreground'}`}>
                          {msg.isOwn ? 'You' : msg.sender}
                        </p>
                      </div>
                      <p className={`text-sm leading-relaxed ${msg.isOwn ? 'text-white' : 'text-foreground/80'}`}>{msg.message}</p>
                      <p className={`text-[10px] mt-2 ${msg.isOwn ? 'text-white/50' : 'text-muted-foreground/40'}`}>{fmtFull(msg.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply / closed footer */}
              {!selectedLeadClosed ? (
                <div className="border-t border-border/50 px-5 py-4 space-y-3 bg-card">
                  <Label className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/40 font-medium">Reply</Label>
                  <Textarea
                    placeholder="Type your response…"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={3}
                    className="text-sm resize-none rounded-xl border-border/50 bg-muted/20 focus-visible:ring-emerald-500/30 max-h-40"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      {/* Status dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 rounded-lg">
                            <MoreHorizontal className="h-3.5 w-3.5" /> Status <ChevronDown className="h-3 w-3 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-xl">
                          {Object.keys(statusConfig).filter(s => s !== selectedLead.status).map(s => (
                            <DropdownMenuItem
                              key={s}
                              onClick={() => { handleStatusChange(s); setSelectedLead(p => p ? { ...p, status: s as any } : null) }}
                              className="text-xs gap-2 cursor-pointer"
                            >
                              {statusConfig[s as keyof typeof statusConfig].icon} {s}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button size="sm" variant="outline" onClick={() => setAppointmentOpen(true)} className="h-8 text-xs gap-1.5 rounded-lg">
                        <Calendar className="h-3.5 w-3.5" /> Appointment
                      </Button>

                      <Button
                        onClick={() => { handleStatusChange('Closed'); setSelectedLeadClosed(true) }}
                        size="sm" variant="outline"
                        className="h-8 text-xs gap-1.5 rounded-lg text-rose-600 hover:text-rose-600 hover:bg-rose-500/5 border-rose-500/20"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Close
                      </Button>
                    </div>

                    <Button
                      onClick={handleSendReply}
                      disabled={isSendingReply || !replyMessage.trim()}
                      size="sm"
                      className="h-8 text-xs gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {isSendingReply ? 'Sending…' : 'Send Reply'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-border/50 px-5 py-4 flex items-center justify-between bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                      <Lock className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-none">Inquiry Closed</p>
                      <p className="text-[11px] text-muted-foreground/50 mt-0.5">This conversation is archived</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => { handleStatusChange('Pending'); setSelectedLeadClosed(false) }} className="h-8 text-xs gap-1.5 rounded-lg">
                    <LockOpen className="h-3.5 w-3.5" /> Reopen
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
              <div className="h-16 w-16 rounded-2xl border-2 border-dashed border-border/30 flex items-center justify-center">
                <Mail className="h-7 w-7 text-muted-foreground/20" />
              </div>
              <p className="text-sm text-muted-foreground/40">Select an inquiry to view</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Gmail settings dialog ── */}
      <Dialog open={showGmailConfig} onOpenChange={setShowGmailConfig}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Gmail Setup</DialogTitle>
            <DialogDescription>Connect your Gmail to auto-sync inquiries</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <GoogleCalendarConnect
              title="Google Account"
              description="Connect to sync inquiries"
              features={['Sync inquiries', 'Auto-refresh every 60s', 'Real-time notifications']}
            />
            {isGoogleConnected && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/50">Current Account</p>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Connected</span>
                </div>
                {loggedInEmail && <p className="text-sm font-semibold">{loggedInEmail}</p>}
              </div>
            )}
            {syncError && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-600 dark:text-rose-400">{syncError}</div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowGmailConfig(false)} className="rounded-lg text-xs">Close</Button>
            <Button onClick={handleSyncEmails} disabled={!isGoogleConnected} className="rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              Sync Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Appointment dialog ── */}
      <Dialog open={appointmentOpen} onOpenChange={setAppointmentOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Appointment</DialogTitle>
            <DialogDescription>with {selectedLead?.firstName} {selectedLead?.lastName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            {[
              { label: 'Date *', key: 'date', type: 'date' },
              { label: 'Time *', key: 'time', type: 'time' },
              { label: 'Location / Vehicle', key: 'locationOrVehicle', type: 'text', placeholder: 'e.g., Showroom, Test Drive, Vehicle Model' },
            ].map(f => (
              <div key={f.key}>
                <Label className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/40">{f.label}</Label>
                <Input
                  type={f.type}
                  placeholder={f.placeholder}
                  value={appointmentForm[f.key as keyof typeof appointmentForm]}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, [f.key]: e.target.value })}
                  className="mt-1 rounded-xl border-border/50 text-sm"
                />
              </div>
            ))}
            <div>
              <Label className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/40">Notes</Label>
              <Textarea
                placeholder="Additional details…"
                value={appointmentForm.notes}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                rows={3}
                className="mt-1 rounded-xl border-border/50 text-sm resize-none"
              />
            </div>
            {selectedLead?.phone && (
              <div className="rounded-xl border border-border/50 bg-muted/20 px-3 py-2">
                <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/40 font-medium">Phone</p>
                <p className="text-sm font-semibold mt-0.5">{selectedLead.phone}</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setAppointmentOpen(false); setAppointmentForm({ date: '', time: '', notes: '', locationOrVehicle: '' }) }} className="rounded-lg text-xs">
              Cancel
            </Button>
            <Button onClick={handleSetAppointment} disabled={!appointmentForm.date || !appointmentForm.time} className="rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              Save & Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}