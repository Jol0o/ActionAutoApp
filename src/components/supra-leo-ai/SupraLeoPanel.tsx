// ─── Supra Leo AI · Panel (v3) ───────────────────────────────────────────────
// KEY CHANGE: 'waiting-command' state shows visual buttons — user clicks to proceed.
// NO auto-mic, NO TTS prompts. The user is always in control.

import * as React from 'react'
import { SpeakState, SupraLeoEmail, SupraLeoMessage } from '@/hooks/useSupraLeoAI'
import {
  X, Square, Pause, Play, Volume2, Mail, Mic, MicOff,
  Send, Edit3, RotateCcw, Loader2, CheckCircle2, AlertCircle,
  MessageSquare,
} from 'lucide-react'

interface Props {
  state: SpeakState
  email: SupraLeoEmail | null
  message: SupraLeoMessage | null
  errorMsg: string | null
  voiceName: string | null
  transcript: string
  onStop: () => void
  onPause: () => void
  onResume: () => void
  onClose: () => void
  onReplay: () => void
  onStartListeningForCommand: () => void
  onStartReplyListening: () => void
  onSetTranscript: (text: string) => void
  onSendReply: () => Promise<void>
}

const stateLabels: Record<string, { dot: string; label: string }> = {
  idle:              { dot: 'bg-zinc-600',                  label: 'Ready' },
  fetching:          { dot: 'bg-blue-400 animate-pulse',    label: 'Fetching message…' },
  speaking:          { dot: 'bg-violet-400 animate-pulse',  label: 'Reading aloud…' },
  paused:            { dot: 'bg-amber-400',                 label: 'Paused' },
  'waiting-command': { dot: 'bg-emerald-400',               label: 'Done reading — what next?' },
  listening:         { dot: 'bg-emerald-400 animate-pulse', label: 'Listening for your command…' },
  'listening-reply': { dot: 'bg-emerald-400 animate-pulse', label: 'Dictating your reply…' },
  sending:           { dot: 'bg-blue-400 animate-pulse',    label: 'Sending reply…' },
  done:              { dot: 'bg-emerald-500',               label: 'Done' },
  error:             { dot: 'bg-rose-400',                  label: 'Error' },
}

