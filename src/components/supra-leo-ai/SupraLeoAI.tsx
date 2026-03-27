'use client'
import * as React from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { SupraLeoAvatar, type LeoState } from './SupraLeoAvatar'

// ─── Badge CSS (same as before) ───────────────────────────────────────────────
const BADGE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400&display=swap');

[data-sl] {
  --slb-g:    #b8892e; --slb-g2:   #d4a84b; --slb-gd:   rgba(184,137,46,0.09);
  --slb-gb:   rgba(184,137,46,0.18); --slb-surf: #ffffff; --slb-bg2:  #f6f4f0;
  --slb-bd:   rgba(184,137,46,0.15); --slb-bd2:  rgba(0,0,0,0.07);
  --slb-tx:   #1a1610; --slb-tx2:  #574e3e; --slb-tx3:  rgba(80,68,50,0.46);
  --slb-rad:  3px;
  --slb-sh:   0 1px 4px rgba(0,0,0,0.08), 0 4px 14px rgba(0,0,0,0.05);
  --slb-shlg: 0 3px 14px rgba(0,0,0,0.1), 0 10px 36px rgba(0,0,0,0.07);
}
@media (prefers-color-scheme: dark) {
  [data-sl] {
    --slb-surf: #17140e; --slb-bg2: #1e1a13; --slb-bd: rgba(184,137,46,0.2);
    --slb-bd2: rgba(255,255,255,0.06); --slb-tx: rgba(250,244,232,0.92);
    --slb-tx2: rgba(218,196,162,0.64); --slb-tx3: rgba(218,196,162,0.32);
    --slb-sh: 0 1px 4px rgba(0,0,0,0.48), 0 4px 14px rgba(0,0,0,0.38);
    --slb-shlg: 0 3px 14px rgba(0,0,0,0.55), 0 10px 36px rgba(0,0,0,0.42);
  }
}
.dark [data-sl] {
  --slb-surf: #17140e; --slb-bg2: #1e1a13; --slb-bd: rgba(184,137,46,0.2);
  --slb-bd2: rgba(255,255,255,0.06); --slb-tx: rgba(250,244,232,0.92);
  --slb-tx2: rgba(218,196,162,0.64); --slb-tx3: rgba(218,196,162,0.32);
  --slb-sh: 0 1px 4px rgba(0,0,0,0.48), 0 4px 14px rgba(0,0,0,0.38);
  --slb-shlg: 0 3px 14px rgba(0,0,0,0.55), 0 10px 36px rgba(0,0,0,0.42);
}

@keyframes slb-breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.005)} }
@keyframes slb-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(.72)} }
@keyframes slb-in { from{opacity:0;transform:translateY(7px) scale(.99)} to{opacity:1;transform:translateY(0) scale(1)} }

