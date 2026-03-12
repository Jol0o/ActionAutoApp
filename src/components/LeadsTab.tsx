"use client"

import * as React from "react"
import { useLeads, Lead } from "@/hooks/useLeads"
import {
  Mail, Phone, Calendar, X, Send, Clock3, XCircle, LockOpen, Lock,
  ChevronLeft, RefreshCw, Search, CheckCircle2, AlertCircle, Info,
  ChevronDown, PhoneIncoming, MessageSquare, Globe, FileText,
  ChevronRight, ChevronsLeft, ChevronsRight, Inbox, Circle, Car,
} from "lucide-react"
import { useAuth } from "@/providers/AuthProvider"
import { apiClient } from "@/lib/api-client"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { InboundCallsTab } from "@/components/inbound-calls/InboundCallsTab"
import { SupraLeoAI } from "@/components/supra-leo-ai/SupraLeoAI"
import { SupraLeoReadButton } from "@/components/supra-leo-ai/SupraLeoReadButton"

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const LEADS_SOURCE_EMAIL    = 'leads@dealerscloud.com'
const LEADS_PER_PAGE        = 20
const AUTO_SYNC_INTERVAL_MS = 30_000

// ─────────────────────────────────────────────────────────────
// Status config
// ─────────────────────────────────────────────────────────────
const STATUS: Record<string, { bg: string; text: string; border: string; dot: string; label: string; icon: React.ReactNode }> = {
  'New':             { bg: 'bg-emerald-500/10', text: 'text-emerald-400',  border: 'border-emerald-500/25', dot: 'bg-emerald-400',  label: 'New',        icon: <Mail className="h-3 w-3" /> },
  'Pending':         { bg: 'bg-amber-500/10',   text: 'text-amber-400',    border: 'border-amber-500/25',   dot: 'bg-amber-400',    label: 'Pending',    icon: <Clock3 className="h-3 w-3" /> },
  'Contacted':       { bg: 'bg-sky-500/10',     text: 'text-sky-400',      border: 'border-sky-500/25',     dot: 'bg-sky-400',      label: 'Contacted',  icon: <Phone className="h-3 w-3" /> },
  'Appointment Set': { bg: 'bg-violet-500/10',  text: 'text-violet-400',   border: 'border-violet-500/25',  dot: 'bg-violet-400',   label: 'Appt. Set',  icon: <Calendar className="h-3 w-3" /> },
  'Closed':          { bg: 'bg-slate-500/10',   text: 'text-slate-400',    border: 'border-slate-500/25',   dot: 'bg-slate-500',    label: 'Closed',     icon: <XCircle className="h-3 w-3" /> },
  'Inbound Calls':   { bg: 'bg-teal-500/10',    text: 'text-teal-400',     border: 'border-teal-500/25',    dot: 'bg-teal-400',     label: 'Inbound',    icon: <PhoneIncoming className="h-3 w-3" /> },
}

