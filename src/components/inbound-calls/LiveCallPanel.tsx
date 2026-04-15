"use client"

import * as React from "react"
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Pause,
  Play,
  ArrowRightLeft,
  Users,
  Radio,
  PhoneIncoming,
  Disc3,
  PhoneCall,
} from "lucide-react"
import { InboundCall } from "./types"

function formatTimer(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n: number) => String(n).padStart(2, "0")
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
}

interface LiveCallPanelProps {
  call: InboundCall | null
  agentStatus: string
  onAnswer?: () => void
  onEnd?: () => void
  onMuteToggle?: () => void
  onHoldToggle?: () => void
  onTransfer?: () => void
  onConference?: () => void
  onRecordToggle?: () => void
}

function ControlButton({
  onClick,
  active,
  activeColor = "amber",
  icon,
  label,
  danger,
}: {
  onClick?: () => void
  active?: boolean
  activeColor?: string
  icon: React.ReactNode
  label: string
  danger?: boolean
}) {
  const base = "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all active:scale-95 cursor-pointer"
  const inactive = "bg-zinc-800/60 border-zinc-700/40 text-zinc-400 hover:bg-zinc-700/60 hover:text-zinc-200"
  const activeMap: Record<string, string> = {
    amber: "bg-amber-400/10 border-amber-400/25 text-amber-400",
    red: "bg-red-500/10 border-red-500/25 text-red-400",
    emerald: "bg-emerald-400/10 border-emerald-400/25 text-emerald-400",
  }

  return (
    <button onClick={onClick} className={`${base} ${active ? (activeMap[activeColor] || activeMap.amber) : inactive}`}>
      <span className="h-5 w-5 flex items-center justify-center">{icon}</span>
      <span className="text-[9px] font-semibold uppercase tracking-wider">{label}</span>
    </button>
  )
}

export function LiveCallPanel({
  call,
  agentStatus,
  onAnswer,
  onEnd,
  onMuteToggle,
  onHoldToggle,
  onTransfer,
  onConference,
  onRecordToggle,
}: LiveCallPanelProps) {
  const [elapsed, setElapsed] = React.useState(0)
  React.useEffect(() => {
    if (!call?.answeredAt) { setElapsed(0); return }
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(call.answeredAt!).getTime()) / 1000))
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [call?.answeredAt])

  // Offline
  if (agentStatus === "offline") {
    return (
      <div className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden h-full">
        <div className="px-4 py-3 border-b border-zinc-800">
          <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-500">Live Call</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16">
          <div className="h-16 w-16 rounded-2xl border border-dashed border-zinc-800 flex items-center justify-center">
            <Phone className="h-6 w-6 text-zinc-700" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-600">Agent is offline</p>
            <p className="text-xs text-zinc-700 mt-1">Go live to receive calls</p>
          </div>
        </div>
      </div>
    )
  }

  // No call
  if (!call) {
    return (
      <div className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden h-full">
        <div className="px-4 py-3 border-b border-zinc-800">
          <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-500">Live Call</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping" />
            <div className="h-16 w-16 rounded-full border border-emerald-500/10 flex items-center justify-center">
              <PhoneCall className="h-6 w-6 text-emerald-500/40" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-500">Waiting for calls</p>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-500 font-medium">Line active</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Ringing
  if (call.status === "ringing") {
    return (
      <div className="flex flex-col bg-zinc-900 border border-emerald-500/30 rounded-2xl overflow-hidden h-full">
        <div className="px-4 py-3 border-b border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-widest uppercase text-emerald-400">Incoming Call</span>
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-400">
            <PhoneIncoming className="h-3 w-3 animate-bounce" /> Ringing...
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6 py-8">
          <div className="relative">
            <div className="absolute -inset-3 rounded-full bg-emerald-500/10 animate-ping" />
            <div className="absolute -inset-6 rounded-full bg-emerald-500/5 animate-ping animation-delay-150" />
            <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-900/50">
              <span className="text-white text-xl font-bold">
                {call.callerName ? getInitials(call.callerName) : <Phone className="h-8 w-8" />}
              </span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-lg font-bold text-zinc-100">{call.callerName || "Unknown Caller"}</p>
            <p className="text-sm text-zinc-500 font-mono mt-1">{call.callerNumber}</p>
          </div>

          <button
            onClick={onAnswer}
            className="flex items-center gap-2.5 px-8 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm shadow-xl shadow-emerald-900/50 transition-all active:scale-95"
          >
            <Phone className="h-4 w-4" />
            Answer Call
          </button>
        </div>
      </div>
    )
  }

  // Connected / On Hold
  const isOnHold = call.status === "on-hold"
  const accentColor = isOnHold ? "amber" : "emerald"
  const accentBorder = isOnHold ? "border-amber-500/25" : "border-emerald-500/25"
  const accentHeaderBg = isOnHold ? "bg-amber-500/5 border-amber-500/15" : "bg-emerald-500/5 border-emerald-500/15"
  const accentText = isOnHold ? "text-amber-400" : "text-emerald-400"

  return (
    <div className={`flex flex-col bg-zinc-900 border rounded-2xl overflow-hidden h-full ${accentBorder}`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b flex items-center justify-between ${accentHeaderBg}`}>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold tracking-widest uppercase ${accentText}`}>
            {isOnHold ? "On Hold" : "Live Call"}
          </span>
          {call.isRecording && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[9px] font-bold text-red-400">
              <Disc3 className="h-2.5 w-2.5 animate-spin" /> REC
            </span>
          )}
        </div>
        <span className={`font-mono text-sm font-bold tabular-nums ${accentText}`}>
          {formatTimer(elapsed)}
        </span>
      </div>

      {/* Caller */}
      <div className="px-5 py-5 flex flex-col items-center gap-3 border-b border-zinc-800">
        <div className="relative">
          <div className={`h-16 w-16 rounded-xl flex items-center justify-center text-white text-lg font-bold ${isOnHold ? "bg-gradient-to-br from-amber-500 to-orange-600" : "bg-gradient-to-br from-emerald-500 to-teal-600"} shadow-lg`}>
            {call.callerName ? getInitials(call.callerName) : <Phone className="h-6 w-6" />}
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-zinc-900 ${isOnHold ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-zinc-100">{call.callerName || "Unknown Caller"}</p>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">{call.callerNumber}</p>
        </div>
        {isOnHold && (
          <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
            Caller on hold
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex-1 flex items-center justify-center px-4 py-5">
        <div className="grid grid-cols-5 gap-2 w-full">
          <ControlButton onClick={onMuteToggle} active={call.isMuted} activeColor="red" icon={call.isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />} label={call.isMuted ? "Unmute" : "Mute"} />
          <ControlButton onClick={onHoldToggle} active={isOnHold} activeColor="amber" icon={isOnHold ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />} label={isOnHold ? "Resume" : "Hold"} />
          <ControlButton onClick={onTransfer} icon={<ArrowRightLeft className="h-4 w-4" />} label="Transfer" />
          <ControlButton onClick={onConference} icon={<Users className="h-4 w-4" />} label="Conf" />
          <ControlButton onClick={onRecordToggle} active={call.isRecording} activeColor="red" icon={<Radio className="h-4 w-4" />} label={call.isRecording ? "Stop" : "Record"} />
        </div>
      </div>

      {/* End call */}
      <div className="px-4 pb-4 flex justify-center">
        <button
          onClick={onEnd}
          className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 hover:text-red-300 font-semibold text-sm transition-all active:scale-95"
        >
          <PhoneOff className="h-4 w-4" />
          End Call
        </button>
      </div>
    </div>
  )
}