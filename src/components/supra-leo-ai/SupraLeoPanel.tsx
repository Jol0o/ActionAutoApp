'use client'

import * as React from 'react'
import {
  X, Square, Pause, Play, Volume2, Mic, Send, Edit3,
  RotateCcw, Loader2, CheckCircle2, AlertCircle, MessageSquare,
  ChevronRight, Calendar, Clock, Fingerprint, Rss, Maximize2,
  RefreshCw, AlertTriangle, Zap, BookOpen, FileText, CalendarPlus,
  Star, Sparkles, Mail, Phone, User, Tag, TrendingUp, ChevronDown,
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
  leadId?: string
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

// ─── Panel CSS ────────────────────────────────────────────────────────────────
export const UPDATED_PANEL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@300;400&display=swap');
 
/* ── Dark tokens (default) ── */
[data-axp] {
  --p-bg:      #060D1A;
  --p-bg2:     #0A1628;
  --p-surf:    #0F1E35;
  --p-surf2:   #162440;
  --p-bd:      rgba(59,130,246,0.14);
  --p-bd2:     rgba(255,255,255,0.06);
  --p-acc:     #3B82F6;
  --p-acc2:    #60A5FA;
  --p-orange:  #F59E0B;
  --p-silver:  #94AFC6;
  --p-tx:      rgba(220,235,255,0.95);
  --p-tx2:     rgba(140,175,220,0.68);
  --p-tx3:     rgba(80,130,185,0.38);
  --p-green:   #10B981;
  --p-red:     #EF4444;
  --p-blue:    #3B82F6;
  --p-amber:   #F59E0B;
  --p-purple:  #8B5CF6;
  --p-sh:      0 2px 12px rgba(0,0,0,0.55), 0 8px 32px rgba(0,0,0,0.40), 0 0 0 1px rgba(59,130,246,0.06);
  --p-glass:   rgba(9,18,36,0.92);
  font-family: 'DM Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
}
 
/* ── System light mode ── */
@media (prefers-color-scheme: light) {
  [data-axp] {
    --p-bg:    #F0F5FB;
    --p-bg2:   #E2ECF8;
    --p-surf:  #FFFFFF;
    --p-surf2: #F4F8FE;
    --p-bd:    rgba(37,99,235,0.14);
    --p-bd2:   rgba(0,0,0,0.08);
    --p-acc:   #2563EB;
    --p-acc2:  #3B82F6;
    --p-silver:#6B8BAE;
    --p-tx:    #0B1F3A;
    --p-tx2:   rgba(10,50,100,0.70);
    --p-tx3:   rgba(10,50,100,0.38);
    --p-sh:    0 2px 12px rgba(0,0,0,0.08), 0 8px 28px rgba(37,99,235,0.08);
    --p-glass: rgba(255,255,255,0.96);
  }
}
 
/* ── Class-based dark override ── */
.dark [data-axp] {
  --p-bg:      #060D1A;
  --p-bg2:     #0A1628;
  --p-surf:    #0F1E35;
  --p-surf2:   #162440;
  --p-bd:      rgba(59,130,246,0.14);
  --p-bd2:     rgba(255,255,255,0.06);
  --p-acc:     #3B82F6;
  --p-acc2:    #60A5FA;
  --p-tx:      rgba(220,235,255,0.95);
  --p-tx2:     rgba(140,175,220,0.68);
  --p-tx3:     rgba(80,130,185,0.38);
  --p-sh:      0 2px 12px rgba(0,0,0,0.55), 0 8px 32px rgba(0,0,0,0.40);
  --p-glass:   rgba(9,18,36,0.92);
}
 
/* ── Class-based light override ── */
.light [data-axp] {
  --p-bg:    #F0F5FB;
  --p-bg2:   #E2ECF8;
  --p-surf:  #FFFFFF;
  --p-surf2: #F4F8FE;
  --p-bd:    rgba(37,99,235,0.14);
  --p-bd2:   rgba(0,0,0,0.08);
  --p-acc:   #2563EB;
  --p-acc2:  #3B82F6;
  --p-tx:    #0B1F3A;
  --p-tx2:   rgba(10,50,100,0.70);
  --p-tx3:   rgba(10,50,100,0.38);
  --p-sh:    0 2px 12px rgba(0,0,0,0.08), 0 8px 28px rgba(37,99,235,0.08);
  --p-glass: rgba(255,255,255,0.96);
}
 
/* Animations */
@keyframes axp-in    { from{opacity:0;transform:translateY(8px) scale(.99)} to{opacity:1;transform:translateY(0) scale(1)} }
@keyframes axp-dot   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.2;transform:scale(.65)} }
@keyframes axp-spin  { to{transform:rotate(360deg)} }
@keyframes axp-wave  { 0%,100%{transform:scaleY(.12)} 50%{transform:scaleY(1)} }
@keyframes axp-cur   { 0%,100%{opacity:1} 50%{opacity:0} }
@keyframes axp-msg   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
@keyframes axp-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(59,130,246,0)} 50%{box-shadow:0 0 0 4px rgba(59,130,246,0.15)} }
@keyframes axp-scan  { 0%{transform:translateY(-100%);opacity:.5} 100%{transform:translateY(400px);opacity:0} }
@keyframes axp-shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
@keyframes axp-slide-in { from{opacity:0;transform:translateX(12px)} to{opacity:1;transform:translateX(0)} }
@keyframes axp-pop  { 0%{transform:scale(0.85);opacity:0} 60%{transform:scale(1.03)} 100%{transform:scale(1);opacity:1} }
@keyframes axp-glow { 0%,100%{opacity:0.5} 50%{opacity:1} }
 
[data-axp] { color: var(--p-tx); box-sizing: border-box; }
[data-axp] *, [data-axp] *::before, [data-axp] *::after { box-sizing: border-box; }
 
/* ── Panel shell ── */
.axp-panel {
  width: min(380px, calc(100vw - 32px));
  background: var(--p-glass);
  border: 1px solid var(--p-bd);
  border-radius: 16px;
  box-shadow: var(--p-sh);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  max-height: min(620px, calc(100vh - 100px));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
.axp-panel::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  z-index: 5;
  background: linear-gradient(90deg, transparent 0%, var(--p-acc2) 30%, rgba(200,230,255,.8) 50%, var(--p-acc2) 70%, transparent 100%);
  background-size: 200% 100%;
  animation: axp-shimmer 4s linear infinite;
}
.axp-panel::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 40px;
  background: linear-gradient(180deg, rgba(59,130,246,.03) 0%, transparent 100%);
  animation: axp-scan 6s linear infinite;
  pointer-events: none;
  z-index: 1;
}
 
