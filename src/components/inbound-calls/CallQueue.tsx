"use client"

import * as React from "react"
import {
  Phone,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  Voicemail,
  Clock,
  Users,
  Star,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react"
import { QueuedCall, CallLogEntry } from "./types"

function formatWait(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

function timeAgo(isoStr: string) {
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

interface CallQueueProps {
  queue: QueuedCall[]
  logs: CallLogEntry[]
  onPickupQueued?: (id: string) => void
}

export function CallQueue({ queue, logs, onPickupQueued }: CallQueueProps) {
  const [tab, setTab] = React.useState<"queue" | "logs">("queue")
  const [, tick] = React.useState(0)

  React.useEffect(() => {
    const iv = setInterval(() => tick((p) => p + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  const priorityBadge = (priority: string) => {
    if (priority === "vip") return (
      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/20 text-[8px] font-bold text-amber-400 uppercase tracking-wide">
        <Star className="h-2 w-2 fill-amber-400" /> VIP
      </span>
    )
    if (priority === "high") return (
      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-[8px] font-bold text-red-400 uppercase tracking-wide">
        HIGH
      </span>
    )
    return null
  }

  const logStatusIcon = (status: string, direction: string) => {
    const iconClass = "h-3.5 w-3.5"
    if (status === "missed") return <PhoneMissed className={`${iconClass} text-red-400`} />
    if (status === "voicemail") return <Voicemail className={`${iconClass} text-sky-400`} />
    if (status === "failed" || status === "no-answer") return <PhoneMissed className={`${iconClass} text-red-400`} />
    if (direction === "inbound") return <ArrowDownLeft className={`${iconClass} text-emerald-400`} />
    return <ArrowUpRight className={`${iconClass} text-violet-400`} />
  }

  const logStatusStyle = (status: string) => {
    if (status === "answered") return "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
    if (status === "missed" || status === "failed" || status === "no-answer") return "bg-red-500/10 border-red-500/20 text-red-400"
    if (status === "voicemail") return "bg-sky-400/10 border-sky-400/20 text-sky-400"
    return "bg-zinc-800 border-zinc-700 text-zinc-400"
  }

  const logStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      answered: "Answered",
      missed: "Missed",
      voicemail: "Voicemail",
      "no-answer": "No Answer",
      failed: "Failed",
    }
    return map[status] || status
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center border-b border-zinc-800">
        {[
          { id: "queue" as const, label: "Queue", count: queue.length, icon: <Users className="h-3 w-3" /> },
          { id: "logs" as const, label: "Recent Calls", count: logs.length, icon: <Clock className="h-3 w-3" /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold transition-all relative ${
              tab === t.id ? "text-zinc-100" : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            {t.icon}
            {t.label}
            <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${
              tab === t.id
                ? t.id === "queue" && queue.length > 0
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : "bg-zinc-800 border-zinc-700 text-zinc-400"
                : "bg-zinc-800/50 border-zinc-800 text-zinc-700"
            }`}>
              {t.count}
            </span>
            {tab === t.id && (
              <span className="absolute bottom-0 left-0 right-0 h-px bg-violet-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-h-64 overflow-y-auto">
        {tab === "queue" ? (
          queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Users className="h-8 w-8 text-zinc-800" />
              <p className="text-xs text-zinc-700">Queue is empty</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {queue.map((q, idx) => {
                const wait = Math.floor((Date.now() - new Date(q.waitingSince).getTime()) / 1000)
                return (
                  <div key={q.id} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/40 transition-colors">
                    <span className="text-xs font-bold text-zinc-700 w-5 text-center tabular-nums">{idx + 1}</span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-zinc-200 truncate">{q.callerName || q.callerNumber}</p>
                        {priorityBadge(q.priority)}
                      </div>
                      {q.callerName && (
                        <p className="text-[10px] text-zinc-600 font-mono mt-0.5">{q.callerNumber}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3 text-zinc-700" />
                      <span className={`text-[11px] font-mono font-semibold tabular-nums ${
                        wait > 120 ? "text-red-400" : wait > 60 ? "text-amber-400" : "text-zinc-500"
                      }`}>
                        {formatWait(wait)}
                      </span>
                    </div>

                    <button
                      onClick={() => onPickupQueued?.(q.id)}
                      className="flex items-center gap-1.5 px-3 h-7 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold transition-all active:scale-95 shrink-0"
                    >
                      <Phone className="h-3 w-3" /> Pick Up
                    </button>
                  </div>
                )
              })}
            </div>
          )
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Clock className="h-8 w-8 text-zinc-800" />
            <p className="text-xs text-zinc-700">No recent calls</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/40 transition-colors">
                <div className="shrink-0">{logStatusIcon(log.status, log.direction)}</div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-200 truncate">{log.callerName || log.callerNumber}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {log.callerName && <p className="text-[10px] text-zinc-600 font-mono">{log.callerNumber}</p>}
                    {log.notes && <p className="text-[10px] text-zinc-700 truncate">· {log.notes}</p>}
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-md border text-[9px] font-semibold shrink-0 ${logStatusStyle(log.status)}`}>
                  {logStatusLabel(log.status)}
                </span>

                <div className="shrink-0 text-right">
                  <p className="text-[11px] font-mono text-zinc-400 tabular-nums">{formatDuration(log.duration)}</p>
                  <p className="text-[9px] text-zinc-700">{timeAgo(log.startedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}