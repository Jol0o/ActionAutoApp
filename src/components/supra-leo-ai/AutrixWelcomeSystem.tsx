'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronRight, Zap } from 'lucide-react'
import { SupraLeoAvatar } from './SupraLeoAvatar'

// ─── CSS ──────────────────────────────────────────────────────────────────────
const WELCOME_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=JetBrains+Mono:wght@300;400&display=swap');

@keyframes aw-in     { from{opacity:0;transform:scale(.92) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
@keyframes aw-out    { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(.94)} }
@keyframes aw-bg-in  { from{opacity:0} to{opacity:1} }
@keyframes aw-scan   { 0%{transform:translateY(-20px);opacity:.4} 100%{transform:translateY(320px);opacity:0} }
@keyframes aw-shimmer{ 0%{background-position:200% center} 100%{background-position:-200% center} }
@keyframes aw-dot    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.25;transform:scale(.6)} }
@keyframes aw-float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
@keyframes aw-ring   { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(2.2);opacity:0} }
@keyframes aw-word   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes aw-pulse-border { 0%,100%{border-color:rgba(59,130,246,.18)} 50%{border-color:rgba(59,130,246,.45)} }

/* ── Dark (default) ── */
.aw-overlay {
  position: fixed; inset: 0; z-index: 99999;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  animation: aw-bg-in .3s ease forwards;
}
.aw-overlay-bg {
  position: absolute; inset: 0;
  background: rgba(3,8,18,.82);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.aw-card {
  position: relative; z-index: 1;
  width: min(480px, 100%);
  background: linear-gradient(160deg, #0A1628 0%, #060D1A 60%, #070F1C 100%);
  border: 1px solid rgba(59,130,246,.18);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 48px rgba(0,0,0,.7), 0 0 0 1px rgba(59,130,246,.06), 0 0 80px rgba(59,130,246,.06);
  animation: aw-in .42s cubic-bezier(.16,1,.3,1) forwards;
}
.aw-card.closing { animation: aw-out .22s ease forwards; }

.aw-card::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 1px; z-index: 5;
  background: linear-gradient(90deg, transparent 0%, rgba(96,165,250,.7) 30%, rgba(255,255,255,.9) 50%, rgba(96,165,250,.7) 70%, transparent 100%);
  background-size: 200% 100%;
  animation: aw-shimmer 3s linear infinite;
}

.aw-card::after {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 50px;
  background: linear-gradient(180deg, rgba(59,130,246,.04) 0%, transparent 100%);
  animation: aw-scan 5s linear infinite;
  pointer-events: none; z-index: 2;
}

.aw-grid-bg {
  position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 0;
  opacity: .04;
}

.aw-body {
  position: relative; z-index: 3;
  padding: 32px 32px 28px;
  display: flex; flex-direction: column; align-items: center; gap: 20px;
  text-align: center;
}

.aw-avatar-wrap {
  position: relative;
  display: flex; align-items: center; justify-content: center;
  animation: aw-float 4s ease-in-out infinite;
}
.aw-avatar-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(59,130,246,.45);
  animation: aw-ring 2.5s ease-out infinite;
}

.aw-title-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; }

.aw-eyebrow {
  font-family: 'JetBrains Mono', monospace;
  font-size: 8.5px; letter-spacing: .28em; text-transform: uppercase;
  color: rgba(59,130,246,.55);
  display: flex; align-items: center; gap: 6px;
}
.aw-eyebrow-dot {
  width: 4px; height: 4px; border-radius: 50%;
  background: #3B82F6;
  animation: aw-dot 1.4s ease-in-out infinite;
}

.aw-title {
  font-family: 'Rajdhani', sans-serif;
  font-size: 30px; font-weight: 700;
  color: rgba(220,235,255,.95);
  letter-spacing: .06em; text-transform: uppercase;
  line-height: 1;
}
.aw-title span { color: #60A5FA; }

.aw-subtitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px; letter-spacing: .2em; text-transform: uppercase;
  color: rgba(80,130,185,.45);
  margin-top: 2px;
}

.aw-message {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px; font-weight: 300; line-height: 1.72;
  color: rgba(140,175,220,.78);
  max-width: 360px;
}