/* ── Header ── */
.axp-hdr {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 12px 14px;
  background: var(--p-surf);
  border-bottom: 1px solid var(--p-bd2);
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}
.axp-hdr-text { flex: 1; min-width: 0; }
.axp-name {
  font-family: 'Rajdhani', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: var(--p-acc2);
  letter-spacing: .10em;
  line-height: 1;
  margin-bottom: 3px;
  text-transform: uppercase;
}
.axp-slogan {
  font-family: 'JetBrains Mono', monospace;
  font-size: 7px;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--p-tx3);
  display: block;
  margin-bottom: 3px;
}
.axp-status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 7.5px;
  letter-spacing: .15em;
  text-transform: uppercase;
  color: var(--p-tx3);
}
.axp-dot { width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0; }
.axp-icon-btn {
  width: 26px; height: 26px;
  border-radius: 7px;
  border: 1px solid var(--p-bd2);
  background: none;
  cursor: pointer;
  color: var(--p-tx3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all .15s;
  padding: 0;
}
.axp-icon-btn:hover {
  border-color: rgba(59,130,246,.3);
  background: rgba(59,130,246,.08);
  color: var(--p-acc2);
}
.axp-icon-btn.close:hover {
  border-color: rgba(239,68,68,.3);
  background: rgba(239,68,68,.07);
  color: var(--p-red);
}
 
/* ── Tabs ── */
.axp-tabs {
  display: flex;
  background: var(--p-surf);
  border-bottom: 1px solid var(--p-bd2);
  flex-shrink: 0;
  position: relative;
}
.axp-tab {
  flex: 1;
  height: 36px;
  border: none;
  background: none;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: var(--p-tx3);
  border-bottom: 2px solid transparent;
  transition: all .18s;
  letter-spacing: .04em;
  position: relative;
}
.axp-tab.on {
  color: var(--p-acc2);
  border-bottom-color: var(--p-acc);
}
.axp-tab:not(.on):hover { color: var(--p-tx2); }
.axp-tab-badge {
  position: absolute;
  top: 5px; right: 8px;
  min-width: 14px; height: 14px;
  border-radius: 7px;
  background: var(--p-red);
  color: #fff;
  font-size: 7px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
}
 
/* ── Body ── */
.axp-body {
  padding: 12px 14px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 9px;
  flex: 1;
}
.axp-body::-webkit-scrollbar { width: 2px; }
.axp-body::-webkit-scrollbar-thumb { background: var(--p-bd); border-radius: 1px; }
 
.axp-lbl {
  font-family: 'JetBrains Mono', monospace;
  font-size: 7.5px;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: var(--p-tx3);
  margin-bottom: 6px;
}
.axp-div {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--p-bd), transparent);
  flex-shrink: 0;
}
 
/* Cards */
.axp-card {
  border: 1px solid var(--p-bd);
  border-radius: 10px;
  padding: 11px 13px;
  background: var(--p-surf);
  position: relative;
  overflow: hidden;
}
.axp-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 20%, var(--p-acc)30 50%, transparent 80%);
}
.axp-card-sender { font-size: 12px; font-weight: 600; color: var(--p-acc2); margin-bottom: 2px; }
.axp-card-subj { font-size: 11.5px; color: var(--p-tx2); margin-bottom: 5px; }
.axp-card-snip {
  font-size: 11px; color: var(--p-tx3); line-height: 1.55;
  border-top: 1px solid var(--p-bd2); padding-top: 5px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
 
/* States */
.axp-wait {
  border: 1px solid rgba(16,185,129,.22);
  background: rgba(16,185,129,.045);
  border-radius: 10px;
  padding: 11px 13px;
}
.axp-wait-title {
  font-size: 11px; font-weight: 600; color: var(--p-green);
  margin-bottom: 9px; display: flex; align-items: center; gap: 5px;
}
.axp-wait-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 5px; }
.axp-wait-btn {
  height: 30px; border: 1px solid; border-radius: 7px;
  font-family: 'DM Sans', sans-serif; font-size: 10.5px; font-weight: 500;
  cursor: pointer; transition: all .15s;
  display: flex; align-items: center; justify-content: center; gap: 4px; padding: 0 8px;
}
.axp-wait-v { background: rgba(16,185,129,.08); border-color: rgba(16,185,129,.25); color: var(--p-green); }
.axp-wait-v:hover { background: rgba(16,185,129,.15); }
.axp-wait-d { background: rgba(59,130,246,.08); border-color: rgba(59,130,246,.25); color: var(--p-acc2); }
.axp-wait-d:hover { background: rgba(59,130,246,.15); }
.axp-wait-x {
  width: 100%; height: 26px; background: none;
  border: 1px solid var(--p-bd2); border-radius: 7px;
  font-family: 'DM Sans', sans-serif; font-size: 10px; color: var(--p-tx3);
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;
  transition: all .14s;
}
.axp-wait-x:hover { color: var(--p-tx2); background: var(--p-surf2); }
 
/* Listening */
.axp-listen {
  display: flex; flex-direction: column; align-items: center; gap: 9px;
  padding: 14px 13px;
  border: 1px solid rgba(16,185,129,.22);
  background: rgba(16,185,129,.04);
  border-radius: 10px;
}
.axp-listen-lbl {
  font-family: 'JetBrains Mono', monospace; font-size: 8px; letter-spacing: .16em;
  color: var(--p-green); text-transform: uppercase;
  display: flex; align-items: center; gap: 5px;
}
.axp-listen-hint { font-size: 11px; font-weight: 300; color: rgba(16,185,129,.52); text-align: center; font-style: italic; }
.axp-wavebar {
  width: 2px; border-radius: 2px; background: var(--p-green);
  transform-origin: center; animation: axp-wave .5s ease-in-out infinite;
}
.axp-transcript {
  border-left: 2px solid var(--p-acc);
  padding: 8px 10px;
  background: rgba(59,130,246,.06);
  border-radius: 0 8px 8px 0;
  font-size: 12px; font-weight: 300; font-style: italic; color: var(--p-tx2);
  line-height: 1.65; max-height: 70px; overflow-y: auto; width: 100%;
}
 
/* Error / Done */
.axp-err {
  display: flex; align-items: flex-start; gap: 8px; padding: 10px 11px;
  border: 1px solid rgba(239,68,68,.2); background: rgba(239,68,68,.05); border-radius: 10px;
}
.axp-err p { font-size: 12px; color: rgba(239,68,68,.85); line-height: 1.55; margin: 0; }
.axp-done {
  display: flex; align-items: center; gap: 8px; padding: 10px 11px;
  border: 1px solid rgba(16,185,129,.2); background: rgba(16,185,129,.04); border-radius: 10px;
}
.axp-done p { font-size: 12px; color: var(--p-green); margin: 0; }
.axp-empty { text-align: center; padding: 20px 0 12px; }
 
/* Reply & Input */
.axp-reply {
  border-top: 1px solid var(--p-bd2);
  padding: 10px 14px 12px;
  flex-shrink: 0;
  background: var(--p-surf);
}
.axp-input-row {
  display: flex; gap: 7px; align-items: flex-end;
  border: 1px solid var(--p-bd2); border-radius: 10px;
  padding: 7px 8px 7px 11px;
  background: var(--p-bg2);
  transition: border-color .15s;
}
.axp-input-row:focus-within { border-color: rgba(59,130,246,.35); }
.axp-ta {
  flex: 1; background: transparent; border: none; outline: none; resize: none;
  font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 300;
  color: var(--p-tx); line-height: 1.5; min-height: 20px; max-height: 80px;
  overflow-y: auto; padding: 0; margin: 0;
  -webkit-user-select: text; user-select: text;
}
.axp-ta::placeholder { color: var(--p-tx3); }
.axp-ta:disabled { opacity: .5; cursor: not-allowed; }
 
