'use client'
import * as React from 'react'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { SupraLeoAvatar, type LeoState } from './SupraLeoAvatar'

// ─── Design System CSS ────────────────────────────────────────────────────────
const BADGE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@300;400&display=swap');

[data-ax] {
  --ax-bg:       #060D1A;
  --ax-bg2:      #0A1628;
  --ax-surface:  #0F1E35;
  --ax-surface2: #162440;
  --ax-border:   rgba(59,130,246,0.14);
  --ax-border2:  rgba(255,255,255,0.06);
  --ax-accent:   #3B82F6;
  --ax-accent2:  #60A5FA;
  --ax-orange:   #F59E0B;
  --ax-silver:   #94AFC6;
  --ax-text1:    rgba(220,235,255,0.95);
  --ax-text2:    rgba(140,175,220,0.68);
  --ax-text3:    rgba(80,130,185,0.38);
  --ax-green:    #10B981;
  --ax-red:      #EF4444;
  --ax-sh:       0 2px 12px rgba(0,0,0,0.55), 0 8px 32px rgba(0,0,0,0.40);
  --ax-shlg:     0 4px 24px rgba(59,130,246,0.15), 0 12px 48px rgba(0,0,0,0.55);
  --ax-glass:    rgba(15,30,53,0.85);
  font-family: 'DM Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* System light mode */
@media (prefers-color-scheme: light) {
  [data-ax] {
    --ax-bg:       #F0F5FB;
    --ax-bg2:      #E2ECF8;
    --ax-surface:  #FFFFFF;
    --ax-surface2: #F4F8FE;
    --ax-border:   rgba(37,99,235,0.14);
    --ax-border2:  rgba(0,0,0,0.08);
    --ax-accent:   #2563EB;
    --ax-accent2:  #3B82F6;
    --ax-silver:   #6B8BAE;
    --ax-text1:    #0B1F3A;
    --ax-text2:    rgba(10,50,100,0.70);
    --ax-text3:    rgba(10,50,100,0.40);
    --ax-sh:       0 2px 12px rgba(0,0,0,0.08), 0 6px 24px rgba(37,99,235,0.08);
    --ax-shlg:     0 4px 20px rgba(37,99,235,0.18), 0 10px 40px rgba(0,0,0,0.10);
    --ax-glass:    rgba(255,255,255,0.92);
  }
}

/* Class-based dark override */
.dark [data-ax] {
  --ax-bg:       #060D1A;
  --ax-bg2:      #0A1628;
  --ax-surface:  #0F1E35;
  --ax-surface2: #162440;
  --ax-border:   rgba(59,130,246,0.14);
  --ax-border2:  rgba(255,255,255,0.06);
  --ax-accent:   #3B82F6;
  --ax-accent2:  #60A5FA;
  --ax-text1:    rgba(220,235,255,0.95);
  --ax-text2:    rgba(140,175,220,0.68);
  --ax-text3:    rgba(80,130,185,0.38);
  --ax-sh:       0 2px 12px rgba(0,0,0,0.55), 0 8px 32px rgba(0,0,0,0.40);
  --ax-shlg:     0 4px 24px rgba(59,130,246,0.15), 0 12px 48px rgba(0,0,0,0.55);
  --ax-glass:    rgba(15,30,53,0.85);
}

/* Class-based light override */
.light [data-ax] {
  --ax-bg:       #F0F5FB;
  --ax-bg2:      #E2ECF8;
  --ax-surface:  #FFFFFF;
  --ax-surface2: #F4F8FE;
  --ax-border:   rgba(37,99,235,0.14);
  --ax-border2:  rgba(0,0,0,0.08);
  --ax-accent:   #2563EB;
  --ax-accent2:  #3B82F6;
  --ax-text1:    #0B1F3A;
  --ax-text2:    rgba(10,50,100,0.70);
  --ax-text3:    rgba(10,50,100,0.40);
  --ax-sh:       0 2px 12px rgba(0,0,0,0.08), 0 6px 24px rgba(37,99,235,0.08);
  --ax-shlg:     0 4px 20px rgba(37,99,235,0.18), 0 10px 40px rgba(0,0,0,0.10);
  --ax-glass:    rgba(255,255,255,0.92);
}

/* ── Keyframes ── */
@keyframes ax-breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.004)} }
@keyframes ax-dot     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.25;transform:scale(.65)} }
@keyframes ax-in      { from{opacity:0;transform:translateY(9px) scale(.985)} to{opacity:1;transform:translateY(0) scale(1)} }
@keyframes ax-shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
@keyframes ax-scan    { 0%{top:0;opacity:.6} 100%{top:100%;opacity:0} }

