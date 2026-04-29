'use client'

/**
 * /crm/supra-leo/page.tsx
 * Full-screen Autrix AI chat page — automotive dashboard theme.
 * File name preserved; branding updated to "Supra Autrix AI".
 */

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, Send, Square, Trash2,
  Loader2, Calendar, Clock, MessageSquare,
  Fingerprint, Rss, User, Zap,
  ChevronRight,
} from 'lucide-react'
import { SupraLeoAvatar } from '@/components/supra-leo-ai/SupraLeoAvatar'
import { useSupraLeoChat, ChatModule, ChatMessage } from '@/hooks/useSupraLeoChat'
import { apiClient } from '@/lib/api-client'

// ─── Styles ───────────────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('ax-page-styles')) {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@300;400&display=swap'
  document.head.appendChild(link)

  const s = document.createElement('style')
  s.id = 'ax-page-styles'
  s.textContent = `
    /* ── Design tokens ── */
    .axp {
      --bg:      #060D1A;
      --bg2:     #0A1628;
      --surf:    #0F1E35;
      --surf2:   #162440;
      --bd:      rgba(59,130,246,0.13);
      --bd2:     rgba(255,255,255,0.055);
      --acc:     #3B82F6;
      --acc2:    #60A5FA;
      --orange:  #F59E0B;
      --silver:  #94AFC6;
      --tx1:     rgba(220,235,255,0.95);
      --tx2:     rgba(140,175,220,0.68);
      --tx3:     rgba(80,130,185,0.38);
      --green:   #10B981;
      --red:     #EF4444;
      --glass:   rgba(9,18,36,0.88);
      font-family: 'DM Sans', sans-serif;
      background: var(--bg);
      color: var(--tx1);
      -webkit-font-smoothing: antialiased;
    }
    .axp.light {
      --bg:    #F0F5FB;
      --bg2:   #E2ECF8;
      --surf:  #FFFFFF;
      --surf2: #F4F8FE;
      --bd:    rgba(37,99,235,0.11);
      --bd2:   rgba(0,0,0,0.07);
      --acc:   #2563EB;
      --acc2:  #3B82F6;
      --silver:#6B8BAE;
      --tx1:   #081A30;
      --tx2:   rgba(10,50,100,0.65);
      --tx3:   rgba(10,50,100,0.38);
      --glass: rgba(255,255,255,0.95);
    }

    /* Typography */
    .axp-heading { font-family: 'Rajdhani', sans-serif; }
    .axp-mono    { font-family: 'JetBrains Mono', monospace; }

    /* ── Shimmer line ── */
    @keyframes ax-shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
    .axp-shimmer {
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, var(--acc2) 30%, rgba(255,255,255,.7) 50%, var(--acc2) 70%, transparent 100%);
      background-size: 200% 100%;
      animation: ax-shimmer 4s linear infinite;
    }

    /* ── Module pills ── */
    .axp-pill {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 12px; border-radius: 99px;
      border: 1px solid var(--bd); background: transparent;
      cursor: pointer; transition: all .18s; color: var(--tx2);
      font-size: 11px; font-weight: 500; letter-spacing: .04em;
      white-space: nowrap; font-family: 'DM Sans', sans-serif;
    }
    .axp-pill:hover { border-color: rgba(59,130,246,.3); color: var(--acc2); background: rgba(59,130,246,.07); }
    .axp-pill.active { border-color: rgba(59,130,246,.35); color: var(--acc2); background: rgba(59,130,246,.1); }

    /* ── Messages ── */
    .axp-msg-user {
      background: rgba(59,130,246,.10);
      border: 1px solid rgba(59,130,246,.22);
      border-radius: 14px 14px 4px 14px;
      padding: 10px 14px;
      font-size: 13.5px; line-height: 1.65; font-weight: 300; color: var(--tx1);
      max-width: min(72%, 520px);
      white-space: pre-wrap; word-break: break-word;
    }
    .axp-msg-ai {
      background: var(--surf);
      border: 1px solid var(--bd);
      border-radius: 4px 14px 14px 14px;
      padding: 12px 16px;
      font-size: 13.5px; line-height: 1.7; font-weight: 300; color: var(--tx1);
      max-width: min(82%, 620px);
      white-space: pre-wrap; word-break: break-word;
      position: relative; overflow: hidden;
    }
    .axp-msg-ai::before {
      content: '';
      position: absolute; top: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, transparent 20%, rgba(59,130,246,.25) 50%, transparent 80%);
    }
    .axp-msg-ai code {
      font-family: 'JetBrains Mono', monospace; font-size: 11.5px;
      background: var(--surf2); border: 1px solid var(--bd2);
      border-radius: 4px; padding: 1px 5px;
    }
    .axp-msg-ai pre {
      background: var(--bg); border: 1px solid var(--bd);
      border-radius: 8px; padding: 12px; overflow-x: auto; margin: 8px 0;
    }
    .axp-msg-ai pre code { background: none; border: none; padding: 0; }
    .axp-msg-ai strong { color: var(--acc2); font-weight: 600; }
    .axp-msg-ai em { color: var(--tx2); }
    .axp-msg-ai ul, .axp-msg-ai ol { padding-left: 20px; margin: 6px 0; }
    .axp-msg-ai li { margin-bottom: 4px; }
    .axp-msg-ai h1, .axp-msg-ai h2, .axp-msg-ai h3 {
      font-family: 'Rajdhani', sans-serif;
      color: var(--acc2); margin: 10px 0 5px; font-weight: 700; letter-spacing: .05em;
    }

    /* ── Cursor blink ── */
    @keyframes ax-blink { 0%,100%{opacity:1} 50%{opacity:0} }
    .axp-cursor {
      display: inline-block; width: 2px; height: .85em;
      background: var(--acc); margin-left: 2px;
      vertical-align: text-bottom; border-radius: 1px;
      animation: ax-blink .85s step-end infinite;
    }

    /* ── Typing dots ── */
    @keyframes ax-dot { 0%,100%{opacity:.2;transform:scale(.7)} 50%{opacity:1;transform:scale(1)} }
    .axp-typing-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--acc); display: inline-block; }

    /* ── Input ── */
    .axp-input {
      background: transparent; border: none; outline: none; resize: none;
      font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 300;
      color: var(--tx1); line-height: 1.55; width: 100%;
      min-height: 24px; max-height: 140px; overflow-y: auto;
      -webkit-user-select: text; user-select: text;
    }
    .axp-input::placeholder { color: var(--tx3); }

    /* ── Quick prompts ── */
    .axp-quick {
      border: 1px solid var(--bd); background: transparent;
      border-radius: 10px; padding: 9px 13px;
      font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 400;
      color: var(--tx2); cursor: pointer; text-align: left;
      transition: all .16s; display: flex; align-items: center; justify-content: space-between; gap: 8px;
    }
    .axp-quick:hover { border-color: rgba(59,130,246,.28); color: var(--acc2); background: rgba(59,130,246,.06); }

    /* ── Scrollbar ── */
    .axp-scroll::-webkit-scrollbar { width: 3px; }
    .axp-scroll::-webkit-scrollbar-track { background: transparent; }
    .axp-scroll::-webkit-scrollbar-thumb { background: rgba(59,130,246,.2); border-radius: 2px; }

    /* ── Scan line animation ── */
    @keyframes ax-scan { 0%{transform:translateY(-100%);opacity:.4} 100%{transform:translateY(1000%);opacity:0} }

    /* ── Message row ── */
    @keyframes ax-fade-up { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .axp-msg-row { animation: ax-fade-up .22s ease forwards; }

    /* ── HUD grid ── */
    .axp-hud-grid {
      position: absolute; inset: 0; pointer-events: none; overflow: hidden;
    }

    /* ── Icon btn ── */
    .axp-icon-btn {
      border: 1px solid var(--bd); background: none;
      border-radius: 10px; cursor: pointer; color: var(--tx3);
      display: flex; align-items: center; justify-content: center;
      transition: all .16s; padding: 0; flex-shrink: 0;
    }
    .axp-icon-btn:hover { border-color: rgba(59,130,246,.3); color: var(--acc2); background: rgba(59,130,246,.07); }
    .axp-icon-btn.danger:hover { border-color: rgba(239,68,68,.3); color: var(--red); background: rgba(239,68,68,.06); }

    /* ── Status badge ── */
    .axp-status-badge {
      display: flex; align-items: center; gap: 6px;
      padding: 4px 10px; border-radius: 6px;
      border: 1px solid var(--bd); background: rgba(59,130,246,.06);
    }

    /* ── Responsive ── */
    @media (max-width: 640px) {
      .axp-msg-user, .axp-msg-ai { max-width: 92%; font-size: 13px; }
      .axp-pill { font-size: 10px; padding: 4px 10px; }
    }
    @media (max-width: 768px) {
      .axp-header-meta { display: none !important; }
    }
  `
  document.head.appendChild(s)
}

