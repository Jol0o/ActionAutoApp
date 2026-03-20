'use client'

import * as React from 'react'
import { useState, useEffect, useRef } from 'react'

// ─── Types & Constants ────────────────────────────────────────────────────────
type AIState = 'idle' | 'reading' | 'speaking' | 'listening' | 'thinking' | 'error'
const STATES: AIState[] = ['idle', 'reading', 'speaking', 'listening', 'thinking', 'error']

type Variant = 'floating' | 'toolbar'
type Position = 'bottom-right' | 'bottom-left'
type AvatarSize = 'sm' | 'md' | 'lg'
type ActionBtnVariant = 'default' | 'danger'

interface MessageInfo {
  leadId?: string
  sender?: string
  senderEmail?: string
  subject?: string
  body?: string
  status?: string
}

interface PanelProps {
  state: AIState
  email?: string
  message?: MessageInfo | null
  errorMsg?: string | null
  voiceName?: string | null
  transcript?: string | null
  onStop?: () => void
  onPause?: () => void
  onResume?: () => void
  onClose?: () => void
  onReplay?: () => void
  onStartListeningForCommand?: () => void
  onStartReplyListening?: () => void
  onSetTranscript?: (t: string) => void
  onSendReply?: (text: string) => void
}

// ─── Keyframe Injection ───────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap');

  @keyframes supra-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.92); }
  }
  @keyframes supra-orbit {
    from { transform: rotate(0deg) translateX(20px) rotate(0deg); }
    to   { transform: rotate(360deg) translateX(20px) rotate(-360deg); }
  }
  @keyframes supra-orbit2 {
    from { transform: rotate(120deg) translateX(20px) rotate(-120deg); }
    to   { transform: rotate(480deg) translateX(20px) rotate(-480deg); }
  }
  @keyframes supra-orbit3 {
    from { transform: rotate(240deg) translateX(20px) rotate(-240deg); }
    to   { transform: rotate(600deg) translateX(20px) rotate(-600deg); }
  }
  @keyframes supra-slide-up {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes supra-glow {
    0%, 100% { box-shadow: 0 0 20px 2px rgba(251,191,36,0.25), 0 0 60px 4px rgba(251,191,36,0.08); }
    50%       { box-shadow: 0 0 28px 4px rgba(251,191,36,0.38), 0 0 80px 8px rgba(251,191,36,0.14); }
  }
  @keyframes supra-bar {
    0%, 100% { transform: scaleY(0.3); }
    50%       { transform: scaleY(1); }
  }
  @keyframes supra-scan {
    0%   { transform: translateY(-100%); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { transform: translateY(100%); opacity: 0; }
  }
  @keyframes supra-think {
    0%, 100% { transform: scale(1); opacity: 1; }
    33%       { transform: scale(1.4); opacity: 0.5; }
  }
  @keyframes supra-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes supra-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  .supra-font-display { font-family: 'Cinzel', serif; }
  .supra-font-body    { font-family: 'DM Sans', sans-serif; }

  .supra-panel {
    animation: supra-slide-up 0.28s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .supra-avatar-glow {
    animation: supra-glow 2.4s ease-in-out infinite;
  }
  .supra-avatar-pulse {
    animation: supra-pulse 1.8s ease-in-out infinite;
  }
  .supra-bar-1 { animation: supra-bar 0.9s ease-in-out infinite; animation-delay: 0s; }
  .supra-bar-2 { animation: supra-bar 0.9s ease-in-out infinite; animation-delay: 0.15s; }
  .supra-bar-3 { animation: supra-bar 0.9s ease-in-out infinite; animation-delay: 0.3s; }
  .supra-bar-4 { animation: supra-bar 0.9s ease-in-out infinite; animation-delay: 0.45s; }
  .supra-bar-5 { animation: supra-bar 0.9s ease-in-out infinite; animation-delay: 0.6s; }

  .supra-dot-1 { animation: supra-think 1.2s ease-in-out infinite; animation-delay: 0s; }
  .supra-dot-2 { animation: supra-think 1.2s ease-in-out infinite; animation-delay: 0.2s; }
  .supra-dot-3 { animation: supra-think 1.2s ease-in-out infinite; animation-delay: 0.4s; }

  .supra-orbit-1 { animation: supra-orbit  2.8s linear infinite; }
  .supra-orbit-2 { animation: supra-orbit2 2.8s linear infinite; }
  .supra-orbit-3 { animation: supra-orbit3 2.8s linear infinite; }

  .supra-scan { animation: supra-scan 2s ease-in-out infinite; }

  .supra-shimmer-text {
    background: linear-gradient(90deg, #fbbf24 0%, #fef3c7 40%, #f59e0b 60%, #fbbf24 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: supra-shimmer 3s linear infinite;
  }

  .supra-glass {
    background: rgba(10, 8, 18, 0.88);
    backdrop-filter: blur(24px) saturate(1.6);
    -webkit-backdrop-filter: blur(24px) saturate(1.6);
    border: 1px solid rgba(251, 191, 36, 0.15);
  }

  .supra-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(251,191,36,0.2), transparent);
  }

  .supra-btn {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.18s ease;
    outline: none;
    border: none;
  }
  .supra-btn:hover { filter: brightness(1.15); }
  .supra-btn:active { transform: scale(0.97); }

  .supra-tag {
    animation: supra-fade-in 0.4s ease;
  }

  .supra-noise {
    position: absolute; inset: 0; pointer-events: none; border-radius: inherit;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    opacity: 0.3;
  }
`

// ─── Avatar ───────────────────────────────────────────────────────────────────
interface AvatarProps {
  state: AIState
  onClick: () => void
  size?: AvatarSize
}

function Avatar({ state, onClick, size = 'md' }: AvatarProps) {
  const dim = size === 'sm' ? 36 : size === 'lg' ? 56 : 44
  const isActive = state !== 'idle'

  return (
    <button
      onClick={onClick}
      style={{
        width: dim, height: dim, borderRadius: '50%',
        background: 'radial-gradient(circle at 38% 38%, #1c1428 0%, #0a0812 100%)',
        border: `1.5px solid ${isActive ? 'rgba(251,191,36,0.5)' : 'rgba(251,191,36,0.22)'}`,
        cursor: 'pointer', position: 'relative', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, padding: 0, outline: 'none',
        transition: 'border-color 0.3s ease',
      }}
      className={isActive ? 'supra-avatar-glow' : ''}
    >
      {/* Orbiting particles when active */}
      {isActive && state !== 'error' && (
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%' }}>
          {(['supra-orbit-1', 'supra-orbit-2', 'supra-orbit-3'] as const).map((cls, i) => (
            <div key={i} className={cls} style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 4, height: 4, borderRadius: '50%', marginTop: -2, marginLeft: -2,
              background: i === 0 ? '#fbbf24' : i === 1 ? '#f59e0b88' : '#fde68a66',
            }} />
          ))}
        </div>
      )}

      {/* State icon */}
      <span
        style={{
          fontSize: dim * 0.42, lineHeight: 1, position: 'relative', zIndex: 1,
          filter: isActive ? 'drop-shadow(0 0 6px rgba(251,191,36,0.6))' : 'none',
          transition: 'filter 0.3s ease',
        }}
        className={state === 'reading' ? 'supra-avatar-pulse' : ''}
      >
        {state === 'error' ? '⚠️' : '🦁'}
      </span>

      {/* State indicator dot */}
      {isActive && (
        <div style={{
          position: 'absolute', bottom: 1, right: 1,
          width: 8, height: 8, borderRadius: '50%', border: '1.5px solid #0a0812',
          background: state === 'error' ? '#ef4444'
            : state === 'listening' ? '#22c55e'
              : state === 'speaking' ? '#3b82f6'
                : '#fbbf24',
          boxShadow: `0 0 8px ${state === 'error' ? '#ef4444' : state === 'listening' ? '#22c55e' : '#fbbf24'}`,
        }} className="supra-avatar-pulse" />
      )}
    </button>
  )
}

// ─── State Visualizer ─────────────────────────────────────────────────────────
interface StateVisualizerProps {
  state: AIState
}

function StateVisualizer({ state }: StateVisualizerProps) {
  if (state === 'idle') return null

  if (state === 'speaking') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 24 }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} className={`supra-bar-${i + 1}`} style={{
          width: 3, height: 18, borderRadius: 2,
          background: 'linear-gradient(to top, #f59e0b, #fde68a)',
          transformOrigin: 'bottom',
        }} />
      ))}
    </div>
  )

  if (state === 'listening') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 24 }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%', background: '#22c55e',
        boxShadow: '0 0 8px #22c55e',
      }} className="supra-avatar-pulse" />
      <span style={{
        fontSize: 10, color: '#22c55e', letterSpacing: '0.1em',
        fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
      }}>
        LISTENING
      </span>
    </div>
  )

  if (state === 'reading') return (
    <div style={{
      position: 'relative', width: 48, height: 24, overflow: 'hidden', borderRadius: 3,
      background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)',
    }}>
      <div className="supra-scan" style={{
        position: 'absolute', left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)',
      }} />
    </div>
  )

  if (state === 'thinking') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      {[...Array(3)].map((_, i) => (
        <div key={i} className={`supra-dot-${i + 1}`} style={{
          width: 5, height: 5, borderRadius: '50%',
          background: '#fbbf24', opacity: 0.8,
        }} />
      ))}
    </div>
  )

  return null
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
interface StatusBadgeProps {
  state: AIState
}

function StatusBadge({ state }: StatusBadgeProps) {
  const map: Record<AIState, { label: string; color: string; bg: string }> = {
    idle: { label: 'Ready', color: 'rgba(251,191,36,0.7)', bg: 'rgba(251,191,36,0.08)' },
    reading: { label: 'Reading', color: 'rgba(251,191,36,1)', bg: 'rgba(251,191,36,0.14)' },
    speaking: { label: 'Speaking', color: '#93c5fd', bg: 'rgba(59,130,246,0.14)' },
    listening: { label: 'Listening', color: '#86efac', bg: 'rgba(34,197,94,0.14)' },
    thinking: { label: 'Thinking', color: '#c4b5fd', bg: 'rgba(167,139,250,0.14)' },
    error: { label: 'Error', color: '#fca5a5', bg: 'rgba(239,68,68,0.14)' },
  }
  const { label, color, bg } = map[state]
  return (
    <span className="supra-tag" style={{
      fontSize: 9, fontWeight: 600, letterSpacing: '0.12em',
      textTransform: 'uppercase', color, background: bg,
      padding: '2px 7px', borderRadius: 20,
      border: `1px solid ${color}33`,
      fontFamily: 'DM Sans, sans-serif',
    }}>
      {label}
    </span>
  )
}

// ─── Panel ────────────────────────────────────────────────────────────────────
function Panel({
  state, email: _email, message, errorMsg, voiceName, transcript,
  onStop, onPause, onClose, onReplay,
  onStartListeningForCommand, onStartReplyListening, onSendReply,
}: PanelProps) {
  const [replyText, setReplyText] = useState('')

  const handleSend = () => {
    if (replyText.trim()) { onSendReply?.(replyText); setReplyText('') }
  }

  return (
    <div className="supra-glass supra-panel supra-font-body" style={{
      width: 320, borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(251,191,36,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
      position: 'relative',
    }}>
      <div className="supra-noise" />

      {/* Subtle gold gradient top edge */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent 0%, rgba(251,191,36,0.6) 50%, transparent 100%)',
      }} />

      {/* Header */}
      <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar state={state} onClick={() => { }} size="sm" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="supra-font-display" style={{
              fontSize: 12.5, letterSpacing: '0.12em', color: '#fde68a',
            }}>
              SUPRA LEO
            </span>
            <StatusBadge state={state} />
          </div>
          {voiceName && (
            <div style={{
              fontSize: 10, color: 'rgba(253,230,138,0.45)', marginTop: 1,
              letterSpacing: '0.05em', fontWeight: 300,
            }}>
              {voiceName}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StateVisualizer state={state} />
          <button
            onClick={onClose}
            style={{
              width: 24, height: 24, borderRadius: '50%', border: 'none',
              background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget
              el.style.background = 'rgba(239,68,68,0.15)'
              el.style.color = '#fca5a5'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget
              el.style.background = 'rgba(255,255,255,0.04)'
              el.style.color = 'rgba(255,255,255,0.35)'
            }}
          >×</button>
        </div>
      </div>

      <div className="supra-divider" />

      {/* Body */}
      <div style={{ padding: '14px 16px', minHeight: 80 }}>

        {/* Error state */}
        {state === 'error' && errorMsg && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8, padding: '10px 12px',
          }}>
            <div style={{
              fontSize: 10, color: '#fca5a5', fontWeight: 600, letterSpacing: '0.1em',
              textTransform: 'uppercase', marginBottom: 4,
            }}>Error</div>
            <div style={{ fontSize: 12, color: 'rgba(252,165,165,0.8)', lineHeight: 1.5 }}>{errorMsg}</div>
          </div>
        )}

        {/* Email / message info */}
        {message && (
          <div style={{ marginBottom: 12 }}>
            <div style={{
              background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.12)',
              borderRadius: 10, padding: '10px 12px',
            }}>
              {message.sender && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #92400e, #fbbf24)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: '#0a0812', flexShrink: 0,
                  }}>
                    {message.sender[0]?.toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 11.5, fontWeight: 500, color: '#fde68a',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {message.sender}
                    </div>
                    {message.senderEmail && (
                      <div style={{
                        fontSize: 9.5, color: 'rgba(253,230,138,0.4)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {message.senderEmail}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {message.subject && (
                <div style={{
                  fontSize: 11, color: 'rgba(253,230,138,0.7)', fontWeight: 500,
                  lineHeight: 1.4, letterSpacing: '0.01em',
                }}>
                  {message.subject}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transcript */}
        {transcript && (
          <div style={{ marginBottom: 12 }}>
            <div style={{
              fontSize: 9, color: 'rgba(251,191,36,0.45)', letterSpacing: '0.12em',
              textTransform: 'uppercase', marginBottom: 6, fontWeight: 600,
            }}>
              Transcript
            </div>
            <div style={{
              fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.65,
              maxHeight: 80, overflowY: 'auto', paddingRight: 4,
            }}>
              {transcript}
            </div>
          </div>
        )}

        {/* Idle placeholder */}
        {state === 'idle' && !message && !transcript && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{
              fontSize: 11, color: 'rgba(253,230,138,0.35)', lineHeight: 1.6,
              letterSpacing: '0.03em',
            }}>
              Open a lead message to activate<br />AI-powered assistance
            </div>
          </div>
        )}
      </div>

      {/* Reply input */}
      {(state === 'listening' || state === 'speaking' || !!message) && (
        <>
          <div className="supra-divider" />
          <div style={{ padding: '10px 12px 12px' }}>
            <div style={{
              display: 'flex', gap: 8, alignItems: 'flex-end',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(251,191,36,0.1)',
              borderRadius: 10, padding: '8px 10px',
              transition: 'border-color 0.2s',
            }}>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
                }}
                placeholder="Type a reply…"
                rows={1}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none', resize: 'none',
                  color: 'rgba(255,255,255,0.8)', fontSize: 12, lineHeight: 1.5,
                  fontFamily: 'DM Sans, sans-serif', padding: 0,
                }}
              />
              <button
                onClick={handleSend}
                className="supra-btn"
                style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: replyText.trim()
                    ? 'linear-gradient(135deg, #d97706, #fbbf24)'
                    : 'rgba(251,191,36,0.08)',
                  color: replyText.trim() ? '#0a0812' : 'rgba(251,191,36,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, transition: 'all 0.2s',
                }}
              >↑</button>
            </div>
          </div>
        </>
      )}

      {/* Action buttons */}
      <div className="supra-divider" />
      <div style={{ padding: '10px 12px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {state === 'speaking' && (
          <>
            <ActionBtn onClick={onPause} icon="⏸" label="Pause" />
            <ActionBtn onClick={onStop} icon="⏹" label="Stop" variant="danger" />
          </>
        )}
        {state === 'idle' && message && (
          <ActionBtn onClick={onReplay} icon="↺" label="Replay" />
        )}
        {(state === 'idle' || state === 'speaking') && (
          <ActionBtn onClick={onStartListeningForCommand} icon="⌘" label="Command" />
        )}
        {state !== 'listening' && message && (
          <ActionBtn onClick={onStartReplyListening} icon="🎤" label="Voice Reply" />
        )}
        {state === 'listening' && (
          <ActionBtn onClick={onStop} icon="⏹" label="Stop" variant="danger" />
        )}
      </div>
    </div>
  )
}

// ─── Action Button ─────────────────────────────────────────────────────────────
interface ActionBtnProps {
  onClick?: () => void
  icon: string
  label: string
  variant?: ActionBtnVariant
}

function ActionBtn({ onClick, icon, label, variant = 'default' }: ActionBtnProps) {
  const [hov, setHov] = useState(false)
  const isDanger = variant === 'danger'
  return (
    <button
      className="supra-btn"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        height: 26, padding: '0 10px', borderRadius: 7,
        background: hov
          ? isDanger ? 'rgba(239,68,68,0.18)' : 'rgba(251,191,36,0.14)'
          : isDanger ? 'rgba(239,68,68,0.07)' : 'rgba(251,191,36,0.06)',
        color: isDanger
          ? hov ? '#fca5a5' : 'rgba(252,165,165,0.65)'
          : hov ? '#fde68a' : 'rgba(253,230,138,0.55)',
        border: `1px solid ${isDanger
          ? hov ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.15)'
          : hov ? 'rgba(251,191,36,0.3)' : 'rgba(251,191,36,0.12)'}`,
      }}
    >
      <span style={{ fontSize: 11 }}>{icon}</span>
      {label}
    </button>
  )
}

// ─── Toolbar Variant ──────────────────────────────────────────────────────────
interface ToolbarVariantProps {
  state: AIState
  panelOpen: boolean
  onToggle: () => void
  panelProps: PanelProps
}

function ToolbarVariant({ state, panelOpen, onToggle, panelProps }: ToolbarVariantProps) {
  const [hov, setHov] = useState(false)
  const isActive = state !== 'idle' || panelOpen
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onClick={onToggle}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        className="supra-font-body"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          height: 34, padding: '0 14px', borderRadius: 10,
          border: `1px solid ${isActive ? 'rgba(251,191,36,0.4)' : hov ? 'rgba(251,191,36,0.25)' : 'rgba(251,191,36,0.12)'}`,
          background: isActive
            ? 'rgba(251,191,36,0.1)'
            : hov ? 'rgba(251,191,36,0.06)' : 'rgba(10,8,18,0.7)',
          color: isActive ? '#fde68a' : hov ? 'rgba(253,230,138,0.75)' : 'rgba(253,230,138,0.5)',
          cursor: 'pointer', outline: 'none', transition: 'all 0.18s',
          backdropFilter: 'blur(12px)',
          boxShadow: isActive ? '0 0 20px rgba(251,191,36,0.12)' : 'none',
        }}
      >
        <span style={{
          fontSize: 15, lineHeight: 1,
          filter: isActive ? 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' : 'none',
          transition: 'filter 0.3s',
        }}>🦁</span>
        <span className="supra-font-display" style={{ fontSize: 11, letterSpacing: '0.14em' }}>
          SUPRA LEO
        </span>
        {state !== 'idle' && (
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: '#fbbf24',
            boxShadow: '0 0 8px #fbbf24', flexShrink: 0,
          }} className="supra-avatar-pulse" />
        )}
      </button>
      {panelOpen && (
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 9999 }}>
          <Panel {...panelProps} />
        </div>
      )}
    </div>
  )
}

// ─── Floating Variant ─────────────────────────────────────────────────────────
interface FloatingVariantProps {
  position: Position
  state: AIState
  panelOpen: boolean
  onToggle: () => void
  panelProps: PanelProps
}

function FloatingVariant({ position, state, panelOpen, onToggle, panelProps }: FloatingVariantProps) {
  const isLeft = position === 'bottom-left'
  return (
    <div
      className="supra-floating-widget"
      data-position={position}
      data-panel-open={panelOpen ? 'true' : 'false'}
      style={{
        position: 'fixed',
        bottom: 'var(--supra-leo-bottom, 24px)',
        ...(isLeft
          ? { left: 'var(--supra-leo-side, 24px)' }
          : { right: 'var(--supra-leo-side, 24px)' }),
        zIndex: 9999,
        display: 'flex', flexDirection: 'column',
        alignItems: isLeft ? 'flex-start' : 'flex-end',
        gap: 12,
      }}>
      {panelOpen && <Panel {...panelProps} />}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        flexDirection: isLeft ? 'row' : 'row-reverse',
      }}>
        {!panelOpen && (
          <div className="supra-font-display supra-tag supra-floating-label" style={{
            padding: '6px 14px', borderRadius: 24,
            background: 'rgba(10,8,18,0.88)',
            border: '1px solid rgba(251,191,36,0.2)',
            fontSize: 10, letterSpacing: '0.18em',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          }}>
            <span className="supra-shimmer-text">SUPRA LEO</span>
          </div>
        )}
        <Avatar state={state} onClick={onToggle} size="md" />
      </div>
    </div>
  )
}

// ─── CSS Injector (singleton) ─────────────────────────────────────────────────
let cssInjected = false
function injectCSS() {
  if (cssInjected || typeof document === 'undefined') return
  const el = document.createElement('style')
  el.setAttribute('data-supra-leo', '1')
  el.textContent = CSS
  document.head.appendChild(el)
  cssInjected = true
}

// ─── SupraLeoAI — named export matching original interface ────────────────────
interface SupraLeoAIProps {
  position?: Position
  variant?: Variant
}

export function SupraLeoAI({ position = 'bottom-right', variant = 'floating' }: SupraLeoAIProps) {
  const [panelOpen, setPanelOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useSupraLeoAI } = require('@/hooks/useSupraLeoAI')
  const ai = useSupraLeoAI()

  useEffect(() => { injectCSS() }, [])

  useEffect(() => {
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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setPanelOpen(false)
    }
    if (panelOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [panelOpen])

  const handleClose = () => { ai.dismiss(); setPanelOpen(false) }

  const panelProps: PanelProps = {
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

  if (variant === 'toolbar') {
    return (
      <div ref={panelRef}>
        <ToolbarVariant
          state={ai.state}
          panelOpen={panelOpen}
          onToggle={() => setPanelOpen(p => !p)}
          panelProps={panelProps}
        />
      </div>
    )
  }

  return (
    <div ref={panelRef}>
      <FloatingVariant
        position={position}
        state={ai.state}
        panelOpen={panelOpen}
        onToggle={() => setPanelOpen(p => !p)}
        panelProps={panelProps}
      />
    </div>
  )
}

// ─── Demo / Preview Shell ─────────────────────────────────────────────────────
export default function SupraLeoDemo() {
  const [activeState, setActiveState] = useState<AIState>('idle')
  const [variant, setVariant] = useState<Variant>('floating')
  const [panelOpen, setPanelOpen] = useState(true)
  const panelRef = useRef<HTMLDivElement>(null)

  const mockMessage: MessageInfo | null = activeState !== 'idle' ? {
    leadId: 'lead_001',
    sender: 'Alexandra Chen',
    senderEmail: 'a.chen@venturegroup.com',
    subject: 'Re: Partnership Proposal Q2 2025',
    body: "Thank you for the detailed proposal. I'd like to schedule a call to discuss the terms.",
    status: 'unread',
  } : null

  const mockTranscript: string | null = activeState === 'speaking'
    ? '"Thank you for reaching out, Alexandra. I\'ve reviewed your message and I\'d be happy to arrange a meeting..."'
    : activeState === 'listening' ? 'Say a command or begin your reply…' : null

  const panelProps: PanelProps = {
    state: activeState,
    message: mockMessage,
    transcript: mockTranscript,
    voiceName: activeState !== 'idle' ? 'Aria · Neural' : null,
    errorMsg: activeState === 'error' ? 'Voice synthesis unavailable. Check your audio settings.' : null,
    onStop: () => setActiveState('idle'),
    onPause: () => { },
    onResume: () => { },
    onClose: () => { setActiveState('idle'); setPanelOpen(false) },
    onReplay: () => setActiveState('reading'),
    onStartListeningForCommand: () => setActiveState('listening'),
    onStartReplyListening: () => setActiveState('listening'),
    onSetTranscript: () => { },
    onSendReply: () => setActiveState('idle'),
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setPanelOpen(false)
    }
    if (panelOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [panelOpen])

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        minHeight: '100vh', padding: 32,
        background: 'radial-gradient(ellipse at 20% 50%, #1a0e2e 0%, #0d0a18 40%, #080610 100%)',
        fontFamily: 'DM Sans, sans-serif',
        display: 'flex', flexDirection: 'column', gap: 40,
      }}>
        {/* Demo controls */}
        <div style={{ maxWidth: 640 }}>
          <div className="supra-font-display" style={{
            fontSize: 10, letterSpacing: '0.2em', color: 'rgba(251,191,36,0.4)',
            marginBottom: 24, textTransform: 'uppercase',
          }}>
            Supra Leo AI · Design Preview
          </div>

          {/* Variant toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {(['floating', 'toolbar'] as Variant[]).map(v => (
              <button key={v} onClick={() => setVariant(v)} className="supra-btn" style={{
                height: 30, padding: '0 14px', borderRadius: 8,
                background: variant === v ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.04)',
                color: variant === v ? '#fde68a' : 'rgba(255,255,255,0.35)',
                border: `1px solid ${variant === v ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
            {variant === 'toolbar' && (
              <button onClick={() => setPanelOpen(p => !p)} className="supra-btn" style={{
                height: 30, padding: '0 14px', borderRadius: 8,
                background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                Toggle Panel
              </button>
            )}
          </div>

          {/* State selector */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
            {STATES.map(s => (
              <button
                key={s}
                onClick={() => { setActiveState(s); setPanelOpen(true) }}
                className="supra-btn"
                style={{
                  height: 30, padding: '0 12px', borderRadius: 8,
                  background: activeState === s ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.03)',
                  color: activeState === s ? '#fbbf24' : 'rgba(255,255,255,0.3)',
                  border: `1px solid ${activeState === s ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.07)'}`,
                  textTransform: 'capitalize',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Inline toolbar preview */}
          {variant === 'toolbar' && (
            <div ref={panelRef}>
              <ToolbarVariant
                state={activeState}
                panelOpen={panelOpen}
                onToggle={() => setPanelOpen(p => !p)}
                panelProps={{ ...panelProps, onClose: () => setPanelOpen(false) }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Floating variant */}
      {variant === 'floating' && (
        <div ref={panelRef}>
          <FloatingVariant
            position="bottom-right"
            state={activeState}
            panelOpen={panelOpen}
            onToggle={() => setPanelOpen(p => !p)}
            panelProps={{ ...panelProps, onClose: () => setPanelOpen(false) }}
          />
        </div>
      )}
    </>
  )
}