/* ── Badge ── */
[data-ax] .ax-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 7px 14px 7px 7px;
  background: var(--ax-glass);
  border: 1px solid var(--ax-border);
  border-radius: 12px;
  box-shadow: var(--ax-sh);
  cursor: pointer;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: border-color .2s, box-shadow .2s, transform .12s;
  position: relative;
  overflow: hidden;
  outline: none;
  animation: ax-breathe 5s ease-in-out infinite;
  min-width: 160px;
}
[data-ax] .ax-badge::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--ax-accent2) 30%, rgba(255,255,255,0.8) 50%, var(--ax-accent2) 70%, transparent 100%);
  background-size: 200% 100%;
  animation: ax-shimmer 3.5s linear infinite;
}
[data-ax] .ax-badge::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 20%, var(--ax-accent)33 50%, transparent 80%);
}
[data-ax] .ax-badge:hover {
  border-color: rgba(59,130,246,0.35);
  box-shadow: var(--ax-shlg);
  transform: translateY(-2px);
}
[data-ax] .ax-badge:active { transform: translateY(0) scale(.98); }

/* ── Badge text ── */
[data-ax] .ax-name {
  font-family: 'Rajdhani', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: var(--ax-accent2);
  letter-spacing: .10em;
  line-height: 1;
  display: block;
  margin-bottom: 3px;
  text-transform: uppercase;
}
[data-ax] .ax-slogan {
  font-family: 'JetBrains Mono', monospace;
  font-size: 7px;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--ax-text3);
  display: block;
  margin-bottom: 3px;
}
[data-ax] .ax-status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--ax-text2);
}
[data-ax] .ax-dot {
  width: 4px; height: 4px;
  border-radius: 50%;
  flex-shrink: 0;
}
[data-ax] .ax-mod-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 7px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--ax-accent)88;
  margin-top: 2px;
}

/* ── Toolbar variant ── */
[data-ax] .ax-toolbar {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px 5px 5px;
  background: var(--ax-glass);
  border: 1px solid var(--ax-border);
  border-radius: 10px;
  box-shadow: var(--ax-sh);
  cursor: pointer;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all .18s;
  position: relative;
  overflow: hidden;
  outline: none;
}
[data-ax] .ax-toolbar::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 5%, var(--ax-accent2) 35%, rgba(255,255,255,.7) 50%, var(--ax-accent2) 65%, transparent 95%);
  background-size: 200% 100%;
  animation: ax-shimmer 4s linear infinite;
}
[data-ax] .ax-toolbar:hover {
  border-color: rgba(59,130,246,.3);
  box-shadow: var(--ax-shlg);
}

/* ── Panel wrap ── */
[data-ax] .ax-panel-wrap { animation: ax-in .28s cubic-bezier(.16,1,.3,1) forwards; }