// ─── Modules ──────────────────────────────────────────────────────────────────
const MODULES: { id: ChatModule; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: 'general',     label: 'General',     icon: <Zap className="h-3.5 w-3.5" />,         hint: 'Ask anything about the CRM' },
  { id: 'appointments',label: 'Appointments',icon: <Calendar className="h-3.5 w-3.5" />,     hint: 'Leads, bookings & scheduling' },
  { id: 'timeproof',   label: 'Timeproof',   icon: <Clock className="h-3.5 w-3.5" />,        hint: 'Attendance & work hours' },
  { id: 'supraspace',  label: 'Supra Space', icon: <MessageSquare className="h-3.5 w-3.5" />,hint: 'Team messaging insights' },
  { id: 'biometrics',  label: 'Biometrics',  icon: <Fingerprint className="h-3.5 w-3.5" />, hint: 'Security & credentials' },
  { id: 'feeds',       label: 'Feeds',       icon: <Rss className="h-3.5 w-3.5" />,          hint: 'Team activity & posts' },
]

const QUICK_PROMPTS: Record<ChatModule, string[]> = {
  general:      ["Quick summary of today's CRM activity", 'What should I prioritize today?', 'Help me draft a follow-up for a hot lead'],
  appointments: ['Summarize my upcoming appointments', 'What leads need follow-up today?', 'Draft an appointment confirmation email'],
  timeproof:    ['How many hours have I worked this week?', 'Am I on track with attendance?', 'Generate a timeproof report summary'],
  supraspace:   ['What conversations have unread messages?', 'Draft a team Q1 performance announcement', 'Summarize recent team activity'],
  biometrics:   ['Explain how biometric login works', 'What are SSH key security best practices?', 'Help me understand my credentials'],
  feeds:        ['What did the team post today?', 'Write an engaging team motivation post', 'Summarize recent feed activity'],
}