/* Send button */
.axp-send {
  width: 28px; height: 28px;
  border: 1px solid var(--p-acc);
  border-radius: 7px;
  background: var(--p-acc);
  color: #fff;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all .15s; padding: 0;
}
.axp-send:hover { background: var(--p-acc2); border-color: var(--p-acc2); }
.axp-send:disabled { opacity: .35; cursor: default; }
 
/* Action buttons */
.axp-actions {
  display: flex; gap: 5px; flex-wrap: wrap; flex-shrink: 0;
  padding: 9px 14px 11px;
  border-top: 1px solid var(--p-bd2);
  background: var(--p-surf);
}
.axp-btn {
  display: inline-flex; align-items: center; gap: 4px;
  height: 27px; padding: 0 9px;
  border: 1px solid var(--p-bd);
  border-radius: 7px;
  background: none; color: var(--p-tx2);
  font-family: 'DM Sans', sans-serif; font-size: 10.5px; font-weight: 500;
  cursor: pointer; transition: all .14s; white-space: nowrap;
}
.axp-btn:hover { border-color: rgba(59,130,246,.3); background: rgba(59,130,246,.07); color: var(--p-acc2); }
.axp-btn:disabled { opacity: .35; cursor: default; }
.axp-btn.pri { background: var(--p-acc); border-color: var(--p-acc); color: #fff; font-weight: 600; }
.axp-btn.pri:hover { background: var(--p-acc2); border-color: var(--p-acc2); }
.axp-btn.dng { border-color: rgba(239,68,68,.22); color: var(--p-red); }
.axp-btn.dng:hover { background: rgba(239,68,68,.07); border-color: rgba(239,68,68,.35); }
 
/* Chat */
.axp-chat-wrap { display: flex; flex-direction: column; overflow: hidden; flex: 1; min-height: 0; }
.axp-chat-scroll {
  overflow-y: auto; padding: 10px 14px;
  display: flex; flex-direction: column; gap: 9px; flex: 1;
}
.axp-chat-scroll::-webkit-scrollbar { width: 2px; }
.axp-chat-scroll::-webkit-scrollbar-thumb { background: var(--p-bd); }
.axp-msg-row { display: flex; align-items: flex-end; gap: 6px; animation: axp-msg .22s ease forwards; }
.axp-msg-row.usr { flex-direction: row-reverse; }
.axp-bubble {
  max-width: 85%; padding: 8px 12px;
  border-radius: 12px;
  font-size: 12px; line-height: 1.65; font-weight: 300;
  white-space: pre-wrap; word-break: break-word;
}
.axp-bubble.usr {
  background: rgba(59,130,246,.12);
  border: 1px solid rgba(59,130,246,.22);
  color: var(--p-tx);
  border-radius: 12px 12px 4px 12px;
}
.axp-bubble.leo {
  background: var(--p-surf);
  border: 1px solid var(--p-bd2);
  color: var(--p-tx2);
  border-radius: 4px 12px 12px 12px;
}
.axp-cur {
  display: inline-block; width: 1.5px; height: .82em;
  background: var(--p-acc); margin-left: 2px;
  vertical-align: text-bottom; border-radius: 1px;
  animation: axp-cur .85s step-end infinite;
}
.axp-typing { display: flex; gap: 3px; align-items: center; padding: 3px 2px; }
.axp-typing-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--p-acc); animation: axp-dot 1.1s ease-in-out infinite; }
 
.axp-quick-btn {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; height: 30px; padding: 0 10px;
  border: 1px solid var(--p-bd);
  border-radius: 8px;
  background: rgba(59,130,246,.04);
  color: var(--p-tx3);
  font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 400;
  cursor: pointer; transition: all .15s; text-align: left;
}
.axp-quick-btn:hover { border-color: rgba(59,130,246,.28); color: var(--p-acc2); background: rgba(59,130,246,.09); }
 
/* ── ASSISTANT TAB ── */
.axp-assist-scroll {
  overflow-y: auto; flex: 1;
  display: flex; flex-direction: column;
  padding: 10px 14px; gap: 8px;
}
.axp-assist-scroll::-webkit-scrollbar { width: 2px; }
.axp-assist-scroll::-webkit-scrollbar-thumb { background: var(--p-bd); }
 
.axp-section-hdr {
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px; letter-spacing: .22em; text-transform: uppercase;
  color: var(--p-tx3); padding: 4px 0 6px;
  display: flex; align-items: center; gap: 6px;
}
.axp-section-hdr::after {
  content: ''; flex: 1; height: 1px;
  background: linear-gradient(90deg, var(--p-bd), transparent);
}
 
