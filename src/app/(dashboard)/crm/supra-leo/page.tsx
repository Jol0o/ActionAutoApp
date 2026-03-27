'use client'

/**
 * /crm/supra-leo/page.tsx
 * Full-screen Supra Leo AI chat page with persistent history,
 * module context switching, and immersive UI.
 */

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Send, Square, Trash2, ChevronDown,
  Loader2, Sparkles, Calendar, Clock, MessageSquare,
  Fingerprint, Rss, Bot, User, RefreshCw, MoreVertical,
  Zap, Shield,
} from 'lucide-react'
import { SupraLeoAvatar } from '@/components/supra-leo-ai/SupraLeoAvatar'
import { useSupraLeoChat, ChatModule, ChatMessage } from '@/hooks/useSupraLeoChat'
import { apiClient } from '@/lib/api-client'

// ─── Fonts + Styles ───────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('supra-leo-page-styles')) {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@300;400&display=swap'
  document.head.appendChild(link)

  const s = document.createElement('style')
  s.id = 'supra-leo-page-styles'
  s.textContent = `
    .slp-page {
      --gold:     #c49a2e;
      --gold2:    #dbb84a;
      --gold-dim: rgba(196,154,46,0.10);
      --gold-b:   rgba(196,154,46,0.20);
      --bg:       #0b0905;
      --bg2:      #111009;
      --surface:  #191510;
      --surface2: #201c14;
      --border:   rgba(196,154,46,0.12);
      --border2:  rgba(255,255,255,0.05);
      --text1:    rgba(250,244,228,0.93);
      --text2:    rgba(218,196,148,0.60);
      --text3:    rgba(218,196,148,0.28);
      --green:    #2a7048;
      --green2:   #3d9662;
      --red:      #b83428;
      font-family: 'DM Sans', sans-serif;
      background: var(--bg);
      color: var(--text1);
      -webkit-font-smoothing: antialiased;
    }
    .slp-page.light {
      --bg: #f5f2ea;
      --bg2: #ede9de;
      --surface: #ffffff;
      --surface2: #f8f5ee;
      --border: rgba(196,154,46,0.18);
      --border2: rgba(0,0,0,0.07);
      --text1: #1a1508;
      --text2: rgba(60,48,20,0.65);
      --text3: rgba(60,48,20,0.30);
    }
    .slp-hed { font-family: 'Playfair Display', serif; }
    .slp-mono { font-family: 'JetBrains Mono', monospace; }

    /* Module pills */
    .slp-module-pill {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 5px 12px; border-radius: 99px;
      border: 1px solid var(--border); background: transparent;
      cursor: pointer; transition: all .18s; color: var(--text2);
      font-size: 11px; font-weight: 500; letter-spacing: .03em;
      white-space: nowrap;
    }
    .slp-module-pill:hover { border-color: var(--gold-b); color: var(--gold2); background: var(--gold-dim); }
    .slp-module-pill.active { border-color: var(--gold-b); color: var(--gold); background: var(--gold-dim); }

    /* Messages */
    .slp-msg-user {
      background: var(--gold-dim);
      border: 1px solid var(--gold-b);
      border-radius: 16px 16px 4px 16px;
      padding: 10px 14px;
      font-size: 13.5px; line-height: 1.65;
      font-weight: 300; color: var(--text1);
      max-width: 72%;
      white-space: pre-wrap; word-break: break-word;
    }
    .slp-msg-ai {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 4px 16px 16px 16px;
      padding: 12px 16px;
      font-size: 13.5px; line-height: 1.7;
      font-weight: 300; color: var(--text1);
      max-width: 80%;
      white-space: pre-wrap; word-break: break-word;
    }
    .slp-msg-ai code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11.5px;
      background: var(--surface2);
      border: 1px solid var(--border2);
      border-radius: 4px;
      padding: 1px 5px;
    }
    .slp-msg-ai pre {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      overflow-x: auto;
      margin: 8px 0;
    }
    .slp-msg-ai pre code { background: none; border: none; padding: 0; }
    .slp-msg-ai strong { color: var(--gold2); font-weight: 600; }
    .slp-msg-ai em { color: var(--text2); }
    .slp-msg-ai ul, .slp-msg-ai ol { padding-left: 20px; margin: 6px 0; }
    .slp-msg-ai li { margin-bottom: 4px; }
    .slp-msg-ai h1, .slp-msg-ai h2, .slp-msg-ai h3 {
      font-family: 'Playfair Display', serif;
      color: var(--gold2);
      margin: 10px 0 5px;
      font-size: inherit;
    }

    /* Cursor blink */
    @keyframes slp-blink { 0%,100%{opacity:1} 50%{opacity:0} }
    .slp-cursor {
      display: inline-block; width: 2px; height: .85em;
      background: var(--gold); margin-left: 2px;
      vertical-align: text-bottom; border-radius: 1px;
      animation: slp-blink .8s step-end infinite;
    }

    /* Typing dots */
    @keyframes slp-dot { 0%,100%{opacity:.2;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }
    .slp-typing-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--gold); display: inline-block; }

    /* Input */
    .slp-input {
      background: transparent; border: none; outline: none; resize: none;
      font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 300;
      color: var(--text1); line-height: 1.55; width: 100%;
      min-height: 24px; max-height: 140px; overflow-y: auto;
    }
    .slp-input::placeholder { color: var(--text3); }

    /* Quick prompts */
    .slp-quick {
      border: 1px solid var(--border); background: transparent;
      border-radius: 8px; padding: 8px 12px;
      font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 400;
      color: var(--text2); cursor: pointer; text-align: left;
      transition: all .15s;
    }
    .slp-quick:hover { border-color: var(--gold-b); color: var(--gold2); background: var(--gold-dim); }

    /* Scrollbar */
    .slp-scroll::-webkit-scrollbar { width: 3px; }
    .slp-scroll::-webkit-scrollbar-track { background: transparent; }
    .slp-scroll::-webkit-scrollbar-thumb { background: var(--gold-b); border-radius: 2px; }

    /* Gold shimmer line */
    .slp-shimmer-line {
      height: 1px;
      background: linear-gradient(90deg, transparent 5%, var(--gold2) 35%, #f5d47a 50%, var(--gold2) 65%, transparent 95%);
    }

    @keyframes slp-fade-up { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .slp-msg-row { animation: slp-fade-up .22s ease forwards; }
  `
  document.head.appendChild(s)
}

