'use client'

/**
 * SupraLeoPanel.tsx  (FULL REPLACEMENT)
 * Three-tab panel: Chat (AI), Assistant (voice/TTS), Reminder (module tasks).
 */

import * as React from 'react'
import {
  X, Square, Pause, Play, Volume2, Mic, Send, Edit3,
  RotateCcw, Loader2, CheckCircle2, AlertCircle, MessageSquare,
  ChevronRight, Calendar, Clock, Fingerprint, Rss, Maximize2,
  Bell, RefreshCw, AlertTriangle, Check,
} from 'lucide-react'
import { SupraLeoAvatar, type LeoState } from './SupraLeoAvatar'
import { apiClient } from '@/lib/api-client'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────
export type SpeakState =
  | 'idle' | 'fetching' | 'speaking' | 'paused'
  | 'waiting-command' | 'listening' | 'listening-reply'
  | 'sending' | 'done' | 'error'

export type ChatModule = 'appointments' | 'timeproof' | 'supraspace' | 'biometrics' | 'feeds' | 'general'

export interface SupraLeoEmail { from?: string; subject?: string; snippet?: string }
export interface SupraLeoMessage {
  sender?: string; senderEmail?: string; subject?: string
  snippet?: string; status?: string; canReply?: boolean
}

interface PanelProps {
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
  onSetTranscript: (t: string) => void
  onSendReply: () => Promise<void>
}

// ─── CSS injection (same pattern as before, extended) ────────────────────────
const PANEL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400&display=swap');

[data-slp] {
  --g: #b8892e;
  --g2: #d4a84b;
  --g-d: rgba(184,137,46,0.09);
  --g-b: rgba(184,137,46,0.18);
  --surf: #ffffff;
  --bg2: #f6f4f0;
  --bd: rgba(184,137,46,0.15);
  --bd2: rgba(0,0,0,0.07);
  --tx: #1a1610;
  --tx2: #574e3e;
  --tx3: rgba(80,68,50,0.46);
  --green: #2a7048;
  --red: #b83428;
  --blue: #2563eb;
  --amber: #d97706;
  --rad: 3px;
  --sh: 0 2px 8px rgba(0,0,0,0.08), 0 8px 28px rgba(0,0,0,0.06);
}
@media (prefers-color-scheme: dark) {
  [data-slp] {
    --surf: #17140e;
    --bg2: #1e1a13;
    --bd: rgba(184,137,46,0.2);
    --bd2: rgba(255,255,255,0.06);
    --tx: rgba(250,244,232,0.92);
    --tx2: rgba(218,196,162,0.64);
    --tx3: rgba(218,196,162,0.32);
    --sh: 0 2px 8px rgba(0,0,0,0.5), 0 8px 28px rgba(0,0,0,0.38);
  }
}
.dark [data-slp] {
  --surf: #17140e; --bg2: #1e1a13; --bd: rgba(184,137,46,0.2);
  --bd2: rgba(255,255,255,0.06); --tx: rgba(250,244,232,0.92);
  --tx2: rgba(218,196,162,0.64); --tx3: rgba(218,196,162,0.32);
  --sh: 0 2px 8px rgba(0,0,0,0.5), 0 8px 28px rgba(0,0,0,0.38);
}

@keyframes slp-in   { from{opacity:0;transform:translateY(7px)} to{opacity:1;transform:translateY(0)} }
@keyframes slp-dot  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.32;transform:scale(.72)} }
@keyframes slp-spin { to{transform:rotate(360deg)} }
@keyframes slp-wave { 0%,100%{transform:scaleY(.14)} 50%{transform:scaleY(1)} }
@keyframes slp-cur  { 0%,100%{opacity:1} 50%{opacity:0} }
@keyframes slp-msg  { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }

[data-slp] { font-family:'DM Sans',sans-serif; color:var(--tx); box-sizing:border-box; }
[data-slp] *, [data-slp] *::before, [data-slp] *::after { box-sizing:border-box; }

