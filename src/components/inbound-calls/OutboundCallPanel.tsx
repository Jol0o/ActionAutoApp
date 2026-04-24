"use client"

import * as React from "react"
import {
  Phone,
  PhoneOff,
  PhoneCall,
  Mic,
  MicOff,
  Pause,
  Play,
  Radio,
  Disc3,
  Delete,
  Clock,
  User,
  X,
} from "lucide-react"
import { OutboundCall, RecentContact } from "./types"

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
}

const DIALPAD = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
]

interface OutboundCallPanelProps {
  activeCall: OutboundCall | null
  recentContacts?: RecentContact[]
  onDial: (number: string, name?: string) => void
  onEnd?: () => void
  onMuteToggle?: () => void
  onHoldToggle?: () => void
  onRecordToggle?: () => void
}

export function OutboundCallPanel({
  activeCall,
  recentContacts = [],
  onDial,
  onEnd,
  onMuteToggle,
  onHoldToggle,
  onRecordToggle,
}: OutboundCallPanelProps) {
  const [dialInput, setDialInput] = React.useState("")
  const [elapsed, setElapsed] = React.useState(0)

  React.useEffect(() => {
    if (!activeCall?.answeredAt) { setElapsed(0); return }
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(activeCall.answeredAt!).getTime()) / 1000))
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [activeCall?.answeredAt])

  const handleDialKey = (key: string) => {
    setDialInput((p) => (p.length < 15 ? p + key : p))
  }

  const handleDelete = () => setDialInput((p) => p.slice(0, -1))
  const handleClear = () => setDialInput("")

  const canDial = dialInput.replace(/\D/g, "").length >= 7 && !activeCall

  const isOnHold = activeCall?.status === "on-hold"
  const isConnected = activeCall?.status === "connected" || isOnHold
  const isDialing = activeCall?.status === "dialing" || activeCall?.status === "ringing"

  return (
    <div className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-500">Outbound</span>
        {activeCall && (
          <div className="flex items-center gap-1.5">
            {activeCall.isRecording && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[9px] font-bold text-red-400">
                <Disc3 className="h-2.5 w-2.5 animate-spin" /> REC
              </span>
            )}
            <span className={`text-[10px] font-mono font-bold tabular-nums ${isConnected ? "text-violet-400" : "text-zinc-500"}`}>
              {isConnected ? formatTimer(elapsed) : "—:——"}
            </span>
          </div>
        )}
      </div>

      {/* Active call display */}
      {activeCall && (
        <div className={`px-4 py-4 border-b border-zinc-800 flex flex-col items-center gap-3 ${
          isDialing ? "bg-violet-500/5" : isConnected ? "bg-violet-500/5" : "bg-red-500/5"
        }`}>
          <div className="relative">
            <div className={`h-14 w-14 rounded-xl flex items-center justify-center text-white text-base font-bold ${
              isConnected
                ? "bg-gradient-to-br from-violet-500 to-indigo-600"
                : isDialing
                ? "bg-gradient-to-br from-zinc-600 to-zinc-700"
                : "bg-gradient-to-br from-red-500 to-red-700"
            } shadow-lg`}>
              {activeCall.contactName ? getInitials(activeCall.contactName) : <Phone className="h-5 w-5" />}
            </div>
            {isDialing && (
              <div className="absolute -inset-2 rounded-full border border-violet-500/30 animate-ping" />
            )}
          </div>

          <div className="text-center">
            <p className="text-sm font-bold text-zinc-100">{activeCall.contactName || activeCall.dialedNumber}</p>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">{activeCall.dialedNumber}</p>
            <p className={`text-[10px] font-semibold mt-1 capitalize ${
              isDialing ? "text-violet-400" : isConnected ? "text-emerald-400" : "text-red-400"
            }`}>
              {activeCall.status === "dialing" ? "Dialing..." :
               activeCall.status === "ringing" ? "Ringing..." :
               activeCall.status === "connected" ? "Connected" :
               activeCall.status === "on-hold" ? "On Hold" :
               activeCall.status === "failed" ? "Call Failed" :
               activeCall.status === "no-answer" ? "No Answer" : activeCall.status}
            </p>
          </div>

          {isConnected && (
            <div className="grid grid-cols-3 gap-2 w-full">
              <button
                onClick={onMuteToggle}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[9px] font-semibold uppercase tracking-wide transition-all ${
                  activeCall.isMuted ? "bg-red-500/10 border-red-500/25 text-red-400" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {activeCall.isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                {activeCall.isMuted ? "Unmute" : "Mute"}
              </button>
              <button
                onClick={onHoldToggle}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[9px] font-semibold uppercase tracking-wide transition-all ${
                  isOnHold ? "bg-amber-400/10 border-amber-400/25 text-amber-400" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {isOnHold ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                {isOnHold ? "Resume" : "Hold"}
              </button>
              <button
                onClick={onRecordToggle}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[9px] font-semibold uppercase tracking-wide transition-all ${
                  activeCall.isRecording ? "bg-red-500/10 border-red-500/25 text-red-400" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                <Radio className="h-3.5 w-3.5" />
                {activeCall.isRecording ? "Stop" : "Record"}
              </button>
            </div>
          )}

          <button
            onClick={onEnd}
            className="w-full h-9 flex items-center justify-center gap-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 text-xs font-semibold transition-all active:scale-95"
          >
            <PhoneOff className="h-3.5 w-3.5" />
            End Call
          </button>
        </div>
      )}

      {/* Dial input */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700/40 group focus-within:border-violet-500/40 transition-colors">
          <input
            type="tel"
            value={dialInput}
            onChange={(e) => setDialInput(e.target.value.replace(/[^\d+*#\-() ]/g, "").slice(0, 15))}
            placeholder="+1 (555) 000-0000"
            className="flex-1 bg-transparent text-sm font-mono text-zinc-100 placeholder:text-zinc-700 outline-none"
          />
          {dialInput && (
            <button onClick={handleDelete} className="text-zinc-600 hover:text-zinc-400 transition-colors p-0.5">
              <Delete className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Dialpad */}
      <div className="px-4 py-2">
        <div className="grid grid-cols-3 gap-1.5">
          {DIALPAD.flat().map((key) => (
            <button
              key={key}
              onClick={() => handleDialKey(key)}
              disabled={!!activeCall}
              className="h-9 rounded-lg bg-zinc-800/60 hover:bg-zinc-700/80 border border-zinc-700/30 text-zinc-200 text-sm font-semibold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {/* Call button */}
      <div className="px-4 pb-3">
        <button
          onClick={() => canDial && onDial(dialInput.trim())}
          disabled={!canDial}
          className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-lg shadow-violet-900/30 transition-all active:scale-[0.98]"
        >
          <PhoneCall className="h-4 w-4" />
          {dialInput ? `Call ${dialInput}` : "Enter Number"}
        </button>
      </div>

      {/* Recent contacts */}
      {recentContacts.length > 0 && !activeCall && (
        <div className="border-t border-zinc-800 flex-1 overflow-y-auto">
          <div className="px-4 py-2">
            <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-medium mb-1">Recent</p>
          </div>
          <div className="divide-y divide-zinc-800/60">
            {recentContacts.slice(0, 4).map((c, i) => (
              <button
                key={i}
                onClick={() => { setDialInput(c.number); onDial(c.number, c.name) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800/50 transition-colors text-left"
              >
                <div className="h-7 w-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                  <User className="h-3.5 w-3.5 text-zinc-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-300 truncate">{c.name}</p>
                  <p className="text-[10px] text-zinc-600 font-mono">{c.number}</p>
                </div>
                <Phone className="h-3 w-3 text-zinc-700 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}