export function SupraLeoPanel({
  state, email, message, errorMsg, voiceName, transcript,
  onStop, onPause, onResume, onClose, onReplay,
  onStartListeningForCommand, onStartReplyListening,
  onSetTranscript, onSendReply,
}: Props) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editText, setEditText]   = React.useState('')
  const taRef = React.useRef<HTMLTextAreaElement>(null)

  const cfg = stateLabels[state] || stateLabels.idle

  const isSpeaking  = state === 'speaking'
  const isPaused    = state === 'paused'
  const isWaiting   = state === 'waiting-command'
  const isListening = state === 'listening'
  const isReplyMic  = state === 'listening-reply'
  const isSending   = state === 'sending'
  const isDone      = state === 'done'
  const isError     = state === 'error'
  const isIdle      = state === 'idle'
  const isFetching  = state === 'fetching'
  const isActive    = isSpeaking || isPaused || isListening || isReplyMic || isSending

  React.useEffect(() => {
    if (isEditing && taRef.current) {
      taRef.current.focus()
      taRef.current.selectionStart = taRef.current.value.length
    }
  }, [isEditing])

  return (
    <div className="w-[360px] max-h-[540px] rounded-2xl border border-violet-500/30 bg-[#0f0a1e] shadow-2xl shadow-violet-900/40 overflow-hidden flex flex-col">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-900/80 to-indigo-900/60 border-b border-violet-500/20 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">🦁</span>
          <div>
            <p className="text-sm font-bold text-white leading-none">Supra Leo AI</p>
            <p className="text-[10px] text-violet-300/70 mt-0.5">CRM Voice Assistant</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-violet-300/60 hover:text-white transition-colors"><X className="h-4 w-4" /></button>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        {/* Status */}
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full shrink-0 ${cfg.dot}`} />
          <p className="text-xs font-medium text-zinc-300">{cfg.label}</p>
        </div>

        {/* Voice badge */}
        {voiceName && (
          <div className="flex items-center gap-1.5">
            <Volume2 className="h-3 w-3 text-violet-400/60" />
            <span className="text-[10px] text-violet-300/50 font-mono truncate">{voiceName}</span>
          </div>
        )}

        {/* Error */}
        {isError && errorMsg && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 flex items-start gap-2">
            <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-400 leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* Message card */}
        {(message || email) && (
          <div className="rounded-xl border border-violet-500/20 bg-violet-900/20 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <Mail className="h-3.5 w-3.5 text-violet-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-white truncate">{message?.subject || email?.subject}</p>
                <p className="text-[10px] text-violet-300/60 truncate mt-0.5">{message?.sender || email?.from}</p>
                {message?.senderEmail && <p className="text-[9px] text-zinc-500 mt-0.5 truncate">{message.senderEmail}</p>}
              </div>
            </div>
            {(message?.snippet || email?.snippet) && (
              <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-3 border-t border-violet-500/10 pt-2">
                {message?.snippet || email?.snippet}
              </p>
            )}
            {message?.status && (
              <div className="flex items-center gap-1.5 pt-1">
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${message.status === 'Closed' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-violet-500/10 text-violet-300 border-violet-500/20'}`}>
                  {message.status}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            WAITING-COMMAND: Visual prompt — user chooses what to do
            ★ NO TTS here, NO auto-mic — user clicks a button
        ════════════════════════════════════════════════════════════════ */}
        {isWaiting && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
            <p className="text-xs font-semibold text-emerald-300 text-center">
              ✅ Done reading. What would you like to do?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onStartListeningForCommand}
                className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
              >
                <Mic className="h-3.5 w-3.5" /> Reply by Voice
              </button>
              <button
                onClick={onStartReplyListening}
                className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" /> Dictate Reply
              </button>
            </div>
            <button
              onClick={onStop}
              className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg text-[10px] font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-500/10 border border-zinc-600/30 transition-colors"
            >
              <X className="h-3 w-3" /> Close / Stop
            </button>
            <p className="text-[10px] text-zinc-600 text-center">
              "Reply by Voice" will listen for your command first.<br />
              "Dictate Reply" starts recording your reply immediately.
            </p>
          </div>
        )}

        {/* Listening for command */}
        {isListening && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex flex-col items-center gap-3">
            <div className="relative">
              <Mic className="h-6 w-6 text-emerald-400" />
              <span className="absolute -inset-2 rounded-full bg-emerald-400/20 animate-ping" />
            </div>
            <p className="text-xs font-semibold text-emerald-300">Listening…</p>
            <p className="text-[10px] text-emerald-400/50 text-center">
              Say <strong>"Reply"</strong> to dictate a response, or <strong>"Stop"</strong> to close.
            </p>
          </div>
        )}

        {/* Listening for reply dictation */}
        {isReplyMic && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex flex-col items-center gap-3">
            <div className="relative">
              <Mic className="h-6 w-6 text-emerald-400" />
              <span className="absolute -inset-2 rounded-full bg-emerald-400/20 animate-ping" />
            </div>
            <p className="text-xs font-semibold text-emerald-300">Dictating your reply…</p>
            <p className="text-[10px] text-emerald-400/50 text-center">Speak clearly. Recording stops after 30 seconds or silence.</p>
            {transcript && (
              <div className="w-full border-t border-emerald-500/20 pt-2 mt-1">
                <p className="text-[10px] text-emerald-400/40 mb-1">Live transcript:</p>
                <p className="text-[11px] text-zinc-300 leading-relaxed">{transcript}</p>
              </div>
            )}
          </div>
        )}

        {/* Sending */}
        {isSending && (
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 flex items-center gap-3 justify-center">
            <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
            <p className="text-xs font-semibold text-blue-300">Sending reply…</p>
          </div>
        )}

        {/* Transcript review */}
        {isDone && transcript && !isEditing && (
          <div className="rounded-xl border border-violet-500/20 bg-violet-900/15 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-violet-300/70 uppercase tracking-wide">Your Reply</p>
              <button onClick={() => { setEditText(transcript); setIsEditing(true) }} className="p-1 rounded-md hover:bg-white/10 text-violet-300/50 hover:text-white transition-colors"><Edit3 className="h-3 w-3" /></button>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">{transcript}</p>
          </div>
        )}

        {/* Editing */}
        {isDone && isEditing && (
          <div className="rounded-xl border border-violet-500/20 bg-violet-900/15 p-3 space-y-2">
            <p className="text-[10px] font-semibold text-violet-300/70 uppercase tracking-wide">Edit Reply</p>
            <textarea
              ref={taRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={4}
              className="w-full bg-transparent border border-violet-500/20 rounded-lg px-3 py-2 text-[11px] text-zinc-200 leading-relaxed resize-none focus:outline-none focus:border-violet-500/40 placeholder:text-zinc-600"
            />
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setIsEditing(false)} className="px-2.5 py-1 rounded-lg text-[10px] font-medium text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">Cancel</button>
              <button onClick={() => { onSetTranscript(editText); setIsEditing(false) }} className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors">Save</button>
            </div>
          </div>
        )}

        {/* Done — no transcript */}
        {isDone && !transcript && message && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-300">Message read complete.</p>
          </div>
        )}

        {/* Idle */}
        {isIdle && !message && !email && (
          <div className="text-center py-4 space-y-2">
            <div className="h-12 w-12 rounded-full border-2 border-dashed border-violet-500/20 flex items-center justify-center mx-auto">
              <span className="text-2xl">🦁</span>
            </div>
            <p className="text-xs text-zinc-400">Click the 🦁 button next to a message to read it aloud</p>
            <p className="text-[10px] text-zinc-600">Voice-powered replies with dictation</p>
          </div>
        )}
      </div>

      {/* ── Bottom Controls ── */}
      <div className="px-4 pb-4 pt-2 flex flex-col gap-2 border-t border-violet-500/10 shrink-0">
        <div className="flex items-center gap-2">

          {/* Send Reply (when transcript exists) */}
          {isDone && transcript ? (
            <button onClick={onSendReply} disabled={!transcript.trim()} className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold transition-colors">
              <Send className="h-3.5 w-3.5" /> Send Reply
            </button>
          ) : !isWaiting ? (
            <button onClick={onReplay} disabled={isFetching || isSending} className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-xs font-semibold transition-colors">
              {isFetching ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Fetching…</> : <><span className="text-base leading-none">🦁</span> {message ? 'Replay' : 'Read Message'}</>}
            </button>
          ) : null}

          {/* Mic (dictate more) when done */}
          {isDone && message?.canReply && (
            <button onClick={onStartReplyListening} className="h-9 w-9 flex items-center justify-center rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 transition-colors" title="Dictate reply">
              <Mic className="h-4 w-4" />
            </button>
          )}

          {/* Pause/Resume */}
          {(isSpeaking || isPaused) && (
            <button onClick={isPaused ? onResume : onPause} className="h-9 w-9 flex items-center justify-center rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-400 transition-colors">
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
          )}

          {/* Stop */}
          {isActive && (
            <button onClick={onStop} className="h-9 w-9 flex items-center justify-center rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-400 transition-colors">
              <Square className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Re-dictate / Edit / Discard */}
        {isDone && transcript && (
          <div className="flex items-center gap-2">
            <button onClick={onStartReplyListening} className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-lg text-[10px] font-medium text-violet-300/60 hover:text-violet-300 hover:bg-violet-500/10 border border-violet-500/10 transition-colors">
              <RotateCcw className="h-3 w-3" /> Re-dictate
            </button>
            <button onClick={() => { setEditText(transcript); setIsEditing(true) }} className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-lg text-[10px] font-medium text-violet-300/60 hover:text-violet-300 hover:bg-violet-500/10 border border-violet-500/10 transition-colors">
              <Edit3 className="h-3 w-3" /> Edit
            </button>
            <button onClick={onStop} className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-lg text-[10px] font-medium text-zinc-500 hover:text-zinc-300 hover:bg-zinc-500/10 border border-zinc-500/10 transition-colors">
              <X className="h-3 w-3" /> Discard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
