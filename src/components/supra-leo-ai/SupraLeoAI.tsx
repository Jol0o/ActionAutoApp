// ─── Supra Leo AI · Main Widget ──────────────────────────────────────────────

'use client'

import * as React from 'react'
import { useSupraLeoAI } from '@/hooks/useSupraLeoAI'
import { SupraLeoAvatar } from './SupraLeoAvatar'
import { SupraLeoPanel } from './SupraLeoPanel'

interface Props {
  position?: 'bottom-right' | 'bottom-left'
  variant?: 'floating' | 'toolbar'
}

export function SupraLeoAI({ position = 'bottom-right', variant = 'floating' }: Props) {
  const [panelOpen, setPanelOpen] = React.useState(false)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const ai = useSupraLeoAI()

  // Listen for "read message" events with full lead data
  React.useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail
      if (d?.leadId) {
        setPanelOpen(true)
        ai.readLead({
          leadId: d.leadId,
          firstName: d.firstName, lastName: d.lastName,
          senderName: d.senderName, senderEmail: d.senderEmail,
          email: d.email, subject: d.subject,
          body: d.body, status: d.status,
        })
      }
    }
    window.addEventListener('supraleo:read-message', handler)
    return () => window.removeEventListener('supraleo:read-message', handler)
  }, [ai.readLead])

  // Close panel on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setPanelOpen(false)
    }
    if (panelOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [panelOpen])

  const handleClose = () => { ai.dismiss(); setPanelOpen(false) }

  const panelProps = {
    state: ai.state,
    email: ai.email,
    message: ai.message,
    errorMsg: ai.errorMsg,
    voiceName: ai.voiceName,
    transcript: ai.transcript,
    onStop: ai.stop,
    onPause: ai.pauseSpeech,
    onResume: ai.resumeSpeech,
    onClose: handleClose,
    onReplay: () => {
      if (ai.message) {
        ai.readLead({
          leadId: ai.message.leadId,
          senderName: ai.message.sender,
          senderEmail: ai.message.senderEmail,
          subject: ai.message.subject,
          body: ai.message.body,
          status: ai.message.status,
        })
      }
    },
    onStartListeningForCommand: ai.startListeningForCommand,
    onStartReplyListening: ai.startReplyListening,
    onSetTranscript: ai.setTranscript,
    onSendReply: ai.sendReply,
  }

  // ── Toolbar variant ──
  if (variant === 'toolbar') {
    return (
      <div ref={panelRef} className="relative inline-flex">
        <button
          onClick={() => setPanelOpen(p => !p)}
          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-all duration-200 border ${
            panelOpen || ai.state !== 'idle'
              ? 'bg-violet-600 text-white border-violet-500 shadow-sm shadow-violet-500/20'
              : 'bg-card text-violet-600 dark:text-violet-400 border-violet-500/30 hover:bg-violet-500/10 hover:border-violet-500/50'
          }`}
        >
          <span className="text-base leading-none">🦁</span> Supra Leo
          {ai.state !== 'idle' && <span className="h-1.5 w-1.5 rounded-full bg-violet-300 animate-pulse" />}
        </button>
        {panelOpen && (
          <div className="absolute right-0 top-full mt-2 z-[9999] animate-in slide-in-from-top-2 fade-in duration-200">
            <SupraLeoPanel {...panelProps} />
          </div>
        )}
      </div>
    )
  }

  // ── Floating variant ──
  const posClass = position === 'bottom-left' ? 'bottom-6 left-6' : 'bottom-6 right-6'

  return (
    <div ref={panelRef} className={`fixed ${posClass} z-[9999] flex flex-col items-end gap-3`}>
      {panelOpen && (
        <div className="animate-in slide-in-from-bottom-4 fade-in duration-200">
          <SupraLeoPanel {...panelProps} />
        </div>
      )}
      <div className="flex items-center gap-2 self-end">
        {!panelOpen && (
          <div className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-[#0f0a1e]/90 border border-violet-500/30 text-violet-300 shadow-lg backdrop-blur-sm animate-in fade-in duration-300">
            Supra Leo AI
          </div>
        )}
        <SupraLeoAvatar state={ai.state} onClick={() => setPanelOpen(p => !p)} size="md" />
      </div>
    </div>
  )
}