[data-sl] .slb-badge {
  display:inline-flex; align-items:center; gap:10px;
  padding:6px 14px 6px 6px;
  background:var(--slb-surf); border:1px solid var(--slb-bd);
  border-radius:var(--slb-rad); box-shadow:var(--slb-sh);
  cursor:pointer; font-family:'DM Sans',sans-serif;
  transition:border-color .18s, box-shadow .18s, transform .12s;
  position:relative; overflow:hidden; outline:none;
  animation:slb-breathe 4.5s ease-in-out infinite;
}
[data-sl] .slb-badge::before {
  content:''; position:absolute; top:0; left:0; right:0; height:1px;
  background:linear-gradient(90deg,transparent 5%,var(--slb-g2) 35%,#e8c060 50%,var(--slb-g2) 65%,transparent 95%);
}
[data-sl] .slb-badge:hover { border-color:var(--slb-gb); box-shadow:var(--slb-shlg); transform:translateY(-1px); }
[data-sl] .slb-badge:active { transform:scale(.98); }
[data-sl] .slb-name { font-family:'Playfair Display',serif; font-size:13px; font-weight:600; color:var(--slb-g2); letter-spacing:.08em; line-height:1; display:block; margin-bottom:3px; }
[data-sl] .slb-status { display:flex; align-items:center; gap:4px; font-family:'JetBrains Mono',monospace; font-size:7.5px; letter-spacing:.17em; text-transform:uppercase; color:var(--slb-tx3); }
[data-sl] .slb-dot { width:4px; height:4px; border-radius:50%; flex-shrink:0; }
[data-sl] .slb-module-hint { font-family:'JetBrains Mono',monospace; font-size:7px; letter-spacing:.1em; text-transform:uppercase; color:rgba(184,137,46,0.5); margin-top:2px; }

[data-sl] .slb-toolbar {
  display:inline-flex; align-items:center; gap:8px;
  padding:4px 11px 4px 4px;
  background:var(--slb-surf); border:1px solid var(--slb-bd);
  border-radius:var(--slb-rad); box-shadow:var(--slb-sh);
  cursor:pointer; transition:all .16s;
  position:relative; overflow:hidden; outline:none;
}
[data-sl] .slb-toolbar::before {
  content:''; position:absolute; top:0; left:0; right:0; height:1px;
  background:linear-gradient(90deg,transparent 5%,var(--slb-g2) 35%,#e8c060 50%,var(--slb-g2) 65%,transparent 95%);
}
[data-sl] .slb-toolbar:hover { border-color:var(--slb-gb); box-shadow:var(--slb-shlg); }
[data-sl] .slb-panel-wrap { animation:slb-in .26s cubic-bezier(.16,1,.3,1) forwards; }
`

function injectBadgeCSS() {
  if (typeof document === 'undefined') return
  if (document.getElementById('sl-badge-v6')) return
  const el = document.createElement('style')
  el.id = 'sl-badge-v6'
  el.textContent = BADGE_CSS
  document.head.appendChild(el)
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type { LeoState }

export interface LeoMessage {
  sender?: string; senderEmail?: string
  subject?: string; snippet?: string; status?: string
}

export interface SupraLeoAIProps {
  variant?: 'floating' | 'toolbar'
  position?: 'bottom-right' | 'bottom-left'
  state?: LeoState
  message?: LeoMessage | null
  transcript?: string
  voiceName?: string | null
  errorMsg?: string | null
  onStop?: () => void
  onPause?: () => void
  onResume?: () => void
  onReplay?: () => void
  onListen?: () => void
  onVoiceReply?: () => void
  onSendReply?: (t: string) => void
  onSetTranscript?: (t: string) => void
}

// ─── Module detection from pathname ──────────────────────────────────────────
function detectModule(pathname: string): string {
  if (pathname.includes('/appointments')) return 'appointments'
  if (pathname.includes('/timeproof')) return 'timeproof'
  if (pathname.includes('/supra-space')) return 'supraspace'
  if (pathname.includes('/biometric')) return 'biometrics'
  if (pathname.includes('/feeds')) return 'feeds'
  if (pathname.includes('/supra-leo')) return 'general'
  return 'general'
}

const MODULE_LABELS: Record<string, string> = {
  appointments: 'Appointments',
  timeproof: 'Timeproof',
  supraspace: 'Supra Space',
  biometrics: 'Biometrics',
  feeds: 'Feeds',
  general: 'CRM',
}

// ─── Dot config ───────────────────────────────────────────────────────────────
const DOTS: Record<LeoState, { color: string; pulse: boolean; label: string }> = {
  idle:              { color: 'rgba(184,137,46,.4)', pulse: false, label: 'Standby' },
  listening:         { color: '#2a7048',             pulse: true,  label: 'Listening' },
  speaking:          { color: '#b8892e',             pulse: true,  label: 'Speaking' },
  thinking:          { color: '#b8892e',             pulse: true,  label: 'Processing' },
  reading:           { color: '#b8892e',             pulse: true,  label: 'Reading' },
  'waiting-command': { color: '#2a7048',             pulse: false, label: 'Done reading' },
  error:             { color: '#b83428',             pulse: false, label: 'Error' },
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function LeoBadge({ state, onClick, module }: { state: LeoState; onClick: () => void; module: string }) {
  const d = DOTS[state]
  return (
    <div data-sl>
      <button className="slb-badge" onClick={onClick} aria-label="Open Supra Leo AI">
        <SupraLeoAvatar state={state} size={38} animate />
        <div>
          <span className="slb-name">Supra Leo</span>
          <div className="slb-status">
            <div className="slb-dot" style={{ background: d.color, animation: d.pulse ? 'slb-dot 1.3s ease-in-out infinite' : 'none' }} />
            {d.label}
          </div>
          {module !== 'general' && (
            <div className="slb-module-hint">{MODULE_LABELS[module]}</div>
          )}
        </div>
      </button>
    </div>
  )
}

// ─── Toolbar Badge ────────────────────────────────────────────────────────────
function LeoToolbarBadge({ state, onClick, module }: { state: LeoState; onClick: () => void; module: string }) {
  const d = DOTS[state]
  return (
    <div data-sl>
      <button className="slb-toolbar" onClick={onClick} aria-label="Open Supra Leo AI">
        <SupraLeoAvatar state={state} size={28} animate />
        <div>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 11, fontWeight: 600, color: 'var(--slb-g2)', letterSpacing: '.07em', lineHeight: 1, display: 'block', marginBottom: 2 }}>
            Supra Leo
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'JetBrains Mono',monospace", fontSize: 7, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--slb-tx3)' }}>
            <div style={{ width: 3.5, height: 3.5, borderRadius: '50%', background: d.color, animation: d.pulse ? 'slb-dot 1.3s ease-in-out infinite' : 'none', flexShrink: 0 }} />
            {d.label}
          </div>
        </div>
      </button>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────
export function SupraLeoAI({
  variant = 'floating',
  position = 'bottom-right',
  state = 'idle',
  message = null,
  transcript = '',
  voiceName = null,
  errorMsg = null,
  onStop = () => {},
  onPause = () => {},
  onResume = () => {},
  onReplay = () => {},
  onListen = () => {},
  onVoiceReply = () => {},
  onSendReply = () => {},
  onSetTranscript = () => {},
}: SupraLeoAIProps) {
  const [open, setOpen] = useState(false)
  const [Panel, setPanel] = useState<React.ComponentType<any> | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const currentModule = detectModule(pathname || '')

  useEffect(() => { injectBadgeCSS() }, [])

  // Lazy-load Panel
  useEffect(() => {
    import('./SupraLeoPanel').then(m => setPanel(() => m.SupraLeoPanel))
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  // Listen for read-message events
  useEffect(() => {
    const h = (e: Event) => {
      if ((e as CustomEvent).detail?.leadId) setOpen(true)
    }
    window.addEventListener('supraleo:read-message', h)
    return () => window.removeEventListener('supraleo:read-message', h)
  }, [])

  // Auto-open on module navigation if there's active context
  useEffect(() => {
    if (state !== 'idle' && state !== 'error') setOpen(true)
  }, [state])

  const close = () => { setOpen(false); onStop() }
  const isLeft = position === 'bottom-left'

  const panelProps = Panel ? {
    state: state as any,
    email: null,
    message,
    errorMsg,
    voiceName,
    transcript,
    onStop, onPause, onResume,
    onClose: close, onReplay,
    onStartListeningForCommand: onListen,
    onStartReplyListening: onVoiceReply,
    onSetTranscript,
    onSendReply: async () => onSendReply(transcript),
  } : null

  if (variant === 'toolbar') {
    return (
      <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
        <LeoToolbarBadge state={state} module={currentModule} onClick={() => setOpen(p => !p)} />
        {open && Panel && panelProps && (
          <div data-sl style={{ position: 'absolute', right: 0, top: 'calc(100% + 10px)', zIndex: 9999 }}>
            <div className="slb-panel-wrap"><Panel {...panelProps} /></div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        bottom: 'var(--leo-bottom, 22px)',
        ...(isLeft ? { left: 'var(--leo-side, 22px)' } : { right: 'var(--leo-side, 22px)' }),
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: isLeft ? 'flex-start' : 'flex-end',
        gap: 12,
      }}
    >
      {open && Panel && panelProps && (
        <div data-sl>
          <div className="slb-panel-wrap"><Panel {...panelProps} /></div>
        </div>
      )}
      <LeoBadge state={state} module={currentModule} onClick={() => setOpen(p => !p)} />
    </div>
  )
}

export default SupraLeoAI