.aw-features {
  display: flex; gap: 6px; flex-wrap: wrap; justify-content: center;
  margin-top: -4px;
}
.aw-pill {
  display: inline-flex; align-items: center; gap: 5px;
  height: 26px; padding: 0 10px;
  border: 1px solid rgba(59,130,246,.18);
  border-radius: 99px;
  background: rgba(59,130,246,.07);
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px; letter-spacing: .1em; text-transform: uppercase;
  color: rgba(96,165,250,.7);
  animation: aw-pulse-border 3s ease-in-out infinite;
}
.aw-pill-dot {
  width: 3.5px; height: 3.5px; border-radius: 50%;
  background: #60A5FA; opacity: .6;
}

.aw-cta {
  display: flex; align-items: center; justify-content: center; gap: 7px;
  width: 100%; height: 44px;
  border: 1px solid rgba(59,130,246,.35);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(59,130,246,.15) 0%, rgba(37,99,235,.1) 100%);
  color: rgba(96,165,250,.9);
  font-family: 'Rajdhani', sans-serif;
  font-size: 14px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase;
  cursor: pointer; transition: all .2s; margin-top: 4px;
}
.aw-cta:hover {
  background: linear-gradient(135deg, rgba(59,130,246,.22) 0%, rgba(37,99,235,.16) 100%);
  border-color: rgba(59,130,246,.55);
  box-shadow: 0 0 20px rgba(59,130,246,.12);
  color: #93C5FD;
}

.aw-close {
  position: absolute; top: 14px; right: 14px; z-index: 10;
  width: 26px; height: 26px;
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 7px; background: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: rgba(80,130,185,.4); transition: all .15s;
}
.aw-close:hover { color: rgba(140,175,220,.7); background: rgba(255,255,255,.05); }

.aw-speaking {
  display: flex; align-items: center; gap: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px; letter-spacing: .16em; text-transform: uppercase;
  color: rgba(245,158,11,.55);
}
.aw-speaking-dot {
  width: 4px; height: 4px; border-radius: 50%; background: #F59E0B;
  animation: aw-dot .8s ease-in-out infinite;
}

/* Page card (dark default) */
.aw-page-card {
  width: min(420px, 100%);
  background: linear-gradient(160deg, #0A1628 0%, #060D1A 70%);
  border: 1px solid rgba(59,130,246,.2);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 12px 60px rgba(0,0,0,.75), 0 0 80px rgba(59,130,246,.07);
  animation: aw-in .38s cubic-bezier(.16,1,.3,1) forwards;
}
.aw-page-card.closing { animation: aw-out .2s ease forwards; }
.aw-page-card::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(96,165,250,.6) 35%, rgba(255,255,255,.8) 50%, rgba(96,165,250,.6) 65%, transparent 100%);
  background-size: 200% 100%;
  animation: aw-shimmer 3.5s linear infinite;
}

