'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, Users, MessageSquare, Send, Paperclip,
  X, ChevronLeft, MoreVertical, Download, FileText,
  Loader2, Check, CheckCheck, Hash, Reply, Trash2,
  ArrowLeft, Zap, Radio, Sparkles, Bot, Video, PhoneOff,
  Mic, MicOff, VideoOff, Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiClient } from '@/lib/api-client';
import { useSupraSpaceSocket, SSConversation, SSMessage } from '@/hooks/useSupraSpaceSocket';
import { cn } from '@/lib/utils';

// ─── Font + Style Injection ──────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('ss3-styles')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Syne:wght@600;700;800&display=swap';
  document.head.appendChild(link);

  const s = document.createElement('style');
  s.id = 'ss3-styles';
  s.textContent = `
    :root {
      --bg:          #070d07;
      --bg2:         #0b120b;
      --surface:     #111b11;
      --surface2:    #162016;
      --surface3:    #1c2a1c;
      --border:      rgba(52,211,153,0.1);
      --border2:     rgba(52,211,153,0.06);
      --green:       #10b981;
      --green2:      #34d399;
      --green3:      #6ee7b7;
      --green-dim:   rgba(16,185,129,0.12);
      --green-glow:  rgba(16,185,129,0.2);
      --green-deep:  #064e3b;
      --slate:       #64748b;
      --slate2:      #94a3b8;
      --blue:        #38bdf8;
      --blue-dim:    rgba(56,189,248,0.1);
      --gold:        #f59e0b;
      --gold-dim:    rgba(245,158,11,0.1);
      --text-1:      rgba(236,253,245,0.95);
      --text-2:      rgba(236,253,245,0.5);
      --text-3:      rgba(236,253,245,0.22);
      --text-4:      rgba(236,253,245,0.1);
      --radius-sm:   8px;
      --radius-md:   12px;
      --radius-lg:   16px;
      --radius-xl:   20px;
    }

    .ss3 {
      font-family: 'DM Sans', sans-serif;
      background: var(--bg);
      color: var(--text-1);
      -webkit-font-smoothing: antialiased;
    }
    .ss3-hed { font-family: 'Syne', sans-serif; }

    /* Topbar */
    .ss3-topbar {
      background: rgba(7,13,7,0.9);
      border-bottom: 1px solid var(--border2);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
    }

    /* Sidebar */
    .ss3-sidebar {
      background: var(--bg2);
      border-right: 1px solid var(--border2);
    }

    /* Logo */
    .ss3-logo {
      background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%);
      box-shadow: 0 0 24px rgba(16,185,129,0.35), 0 0 48px rgba(16,185,129,0.1);
    }

    /* Conversation item */
    .ss3-conv {
      border-radius: var(--radius-md);
      border: 1px solid transparent;
      transition: all 0.18s cubic-bezier(0.4,0,0.2,1);
      position: relative;
    }
    .ss3-conv:hover {
      background: rgba(16,185,129,0.04);
      border-color: var(--border2);
    }
    .ss3-conv-active {
      background: var(--green-dim) !important;
      border-color: rgba(16,185,129,0.18) !important;
    }
    .ss3-conv-active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 20%;
      height: 60%;
      width: 3px;
      background: linear-gradient(180deg, #10b981, #34d399);
      border-radius: 0 3px 3px 0;
    }

    /* Search */
    .ss3-search {
      background: var(--surface);
      border: 1px solid var(--border2);
      color: var(--text-1);
      transition: all 0.18s ease;
    }
    .ss3-search:focus {
      background: var(--surface2);
      border-color: rgba(16,185,129,0.3);
      outline: none;
      box-shadow: 0 0 0 3px rgba(16,185,129,0.06);
    }
    .ss3-search::placeholder { color: var(--text-3); }

    /* Chat header */
    .ss3-chat-header {
      background: rgba(11,18,11,0.75);
      border-bottom: 1px solid var(--border2);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }

    /* Bubbles */
    .ss3-bubble-own {
      background: linear-gradient(145deg, #059669, #10b981);
      box-shadow: 0 4px 20px rgba(16,185,129,0.22), 0 1px 4px rgba(0,0,0,0.3);
      color: #ecfdf5;
    }
    .ss3-bubble-other {
      background: var(--surface2);
      border: 1px solid var(--border);
      color: var(--text-1);
    }

    /* Input area */
    .ss3-input-wrap {
      background: var(--surface);
      border: 1px solid var(--border);
      transition: border-color 0.18s ease, box-shadow 0.18s ease;
    }
    .ss3-input-wrap:focus-within {
      border-color: rgba(16,185,129,0.35);
      box-shadow: 0 0 0 3px rgba(16,185,129,0.06);
    }

    /* Send button */
    .ss3-send {
      background: linear-gradient(135deg, #059669, #10b981);
      box-shadow: 0 2px 12px rgba(16,185,129,0.3);
      transition: all 0.18s ease;
    }
    .ss3-send:hover:not(:disabled) {
      box-shadow: 0 4px 20px rgba(16,185,129,0.45);
      transform: translateY(-1px);
    }
    .ss3-send:disabled {
      background: var(--surface2);
      box-shadow: none;
      cursor: not-allowed;
    }

    /* Supra Leo AI Button */
    .ss3-ai-btn {
      background: linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.06));
      border: 1px solid rgba(245,158,11,0.2);
      color: var(--gold);
      transition: all 0.18s ease;
      position: relative;
      overflow: hidden;
    }
    .ss3-ai-btn::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(245,158,11,0.15), transparent);
      opacity: 0;
      transition: opacity 0.18s ease;
    }
    .ss3-ai-btn:hover::before { opacity: 1; }
    .ss3-ai-btn:hover {
      border-color: rgba(245,158,11,0.4);
      box-shadow: 0 0 16px rgba(245,158,11,0.15);
    }
    .ss3-ai-btn-pulse {
      animation: ss3-gold-pulse 2.5s ease-in-out infinite;
    }
    @keyframes ss3-gold-pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }

    /* Sidebar per-conv video icon */
    .ss3-conv-video {
      opacity: 0;
      background: rgba(56,189,248,0.08);
      border: 1px solid rgba(56,189,248,0.15);
      color: var(--blue);
      border-radius: 8px;
      transition: all 0.15s ease;
      flex-shrink: 0;
    }
    .ss3-conv:hover .ss3-conv-video,
    .ss3-conv-active .ss3-conv-video {
      opacity: 1;
    }
    .ss3-conv-video:hover {
      background: rgba(56,189,248,0.18);
      border-color: rgba(56,189,248,0.35);
      box-shadow: 0 0 10px rgba(56,189,248,0.15);
    }

    /* Video call button */
    .ss3-video-btn {
      background: linear-gradient(135deg, rgba(56,189,248,0.12), rgba(56,189,248,0.06));
      border: 1px solid rgba(56,189,248,0.2);
      color: var(--blue);
      transition: all 0.18s ease;
      position: relative;
      overflow: hidden;
    }
    .ss3-video-btn:hover {
      background: linear-gradient(135deg, rgba(56,189,248,0.2), rgba(56,189,248,0.08));
      border-color: rgba(56,189,248,0.45);
      box-shadow: 0 0 16px rgba(56,189,248,0.18);
    }

    /* Video call modal */
    .ss3-vcall-modal {
      background: #080f08;
      border: 1px solid rgba(56,189,248,0.12);
      box-shadow: 0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(56,189,248,0.06);
    }
    .ss3-vcall-screen {
      background: linear-gradient(160deg, #0a1520 0%, #070d07 60%, #0a1a12 100%);
      border: 1px solid rgba(56,189,248,0.08);
      position: relative;
      overflow: hidden;
    }
    .ss3-vcall-screen::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at 50% 40%, rgba(56,189,248,0.04) 0%, transparent 70%);
      pointer-events: none;
    }
    .ss3-vcall-ctrl {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
      transition: all 0.18s ease;
    }
    .ss3-vcall-ctrl:hover {
      background: rgba(255,255,255,0.1);
      border-color: rgba(255,255,255,0.14);
    }
    .ss3-vcall-end {
      background: linear-gradient(135deg, #dc2626, #ef4444);
      box-shadow: 0 2px 16px rgba(220,38,38,0.35);
      transition: all 0.18s ease;
    }
    .ss3-vcall-end:hover {
      box-shadow: 0 4px 24px rgba(220,38,38,0.5);
      transform: scale(1.05);
    }
    @keyframes ss3-vcall-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(56,189,248,0.3); }
      50% { box-shadow: 0 0 0 8px rgba(56,189,248,0); }
    }
    .ss3-vcall-avatar-ring {
      animation: ss3-vcall-pulse 2.5s ease-in-out infinite;
    }
    @keyframes ss3-vcall-dots {
      0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
      40% { opacity: 1; transform: translateY(-3px); }
    }
    .ss3-vcall-dot { animation: ss3-vcall-dots 1.4s ease-in-out infinite; }

    /* FAB / action buttons */
    .ss3-fab {
      background: linear-gradient(135deg, #059669, #10b981);
      box-shadow: 0 2px 12px rgba(16,185,129,0.25);
      transition: all 0.18s ease;
    }
    .ss3-fab:hover {
      box-shadow: 0 4px 20px rgba(16,185,129,0.4);
      transform: translateY(-1px);
    }

    /* Icon button */
    .ss3-icon-btn {
      border-radius: var(--radius-sm);
      transition: all 0.15s ease;
      color: var(--text-3);
    }
    .ss3-icon-btn:hover {
      background: rgba(16,185,129,0.07);
      color: var(--green2);
    }

    /* Online dot */
    .ss3-online {
      background: var(--green2);
      box-shadow: 0 0 6px rgba(52,211,153,0.8);
    }

    /* Live badge */
    .ss3-live {
      background: var(--blue-dim);
      border: 1px solid rgba(56,189,248,0.15);
    }

    /* Reply bar */
    .ss3-reply-bar {
      background: rgba(16,185,129,0.06);
      border: 1px solid rgba(16,185,129,0.14);
      border-left: 3px solid var(--green);
    }
    .ss3-reply-preview {
      background: rgba(16,185,129,0.06);
      border-left: 2px solid rgba(16,185,129,0.25);
    }

    /* Actions popup */
    .ss3-actions {
      background: rgba(18,28,18,0.97);
      border: 1px solid var(--border);
      backdrop-filter: blur(20px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3);
    }

    /* Overlay + modal */
    .ss3-overlay { background: rgba(3,8,3,0.8); backdrop-filter: blur(16px); }
    .ss3-modal {
      background: #0d180d;
      border: 1px solid rgba(16,185,129,0.12);
      box-shadow: 0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(16,185,129,0.06);
    }

    /* Tab */
    .ss3-tab-active {
      background: linear-gradient(135deg, #059669, #10b981);
      box-shadow: 0 2px 10px rgba(16,185,129,0.25);
    }

    /* Avatars */
    .ss3-ava-group {
      background: linear-gradient(135deg, #0e4429, #059669);
      border: 1px solid rgba(16,185,129,0.3);
    }
    .ss3-ava-dm {
      background: linear-gradient(135deg, #1e3a5f, #38bdf8);
      border: 1px solid rgba(56,189,248,0.2);
    }

    /* Scrollbar */
    .ss3-scroll::-webkit-scrollbar { width: 3px; }
    .ss3-scroll::-webkit-scrollbar-track { background: transparent; }
    .ss3-scroll::-webkit-scrollbar-thumb { background: rgba(16,185,129,0.12); border-radius: 2px; }

    /* Separator */
    .ss3-sep { background: rgba(52,211,153,0.07); }

    /* Typing indicator */
    .ss3-typing {
      background: var(--surface2);
      border: 1px solid var(--border2);
    }
    @keyframes ss3-blink {
      0%, 80%, 100% { opacity: 0.2; transform: scale(0.85); }
      40% { opacity: 1; transform: scale(1.15); }
    }
    .ss3-dot { animation: ss3-blink 1.4s ease-in-out infinite; }

    /* Empty state */
    .ss3-empty-icon {
      background: var(--green-dim);
      border: 1px dashed rgba(16,185,129,0.2);
    }

    /* File attachment */
    .ss3-file-own {
      background: rgba(0,0,0,0.18);
      border: 1px solid rgba(236,253,245,0.12);
    }
    .ss3-file-other {
      background: var(--surface);
      border: 1px solid var(--border);
    }

    /* Section label */
    .ss3-section-label {
      font-size: 9px;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: var(--text-3);
      font-family: 'Syne', sans-serif;
      font-weight: 700;
    }

    /* Noise texture overlay */
    .ss3-noise::after {
      content: '';
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
      pointer-events: none;
      opacity: 0.5;
      border-radius: inherit;
    }

    /* Divider line */
    .ss3-divider { 
      height: 1px; 
      background: linear-gradient(90deg, transparent, rgba(16,185,129,0.1), transparent);
    }

    @keyframes ss3-shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    .ss3-ai-shimmer {
      background: linear-gradient(90deg, rgba(245,158,11,0.6) 0%, rgba(245,158,11,1) 50%, rgba(245,158,11,0.6) 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: ss3-shimmer 3s linear infinite;
    }
  `;
  document.head.appendChild(s);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ini = (n: string) => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
