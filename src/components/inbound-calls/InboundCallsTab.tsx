"use client"

import * as React from "react"
import {
  CheckCircle2,
  AlertCircle,
  Info,
  X,
} from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { apiClient } from "@/lib/api-client"
import { AgentControlPanel } from "./AgentControlPanel"
import { LiveCallPanel } from "./LiveCallPanel"
import { CustomerInfoPanel } from "./CustomerInfoPanel"
import { CallQueue } from "./CallQueue"
import {
  AgentInfo,
  AgentStatus,
  BreakReason,
  InboundCall,
  QueuedCall,
  CallLogEntry,
  CustomerRecord,
} from "./types"

// ─── Toast (reused from LeadsTab pattern) ─────────────────────────────────────

interface Toast {
  id: string
  type: "success" | "error" | "info"
  message: string
  ts: Date
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function ToastStack({
  toasts,
  dismiss,
}: {
  toasts: Toast[]
  dismiss: (id: string) => void
}) {
  const icons = {
    success: <CheckCircle2 className="h-4 w-4 shrink-0" />,
    error: <AlertCircle className="h-4 w-4 shrink-0" />,
    info: <Info className="h-4 w-4 shrink-0" />,
  }
  const colors = {
    success: "bg-emerald-600/95 border-emerald-500",
    error: "bg-rose-600/95 border-rose-500",
    info: "bg-blue-600/95 border-blue-500",
  }
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-xs pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-white border animate-in slide-in-from-top-2 ${colors[t.type]}`}
        >
          {icons[t.type]}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug">{t.message}</p>
            <p className="text-[10px] opacity-60 mt-0.5">{fmtTime(t.ts)}</p>
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="hover:opacity-70 transition-opacity"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function InboundCallsTab() {
  const { getToken } = useAuth()

  // ── State ──────────────────────────────────────────────────────────────────

  const [toasts, setToasts] = React.useState<Toast[]>([])

  const [agent, setAgent] = React.useState<AgentInfo>({
    name: "Agent",
    employeeId: "—",
    status: "offline",
  })

  const [activeCall, setActiveCall] = React.useState<InboundCall | null>(null)
  const [customer, setCustomer] = React.useState<CustomerRecord | null>(null)
  const [isLoadingCustomer, setIsLoadingCustomer] = React.useState(false)
  const [queue, setQueue] = React.useState<QueuedCall[]>([])
  const [logs, setLogs] = React.useState<CallLogEntry[]>([])

  // ── Init: fetch agent info ─────────────────────────────────────────────────

  React.useEffect(() => {
    const loadAgent = async () => {
      try {
        const token = await getToken()
        if (!token) return
        const res = await apiClient.get("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const user = res.data
        setAgent((p) => ({
          ...p,
          name:
            [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
            user?.email ||
            "Agent",
          employeeId: user?.id?.slice(-6)?.toUpperCase() || "—",
        }))
      } catch {}
    }
    loadAgent()
  }, [getToken])

  // ── Polling: queue + logs when live ────────────────────────────────────────

  React.useEffect(() => {
    if (agent.status === "offline") return

    const poll = async () => {
      try {
        const token = await getToken()
        if (!token) return

        // Fetch queue
        const qRes = await apiClient.get("/api/calls/queue", {
          headers: { Authorization: `Bearer ${token}` },
        })
        setQueue(qRes.data?.data || [])

        // Fetch logs
        const lRes = await apiClient.get("/api/calls/logs", {
          headers: { Authorization: `Bearer ${token}` },
        })
        setLogs(lRes.data?.data || [])
      } catch {}
    }

    poll()
    const iv = setInterval(poll, 10000)
    return () => clearInterval(iv)
  }, [agent.status, getToken])

  // ── Polling: check for incoming call when available ────────────────────────

  React.useEffect(() => {
    if (agent.status !== "available") return

    const poll = async () => {
      try {
        const token = await getToken()
        if (!token) return
        const res = await apiClient.get("/api/calls/incoming", {
          headers: { Authorization: `Bearer ${token}` },
        })
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
        }
      } catch {}
    }

    poll()
    const iv = setInterval(poll, 5000)
    return () => clearInterval(iv)
  }, [agent.status, activeCall, getToken])

  // ── Fetch customer when call connects ──────────────────────────────────────

  React.useEffect(() => {
    if (!activeCall || activeCall.status !== "connected") {
      setCustomer(null)
      return
    }

    const lookup = async () => {
      setIsLoadingCustomer(true)
      try {
        const token = await getToken()
        if (!token) return
        const res = await apiClient.get(
          `/api/calls/customer-lookup?phone=${encodeURIComponent(activeCall.callerNumber)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setCustomer(res.data?.data || null)
      } catch {
        setCustomer(null)
      } finally {
        setIsLoadingCustomer(false)
      }
    }

