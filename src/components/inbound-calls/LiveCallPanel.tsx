"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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
  Disc,
} from "lucide-react"
import { InboundCall } from "./types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimer(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n: number) => String(n).padStart(2, "0")
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface LiveCallPanelProps {
  call: InboundCall | null
  onAnswer?: () => void
  onEnd?: () => void
  onMuteToggle?: () => void
  onHoldToggle?: () => void
  onTransfer?: () => void
  onConference?: () => void
  onRecordToggle?: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LiveCallPanel({
  call,
  onAnswer,
  onEnd,
  onMuteToggle,
  onHoldToggle,
  onTransfer,
  onConference,
  onRecordToggle,
}: LiveCallPanelProps) {
  // Live timer
  const [elapsed, setElapsed] = React.useState(0)
  React.useEffect(() => {
    if (!call || !call.answeredAt) {
      setElapsed(0)
      return
    }
    const tick = () =>
      setElapsed(Math.floor((Date.now() - new Date(call.answeredAt!).getTime()) / 1000))
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [call?.answeredAt])

  // ── Idle state ──
  if (!call) {
    return (
      <div className="flex flex-col rounded-2xl border border-border/50 bg-card overflow-hidden h-full">
        <div className="px-4 py-3 border-b border-border/50">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
            Live Call
          </p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16">
          <div className="h-20 w-20 rounded-full border-2 border-dashed border-border/30 flex items-center justify-center">
            <Phone className="h-8 w-8 text-muted-foreground/15" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-muted-foreground/40">No active call</p>
            <p className="text-[11px] text-muted-foreground/30 mt-1">
              Waiting for incoming calls…
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Line open
            </span>
          </div>
        </div>
      </div>
    )
  }

  // ── Ringing state ──
  if (call.status === "ringing") {
    return (
      <div className="flex flex-col rounded-2xl border border-emerald-500/30 bg-card overflow-hidden h-full">
        <div className="px-4 py-3 border-b border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
              Incoming Call
            </p>
            <span className="flex items-center gap-1.5">
              <PhoneIncoming className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-600">Ringing</span>
            </span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-5 py-12">
          {/* Pulsing ring animation */}
          <div className="relative">
            <div className="absolute inset-0 h-24 w-24 rounded-full bg-emerald-500/10 animate-ping" />
            <div className="relative h-24 w-24 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <PhoneIncoming className="h-10 w-10 text-white" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{call.callerName || "Unknown Caller"}</p>
            <p className="text-sm text-muted-foreground/60 mt-1 font-mono">{call.callerNumber}</p>
          </div>
          <Button
            onClick={onAnswer}
            className="h-12 px-10 text-sm font-semibold gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 transition-all"
          >
            <Phone className="h-5 w-5" />
            Answer Call
          </Button>
        </div>
      </div>
    )
  }

  // ── Connected / on-hold state ──
  const isOnHold = call.status === "on-hold"

  return (
    <div
      className={`flex flex-col rounded-2xl border overflow-hidden h-full ${
        isOnHold
          ? "border-amber-500/30 bg-card"
          : "border-emerald-500/30 bg-card"
      }`}
    >
      {/* Header */}
      <div
        className={`px-4 py-3 border-b ${
          isOnHold
            ? "border-amber-500/20 bg-amber-500/5"
            : "border-emerald-500/20 bg-emerald-500/5"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p
              className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${
                isOnHold
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {isOnHold ? "Call On Hold" : "Live Call"}
            </p>
            {call.isRecording && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[9px] font-semibold text-rose-600 dark:text-rose-400">
                <Disc className="h-2.5 w-2.5 animate-pulse" /> REC
              </span>
            )}
          </div>
          <span className="font-mono text-sm font-bold tabular-nums text-foreground/80">
            {formatTimer(elapsed)}
          </span>
        </div>
      </div>

      {/* Caller info */}
      <div className="px-5 py-6 flex flex-col items-center gap-4 border-b border-border/40">
        <div className="relative">
          <div
            className={`h-20 w-20 rounded-2xl flex items-center justify-center text-white text-xl font-bold ${
              isOnHold ? "bg-amber-500" : "bg-emerald-600"
            }`}
          >
            <Phone className="h-8 w-8" />
          </div>
          <span
            className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-card ${
              isOnHold ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
            }`}
          />
        </div>
        <div className="text-center">
          <p className="text-base font-bold">{call.callerName || "Unknown Caller"}</p>
          <p className="text-xs text-muted-foreground/50 font-mono mt-1">{call.callerNumber}</p>
        </div>
        {isOnHold && (
          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
            Caller is on hold
          </span>
        )}
      </div>

      {/* Call controls */}
      <div className="flex-1 flex items-center justify-center px-5 py-6">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 w-full max-w-md">
          {/* Mute */}
          <button
            onClick={onMuteToggle}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
              call.isMuted
                ? "bg-rose-500/10 border-rose-500/30 text-rose-600"
                : "bg-muted/20 border-border/50 text-foreground/60 hover:bg-muted/40"
            }`}
          >
            {call.isMuted ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
            <span className="text-[9px] font-semibold uppercase tracking-wide">
              {call.isMuted ? "Unmute" : "Mute"}
            </span>
          </button>

          {/* Hold */}
          <button
            onClick={onHoldToggle}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
              isOnHold
                ? "bg-amber-500/10 border-amber-500/30 text-amber-600"
                : "bg-muted/20 border-border/50 text-foreground/60 hover:bg-muted/40"
            }`}
          >
            {isOnHold ? (
              <Play className="h-5 w-5" />
            ) : (
              <Pause className="h-5 w-5" />
            )}
            <span className="text-[9px] font-semibold uppercase tracking-wide">
              {isOnHold ? "Resume" : "Hold"}
            </span>
          </button>

          {/* Transfer */}
          <button
            onClick={onTransfer}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border bg-muted/20 border-border/50 text-foreground/60 hover:bg-muted/40 transition-all"
          >
            <ArrowRightLeft className="h-5 w-5" />
            <span className="text-[9px] font-semibold uppercase tracking-wide">Transfer</span>
          </button>

          {/* Conference */}
          <button
            onClick={onConference}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border bg-muted/20 border-border/50 text-foreground/60 hover:bg-muted/40 transition-all"
          >
            <Users className="h-5 w-5" />
            <span className="text-[9px] font-semibold uppercase tracking-wide">Conf</span>
          </button>

          {/* Record */}
          <button
            onClick={onRecordToggle}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
              call.isRecording
                ? "bg-rose-500/10 border-rose-500/30 text-rose-600"
                : "bg-muted/20 border-border/50 text-foreground/60 hover:bg-muted/40"
            }`}
          >
            <Radio className="h-5 w-5" />
            <span className="text-[9px] font-semibold uppercase tracking-wide">
              {call.isRecording ? "Stop Rec" : "Record"}
            </span>
          </button>
        </div>
      </div>

      {/* End call */}
      <div className="px-5 py-4 border-t border-border/40 flex justify-center">
        <Button
          onClick={onEnd}
          className="h-11 px-10 text-sm font-semibold gap-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20 transition-all"
        >
          <PhoneOff className="h-4 w-4" />
          End Call
        </Button>
      </div>
    </div>
  )
}