"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Phone,
  PhoneIncoming,
  PhoneMissed,
  Voicemail,
  Clock3,
  Users,
  ChevronDown,
  Star,
} from "lucide-react"
import { QueuedCall, CallLogEntry } from "./types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

function formatWait(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  return `${m}m ${seconds % 60}s`
}

function timeAgo(isoStr: string) {
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

// ─── Props ────────────────────────────────────────────────────────────────────

type TabId = "queue" | "logs"

interface CallQueueProps {
  queue: QueuedCall[]
  logs: CallLogEntry[]
  onPickupQueued?: (id: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CallQueue({ queue, logs, onPickupQueued }: CallQueueProps) {
  const [activeTab, setActiveTab] = React.useState<TabId>("queue")

  // Live wait-time counters
  const [, forceUpdate] = React.useState(0)
  React.useEffect(() => {
    const iv = setInterval(() => forceUpdate((p) => p + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  const priorityConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    vip: { color: "text-amber-500", icon: <Star className="h-3 w-3 text-amber-500 fill-amber-500" /> },
    high: { color: "text-rose-500", icon: <Star className="h-3 w-3 text-rose-500" /> },
    normal: { color: "text-muted-foreground/50", icon: null },
  }

  const logStatusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    answered: {
      icon: <PhoneIncoming className="h-3.5 w-3.5" />,
      color: "text-emerald-600 dark:text-emerald-400",
      label: "Answered",
    },
    missed: {
      icon: <PhoneMissed className="h-3.5 w-3.5" />,
      color: "text-rose-600 dark:text-rose-400",
      label: "Missed",
    },
    voicemail: {
      icon: <Voicemail className="h-3.5 w-3.5" />,
      color: "text-blue-600 dark:text-blue-400",
      label: "Voicemail",
    },
  }

  return (
    <div className="flex flex-col rounded-2xl border border-border/50 bg-card overflow-hidden">
      {/* Tabs header */}
      <div className="flex items-center gap-0 border-b border-border/50">
        {[
          { id: "queue" as TabId, label: "Call Queue", count: queue.length, icon: <Users className="h-3.5 w-3.5" /> },
          { id: "logs" as TabId, label: "Recent Calls", count: logs.length, icon: <Clock3 className="h-3.5 w-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold transition-all relative ${
              activeTab === tab.id
                ? "text-foreground"
                : "text-muted-foreground/50 hover:text-muted-foreground/70"
            }`}
          >
            {tab.icon}
            {tab.label}
            <span
              className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                activeTab === tab.id
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-muted/40 text-muted-foreground/40"
              }`}
            >
              {tab.count}
            </span>
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="max-h-[280px] overflow-y-auto">
        {activeTab === "queue" ? (
          queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Users className="h-8 w-8 text-muted-foreground/10" />
              <p className="text-xs text-muted-foreground/40">No callers in queue</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {queue.map((q, idx) => {
                const waitSeconds = Math.floor(
                  (Date.now() - new Date(q.waitingSince).getTime()) / 1000
                )
                const pri = priorityConfig[q.priority] || priorityConfig.normal
                return (
                  <div
                    key={q.id}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors"
                  >
                    {/* Position */}
                    <span className="text-xs font-bold text-muted-foreground/30 w-5 text-center">
                      {idx + 1}
                    </span>

                    {/* Priority indicator */}
                    <div className="shrink-0">{pri.icon}</div>

                    {/* Caller info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {q.callerName || q.callerNumber}
                      </p>
                      {q.callerName && (
                        <p className="text-[10px] text-muted-foreground/40 font-mono">
                          {q.callerNumber}
                        </p>
                      )}
                    </div>

                    {/* Wait time */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Clock3 className="h-3 w-3 text-muted-foreground/30" />
                      <span
                        className={`text-[11px] font-mono font-medium ${
                          waitSeconds > 120
                            ? "text-rose-500"
                            : waitSeconds > 60
                            ? "text-amber-500"
                            : "text-muted-foreground/50"
                        }`}
                      >
                        {formatWait(waitSeconds)}
                      </span>
                    </div>

                    {/* Pick up */}
                    <Button
                      onClick={() => onPickupQueued?.(q.id)}
                      size="sm"
                      className="h-7 text-[10px] gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                    >
                      <Phone className="h-3 w-3" />
                      Pick Up
                    </Button>
                  </div>
                )
              })}
            </div>
          )
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Clock3 className="h-8 w-8 text-muted-foreground/10" />
            <p className="text-xs text-muted-foreground/40">No recent calls</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {logs.map((log) => {
              const cfg = logStatusConfig[log.status] || logStatusConfig.answered
              return (
                <div
                  key={log.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors"
                >
                  {/* Status icon */}
                  <div className={`shrink-0 ${cfg.color}`}>{cfg.icon}</div>

                  {/* Caller */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {log.callerName || log.callerNumber}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {log.callerName && (
                        <p className="text-[10px] text-muted-foreground/40 font-mono">
                          {log.callerNumber}
                        </p>
                      )}
                      {log.notes && (
                        <p className="text-[10px] text-muted-foreground/30 truncate">
                          · {log.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold border ${
                      log.status === "answered"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : log.status === "missed"
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                    }`}
                  >
                    {cfg.label}
                  </span>

                  {/* Duration */}
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] font-mono font-medium text-muted-foreground/60">
                      {formatDuration(log.duration)}
                    </p>
                    <p className="text-[9px] text-muted-foreground/30">{timeAgo(log.startedAt)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}