// ─────────────────────────────────────────────────────────────
// Channel config
// ─────────────────────────────────────────────────────────────
const CHANNEL: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  email: { label: 'Email', icon: <Mail className="h-2.5 w-2.5" />,          cls: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  sms:   { label: 'SMS',   icon: <MessageSquare className="h-2.5 w-2.5" />, cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  adf:   { label: 'ADF',   icon: <FileText className="h-2.5 w-2.5" />,      cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  phone: { label: 'Phone', icon: <Phone className="h-2.5 w-2.5" />,         cls: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  web:   { label: 'Web',   icon: <Globe className="h-2.5 w-2.5" />,         cls: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const cleanHTML = (html: string) => {
  if (!html) return ''
  return html
    .replace(/<!doctype[^>]*>/gi, '').replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/\r\n/g, '\n').trim()
}
const getInitials = (a?: string, b?: string) => ((a?.[0] || '') + (b?.[0] || '')).toUpperCase() || '??'
const fmtTime  = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
const fmtShort = (d: Date) => {
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (diff === 0) return fmtTime(d)
  if (diff === 1) return 'Yesterday'
  if (diff < 7)  return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
const fmtFull = (d: Date) => d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

// ─────────────────────────────────────────────────────────────
// Avatar — deterministic green hue from initials
// ─────────────────────────────────────────────────────────────
function Avatar({ first, last, size = 'md' }: { first?: string; last?: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = getInitials(first, last)
  const sz = { sm: 'h-8 w-8 text-[10px]', md: 'h-9 w-9 text-xs', lg: 'h-11 w-11 text-sm' }[size]
  const hue = [160, 150, 170, 145, 165, 155][(initials.charCodeAt(0) || 0) % 6]
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-semibold shrink-0 select-none`}
      style={{ background: `hsl(${hue},42%,20%)`, color: `hsl(${hue},65%,62%)`, border: `1.5px solid hsl(${hue},45%,28%)` }}
    >
      {initials}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// StatusPill / ChannelBadge
// ─────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const c = STATUS[status]; if (!c) return null
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium tracking-wide ${c.bg} ${c.text} ${c.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />{c.label}
    </span>
  )
}
function ChannelBadge({ channel }: { channel?: string }) {
  const c = CHANNEL[channel || 'email'] || CHANNEL.email
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-semibold tracking-wide ${c.cls}`}>
      {c.icon}{c.label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────
interface Toast { id: string; type: 'success'|'error'|'info'; message: string; ts: Date }
function ToastStack({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  const V = {
    success: { cls: 'border-emerald-500/40 bg-[#0c2016]', icon: <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> },
    error:   { cls: 'border-rose-500/40 bg-[#200c10]',    icon: <AlertCircle  className="h-4 w-4 text-rose-400 shrink-0" /> },
    info:    { cls: 'border-sky-500/40 bg-[#0c1620]',     icon: <Info         className="h-4 w-4 text-sky-400 shrink-0" /> },
  }
  return (
    <div className="fixed top-5 right-5 z-50 space-y-2 max-w-sm pointer-events-none">
      {toasts.map(t => {
        const v = V[t.type]
        return (
          <div key={t.id} className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl border animate-in slide-in-from-top-3 duration-200 ${v.cls}`}>
            {v.icon}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-100 leading-snug">{t.message}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{fmtTime(t.ts)}</p>
            </div>
            <button onClick={() => dismiss(t.id)} className="text-slate-600 hover:text-slate-300 transition-colors mt-0.5"><X className="h-3.5 w-3.5" /></button>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ADF XML parser helpers
// ─────────────────────────────────────────────────────────────
function getXmlText(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return m ? m[1].replace(/&amp;#8217;/g, '\u2019').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#\d+;/g, '').trim() : ''
}
function getXmlAttr(xml: string, tag: string, attr: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 'i'))
  return m ? m[1] : ''
}
function isAdfBody(raw: string): boolean {
  return /(<adf>|adf version|<prospect|<vehicle interest)/i.test(raw)
}

// ── ADF lead card ────────────────────────────────────────────
function AdfContent({ rawBody }: { rawBody: string }) {
  // Decode HTML-encoded XML (emails often wrap ADF in HTML)
  const decoded = rawBody
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/<!--\?[^>]*-->/g, '') // strip <?xml?> and <?ADF?> PI comments

  // Vehicle fields
  const vYear   = getXmlText(decoded, 'year')
  const vMake   = getXmlText(decoded, 'make')
  const vModel  = getXmlText(decoded, 'model')
  const vTrim   = getXmlText(decoded, 'trim')
  const vStyle  = getXmlText(decoded, 'bodystyle')
  const vVin    = getXmlText(decoded, 'vin')
  const vStock  = getXmlText(decoded, 'stock')
  const vOdo    = getXmlText(decoded, 'odometer')
  const vInt    = getXmlAttr(decoded, 'vehicle', 'interest')
  const vStatus = getXmlAttr(decoded, 'vehicle', 'status')
  const vSource = getXmlAttr(decoded, 'id', 'source')

  // Customer fields
  const cName  = getXmlText(decoded, 'name')
  const cEmail = getXmlText(decoded, 'email')
  const cPhone = getXmlText(decoded, 'phone')

  // Comments — strip tracking noise after known separators
  let comments = getXmlText(decoded, 'comments')
  comments = comments
    .replace(/\s*[-\u2014]{3,}[\s\S]*$/, '')       // strip trailing "--- Copy and paste..." blocks
    .replace(/\s*VIN:[A-Z0-9]+[\s\S]*$/, '')   // strip trailing VIN tracking tags
    .replace(/\s*TCPAOptIn:[\s\S]*$/i, '')      // strip TCPA opt-in noise
    .replace(/\s*\([A-Za-z0-9+/]{10,}[^)]*\)/g, '') // strip base64 tracking tokens
    .replace(/\s*CarGurus[^.]*\./g, '.')   // strip CarGurus deal rating suffix
    .replace(/\s*\(CarGurus[^)]*\)/g, '')  // strip CarGurus in parens
    .replace(/\s*\(Is From Shippable[^)]*\)/g, '')
    .replace(/\s*Delivery Cost:[^,]*,?/g, '')
    .replace(/\s*Price \+ Delivery:[^,).]*/g, '')
    .replace(/I&amp;#8217;/g, "I\u2019")
    .replace(/&amp;#8217;/g, '\u2019')
    .replace(/\s{2,}/g, ' ')
    .trim()

  // Request date
  const reqDate = getXmlText(decoded, 'requestdate')
  const fmtReqDate = reqDate ? (() => { try { return new Date(reqDate).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) } catch { return reqDate } })() : ''

  const vehicleLabel = [vYear, vMake, vModel, vTrim].filter(Boolean).join(' ')
  const hasVehicle   = !!(vYear || vMake || vModel)

  const KVRow = ({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) => (
    value ? (
      <div className="flex items-baseline gap-4 py-2 border-b border-white/[0.05] last:border-0">
        <span className="text-slate-500 text-[12px] font-medium shrink-0 w-28 text-right uppercase tracking-wide">{label}</span>
        <span className={`text-slate-100 text-[14px] font-semibold ${mono ? 'font-mono' : ''}`}>{value}</span>
      </div>
    ) : null
  )

  return (
    <div className="space-y-5">

      {/* ── Source badge ── */}
      {(vSource || vInt || vStatus) && (
        <div className="flex items-center gap-2 flex-wrap">
          {vSource && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border bg-emerald-500/10 border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
              {vSource}
            </span>
          )}
          {vInt && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border bg-sky-500/10 border-sky-500/20 text-[10px] font-bold text-sky-400 uppercase tracking-wide">
              Interest: {vInt}
            </span>
          )}
          {vStatus && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border bg-amber-500/10 border-amber-500/20 text-[10px] font-bold text-amber-400 uppercase tracking-wide">
              {vStatus}
            </span>
          )}
          {fmtReqDate && (
            <span className="text-[11px] text-slate-700 ml-auto">{fmtReqDate}</span>
          )}
        </div>
      )}

      {/* ── Vehicle block ── */}
      {hasVehicle && (
        <div className="rounded-xl border border-emerald-900/30 bg-[#050f08] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-emerald-900/20 bg-emerald-900/10">
            <Car className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-500">Vehicle of Interest</span>
          </div>
          <div className="px-4 py-1">
            {vehicleLabel && (
              <div className="py-3 border-b border-white/[0.05]">
                <p className="text-[17px] font-bold text-white">{vehicleLabel}</p>
                {vStyle && <p className="text-[12px] text-slate-500 mt-0.5">{vStyle}</p>}
              </div>
            )}
            <KVRow label="VIN"       value={vVin}   mono />
            <KVRow label="Stock #"   value={vStock} mono />
            <KVRow label="Odometer"  value={vOdo ? `${Number(vOdo).toLocaleString()} mi` : ''} />
          </div>
        </div>
      )}

      {/* ── Customer block ── */}
      {(cName || cEmail || cPhone) && (
        <div className="rounded-xl border border-sky-900/25 bg-[#05090f] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-sky-900/20 bg-sky-900/10">
            <Mail className="h-3.5 w-3.5 text-sky-400 shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-400">Customer</span>
          </div>
          <div className="px-4 py-1">
            <KVRow label="Name"  value={cName} />
            <KVRow label="Email" value={cEmail} />
            <KVRow label="Phone" value={cPhone} />
          </div>
        </div>
      )}

      {/* ── Comments block ── */}
      {comments && (
        <div className="rounded-xl border border-white/[0.06] bg-[#08080a] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
            <MessageSquare className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">Customer Comments</span>
          </div>
          <div className="px-5 py-4">
            <p className="text-[15px] text-slate-100 leading-[1.75]">{comments}</p>
          </div>
        </div>
      )}

    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ParsedContent — routes to ADF parser or plain text renderer
// ─────────────────────────────────────────────────────────────
function ParsedContent({ content, rawBody }: { content?: string; rawBody?: string }) {
  const raw = rawBody || ''

  // If raw body is ADF XML, use the structured ADF renderer
  if (isAdfBody(raw)) return <AdfContent rawBody={raw} />

  const text = content || cleanHTML(raw)
  if (!text) return <p className="text-[15px] text-slate-600 italic">No content available.</p>
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />
        if (line.match(/^—\s.+\s—$/)) {
          return (
            <div key={i} className="flex items-center gap-3 mt-4 mb-1 first:mt-0">
              <div className="h-px flex-1 bg-emerald-900/40" />
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-500">{line.replace(/—/g,'').trim()}</span>
              <div className="h-px flex-1 bg-emerald-900/40" />
            </div>
          )
        }
        const kv = line.match(/^(.+?):\s(.+)$/)
        if (kv) return (
          <div key={i} className="flex gap-4 text-[14px] leading-relaxed items-baseline py-1.5 border-b border-white/[0.05] last:border-0">
            <span className="text-slate-500 font-medium shrink-0 w-32 text-right">{kv[1]}</span>
            <span className="text-slate-100 font-semibold">{kv[2]}</span>
          </div>
        )
        if (i === 0) return <p key={i} className="text-[16px] font-bold text-white leading-snug">{line}</p>
        return <p key={i} className="text-[15px] text-slate-100 leading-[1.75]">{line}</p>
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────
function Pagination({ currentPage, totalPages, totalItems, onPageChange }: {
  currentPage: number; totalPages: number; totalItems: number; onPageChange: (p: number) => void
}) {
  if (totalPages <= 1) return null
  const start = (currentPage - 1) * LEADS_PER_PAGE + 1
  const end   = Math.min(currentPage * LEADS_PER_PAGE, totalItems)
  const pages: (number | '…')[] = []
  if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i) }
  else {
    pages.push(1)
    if (currentPage > 3) pages.push('…')
    for (let p = Math.max(2, currentPage-1); p <= Math.min(totalPages-1, currentPage+1); p++) pages.push(p)
    if (currentPage < totalPages-2) pages.push('…')
    pages.push(totalPages)
  }
  const btn = 'h-6 w-6 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-200 hover:bg-[#1e3327] disabled:opacity-25 disabled:cursor-not-allowed transition-colors'
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#1e3327] shrink-0">
      <span className="text-[10px] text-slate-700 tabular-nums">{start}–{end} of {totalItems}</span>
      <div className="flex items-center gap-0.5">
        <button onClick={() => onPageChange(1)} disabled={currentPage===1} className={btn}><ChevronsLeft className="h-3 w-3" /></button>
        <button onClick={() => onPageChange(currentPage-1)} disabled={currentPage===1} className={btn}><ChevronLeft className="h-3 w-3" /></button>
        {pages.map((p,i) => p==='…'
          ? <span key={`el${i}`} className="px-1 text-[10px] text-slate-700">…</span>
          : <button key={p} onClick={() => onPageChange(p as number)}
              className={`h-6 min-w-[24px] px-1.5 rounded-md text-[10px] font-medium transition-colors ${currentPage===p ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-200 hover:bg-[#1e3327]'}`}>{p}</button>
        )}
        <button onClick={() => onPageChange(currentPage+1)} disabled={currentPage===totalPages} className={btn}><ChevronRight className="h-3 w-3" /></button>
        <button onClick={() => onPageChange(totalPages)} disabled={currentPage===totalPages} className={btn}><ChevronsRight className="h-3 w-3" /></button>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════
export function LeadsTab() {
  const { leads, isLoading, updateLeadStatus, markAsRead, refetch } = useLeads()
  const { getToken } = useAuth()

  const [selectedLead, setSelectedLead]         = React.useState<Lead | null>(null)
  const [statusFilter, setStatusFilter]         = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery]           = React.useState('')
  const [currentPage, setCurrentPage]           = React.useState(1)
  const [isSyncing, setIsSyncing]               = React.useState(false)
  const [centralConnected, setCentralConnected] = React.useState(false)
  const [centralEmail, setCentralEmail]         = React.useState('')
  const [lastSyncTime, setLastSyncTime]         = React.useState<Date | null>(null)
  const [syncCountdown, setSyncCountdown]       = React.useState(0)
  const [replyMessage, setReplyMessage]         = React.useState('')
  const [isSending, setIsSending]               = React.useState(false)
  const [apptOpen, setApptOpen]                 = React.useState(false)
  const [apptForm, setApptForm]                 = React.useState({ date:'', time:'', notes:'', locationOrVehicle:'' })
  const [toasts, setToasts]                     = React.useState<Toast[]>([])
  const [isClosed, setIsClosed]                 = React.useState(false)
  const [threads, setThreads]                   = React.useState<Record<string, any[]>>({})

  // Independent scroll refs
  const listRef    = React.useRef<HTMLDivElement>(null)
  const msgRef     = React.useRef<HTMLDivElement>(null)

  // ── sync status on mount ──
  React.useEffect(() => {
    (async () => {
      try {
        const token = await getToken()
        const res = await apiClient.get('/api/leads/sync-status', { headers: { Authorization: `Bearer ${token}` } })
        const d = res.data?.data
        setCentralConnected(d?.connected || false)
        setCentralEmail(d?.email || '')
      } catch { setCentralConnected(false) }
    })()
  }, [getToken])

  // ── 30s auto-sync ──
  React.useEffect(() => {
    if (!centralConnected) return
    setSyncCountdown(AUTO_SYNC_INTERVAL_MS / 1000)
    const sI = setInterval(async () => {
      try {
        const token = await getToken()
        const r = await apiClient.syncPost('/api/leads/sync-central', {}, { headers: { Authorization: `Bearer ${token}` } })
        const n = r.data?.data?.syncedCount || 0
        if (n > 0) addToast('success', `${n} new lead${n > 1 ? 's' : ''} synced`)
        setLastSyncTime(new Date()); setSyncCountdown(AUTO_SYNC_INTERVAL_MS / 1000)
        await refetch()
      } catch {}
    }, AUTO_SYNC_INTERVAL_MS)
    const cI = setInterval(() => setSyncCountdown(p => p > 0 ? p-1 : 0), 1000)
    return () => { clearInterval(sI); clearInterval(cI) }
  }, [centralConnected, getToken])

  // ── fetch thread on lead select ──
  React.useEffect(() => {
    if (!selectedLead) return
    if (!(selectedLead as any).threadId) { setThreads(p => ({ ...p, [selectedLead._id]: [] })); return }
    ;(async () => {
      try {
        const token = await getToken(); if (!token) return
        const res = await apiClient.get(`/api/leads/${selectedLead._id}/thread`, { headers: { Authorization: `Bearer ${token}` } })
        setThreads(p => ({ ...p, [selectedLead._id]: res.data?.data?.messages || [] }))
      } catch { setThreads(p => ({ ...p, [selectedLead._id]: [] })) }
    })()
  }, [selectedLead, getToken])

  // ── scroll messages to bottom ──
  React.useEffect(() => {
    if (msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight
  }, [threads, selectedLead])

  // ── reset page on filter change ──
  React.useEffect(() => { setCurrentPage(1) }, [statusFilter, searchQuery])

  const addToast = (type: Toast['type'], msg: string) => {
    if (toasts.some(t => t.message === msg)) return
    const id = Math.random().toString(36)
    setToasts(p => [...p, { id, type, message: msg, ts: new Date() }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 5000)
  }

  const handleStatus = (status: string) => {
    if (!selectedLead) return
    updateLeadStatus({ id: selectedLead._id, status })
    setSelectedLead(p => p ? { ...p, status: status as any } : null)
    addToast('success', `Marked as ${status}`)
  }

  const handleSend = async () => {
    if (!selectedLead || !replyMessage.trim()) return
    setIsSending(true)
    try {
      const token = await getToken(); if (!token) { addToast('error', 'Auth required'); return }
      await apiClient.post(`/api/leads/${selectedLead._id}/reply`, { message: replyMessage }, { headers: { Authorization: `Bearer ${token}` } })
      setReplyMessage('')
      addToast('success', 'Reply sent')
      updateLeadStatus({ id: selectedLead._id, status: 'Contacted' })
      setSelectedLead(p => p ? { ...p, status: 'Contacted' } : null)
      setTimeout(async () => {
        try {
          const t = await getToken(); if (!t) return
          const res = await apiClient.get(`/api/leads/${selectedLead._id}/thread`, { headers: { Authorization: `Bearer ${t}` } })
          setThreads(p => ({ ...p, [selectedLead._id]: res.data?.data?.messages || [] }))
        } catch {}
      }, 1200)
      await refetch()
    } catch { addToast('error', 'Failed to send') }
    finally { setIsSending(false) }
  }

  const handleSync = async () => {
    try {
      setIsSyncing(true); addToast('info', 'Syncing…')
      const token = await getToken()
      const r = await apiClient.syncPost('/api/leads/sync-central', {}, { headers: { Authorization: `Bearer ${token}` } })
      const n = r.data?.data?.syncedCount || 0
      setLastSyncTime(new Date()); setSyncCountdown(AUTO_SYNC_INTERVAL_MS / 1000)
      addToast(n > 0 ? 'success' : 'info', n > 0 ? `${n} lead${n>1?'s':''} imported` : 'Already up to date')
      await refetch()
    } catch (e: any) { addToast('error', e?.response?.data?.message || 'Sync failed') }
    finally { setIsSyncing(false) }
  }

  const handleAppt = async () => {
    if (!selectedLead || !apptForm.date || !apptForm.time) { addToast('error', 'Date & time required'); return }
    try {
      const token = await getToken(); if (!token) { addToast('error', 'Auth required'); return }
      await apiClient.post(`/api/leads/${selectedLead._id}/appointment`, apptForm, { headers: { Authorization: `Bearer ${token}` } })
      updateLeadStatus({ id: selectedLead._id, status: 'Appointment Set' })
      setSelectedLead(p => p ? { ...p, status: 'Appointment Set', appointment: apptForm } : null)
      addToast('success', 'Appointment saved')
      setApptOpen(false); setApptForm({ date:'', time:'', notes:'', locationOrVehicle:'' })
      await refetch()
    } catch { addToast('error', 'Failed to save appointment') }
  }

  // ── Filter / group / paginate ──
  const filtered = React.useMemo(() => {
    let f: Lead[] = leads
    if (statusFilter && statusFilter !== 'Inbound Calls') f = f.filter((l: Lead) => l.status === statusFilter)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      f = f.filter((l: Lead) =>
        l.firstName?.toLowerCase().includes(q) || l.lastName?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) || l.subject?.toLowerCase().includes(q) ||
        (l as any).vehicle?.make?.toLowerCase().includes(q)
      )
    }
    const byCustomer: Record<string, Lead[]> = {}
    f.forEach(l => { const k = l.email?.toLowerCase() || l._id; (byCustomer[k] = byCustomer[k] || []).push(l) })
    return Object.values(byCustomer)
      .map(g => { const s = [...g].sort((a,b) => +new Date(b.createdAt) - +new Date(a.createdAt)); return { ...s[0], _g: s, _n: s.length } })
      .sort((a,b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  }, [leads, statusFilter, searchQuery])

  const totalPages = Math.ceil(filtered.length / LEADS_PER_PAGE)
  const page = React.useMemo(() => filtered.slice((currentPage-1)*LEADS_PER_PAGE, currentPage*LEADS_PER_PAGE), [filtered, currentPage])

  const stats = React.useMemo(() => ({
    total:   leads.length,
    new:     leads.filter((l: Lead) => l.status==='New').length,
    pending: leads.filter((l: Lead) => l.status==='Pending').length,
    contact: leads.filter((l: Lead) => l.status==='Contacted').length,
    appt:    leads.filter((l: Lead) => l.status==='Appointment Set').length,
    closed:  leads.filter((l: Lead) => l.status==='Closed').length,
  }), [leads])

  const activeThreads = selectedLead ? (threads[selectedLead._id] || []) : []
  const vehicle = selectedLead ? (selectedLead as any).vehicle : null

  // ── Tab definitions ──
  const TABS = [
    { key: null,              label: 'All',           count: stats.total },
    { key: 'New',             label: 'New',           count: stats.new },
    { key: 'Pending',         label: 'Pending',       count: stats.pending },
    { key: 'Contacted',       label: 'Contacted',     count: stats.contact },
    { key: 'Appointment Set', label: 'Appt. Set',     count: stats.appt },
    { key: 'Closed',          label: 'Closed',        count: stats.closed },
    { key: 'Inbound Calls',   label: 'Inbound Calls', count: null },
  ] as const

  return (
    <div className="flex flex-col bg-[#000000] text-slate-100" style={{ height: '100vh', minHeight: 860 }}>
      <ToastStack toasts={toasts} dismiss={id => setToasts(p => p.filter(t => t.id !== id))} />

      {/* ═══ TOPBAR ═══ */}
      <div className="px-6 pt-5 pb-0 shrink-0">
        {/* Title row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Inquiries & Leads</h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {centralConnected ? (
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live sync
                  </span>
                  <span className="text-[#2e4a38]">·</span>
                  <span className="text-slate-500">{centralEmail}</span>
                  <span className="text-[#2e4a38]">·</span>
                  <span className="font-mono text-slate-600 text-[10px]">{LEADS_SOURCE_EMAIL}</span>
                  {lastSyncTime && (
                    <>
                      <span className="text-[#2e4a38]">·</span>
                      <span className="text-slate-600">{fmtTime(lastSyncTime)} <span className="text-[#2e4a38]">({syncCountdown}s)</span></span>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-500/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500/60" />
                  Centralized ingestion not configured
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-0.5">
            <button
              onClick={handleSync}
              disabled={!centralConnected || isSyncing}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium border border-[#0d1f15] text-slate-400 hover:text-slate-100 hover:border-emerald-700/50 hover:bg-[#070e09] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing…' : 'Refresh'}
            </button>
            <SupraLeoAI variant="toolbar" />
          </div>
        </div>

        {/* Tab strip */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0 scrollbar-none">
          {TABS.map((tab, i) => {
            const active = statusFilter === (tab.key ?? null)
            return (
              <button
                key={i}
                onClick={() => { setStatusFilter(tab.key ?? null); setSelectedLead(null) }}
                className={`flex items-center gap-1.5 px-3.5 h-9 rounded-t-lg text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                  active
                    ? 'text-emerald-400 border-b-emerald-500 bg-black'
                    : 'text-slate-500 border-b-transparent hover:text-slate-300 hover:bg-[#050905]/60'
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full transition-colors ${
                    active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#1a2e22] text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ═══ BODY ═══ */}
      {statusFilter === 'Inbound Calls' ? (
        <div className="flex-1 overflow-auto p-6 bg-black"><InboundCallsTab /></div>
      ) : (
        <div className="flex flex-1 min-h-0 border-t border-emerald-900/30">

          {/* ══════════════════════════
              LEFT — LEAD LIST
          ══════════════════════════ */}
          <div className={`flex flex-col bg-[#060a07] border-r border-[#0f1f16] shrink-0 w-[320px] xl:w-[360px] ${selectedLead ? 'hidden lg:flex' : 'flex'}`}>

            {/* Search bar */}
            <div className="px-4 py-3 border-b border-[#0f1f16] shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-700 pointer-events-none" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, vehicle…"
                  className="w-full pl-9 pr-3 h-8 rounded-lg bg-black border border-[#0f1f16] text-sm text-slate-300 placeholder:text-slate-700 outline-none focus:border-emerald-600/50 transition-colors"
                />
              </div>
            </div>

            {/* Column header */}
            <div className="flex items-center justify-between px-4 py-2 shrink-0">
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-700">Conversations</span>
              {filtered.length > 0 && (
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                  {filtered.length}
                </span>
              )}
            </div>

            {/* ── SCROLLABLE LIST (independent scroll) ── */}
            <div ref={listRef} className="flex-1 overflow-y-auto min-h-0">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-20">
                  <div className="h-5 w-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                  <p className="text-xs text-slate-700">Loading…</p>
                </div>
              ) : page.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-20 px-6 text-center">
                  <div className="h-14 w-14 rounded-2xl border border-dashed border-[#1e3327] flex items-center justify-center">
                    <Inbox className="h-7 w-7 text-slate-700" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">No leads found</p>
                  <p className="text-[10px] text-slate-700 font-mono">{LEADS_SOURCE_EMAIL}</p>
                </div>
              ) : (
                page.map((lead: any) => {
                  const sel = selectedLead?._id === lead._id
                  const sc  = STATUS[lead.status as keyof typeof STATUS]
                  return (
                    <div
                      key={lead._id}
                      onClick={() => { setSelectedLead(lead); if (!lead.isRead) markAsRead(lead._id); setIsClosed(lead.status === 'Closed') }}
                      className={`relative px-4 py-4 cursor-pointer transition-all group border-l-2 ${sel ? 'border-emerald-500 bg-[#0a1510]' : 'border-transparent hover:bg-[#07100b]'}`}
                    >
                      {/* Top row */}
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar first={lead.firstName} last={lead.lastName} size="md" />
                          {!lead.isRead && (
                            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#060a07]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <p className={`text-sm font-semibold truncate leading-tight ${lead.isRead ? 'text-slate-400' : 'text-slate-100'}`}>
                              {lead.firstName} {lead.lastName}
                            </p>
                            <span className="text-[10px] text-slate-600 shrink-0 tabular-nums">{fmtShort(new Date(lead.createdAt))}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 truncate mb-1">{lead.email}</p>
                          <p className={`text-xs truncate leading-snug ${lead.isRead ? 'text-slate-600' : 'text-slate-300'}`}>
                            {lead.subject || '(No subject)'}
                          </p>
                        </div>
                      </div>
                      {/* Badge row */}
                      <div className="flex items-center gap-1.5 mt-2.5 ml-12">
                        <ChannelBadge channel={lead.channel} />
                        {sc && (
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-semibold ${sc.bg} ${sc.text} ${sc.border}`}>
                            <span className={`h-1 w-1 rounded-full ${sc.dot}`} />{sc.label}
                          </span>
                        )}
                        {lead._n > 1 && (
                          <span className="text-[9px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded-full">
                            +{lead._n - 1}
                          </span>
                        )}
                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                          <SupraLeoReadButton lead={lead} size="sm" />
                        </div>
                      </div>
                      {/* Selected accent glow */}
                      {sel && <div className="absolute inset-y-0 left-0 w-0.5 bg-emerald-400 rounded-r" />}
                    </div>
                  )
                })
              )}
            </div>

            {/* Pagination */}
            <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length}
              onPageChange={p => { setCurrentPage(p); setSelectedLead(null) }} />
          </div>

          {/* ══════════════════════════
              RIGHT — CONVERSATION
          ══════════════════════════ */}
          <div className={`flex-1 flex flex-col min-w-0 min-h-0 bg-black ${!selectedLead ? 'hidden lg:flex' : 'flex'}`}>
            {selectedLead ? (
              <>
                {/* ── Conversation header ── */}
                <div className="flex items-start justify-between gap-4 px-6 py-6 border-b border-emerald-900/40 bg-black shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => setSelectedLead(null)}
                      className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-200 hover:bg-[#0f1f16] transition-colors shrink-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <Avatar first={selectedLead.firstName} last={selectedLead.lastName} size="lg" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-bold text-white truncate">{selectedLead.firstName} {selectedLead.lastName}</h2>
                        <ChannelBadge channel={(selectedLead as any).channel} />
                        <StatusPill status={selectedLead.status} />
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-[11px] text-slate-500">{selectedLead.email}</span>
                        {selectedLead.phone && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Phone className="h-2.5 w-2.5" />{selectedLead.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <SupraLeoReadButton lead={selectedLead} size="md" />
                    <button onClick={() => setSelectedLead(null)} className="p-1.5 rounded-lg text-slate-700 hover:text-slate-300 hover:bg-[#1e3327] transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* ── Subject & meta strip ── */}
                <div className="px-6 py-3.5 border-b border-[#0f1f16]/80 bg-[#030503] shrink-0">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Mail className="h-3 w-3 text-slate-700 shrink-0" />
                      <span className="text-slate-300 font-medium text-[12px]">{selectedLead.subject || '(No subject)'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                      <Clock3 className="h-3 w-3 shrink-0" />
                      {fmtFull(new Date(selectedLead.createdAt))}
                    </div>
                    {vehicle?.make && (
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] bg-black text-emerald-400 border border-emerald-800/60 font-medium">
                        <Car className="h-2.5 w-2.5" />
                        {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-700 ml-auto">via {LEADS_SOURCE_EMAIL}</span>
                  </div>
                  {(selectedLead as any).appointment && (
                    <div className="mt-2 flex items-center gap-2 text-[11px] px-2.5 py-1.5 rounded-lg bg-violet-500/6 border border-violet-500/15 w-fit">
                      <Calendar className="h-3 w-3 text-violet-400 shrink-0" />
                      <span className="text-violet-300 font-medium">
                        {new Date((selectedLead as any).appointment.date).toLocaleDateString()} · {(selectedLead as any).appointment.time}
                        {(selectedLead as any).appointment.location && ` · ${(selectedLead as any).appointment.location}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* ── MESSAGE STREAM — INDEPENDENT SCROLL ── */}
                <div
                  ref={msgRef}
                  className="flex-1 overflow-y-auto min-h-0 px-10 py-10 space-y-10"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: '#0f1f16 transparent', background: 'linear-gradient(180deg, #020402 0%, #050905 100%)' }}
                >
                  {/* Original lead message */}
                  <div className="flex items-start gap-3">
                    <Avatar first={selectedLead.firstName} last={selectedLead.lastName} size="sm" />
                    <div className="flex-1 max-w-2xl">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-[14px] font-bold text-white">{selectedLead.firstName} {selectedLead.lastName}</span>
                        <span className="text-xs text-slate-600">{fmtFull(new Date(selectedLead.createdAt))}</span>
                      </div>
                      <div className="rounded-2xl rounded-tl-sm border border-emerald-900/30 bg-black px-7 py-6 shadow-2xl shadow-black/80 ring-1 ring-inset ring-white/[0.03]">
                        <ParsedContent content={(selectedLead as any).parsedContent} rawBody={selectedLead.body} />
                      </div>
                    </div>
                  </div>

                  {/* Thread separator */}
                  {activeThreads.length > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-[#0f1f16]" />
                      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-900">{activeThreads.length} repl{activeThreads.length === 1 ? 'y' : 'ies'}</span>
                      <div className="h-px flex-1 bg-[#1e3327]" />
                    </div>
                  )}

                  {/* Replies */}
                  {activeThreads.map((msg: any) => (
                    <div key={msg.id} className={`flex items-start gap-4 ${msg.isOwn ? 'flex-row-reverse' : ''}`}>
                      {msg.isOwn ? (
                        <div className="h-8 w-8 rounded-full bg-emerald-700 border border-emerald-600/50 flex items-center justify-center text-emerald-200 text-[9px] font-bold shrink-0">YOU</div>
                      ) : (
                        <Avatar first={msg.sender?.split(' ')[0]} size="sm" />
                      )}
                      <div className={`max-w-2xl ${msg.isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className={`flex items-baseline gap-2 mb-1.5 ${msg.isOwn ? 'flex-row-reverse' : ''}`}>
                          <span className="text-xs font-semibold text-slate-300">{msg.isOwn ? 'You' : msg.sender}</span>
                          <span className="text-[10px] text-slate-600">{fmtFull(new Date(msg.timestamp))}</span>
                        </div>
                        <div className={`px-6 py-5 text-[15px] leading-relaxed shadow-xl shadow-black/60 ${
                          msg.isOwn
                            ? 'rounded-2xl rounded-tr-sm bg-emerald-700 text-emerald-50 border border-emerald-600/40'
                            : 'rounded-2xl rounded-tl-sm bg-black text-slate-100 border border-emerald-900/25 ring-1 ring-inset ring-white/[0.02]'
                        }`}>
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="h-1" />
                </div>

                {/* ── REPLY BAR ── */}
                {!isClosed ? (
                  <div className="border-t border-emerald-900/40 bg-black px-5 py-4 shrink-0">
                    <div className="rounded-xl border border-[#0d1f15] bg-[#070e09] overflow-hidden focus-within:border-emerald-600/60 focus-within:ring-1 focus-within:ring-emerald-900/40 transition-all">
                      <textarea
                        value={replyMessage}
                        onChange={e => setReplyMessage(e.target.value)}
                        placeholder="Write a reply…"
                        rows={5}
                        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSend() } }}
                        className="w-full px-4 pt-4 pb-2 bg-transparent text-[14px] text-slate-100 placeholder:text-slate-700 resize-none outline-none leading-relaxed"
                      />
                      {/* Toolbar */}
                      <div className="flex items-center justify-between px-3 py-2.5 border-t border-[#0d1f15]">
                        <div className="flex items-center gap-0.5">
                          {/* Status */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="flex items-center gap-1 px-2.5 h-7 rounded-lg text-[11px] font-medium text-slate-600 hover:text-slate-200 hover:bg-[#0d1f15] transition-all">
                                <Circle className="h-3 w-3" /> Status <ChevronDown className="h-2.5 w-2.5 opacity-50" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#050a06] border border-[#0d1f15] rounded-xl shadow-2xl shadow-black/80 p-1">
                              {Object.entries(STATUS)
                                .filter(([s]) => s !== selectedLead.status && s !== 'Inbound Calls')
                                .map(([s, c]) => (
                                  <DropdownMenuItem key={s} onClick={() => handleStatus(s)}
                                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-100 rounded-lg cursor-pointer focus:bg-[#0d1f15] focus:text-slate-100 px-2 py-1.5">
                                    <span className={`h-2 w-2 rounded-full ${c.dot} shrink-0`} />{c.label}
                                  </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          {/* Schedule */}
                          <button onClick={() => setApptOpen(true)}
                            className="flex items-center gap-1 px-2.5 h-7 rounded-lg text-[11px] font-medium text-slate-600 hover:text-slate-200 hover:bg-[#0d1f15] transition-all">
                            <Calendar className="h-3 w-3" /> Schedule
                          </button>
                          {/* Close lead */}
                          <button onClick={() => { handleStatus('Closed'); setIsClosed(true) }}
                            className="flex items-center gap-1 px-2.5 h-7 rounded-lg text-[11px] font-medium text-rose-700/70 hover:text-rose-400 hover:bg-rose-500/5 transition-all">
                            <XCircle className="h-3 w-3" /> Close
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-700 hidden sm:block">⌘↵</span>
                          <button
                            onClick={handleSend}
                            disabled={isSending || !replyMessage.trim()}
                            className="flex items-center gap-1.5 px-4 h-8 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-black/30"
                          >
                            <Send className="h-3.5 w-3.5" />
                            {isSending ? 'Sending…' : 'Send Reply'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-emerald-900/40 px-5 py-3.5 flex items-center justify-between bg-black shrink-0">
                    <div className="flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5 text-slate-700" />
                      <span className="text-xs text-slate-600">This inquiry is closed</span>
                    </div>
                    <button
                      onClick={() => { handleStatus('Pending'); setIsClosed(false) }}
                      className="flex items-center gap-1.5 px-3 h-7 rounded-lg text-xs text-slate-500 hover:text-slate-200 border border-[#0d1f15] hover:border-emerald-800/50 hover:bg-[#070e09] transition-all"
                    >
                      <LockOpen className="h-3 w-3" /> Reopen
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
                <div className="h-20 w-20 rounded-3xl border border-dashed border-[#0d1f15] flex items-center justify-center">
                  <Inbox className="h-8 w-8 text-[#0d1f15]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Select a conversation</p>
                  <p className="text-[11px] text-slate-700 mt-1 font-mono">{LEADS_SOURCE_EMAIL}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ APPOINTMENT DIALOG ═══ */}
      <Dialog open={apptOpen} onOpenChange={setApptOpen}>
        <DialogContent className="max-w-sm rounded-2xl bg-[#060a07] border border-[#0d1f15] text-slate-100 shadow-2xl shadow-black/70">
          <DialogHeader>
            <DialogTitle className="text-slate-100 text-base font-semibold">Schedule Appointment</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              {selectedLead?.firstName} {selectedLead?.lastName}
              {selectedLead?.phone && <span className="ml-2 font-mono">{selectedLead.phone}</span>}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            {[
              { label:'Date *',              key:'date',              type:'date' },
              { label:'Time *',              key:'time',              type:'time' },
              { label:'Location / Vehicle',  key:'locationOrVehicle', type:'text', placeholder:'e.g. Showroom, Test Drive…' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-700 block mb-1">{f.label}</label>
                <input
                  type={f.type}
                  placeholder={(f as any).placeholder || ''}
                  value={apptForm[f.key as keyof typeof apptForm]}
                  onChange={e => setApptForm({ ...apptForm, [f.key]: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg bg-[#0e1a14] border border-[#1e3327] text-sm text-slate-200 placeholder:text-slate-700 outline-none focus:border-emerald-700/60 transition-colors"
                />
              </div>
            ))}
            <div>
              <label className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-700 block mb-1">Notes</label>
              <textarea
                placeholder="Additional details…"
                value={apptForm.notes}
                onChange={e => setApptForm({ ...apptForm, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-[#0e1a14] border border-[#1e3327] text-sm text-slate-200 placeholder:text-slate-700 outline-none focus:border-emerald-700/60 transition-colors resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-1">
            <button
              onClick={() => { setApptOpen(false); setApptForm({ date:'', time:'', notes:'', locationOrVehicle:'' }) }}
              className="px-4 h-8 rounded-lg text-xs text-slate-500 border border-[#1e3327] hover:text-slate-200 hover:bg-[#162a1f] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAppt}
              disabled={!apptForm.date || !apptForm.time}
              className="px-4 h-8 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Save & Schedule
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}