"use client"

import * as React from "react"
import { CheckCircle2, AlertCircle, Info, X, Phone, PhoneOutgoing } from "lucide-react"
import { useAuth } from "@/providers/AuthProvider"
import { apiClient } from "@/lib/api-client"
import { AgentControlPanel } from "./AgentControlPanel"
import { LiveCallPanel } from "./LiveCallPanel"
import { OutboundCallPanel } from "./OutboundCallPanel"
import { CustomerInfoPanel } from "./CustomerInfoPanel"
import { CallQueue } from "./CallQueue"
import {
  AgentInfo,
  BreakReason,
  InboundCall,
  OutboundCall,
  QueuedCall,
  CallLogEntry,
  CustomerRecord,
  RecentContact,
} from "./types"

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast {
  id: string
  type: "success" | "error" | "info"
  message: string
  ts: Date
}

function ToastStack({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  const icons = {
    success: <CheckCircle2 className="h-4 w-4 shrink-0" />,
    error: <AlertCircle className="h-4 w-4 shrink-0" />,
    info: <Info className="h-4 w-4 shrink-0" />,
  }
  const styles = {
    success: "bg-emerald-600/95 border-emerald-500/50",
    error: "bg-red-600/95 border-red-500/50",
    info: "bg-zinc-800 border-zinc-700",
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-xs pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border text-white text-sm shadow-xl backdrop-blur animate-in slide-in-from-top-2 ${styles[t.type]}`}
        >
          {icons[t.type]}
          <p className="flex-1 font-medium text-xs">{t.message}</p>
          <button onClick={() => dismiss(t.id)} className="opacity-50 hover:opacity-100 transition-opacity">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type CallMode = "inbound" | "outbound"

export function InboundCallsTab() {
  const { getToken } = useAuth()

  const [toasts, setToasts] = React.useState<Toast[]>([])
  const [callMode, setCallMode] = React.useState<CallMode>("inbound")
  const [todayCalls, setTodayCalls] = React.useState(0)
  const [avgHandle, setAvgHandle] = React.useState("—")

  const [agent, setAgent] = React.useState<AgentInfo>({
    name: "Agent",
    employeeId: "—",
    status: "offline",
  })

  const [activeCall, setActiveCall] = React.useState<InboundCall | null>(null)
  const [outboundCall, setOutboundCall] = React.useState<OutboundCall | null>(null)
  const [customer, setCustomer] = React.useState<CustomerRecord | null>(null)
  const [isLoadingCustomer, setIsLoadingCustomer] = React.useState(false)
  const [queue, setQueue] = React.useState<QueuedCall[]>([])
  const [logs, setLogs] = React.useState<CallLogEntry[]>([])
  const [recentContacts, setRecentContacts] = React.useState<RecentContact[]>([])

  // ── Init ──────────────────────────────────────────────────────────────────

  React.useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken()
        if (!token) return
        const res = await apiClient.get("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        const user = res.data
        setAgent((p) => ({
          ...p,
          name: [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Agent",
          employeeId: user?.id?.slice(-6)?.toUpperCase() || "—",
        }))
      } catch {}
    }
    load()
  }, [getToken])

  // ── Polling ───────────────────────────────────────────────────────────────

  React.useEffect(() => {
    if (agent.status === "offline") return
    const poll = async () => {
      try {
        const token = await getToken()
        if (!token) return
        const [qRes, lRes] = await Promise.all([
          apiClient.get("/api/calls/queue", { headers: { Authorization: `Bearer ${token}` } }),
          apiClient.get("/api/calls/logs", { headers: { Authorization: `Bearer ${token}` } }),
        ])
        setQueue(qRes.data?.data || [])
        const fetchedLogs: CallLogEntry[] = lRes.data?.data || []
        setLogs(fetchedLogs)

        // Compute stats
        const answered = fetchedLogs.filter((l) => l.status === "answered")
        setTodayCalls(answered.length)
        if (answered.length > 0) {
          const avg = Math.round(answered.reduce((s, l) => s + l.duration, 0) / answered.length)
          const m = Math.floor(avg / 60), s = avg % 60
          setAvgHandle(`${m}m ${String(s).padStart(2, "0")}s`)
        }

        // Recent contacts from outbound logs
        const outboundLogs = fetchedLogs.filter((l) => l.direction === "outbound" && l.callerName)
        const seen = new Set<string>()
        const contacts: RecentContact[] = []
        for (const log of outboundLogs) {
          if (!seen.has(log.callerNumber)) {
            seen.add(log.callerNumber)
            contacts.push({ name: log.callerName || log.callerNumber, number: log.callerNumber, lastCalled: log.startedAt })
          }
          if (contacts.length >= 5) break
        }
        setRecentContacts(contacts)
      } catch {}
    }
    poll()
    const iv = setInterval(poll, 10000)
    return () => clearInterval(iv)
  }, [agent.status, getToken])

  // ── Poll for incoming calls ───────────────────────────────────────────────

  React.useEffect(() => {
    if (agent.status !== "available") return
    const poll = async () => {
      try {
        const token = await getToken()
        if (!token) return
        const res = await apiClient.get("/api/calls/incoming", { headers: { Authorization: `Bearer ${token}` } })
        const incoming = res.data?.data
        if (incoming && !activeCall) {
          setActiveCall({
            id: incoming.id,
            callerNumber: incoming.callerNumber,
            callerName: incoming.callerName,
            status: "ringing",
            startedAt: incoming.startedAt || new Date().toISOString(),
            isRecording: false,
            isMuted: false,
          })
          setCallMode("inbound")
        }
      } catch {}
    }
    poll()
    const iv = setInterval(poll, 5000)
    return () => clearInterval(iv)
  }, [agent.status, activeCall, getToken])

  // ── Customer lookup ───────────────────────────────────────────────────────

  React.useEffect(() => {
    const callForLookup = activeCall?.status === "connected" ? activeCall
      : outboundCall?.status === "connected" ? outboundCall : null
    if (!callForLookup) { setCustomer(null); return }

    const phone = "callerNumber" in callForLookup ? callForLookup.callerNumber : callForLookup.dialedNumber

    const lookup = async () => {
      setIsLoadingCustomer(true)
      try {
        const token = await getToken()
        if (!token) return
        const res = await apiClient.get(`/api/calls/customer-lookup?phone=${encodeURIComponent(phone)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setCustomer(res.data?.data || null)
      } catch {
        setCustomer(null)
      } finally {
        setIsLoadingCustomer(false)
      }
    }
    lookup()
  }, [activeCall?.status, outboundCall?.status, getToken])

  // ── Toast ─────────────────────────────────────────────────────────────────

  const addToast = (type: Toast["type"], message: string) => {
    if (toasts.some((t) => t.message === message)) return
    const id = Math.random().toString(36).slice(2)
    setToasts((p) => [...p, { id, type, message, ts: new Date() }])
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000)
  }

  // ── Agent actions ─────────────────────────────────────────────────────────

  const goLive = async () => {
    try {
      const token = await getToken()
      if (token) await apiClient.post("/api/calls/agent-status", { status: "available" }, { headers: { Authorization: `Bearer ${token}` } })
    } catch {}
    setAgent((p) => ({ ...p, status: "available", liveAt: new Date().toISOString(), breakReason: undefined }))
    addToast("success", "You are now receiving calls")
  }

  const goOffline = async () => {
    try {
      const token = await getToken()
      if (token) await apiClient.post("/api/calls/agent-status", { status: "offline" }, { headers: { Authorization: `Bearer ${token}` } })
    } catch {}
    setAgent((p) => ({ ...p, status: "offline", liveAt: undefined, breakReason: undefined }))
    setActiveCall(null)
    setOutboundCall(null)
    setCustomer(null)
    addToast("info", "Call routing stopped")
  }

  const takeBreak = async (reason: BreakReason) => {
    try {
      const token = await getToken()
      if (token) await apiClient.post("/api/calls/agent-status", { status: "break", reason }, { headers: { Authorization: `Bearer ${token}` } })
    } catch {}
    setAgent((p) => ({ ...p, status: "break", breakReason: reason }))
    addToast("info", `On break`)
  }

  const resumeFromBreak = async () => {
    try {
      const token = await getToken()
      if (token) await apiClient.post("/api/calls/agent-status", { status: "available" }, { headers: { Authorization: `Bearer ${token}` } })
    } catch {}
    setAgent((p) => ({ ...p, status: "available", breakReason: undefined }))
    addToast("success", "Back online")
  }

  // ── Inbound call actions ──────────────────────────────────────────────────

  const answerCall = async () => {
    if (!activeCall) return
    try {
      const token = await getToken()
      if (token) await apiClient.post(`/api/calls/${activeCall.id}/answer`, {}, { headers: { Authorization: `Bearer ${token}` } })
    } catch {}
    setActiveCall((p) => p ? { ...p, status: "connected", answeredAt: new Date().toISOString() } : null)
    setAgent((p) => ({ ...p, status: "on-call" }))
    addToast("success", "Call connected")
  }

  const endCall = async () => {
    if (!activeCall) return
    try {
      const token = await getToken()
      if (token) await apiClient.post(`/api/calls/${activeCall.id}/end`, {}, { headers: { Authorization: `Bearer ${token}` } })
    } catch {}
    setActiveCall(null)
    setCustomer(null)
    setAgent((p) => ({ ...p, status: "available" }))
    addToast("info", "Call ended")
  }

  const toggleMute = () => setActiveCall((p) => p ? { ...p, isMuted: !p.isMuted } : null)

  const toggleHold = async () => {
    if (!activeCall) return
    const newStatus = activeCall.status === "on-hold" ? "connected" : "on-hold"
    try {
      const token = await getToken()
      if (token) await apiClient.post(`/api/calls/${activeCall.id}/hold`, { hold: newStatus === "on-hold" }, { headers: { Authorization: `Bearer ${token}` } })
    } catch {}
    setActiveCall((p) => p ? { ...p, status: newStatus } : null)
    addToast("info", newStatus === "on-hold" ? "Caller on hold" : "Call resumed")
  }

  const toggleRecord = () => {
    setActiveCall((p) => {
      if (!p) return null
      const next = !p.isRecording
      addToast("info", next ? "Recording started" : "Recording stopped")
      return { ...p, isRecording: next }
    })
  }

  const pickupQueued = async (queuedId: string) => {
    const q = queue.find((c) => c.id === queuedId)
    if (!q) return
    try {
      const token = await getToken()
      if (token) await apiClient.post(`/api/calls/queue/${queuedId}/pickup`, {}, { headers: { Authorization: `Bearer ${token}` } })
    } catch {}
    setQueue((p) => p.filter((c) => c.id !== queuedId))
    setActiveCall({
      id: queuedId,
      callerNumber: q.callerNumber,
      callerName: q.callerName,
      status: "connected",
      startedAt: q.waitingSince,
      answeredAt: new Date().toISOString(),
      isRecording: false,
      isMuted: false,
    })
    setAgent((p) => ({ ...p, status: "on-call" }))
    setCallMode("inbound")
    addToast("success", `Connected to ${q.callerName || q.callerNumber}`)
  }

  // ── Outbound call actions ─────────────────────────────────────────────────

  const dialOutbound = async (number: string, name?: string) => {
    if (!number) return
    const callId = Math.random().toString(36).slice(2)
    const call: OutboundCall = {
      id: callId,
      dialedNumber: number,
      contactName: name,
      status: "dialing",
      startedAt: new Date().toISOString(),
      isRecording: false,
      isMuted: false,
    }

    try {
      const token = await getToken()
      if (token) {
        const res = await apiClient.post("/api/calls/outbound", { number, name }, { headers: { Authorization: `Bearer ${token}` } })
        call.id = res.data?.data?.id || callId
      }
    } catch {}

    setOutboundCall(call)
    setAgent((p) => ({ ...p, status: "on-call" }))
    addToast("info", `Dialing ${name || number}...`)

    // Simulate ring→connect (remove in production)
    setTimeout(() => {
      setOutboundCall((p) => p ? { ...p, status: "ringing" } : null)
      setTimeout(() => {
        setOutboundCall((p) => p ? { ...p, status: "connected", answeredAt: new Date().toISOString() } : null)
        addToast("success", `Connected to ${name || number}`)
      }, 2500)
    }, 1500)
  }

  const endOutboundCall = async () => {
    if (!outboundCall) return
    try {
      const token = await getToken()
      if (token) await apiClient.post(`/api/calls/${outboundCall.id}/end`, {}, { headers: { Authorization: `Bearer ${token}` } })
    } catch {}
    setOutboundCall(null)
    setCustomer(null)
    setAgent((p) => ({ ...p, status: "available" }))
    addToast("info", "Call ended")
  }

  const toggleOutboundMute = () => setOutboundCall((p) => p ? { ...p, isMuted: !p.isMuted } : null)
  const toggleOutboundHold = () => {
    setOutboundCall((p) => {
      if (!p) return null
      const next = p.status === "on-hold" ? "connected" : "on-hold"
      addToast("info", next === "on-hold" ? "Caller on hold" : "Call resumed")
      return { ...p, status: next }
    })
  }
  const toggleOutboundRecord = () => {
    setOutboundCall((p) => {
      if (!p) return null
      const next = !p.isRecording
      addToast("info", next ? "Recording started" : "Recording stopped")
      return { ...p, isRecording: next }
    })
  }

  // ── Shared actions ────────────────────────────────────────────────────────

  const saveNotes = async (notes: string) => {
    const callId = activeCall?.id || outboundCall?.id
    if (!callId) return
    try {
      const token = await getToken()
      if (token) await apiClient.post(`/api/calls/${callId}/notes`, { notes }, { headers: { Authorization: `Bearer ${token}` } })
      addToast("success", "Notes saved")
    } catch {
      addToast("error", "Failed to save notes")
    }
  }

  const createLead = async (data: { name: string; phone: string; email?: string }) => {
    try {
      const token = await getToken()
      if (token) await apiClient.post("/api/leads", data, { headers: { Authorization: `Bearer ${token}` } })
      addToast("success", `Lead created for ${data.name}`)
    } catch {
      addToast("error", "Failed to create lead")
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const activeInboundCall = agent.status !== "offline" ? activeCall : null
  const activeOutboundCall = agent.status !== "offline" ? outboundCall : null

  const currentCall = callMode === "inbound" ? activeInboundCall : activeOutboundCall
  const callerNumber = activeCall?.callerNumber || outboundCall?.dialedNumber

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">
      <ToastStack toasts={toasts} dismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">Call Center</h2>
          <p className="text-[11px] text-zinc-600 mt-0.5">
            {agent.status === "offline" ? "Agent offline" : `Active session · ${agent.status}`}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800 self-start sm:self-auto">
          <button
            onClick={() => setCallMode("inbound")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              callMode === "inbound"
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            <Phone className="h-3.5 w-3.5" />
            Inbound
            {activeInboundCall && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setCallMode("outbound")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              callMode === "outbound"
                ? "bg-violet-500/10 border border-violet-500/20 text-violet-400"
                : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            <PhoneOutgoing className="h-3.5 w-3.5" />
            Outbound
            {activeOutboundCall && (
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* 3-panel workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_260px] gap-4 min-h-[520px]">
        {/* Left: Agent */}
        <AgentControlPanel
          agent={agent}
          onGoLive={goLive}
          onGoOffline={goOffline}
          onBreak={takeBreak}
          onResumeFromBreak={resumeFromBreak}
          todayCalls={todayCalls}
          avgHandle={avgHandle}
        />

        {/* Center: Call panel (switches based on mode) */}
        {callMode === "inbound" ? (
          <LiveCallPanel
            call={activeInboundCall}
            agentStatus={agent.status}
            onAnswer={answerCall}
            onEnd={endCall}
            onMuteToggle={toggleMute}
            onHoldToggle={toggleHold}
            onTransfer={() => addToast("info", "Transfer — coming soon")}
            onConference={() => addToast("info", "Conference — coming soon")}
            onRecordToggle={toggleRecord}
          />
        ) : (
          <OutboundCallPanel
            activeCall={activeOutboundCall}
            recentContacts={recentContacts}
            onDial={dialOutbound}
            onEnd={endOutboundCall}
            onMuteToggle={toggleOutboundMute}
            onHoldToggle={toggleOutboundHold}
            onRecordToggle={toggleOutboundRecord}
          />
        )}

        {/* Right: Customer info */}
        <CustomerInfoPanel
          call={currentCall}
          callerNumber={callerNumber}
          customer={customer}
          isLoadingCustomer={isLoadingCustomer}
          onSaveNotes={saveNotes}
          onCreateLead={createLead}
        />
      </div>

      {/* Bottom: Queue + logs */}
      <CallQueue queue={queue} logs={logs} onPickupQueued={pickupQueued} />
    </div>
  )
}