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
  CheckCircle2, AlertCircle, Info, ChevronDown, PhoneIncoming,
  Columns2, LayoutList, GripVertical, MessageSquare, Globe,
  Zap, FileText,
} from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { apiClient } from "@/lib/api-client"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { InboundCallsTab } from "@/components/inbound-calls/InboundCallsTab"
import { SupraLeoAI } from "@/components/supra-leo-ai/SupraLeoAI"
import { SupraLeoReadButton } from "@/components/supra-leo-ai/SupraLeoReadButton"

// ─── Status config ───────────────────────────────────────────
const statusConfig = {
  'New':             { badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20', dot: 'bg-emerald-500', icon: <Mail className="h-3 w-3" />, label: 'Unread Emails' },
  'Pending':         { badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20', dot: 'bg-amber-500', icon: <Clock3 className="h-3 w-3" />, label: 'Pending Emails' },
  'Contacted':       { badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20', dot: 'bg-blue-500', icon: <Phone className="h-3 w-3" />, label: 'Unread SMS' },
  'Appointment Set': { badge: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20', dot: 'bg-violet-500', icon: <Calendar className="h-3 w-3" />, label: 'Pending SMS' },
  'Closed':          { badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20', dot: 'bg-rose-500', icon: <XCircle className="h-3 w-3" />, label: 'Completed' },
  'Inbound Calls':   { badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20', dot: 'bg-sky-500', icon: <PhoneIncoming className="h-3 w-3" />, label: 'Inbound Calls' },
}

// ─── Channel config — labels + icons + colors ────────────────
const channelConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  email: { label: 'Email',  icon: <Mail className="h-2.5 w-2.5" />,           className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  sms:   { label: 'SMS',    icon: <MessageSquare className="h-2.5 w-2.5" />,  className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' },
  adf:   { label: 'ADF',    icon: <FileText className="h-2.5 w-2.5" />,       className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
  phone: { label: 'Phone',  icon: <Phone className="h-2.5 w-2.5" />,          className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  web:   { label: 'Web',    icon: <Globe className="h-2.5 w-2.5" />,          className: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' },
}

// ─── Helpers ─────────────────────────────────────────────────
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
function fmtTime(d: Date) { return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
function fmtDate(d: Date) { return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) }
function fmtFull(d: Date) { return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }

// ─── Toast system ────────────────────────────────────────────
interface Toast { id: string; type: 'success' | 'error' | 'info'; message: string; ts: Date }
function ToastStack({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  const icons = { success: <CheckCircle2 className="h-4 w-4 shrink-0" />, error: <AlertCircle className="h-4 w-4 shrink-0" />, info: <Info className="h-4 w-4 shrink-0" /> }
  const colors = { success: 'bg-emerald-600/95 border-emerald-500', error: 'bg-rose-600/95 border-rose-500', info: 'bg-blue-600/95 border-blue-500' }
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-xs pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-white border animate-in slide-in-from-top-2 ${colors[t.type]}`}>
          {icons[t.type]}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug">{t.message}</p>
            <p className="text-[10px] opacity-60 mt-0.5">{fmtTime(t.ts)}</p>
          </div>
          <button onClick={() => dismiss(t.id)} className="hover:opacity-70 transition-opacity"><X className="h-3.5 w-3.5" /></button>
        </div>
      ))}
    </div>
  )
}

// ─── Channel badge component ─────────────────────────────────
function ChannelBadge({ channel, size = 'sm' }: { channel?: string; size?: 'sm' | 'md' }) {
  const cfg = channelConfig[channel || 'email'] || channelConfig.email
  return (
    <span className={`inline-flex items-center gap-1 border rounded-full font-medium ${cfg.className} ${size === 'sm' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'}`}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

function StatusPill({ status }: { status: string }) {
  const cfg = statusConfig[status as keyof typeof statusConfig]
  if (!cfg) return null
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${cfg.badge}`}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

// ─── Pane resizer ────────────────────────────────────────────
function LeadsPaneResizer({ onDrag }: { onDrag: (deltaX: number) => void }) {
  const [isDragging, setIsDragging] = React.useState(false)
  React.useEffect(() => {
    if (!isDragging) return
    const handleMouseMove = (e: MouseEvent) => { e.preventDefault(); onDrag(e.movementX) }
    const handleMouseUp = () => setIsDragging(false)
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => { window.removeEventListener("mousemove", handleMouseMove); window.removeEventListener("mouseup", handleMouseUp) }
  }, [isDragging, onDrag])
  const lastTouchX = React.useRef(0)
  React.useEffect(() => {
    if (!isDragging) return
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const delta = e.touches[0].clientX - lastTouchX.current
      lastTouchX.current = e.touches[0].clientX
      onDrag(delta)
    }
    const handleTouchEnd = () => setIsDragging(false)
    window.addEventListener("touchmove", handleTouchMove, { passive: false })
    window.addEventListener("touchend", handleTouchEnd)
    return () => { window.removeEventListener("touchmove", handleTouchMove); window.removeEventListener("touchend", handleTouchEnd) }
  }, [isDragging, onDrag])
  return (
    <div
      onMouseDown={(e) => { e.preventDefault(); setIsDragging(true) }}
      onTouchStart={(e) => { lastTouchX.current = e.touches[0].clientX; setIsDragging(true) }}
      className={`relative flex-shrink-0 w-[6px] cursor-col-resize hidden lg:flex items-center justify-center group/divider z-10 transition-colors duration-150 ${isDragging ? "bg-emerald-500/20" : "hover:bg-muted/60"}`}
    >
      <div className={`flex flex-col items-center gap-0.5 rounded-full px-[3px] py-2 transition-all duration-150 ${isDragging ? "bg-emerald-500 text-white shadow-sm" : "bg-border/60 text-muted-foreground/40 group-hover/divider:bg-emerald-500/60 group-hover/divider:text-white"}`}>
        <GripVertical className="h-3 w-3" />
      </div>
      <div className="absolute inset-y-0 -left-1 -right-1" />
    </div>
  )
}

// ─── Parsed content display ──────────────────────────────────
function ParsedContentDisplay({ content, rawBody }: { content?: string; rawBody?: string }) {
  const text = content || cleanHTML(rawBody || '')
  if (!text) return <p className="text-sm text-muted-foreground/50 italic">No content</p>

  const lines = text.split('\n')
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.match(/^—\s.+\s—$/)) {
          return (
            <p key={i} className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400 mt-3 mb-1 first:mt-0">
              {line.replace(/—/g, '').trim()}
            </p>
          )
        }
        if (i === 0 && line.trim()) {
          return <p key={i} className="text-xs font-semibold text-foreground/90 mb-1">{line}</p>
        }
        const kvMatch = line.match(/^(.+?):\s(.+)$/)
        if (kvMatch) {
          return (
            <p key={i} className="text-sm leading-relaxed">
              <span className="text-muted-foreground/60 font-medium">{kvMatch[1]}:</span>{' '}
              <span className="text-foreground/80">{kvMatch[2]}</span>
            </p>
          )
        }
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm text-foreground/80 leading-relaxed">{line}</p>
      })}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════
export function LeadsTab() {
  const { leads, isLoading, updateLeadStatus, markAsRead, reply, refetch } = useLeads()
  const { getToken } = useAuth()

  const [selectedLead, setSelectedLead]             = React.useState<Lead | null>(null)
  const [statusFilter, setStatusFilter]             = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery]               = React.useState('')
  const [isSyncing, setIsSyncing]                   = React.useState(false)
  const [syncError, setSyncError]                   = React.useState<string | null>(null)
  const [centralConnected, setCentralConnected]     = React.useState(false)
  const [centralEmail, setCentralEmail]             = React.useState('')
  const [lastSyncTime, setLastSyncTime]             = React.useState<Date | null>(null)
  const [syncCountdown, setSyncCountdown]           = React.useState(0)
  const [replyMessage, setReplyMessage]             = React.useState('')
  const [isSendingReply, setIsSendingReply]         = React.useState(false)
  const [appointmentOpen, setAppointmentOpen]       = React.useState(false)
  const [appointmentForm, setAppointmentForm]       = React.useState({ date: '', time: '', notes: '', locationOrVehicle: '' })
  const [toasts, setToasts]                         = React.useState<Toast[]>([])
  const [selectedLeadClosed, setSelectedLeadClosed] = React.useState(false)
  const [messageThreads, setMessageThreads]         = React.useState<Record<string, any[]>>({})
  const [leadsMultiPane, setLeadsMultiPane]         = React.useState(false)
  const [listPaneSize, setListPaneSize]             = React.useState(40)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // ── Pane config persistence ──
  React.useEffect(() => {
    try {
      const saved = sessionStorage.getItem("leads-pane-config")
      if (saved) {
        const cfg = JSON.parse(saved)
        if (typeof cfg.leadsMultiPane === "boolean") setLeadsMultiPane(cfg.leadsMultiPane)
        if (typeof cfg.listPaneSize === "number") setListPaneSize(cfg.listPaneSize)
      }
    } catch {}
  }, [])
  React.useEffect(() => {
    try { sessionStorage.setItem("leads-pane-config", JSON.stringify({ leadsMultiPane, listPaneSize })) } catch {}
  }, [leadsMultiPane, listPaneSize])

  const handlePaneResize = React.useCallback((deltaX: number) => {
    if (!containerRef.current) return
    const containerWidth = containerRef.current.getBoundingClientRect().width
    setListPaneSize((prev) => Math.max(20, Math.min(65, prev + (deltaX / containerWidth) * 100)))
  }, [])

  // ── Check centralized sync status on mount ──
  React.useEffect(() => {
    const checkStatus = async () => {
      try {
        const token = await getToken()
        const res = await apiClient.get('/api/leads/sync-status', { headers: { Authorization: `Bearer ${token}` } })
        const data = res.data?.data
        setCentralConnected(data?.connected || false)
        setCentralEmail(data?.email || '')
      } catch {
        setCentralConnected(false)
      }
    }
    checkStatus()
  }, [getToken])

  // ── Auto-sync every 60s when connected ──
  React.useEffect(() => {
    if (!centralConnected) return
    const syncInterval = setInterval(async () => {
      try {
        const token = await getToken()
        const result = await apiClient.syncPost('/api/leads/sync-central', {}, { headers: { Authorization: `Bearer ${token}` } })
        const n = result.data?.data?.syncedCount || 0
        if (n > 0) addToast('success', `Auto-synced: ${n} new lead${n > 1 ? 's' : ''}`)
        setLastSyncTime(new Date()); setSyncCountdown(60); await refetch()
      } catch {}
    }, 60000)
    const cd = setInterval(() => setSyncCountdown(p => p > 0 ? p - 1 : 0), 1000)
    return () => { clearInterval(syncInterval); clearInterval(cd) }
  }, [getToken, centralConnected])

  // ── Fetch thread messages when lead selected ──
  // Guard: only fetch if the lead has a threadId (Gmail-synced leads).
  // Manually created leads have no threadId and will get a 400/404 otherwise.
  React.useEffect(() => {
    if (!selectedLead) return

    // No threadId — skip the API call entirely and set empty thread
    if (!(selectedLead as any).threadId) {
      setMessageThreads(p => ({ ...p, [selectedLead._id]: [] }))
      return
    }

    const fetchThread = async () => {
      try {
        const token = await getToken()
        if (!token) return
        const res = await apiClient.get(`/api/leads/${selectedLead._id}/thread`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setMessageThreads(p => ({ ...p, [selectedLead._id]: res.data?.data?.messages || [] }))
      } catch {
        setMessageThreads(p => ({ ...p, [selectedLead._id]: [] }))
      }
    }

    fetchThread()
  }, [selectedLead, getToken])

  // ── Toast helper ──
  const addToast = (type: Toast['type'], message: string) => {
    if (toasts.some(t => t.message === message && t.type === type)) return
    const id = Math.random().toString()
    setToasts(p => [...p, { id, type, message, ts: new Date() }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 6000)
  }

  // ── Actions ──
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
      setIsSyncing(true); setSyncError(null); addToast('info', 'Syncing leads…')
      const token = await getToken()
      const result = await apiClient.syncPost('/api/leads/sync-central', {}, { headers: { Authorization: `Bearer ${token}` } })
      const n = result.data?.data?.syncedCount || 0
      setLastSyncTime(new Date()); setSyncCountdown(60)
      addToast(n > 0 ? 'success' : 'info', n > 0 ? `${n} new lead${n > 1 ? 's' : ''} imported` : 'Already up to date')
      // Wait for DB writes to settle, then force a full cache-busting refetch
      await refetch()
    } catch (err: any) {
      const isTimeout = err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')
      const msg = isTimeout
        ? 'Sync is taking too long — the backend is still processing. Wait a moment and click Refresh.'
        : err?.response?.data?.message || 'Sync failed. Check centralized account config.'
      setSyncError(msg); addToast('error', msg)
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

  // ── Filter & group leads ──
  const filteredLeads = React.useMemo(() => {
    let f = leads
    if (statusFilter && statusFilter !== 'Inbound Calls') f = f.filter((l: Lead) => l.status === statusFilter)
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
    inboundCalls: leads.filter((l: Lead) => (l.status as string) === 'Inbound Calls').length,
  }), [leads])

  return (
    <div className="flex flex-col gap-5">
      <ToastStack toasts={toasts} dismiss={(id) => setToasts(p => p.filter(t => t.id !== id))} />

      {/* ═══ Header ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Inquiries & Leads</h2>
          {centralConnected && statusFilter !== 'Inbound Calls' && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
              Centralized · {centralEmail}
              {lastSyncTime && <span className="text-muted-foreground/50 ml-1">· {fmtTime(lastSyncTime)} ({syncCountdown}s)</span>}
            </p>
          )}
        </div>
        {statusFilter !== 'Inbound Calls' && (
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setLeadsMultiPane((p) => !p)}
                  variant="outline" size="sm"
                  className={`h-8 w-8 p-0 rounded-lg transition-all ${leadsMultiPane ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 hover:text-white" : "border-border/50 hover:border-emerald-500/40"}`}
                >
                  {leadsMultiPane ? <LayoutList className="h-3.5 w-3.5" /> : <Columns2 className="h-3.5 w-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">{leadsMultiPane ? "Single pane view" : "Split pane view"}</TooltipContent>
            </Tooltip>
            <Button onClick={handleSyncEmails} disabled={!centralConnected || isSyncing} variant="outline" size="sm" className="h-8 text-xs gap-1.5 rounded-lg">
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing…' : 'Refresh'}
            </Button>
            <SupraLeoAI variant="toolbar" />
          </div>
        )}
      </div>

      {/* ═══ Status filter tabs ═══ */}
      <div className="flex flex-wrap gap-2">
        {[
          { filter: null, label: 'All', value: stats.total },
          { filter: 'New', label: 'Unread Emails', value: stats.new },
          { filter: 'Pending', label: 'Pending Emails', value: stats.pending },
          { filter: 'Contacted', label: 'Unread SMS', value: stats.contacted },
          { filter: 'Appointment Set', label: 'Pending SMS', value: stats.appointmentSet },
          { filter: 'Closed', label: 'Completed', value: stats.closed },
          { filter: 'Inbound Calls', label: 'Inbound Calls', value: stats.inboundCalls },
        ].map((s, i) => (
          <button key={i} onClick={() => { setStatusFilter(s.filter); setSelectedLead(null) }}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${statusFilter === s.filter ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-card text-foreground border-border/50 hover:border-emerald-500/40 hover:text-emerald-600'}`}>
            {s.label}
            {s.filter !== 'Inbound Calls' && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${statusFilter === s.filter ? 'bg-white/20' : 'bg-muted/60'}`}>{s.value}</span>
            )}
          </button>
        ))}
      </div>

      {statusFilter === 'Inbound Calls' ? (
        <InboundCallsTab />
      ) : (
        <>
          {/* ═══ Not connected banner ═══ */}
          {!centralConnected && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Centralized ingestion not configured</p>
                <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">Set CENTRAL_GMAIL_* environment variables to enable lead syncing from {centralEmail || 'actionautoutah.dev@gmail.com'}.</p>
              </div>
              <Zap className="h-5 w-5 text-amber-500/60 shrink-0" />
            </div>
          )}

          {/* ═══ Search ═══ */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
            <Input placeholder="Search by name, email, or subject…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm rounded-xl border-border/50 bg-card focus-visible:ring-emerald-500/30" />
          </div>

          {/* ═══ Main layout ═══ */}
          <div ref={containerRef} className={`min-h-[600px] ${leadsMultiPane ? "flex rounded-2xl border border-border/50 overflow-hidden" : "grid grid-cols-1 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1.45fr)] gap-4"}`}>

            {/* ═══ LEFT — Lead List ═══ */}
            <div
              className={`${leadsMultiPane ? "flex flex-col overflow-hidden border-r border-border/40" : `${selectedLead ? 'hidden lg:flex' : 'flex'} flex-col rounded-2xl border border-border/50 bg-card overflow-hidden`}`}
              style={leadsMultiPane ? { flexBasis: `${listPaneSize}%`, flexGrow: 0, flexShrink: 0, minWidth: 0 } : undefined}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">Messages</p>
                <div className="flex items-center gap-2">
                  {leadsMultiPane && <span className="text-[9px] tabular-nums text-muted-foreground/30 font-mono">{Math.round(listPaneSize)}%</span>}
                  <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">{filteredLeads.length}</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-border/40 bg-card">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12"><p className="text-xs text-muted-foreground/50">Loading…</p></div>
                ) : filteredLeads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Mail className="h-10 w-10 text-muted-foreground/10" />
                    <p className="text-xs text-muted-foreground/40">No inquiries found</p>
                  </div>
                ) : (
                  filteredLeads.map((lead: any) => {
                    const isSelected = selectedLead?._id === lead._id
                    return (
                      <div key={lead._id} onClick={() => { setSelectedLead(lead); if (!lead.isRead) markAsRead(lead._id); setSelectedLeadClosed(lead.status === 'Closed') }}
                        className={`px-4 py-3.5 cursor-pointer transition-all group ${isSelected ? 'bg-emerald-500/5 border-l-2 border-emerald-500' : 'border-l-2 border-transparent hover:bg-muted/30'}`}>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">{getInitials(lead.firstName, lead.lastName)}</div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold leading-none truncate">{lead.firstName} {lead.lastName}</p>
                              <p className="text-[11px] text-muted-foreground/50 truncate mt-0.5">{lead.senderEmail || lead.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 mt-0.5">
                            <SupraLeoReadButton lead={lead} size="sm" />
                            <ChannelBadge channel={(lead as any).channel} size="sm" />
                            {lead._emailCount > 1 && <span className="text-[9px] font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded-full">{lead._emailCount}</span>}
                            {!lead.isRead && <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1" />}
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

            {leadsMultiPane && <LeadsPaneResizer onDrag={handlePaneResize} />}

            {/* ═══ RIGHT — Lead Detail ═══ */}
            <div
              className={`${leadsMultiPane ? "flex flex-col overflow-hidden bg-card" : `${!selectedLead ? 'hidden lg:flex' : 'flex'} flex-col rounded-2xl border border-border/50 bg-card overflow-hidden`}`}
              style={leadsMultiPane ? { flex: 1, minWidth: 0 } : undefined}
            >
              {selectedLead ? (
                <div className="flex flex-col h-full min-h-0">

                  {/* ── Compact header ── */}
                  <div className="px-5 py-3 border-b border-border/50 shrink-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <button onClick={() => setSelectedLead(null)} className={`${leadsMultiPane ? 'hidden' : 'lg:hidden'} p-1.5 rounded-lg hover:bg-muted/40 transition-colors shrink-0`}>
                          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <div className="h-9 w-9 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{getInitials(selectedLead.firstName, selectedLead.lastName)}</div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold leading-tight truncate">{selectedLead.firstName} {selectedLead.lastName}</h3>
                            <ChannelBadge channel={(selectedLead as any).channel} size="md" />
                          </div>
                          <p className="text-[11px] text-muted-foreground/50 truncate">{selectedLead.senderEmail || selectedLead.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <SupraLeoReadButton lead={selectedLead} size="md" />
                        <StatusPill status={selectedLead.status} />
                        <button onClick={() => setSelectedLead(null)} className="p-1 rounded-lg hover:bg-muted/40 transition-colors"><X className="h-3.5 w-3.5 text-muted-foreground/50" /></button>
                      </div>
                    </div>
                    {/* ── Inline metadata row ── */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px]">
                      <span className="text-muted-foreground/50">
                        <span className="font-medium text-muted-foreground/70">Subject:</span> {selectedLead.subject || '(No subject)'}
                      </span>
                      <span className="text-muted-foreground/50">
                        <span className="font-medium text-muted-foreground/70">Date:</span> {fmtFull(new Date(selectedLead.createdAt))}
                      </span>
                      {selectedLead.phone && (
                        <span className="text-muted-foreground/50">
                          <span className="font-medium text-muted-foreground/70">Phone:</span> {selectedLead.phone}
                        </span>
                      )}
                      {(selectedLead as any).vehicle?.make && (
                        <span className="text-muted-foreground/50">
                          <span className="font-medium text-muted-foreground/70">Vehicle:</span>{' '}
                          {[(selectedLead as any).vehicle?.year, (selectedLead as any).vehicle?.make, (selectedLead as any).vehicle?.model].filter(Boolean).join(' ')}
                        </span>
                      )}
                    </div>
                    {/* ── Appointment info (compact) ── */}
                    {(selectedLead as any).appointment && (
                      <div className="flex items-center gap-3 mt-2 px-2.5 py-1.5 rounded-lg bg-violet-500/5 border border-violet-500/15 text-[11px]">
                        <Calendar className="h-3 w-3 text-violet-500 shrink-0" />
                        <span className="text-violet-700 dark:text-violet-300 font-medium">
                          {new Date((selectedLead as any).appointment.date).toLocaleDateString()} at {(selectedLead as any).appointment.time}
                          {(selectedLead as any).appointment.location && ` · ${(selectedLead as any).appointment.location}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ── Message body (scrollable) ── */}
                  <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3 bg-muted/10">
                    {/* Primary message */}
                    <div className="flex justify-start">
                      <div className="max-w-2xl w-full rounded-xl border border-border/50 bg-card p-4">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/40">
                          <div className="h-6 w-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">{getInitials(selectedLead.firstName, selectedLead.lastName)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{selectedLead.firstName} {selectedLead.lastName}</p>
                          </div>
                          <p className="text-[10px] text-muted-foreground/40 shrink-0">{fmtFull(new Date(selectedLead.createdAt))}</p>
                        </div>
                        <ParsedContentDisplay
                          content={(selectedLead as any).parsedContent}
                          rawBody={selectedLead.body}
                        />
                      </div>
                    </div>
                    {/* Thread messages */}
                    {messageThreads[selectedLead._id]?.map((msg: any) => (
                      <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-2xl w-full rounded-xl border p-4 ${msg.isOwn ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-card border-border/50'}`}>
                          <div className={`flex items-center gap-2 mb-2 pb-2 border-b ${msg.isOwn ? 'border-white/20' : 'border-border/40'}`}>
                            <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${msg.isOwn ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>{msg.isOwn ? 'YOU' : msg.sender.substring(0, 2).toUpperCase()}</div>
                            <p className={`text-[11px] font-medium flex-1 ${msg.isOwn ? 'text-white/80' : 'text-muted-foreground'}`}>{msg.isOwn ? 'You' : msg.sender}</p>
                            <p className={`text-[10px] shrink-0 ${msg.isOwn ? 'text-white/50' : 'text-muted-foreground/40'}`}>{fmtFull(msg.timestamp)}</p>
                          </div>
                          <p className={`text-sm leading-relaxed ${msg.isOwn ? 'text-white' : 'text-foreground/80'}`}>{msg.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ═══ COMPACT REPLY / ACTION BAR ═══ */}
                  {!selectedLeadClosed ? (
                    <div className="border-t border-border/50 px-4 py-3 bg-card shrink-0">
                      <div className="flex items-end gap-2">
                        <Textarea
                          placeholder="Type your reply…"
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          rows={1}
                          className="text-sm resize-none rounded-xl border-border/50 bg-muted/20 focus-visible:ring-emerald-500/30 min-h-[38px] max-h-[100px] flex-1"
                          onInput={(e) => {
                            const el = e.currentTarget
                            el.style.height = 'auto'
                            el.style.height = Math.min(el.scrollHeight, 100) + 'px'
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                              e.preventDefault()
                              handleSendReply()
                            }
                          }}
                        />
                        <Button
                          onClick={handleSendReply}
                          disabled={isSendingReply || !replyMessage.trim()}
                          size="sm"
                          className="h-[38px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shrink-0"
                        >
                          <Send className="h-3.5 w-3.5" />
                          {isSendingReply ? 'Sending…' : 'Send'}
                        </Button>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1 px-2 rounded-lg text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="h-3 w-3" /> Status <ChevronDown className="h-2.5 w-2.5 opacity-50" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="rounded-xl">
                            {Object.keys(statusConfig).filter(s => s !== selectedLead.status && s !== 'Inbound Calls').map(s => (
                              <DropdownMenuItem key={s} onClick={() => { handleStatusChange(s); setSelectedLead(p => p ? { ...p, status: s as any } : null) }} className="text-xs gap-2 cursor-pointer">
                                {statusConfig[s as keyof typeof statusConfig].icon} {statusConfig[s as keyof typeof statusConfig].label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button size="sm" variant="ghost" onClick={() => setAppointmentOpen(true)} className="h-7 text-[11px] gap-1 px-2 rounded-lg text-muted-foreground hover:text-foreground">
                          <Calendar className="h-3 w-3" /> Appt
                        </Button>
                        <div className="flex-1" />
                        <Button onClick={() => { handleStatusChange('Closed'); setSelectedLeadClosed(true) }} size="sm" variant="ghost" className="h-7 text-[11px] gap-1 px-2 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/5">
                          <XCircle className="h-3 w-3" /> Close
                        </Button>
                        <span className="text-[10px] text-muted-foreground/30">⌘↵ to send</span>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-border/50 px-4 py-3 flex items-center justify-between bg-muted/20 shrink-0">
                      <div className="flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5 text-muted-foreground/40" />
                        <p className="text-xs font-medium text-muted-foreground/60">Inquiry closed</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => { handleStatusChange('Pending'); setSelectedLeadClosed(false) }} className="h-7 text-[11px] gap-1 px-2 rounded-lg">
                        <LockOpen className="h-3 w-3" /> Reopen
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 bg-card">
                  <div className="h-16 w-16 rounded-2xl border-2 border-dashed border-border/30 flex items-center justify-center"><Mail className="h-7 w-7 text-muted-foreground/20" /></div>
                  <p className="text-sm text-muted-foreground/40">Select an inquiry to view</p>
                </div>
              )}
            </div>
          </div>

          {/* ═══ Appointment dialog ═══ */}
          <Dialog open={appointmentOpen} onOpenChange={setAppointmentOpen}>
            <DialogContent className="max-w-md rounded-2xl">
              <DialogHeader><DialogTitle>Schedule Appointment</DialogTitle><DialogDescription>with {selectedLead?.firstName} {selectedLead?.lastName}</DialogDescription></DialogHeader>
              <div className="space-y-4 py-1">
                {[
                  { label: 'Date *', key: 'date', type: 'date', placeholder: '' },
                  { label: 'Time *', key: 'time', type: 'time', placeholder: '' },
                  { label: 'Location / Vehicle', key: 'locationOrVehicle', type: 'text', placeholder: 'e.g., Showroom, Test Drive, Vehicle Model' },
                ].map(f => (
                  <div key={f.key}>
                    <Label className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/40">{f.label}</Label>
                    <Input type={f.type} placeholder={f.placeholder} value={appointmentForm[f.key as keyof typeof appointmentForm]} onChange={(e) => setAppointmentForm({ ...appointmentForm, [f.key]: e.target.value })} className="mt-1 rounded-xl border-border/50 text-sm" />
                  </div>
                ))}
                <div>
                  <Label className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/40">Notes</Label>
                  <Textarea placeholder="Additional details…" value={appointmentForm.notes} onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })} rows={2} className="mt-1 rounded-xl border-border/50 text-sm resize-none" />
                </div>
                {selectedLead?.phone && (
                  <div className="rounded-xl border border-border/50 bg-muted/20 px-3 py-2">
                    <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/40 font-medium">Phone</p>
                    <p className="text-sm font-semibold mt-0.5">{selectedLead.phone}</p>
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => { setAppointmentOpen(false); setAppointmentForm({ date: '', time: '', notes: '', locationOrVehicle: '' }) }} className="rounded-lg text-xs">Cancel</Button>
                <Button onClick={handleSetAppointment} disabled={!appointmentForm.date || !appointmentForm.time} className="rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 text-white">Save & Schedule</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}