.axp-action-card {
  border: 1px solid var(--p-bd2);
  border-radius: 10px;
  background: var(--p-surf);
  overflow: hidden;
  transition: border-color .18s, box-shadow .18s;
  animation: axp-slide-in .22s ease forwards;
}
.axp-action-card:hover {
  border-color: rgba(59,130,246,.22);
  box-shadow: 0 2px 12px rgba(59,130,246,.08);
}
.axp-action-card-hdr {
  display: flex; align-items: center; gap: 9px;
  padding: 9px 12px; cursor: pointer;
  transition: background .15s;
}
.axp-action-card-hdr:hover { background: rgba(59,130,246,.04); }
.axp-action-icon {
  width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.axp-action-title {
  flex: 1;
  font-size: 12px; font-weight: 600; color: var(--p-tx);
  line-height: 1.2;
}
.axp-action-sub {
  font-size: 10px; font-weight: 300; color: var(--p-tx3); margin-top: 1px;
}
.axp-action-body {
  padding: 0 12px 11px;
  border-top: 1px solid var(--p-bd2);
  margin-top: -1px;
}
.axp-action-result {
  font-size: 12px; font-weight: 300; color: var(--p-tx2);
  line-height: 1.65; white-space: pre-wrap;
  max-height: 200px; overflow-y: auto;
  padding: 8px 0;
}
.axp-action-result::-webkit-scrollbar { width: 2px; }
.axp-action-result::-webkit-scrollbar-thumb { background: var(--p-bd); }
 
.axp-gen-btn {
  display: inline-flex; align-items: center; gap: 5px;
  height: 28px; padding: 0 12px; margin-top: 8px;
  border: 1px solid rgba(59,130,246,.28);
  border-radius: 7px;
  background: rgba(59,130,246,.08);
  color: var(--p-acc2);
  font-family: 'DM Sans', sans-serif; font-size: 10.5px; font-weight: 500;
  cursor: pointer; transition: all .15s;
}
.axp-gen-btn:hover { background: rgba(59,130,246,.15); }
.axp-gen-btn:disabled { opacity: .4; cursor: default; }
 
.axp-copy-btn {
  display: inline-flex; align-items: center; gap: 4px;
  height: 24px; padding: 0 8px; margin-top: 5px;
  border: 1px solid var(--p-bd2); border-radius: 6px;
  background: transparent; color: var(--p-tx3);
  font-size: 9.5px; cursor: pointer; transition: all .14s;
}
.axp-copy-btn:hover { color: var(--p-acc2); border-color: rgba(59,130,246,.25); }
 
.axp-lead-row {
  display: flex; align-items: center; gap: 7px;
  padding: 5px 0; border-bottom: 1px solid var(--p-bd2);
  font-size: 11px;
}
.axp-lead-row:last-child { border-bottom: none; }
.axp-lead-key { color: var(--p-tx3); min-width: 60px; }
.axp-lead-val { color: var(--p-tx); font-weight: 500; }
 
.axp-appt-form { display: flex; flex-direction: column; gap: 7px; padding: 8px 0; }
.axp-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.axp-field-lbl {
  font-family: 'JetBrains Mono', monospace; font-size: 7.5px;
  letter-spacing: .15em; text-transform: uppercase; color: var(--p-tx3); margin-bottom: 3px;
}
.axp-field-input {
  width: 100%; height: 30px;
  background: var(--p-bg2);
  border: 1px solid var(--p-bd2); border-radius: 7px;
  padding: 0 9px;
  font-family: 'DM Sans', sans-serif; font-size: 11.5px; color: var(--p-tx);
  outline: none; transition: border-color .14s;
}
.axp-field-input:focus { border-color: rgba(59,130,246,.35); }
 
.axp-chip {
  display: inline-flex; align-items: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8.5px; font-weight: 600; letter-spacing: .1em;
  padding: 3px 8px; border-radius: 99px;
  border: 1px solid; text-transform: uppercase;
}
 
.axp-reminder-wrap { display: flex; flex-direction: column; overflow: hidden; flex: 1; min-height: 0; }
.axp-reminder-body { overflow-y: auto; padding: 10px 14px; flex: 1; }
.axp-reminder-body::-webkit-scrollbar { width: 2px; }
.axp-reminder-body::-webkit-scrollbar-thumb { background: var(--p-bd); }
.axp-mod-sel {
  display: flex; gap: 5px; flex-wrap: wrap;
  padding: 9px 14px; border-bottom: 1px solid var(--p-bd2);
  background: var(--p-surf); flex-shrink: 0;
}
.axp-mod-btn {
  display: inline-flex; align-items: center; gap: 4px;
  height: 24px; padding: 0 8px;
  border: 1px solid var(--p-bd2); border-radius: 99px;
  background: transparent; color: var(--p-tx3);
  font-size: 10px; font-weight: 500; cursor: pointer; transition: all .15s;
}
.axp-mod-btn:hover { border-color: rgba(59,130,246,.25); color: var(--p-acc2); background: rgba(59,130,246,.07); }
.axp-mod-btn.active { border-color: rgba(59,130,246,.3); color: var(--p-acc); background: rgba(59,130,246,.10); }
 
.axp-reminder-item {
  border: 1px solid var(--p-bd2); border-radius: 8px;
  padding: 8px 10px; margin-bottom: 6px; transition: border-color .15s;
}
.axp-reminder-item:hover { border-color: var(--p-bd); }
.axp-reminder-item.warn { border-color: rgba(245,158,11,.25); background: rgba(245,158,11,.04); }
.axp-reminder-item.info { border-color: rgba(59,130,246,.2); background: rgba(59,130,246,.04); }
.axp-reminder-item.success { border-color: rgba(16,185,129,.2); background: rgba(16,185,129,.04); }
`

function injectPanelCSS() {
  if (typeof document === 'undefined') return
  if (document.getElementById('ax-panel-v2')) return
  const el = document.createElement('style')
  el.id = 'ax-panel-v2'
 el.textContent = UPDATED_PANEL_CSS
  document.head.appendChild(el)
}

// ─── Status maps ──────────────────────────────────────────────────────────────
const STATUS_MAP: Record<SpeakState, { label: string; dotColor: string; pulse: boolean }> = {
  idle:              { label: 'Standby',   dotColor: 'rgba(59,130,246,.35)', pulse: false },
  fetching:          { label: 'Fetching…', dotColor: '#8B5CF6',             pulse: true  },
  speaking:          { label: 'Speaking',  dotColor: '#F59E0B',             pulse: true  },
  paused:            { label: 'Paused',    dotColor: 'rgba(59,130,246,.35)',pulse: false },
  'waiting-command': { label: 'Awaiting',  dotColor: '#10B981',             pulse: false },
  listening:         { label: 'Listening', dotColor: '#10B981',             pulse: true  },
  'listening-reply': { label: 'Dictating', dotColor: '#10B981',             pulse: true  },
  sending:           { label: 'Sending…',  dotColor: '#F59E0B',             pulse: true  },
  done:              { label: 'Complete',  dotColor: '#10B981',             pulse: false },
  error:             { label: 'Error',     dotColor: '#EF4444',             pulse: false },
}

const LEO_STATE: Record<SpeakState, LeoState> = {
  idle: 'idle', fetching: 'thinking', speaking: 'speaking', paused: 'idle',
  'waiting-command': 'waiting-command', listening: 'listening',
  'listening-reply': 'listening', sending: 'thinking', done: 'idle', error: 'error',
}

// ─── Reminder modules ─────────────────────────────────────────────────────────
const REMINDER_MODULES = [
  { id: 'appointments', label: 'Appts',  icon: <Calendar className="h-3 w-3" /> },
  { id: 'timeproof',    label: 'Time',   icon: <Clock className="h-3 w-3" /> },
  { id: 'supraspace',   label: 'Space',  icon: <MessageSquare className="h-3 w-3" /> },
  { id: 'biometrics',   label: 'Bio',    icon: <Fingerprint className="h-3 w-3" /> },
  { id: 'feeds',        label: 'Feeds',  icon: <Rss className="h-3 w-3" /> },
]

// ─── Quick prompts ────────────────────────────────────────────────────────────
const QUICK_PROMPTS: Record<string, string[]> = {
  appointments: ['Summarize my leads today', 'Draft a follow-up email', "What's on my schedule?"],
  timeproof:    ['Hours worked this week?', 'Am I on track with attendance?', 'Generate my timeproof summary'],
  supraspace:   ['Messages needing attention?', 'Draft a team announcement', 'Summarize unread threads'],
  biometrics:   ['Explain biometric login', 'SSH key best practices', 'Review my security status'],
  feeds:        ['What did the team post?', 'Write a motivational post', 'Summarize team activity'],
  general:      ['Help with a lead follow-up', 'Draft a professional email', 'What should I prioritize?'],
}

// ─── Waveform ─────────────────────────────────────────────────────────────────
function Waveform({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 14 }}>
      {Array.from({ length: 11 }).map((_, i) => {
        const edge = i < 1 || i > 9
        return (
          <div key={i} className="axp-wavebar" style={{
            height: edge ? 3 : 12, opacity: edge ? 0.2 : 0.75,
            animationDuration: `${(0.32 + i * 0.04).toFixed(2)}s`,
            animationDelay: `${(i * 0.038).toFixed(2)}s`,
          }} />
        )
      })}
    </div>
  )
}

// ─── Chat Tab ─────────────────────────────────────────────────────────────────
interface ChatMsg { id: string; role: 'user' | 'leo'; text: string; streaming?: boolean }

function ChatTab({ activeModule = 'general' }: { activeModule?: string }) {
  const [messages, setMessages] = React.useState<ChatMsg[]>([])
  const [input, setInput] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
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

    try {
      abortRef.current = new AbortController()
      const res = await fetch('/api/supraleo/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
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
        for (const line of dec.decode(value, { stream: true }).split('\n')) {
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
    } finally { setLoading(false) }
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const prompts = QUICK_PROMPTS[activeModule] || QUICK_PROMPTS.general

  return (
    <div className="axp-chat-wrap">
      <div ref={scrollRef} className="axp-chat-scroll">
        {messages.length === 0 && (
          <div className="axp-empty" style={{ padding: '14px 0 8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <SupraLeoAvatar state="idle" size={40} animate />
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 15, fontWeight: 700, color: 'var(--p-acc2)', letterSpacing: '.08em', textTransform: 'uppercase', textAlign: 'center' }}>
                How can I help?
              </div>
              <div style={{ fontSize: 11, color: 'var(--p-tx3)', fontWeight: 300, textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '.06em' }}>
                Driven by Intelligence
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {prompts.map(p => (
                <button key={p} className="axp-quick-btn" onClick={() => send(p)}>
                  {p}
                  <ChevronRight size={10} style={{ opacity: 0.4, flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`axp-msg-row ${msg.role === 'user' ? 'usr' : ''}`}>
            {msg.role === 'leo' && (
              <SupraLeoAvatar state={msg.streaming ? 'thinking' : 'idle'} size={22} animate={!!msg.streaming} />
            )}
            <div className={`axp-bubble ${msg.role === 'user' ? 'usr' : 'leo'}`}>
              {msg.role === 'leo' && msg.text === '' && msg.streaming ? (
                <div className="axp-typing">
                  {[0, 1, 2].map(i => <div key={i} className="axp-typing-dot" style={{ animationDelay: `${i * 0.16}s` }} />)}
                </div>
              ) : (
                <>
                  {msg.text}
                  {msg.streaming && msg.text && <span className="axp-cur" />}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="axp-div" style={{ margin: '0 14px' }} />

      <div style={{ padding: '8px 14px 10px' }}>
        <div className="axp-input-row">
          <textarea
            className="axp-ta"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask Autrix AI…"
            rows={1}
            disabled={loading}
          />
          {loading ? (
            <button className="axp-send" onClick={() => abortRef.current?.abort()}>
              <Square size={10} />
            </button>
          ) : (
            <button className="axp-send" onClick={() => send()} disabled={!input.trim()}>
              <Send size={10} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

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
    setLoading(true); setError(''); setData(null)
    try {
      const res = await apiClient.get(`/api/supraleo/reminders/${mod}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setData(res.data?.data)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load data')
    } finally { setLoading(false) }
  }, [])

  React.useEffect(() => { fetchReminders(selectedModule) }, [selectedModule, fetchReminders])

  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const renderContent = () => {
    if (loading) return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
        <Loader2 size={18} style={{ animation: 'axp-spin .9s linear infinite', color: 'var(--p-acc)' }} />
      </div>
    )
    if (error) return (
      <div style={{ padding: '12px', fontSize: 12, color: 'var(--p-red)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, background: 'rgba(239,68,68,.04)' }}>
        {error}
      </div>
    )
    if (!data) return null

    switch (selectedModule) {
      case 'appointments': {
        const { today = [], newLeads = [], pendingLeads = [], counts } = data
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {[
                { label: `${counts?.todayAppointments || 0} Today`, bg: 'rgba(16,185,129,.08)', bd: 'rgba(16,185,129,.25)', c: 'var(--p-green)' },
                { label: `${counts?.upcomingThisWeek || 0} Week`,   bg: 'rgba(59,130,246,.08)',  bd: 'rgba(59,130,246,.25)',  c: 'var(--p-acc)' },
                { label: `${counts?.newLeads || 0} New`,            bg: 'rgba(139,92,246,.08)', bd: 'rgba(139,92,246,.25)', c: 'var(--p-purple)' },
                { label: `${counts?.pendingLeads || 0} Pending`,    bg: 'rgba(245,158,11,.08)', bd: 'rgba(245,158,11,.25)', c: 'var(--p-amber)' },
              ].map(c => (
                <span key={c.label} className="axp-chip" style={{ background: c.bg, borderColor: c.bd, color: c.c }}>{c.label}</span>
              ))}
            </div>
            {today.length > 0 && (
              <div>
                <div className="axp-lbl">Today's Schedule</div>
                {today.map((a: any, i: number) => (
                  <div key={i} className="axp-reminder-item success">
                    <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--p-tx)', marginBottom: 2 }}>{a.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--p-tx3)' }}>{fmtTime(a.startTime)} · {a.type} · {a.status}</div>
                  </div>
                ))}
              </div>
            )}
            {newLeads.length > 0 && (
              <div>
                <div className="axp-lbl">New Leads</div>
                {newLeads.slice(0, 5).map((l: any, i: number) => (
                  <div key={i} className="axp-reminder-item info">
                    <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--p-tx)', marginBottom: 2 }}>{l.firstName} {l.lastName}</div>
                    <div style={{ fontSize: 10, color: 'var(--p-tx3)' }}>{l.source} · {fmtDate(l.createdAt)}</div>
                  </div>
                ))}
                {newLeads.length > 5 && <div style={{ fontSize: 10, color: 'var(--p-tx3)', textAlign: 'center', padding: '4px 0' }}>+{newLeads.length - 5} more</div>}
              </div>
            )}
            {today.length === 0 && newLeads.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--p-tx3)', fontSize: 12 }}>
                <CheckCircle2 size={20} style={{ color: 'var(--p-green)', margin: '0 auto 6px', display: 'block' }} />
                All clear for now.
              </div>
            )}
          </div>
        )
      }
      default: return null
    }
  }

  return (
    <div className="axp-reminder-wrap">
      <div className="axp-mod-sel">
        {REMINDER_MODULES.map(m => (
          <button key={m.id} className={`axp-mod-btn ${selectedModule === m.id ? 'active' : ''}`} onClick={() => setSelectedModule(m.id)}>
            {m.icon} {m.label}
          </button>
        ))}
        <button onClick={() => fetchReminders(selectedModule)} className="axp-mod-btn" title="Refresh" style={{ marginLeft: 'auto' }}>
          <RefreshCw size={10} />
        </button>
      </div>
      <div className="axp-reminder-body">{renderContent()}</div>
    </div>
  )
}