// ─── Module config ────────────────────────────────────────────────────────────

const MODULES: { id: ChatModule; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: 'general', label: 'General', icon: <Zap className="h-3.5 w-3.5" />, hint: 'Ask anything about the CRM' },
  { id: 'appointments', label: 'Appointments', icon: <Calendar className="h-3.5 w-3.5" />, hint: 'Leads, bookings & scheduling' },
  { id: 'timeproof', label: 'Timeproof', icon: <Clock className="h-3.5 w-3.5" />, hint: 'Attendance & work hours' },
  { id: 'supraspace', label: 'Supra Space', icon: <MessageSquare className="h-3.5 w-3.5" />, hint: 'Team messaging insights' },
  { id: 'biometrics', label: 'Biometrics', icon: <Fingerprint className="h-3.5 w-3.5" />, hint: 'Security & credentials' },
  { id: 'feeds', label: 'Feeds', icon: <Rss className="h-3.5 w-3.5" />, hint: 'Team activity & posts' },
]

const QUICK_PROMPTS: Record<ChatModule, string[]> = {
  general: [
    'Give me a quick summary of today\'s CRM activity',
    'What should I prioritize today?',
    'Help me draft a follow-up email for a hot lead',
  ],
  appointments: [
    'Summarize my upcoming appointments this week',
    'What leads need follow-up today?',
    'Draft a professional appointment confirmation email',
  ],
  timeproof: [
    'How many hours have I worked this week?',
    'Am I on track with my attendance this month?',
    'Generate a timeproof report summary for me',
  ],
  supraspace: [
    'What conversations have unread messages?',
    'Draft a team announcement about our Q1 performance',
    'Summarize recent team activity in Supra Space',
  ],
  biometrics: [
    'Explain how biometric login works in our CRM',
    'What are best practices for SSH key security?',
    'Help me understand my security credentials',
  ],
  feeds: [
    'What did the team post today?',
    'Help me write an engaging team motivation post',
    'Summarize recent team feed activity',
  ],
}