interface SupraLeoStatus {
  context?: {
    chatMessages?: number
  }
}

// ─── Markdown renderer ────────────────────────────────────────────────────────
function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'
  const isStreaming = msg.streaming
  const isEmpty = !msg.content && isStreaming

  if (isUser) {
    return (
      <div className="axp-msg-row flex justify-end gap-3 px-4">
        <div className="axp-msg-user">{msg.content}</div>
        <div
          className="h-8 w-8 rounded-xl shrink-0 flex items-center justify-center"
          style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}
        >
          <User className="h-4 w-4" style={{ color: 'var(--acc2)' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="axp-msg-row flex gap-3 px-4">
      <SupraLeoAvatar state={isStreaming ? 'speaking' : 'idle'} size={32} animate={isStreaming} style={{ flexShrink: 0, marginTop: 2 }} />
      <div className="axp-msg-ai flex-1">
        {isEmpty ? (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '2px 0' }}>
            {[0, 1, 2].map(i => (
              <span key={i} className="axp-typing-dot" style={{ animation: `ax-dot 1.1s ${i * 0.18}s ease-in-out infinite` }} />
            ))}
          </div>
        ) : (
          <>
            <span dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
            {isStreaming && <span className="axp-cursor" />}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Date separator ───────────────────────────────────────────────────────────
function DateSep({ date }: { date: string | Date }) {
  const d = new Date(date)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  const label = diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <div style={{ flex: 1, height: 1, background: 'var(--bd)' }} />
      <span className="axp-mono" style={{ fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--tx3)' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--bd)' }} />
    </div>
  )
}

// ─── HUD Background grid ──────────────────────────────────────────────────────
function HUDGrid() {
  return (
    <div className="axp-hud-grid" aria-hidden>
      <svg width="100%" height="100%" style={{ opacity: 0.025 }}>
        <defs>
          <pattern id="hud-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#3B82F6" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hud-grid)" />
      </svg>
      {/* Scan line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '60px',
        background: 'linear-gradient(180deg, rgba(59,130,246,.04) 0%, transparent 100%)',
        animation: 'ax-scan 8s linear infinite',
        pointerEvents: 'none',
      }} />
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SupraLeoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeModule, setActiveModule] = React.useState<ChatModule>('general')
  const [inputText, setInputText] = React.useState('')
  const [showClearConfirm, setShowClearConfirm] = React.useState(false)
  const [status, setStatus] = React.useState<SupraLeoStatus | null>(null)

  const scrollRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const {
    messages, isLoading, isLoadingHistory, hasMore, error,
    sendMessage, stopGeneration, clearHistory, loadMoreHistory,
  } = useSupraLeoChat({ module: activeModule, autoLoadHistory: true })

  const fromPath = searchParams.get('from') || '/crm/dashboard'
  const lastMessageContent = messages[messages.length - 1]?.content

  React.useEffect(() => {
    const requestedModule = searchParams.get('module')
    if (!requestedModule) return

    const isValidModule = MODULES.some(mod => mod.id === requestedModule)
    if (isValidModule) {
      setActiveModule(requestedModule as ChatModule)
    }
  }, [searchParams])

  // Auth check + status load
  React.useEffect(() => {
    const token = localStorage.getItem('crm_token')
    if (!token) { router.replace('/crm'); return }
    apiClient.get('/api/supraleo/status', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setStatus(r.data?.data))
      .catch(() => {})
  }, [router])

  // Auto-scroll
  React.useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, lastMessageContent])

  // Auto-resize textarea
  React.useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }, [inputText])

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return
    const text = inputText.trim()
    setInputText('')
    await sendMessage(text)
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleClear = async () => {
    await clearHistory()
    setShowClearConfirm(false)
  }

  const handleBack = React.useCallback(() => {
    if (fromPath.startsWith('/crm/')) {
      router.push(fromPath)
      return
    }
    router.push('/crm/dashboard')
  }, [fromPath, router])

  const quickPrompts = QUICK_PROMPTS[activeModule]
  const showEmpty = messages.length === 0 && !isLoadingHistory

  const groupedMessages = React.useMemo(() => {
    const groups: { date: string; messages: ChatMessage[] }[] = []
    let currentDate = ''
    messages.forEach(msg => {
      const dateStr = new Date(msg.createdAt).toDateString()
      if (dateStr !== currentDate) {
        currentDate = dateStr
        groups.push({ date: msg.createdAt as string, messages: [msg] })
      } else {
        groups[groups.length - 1].messages.push(msg)
      }
    })
    return groups
  }, [messages])

  return (
    <div
      className="axp flex h-full min-h-0 flex-col overflow-hidden"
      style={{ position: 'relative', height: '100%', maxHeight: '100%' }}
    >
      <HUDGrid />

      {/* ── Top bar ── */}
      <div style={{
        background: 'rgba(6,13,26,0.92)',
        borderBottom: '1px solid var(--bd)',
        backdropFilter: 'blur(20px)',
        flexShrink: 0, position: 'relative', zIndex: 10,
      }}>
        <div className="axp-shimmer" />

        <div className="flex items-center gap-3 px-4 sm:px-5 h-14">
          {/* Back */}
          <button
            onClick={handleBack}
            className="axp-icon-btn h-9 w-9 sm:h-8 sm:w-8"
            style={{ borderRadius: 10 }}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          {/* Brand */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <SupraLeoAvatar state={isLoading ? 'speaking' : 'idle'} size={36} animate={isLoading} />
            <div className="min-w-0">
              <div className="axp-heading" style={{ fontSize: 16, fontWeight: 700, color: 'var(--acc2)', letterSpacing: '.10em', lineHeight: 1, textTransform: 'uppercase' }}>
                Suprah Autrix AI
              </div>
              <div className="axp-mono" style={{ fontSize: 7.5, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--tx3)', marginTop: 3 }}>
                Driven by Intelligence
              </div>
            </div>
          </div>

          {/* Status */}
          {status && (
            <div className="axp-status-badge hidden sm:flex">
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px rgba(16,185,129,0.7)' }} />
              <span className="axp-mono" style={{ fontSize: 8.5, letterSpacing: '.15em', color: 'var(--acc)', textTransform: 'uppercase' }}>Online</span>
            </div>
          )}

          {/* Message count */}
          {status?.context && (
            <span className="axp-header-meta axp-mono" style={{ fontSize: 9, color: 'var(--tx3)' }}>
              {status.context.chatMessages} msgs
            </span>
          )}

          {/* Clear */}
          {messages.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="axp-icon-btn danger h-8 w-8"
              title="Clear chat history"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Module pills */}
        <div className="flex items-center gap-2 px-4 sm:px-5 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {MODULES.map(mod => (
            <button
              key={mod.id}
              className={`axp-pill ${activeModule === mod.id ? 'active' : ''}`}
              onClick={() => setActiveModule(mod.id)}
            >
              {mod.icon}
              <span>{mod.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        className="axp-scroll flex-1 overflow-y-auto space-y-4 py-4 min-h-0"
        style={{ position: 'relative', zIndex: 1 }}
      >

        {hasMore && !isLoadingHistory && (
          <div className="flex justify-center py-2">
            <button
              onClick={loadMoreHistory}
              className="axp-mono"
              style={{ fontSize: 9.5, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--tx3)', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--acc)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--tx3)')}
            >
              ↑ Load earlier messages
            </button>
          </div>
        )}

        {isLoadingHistory && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'rgba(59,130,246,.35)' }} />
          </div>
        )}

        {/* Empty state */}
        {showEmpty && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-8 px-6 text-center">
            <div>
              <SupraLeoAvatar state="idle" size={72} animate style={{ margin: '0 auto 16px' }} />
              <div className="axp-heading" style={{ fontSize: 24, fontWeight: 700, color: 'var(--acc2)', marginBottom: 8, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                How can I assist?
              </div>
              <div className="axp-mono" style={{ fontSize: 10, color: 'var(--tx3)', maxWidth: 320, letterSpacing: '.12em' }}>
                DRIVEN BY INTELLIGENCE · {MODULES.find(m => m.id === activeModule)?.hint?.toUpperCase()}
              </div>
            </div>

            <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="axp-mono" style={{ fontSize: 8, letterSpacing: '.22em', color: 'var(--tx3)', textTransform: 'uppercase', marginBottom: 2 }}>
                Quick starts
              </div>
              {quickPrompts.map(p => (
                <button
                  key={p}
                  className="axp-quick"
                  onClick={() => { setInputText(p); textareaRef.current?.focus() }}
                >
                  <span>{p}</span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-40" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {groupedMessages.map((group, gi) => (
          <React.Fragment key={gi}>
            <DateSep date={group.date} />
            {group.messages.map((msg, mi) => (
              <MessageBubble key={msg._id || `${gi}-${mi}`} msg={msg} />
            ))}
          </React.Fragment>
        ))}

        {/* Error */}
        {error && (
          <div className="flex justify-center px-4">
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 14px', borderRadius: 8,
              border: '1px solid rgba(239,68,68,.22)',
              background: 'rgba(239,68,68,.05)',
              fontSize: 12, color: '#EF4444',
            }}>
              {error}
            </div>
          </div>
        )}

        <div style={{ height: 8 }} />
      </div>

      {/* ── Input bar ── */}
      <div style={{
        flexShrink: 0,
        borderTop: '1px solid var(--bd)',
        background: 'rgba(6,13,26,0.95)',
        backdropFilter: 'blur(20px)',
        position: 'relative', zIndex: 10,
      }}>
        <div className="axp-shimmer" />
        <div style={{ padding: '10px 12px calc(12px + env(safe-area-inset-bottom, 0px))' }}>
          <div
            style={{
              display: 'flex', alignItems: 'flex-end', gap: 10,
              background: 'var(--surf)',
              border: '1px solid var(--bd)',
              borderRadius: 14,
              padding: '10px 10px 10px 14px',
              transition: 'border-color .18s',
            }}
            onFocusCapture={e => (e.currentTarget.style.borderColor = 'rgba(59,130,246,.35)')}
            onBlurCapture={e => (e.currentTarget.style.borderColor = 'var(--bd)')}
          >
            <textarea
              ref={textareaRef}
              className="axp-input axp-scroll"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Ask Autrix AI about ${MODULES.find(m => m.id === activeModule)?.label.toLowerCase()}…`}
              rows={1}
              disabled={isLoading}
              style={{ flex: 1 }}
            />
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, paddingBottom: 2 }}>
              {isLoading ? (
                <button
                  onClick={stopGeneration}
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)',
                    color: '#EF4444', cursor: 'pointer',
                  }}
                >
                  <Square className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: inputText.trim() ? 'var(--acc)' : 'var(--surf2)',
                    border: `1px solid ${inputText.trim() ? 'var(--acc)' : 'var(--bd)'}`,
                    color: inputText.trim() ? '#fff' : 'var(--tx3)',
                    cursor: inputText.trim() ? 'pointer' : 'default',
                    transition: 'all .18s',
                    boxShadow: inputText.trim() ? '0 0 12px rgba(59,130,246,.3)' : 'none',
                  }}
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="axp-mono" style={{ fontSize: 8, textAlign: 'center', color: 'var(--tx3)', letterSpacing: '.14em', marginTop: 8 }}>
            ENTER TO SEND · SHIFT+ENTER FOR NEWLINE
          </div>
        </div>
      </div>

      {/* ── Clear confirm modal ── */}
      {showClearConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)',
          padding: '16px',
        }}>
          <div style={{
            background: 'var(--surf)', border: '1px solid var(--bd)',
            borderRadius: 16, padding: 24,
            width: '100%', maxWidth: 320,
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div className="axp-shimmer" style={{ position: 'absolute', top: 0, left: 0, right: 0 }} />
            <div className="axp-heading" style={{ fontSize: 16, fontWeight: 700, color: 'var(--acc2)', marginBottom: 8, letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 8 }}>
              Clear History?
            </div>
            <div style={{ fontSize: 13, color: 'var(--tx2)', fontWeight: 300, marginBottom: 20, lineHeight: 1.6 }}>
              This will permanently delete all {messages.length} messages. This action cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{
                  flex: 1, height: 40, borderRadius: 10,
                  border: '1px solid var(--bd)', background: 'transparent',
                  color: 'var(--tx2)', cursor: 'pointer', fontSize: 13,
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleClear}
                style={{
                  flex: 1, height: 40, borderRadius: 10,
                  background: '#EF4444', border: '1px solid rgba(239,68,68,.4)',
                  color: '#fff', cursor: 'pointer', fontSize: 13,
                  fontWeight: 600, fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