// ─── Assistant Action Card ────────────────────────────────────────────────────
interface ActionCardProps {
  icon: React.ReactNode
  iconBg: string
  title: string
  subtitle: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function ActionCard({ icon, iconBg, title, subtitle, children, defaultOpen = false }: ActionCardProps) {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <div className="axp-action-card">
      <div className="axp-action-card-hdr" onClick={() => setOpen(p => !p)}>
        <div className="axp-action-icon" style={{ background: iconBg }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="axp-action-title">{title}</div>
          <div className="axp-action-sub">{subtitle}</div>
        </div>
        <ChevronDown size={12} style={{ color: 'var(--p-tx3)', transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }} />
      </div>
      {open && <div className="axp-action-body">{children}</div>}
    </div>
  )
}

// ─── AI Generate helper ───────────────────────────────────────────────────────
async function aiGenerate(prompt: string, module: string): Promise<string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('crm_token') || '' : ''
  const res = await fetch('/api/supraleo/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message: prompt, module, stream: false }),
  })
  if (!res.ok) throw new Error('AI error')
  const data = await res.json()
  return data?.data?.message || ''
}

// ─── Book Appointment Card ────────────────────────────────────────────────────
function BookAppointmentCard({ message }: { message: SupraLeoMessage | null }) {
  const [form, setForm] = React.useState({ title: '', date: '', time: '', notes: '', location: '' })
  const [loading, setLoading] = React.useState(false)
  const [done, setDone] = React.useState(false)
  const [err, setErr] = React.useState('')

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleBook = async () => {
    if (!form.date || !form.time) { setErr('Date and time are required'); return }
    setLoading(true); setErr('')
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('crm_token') || '' : ''
      await apiClient.post('/api/appointments', {
        title: form.title || `Appointment${message?.sender ? ` with ${message.sender}` : ''}`,
        startTime: new Date(`${form.date}T${form.time}`).toISOString(),
        endTime: new Date(new Date(`${form.date}T${form.time}`).getTime() + 3600000).toISOString(),
        notes: form.notes,
        location: form.location,
        status: 'pending',
        type: 'appointment',
      }, { headers: { Authorization: `Bearer ${token}` } })
      setDone(true)
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Failed to book appointment')
    } finally { setLoading(false) }
  }

  if (done) return (
    <div style={{ padding: '12px 0', textAlign: 'center' }}>
      <CheckCircle2 size={22} style={{ color: 'var(--p-green)', margin: '0 auto 6px', display: 'block' }} />
      <div style={{ fontSize: 12, color: 'var(--p-green)', fontWeight: 600 }}>Appointment Booked!</div>
      <button className="axp-copy-btn" style={{ margin: '6px auto 0' }} onClick={() => setDone(false)}>Book Another</button>
    </div>
  )

  return (
    <div className="axp-appt-form">
      <div>
        <div className="axp-field-lbl">Title</div>
        <input
          className="axp-field-input"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder={message?.sender ? `Appointment with ${message.sender}` : 'Appointment title'}
        />
      </div>
      <div className="axp-form-row">
        <div>
          <div className="axp-field-lbl">Date</div>
          <input type="date" className="axp-field-input" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
        <div>
          <div className="axp-field-lbl">Time</div>
          <input type="time" className="axp-field-input" value={form.time} onChange={e => set('time', e.target.value)} />
        </div>
      </div>
      <div>
        <div className="axp-field-lbl">Location</div>
        <input className="axp-field-input" value={form.location} onChange={e => set('location', e.target.value)} placeholder="Dealership / Video Call" />
      </div>
      <div>
        <div className="axp-field-lbl">Notes</div>
        <input className="axp-field-input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes…" />
      </div>
      {err && <div style={{ fontSize: 10.5, color: 'var(--p-red)' }}>{err}</div>}
      <button
        className="axp-gen-btn"
        style={{ background: 'var(--p-acc)', borderColor: 'var(--p-acc)', color: '#fff', marginTop: 4 }}
        onClick={handleBook} disabled={loading}
      >
        {loading ? <Loader2 size={10} style={{ animation: 'axp-spin .9s linear infinite' }} /> : <CalendarPlus size={10} />}
        {loading ? 'Booking…' : 'Confirm Appointment'}
      </button>
    </div>
  )
}

