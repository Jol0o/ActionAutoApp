"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Phone,
  PhoneOff,
  Coffee,
  ChevronDown,
  Headphones,
  Clock3,
  Wifi,
  WifiOff,
} from "lucide-react"
import {
  AgentInfo,
  AgentStatus,
  BreakReason,
  agentStatusConfig,
  breakReasonLabels,
} from "./types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatElapsed(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`
  return `${s}s`
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AgentControlPanelProps {
  agent: AgentInfo
  onGoLive: () => void
  onGoOffline: () => void
  onBreak: (reason: BreakReason) => void
  onResumeFromBreak: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AgentControlPanel({
  agent,
  onGoLive,
  onGoOffline,
  onBreak,
  onResumeFromBreak,
}: AgentControlPanelProps) {
  const cfg = agentStatusConfig[agent.status]

  // Elapsed time since going live
  const [elapsed, setElapsed] = React.useState(0)
  React.useEffect(() => {
    if (!agent.liveAt) {
      setElapsed(0)
      return
    }
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(agent.liveAt!).getTime()) / 1000))
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [agent.liveAt])

  const isLive = agent.status === "available" || agent.status === "on-call"
  const isOnBreak = agent.status === "break"

  return (
    <div className="flex flex-col rounded-2xl border border-border/50 bg-card overflow-hidden h-full">
      {/* ── Header ── */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
          Agent Panel
        </p>
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
          <span className={`text-[10px] font-semibold ${cfg.color}`}>{cfg.label}</span>
        </div>
      </div>

      {/* ── Agent identity ── */}
      <div className="px-4 py-5 flex flex-col items-center gap-3 border-b border-border/40">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-lg font-bold">
            {getInitials(agent.name)}
          </div>
          <span
            className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-card ${cfg.dot}`}
          />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold leading-tight">{agent.name}</p>
          <p className="text-[10px] text-muted-foreground/50 mt-0.5">
            ID: {agent.employeeId}
          </p>
        </div>

        {/* Status badge */}
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}
        >
          <Headphones className="h-3 w-3" />
          {cfg.label}
          {agent.breakReason && (
            <span className="opacity-60">· {breakReasonLabels[agent.breakReason]}</span>
          )}
        </span>

        {/* Session timer */}
        {agent.liveAt && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
            <Clock3 className="h-3 w-3" />
            Session: {formatElapsed(elapsed)}
          </div>
        )}
      </div>

      {/* ── Controls ── */}
      <div className="flex-1 px-4 py-4 flex flex-col gap-2.5">
        {/* Go live / stop */}
        {!isLive && !isOnBreak ? (
          <Button
            onClick={onGoLive}
            className="w-full h-11 text-sm font-semibold gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition-all"
          >
            <Wifi className="h-4 w-4" />
            Start Receiving Calls
          </Button>
        ) : (
          <Button
            onClick={onGoOffline}
            variant="outline"
            className="w-full h-11 text-sm font-semibold gap-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-500/5 border-rose-500/30 transition-all"
          >
            <WifiOff className="h-4 w-4" />
            Stop Receiving Calls
          </Button>
        )}

        {/* Break controls */}
        {isLive && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full h-9 text-xs gap-1.5 rounded-xl border-border/50"
              >
                <Coffee className="h-3.5 w-3.5" />
                Take a Break
                <ChevronDown className="h-3 w-3 ml-auto opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="rounded-xl w-[var(--radix-dropdown-menu-trigger-width)]">
              {(Object.keys(breakReasonLabels) as BreakReason[]).map((reason) => (
                <DropdownMenuItem
                  key={reason}
                  onClick={() => onBreak(reason)}
                  className="text-xs gap-2 cursor-pointer"
                >
                  <Coffee className="h-3 w-3 text-blue-500" />
                  {breakReasonLabels[reason]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {isOnBreak && (
          <Button
            onClick={onResumeFromBreak}
            className="w-full h-9 text-xs gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Phone className="h-3.5 w-3.5" />
            Resume — Go Available
          </Button>
        )}
      </div>

      {/* ── Footer stats ── */}
      <div className="px-4 py-3 border-t border-border/40 bg-muted/10">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/40 font-medium">
              Today's Calls
            </p>
            <p className="text-lg font-bold leading-tight mt-0.5">12</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/40 font-medium">
              Avg Handle
            </p>
            <p className="text-lg font-bold leading-tight mt-0.5">4m 32s</p>
          </div>
        </div>
      </div>
    </div>
  )
}