const fmtTime = (d: string) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
function fmtDate(d: string) {
  const date = new Date(d), now = new Date();
  const days = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return date.toLocaleDateString([], { weekday: 'long' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
const fmtSize = (b: number) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;
const getConvName = (c: SSConversation, uid: string) =>
  c.type === 'group' ? (c.name || 'Group') : (c.members.find(m => m._id !== uid)?.fullName || 'Unknown');
const getConvAvatar = (c: SSConversation, uid: string) =>
  c.type === 'group' ? c.avatar : c.members.find(m => m._id !== uid)?.avatar;

// ─── Date Separator ───────────────────────────────────────────────────────────

function DateSep({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 my-5 px-6">
      <div className="flex-1 ss3-divider" />
      <span
        className="ss3-hed px-3 py-1 rounded-full"
        style={{
          fontSize: 9,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: 'rgba(52,211,153,0.4)',
          background: 'rgba(16,185,129,0.05)',
          border: '1px solid rgba(16,185,129,0.1)',
        }}
      >
        {fmtDate(date)}
      </span>
      <div className="flex-1 ss3-divider" />
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function Bubble({ message, isOwn, showAvatar, onReply, onDelete }: {
  message: SSMessage; isOwn: boolean; showAvatar: boolean;
  onReply: (m: SSMessage) => void; onDelete: (id: string) => void;
}) {
  const [hov, setHov] = React.useState(false);

  if (message.isDeleted) {
    return (
      <div className={cn('flex gap-3 px-6', isOwn && 'flex-row-reverse')}>
        <div className="w-8 shrink-0" />
        <p className="text-xs italic py-1" style={{ color: 'rgba(52,211,153,0.2)' }}>
          Message deleted
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn('flex gap-3 px-6 relative group', isOwn && 'flex-row-reverse')}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {showAvatar ? (
        <div className={cn(
          'h-8 w-8 rounded-xl shrink-0 mt-0.5 flex items-center justify-center overflow-hidden',
          isOwn ? 'ss3-ava-dm' : 'ss3-ava-group'
        )}>
          {message.sender.avatar
            ? <img src={message.sender.avatar} alt="" className="w-full h-full object-cover" />
            : <span className="ss3-hed text-white font-700" style={{ fontSize: 10 }}>{ini(message.sender.fullName)}</span>}
        </div>
      ) : (
        <div className="w-8 shrink-0" />
      )}

      <div className={cn('flex flex-col gap-1.5 max-w-[70%]', isOwn && 'items-end')}>
        {showAvatar && !isOwn && (
          <span
            className="ss3-hed font-600 px-1"
            style={{ fontSize: 10, letterSpacing: '0.05em', color: 'rgba(52,211,153,0.5)' }}
          >
            {message.sender.fullName}
          </span>
        )}

        {message.replyTo && (
          <div
            className={cn('ss3-reply-preview rounded-xl px-3 py-2 mb-1 max-w-full')}
            style={isOwn ? {
              borderRight: '2px solid rgba(16,185,129,0.3)',
              borderLeft: 'none',
              background: 'rgba(16,185,129,0.05)',
            } : {}}
          >
            <p
              className="ss3-hed font-700 truncate"
              style={{ fontSize: 9, letterSpacing: '0.15em', color: 'rgba(52,211,153,0.7)' }}
            >
              {(message.replyTo as any).sender?.fullName?.toUpperCase()}
            </p>
            <p className="truncate mt-0.5" style={{ fontSize: 11, color: 'var(--text-3)' }}>
              {(message.replyTo as any).content || '📎 Attachment'}
            </p>
          </div>
        )}

        <div className={cn(
          'rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words',
          isOwn ? 'ss3-bubble-own rounded-tr-sm' : 'ss3-bubble-other rounded-tl-sm'
        )}>
          {message.attachments.filter(a => a.mimeType.startsWith('image/')).map((att, i) => (
            <a key={i} href={att.url} target="_blank" rel="noreferrer" className="block mb-2 last:mb-0">
              <img
                src={att.url}
                alt={att.originalName}
                className="rounded-xl object-cover"
                style={{ maxHeight: 240, maxWidth: '100%' }}
              />
            </a>
          ))}
          {message.attachments.filter(a => !a.mimeType.startsWith('image/')).map((att, i) => (
            <a
              key={i}
              href={att.url}
              target="_blank"
              rel="noreferrer"
              className={cn(
                'flex items-center gap-3 rounded-xl p-3 mb-2 last:mb-0 transition-opacity hover:opacity-80',
                isOwn ? 'ss3-file-own' : 'ss3-file-other'
              )}
            >
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: isOwn ? 'rgba(236,253,245,0.1)' : 'rgba(16,185,129,0.1)' }}
              >
                <FileText
                  className="h-4 w-4"
                  style={{ color: isOwn ? 'rgba(236,253,245,0.7)' : 'var(--green2)' }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate">{att.originalName}</p>
                <p className="mt-0.5 opacity-50" style={{ fontSize: 10 }}>{fmtSize(att.size)}</p>
              </div>
              <Download className="h-3.5 w-3.5 shrink-0 opacity-40" />
            </a>
          ))}
          {message.content && <p>{message.content}</p>}
        </div>

        <div className={cn('flex items-center gap-1.5 px-1', isOwn && 'flex-row-reverse')}>
          <span className="tabular-nums" style={{ fontSize: 9, color: 'var(--text-3)' }}>
            {fmtTime(message.createdAt)}
          </span>
          {isOwn && (
            message.readBy.length > 1
              ? <CheckCheck className="h-3 w-3" style={{ color: 'var(--green2)' }} />
              : <Check className="h-3 w-3" style={{ color: 'var(--text-3)' }} />
          )}
        </div>
      </div>

      {/* Hover actions */}
      {hov && (
        <div className={cn(
          'ss3-actions absolute top-0 flex items-center gap-0.5 rounded-xl px-1 py-1 z-10',
          isOwn ? 'right-16' : 'left-16'
        )}>
          <button
            onClick={() => onReply(message)}
            className="ss3-icon-btn p-1.5"
            title="Reply"
          >
            <Reply className="h-3.5 w-3.5" />
          </button>
          {isOwn && (
            <button
              onClick={() => onDelete(message._id)}
              className="p-1.5 rounded-lg transition-all hover:bg-red-500/10 hover:text-red-400"
              style={{ color: 'var(--text-3)' }}
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Video Call Modal ─────────────────────────────────────────────────────────

function VideoCallModal({
  conv,
  uid,
  onClose,
}: {
  conv: SSConversation;
  uid: string;
  onClose: () => void;
}) {
  const [micOn, setMicOn] = React.useState(true);
  const [camOn, setCamOn] = React.useState(true);
  const [callDuration, setCallDuration] = React.useState(0);
  const [callState, setCallState] = React.useState<'calling' | 'connected'>('calling');

  const name = getConvName(conv, uid);
  const avatar = getConvAvatar(conv, uid);

  // Simulate connection after 2s
  React.useEffect(() => {
    const t = setTimeout(() => setCallState('connected'), 2000);
    return () => clearTimeout(t);
  }, []);

  // Timer once connected
  React.useEffect(() => {
    if (callState !== 'connected') return;
    const t = setInterval(() => setCallDuration(d => d + 1), 1000);
    return () => clearInterval(t);
  }, [callState]);

  const fmtDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <div className="ss3-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="ss3-vcall-modal ss3 rounded-2xl w-full max-w-md overflow-hidden flex flex-col">

        {/* Header bar */}
        <div
          className="flex items-center justify-between px-5 py-3.5 shrink-0"
          style={{ borderBottom: '1px solid rgba(56,189,248,0.08)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="h-6 w-6 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.2)' }}
            >
              <Video className="h-3 w-3" style={{ color: 'var(--blue)' }} />
            </div>
            <span className="ss3-hed font-700" style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--blue)' }}>
              VIDEO CALL
            </span>
          </div>
          <div className="flex items-center gap-2">
            {callState === 'connected' && (
              <span
                className="ss3-hed font-700 tabular-nums"
                style={{ fontSize: 10, letterSpacing: '0.08em', color: 'rgba(56,189,248,0.6)' }}
              >
                {fmtDuration(callDuration)}
              </span>
            )}
            <button
              onClick={onClose}
              className="ss3-icon-btn h-7 w-7 flex items-center justify-center"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Main video area */}
        <div className="ss3-vcall-screen flex flex-col items-center justify-center" style={{ height: 280 }}>

          {/* Remote participant */}
          <div className="flex flex-col items-center gap-4">
            {/* Avatar with ring */}
            <div
              className={cn(
                'h-20 w-20 rounded-2xl flex items-center justify-center overflow-hidden',
                conv.type === 'group' ? 'ss3-ava-group' : 'ss3-ava-dm',
                callState === 'calling' && 'ss3-vcall-avatar-ring'
              )}
              style={{ border: '2px solid rgba(56,189,248,0.3)' }}
            >
              {avatar
                ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                : conv.type === 'group'
                  ? <Hash className="h-7 w-7 text-white" style={{ opacity: 0.7 }} />
                  : <span className="ss3-hed text-white" style={{ fontSize: 22, fontWeight: 700 }}>
                      {ini(name)}
                    </span>}
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <p className="ss3-hed font-700" style={{ fontSize: 16, color: 'var(--text-1)' }}>
                {name}
              </p>

              {callState === 'calling' ? (
                <div className="flex items-center gap-1.5">
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Calling</span>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        className="ss3-vcall-dot h-1 w-1 rounded-full"
                        style={{ background: 'rgba(56,189,248,0.5)', animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: 'var(--green2)', boxShadow: '0 0 6px rgba(52,211,153,0.8)' }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--green2)' }}>Connected</span>
                </div>
              )}
            </div>
          </div>

          {/* Self preview pip */}
          <div
            className="absolute bottom-4 right-4 h-16 w-24 rounded-xl overflow-hidden flex items-center justify-center"
            style={{
              background: 'rgba(7,13,7,0.9)',
              border: '1px solid rgba(56,189,248,0.15)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            }}
          >
            {camOn ? (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #0a1a12, #070d07)' }}
              >
                <span className="ss3-hed text-white" style={{ fontSize: 13, fontWeight: 700, opacity: 0.4 }}>
                  You
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <VideoOff className="h-4 w-4" style={{ color: 'rgba(56,189,248,0.4)' }} />
                <span style={{ fontSize: 8, color: 'var(--text-3)', letterSpacing: '0.1em' }}>CAM OFF</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div
          className="flex items-center justify-center gap-3 px-5 py-4 shrink-0"
          style={{ borderTop: '1px solid rgba(56,189,248,0.06)' }}
        >
          {/* Mic toggle */}
          <button
            onClick={() => setMicOn(v => !v)}
            className="ss3-vcall-ctrl h-11 w-11 rounded-2xl flex items-center justify-center"
            title={micOn ? 'Mute mic' : 'Unmute mic'}
            style={!micOn ? { background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.2)' } : {}}
          >
            {micOn
              ? <Mic className="h-4.5 w-4.5" style={{ color: 'var(--text-2)' }} />
              : <MicOff className="h-4.5 w-4.5" style={{ color: '#ef4444' }} />}
          </button>

          {/* End call */}
          <button
            onClick={onClose}
            className="ss3-vcall-end h-13 w-13 rounded-2xl flex items-center justify-center"
            style={{ height: 52, width: 52 }}
            title="End call"
          >
            <PhoneOff className="h-5 w-5" style={{ color: '#fff' }} />
          </button>

          {/* Camera toggle */}
          <button
            onClick={() => setCamOn(v => !v)}
            className="ss3-vcall-ctrl h-11 w-11 rounded-2xl flex items-center justify-center"
            title={camOn ? 'Turn off camera' : 'Turn on camera'}
            style={!camOn ? { background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.2)' } : {}}
          >
            {camOn
              ? <Video className="h-4.5 w-4.5" style={{ color: 'var(--text-2)' }} />
              : <VideoOff className="h-4.5 w-4.5" style={{ color: '#ef4444' }} />}
          </button>
        </div>

        {/* Footer note */}
        <div
          className="px-5 pb-4 text-center"
          style={{ borderTop: '1px solid rgba(56,189,248,0.04)' }}
        >
          <p style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.05em' }}>
            Connect your video SDK (e.g. Daily, Agora, Livekit) to enable live video
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── New Conversation Modal ───────────────────────────────────────────────────

interface CrmUser { _id: string; fullName: string; username: string; avatar?: string; role: string }

function NewConvModal({ users, onClose, onStartDM, onCreateGroup }: {
  users: CrmUser[]; onClose: () => void;
  onStartDM: (id: string) => void;
  onCreateGroup: (name: string, ids: string[]) => void;
}) {
  const [tab, setTab] = React.useState<'dm' | 'group'>('dm');
  const [q, setQ] = React.useState('');
  const [groupName, setGroupName] = React.useState('');
  const [sel, setSel] = React.useState<string[]>([]);

  const list = users.filter(u =>
    u.fullName.toLowerCase().includes(q.toLowerCase()) ||
    u.username.toLowerCase().includes(q.toLowerCase())
  );
  const toggle = (id: string) => setSel(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  return (
    <div className="ss3-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="ss3-modal ss3 rounded-2xl w-full max-w-sm overflow-hidden">
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(16,185,129,0.07)' }}
        >
          <h2 className="ss3-hed font-700" style={{ fontSize: 14, color: 'var(--text-1)' }}>
            New Conversation
          </h2>
          <button
            onClick={onClose}
            className="ss3-icon-btn h-7 w-7 flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 p-3" style={{ borderBottom: '1px solid rgba(16,185,129,0.06)' }}>
          {(['dm', 'group'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 h-8 rounded-xl transition-all ss3-hed font-700',
                t === tab ? 'ss3-tab-active' : 'hover:bg-[rgba(16,185,129,0.05)]'
              )}
              style={{
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: t === tab ? '#ecfdf5' : 'var(--text-2)',
              }}
            >
              {t === 'dm' ? 'Direct' : 'Group'}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3">
          {tab === 'group' && (
            <input
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="Group name..."
              className="w-full h-9 rounded-xl px-3 text-sm ss3-search"
            />
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--text-3)' }} />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Find someone..."
              className="w-full h-9 rounded-xl pl-9 pr-3 text-sm ss3-search"
            />
          </div>

          <div className="space-y-0.5 max-h-60 overflow-y-auto ss3-scroll">
            {list.map(u => {
              const active = sel.includes(u._id);
              return (
                <button
                  key={u._id}
                  onClick={() => tab === 'dm' ? onStartDM(u._id) : toggle(u._id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left',
                    active ? 'ss3-conv-active' : 'hover:bg-[rgba(16,185,129,0.04)]'
                  )}
                >
                  <div className="h-8 w-8 rounded-xl shrink-0 flex items-center justify-center overflow-hidden ss3-ava-dm">
                    {u.avatar
                      ? <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                      : <span className="ss3-hed text-white font-700" style={{ fontSize: 10 }}>{ini(u.fullName)}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-500 truncate" style={{ fontSize: 13, color: 'var(--text-1)' }}>{u.fullName}</p>
                    <p className="truncate mt-0.5" style={{ fontSize: 10, color: 'var(--text-3)' }}>
                      @{u.username} · {u.role}
                    </p>
                  </div>
                  {tab === 'group' && active && (
                    <div className="h-5 w-5 rounded-full flex items-center justify-center ss3-fab shrink-0">
                      <Check className="h-3 w-3" style={{ color: '#ecfdf5' }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {tab === 'group' && sel.length > 0 && (
            <button
              onClick={() => groupName.trim() && onCreateGroup(groupName, sel)}
              disabled={!groupName.trim()}
              className="w-full h-9 rounded-xl ss3-tab-active ss3-hed font-700 flex items-center justify-center gap-2"
              style={{
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#ecfdf5',
                opacity: !groupName.trim() ? 0.4 : 1,
              }}
            >
              <Users className="h-3.5 w-3.5" />
              Create · {sel.length} {sel.length === 1 ? 'member' : 'members'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SupraSpacePage() {
  const router = useRouter();
  const [token, setToken] = React.useState('');
  const [uid, setUid] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  const [convos, setConvos] = React.useState<SSConversation[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [sideOpen, setSideOpen] = React.useState(true);

  const [msgs, setMsgs] = React.useState<Record<string, SSMessage[]>>({});
  const [loadingMsgs, setLoadingMsgs] = React.useState(false);
  const [hasMore, setHasMore] = React.useState<Record<string, boolean>>({});

  const [input, setInput] = React.useState('');
  const [replyTo, setReplyTo] = React.useState<SSMessage | null>(null);
  const [sending, setSending] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  const [showModal, setShowModal] = React.useState(false);
  const [allUsers, setAllUsers] = React.useState<CrmUser[]>([]);
  const [q, setQ] = React.useState('');

  // ── Video call state — holds the conv being called (null = no call) ──
  const [videoCallConv, setVideoCallConv] = React.useState<SSConversation | null>(null);

  const endRef = React.useRef<HTMLDivElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const typingRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeConv = convos.find(c => c._id === activeId);
  const activeMsgs = activeId ? (msgs[activeId] || []) : [];

  const {
    socket, isConnected, presence, typing,
    joinConversation, leaveConversation,
    sendTypingStart, sendTypingStop, markRead,
  } = useSupraSpaceSocket(token || null);

  React.useEffect(() => {
    const t = localStorage.getItem('crm_token');
    if (!t) { router.replace('/crm'); return; }
    setToken(t);
    const init = async () => {
      try {
        const [me, cv, us] = await Promise.all([
          apiClient.get('/api/crm/me', { headers: { Authorization: `Bearer ${t}` } }),
          apiClient.get('/api/supraspace/conversations', { headers: { Authorization: `Bearer ${t}` } }),
          apiClient.get('/api/supraspace/users', { headers: { Authorization: `Bearer ${t}` } }),
        ]);
        setUid((me.data?.data || me.data)._id);
        setConvos(cv.data?.data || []);
        setAllUsers(us.data?.data || []);
      } catch { router.replace('/crm'); }
      finally { setLoading(false); }
    };
    init();
  }, [router]);

  React.useEffect(() => {
    if (!socket) return;
    const onMsg = ({ conversationId, message }: { conversationId: string; message: SSMessage }) => {
      setMsgs(p => {
        const ex = p[conversationId] || [];
        if (ex.find(m => m._id === message._id)) return p;
        return { ...p, [conversationId]: [...ex, message] };
      });
      setConvos(p =>
        p.map(c => c._id === conversationId
          ? { ...c, lastMessage: message, lastMessageAt: message.createdAt }
          : c
        ).sort((a, b) =>
          new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
        )
      );
    };
    const onDel = ({ conversationId, messageId }: { conversationId: string; messageId: string }) => {
      setMsgs(p => ({
        ...p,
        [conversationId]: (p[conversationId] || []).map(m =>
          m._id === messageId ? { ...m, isDeleted: true, content: '', attachments: [] } : m
        ),
      }));
    };
    const onNew = (c: SSConversation) => setConvos(p => [c, ...p.filter(x => x._id !== c._id)]);
    socket.on('message:new', onMsg);
    socket.on('message:deleted', onDel);
    socket.on('conversation:new', onNew);
    return () => {
      socket.off('message:new', onMsg);
      socket.off('message:deleted', onDel);
      socket.off('conversation:new', onNew);
    };
  }, [socket]);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMsgs.length]);

  React.useEffect(() => {
    if (!activeId || !token) return;
    joinConversation(activeId);
    if (!msgs[activeId]) {
      setLoadingMsgs(true);
      apiClient.get(`/api/supraspace/conversations/${activeId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 40 },
      }).then(r => {
        const d = r.data?.data || [];
        setMsgs(p => ({ ...p, [activeId]: d }));
        setHasMore(p => ({ ...p, [activeId]: d.length === 40 }));
      }).finally(() => setLoadingMsgs(false));
    }
    markRead(activeId);
    return () => leaveConversation(activeId);
  }, [activeId, token]); // eslint-disable-line

  const handleSend = async () => {
    if (!input.trim() || !activeId || sending) return;
    setSending(true);
    sendTypingStop(activeId);
    const content = input.trim();
    const rId = replyTo?._id;
    setInput('');
    setReplyTo(null);
    try {
      await apiClient.post(
        `/api/supraspace/conversations/${activeId}/messages`,
        { content, replyTo: rId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch { setInput(content); }
    finally { setSending(false); }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || !activeId) return;
    setUploading(true);
    const fd = new FormData();
    Array.from(files).forEach(f => fd.append('files', f));
    if (replyTo) fd.append('replyTo', replyTo._id);
    setReplyTo(null);
    try {
      await apiClient.post(
        `/api/supraspace/conversations/${activeId}/upload`,
        fd,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );
    } catch {} finally { setUploading(false); }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (!activeId) return;
    sendTypingStart(activeId);
    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => sendTypingStop(activeId!), 2000);
  };

  const handleDelete = async (msgId: string) => {
    if (!activeId) return;
    setMsgs(p => ({
      ...p,
      [activeId]: (p[activeId] || []).map(m =>
        m._id === msgId ? { ...m, isDeleted: true, content: '', attachments: [] } : m
      ),
    }));
    try {
      await apiClient.delete(
        `/api/supraspace/messages/${msgId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      setMsgs(p => ({
        ...p,
        [activeId]: (p[activeId] || []).map(m =>
          m._id === msgId ? { ...m, isDeleted: false } : m
        ),
      }));
    }
  };

  const handleDM = async (targetId: string) => {
    setShowModal(false);
    try {
      const r = await apiClient.post(
        '/api/supraspace/conversations/direct',
        { targetUserId: targetId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const c = r.data?.data;
      setConvos(p => p.find(x => x._id === c._id) ? p : [c, ...p]);
      setActiveId(c._id);
      setSideOpen(false);
    } catch {}
  };

  const handleGroup = async (name: string, ids: string[]) => {
    setShowModal(false);
    try {
      const r = await apiClient.post(
        '/api/supraspace/conversations/group',
        { name, memberIds: ids },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConvos(p => [r.data?.data, ...p]);
      setActiveId(r.data?.data._id);
      setSideOpen(false);
    } catch {}
  };

  const loadMore = async () => {
    if (!activeId || !hasMore[activeId] || loadingMsgs) return;
    setLoadingMsgs(true);
    try {
      const r = await apiClient.get(
        `/api/supraspace/conversations/${activeId}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { before: activeMsgs[0]?.createdAt, limit: 40 },
        }
      );
      const d = r.data?.data || [];
      setMsgs(p => ({ ...p, [activeId]: [...d, ...(p[activeId] || [])] }));
      setHasMore(p => ({ ...p, [activeId]: d.length === 40 }));
    } catch {} finally { setLoadingMsgs(false); }
  };

  const typers = activeId ? (typing[activeId] || []).filter(t => t.userId !== uid) : [];
  const filtered = convos.filter(c =>
    getConvName(c, uid).toLowerCase().includes(q.toLowerCase())
  );

  // ─── Loading Screen ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="ss3 flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-5">
        <div
          className="h-16 w-16 rounded-2xl ss3-logo flex items-center justify-center relative"
          style={{ position: 'relative' }}
        >
          <Radio className="h-7 w-7" style={{ color: '#ecfdf5' }} />
          <div
            style={{
              position: 'absolute',
              inset: -1,
              borderRadius: 18,
              background: 'transparent',
              border: '1px solid rgba(52,211,153,0.3)',
              animation: 'ss3-blink 2s ease-in-out infinite',
            }}
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="ss3-hed font-700" style={{ fontSize: 15, color: 'var(--text-1)' }}>
            Supra Space
          </p>
          <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'rgba(16,185,129,0.5)' }} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="ss3 flex flex-col h-screen overflow-hidden">

      {/* ── Topbar ── */}
      <header className="ss3-topbar shrink-0 z-40" style={{ height: 54 }}>
        <div className="flex items-center justify-between h-full px-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/crm/dashboard')}
              className="ss3-icon-btn h-8 w-8 flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="w-px h-5" style={{ background: 'rgba(16,185,129,0.1)' }} />
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl ss3-logo flex items-center justify-center shrink-0">
                <Radio className="h-3.5 w-3.5" style={{ color: '#ecfdf5' }} />
              </div>
              <div>
                <p className="ss3-hed font-800 leading-none" style={{ fontSize: 14, color: 'var(--text-1)' }}>
                  Supra Space
                </p>
                <p
                  className="ss3-hed leading-none mt-0.5 font-700"
                  style={{ fontSize: 7, letterSpacing: '0.25em', color: 'var(--green2)', opacity: 0.6 }}
                >
                  TEAM MESSAGING
                </p>
              </div>
            </div>
          </div>

          {/* Right: connection badge */}
          <div className="flex items-center gap-3">
            <div
              className={cn('flex items-center gap-2 rounded-full px-3 py-1.5', isConnected ? 'ss3-live' : '')}
              style={!isConnected ? {
                background: 'rgba(52,211,153,0.03)',
                border: '1px solid rgba(52,211,153,0.06)',
              } : {}}
            >
              <span
                className={cn('h-1.5 w-1.5 rounded-full', isConnected ? 'ss3-online' : '')}
                style={!isConnected ? { background: 'rgba(52,211,153,0.15)' } : {}}
              />
              <span
                className="ss3-hed font-700"
                style={{
                  fontSize: 8,
                  letterSpacing: '0.2em',
                  color: isConnected ? 'var(--blue)' : 'var(--text-3)',
                }}
              >
                {isConnected ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <aside
          className={cn(
            'ss3-sidebar shrink-0 flex flex-col transition-all duration-300 overflow-hidden',
            'absolute z-30 w-full sm:w-72',
            'lg:relative lg:inset-auto lg:z-auto lg:w-72 lg:flex',
            (!sideOpen && activeId) ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
          )}
          style={{ top: 54, bottom: 0 }}
        >
          {/* Sidebar header */}
          <div className="px-4 pt-5 pb-3 shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <span className="ss3-section-label">Messages</span>
              <button
                onClick={() => setShowModal(true)}
                className="ss3-fab h-7 w-7 rounded-lg flex items-center justify-center"
                title="New conversation"
              >
                <Plus className="h-3.5 w-3.5" style={{ color: '#ecfdf5' }} />
              </button>
            </div>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                style={{ color: 'var(--text-3)' }}
              />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search conversations..."
                className="w-full h-9 rounded-xl pl-9 pr-3 text-xs ss3-search"
              />
            </div>
          </div>

          <div className="ss3-divider mx-4" />

          {/* Conv list */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 ss3-scroll">
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <div className="h-10 w-10 rounded-xl ss3-empty-icon flex items-center justify-center">
                  <MessageSquare className="h-4 w-4" style={{ color: 'var(--green)' }} />
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-3)' }}>No conversations yet</p>
              </div>
            )}
            {filtered.map(conv => {
              const isAct = conv._id === activeId;
              const other = conv.members.find(m => m._id !== uid);
              const online = other ? presence[other._id] === 'online' : false;
              return (
                <div
                  key={conv._id}
                  className={cn('ss3-conv w-full flex items-center gap-3 px-3 py-2.5', isAct && 'ss3-conv-active')}
                >
                  {/* Clickable body — opens conversation */}
                  <div
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    onClick={() => { setActiveId(conv._id); setSideOpen(false); }}
                  >
                    <div className="relative shrink-0">
                      <div className={cn(
                        'h-9 w-9 rounded-xl flex items-center justify-center overflow-hidden',
                        conv.type === 'group' ? 'ss3-ava-group' : 'ss3-ava-dm'
                      )}>
                        {getConvAvatar(conv, uid)
                          ? <img src={getConvAvatar(conv, uid)} alt="" className="w-full h-full object-cover" />
                          : conv.type === 'group'
                            ? <Hash className="h-4 w-4 text-white" style={{ opacity: 0.7 }} />
                            : <span className="ss3-hed text-white font-700" style={{ fontSize: 10 }}>
                                {ini(getConvName(conv, uid))}
                              </span>}
                      </div>
                      {conv.type === 'direct' && online && (
                        <span
                          className="ss3-online absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full"
                          style={{ border: '2px solid var(--bg2)' }}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-600 truncate" style={{ fontSize: 13, color: 'var(--text-1)' }}>
                        {getConvName(conv, uid)}
                      </p>
                      <p className="truncate mt-0.5" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        {conv.lastMessage?.isDeleted
                          ? 'Message deleted'
                          : conv.lastMessage?.content || (conv.lastMessage?.attachments?.length ? '📎 Attachment' : 'No messages yet')}
                      </p>
                    </div>
                  </div>

                  {/* Always-visible video call button */}
                  <button
                    onClick={e => { e.stopPropagation(); setVideoCallConv(conv); }}
                    className="ss3-conv-video h-7 w-7 flex items-center justify-center"
                    title={`Video call ${getConvName(conv, uid)}`}
                  >
                    <Video className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── Chat area ── */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Empty state */}
          {!activeId && (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
              <div
                className="h-20 w-20 rounded-2xl ss3-empty-icon flex items-center justify-center"
                style={{ boxShadow: '0 0 40px rgba(16,185,129,0.08)' }}
              >
                <MessageSquare className="h-8 w-8" style={{ color: 'var(--green)' }} />
              </div>
              <div>
                <p className="ss3-hed font-700" style={{ fontSize: 16, color: 'var(--text-2)' }}>
                  No conversation open
                </p>
                <p className="mt-2" style={{ fontSize: 13, color: 'var(--text-3)' }}>
                  Select one from the list or start a new one
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="ss3-fab ss3-hed font-700 h-10 px-6 rounded-xl flex items-center gap-2"
                style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ecfdf5' }}
              >
                <Plus className="h-3.5 w-3.5" />
                New Message
              </button>
            </div>
          )}

          {activeId && activeConv && (
            <>
              {/* Chat header */}
              <div className="ss3-chat-header shrink-0 flex items-center gap-3 px-4 py-3">
                <button
                  className="lg:hidden ss3-icon-btn h-8 w-8 flex items-center justify-center"
                  onClick={() => setSideOpen(true)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="relative">
                  <div className={cn(
                    'h-9 w-9 rounded-xl flex items-center justify-center overflow-hidden',
                    activeConv.type === 'group' ? 'ss3-ava-group' : 'ss3-ava-dm'
                  )}>
                    {getConvAvatar(activeConv, uid)
                      ? <img src={getConvAvatar(activeConv, uid)} alt="" className="w-full h-full object-cover" />
                      : activeConv.type === 'group'
                        ? <Hash className="h-3.5 w-3.5 text-white" style={{ opacity: 0.7 }} />
                        : <span className="ss3-hed text-white font-700" style={{ fontSize: 10 }}>
                            {ini(getConvName(activeConv, uid))}
                          </span>}
                  </div>
                  {activeConv.type === 'direct' && (() => {
                    const o = activeConv.members.find(m => m._id !== uid);
                    return o && presence[o._id] === 'online'
                      ? <span className="ss3-online absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full"
                          style={{ border: '2px solid var(--bg)' }} />
                      : null;
                  })()}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="ss3-hed font-700 leading-none truncate" style={{ fontSize: 14, color: 'var(--text-1)' }}>
                    {getConvName(activeConv, uid)}
                  </p>
                  <p className="mt-1 leading-none" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    {activeConv.type === 'group'
                      ? `${activeConv.members.length} members`
                      : (() => {
                          const o = activeConv.members.find(m => m._id !== uid);
                          if (!o) return '';
                          return presence[o._id] === 'online'
                            ? <span style={{ color: 'var(--green2)' }}>● Online</span>
                            : 'Offline';
                        })()}
                  </p>
                </div>

                {/* ── Right-side header actions ── */}
                <div className="flex items-center gap-1.5">

                  {/* Video Call Button */}
                  <button
                    onClick={() => setVideoCallConv(activeConv)}
                    className="ss3-video-btn h-8 px-3 rounded-xl flex items-center gap-1.5"
                    title="Start video call"
                  >
                    <Video className="h-3.5 w-3.5" style={{ color: 'var(--blue)' }} />
                    <span
                      className="ss3-hed font-700 hidden sm:inline"
                      style={{
                        fontSize: 9,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--blue)',
                      }}
                    >
                      Video
                    </span>
                  </button>

                  {activeConv.type === 'group' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="ss3-icon-btn h-8 w-8 flex items-center justify-center">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-44 rounded-xl"
                        style={{ background: '#0d180d', border: '1px solid rgba(16,185,129,0.1)' }}
                      >
                        <DropdownMenuItem
                          className="text-xs gap-2 rounded-lg cursor-pointer"
                          style={{ color: 'var(--text-2)' }}
                        >
                          <Users className="h-3.5 w-3.5" /> View Members
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto py-4 space-y-1 ss3-scroll">
                {hasMore[activeId] && (
                  <div className="flex justify-center pb-2">
                    <button
                      onClick={loadMore}
                      className="ss3-hed font-700 transition-all"
                      style={{
                        fontSize: 9,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color: 'rgba(52,211,153,0.35)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'rgba(52,211,153,0.8)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(52,211,153,0.35)')}
                    >
                      {loadingMsgs
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : '↑ Load earlier messages'}
                    </button>
                  </div>
                )}

                {loadingMsgs && activeMsgs.length === 0 && (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'rgba(16,185,129,0.3)' }} />
                  </div>
                )}

                {activeMsgs.map((msg, i) => {
                  const prev = activeMsgs[i - 1];
                  const showDate = !prev || fmtDate(msg.createdAt) !== fmtDate(prev.createdAt);
                  const showAvatar = !prev || prev.sender._id !== msg.sender._id || showDate;
                  return (
                    <React.Fragment key={msg._id}>
                      {showDate && <DateSep date={msg.createdAt} />}
                      <Bubble
                        message={msg}
                        isOwn={msg.sender._id === uid}
                        showAvatar={showAvatar}
                        onReply={setReplyTo}
                        onDelete={handleDelete}
                      />
                    </React.Fragment>
                  );
                })}

                {/* Typing indicator */}
                {typers.length > 0 && (
                  <div className="flex gap-3 px-6 py-1">
                    <div className="w-8" />
                    <div className="ss3-typing rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center gap-2">
                      <span className="italic" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        {typers.map(t => t.fullName).join(', ')} {typers.length === 1 ? 'is' : 'are'} typing
                      </span>
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <span
                            key={i}
                            className="ss3-dot h-1 w-1 rounded-full"
                            style={{ background: 'var(--green2)', animationDelay: `${i * 0.2}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={endRef} />
              </div>

              {/* ── Input area ── */}
              <div className="shrink-0 px-4 pb-4 space-y-2">
                {/* Reply bar */}
                {replyTo && (
                  <div className="ss3-reply-bar flex items-center gap-2 rounded-xl px-3 py-2">
                    <Reply className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--green)' }} />
                    <div className="min-w-0 flex-1">
                      <p
                        className="ss3-hed font-700"
                        style={{ fontSize: 9, letterSpacing: '0.15em', color: 'rgba(52,211,153,0.8)' }}
                      >
                        {replyTo.sender.fullName.toUpperCase()}
                      </p>
                      <p className="truncate mt-0.5" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        {replyTo.content || '📎 Attachment'}
                      </p>
                    </div>
                    <button
                      onClick={() => setReplyTo(null)}
                      className="ss3-icon-btn p-1 flex items-center justify-center"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Toolbar + textarea row */}
                <div className="ss3-input-wrap rounded-2xl flex flex-col">
                  {/* Text area */}
                  <div className="flex items-end gap-2 px-3 pt-3 pb-2">
                    <textarea
                      value={input}
                      onChange={handleTyping}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Write a message..."
                      rows={1}
                      className="flex-1 resize-none bg-transparent text-sm focus:outline-none max-h-32 min-h-[32px] py-1"
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        lineHeight: '1.5',
                        color: 'var(--text-1)',
                        caretColor: 'var(--green2)',
                      }}
                    />
                  </div>

                  {/* Bottom toolbar */}
                  <div
                    className="flex items-center justify-between px-3 pb-2.5 pt-1"
                    style={{ borderTop: '1px solid rgba(16,185,129,0.06)' }}
                  >
                    {/* Left tools */}
                    <div className="flex items-center gap-1">
                      {/* Attach files */}
                      <button
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="ss3-icon-btn h-8 w-8 flex items-center justify-center"
                        title="Attach files"
                      >
                        {uploading
                          ? <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--green2)' }} />
                          : <Paperclip className="h-4 w-4" />}
                      </button>
                      <input
                        ref={fileRef}
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
                        className="hidden"
                        onChange={e => handleUpload(e.target.files)}
                      />

                      {/* Supra Leo AI button */}
                      <button
                        className="ss3-ai-btn h-8 rounded-xl px-3 flex items-center gap-1.5"
                        title="Supra Leo AI"
                        onClick={() => {/* TODO: open AI panel */}}
                      >
                        <span
                          className="ss3-hed font-700 ss3-ai-shimmer"
                          style={{ fontSize: 10, letterSpacing: '0.08em' }}
                        >
                          Supra Leo AI
                        </span>
                      </button>
                    </div>

                    {/* Send button */}
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || sending}
                      className="ss3-send h-8 w-8 rounded-xl flex items-center justify-center"
                    >
                      {sending
                        ? <Loader2
                            className="h-3.5 w-3.5 animate-spin"
                            style={{ color: input.trim() ? '#ecfdf5' : 'var(--text-3)' }}
                          />
                        : <Send
                            className="h-3.5 w-3.5"
                            style={{
                              color: input.trim() ? '#ecfdf5' : 'var(--text-3)',
                              opacity: input.trim() ? 1 : 0.4,
                            }}
                          />}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── Modals ── */}
      {showModal && (
        <NewConvModal
          users={allUsers}
          onClose={() => setShowModal(false)}
          onStartDM={handleDM}
          onCreateGroup={handleGroup}
        />
      )}

      {videoCallConv && (
        <VideoCallModal
          conv={videoCallConv}
          uid={uid}
          onClose={() => setVideoCallConv(null)}
        />
      )}
    </div>
  );
}