// ─── Markdown renderer (simple) ───────────────────────────────────────────────

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
      <div className="slp-msg-row flex justify-end gap-3 px-4">
        <div className="slp-msg-user">{msg.content}</div>
        <div className="h-8 w-8 rounded-xl shrink-0 flex items-center justify-center" style={{ background: 'rgba(196,154,46,0.2)', border: '1px solid rgba(196,154,46,0.3)' }}>
          <User className="h-4 w-4" style={{ color: 'var(--gold2)' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="slp-msg-row flex gap-3 px-4">
      <SupraLeoAvatar state={isStreaming ? 'speaking' : 'idle'} size={32} animate={isStreaming} style={{ flexShrink: 0, marginTop: 2 }} />
      <div className="slp-msg-ai flex-1">
        {isEmpty ? (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '2px 0' }}>
            {[0, 1, 2].map(i => (
              <span key={i} className="slp-typing-dot" style={{ animation: `slp-dot 1.1s ${i * 0.18}s ease-in-out infinite` }} />
            ))}
          </div>
        ) : (
          <>
            <span dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
            {isStreaming && <span className="slp-cursor" />}
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
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span className="slp-mono" style={{ fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--text3)' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SupraLeoPage() {
  const router = useRouter()
  const [activeModule, setActiveModule] = React.useState<ChatModule>('general')
  const [inputText, setInputText] = React.useState('')
  const [showClearConfirm, setShowClearConfirm] = React.useState(false)
  const [status, setStatus] = React.useState<any>(null)

  const scrollRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const moduleScrollRef = React.useRef<HTMLDivElement>(null)

  const {
    messages,
    isLoading,
    isLoadingHistory,
    hasMore,
    error,
    sendMessage,
    stopGeneration,
    clearHistory,
    loadHistory,
    loadMoreHistory,
  } = useSupraLeoChat({ module: activeModule, autoLoadHistory: true })

  // Load status on mount
  React.useEffect(() => {
    const token = localStorage.getItem('crm_token')
    if (!token) { router.replace('/crm'); return }
    apiClient.get('/api/supraleo/status', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setStatus(r.data?.data))
      .catch(() => {})
  }, [router])

  // Auto-scroll to bottom
  React.useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, messages[messages.length - 1]?.content])

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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleModuleChange = (mod: ChatModule) => {
    setActiveModule(mod)
  }

  const handleClear = async () => {
    await clearHistory()
    setShowClearConfirm(false)
  }

  const quickPrompts = QUICK_PROMPTS[activeModule]
  const showEmpty = messages.length === 0 && !isLoadingHistory

  // Group messages by date for separators
  const groupedMessages = React.useMemo(() => {
    const groups: { date: string; messages: ChatMessage[] }[] = []
    let currentDate = ''
    messages.forEach(msg => {
      const d = new Date(msg.createdAt)
      const dateStr = d.toDateString()
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
    <div className="slp-page flex flex-col h-screen overflow-hidden">

      {/* ── Top bar ── */}
      <div style={{ background: 'rgba(11,9,5,0.9)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)', flexShrink: 0 }}>
        <div className="slp-shimmer-line" />
        <div className="flex items-center gap-3 px-5 h-14">
          {/* Back */}
          <button
            onClick={() => router.push('/crm/dashboard')}
            className="h-8 w-8 rounded-xl flex items-center justify-center transition-all"
            style={{ border: '1px solid var(--border)', color: 'var(--text3)' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold-b)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          {/* Brand */}
          <div className="flex items-center gap-3">
            <SupraLeoAvatar state={isLoading ? 'speaking' : 'idle'} size={36} animate={isLoading} />
            <div>
              <div className="slp-hed" style={{ fontSize: 15, fontWeight: 600, color: 'var(--gold2)', letterSpacing: '.06em', lineHeight: 1 }}>
                Supra Leo
              </div>
              <div className="slp-mono" style={{ fontSize: 8, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--text3)', marginTop: 3 }}>
                AI Assistant
              </div>
            </div>
          </div>

          {/* Status badge */}
          {status && (
            <div style={{ marginLeft: 4, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--gold-dim)' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px rgba(42,112,72,0.8)' }} />
              <span className="slp-mono" style={{ fontSize: 8.5, letterSpacing: '.15em', color: 'var(--gold)', textTransform: 'uppercase' }}>Online</span>
            </div>
          )}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Chat stats */}
          {status?.context && (
            <div className="hidden sm:flex items-center gap-3">
              <span className="slp-mono" style={{ fontSize: 9, color: 'var(--text3)' }}>
                {status.context.chatMessages} messages
              </span>
            </div>
          )}

          {/* Clear button */}
          {messages.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="h-8 w-8 rounded-xl flex items-center justify-center transition-all"
              style={{ border: '1px solid var(--border)', color: 'var(--text3)' }}
              title="Clear chat history"
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(184,52,40,0.4)'; e.currentTarget.style.color = '#b83428' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)' }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Module selector */}
        <div ref={moduleScrollRef} className="flex items-center gap-2 px-5 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {MODULES.map(mod => (
            <button
              key={mod.id}
              className={`slp-module-pill ${activeModule === mod.id ? 'active' : ''}`}
              onClick={() => handleModuleChange(mod.id)}
            >
              {mod.icon}
              {mod.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Messages area ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto slp-scroll py-4 space-y-4">

        {/* Load more */}
        {hasMore && !isLoadingHistory && (
          <div className="flex justify-center py-2">
            <button
              onClick={loadMoreHistory}
              style={{ fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}
            >
              ↑ Load earlier messages
            </button>
          </div>
        )}

        {isLoadingHistory && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--gold-b)' }} />
          </div>
        )}

        {/* Empty state */}
        {showEmpty && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-8 px-8 text-center">
            <div>
              <SupraLeoAvatar state="idle" size={72} animate style={{ margin: '0 auto 16px' }} />
              <div className="slp-hed" style={{ fontSize: 22, fontWeight: 600, color: 'var(--gold2)', marginBottom: 8 }}>
                How can I help you today?
              </div>
              <div style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 300, maxWidth: 340 }}>
                {MODULES.find(m => m.id === activeModule)?.hint || 'Ask me anything about your CRM'}
              </div>
            </div>

            <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="slp-mono" style={{ fontSize: 8.5, letterSpacing: '.2em', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 4 }}>
                Quick starts
              </div>
              {quickPrompts.map(p => (
                <button key={p} className="slp-quick text-left" onClick={() => { setInputText(p); textareaRef.current?.focus() }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grouped messages */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(184,52,40,0.25)', background: 'rgba(184,52,40,0.06)', fontSize: 12, color: '#b83428' }}>
              {error}
            </div>
          </div>
        )}

        <div style={{ height: 8 }} />
      </div>

      {/* ── Input area ── */}
      <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'rgba(11,9,5,0.95)', backdropFilter: 'blur(20px)' }}>
        <div className="slp-shimmer-line" />
        <div style={{ padding: '14px 16px 18px' }}>
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 12,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '10px 12px 10px 16px',
            transition: 'border-color .18s',
          }}
            onFocusCapture={e => (e.currentTarget.style.borderColor = 'var(--gold-b)')}
            onBlurCapture={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <textarea
              ref={textareaRef}
              className="slp-input slp-scroll"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Ask Supra Leo about ${MODULES.find(m => m.id === activeModule)?.label.toLowerCase()}…`}
              rows={1}
              disabled={isLoading}
              style={{ flex: 1 }}
            />
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, paddingBottom: 2 }}>
              {isLoading ? (
                <button
                  onClick={stopGeneration}
                  style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(184,52,40,0.12)', border: '1px solid rgba(184,52,40,0.25)', color: '#b83428', cursor: 'pointer' }}
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
                    background: inputText.trim() ? 'var(--gold)' : 'var(--surface2)',
                    border: `1px solid ${inputText.trim() ? 'var(--gold)' : 'var(--border)'}`,
                    color: inputText.trim() ? '#0a0806' : 'var(--text3)',
                    cursor: inputText.trim() ? 'pointer' : 'default',
                    transition: 'all .18s',
                  }}
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="slp-mono" style={{ fontSize: 8.5, textAlign: 'center', color: 'var(--text3)', letterSpacing: '.12em', marginTop: 8 }}>
            ENTER TO SEND · SHIFT+ENTER FOR NEWLINE
          </div>
        </div>
      </div>

      {/* ── Clear confirm modal ── */}
      {showClearConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, width: 320, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
            <div className="slp-shimmer-line" style={{ marginBottom: 20, borderRadius: 4 }} />
            <div className="slp-hed" style={{ fontSize: 16, fontWeight: 600, color: 'var(--gold2)', marginBottom: 8 }}>
              Clear Chat History?
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 300, marginBottom: 20 }}>
              This will permanently delete all {messages.length} messages. This action cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{ flex: 1, height: 40, borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                onClick={handleClear}
                style={{ flex: 1, height: 40, borderRadius: 10, background: '#b83428', border: '1px solid rgba(184,52,40,0.4)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
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