// ─── Reply Composer Card ──────────────────────────────────────────────────────
function ReplyComposerCard({ message }: { message: SupraLeoMessage | null }) {
  const [tone, setTone] = React.useState<'professional' | 'friendly' | 'follow-up' | 'custom'>('professional')
  const [customPrompt, setCustomPrompt] = React.useState('')
  const [result, setResult] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const tones = [
    { id: 'professional', label: 'Professional' },
    { id: 'friendly', label: 'Friendly' },
    { id: 'follow-up', label: 'Follow-Up' },
    { id: 'custom', label: 'Custom' },
  ] as const

  const handleGenerate = async () => {
    setLoading(true); setResult('')
    try {
      const senderInfo = message ? `Lead: ${message.sender || 'Customer'} (${message.senderEmail || ''}), Subject: ${message.subject || ''}` : 'a new automotive inquiry'
      const prompt = tone === 'custom'
        ? `${customPrompt}\n\nContext: ${senderInfo}`
        : `Write a ${tone} reply email to ${senderInfo}. The reply should be for an automotive dealership CRM context. Keep it concise and action-oriented.`
      const text = await aiGenerate(prompt, 'appointments')
      setResult(text)
    } catch { setResult('Failed to generate reply. Please try again.') }
    finally { setLoading(false) }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
        {tones.map(t => (
          <button key={t.id} onClick={() => setTone(t.id as any)}
            style={{
              height: 24, padding: '0 8px', borderRadius: 99,
              border: `1px solid ${tone === t.id ? 'rgba(59,130,246,.4)' : 'var(--p-bd2)'}`,
              background: tone === t.id ? 'rgba(59,130,246,.12)' : 'transparent',
              color: tone === t.id ? 'var(--p-acc2)' : 'var(--p-tx3)',
              fontSize: 10, cursor: 'pointer', transition: 'all .14s',
            }}>
            {t.label}
          </button>
        ))}
      </div>
      {tone === 'custom' && (
        <textarea
          className="axp-ta"
          style={{ border: '1px solid var(--p-bd2)', borderRadius: 8, padding: '7px 9px', marginBottom: 7, width: '100%', minHeight: 50, background: 'var(--p-bg2)' }}
          value={customPrompt}
          onChange={e => setCustomPrompt(e.target.value)}
          placeholder="Describe what you want to say…"
        />
      )}
      <button className="axp-gen-btn" onClick={handleGenerate} disabled={loading || (tone === 'custom' && !customPrompt.trim())}>
        {loading ? <Loader2 size={10} style={{ animation: 'axp-spin .9s linear infinite' }} /> : <Sparkles size={10} />}
        {loading ? 'Generating…' : 'Generate Reply'}
      </button>
      {result && (
        <div style={{ marginTop: 8 }}>
          <div className="axp-action-result">{result}</div>
          <button className="axp-copy-btn" onClick={handleCopy}>
            {copied ? <CheckCircle2 size={9} style={{ color: 'var(--p-green)' }} /> : <FileText size={9} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Lead Summary Card ────────────────────────────────────────────────────────
function LeadSummaryCard({ message }: { message: SupraLeoMessage | null }) {
  const [result, setResult] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const handleSummarize = async () => {
    if (!message) return
    setLoading(true); setResult('')
    try {
      const prompt = `Summarize this lead message and provide key action points:
Sender: ${message.sender} (${message.senderEmail})
Subject: ${message.subject}
Status: ${message.status}
Snippet: ${message.snippet}

Provide: 1) Key points from the message 2) Customer intent 3) Recommended next action 4) Priority level`
      const text = await aiGenerate(prompt, 'appointments')
      setResult(text)
    } catch { setResult('Failed to summarize. Please try again.') }
    finally { setLoading(false) }
  }

  if (!message) return (
    <div style={{ padding: '10px 0', textAlign: 'center', color: 'var(--p-tx3)', fontSize: 11 }}>
      Open a lead message to summarize it.
    </div>
  )

  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 9 }}>
        {[
          { icon: <User size={9} />, key: 'Sender', val: message.sender },
          { icon: <Mail size={9} />, key: 'Email', val: message.senderEmail },
          { icon: <Tag size={9} />, key: 'Subject', val: message.subject },
          { icon: <Star size={9} />, key: 'Status', val: message.status },
        ].filter(r => r.val).map(r => (
          <div key={r.key} className="axp-lead-row">
            <span style={{ color: 'var(--p-tx3)', display: 'flex', alignItems: 'center', gap: 3, minWidth: 64 }}>{r.icon}<span className="axp-lead-key">{r.key}</span></span>
            <span className="axp-lead-val" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.val}</span>
          </div>
        ))}
      </div>
      <button className="axp-gen-btn" onClick={handleSummarize} disabled={loading}>
        {loading ? <Loader2 size={10} style={{ animation: 'axp-spin .9s linear infinite' }} /> : <BookOpen size={10} />}
        {loading ? 'Analyzing…' : 'Summarize Lead'}
      </button>
      {result && (
        <div style={{ marginTop: 8 }}>
          <div className="axp-action-result">{result}</div>
        </div>
      )}
    </div>
  )
}

// ─── Follow-Up Strategy Card ──────────────────────────────────────────────────
function FollowUpCard({ message }: { message: SupraLeoMessage | null }) {
  const [result, setResult] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const handleGenerate = async () => {
    setLoading(true); setResult('')
    try {
      const context = message
        ? `Lead: ${message.sender}, Status: ${message.status}, Subject: ${message.subject}`
        : 'a general automotive lead'
      const text = await aiGenerate(
        `Create a 3-step follow-up strategy for ${context}. Include: timing, channel (call/email/text), and key talking points for each step. Be specific and actionable.`,
        'appointments'
      )
      setResult(text)
    } catch { setResult('Failed to generate strategy.') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ paddingTop: 8 }}>
      <button className="axp-gen-btn" onClick={handleGenerate} disabled={loading}>
        {loading ? <Loader2 size={10} style={{ animation: 'axp-spin .9s linear infinite' }} /> : <TrendingUp size={10} />}
        {loading ? 'Planning…' : 'Generate Strategy'}
      </button>
      {result && <div className="axp-action-result" style={{ marginTop: 8 }}>{result}</div>}
    </div>
  )
}