    lookup()
  }, [activeCall?.status, activeCall?.callerNumber, getToken])

  // ── Toast helper ───────────────────────────────────────────────────────────

  const addToast = (type: Toast["type"], message: string) => {
    if (toasts.some((t) => t.message === message && t.type === type)) return
    const id = Math.random().toString()
    setToasts((p) => [...p, { id, type, message, ts: new Date() }])
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 5000)
  }

  // ── Agent actions ──────────────────────────────────────────────────────────

  const goLive = async () => {
    try {
      const token = await getToken()
      if (token) {
        await apiClient.post(
          "/api/calls/agent-status",
          { status: "available" },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }
    } catch {}
    setAgent((p) => ({
      ...p,
      status: "available",
      liveAt: new Date().toISOString(),
      breakReason: undefined,
    }))
    addToast("success", "You are now receiving calls")
  }

  const goOffline = async () => {
    try {
      const token = await getToken()
      if (token) {
        await apiClient.post(
          "/api/calls/agent-status",
          { status: "offline" },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }
    } catch {}
    setAgent((p) => ({
      ...p,
      status: "offline",
      liveAt: undefined,
      breakReason: undefined,
    }))
    setActiveCall(null)
    setCustomer(null)
    addToast("info", "Call routing stopped")
  }

  const takeBreak = async (reason: BreakReason) => {
    try {
      const token = await getToken()
      if (token) {
        await apiClient.post(
          "/api/calls/agent-status",
          { status: "break", reason },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }
    } catch {}
    setAgent((p) => ({ ...p, status: "break", breakReason: reason }))
    addToast("info", `On break — ${reason}`)
  }

  const resumeFromBreak = async () => {
    try {
      const token = await getToken()
      if (token) {
        await apiClient.post(
          "/api/calls/agent-status",
          { status: "available" },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }
    } catch {}
    setAgent((p) => ({ ...p, status: "available", breakReason: undefined }))
    addToast("success", "Back online — receiving calls")
  }

  // ── Call actions ───────────────────────────────────────────────────────────

  const answerCall = async () => {
    if (!activeCall) return
    try {
      const token = await getToken()
      if (token) {
        await apiClient.post(
          `/api/calls/${activeCall.id}/answer`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }
    } catch {}
    setActiveCall((p) =>
      p
        ? { ...p, status: "connected", answeredAt: new Date().toISOString() }
        : null
    )
    setAgent((p) => ({ ...p, status: "on-call" }))
    addToast("success", "Call connected")
  }

  const endCall = async () => {
    if (!activeCall) return
    try {
      const token = await getToken()
      if (token) {
        await apiClient.post(
          `/api/calls/${activeCall.id}/end`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }
    } catch {}
    setActiveCall(null)
    setCustomer(null)
    setAgent((p) => ({ ...p, status: "available" }))
    addToast("info", "Call ended")
  }

  const toggleMute = () => {
    setActiveCall((p) => (p ? { ...p, isMuted: !p.isMuted } : null))
  }

  const toggleHold = async () => {
    if (!activeCall) return
    const newStatus = activeCall.status === "on-hold" ? "connected" : "on-hold"
    try {
      const token = await getToken()
      if (token) {
        await apiClient.post(
          `/api/calls/${activeCall.id}/hold`,
          { hold: newStatus === "on-hold" },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }
    } catch {}
    setActiveCall((p) => (p ? { ...p, status: newStatus } : null))
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

  const handleTransfer = () => {
    addToast("info", "Transfer dialog — coming soon")
  }

  const handleConference = () => {
    addToast("info", "Conference dialog — coming soon")
  }

  const pickupQueued = async (queuedId: string) => {
    const q = queue.find((c) => c.id === queuedId)
    if (!q) return
    try {
      const token = await getToken()
      if (token) {
        await apiClient.post(
          `/api/calls/queue/${queuedId}/pickup`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }
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
    addToast("success", `Connected to ${q.callerName || q.callerNumber}`)
  }

  const handleSaveNotes = async (notes: string) => {
    if (!activeCall) return
    try {
      const token = await getToken()
      if (token) {
        await apiClient.post(
          `/api/calls/${activeCall.id}/notes`,
          { notes },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }
      addToast("success", "Notes saved")
    } catch {
      addToast("error", "Failed to save notes")
    }
  }

  const handleCreateLead = async (data: {
    name: string
    phone: string
    email?: string
  }) => {
    try {
      const token = await getToken()
      if (token) {
        await apiClient.post("/api/leads", data, {
          headers: { Authorization: `Bearer ${token}` },
        })
      }
      addToast("success", `Lead created for ${data.name}`)
    } catch {
      addToast("error", "Failed to create lead")
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">
      <ToastStack
        toasts={toasts}
        dismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))}
      />

      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Inbound Calls</h2>
          <p className="text-[11px] text-muted-foreground/50 mt-0.5">
            Real-time call center · {agent.status === "offline" ? "Offline" : "Active session"}
          </p>
        </div>
      </div>

      {/* Three-panel workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_280px] gap-4 min-h-[520px]">
        {/* Left: Agent control */}
        <AgentControlPanel
          agent={agent}
          onGoLive={goLive}
          onGoOffline={goOffline}
          onBreak={takeBreak}
          onResumeFromBreak={resumeFromBreak}
        />

        {/* Center: Live call */}
        <LiveCallPanel
          call={agent.status === "offline" ? null : activeCall}
          onAnswer={answerCall}
          onEnd={endCall}
          onMuteToggle={toggleMute}
          onHoldToggle={toggleHold}
          onTransfer={handleTransfer}
          onConference={handleConference}
          onRecordToggle={toggleRecord}
        />

        {/* Right: Customer info */}
        <CustomerInfoPanel
          call={agent.status === "offline" ? null : activeCall}
          customer={customer}
          isLoadingCustomer={isLoadingCustomer}
          onSaveNotes={handleSaveNotes}
          onCreateLead={handleCreateLead}
        />
      </div>

      {/* Bottom: Queue & logs */}
      <CallQueue
        queue={queue}
        logs={logs}
        onPickupQueued={pickupQueued}
      />
    </div>
  )
}