.aw-page-accent {
  height: 4px;
  background: linear-gradient(90deg, transparent, var(--page-color, #3B82F6), transparent);
}

.aw-page-body {
  padding: 26px 28px 24px;
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  text-align: center;
  position: relative; z-index: 1;
}

.aw-page-icon {
  width: 56px; height: 56px; border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  font-size: 26px;
  border: 1px solid rgba(255,255,255,.08);
  background: rgba(255,255,255,.04);
  position: relative;
  animation: aw-float 3.5s ease-in-out infinite;
}

.aw-page-title {
  font-family: 'Rajdhani', sans-serif;
  font-size: 22px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
  color: rgba(220,235,255,.95);
}
.aw-page-title span { color: var(--page-color, #60A5FA); }

.aw-page-desc {
  font-family: 'DM Sans', sans-serif;
  font-size: 13px; font-weight: 300; line-height: 1.65;
  color: rgba(140,175,220,.7);
  max-width: 320px;
}

.aw-page-tips {
  display: flex; flex-direction: column; gap: 6px;
  width: 100%; margin-top: -4px;
}
.aw-page-tip {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 8px 10px; border-radius: 8px;
  border: 1px solid rgba(59,130,246,.1);
  background: rgba(59,130,246,.04);
  text-align: left;
  animation: aw-word .3s ease forwards;
  opacity: 0;
}
.aw-page-tip-icon { font-size: 13px; flex-shrink: 0; margin-top: 1px; }
.aw-page-tip-text {
  font-family: 'DM Sans', sans-serif;
  font-size: 11.5px; font-weight: 300; line-height: 1.5;
  color: rgba(140,175,220,.65);
}

.aw-page-cta {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; height: 40px;
  border: 1px solid; border-radius: 10px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 13px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase;
  cursor: pointer; transition: all .18s; margin-top: 4px;
}

/* ── Light mode overrides ── */
@media (prefers-color-scheme: light) {
  .aw-overlay-bg {
    background: rgba(240,245,255,.88);
  }
  .aw-card {
    background: linear-gradient(160deg, #EFF6FF 0%, #DBEAFE 60%, #EFF6FF 100%);
    border-color: rgba(59,130,246,.22);
    box-shadow: 0 8px 48px rgba(37,99,235,.15), 0 0 0 1px rgba(59,130,246,.08);
  }
  .aw-grid-bg { opacity: .06; }
  .aw-title { color: #1E3A8A; }
  .aw-title span { color: #2563EB; }
  .aw-subtitle { color: rgba(37,99,235,.45); }
  .aw-eyebrow { color: rgba(37,99,235,.65); }
  .aw-eyebrow-dot { background: #2563EB; }
  .aw-message { color: rgba(30,58,138,.75); }
  .aw-pill {
    border-color: rgba(37,99,235,.22);
    background: rgba(37,99,235,.08);
    color: rgba(37,99,235,.8);
  }
  .aw-pill-dot { background: #2563EB; }
  .aw-cta {
    border-color: rgba(37,99,235,.4);
    background: linear-gradient(135deg, rgba(37,99,235,.12) 0%, rgba(29,78,216,.08) 100%);
    color: #2563EB;
  }
  .aw-cta:hover {
    background: linear-gradient(135deg, rgba(37,99,235,.2) 0%, rgba(29,78,216,.14) 100%);
    border-color: rgba(37,99,235,.6);
    color: #1D4ED8;
  }
  .aw-close {
    border-color: rgba(0,0,0,.1);
    color: rgba(37,99,235,.5);
  }
  .aw-close:hover { color: #2563EB; background: rgba(37,99,235,.06); }
  .aw-speaking { color: rgba(217,119,6,.7); }
  .aw-speaking-dot { background: #D97706; }

  /* Page card light */
  .aw-page-card {
    background: linear-gradient(160deg, #EFF6FF 0%, #DBEAFE 70%);
    border-color: rgba(37,99,235,.22);
    box-shadow: 0 12px 60px rgba(37,99,235,.12), 0 0 0 1px rgba(37,99,235,.06);
  }
  .aw-page-icon {
    border-color: rgba(37,99,235,.15);
    background: rgba(37,99,235,.06);
  }
  .aw-page-title { color: #1E3A8A; }
  .aw-page-desc { color: rgba(30,58,138,.65); }
  .aw-page-tip {
    border-color: rgba(37,99,235,.12);
    background: rgba(37,99,235,.05);
  }
  .aw-page-tip-text { color: rgba(30,58,138,.65); }
}
`

function injectWelcomeCSS() {
  if (typeof document === 'undefined') return
  if (document.getElementById('aw-css-v1')) return
  const el = document.createElement('style')
  el.id = 'aw-css-v1'
  el.textContent = WELCOME_CSS
  document.head.appendChild(el)
}

// ─── TTS helper ───────────────────────────────────────────────────────────────
function speak(text: string, rate = 0.92, pitch = 1): SpeechSynthesisUtterance {
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.rate = rate
  utt.pitch = pitch
  utt.volume = 0.88

  const assignVoiceAndSpeak = () => {
    const voices = window.speechSynthesis.getVoices()
    const preferred =
      voices.find((v) => v.name.includes('Google') && v.lang.startsWith('en')) ||
      voices.find((v) => v.lang.startsWith('en-US')) ||
      voices[0]
    if (preferred) utt.voice = preferred
    window.speechSynthesis.speak(utt)
  }

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null
      assignVoiceAndSpeak()
    }
  } else {
    assignVoiceAndSpeak()
  }

  return utt
}

// ─── Module page configs ──────────────────────────────────────────────────────
export interface PageConfig {
  title: string
  highlight: string
  icon: string
  color: string
  description: string
  tips: Array<{ icon: string; text: string }>
  voiceGreeting: string
}

const PAGE_CONFIGS: Record<string, PageConfig> = {
  appointments: {
    title: 'Appointments',
    highlight: 'Module',
    icon: '📅',
    color: '#10B981',
    description:
      "Welcome to your Appointments hub. I'm here to help you manage leads, schedule visits, and craft the perfect follow-up for every customer.",
    tips: [
      { icon: '📋', text: 'View all incoming leads from DealersCloud in the Leads tab.' },
      { icon: '🗓️', text: 'Switch to Calendar View to visualize your full schedule at a glance.' },
      { icon: '✉️', text: 'Click the Autrix icon on any lead to have me read it aloud or draft a reply.' },
    ],
    voiceGreeting:
      "Welcome to the Appointments module! I'm Autrix, your AI co-pilot. Here you can manage all your leads and schedule appointments. Click the Autrix button on any lead card to have me analyze it, draft a custom reply, or book an appointment instantly.",
  },
  timeproof: {
    title: 'Timeproof',
    highlight: 'Attendance',
    icon: '⏱️',
    color: '#F59E0B',
    description:
      "Your Timeproof dashboard — track shifts, breaks, and attendance history. I can generate summaries and flag any anomalies for you.",
    tips: [
      { icon: '🟢', text: 'Clock in at the start of your shift to start tracking your time.' },
      { icon: '☕', text: 'Use the break button to accurately log break time.' },
      { icon: '📊', text: 'Ask me in Chat to summarize your weekly or monthly attendance.' },
    ],
    voiceGreeting:
      "Welcome to Timeproof! This is where you track your shifts and attendance. Don't forget to clock in, and if you take a break, use the break button so your hours are logged accurately.",
  },
  'supra-space': {
    title: 'Supra Space',
    highlight: 'Messaging',
    icon: '💬',
    color: '#8B5CF6',
    description:
      "Supra Space is your team's internal communication hub. Real-time messaging, group channels, and file sharing — all in one place.",
    tips: [
      { icon: '📨', text: 'Unread conversations appear highlighted — tackle them first.' },
      { icon: '📢', text: 'Use the Channels section for team-wide announcements.' },
      { icon: '🤖', text: 'Ask me to draft a team announcement or summarize long threads.' },
    ],
    voiceGreeting:
      "Welcome to Supra Space, your team messaging hub! You can chat with colleagues, share updates, and stay in sync. I can help you draft messages or summarize conversations you've missed.",
  },
  biometrics: {
    title: 'Biometrics',
    highlight: 'Security',
    icon: '🔐',
    color: '#EF4444',
    description:
      'Your biometric security center. Manage fingerprint authentication, SSH keys, and access credentials — all encrypted and secure.',
    tips: [
      { icon: '🖐️', text: 'Enroll your biometric credentials for fast, secure login.' },
      { icon: '🔑', text: 'Add SSH keys for developer access to secure systems.' },
      { icon: '🛡️', text: 'Review your audit log for any unusual access attempts.' },
    ],
    voiceGreeting:
      "Welcome to the Biometrics module! This is your security command center. You can manage fingerprint login, SSH keys, and review who has accessed your account. Your security is our top priority.",
  },
  feeds: {
    title: 'Team Feeds',
    highlight: 'Social',
    icon: '📡',
    color: '#06B6D4',
    description:
      'Stay connected with your team through posts, reactions, and comments. Celebrate wins, share updates, and keep the team spirit high.',
    tips: [
      { icon: '🏆', text: 'Share shoutouts to celebrate team achievements.' },
      { icon: '💬', text: 'Comment and react to stay engaged with your colleagues.' },
      { icon: '✍️', text: 'Ask me to write a motivational post or team announcement.' },
    ],
    voiceGreeting:
      "Welcome to Team Feeds! This is the social hub of Action Auto. Share updates, celebrate wins, and stay connected with your colleagues. I can help you write engaging posts that inspire your team!",
  },
}

// ─── Dashboard Welcome Modal ──────────────────────────────────────────────────
interface DashboardWelcomeProps {
  userName: string
  onClose: () => void
}

function DashboardWelcomeModal({ userName, onClose }: DashboardWelcomeProps) {
  const [closing, setClosing] = React.useState(false)
  const [speaking, setSpeaking] = React.useState(false)

  const handleClose = React.useCallback(() => {
    window.speechSynthesis.cancel()
    setClosing(true)
    setTimeout(onClose, 220)
  }, [onClose])

  React.useEffect(() => {
    injectWelcomeCSS()

    const t = setTimeout(() => {
      const firstName = userName.split(' ')[0]
      setSpeaking(true)
      const msg = `Welcome back, ${firstName}! I'm Supra Autrix, your AI co-pilot for the Action Auto CRM. I'm here to help you manage leads, schedule appointments, track your attendance, and keep the team connected. You'll find me in the bottom right corner — just tap to get started. Here's a quick overview of your workspace: The Appointments module handles all your leads and bookings. Supra Space is your team messaging hub. Timeproof tracks your shifts. Biometrics keeps you secure. And Team Feeds keeps everyone connected. Let's drive results together!`
      const utt = speak(msg, 0.9)
      utt.onend = () => setSpeaking(false)
      utt.onerror = () => setSpeaking(false)
    }, 800)

    const closeTimer = setTimeout(handleClose, 18000)

    return () => {
      clearTimeout(t)
      clearTimeout(closeTimer)
      window.speechSynthesis.cancel()
    }
  }, [userName, handleClose])

  const pills = ['Lead Management', 'AI Chat', 'Voice TTS', 'Reminders', 'Quick Actions']

  return createPortal(
    <div
      className="aw-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div className="aw-overlay-bg" />
      <div className={`aw-card ${closing ? 'closing' : ''}`}>
        <button className="aw-close" onClick={handleClose}>
          <X size={11} />
        </button>

        <svg
          className="aw-grid-bg"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="100%" stroke="#4AABF0" strokeWidth="0.4" />
          ))}
          {Array.from({ length: 16 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 35} x2="100%" y2={i * 35} stroke="#4AABF0" strokeWidth="0.4" />
          ))}
        </svg>

        <div className="aw-body">
          <div className="aw-avatar-wrap">
            <div className="aw-avatar-ring" style={{ width: 90, height: 90 }} />
            <div className="aw-avatar-ring" style={{ width: 90, height: 90, animationDelay: '1.2s' }} />
            <SupraLeoAvatar state={speaking ? 'speaking' : 'idle'} size={68} animate />
          </div>

          <div className="aw-title-wrap">
            <div className="aw-eyebrow">
              <div className="aw-eyebrow-dot" />
              Action Auto CRM
              <div className="aw-eyebrow-dot" style={{ animationDelay: '.4s' }} />
            </div>
            <div className="aw-title">
              Supra <span>Autrix</span>
            </div>
            <div className="aw-subtitle">Driven by Intelligence</div>
          </div>

          {speaking && (
            <div className="aw-speaking">
              <div className="aw-speaking-dot" />
              <div className="aw-speaking-dot" style={{ animationDelay: '.2s' }} />
              <div className="aw-speaking-dot" style={{ animationDelay: '.4s' }} />
              Speaking…
            </div>
          )}

          <div className="aw-message">
            Welcome back,{' '}
            <strong style={{ color: 'rgba(220,235,255,.9)' }}>{userName.split(' ')[0]}</strong>! I'm your
            AI co-pilot for the Action Auto CRM. I can read your leads aloud, draft replies, book
            appointments, and answer anything about your workflow.
          </div>

          <div className="aw-features">
            {pills.map((p, i) => (
              <div key={p} className="aw-pill" style={{ animationDelay: `${0.4 + i * 0.1}s` }}>
                <div className="aw-pill-dot" />
                {p}
              </div>
            ))}
          </div>

          <button className="aw-cta" onClick={handleClose}>
            <Zap size={13} />
            Let's Get Started
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Page Welcome Modal ───────────────────────────────────────────────────────
interface PageWelcomeModalProps {
  pageKey: string
  onClose: () => void
}

function PageWelcomeModal({ pageKey, onClose }: PageWelcomeModalProps) {
  const [closing, setClosing] = React.useState(false)
  const [speaking, setSpeaking] = React.useState(false)
  const cfg = PAGE_CONFIGS[pageKey]

  const handleClose = React.useCallback(() => {
    window.speechSynthesis.cancel()
    setClosing(true)
    setTimeout(onClose, 200)
  }, [onClose])

  React.useEffect(() => {
    if (!cfg) return
    injectWelcomeCSS()
    const t = setTimeout(() => {
      setSpeaking(true)
      const utt = speak(cfg.voiceGreeting, 0.91)
      utt.onend = () => setSpeaking(false)
      utt.onerror = () => setSpeaking(false)
    }, 500)
    const closeTimer = setTimeout(handleClose, 14000)
    return () => {
      clearTimeout(t)
      clearTimeout(closeTimer)
      window.speechSynthesis.cancel()
    }
  }, [cfg, handleClose])

  if (!cfg) return null

  return createPortal(
    <div
      className="aw-overlay"
      style={{ zIndex: 99998 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div className="aw-overlay-bg" />
      <div
        className={`aw-page-card ${closing ? 'closing' : ''}`}
        style={{ position: 'relative' as const }}
      >
        <button className="aw-close" onClick={handleClose}>
          <X size={11} />
        </button>
        <div
          className="aw-page-accent"
          style={{ '--page-color': cfg.color } as React.CSSProperties}
        />

        <div className="aw-page-body">
          <div className="aw-page-icon" style={{ boxShadow: `0 0 30px ${cfg.color}25` }}>
            {cfg.icon}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <SupraLeoAvatar state={speaking ? 'speaking' : 'reading'} size={36} animate />
            {speaking && (
              <div className="aw-speaking">
                <div className="aw-speaking-dot" />
                <div className="aw-speaking-dot" style={{ animationDelay: '.2s' }} />
                <div className="aw-speaking-dot" style={{ animationDelay: '.4s' }} />
                Autrix Speaking…
              </div>
            )}
          </div>

          <div>
            <div className="aw-eyebrow" style={{ justifyContent: 'center', marginBottom: 6 }}>
              <div className="aw-eyebrow-dot" style={{ background: cfg.color }} />
              Module Overview
            </div>
            <div
              className="aw-page-title"
              style={{ '--page-color': cfg.color } as React.CSSProperties}
            >
              {cfg.title} <span>{cfg.highlight}</span>
            </div>
          </div>

          <div className="aw-page-desc">{cfg.description}</div>

          <div className="aw-page-tips">
            {cfg.tips.map((tip, i) => (
              <div
                key={i}
                className="aw-page-tip"
                style={{ animationDelay: `${0.3 + i * 0.12}s` }}
              >
                <span className="aw-page-tip-icon">{tip.icon}</span>
                <span className="aw-page-tip-text">{tip.text}</span>
              </div>
            ))}
          </div>

          <button
            className="aw-page-cta"
            style={{
              borderColor: `${cfg.color}44`,
              background: `${cfg.color}10`,
              color: cfg.color,
            }}
            onClick={handleClose}
          >
            <Zap size={12} />
            Explore {cfg.title}
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Hook: Dashboard voice welcome ───────────────────────────────────────────
export function useAutrixVoiceWelcome(userName: string, isReady: boolean) {
  const [show, setShow] = React.useState(false)

  React.useEffect(() => {
    if (!isReady || !userName) return

    const isDev = process.env.NODE_ENV === 'development'
    const key = 'autrix_welcomed_session'

    if (!isDev && sessionStorage.getItem(key)) return
    if (!isDev) sessionStorage.setItem(key, '1')

    const t = setTimeout(() => setShow(true), 1200)
    return () => clearTimeout(t)
  }, [isReady, userName])

  const modal = show ? (
    <DashboardWelcomeModal userName={userName} onClose={() => setShow(false)} />
  ) : null

  return modal
}

// ─── Hook: Page welcome on navigation ────────────────────────────────────────
export function useAutrixPageWelcome(pageKey: string) {
  const [show, setShow] = React.useState(false)

  React.useEffect(() => {
    if (!pageKey || !PAGE_CONFIGS[pageKey]) return

    const isDev = process.env.NODE_ENV === 'development'
    const key = `autrix_page_${pageKey}`

    if (!isDev && sessionStorage.getItem(key)) return
    if (!isDev) sessionStorage.setItem(key, '1')

    const t = setTimeout(() => setShow(true), 600)
    return () => clearTimeout(t)
  }, [pageKey])

  const modal = show ? (
    <PageWelcomeModal pageKey={pageKey} onClose={() => setShow(false)} />
  ) : null

  return modal
}

// ─── Combined components for easy drop-in ────────────────────────────────────
export function AutrixWelcomeGate({ userName, isReady }: { userName: string; isReady: boolean }) {
  const modal = useAutrixVoiceWelcome(userName, isReady)
  return <>{modal}</>
}

export function AutrixPageGate({ pageKey }: { pageKey: string }) {
  const modal = useAutrixPageWelcome(pageKey)
  return <>{modal}</>
}

export default AutrixWelcomeGate