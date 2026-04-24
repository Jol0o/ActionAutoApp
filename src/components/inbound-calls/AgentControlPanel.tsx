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
  Coffee,
  ChevronDown,
  Phone,
  PhoneOff,
  Wifi,
  WifiOff,
  Clock,
  Activity,
  Timer,
} from "lucide-react"
import {
  AgentInfo,
  BreakReason,
  agentStatusConfig,
  breakReasonLabels,
} from "./types"

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
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`
  return `${s}s`
}

interface AgentControlPanelProps {
  agent: AgentInfo
  onGoLive: () => void
  onGoOffline: () => void
  onBreak: (reason: BreakReason) => void
  onResumeFromBreak: () => void
  todayCalls?: number
  avgHandle?: string
}

export function AgentControlPanel({
  agent,
  onGoLive,
  onGoOffline,
  onBreak,
  onResumeFromBreak,
  todayCalls = 0,
  avgHandle = "—",
}: AgentControlPanelProps) {
  const cfg = agentStatusConfig[agent.status]

  const [elapsed, setElapsed] = React.useState(0)
  React.useEffect(() => {
    if (!agent.liveAt) { setElapsed(0); return }
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(agent.liveAt!).getTime()) / 1000))
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [agent.liveAt])

  const isLive = agent.status === "available" || agent.status === "on-call"
  const isOnBreak = agent.status === "break"

  return (
    <div className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-500">Agent</span>
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
          <span className={`text-[10px] font-semibold ${cfg.color}`}>{cfg.label}</span>
        </div>
      </div>

      {/* Identity */}
      <div className="px-4 pt-5 pb-4 flex flex-col items-center gap-3 border-b border-zinc-800">
        <div className="relative">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white text-base font-bold shadow-lg shadow-violet-900/40">
            {getInitials(agent.name)}
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-zinc-900 ${cfg.dot.replace(" animate-pulse", "")} ${agent.status === "on-call" ? "animate-pulse" : ""}`} />
        </div>

        <div className="text-center">
          <p className="text-sm font-semibold text-zinc-100">{agent.name}</p>
          <p className="text-[10px] text-zinc-600 mt-0.5 font-mono">#{agent.employeeId}</p>
        </div>

        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-semibold ${cfg.bg} ${cfg.border} ${cfg.color}`}>
          <span className={`h-1 w-1 rounded-full ${cfg.dot}`} />
          {cfg.label}
          {agent.breakReason && (
            <span className="text-zinc-500 font-normal">· {breakReasonLabels[agent.breakReason]}</span>
          )}
        </div>

        {agent.liveAt && (
          <div className="flex items-center gap-1 text-[10px] text-zinc-600">
            <Timer className="h-2.5 w-2.5" />
            Session {formatElapsed(elapsed)}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex-1 px-3 py-3 flex flex-col gap-2">
        {!isLive && !isOnBreak ? (
          <button
            onClick={onGoLive}
            className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold transition-all shadow-lg shadow-emerald-900/40 active:scale-[0.98]"
          >
            <Wifi className="h-3.5 w-3.5" />
            Go Live
          </button>
        ) : (
          <button
            onClick={onGoOffline}
            className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-semibold transition-all active:scale-[0.98]"
          >
            <WifiOff className="h-3.5 w-3.5" />
            Go Offline
          </button>
        )}

        {isLive && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full h-9 flex items-center justify-center gap-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 text-zinc-400 text-[11px] font-medium transition-all">
                <Coffee className="h-3 w-3" />
                Take a Break
                <ChevronDown className="h-3 w-3 ml-auto mr-0 opacity-40" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="rounded-xl w-44 bg-zinc-900 border-zinc-800">
              {(Object.keys(breakReasonLabels) as BreakReason[]).map((reason) => (
                <DropdownMenuItem
                  key={reason}
                  onClick={() => onBreak(reason)}
                  className="text-xs text-zinc-300 hover:text-white focus:text-white cursor-pointer"
                >
                  {breakReasonLabels[reason]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {isOnBreak && (
          <button
            onClick={onResumeFromBreak}
            className="w-full h-9 flex items-center justify-center gap-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-400 text-xs font-semibold transition-all"
          >
            <Phone className="h-3 w-3" />
            Resume
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="px-4 py-3 border-t border-zinc-800 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-medium">Calls Today</p>
          <p className="text-xl font-bold text-zinc-100 leading-tight mt-0.5">{todayCalls}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-medium">Avg Handle</p>
          <p className="text-xl font-bold text-zinc-100 leading-tight mt-0.5">{avgHandle}</p>
        </div>
      </div>
    </div>
  )
}