/* ── Module chip ── */
[data-ax] .ax-mod-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 7px;
  letter-spacing: .1em;
  padding: 2px 6px;
  border-radius: 99px;
  border: 1px solid var(--ax-accent)30;
  background: var(--ax-accent)12;
  color: var(--ax-accent2);
  margin-top: 3px;
  text-transform: uppercase;
}
`

function injectBadgeCSS() {
  if (typeof document === 'undefined') return
  if (document.getElementById('ax-badge-v1')) return
  const el = document.createElement('style')
  el.id = 'ax-badge-v1'
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

interface LoadedPanelProps {
  state: LeoState
  module: string
  fromPath: string
  email: null
  message: LeoMessage | null
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
  onSetTranscript: (t: string) => void
  onSendReply: () => Promise<void>
}

// ─── Module detection ─────────────────────────────────────────────────────────
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

// ─── State dot config ─────────────────────────────────────────────────────────
const DOTS: Record<LeoState, { color: string; pulse: boolean; label: string }> = {
  idle:              { color: 'rgba(59,130,246,.35)', pulse: false, label: 'Standby' },
  listening:         { color: '#10B981',              pulse: true,  label: 'Listening' },
  speaking:          { color: '#F59E0B',              pulse: true,  label: 'Speaking' },
  thinking:          { color: '#8B5CF6',              pulse: true,  label: 'Processing' },
  reading:           { color: '#06B6D4',              pulse: true,  label: 'Reading' },
  'waiting-command': { color: '#10B981',              pulse: false, label: 'Awaiting' },
  error:             { color: '#EF4444',              pulse: false, label: 'Error' },
}

// ─── Badge component ──────────────────────────────────────────────────────────
function AutrixBadge({ state, onClick, module }: { state: LeoState; onClick: () => void; module: string }) {
  const d = DOTS[state]
  const showMod = module !== 'general'

  return (
    <div data-ax>
      <button className="ax-badge" onClick={onClick} aria-label="Open Autrix AI">
        <SupraLeoAvatar state={state} size={42} animate />
        <div style={{ minWidth: 0 }}>
          <span className="ax-name">Suprah Autrix</span>
          <span className="ax-slogan">Driven by Intelligence</span>
          <div className="ax-status">
            <div
              className="ax-dot"
              style={{
                background: d.color,
                boxShadow: d.pulse ? `0 0 6px ${d.color}` : 'none',
                animation: d.pulse ? 'ax-dot 1.4s ease-in-out infinite' : 'none',
              }}
            />
            {d.label}
          </div>
          {showMod && (
            <div className="ax-mod-chip">
              ◈ {MODULE_LABELS[module]}
            </div>
          )}
        </div>
      </button>
    </div>
  )
}

// ─── Toolbar badge ────────────────────────────────────────────────────────────
function AutrixToolbarBadge({ state, onClick }: { state: LeoState; onClick: () => void }) {
  const d = DOTS[state]
  return (
    <div data-ax>
      <button className="ax-toolbar" onClick={onClick} aria-label="Open Autrix AI">
        <SupraLeoAvatar state={state} size={30} animate />
        <div>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, fontWeight: 700, color: 'var(--ax-accent2)', letterSpacing: '.10em', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
            Autrix
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'JetBrains Mono',monospace", fontSize: 7, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ax-text3)' }}>
            <div style={{
              width: 3.5, height: 3.5, borderRadius: '50%', background: d.color,
              boxShadow: d.pulse ? `0 0 5px ${d.color}` : 'none',
              animation: d.pulse ? 'ax-dot 1.4s ease-in-out infinite' : 'none',
              flexShrink: 0,
            }} />
            {d.label}
          </div>
        </div>
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
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
  const [Panel, setPanel] = useState<React.ComponentType<LoadedPanelProps> | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const currentModule = detectModule(pathname || '')
  const isLeft = position === 'bottom-left'
  const floatingStyles = {
    bottom: 'var(--supra-leo-bottom, var(--leo-bottom, 22px))',
    ...(isLeft
      ? { left: 'var(--supra-leo-side, var(--leo-side, 22px))' }
      : { right: 'var(--supra-leo-side, var(--leo-side, 22px))' }),
  }

  useEffect(() => { injectBadgeCSS() }, [])

  // Lazy-load panel
  useEffect(() => {
    import('./SupraLeoPanel').then(m => {
      setPanel(() => m.SupraLeoPanel as React.ComponentType<LoadedPanelProps>)
    })
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

  // Auto-open on active state
  useEffect(() => {
    if (state !== 'idle' && state !== 'error') setOpen(true)
  }, [state])

  const close = () => { setOpen(false); onStop() }

  const panelProps = Panel ? {
    state,
    module: currentModule,
    fromPath: pathname || '/crm/dashboard',
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
        <AutrixToolbarBadge state={state} onClick={() => setOpen(p => !p)} />
        {open && Panel && panelProps && (
          <div data-ax style={{ position: 'absolute', right: 0, top: 'calc(100% + 10px)', zIndex: 9999 }}>
            <div className="ax-panel-wrap"><Panel {...panelProps} /></div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className="supra-floating-widget"
      data-panel-open={open ? 'true' : 'false'}
      data-position={position}
      style={{
        position: 'fixed',
        ...floatingStyles,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: isLeft ? 'flex-start' : 'flex-end',
        gap: 12,
      }}
    >
      {open && Panel && panelProps && (
        <div data-ax>
          <div className="ax-panel-wrap"><Panel {...panelProps} /></div>
        </div>
      )}
      {!open && <AutrixBadge state={state} module={currentModule} onClick={() => setOpen(p => !p)} />}
    </div>
  )
}

export default SupraLeoAI