// ─── Assistant Tab ────────────────────────────────────────────────────────────
function AssistantTab({
  state, message, errorMsg, voiceName, transcript,
  onStop, onPause, onResume, onReplay,
  onStartListeningForCommand, onStartReplyListening,
  onSetTranscript, onSendReply,
}: Omit<PanelProps, 'email' | 'onClose'>) {
  const [reply, setReply] = React.useState('')
  const [editing, setEditing] = React.useState(false)
  const [editText, setEditText] = React.useState('')
  const editRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus()
      editRef.current.selectionStart = editRef.current.value.length
    }
  }, [editing])

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

  const hasMessage = !!message

  return (
    <>
      <div className="axp-assist-scroll">
        {isError && errorMsg && (
          <div className="axp-err">
            <AlertCircle size={13} style={{ color: 'var(--p-red)', flexShrink: 0, marginTop: 1 }} />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Voice state UI */}
        {isWaiting && (
          <div className="axp-wait">
            <div className="axp-wait-title"><CheckCircle2 size={11} /> Done reading — what next?</div>
            <div className="axp-wait-grid">
              <button className="axp-wait-btn axp-wait-v" onClick={onStartListeningForCommand}><Mic size={10} /> Reply by Voice</button>
              <button className="axp-wait-btn axp-wait-d" onClick={onStartReplyListening}><MessageSquare size={10} /> Dictate Reply</button>
            </div>
            <button className="axp-wait-x" onClick={onStop}><X size={9} /> Close</button>
          </div>
        )}

        {isListening && (
          <div className="axp-listen">
            <div className="axp-listen-lbl">
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--p-green)', boxShadow: '0 0 7px rgba(16,185,129,.7)', animation: 'axp-dot .7s ease-in-out infinite' }} />
              Listening for command
            </div>
            <Waveform active />
            <div className="axp-listen-hint">Say "Reply", "Stop", or "Read again"</div>
          </div>
        )}

        {isReplyMic && (
          <div className="axp-listen">
            <div className="axp-listen-lbl">
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--p-green)', boxShadow: '0 0 7px rgba(16,185,129,.7)', animation: 'axp-dot .7s ease-in-out infinite' }} />
              Dictating your reply
            </div>
            <Waveform active />
            {transcript && <div className="axp-transcript">{transcript}</div>}
            <div className="axp-listen-hint" style={{ fontSize: 10.5 }}>Speak clearly · stops after silence</div>
          </div>
        )}

        {isSending && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: '1px solid rgba(59,130,246,.22)', background: 'rgba(59,130,246,.06)', borderRadius: 10 }}>
            <Loader2 size={13} style={{ color: 'var(--p-acc)', animation: 'axp-spin .9s linear infinite' }} />
            <span style={{ fontSize: 12, color: 'var(--p-acc2)' }}>Sending reply…</span>
          </div>
        )}

        {isDone && transcript && !editing && (
          <div>
            <div className="axp-lbl">Your Reply</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <div className="axp-transcript" style={{ flex: 1 }}>{transcript}</div>
              <button className="axp-btn" style={{ padding: '0 7px', height: 26, flexShrink: 0 }} onClick={() => { setEditText(transcript); setEditing(true) }}>
                <Edit3 size={9} />
              </button>
            </div>
          </div>
        )}

        {isDone && editing && (
          <div>
            <div className="axp-lbl">Edit Reply</div>
            <div className="axp-input-row">
              <textarea ref={editRef} className="axp-ta" value={editText} onChange={e => setEditText(e.target.value)} rows={4} style={{ height: 78 }} />
            </div>
            <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end', marginTop: 5 }}>
              <button className="axp-btn" onClick={() => setEditing(false)}>Cancel</button>
              <button className="axp-btn pri" onClick={() => { onSetTranscript(editText); setEditing(false) }}>Save</button>
            </div>
          </div>
        )}

        {/* ── AI Action Cards ── */}
        {!isListening && !isReplyMic && !isWaiting && !isSending && (
          <>
            <div className="axp-section-hdr" style={{ marginTop: 4 }}>AI Assistance</div>

            {/* Book Appointment */}
            <ActionCard
              icon={<CalendarPlus size={13} style={{ color: '#10B981' }} />}
              iconBg="rgba(16,185,129,.12)"
              title="Book Appointment"
              subtitle="Schedule a new appointment with a lead"
              defaultOpen={false}
            >
              <BookAppointmentCard message={message} />
            </ActionCard>

            {/* Custom Reply Generator */}
            <ActionCard
              icon={<Mail size={13} style={{ color: '#60A5FA' }} />}
              iconBg="rgba(59,130,246,.12)"
              title="Craft Reply"
              subtitle="AI-powered reply tailored to this lead"
              defaultOpen={hasMessage}
            >
              <ReplyComposerCard message={message} />
            </ActionCard>

            {/* Lead Summary */}
            <ActionCard
              icon={<BookOpen size={13} style={{ color: '#8B5CF6' }} />}
              iconBg="rgba(139,92,246,.12)"
              title="Summarize Lead"
              subtitle="Extract key points & recommended actions"
              defaultOpen={hasMessage}
            >
              <LeadSummaryCard message={message} />
            </ActionCard>

            {/* Follow-up Strategy */}
            <ActionCard
              icon={<TrendingUp size={13} style={{ color: '#F59E0B' }} />}
              iconBg="rgba(245,158,11,.12)"
              title="Follow-Up Strategy"
              subtitle="Generate a multi-step engagement plan"
            >
              <FollowUpCard message={message} />
            </ActionCard>
          </>
        )}
      </div>

      {/* Reply input */}
      {(state !== 'idle' || hasMessage) && !isWaiting && (
        <div className="axp-reply">
          <div className="axp-lbl">Quick Reply</div>
          <div className="axp-input-row">
            <textarea
              className="axp-ta"
              value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSendReply(); setReply('') } }}
              placeholder="Compose your reply…"
              rows={1}
            />
            <button className="axp-send" onClick={() => { onSendReply(); setReply('') }} disabled={!reply.trim()}>
              <Send size={10} />
            </button>
          </div>
        </div>
      )}

      {/* Actions footer */}
      <div className="axp-actions">
        {isDone && transcript ? (
          <>
            <button className="axp-btn pri" onClick={onSendReply} disabled={!transcript.trim()}><Send size={9} /> Send</button>
            <button className="axp-btn" onClick={onStartReplyListening}><RotateCcw size={9} /> Re-dictate</button>
            <button className="axp-btn" onClick={() => { setEditText(transcript); setEditing(true) }}><Edit3 size={9} /> Edit</button>
            <button className="axp-btn dng" onClick={onStop}><X size={9} /> Discard</button>
          </>
        ) : !isWaiting && (
          <>
            {(isSpeaking || isPaused) && (
              <button className="axp-btn" onClick={isPaused ? onResume : onPause}>
                {isPaused ? <Play size={9} /> : <Pause size={9} />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>
            )}
            {(isIdle || hasMessage) && !isFetching && (
              <button className="axp-btn" onClick={onReplay}><Play size={9} /> {message ? 'Read Aloud' : 'Read'}</button>
            )}
            {isFetching && (
              <button className="axp-btn" disabled>
                <Loader2 size={9} style={{ animation: 'axp-spin .9s linear infinite' }} /> Fetching…
              </button>
            )}
            {!isListening && hasMessage && (
              <button className="axp-btn" onClick={onStartReplyListening}><Mic size={9} /> Voice Reply</button>
            )}
            {isActive && (
              <button className="axp-btn dng" onClick={onStop}><Square size={9} /> Stop</button>
            )}
          </>
        )}
      </div>
    </>
  )
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export function SupraLeoPanel({
  state, email, message, errorMsg, voiceName, transcript,
  onStop, onPause, onResume, onClose, onReplay,
  onStartListeningForCommand, onStartReplyListening,
  onSetTranscript, onSendReply,
}: PanelProps) {
  const [tab, setTab] = React.useState<'chat' | 'assistant' | 'reminder'>('chat')
  const [activeModule, setActiveModule] = React.useState('general')
  const router = useRouter()

  React.useEffect(() => { injectPanelCSS() }, [])

  React.useEffect(() => {
    if (message) { setActiveModule('appointments'); setTab('assistant') }
  }, [message])

  const st = STATUS_MAP[state]
  const waveActive = state === 'speaking' || state === 'listening' || state === 'listening-reply'

  return (
    <div data-axp>
      <div className="axp-panel">
        {/* Header */}
        <div className="axp-hdr">
          <SupraLeoAvatar state={LEO_STATE[state]} size={40} animate />
          <div className="axp-hdr-text">
            <div className="axp-name">Autrix AI</div>
            <span className="axp-slogan">Driven by Intelligence</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="axp-status">
                <div className="axp-dot" style={{
                  background: st.dotColor,
                  boxShadow: st.pulse ? `0 0 5px ${st.dotColor}` : 'none',
                  animation: st.pulse ? 'axp-dot 1.4s ease-in-out infinite' : 'none',
                }} />
                <span>{st.label}</span>
                {voiceName && (
                  <>
                    <span style={{ opacity: 0.3 }}>·</span>
                    <Volume2 size={7} style={{ opacity: 0.4 }} />
                    <span style={{ maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{voiceName}</span>
                  </>
                )}
              </div>
              <Waveform active={waveActive} />
            </div>
          </div>
          <button className="axp-icon-btn" onClick={() => router.push('/crm/supra-leo')} title="Expand">
            <Maximize2 size={11} />
          </button>
          <button className="axp-icon-btn close" onClick={onClose}>
            <X size={11} />
          </button>
        </div>

        {/* Tabs */}
        <div className="axp-tabs">
          <button className={`axp-tab ${tab === 'chat' ? 'on' : ''}`} onClick={() => setTab('chat')}>Chat</button>
          <button className={`axp-tab ${tab === 'assistant' ? 'on' : ''}`} onClick={() => setTab('assistant')}>Assistant</button>
          <button className={`axp-tab ${tab === 'reminder' ? 'on' : ''}`} onClick={() => setTab('reminder')}>Reminder</button>
        </div>

        {/* Tab Content */}
        {tab === 'chat' && <ChatTab activeModule={activeModule} />}
        {tab === 'reminder' && <ReminderTab />}
        {tab === 'assistant' && (
          <AssistantTab
            state={state}
            message={message}
            errorMsg={errorMsg}
            voiceName={voiceName}
            transcript={transcript}
            onStop={onStop}
            onPause={onPause}
            onResume={onResume}
            onReplay={onReplay}
            onStartListeningForCommand={onStartListeningForCommand}
            onStartReplyListening={onStartReplyListening}
            onSetTranscript={onSetTranscript}
            onSendReply={onSendReply}
          />
        )}
      </div>
    </div>
  )
}

export default SupraLeoPanel