.slp-panel {
  width:340px; background:var(--surf); border:1px solid var(--bd);
  border-radius:var(--rad); box-shadow:var(--sh); overflow:hidden;
  display:flex; flex-direction:column; position:relative; max-height:560px;
}
.slp-panel::before {
  content:''; position:absolute; top:0; left:0; right:0; height:1px; z-index:5;
  background:linear-gradient(90deg,transparent 5%,var(--g2) 35%,#e8c060 50%,var(--g2) 65%,transparent 95%);
}
.slp-hdr {
  display:flex; align-items:center; gap:11px; padding:11px 14px;
  background:var(--bg2); border-bottom:1px solid var(--bd2); flex-shrink:0;
}
.slp-hdr-text { flex:1; min-width:0; }
.slp-name { font-family:'Playfair Display',serif; font-size:14px; font-weight:600; color:var(--g2); letter-spacing:.07em; line-height:1; margin-bottom:4px; }
.slp-status { display:flex; align-items:center; gap:5px; font-family:'JetBrains Mono',monospace; font-size:7.5px; letter-spacing:.17em; text-transform:uppercase; color:var(--tx3); }
.slp-dot { width:4px; height:4px; border-radius:50%; flex-shrink:0; }
.slp-close { width:25px; height:25px; border-radius:var(--rad); border:1px solid var(--bd2); background:none; cursor:pointer; color:var(--tx3); display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .14s; padding:0; }
.slp-close:hover { border-color:rgba(184,52,40,.3); background:rgba(184,52,40,.06); color:var(--red); }
.slp-expand { width:25px; height:25px; border-radius:var(--rad); border:1px solid var(--bd2); background:none; cursor:pointer; color:var(--tx3); display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .14s; padding:0; }
.slp-expand:hover { border-color:var(--g-b); background:var(--g-d); color:var(--g2); }

.slp-tabs { display:flex; background:var(--bg2); border-bottom:1px solid var(--bd2); flex-shrink:0; }
.slp-tab { flex:1; height:34px; border:none; background:none; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:11px; font-weight:500; color:var(--tx3); border-bottom:2px solid transparent; transition:all .18s; letter-spacing:.03em; position:relative; }
.slp-tab.on { color:var(--g2); border-bottom-color:var(--g); }
.slp-tab:not(.on):hover { color:var(--tx2); }
.slp-tab-badge { position:absolute; top:5px; right:8px; min-width:14px; height:14px; border-radius:7px; background:var(--red); color:#fff; font-size:7px; font-weight:700; display:flex; align-items:center; justify-content:center; padding:0 3px; }

.slp-body { padding:12px 14px; overflow-y:auto; display:flex; flex-direction:column; gap:9px; flex:1; }
.slp-body::-webkit-scrollbar { width:2px; }
.slp-body::-webkit-scrollbar-thumb { background:var(--bd); }

.slp-lbl { font-family:'JetBrains Mono',monospace; font-size:7.5px; letter-spacing:.2em; text-transform:uppercase; color:var(--tx3); margin-bottom:6px; }
.slp-div { height:1px; background:linear-gradient(90deg,transparent,var(--g-b),transparent); flex-shrink:0; }

.slp-card { border:1px solid var(--bd); border-radius:var(--rad); padding:11px 12px; background:var(--bg2); }
.slp-card-sender { font-size:12px; font-weight:500; color:var(--g2); margin-bottom:2px; }
.slp-card-subj { font-size:11.5px; color:var(--tx2); margin-bottom:5px; }
.slp-card-snip { font-size:11px; color:var(--tx3); line-height:1.55; border-top:1px solid var(--bd2); padding-top:5px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }

.slp-wait { border:1px solid rgba(42,112,72,.22); background:rgba(42,112,72,.045); border-radius:var(--rad); padding:11px 12px; }
.slp-wait-title { font-size:11px; font-weight:600; color:var(--green); margin-bottom:8px; display:flex; align-items:center; gap:5px; }
.slp-wait-grid { display:grid; grid-template-columns:1fr 1fr; gap:5px; margin-bottom:5px; }
.slp-wait-btn { height:29px; border:1px solid; border-radius:var(--rad); font-family:'DM Sans',sans-serif; font-size:10.5px; font-weight:500; cursor:pointer; transition:all .14s; display:flex; align-items:center; justify-content:center; gap:4px; padding:0 8px; }
.slp-wait-v { background:rgba(42,112,72,.07); border-color:rgba(42,112,72,.22); color:var(--green); }
.slp-wait-v:hover { background:rgba(42,112,72,.14); }
.slp-wait-d { background:var(--g-d); border-color:var(--g-b); color:var(--g2); }
.slp-wait-d:hover { background:rgba(184,137,46,.15); }
.slp-wait-x { width:100%; height:25px; background:none; border:1px solid var(--bd2); border-radius:var(--rad); font-family:'DM Sans',sans-serif; font-size:10px; color:var(--tx3); cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px; transition:all .14s; }
.slp-wait-x:hover { color:var(--tx2); background:var(--bg2); }

.slp-listen { display:flex; flex-direction:column; align-items:center; gap:9px; padding:14px 12px; border:1px solid rgba(42,112,72,.2); background:rgba(42,112,72,.04); border-radius:var(--rad); }
.slp-listen-lbl { font-family:'JetBrains Mono',monospace; font-size:8.5px; letter-spacing:.16em; color:var(--green); text-transform:uppercase; display:flex; align-items:center; gap:5px; }
.slp-listen-hint { font-size:11px; font-weight:300; color:rgba(42,112,72,.52); text-align:center; font-style:italic; }
.slp-wavebar { width:2px; border-radius:2px; background:var(--green); transform-origin:center; animation:slp-wave .48s ease-in-out infinite; }
.slp-transcript { border-left:2px solid var(--g); padding:8px 10px; background:var(--g-d); border-radius:0 var(--rad) var(--rad) 0; font-size:12px; font-weight:300; font-style:italic; color:var(--tx2); line-height:1.65; max-height:70px; overflow-y:auto; }
.slp-err { display:flex; align-items:flex-start; gap:8px; padding:10px 11px; border:1px solid rgba(184,52,40,.2); background:rgba(184,52,40,.04); border-radius:var(--rad); }
.slp-err p { font-size:12px; color:rgba(184,52,40,.85); line-height:1.55; margin:0; }
.slp-done { display:flex; align-items:center; gap:8px; padding:10px 11px; border:1px solid rgba(42,112,72,.2); background:rgba(42,112,72,.04); border-radius:var(--rad); }
.slp-done p { font-size:12px; color:var(--green); margin:0; }
.slp-empty { text-align:center; padding:20px 0 12px; }
.slp-reply { border-top:1px solid var(--bd2); padding:10px 14px 12px; flex-shrink:0; background:var(--bg2); }
.slp-input-row { display:flex; gap:7px; align-items:flex-end; border:1px solid var(--bd2); border-radius:var(--rad); padding:7px 8px 7px 11px; background:var(--surf); transition:border-color .15s; position:relative; z-index:1; }
.slp-input-row:focus-within { border-color:var(--g-b); }
.slp-ta { flex:1; background:transparent; border:none; outline:none; resize:none; font-family:'DM Sans',sans-serif; font-size:12.5px; font-weight:300; color:var(--tx); line-height:1.5; min-height:20px; max-height:80px; overflow-y:auto; padding:0; margin:0; pointer-events:auto; position:relative; z-index:2; -webkit-user-select:text; user-select:text; }
.slp-ta::placeholder { color:var(--tx3); }
.slp-ta:disabled { opacity:.5; cursor:not-allowed; }
.slp-send { width:28px; height:28px; border:1px solid var(--g); border-radius:var(--rad); background:var(--g); color:#0a0806; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .14s; padding:0; }
.slp-send:hover { background:var(--g2); border-color:var(--g2); }
.slp-send:disabled { opacity:.38; cursor:default; }
.slp-actions { display:flex; gap:5px; flex-wrap:wrap; flex-shrink:0; padding:9px 14px 11px; border-top:1px solid var(--bd2); background:var(--bg2); }
.slp-btn { display:inline-flex; align-items:center; gap:4px; height:26px; padding:0 9px; border:1px solid var(--bd); border-radius:var(--rad); background:none; color:var(--tx2); font-family:'DM Sans',sans-serif; font-size:10.5px; font-weight:500; cursor:pointer; transition:all .13s; white-space:nowrap; }
.slp-btn:hover { border-color:var(--g-b); background:var(--g-d); color:var(--g2); }
.slp-btn:disabled { opacity:.38; cursor:default; }
.slp-btn.pri { background:var(--g); border-color:var(--g); color:#0a0806; font-weight:600; }
.slp-btn.pri:hover { background:var(--g2); border-color:var(--g2); }
.slp-btn.dng { border-color:rgba(184,52,40,.22); color:var(--red); }
.slp-btn.dng:hover { background:rgba(184,52,40,.07); border-color:rgba(184,52,40,.38); }

/* Chat */
.slp-chat-wrap { display:flex; flex-direction:column; overflow:hidden; flex:1; min-height:0; }
.slp-chat-scroll { overflow-y:auto; padding:10px 14px; display:flex; flex-direction:column; gap:9px; flex:1; }
.slp-chat-scroll::-webkit-scrollbar { width:2px; }
.slp-chat-scroll::-webkit-scrollbar-thumb { background:var(--bd); }
.slp-msg-row { display:flex; align-items:flex-end; gap:6px; animation:slp-msg .2s ease forwards; }
.slp-msg-row.usr { flex-direction:row-reverse; }
.slp-bubble { max-width:85%; padding:8px 11px; border-radius:var(--rad); font-size:12px; line-height:1.62; font-weight:300; white-space:pre-wrap; word-break:break-word; }
.slp-bubble.usr { background:var(--g-d); border:1px solid var(--g-b); color:var(--tx); }
.slp-bubble.leo { background:var(--bg2); border:1px solid var(--bd2); color:var(--tx2); }
.slp-cur { display:inline-block; width:1.5px; height:.82em; background:var(--g); margin-left:2px; vertical-align:text-bottom; border-radius:1px; animation:slp-cur .85s step-end infinite; }
.slp-typing { display:flex; gap:3px; align-items:center; padding:3px 2px; }
.slp-typing-dot { width:5px; height:5px; border-radius:50%; background:var(--g); animation:slp-dot 1.1s ease-in-out infinite; }
.slp-quick-btn { display:flex; align-items:center; justify-content:space-between; width:100%; height:29px; padding:0 10px; border:1px solid var(--bd); border-radius:var(--rad); background:var(--g-d); color:var(--tx3); font-family:'DM Sans',sans-serif; font-size:11px; font-weight:400; cursor:pointer; transition:all .14s; }
.slp-quick-btn:hover { border-color:var(--g-b); color:var(--g2); background:rgba(184,137,46,.12); }

/* Reminder */
.slp-reminder-wrap { display:flex; flex-direction:column; overflow:hidden; flex:1; min-height:0; }
.slp-reminder-body { overflow-y:auto; padding:10px 14px; flex:1; }
.slp-reminder-body::-webkit-scrollbar { width:2px; }
.slp-reminder-body::-webkit-scrollbar-thumb { background:var(--bd); }
.slp-mod-sel { display:flex; gap:6px; flex-wrap:wrap; padding:10px 14px; border-bottom:1px solid var(--bd2); background:var(--bg2); flex-shrink:0; }
.slp-mod-btn { display:inline-flex; align-items:center; gap:4px; height:24px; padding:0 9px; border:1px solid var(--bd2); border-radius:99px; background:transparent; color:var(--tx3); font-size:10px; font-weight:500; cursor:pointer; transition:all .15s; }
.slp-mod-btn:hover { border-color:var(--g-b); color:var(--g2); background:var(--g-d); }
.slp-mod-btn.active { border-color:var(--g-b); color:var(--g); background:var(--g-d); }

.slp-reminder-item { border:1px solid var(--bd2); border-radius:6px; padding:8px 10px; margin-bottom:6px; transition:border-color .15s; }
.slp-reminder-item:hover { border-color:var(--bd); }
.slp-reminder-item.warn { border-color:rgba(217,119,6,0.25); background:rgba(217,119,6,0.04); }
.slp-reminder-item.info { border-color:rgba(37,99,235,0.2); background:rgba(37,99,235,0.04); }
.slp-reminder-item.success { border-color:rgba(42,112,72,0.2); background:rgba(42,112,72,0.04); }
`

function injectPanelCSS() {
  if (typeof document === 'undefined') return
  if (document.getElementById('sl-panel-v6')) return
  const el = document.createElement('style')
  el.id = 'sl-panel-v6'
  el.textContent = PANEL_CSS
  document.head.appendChild(el)
}

// ─── Status maps ──────────────────────────────────────────────────────────────

const STATUS_MAP: Record<SpeakState, { label: string; dotColor: string; pulse: boolean }> = {
  idle:              { label: 'Standby',          dotColor: 'rgba(184,137,46,.4)', pulse: false },
  fetching:          { label: 'Fetching…',        dotColor: '#b8892e', pulse: true },
  speaking:          { label: 'Speaking',         dotColor: '#b8892e', pulse: true },
  paused:            { label: 'Paused',           dotColor: 'rgba(184,137,46,.4)', pulse: false },
  'waiting-command': { label: 'Done reading',     dotColor: '#2a7048', pulse: false },
  listening:         { label: 'Listening',        dotColor: '#2a7048', pulse: true },
  'listening-reply': { label: 'Dictating reply',  dotColor: '#2a7048', pulse: true },
  sending:           { label: 'Sending…',         dotColor: '#b8892e', pulse: true },
  done:              { label: 'Complete',          dotColor: '#2a7048', pulse: false },
  error:             { label: 'Error',             dotColor: '#b83428', pulse: false },
}

const LEO_STATE: Record<SpeakState, LeoState> = {
  idle: 'idle', fetching: 'thinking', speaking: 'speaking', paused: 'idle',
  'waiting-command': 'waiting-command', listening: 'listening',
  'listening-reply': 'listening', sending: 'thinking', done: 'idle', error: 'error',
}

// ─── Reminder Modules ─────────────────────────────────────────────────────────

const REMINDER_MODULES = [
  { id: 'appointments', label: 'Appts', icon: <Calendar className="h-3 w-3" /> },
  { id: 'timeproof', label: 'Time', icon: <Clock className="h-3 w-3" /> },
  { id: 'supraspace', label: 'Space', icon: <MessageSquare className="h-3 w-3" /> },
  { id: 'biometrics', label: 'Bio', icon: <Fingerprint className="h-3 w-3" /> },
  { id: 'feeds', label: 'Feeds', icon: <Rss className="h-3 w-3" /> },
]

// ─── Reminder Tab ─────────────────────────────────────────────────────────────

function ReminderTab() {
  const [selectedModule, setSelectedModule] = React.useState('appointments')
  const [loading, setLoading] = React.useState(false)
  const [data, setData] = React.useState<any>(null)
  const [error, setError] = React.useState('')

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('crm_token') || '' : ''

  const fetchReminders = React.useCallback(async (mod: string) => {
    const token = getToken()
    if (!token) return
    setLoading(true)
    setError('')
    setData(null)
    try {
      const res = await apiClient.get(`/api/supraleo/reminders/${mod}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setData(res.data?.data)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load reminders')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchReminders(selectedModule)
  }, [selectedModule, fetchReminders])

  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const renderContent = () => {
    if (loading) return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
        <Loader2 size={18} style={{ animation: 'slp-spin .9s linear infinite', color: 'var(--g)' }} />
      </div>
    )
    if (error) return (
      <div style={{ padding: '12px', fontSize: 12, color: 'var(--red)', border: '1px solid rgba(184,52,40,.2)', borderRadius: 6, background: 'rgba(184,52,40,.04)' }}>
        {error}
      </div>
    )
    if (!data) return null

    switch (selectedModule) {
      case 'appointments': {
        const { today = [], upcoming = [], newLeads = [], pendingLeads = [], counts } = data
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Summary chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { label: `${counts?.todayAppointments || 0} Today`, color: 'var(--green)' },
                { label: `${counts?.upcomingThisWeek || 0} This Week`, color: 'var(--g)' },
                { label: `${counts?.newLeads || 0} New Leads`, color: 'var(--blue)' },
                { label: `${counts?.pendingLeads || 0} Pending`, color: 'var(--amber)' },
              ].map(c => (
                <span key={c.label} style={{ fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 99, border: `1px solid ${c.color}30`, background: `${c.color}0f`, color: c.color, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '.1em' }}>
                  {c.label}
                </span>
              ))}
            </div>

            {today.length > 0 && (
              <div>
                <div className="slp-lbl">Today's Appointments</div>
                {today.map((a: any, i: number) => (
                  <div key={i} className="slp-reminder-item success">
                    <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--tx)', marginBottom: 2 }}>{a.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--tx3)' }}>{fmtTime(a.startTime)} · {a.type} · {a.status}</div>
                  </div>
                ))}
              </div>
            )}

            {newLeads.length > 0 && (
              <div>
                <div className="slp-lbl">New Leads</div>
                {newLeads.slice(0, 5).map((l: any, i: number) => (
                  <div key={i} className="slp-reminder-item info">
                    <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--tx)', marginBottom: 2 }}>{l.firstName} {l.lastName}</div>
                    <div style={{ fontSize: 10, color: 'var(--tx3)' }}>{l.source} · {l.channel} · {fmtDate(l.createdAt)}</div>
                  </div>
                ))}
                {newLeads.length > 5 && <div style={{ fontSize: 10, color: 'var(--tx3)', textAlign: 'center', padding: '4px 0' }}>+{newLeads.length - 5} more leads</div>}
              </div>
            )}

            {today.length === 0 && newLeads.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--tx3)', fontSize: 12 }}>
                <CheckCircle2 size={20} style={{ color: 'var(--green)', margin: '0 auto 6px' }} />
                All clear! No urgent items.
              </div>
            )}
          </div>
        )
      }

      case 'timeproof': {
        const { today: t, alerts = [], weekLogsCount } = data
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="slp-card">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div className="slp-lbl">Clock-in</div>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'JetBrains Mono', color: t?.hasClockedIn ? 'var(--green)' : 'var(--tx3)' }}>
                    {t?.hasClockedIn ? (t?.timeIn ? fmtTime(t.timeIn) : '✓ Done') : '—'}
                  </div>
                </div>
                <div>
                  <div className="slp-lbl">Status</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: t?.isLive ? 'var(--green)' : t?.hasClockedOut ? 'var(--tx2)' : 'var(--amber)' }}>
                    {t?.isLive ? '● Live' : t?.hasClockedOut ? 'Completed' : 'Off Clock'}
                  </div>
                </div>
              </div>
            </div>

            {alerts.map((a: any, i: number) => (
              <div key={i} className={`slp-reminder-item ${a.type === 'warning' ? 'warn' : 'info'}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={11} style={{ color: a.type === 'warning' ? 'var(--amber)' : 'var(--blue)', flexShrink: 0 }} />
                  <div style={{ fontSize: 11.5, color: 'var(--tx2)' }}>{a.message}</div>
                </div>
              </div>
            ))}

            <div style={{ fontSize: 11, color: 'var(--tx3)', textAlign: 'center' }}>
              {weekLogsCount} log entries this week
            </div>
          </div>
        )
      }

      case 'supraspace': {
        const { unreadMessages = [], counts } = data
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 99, border: '1px solid rgba(37,99,235,0.25)', background: 'rgba(37,99,235,0.07)', color: 'var(--blue)', fontFamily: 'JetBrains Mono', letterSpacing: '.1em' }}>
                {counts?.unread || 0} Unread
              </span>
              <span style={{ fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 99, border: '1px solid var(--bd)', color: 'var(--tx3)', fontFamily: 'JetBrains Mono', letterSpacing: '.1em' }}>
                {counts?.activeConversations || 0} Convos
              </span>
            </div>

            {unreadMessages.length > 0 ? (
              <div>
                <div className="slp-lbl">Unread Messages</div>
                {unreadMessages.slice(0, 6).map((m: any, i: number) => (
                  <div key={i} className="slp-reminder-item info">
                    <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--tx)', marginBottom: 2 }}>
                      {(m.sender as any)?.fullName || 'Unknown'}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--tx2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.content || '📎 Attachment'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--tx3)', fontSize: 12 }}>
                <CheckCircle2 size={20} style={{ color: 'var(--green)', margin: '0 auto 6px' }} />
                All messages read!
              </div>
            )}
          </div>
        )
      }

      case 'biometrics': {
        const { alerts = [] } = data
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.map((a: any, i: number) => (
              <div key={i} className="slp-reminder-item info">
                <div style={{ fontSize: 11.5, color: 'var(--tx2)' }}>{a.message}</div>
              </div>
            ))}
          </div>
        )
      }

      case 'feeds': {
        const { newPosts = [], newComments = [], counts } = data
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 99, border: '1px solid var(--g-b)', background: 'var(--g-d)', color: 'var(--g)', fontFamily: 'JetBrains Mono', letterSpacing: '.1em' }}>
                {counts?.newPostsToday || 0} New Posts
              </span>
              <span style={{ fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 99, border: '1px solid var(--bd)', color: 'var(--tx3)', fontFamily: 'JetBrains Mono', letterSpacing: '.1em' }}>
                {counts?.newCommentsToday || 0} Comments
              </span>
            </div>

            {newPosts.length > 0 && (
              <div>
                <div className="slp-lbl">Recent Posts</div>
                {newPosts.slice(0, 4).map((p: any, i: number) => (
                  <div key={i} className="slp-reminder-item">
                    <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--tx)', marginBottom: 2 }}>{p.authorName}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--tx3)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {p.content}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {newPosts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--tx3)', fontSize: 12 }}>
                No new posts today.
              </div>
            )}
          </div>
        )
      }

      default:
        return null
    }
  }

  return (
    <div className="slp-reminder-wrap">
      {/* Module selector */}
      <div className="slp-mod-sel">
        {REMINDER_MODULES.map(m => (
          <button
            key={m.id}
            className={`slp-mod-btn ${selectedModule === m.id ? 'active' : ''}`}
            onClick={() => setSelectedModule(m.id)}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
        <button
          onClick={() => fetchReminders(selectedModule)}
          className="slp-mod-btn"
          title="Refresh"
          style={{ marginLeft: 'auto' }}
        >
          <RefreshCw size={10} />
        </button>
      </div>

      <div className="slp-reminder-body">
        {renderContent()}
      </div>
    </div>
  )
}

// ─── Chat Tab ────────────────────────────────────────────────────────────────

interface ChatMsg { id: string; role: 'user' | 'leo'; text: string; streaming?: boolean }

const QUICK_PROMPTS: Record<string, string[]> = {
  appointments: ['Summarize my leads', 'Draft a follow-up email', 'What\'s on my calendar today?'],
  timeproof: ['How many hours this week?', 'Am I on track with attendance?', 'Generate my timeproof summary'],
  supraspace: ['What messages need my attention?', 'Draft a team announcement', 'Summarize unread conversations'],
  biometrics: ['Explain biometric login', 'SSH key best practices', 'Review my security status'],
  feeds: ['What did the team post today?', 'Write a motivational team post', 'Summarize recent team activity'],
  general: ['Help with a lead follow-up', 'Draft a professional email', 'What should I prioritize today?'],
}

function ChatTab({ activeModule = 'general' }: { activeModule?: string }) {
  const [messages, setMessages] = React.useState<ChatMsg[]>([])
  const [input, setInput] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const abortRef = React.useRef<AbortController | null>(null)

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('crm_token') || '' : ''

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const send = async (overrideText?: string) => {
    const text = (overrideText || input).trim()
    if (!text || loading) return
    const uid = Date.now().toString()
    const lid = (Date.now() + 1).toString()
    setMessages(prev => [...prev,
      { id: uid, role: 'user', text },
      { id: lid, role: 'leo', text: '', streaming: true },
    ])
    setInput('')
    setLoading(true)

    const token = getToken()

    try {
      abortRef.current = new AbortController()
      const res = await fetch('/api/supraleo/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text, module: activeModule, stream: true }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) throw new Error('API error')
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let acc = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = dec.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue
          try {
            const p = JSON.parse(raw)
            if (p.type === 'delta') {
              acc += p.text
              setMessages(prev => prev.map(m => m.id === lid ? { ...m, text: acc } : m))
            } else if (p.type === 'done') {
              setMessages(prev => prev.map(m => m.id === lid ? { ...m, streaming: false } : m))
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages(prev => prev.map(m => m.id === lid ? { ...m, text: 'Something went wrong. Please try again.', streaming: false } : m))
      } else {
        setMessages(prev => prev.map(m => m.id === lid ? { ...m, streaming: false } : m))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const prompts = QUICK_PROMPTS[activeModule] || QUICK_PROMPTS.general

  return (
    <div className="slp-chat-wrap">
      <div ref={scrollRef} className="slp-chat-scroll">
        {messages.length === 0 && (
          <div className="slp-empty" style={{ padding: '14px 0 8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <SupraLeoAvatar state="idle" size={38} animate />
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 13, color: 'var(--g2)', marginBottom: 3, textAlign: 'center' }}>
                How can I help?
              </div>
              <div style={{ fontSize: 11, color: 'var(--tx3)', fontWeight: 300, textAlign: 'center' }}>
                Leads, replies, strategy — just ask.
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {prompts.map(p => (
                <button key={p} className="slp-quick-btn" onClick={() => send(p)}>
                  {p}
                  <ChevronRight size={10} style={{ opacity: 0.4, flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`slp-msg-row ${msg.role === 'user' ? 'usr' : ''}`}>
            {msg.role === 'leo' && (
              <SupraLeoAvatar state={msg.streaming ? 'thinking' : 'idle'} size={22} animate={!!msg.streaming} />
            )}
            <div className={`slp-bubble ${msg.role === 'user' ? 'usr' : 'leo'}`}>
              {msg.role === 'leo' && msg.text === '' && msg.streaming ? (
                <div className="slp-typing">
                  {[0, 1, 2].map(i => <div key={i} className="slp-typing-dot" style={{ animationDelay: `${i * 0.16}s` }} />)}
                </div>
              ) : (
                <>
                  {msg.text}
                  {msg.streaming && msg.text && <span className="slp-cur" />}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="slp-div" style={{ margin: '0 14px 0' }} />

      <div style={{ padding: '8px 14px 10px' }}>
        <div className="slp-input-row">
          <textarea
            ref={textareaRef}
            className="slp-ta"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask Supra Leo…"
            rows={1}
            disabled={loading}
            style={{ pointerEvents: 'auto', userSelect: 'text' }}
          />
          {loading ? (
            <button className="slp-send" onClick={() => abortRef.current?.abort()}>
              <Square size={10} />
            </button>
          ) : (
            <button className="slp-send" onClick={() => send()} disabled={!input.trim()}>
              <Send size={10} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Waveform ─────────────────────────────────────────────────────────────────

function Waveform({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 14 }}>
      {Array.from({ length: 11 }).map((_, i) => {
        const edge = i < 1 || i > 9
        return (
          <div key={i} className="slp-wavebar" style={{
            height: edge ? 3 : 12, opacity: edge ? 0.2 : 0.75,
            animationDuration: `${(0.3 + i * 0.038).toFixed(2)}s`,
            animationDelay: `${(i * 0.038).toFixed(2)}s`,
          }} />
        )
      })}
    </div>
  )
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function SupraLeoPanel({
  state, email, message, errorMsg, voiceName, transcript,
  onStop, onPause, onResume, onClose, onReplay,
  onStartListeningForCommand, onStartReplyListening,
  onSetTranscript, onSendReply,
}: PanelProps) {
  const [tab, setTab] = React.useState<'chat' | 'assistant' | 'reminder'>('chat')
  const [activeModule, setActiveModule] = React.useState('general')
  const [reply, setReply] = React.useState('')
  const [editing, setEditing] = React.useState(false)
  const [editText, setEditText] = React.useState('')
  const [reminderCounts, setReminderCounts] = React.useState<Record<string, number>>({})
  const replyRef = React.useRef<HTMLTextAreaElement>(null)
  const editRef = React.useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  React.useEffect(() => { injectPanelCSS() }, [])

  React.useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus()
      editRef.current.selectionStart = editRef.current.value.length
    }
  }, [editing])

  // Detect module from message context
  React.useEffect(() => {
    if (message) setActiveModule('appointments')
  }, [message])

  const st = STATUS_MAP[state]
  const isSpeaking = state === 'speaking'
  const isPaused = state === 'paused'
  const isWaiting = state === 'waiting-command'
  const isListening = state === 'listening'
  const isReplyMic = state === 'listening-reply'
  const isSending = state === 'sending'
  const isDone = state === 'done'
  const isError = state === 'error'
  const isIdle = state === 'idle'
  const isFetching = state === 'fetching'
  const isActive = isSpeaking || isPaused || isListening || isReplyMic || isSending
  const waveActive = isSpeaking || isListening || isReplyMic

  const totalReminders = Object.values(reminderCounts).reduce((a, b) => a + b, 0)

  return (
    <div data-slp>
      <div className="slp-panel">

        {/* Header */}
        <div className="slp-hdr">
          <SupraLeoAvatar state={LEO_STATE[state]} size={40} animate />
          <div className="slp-hdr-text">
            <div className="slp-name">Supra Leo</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="slp-status">
                <div className="slp-dot" style={{ background: st.dotColor, animation: st.pulse ? 'slp-dot 1.3s ease-in-out infinite' : 'none' }} />
                <span>{st.label}</span>
                {voiceName && (
                  <>
                    <span style={{ opacity: 0.3, margin: '0 1px' }}>·</span>
                    <Volume2 size={7} style={{ opacity: 0.4 }} />
                    <span style={{ maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{voiceName}</span>
                  </>
                )}
              </div>
              <Waveform active={waveActive} />
            </div>
          </div>

          {/* Expand to full screen */}
          <button className="slp-expand" onClick={() => router.push('/crm/supra-leo')} title="Open full screen">
            <Maximize2 size={11} />
          </button>
          <button className="slp-close" onClick={onClose}>×</button>
        </div>

        {/* Tabs — Chat / Assistant / Reminder */}
        <div className="slp-tabs">
          <button className={`slp-tab ${tab === 'chat' ? 'on' : ''}`} onClick={() => setTab('chat')}>Chat</button>
          <button className={`slp-tab ${tab === 'assistant' ? 'on' : ''}`} onClick={() => setTab('assistant')}>Assistant</button>
          <button className={`slp-tab ${tab === 'reminder' ? 'on' : ''}`} onClick={() => setTab('reminder')} style={{ position: 'relative' }}>
            Reminder
            {totalReminders > 0 && <span className="slp-tab-badge">{totalReminders > 9 ? '9+' : totalReminders}</span>}
          </button>
        </div>

        {/* ── Chat Tab ── */}
        {tab === 'chat' && <ChatTab activeModule={activeModule} />}

        {/* ── Reminder Tab ── */}
        {tab === 'reminder' && <ReminderTab />}

        {/* ── Assistant Tab ── */}
        {tab === 'assistant' && (
          <>
            <div className="slp-body">
              {isError && errorMsg && (
                <div className="slp-err">
                  <AlertCircle size={13} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 1 }} />
                  <p>{errorMsg}</p>
                </div>
              )}

              {(message || email) && (
                <div className="slp-card">
                  <div className="slp-card-sender">{message?.sender || email?.from}</div>
                  {message?.senderEmail && (
                    <div style={{ fontSize: 9.5, fontFamily: "'JetBrains Mono',monospace", color: 'var(--tx3)', marginBottom: 4 }}>
                      {message.senderEmail}
                    </div>
                  )}
                  <div className="slp-card-subj">{message?.subject || email?.subject}</div>
                  {(message?.snippet || email?.snippet) && (
                    <div className="slp-card-snip">{message?.snippet || email?.snippet}</div>
                  )}
                  {message?.status && (
                    <span style={{
                      display: 'inline-block', marginTop: 5, fontSize: 8, fontFamily: 'JetBrains Mono', letterSpacing: '.1em', padding: '2px 6px', borderRadius: 2,
                      background: message.status === 'Closed' ? 'rgba(184,52,40,.07)' : 'rgba(42,112,72,.07)',
                      border: `1px solid ${message.status === 'Closed' ? 'rgba(184,52,40,.22)' : 'rgba(42,112,72,.22)'}`,
                      color: message.status === 'Closed' ? 'var(--red)' : 'var(--green)',
                    }}>
                      {message.status.toUpperCase()}
                    </span>
                  )}
                </div>
              )}

              {isWaiting && (
                <div className="slp-wait">
                  <div className="slp-wait-title"><CheckCircle2 size={11} /> Done reading — what next?</div>
                  <div className="slp-wait-grid">
                    <button className="slp-wait-btn slp-wait-v" onClick={onStartListeningForCommand}><Mic size={10} /> Reply by Voice</button>
                    <button className="slp-wait-btn slp-wait-d" onClick={onStartReplyListening}><MessageSquare size={10} /> Dictate Reply</button>
                  </div>
                  <button className="slp-wait-x" onClick={onStop}><X size={9} /> Close</button>
                </div>
              )}

              {isListening && (
                <div className="slp-listen">
                  <div className="slp-listen-lbl">
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 7px rgba(42,112,72,.7)', animation: 'slp-dot .7s ease-in-out infinite' }} />
                    Listening for command
                  </div>
                  <Waveform active />
                  <div className="slp-listen-hint">Say "Reply", "Stop", or "Read again"</div>
                </div>
              )}

              {isReplyMic && (
                <div className="slp-listen">
                  <div className="slp-listen-lbl">
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 7px rgba(42,112,72,.7)', animation: 'slp-dot .7s ease-in-out infinite' }} />
                    Dictating your reply
                  </div>
                  <Waveform active />
                  {transcript && <div className="slp-transcript" style={{ width: '100%', textAlign: 'left' }}>{transcript}</div>}
                  <div className="slp-listen-hint" style={{ fontSize: 10.5 }}>Speak clearly · stops after silence</div>
                </div>
              )}

              {isSending && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: '1px solid var(--g-b)', background: 'var(--g-d)', borderRadius: 'var(--rad)' }}>
                  <Loader2 size={13} style={{ color: 'var(--g2)', animation: 'slp-spin .9s linear infinite' }} />
                  <span style={{ fontSize: 12, color: 'var(--g2)' }}>Sending reply…</span>
                </div>
              )}

              {isDone && transcript && !editing && (
                <div>
                  <div className="slp-lbl">Your Reply</div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <div className="slp-transcript" style={{ flex: 1 }}>{transcript}</div>
                    <button className="slp-btn" style={{ padding: '0 7px', height: 26, flexShrink: 0 }} onClick={() => { setEditText(transcript); setEditing(true) }}>
                      <Edit3 size={9} />
                    </button>
                  </div>
                </div>
              )}

              {isDone && editing && (
                <div>
                  <div className="slp-lbl">Edit Reply</div>
                  <div className="slp-input-row">
                    <textarea ref={editRef} className="slp-ta" value={editText} onChange={e => setEditText(e.target.value)} rows={4} style={{ height: 78, pointerEvents: 'auto' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end', marginTop: 5 }}>
                    <button className="slp-btn" onClick={() => setEditing(false)}>Cancel</button>
                    <button className="slp-btn pri" onClick={() => { onSetTranscript(editText); setEditing(false) }}>Save</button>
                  </div>
                </div>
              )}

              {isDone && !transcript && message && (
                <div className="slp-done">
                  <CheckCircle2 size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />
                  <p>Message read complete.</p>
                </div>
              )}

              {isIdle && !message && !email && (
                <div className="slp-empty">
                  <SupraLeoAvatar state="idle" size={44} animate style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: 12, color: 'var(--tx3)', fontWeight: 300 }}>
                    Click the read button on a lead to begin
                  </div>
                </div>
              )}
            </div>

            {/* Reply compose */}
            {(state !== 'idle' || !!message) && !isWaiting && (
              <div className="slp-reply">
                <div className="slp-lbl">Reply</div>
                <div className="slp-input-row">
                  <textarea
                    ref={replyRef}
                    className="slp-ta"
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSendReply(); setReply('') } }}
                    placeholder="Compose your reply…"
                    rows={1}
                    style={{ pointerEvents: 'auto' }}
                  />
                  <button className="slp-send" onClick={() => { onSendReply(); setReply('') }} disabled={!reply.trim()}>
                    <Send size={10} />
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="slp-actions">
              {isDone && transcript ? (
                <>
                  <button className="slp-btn pri" onClick={onSendReply} disabled={!transcript.trim()}><Send size={9} /> Send Reply</button>
                  <button className="slp-btn" onClick={onStartReplyListening}><RotateCcw size={9} /> Re-dictate</button>
                  <button className="slp-btn" onClick={() => { setEditText(transcript); setEditing(true) }}><Edit3 size={9} /> Edit</button>
                  <button className="slp-btn dng" onClick={onStop}><X size={9} /> Discard</button>
                </>
              ) : !isWaiting && (
                <>
                  {(isSpeaking || isPaused) && (
                    <button className="slp-btn" onClick={isPaused ? onResume : onPause}>
                      {isPaused ? <Play size={9} /> : <Pause size={9} />}
                      {isPaused ? 'Resume' : 'Pause'}
                    </button>
                  )}
                  {(isIdle || !!message) && !isFetching && (
                    <button className="slp-btn" onClick={onReplay}><Play size={9} /> {message ? 'Replay' : 'Read'}</button>
                  )}
                  {isFetching && (
                    <button className="slp-btn" disabled>
                      <Loader2 size={9} style={{ animation: 'slp-spin .9s linear infinite' }} /> Fetching…
                    </button>
                  )}
                  {!isListening && !!message && (
                    <button className="slp-btn" onClick={onStartReplyListening}><Mic size={9} /> Voice Reply</button>
                  )}
                  {isActive && (
                    <button className="slp-btn dng" onClick={onStop}><Square size={9} /> Stop</button>
                  )}
                  {/* Full screen link */}
                  <button className="slp-btn" onClick={() => router.push('/crm/supra-leo')} style={{ marginLeft: 'auto' }}>
                    <Maximize2 size={9} /> Full Screen
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default SupraLeoPanel