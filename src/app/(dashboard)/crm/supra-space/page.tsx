'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, Users, MessageSquare, Send, Paperclip,
  X, ChevronLeft, MoreVertical, Download, FileText,
  Image as ImageIcon, Loader2, Check, CheckCheck,
  Hash, Lock, Smile, Reply, Trash2, Car, ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiClient } from '@/lib/api-client';
import { useSupraSpaceSocket, SSConversation, SSMessage } from '@/hooks/useSupraSpaceSocket';
import { Socket } from 'socket.io-client';
import { cn } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ini(n: string) {
  return n.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(d: string) {
  const date = new Date(d);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return date.toLocaleDateString([], { weekday: 'long' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function fmtFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getConvName(conv: SSConversation, currentUserId: string) {
  if (conv.type === 'group') return conv.name || 'Group';
  const other = conv.members.find((m) => m._id !== currentUserId);
  return other?.fullName || 'Unknown';
}

function getConvAvatar(conv: SSConversation, currentUserId: string) {
  if (conv.type === 'group') return conv.avatar;
  const other = conv.members.find((m) => m._id !== currentUserId);
  return other?.avatar;
}

function getConvAvatarIni(conv: SSConversation, currentUserId: string) {
  return ini(getConvName(conv, currentUserId));
}

// ─── Date Separator ───────────────────────────────────────────────────────────

function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-border/30" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 px-2">
        {fmtDate(date)}
      </span>
      <div className="flex-1 h-px bg-border/30" />
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  message,
  isOwn,
  showAvatar,
  onReply,
  onDelete,
}: {
  message: SSMessage;
  isOwn: boolean;
  showAvatar: boolean;
  onReply: (msg: SSMessage) => void;
  onDelete: (msgId: string) => void;
}) {
  const [hover, setHover] = React.useState(false);

  if (message.isDeleted) {
    return (
      <div className={cn('flex gap-2.5 group px-4', isOwn && 'flex-row-reverse')}>
        {showAvatar ? (
          <Avatar className="h-7 w-7 shrink-0 mt-0.5">
            <AvatarImage src={message.sender.avatar} />
            <AvatarFallback className="bg-muted text-muted-foreground text-[9px] font-bold">
              {ini(message.sender.fullName)}
            </AvatarFallback>
          </Avatar>
        ) : <div className="w-7 shrink-0" />}
        <span className="text-xs text-muted-foreground/30 italic py-1">Message deleted</span>
      </div>
    );
  }

  return (
    <div
      className={cn('flex gap-2.5 group px-4 relative', isOwn && 'flex-row-reverse')}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Avatar */}
      {showAvatar ? (
        <Avatar className="h-7 w-7 shrink-0 mt-0.5">
          <AvatarImage src={message.sender.avatar} />
          <AvatarFallback className="bg-emerald-600 text-white text-[9px] font-bold">
            {ini(message.sender.fullName)}
          </AvatarFallback>
        </Avatar>
      ) : <div className="w-7 shrink-0" />}

      <div className={cn('flex flex-col gap-1 max-w-[75%]', isOwn && 'items-end')}>
        {/* Sender name (only on first bubble in a group) */}
        {showAvatar && !isOwn && (
          <span className="text-[10px] font-bold text-muted-foreground/50 px-1">
            {message.sender.fullName}
          </span>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div className={cn(
            'flex items-start gap-2 rounded-lg border-l-2 border-emerald-500/40 bg-muted/30 px-3 py-1.5 mb-0.5 max-w-full',
            isOwn && 'border-l-0 border-r-2'
          )}>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-emerald-500/70 truncate">
                {(message.replyTo as any).sender?.fullName}
              </p>
              <p className="text-[11px] text-muted-foreground/50 truncate">
                {(message.replyTo as any).content || '📎 Attachment'}
              </p>
            </div>
          </div>
        )}

        {/* Bubble */}
        <div className={cn(
          'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words',
          isOwn
            ? 'bg-emerald-600 text-white rounded-tr-sm'
            : 'bg-card border border-border/40 text-foreground rounded-tl-sm'
        )}>

          {/* Images */}
          {message.attachments.filter(a => a.mimeType.startsWith('image/')).map((att, i) => (
            <a key={i} href={att.url} target="_blank" rel="noreferrer" className="block mb-2 last:mb-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={att.url}
                alt={att.originalName}
                className="max-w-full rounded-lg max-h-64 object-cover"
              />
            </a>
          ))}

          {/* File attachments (non-image) */}
          {message.attachments.filter(a => !a.mimeType.startsWith('image/')).map((att, i) => (
            <a
              key={i}
              href={att.url}
              target="_blank"
              rel="noreferrer"
              className={cn(
                'flex items-center gap-2.5 rounded-xl p-2.5 mb-2 last:mb-0 transition-colors',
                isOwn ? 'bg-emerald-700/50 hover:bg-emerald-700/70' : 'bg-muted/50 hover:bg-muted'
              )}
            >
              <div className={cn(
                'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                isOwn ? 'bg-emerald-800/50' : 'bg-background'
              )}>
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate">{att.originalName}</p>
                <p className={cn('text-[10px]', isOwn ? 'text-emerald-200/60' : 'text-muted-foreground/40')}>
                  {fmtFileSize(att.size)}
                </p>
              </div>
              <Download className="h-3.5 w-3.5 shrink-0 opacity-60" />
            </a>
          ))}

          {/* Text content */}
          {message.content && <p>{message.content}</p>}
        </div>

        {/* Timestamp + read receipt */}
        <div className={cn('flex items-center gap-1 px-1', isOwn && 'flex-row-reverse')}>
          <span className="text-[9px] text-muted-foreground/30">{fmtTime(message.createdAt)}</span>
          {isOwn && (
            message.readBy.length > 1
              ? <CheckCheck className="h-3 w-3 text-emerald-500/60" />
              : <Check className="h-3 w-3 text-muted-foreground/30" />
          )}
        </div>
      </div>

      {/* Hover actions */}
      {hover && (
        <div className={cn(
          'absolute top-0 flex items-center gap-0.5 bg-card border border-border/40 rounded-xl shadow-lg px-1 py-0.5 z-10',
          isOwn ? 'right-14' : 'left-14'
        )}>
          <button
            onClick={() => onReply(message)}
            className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            <Reply className="h-3.5 w-3.5" />
          </button>
          {isOwn && (
            <button
              onClick={() => onDelete(message._id)}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground/60 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── New Conversation Modal ────────────────────────────────────────────────────

interface CrmUserItem { _id: string; fullName: string; username: string; avatar?: string; role: string }

function NewConversationModal({
  users,
  onClose,
  onStartDM,
  onCreateGroup,
}: {
  users: CrmUserItem[];
  onClose: () => void;
  onStartDM: (userId: string) => void;
  onCreateGroup: (name: string, memberIds: string[]) => void;
}) {
  const [tab, setTab] = React.useState<'dm' | 'group'>('dm');
  const [search, setSearch] = React.useState('');
  const [groupName, setGroupName] = React.useState('');
  const [selected, setSelected] = React.useState<string[]>([]);

  const filtered = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border/40 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <h2 className="text-sm font-bold">New Conversation</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-3 border-b border-border/30 bg-muted/[0.03]">
          {(['dm', 'group'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 h-8 rounded-lg text-xs font-semibold transition-all',
                tab === t ? 'bg-emerald-600 text-white' : 'hover:bg-muted/60 text-muted-foreground'
              )}
            >
              {t === 'dm' ? 'Direct Message' : 'Group Chat'}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3">
          {tab === 'group' && (
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name..."
              className="w-full h-9 rounded-xl border border-border/40 bg-muted/30 px-3 text-sm focus:outline-none focus:border-emerald-500/40 focus:bg-muted/50 transition-all"
            />
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full h-9 rounded-xl border border-border/40 bg-muted/30 pl-9 pr-3 text-sm focus:outline-none focus:border-emerald-500/40 transition-all"
            />
          </div>

          {/* User list */}
          <div className="space-y-0.5 max-h-64 overflow-y-auto">
            {filtered.map((u) => {
              const isSelected = selected.includes(u._id);
              return (
                <button
                  key={u._id}
                  onClick={() => tab === 'dm' ? onStartDM(u._id) : toggleSelect(u._id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left',
                    isSelected ? 'bg-emerald-500/10 border border-emerald-500/20' : 'hover:bg-muted/50'
                  )}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={u.avatar} />
                    <AvatarFallback className="bg-emerald-600 text-white text-[9px] font-bold">{ini(u.fullName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{u.fullName}</p>
                    <p className="text-[10px] text-muted-foreground/50">{u.username} · {u.role}</p>
                  </div>
                  {tab === 'group' && isSelected && (
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {tab === 'group' && selected.length > 0 && (
            <Button
              onClick={() => groupName.trim() && onCreateGroup(groupName, selected)}
              disabled={!groupName.trim() || selected.length === 0}
              className="w-full h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm gap-2"
            >
              <Users className="h-4 w-4" />
              Create Group ({selected.length} member{selected.length !== 1 ? 's' : ''})
            </Button>
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
  const [currentUserId, setCurrentUserId] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);

  // Conversations
  const [conversations, setConversations] = React.useState<SSConversation[]>([]);
  const [activeConvId, setActiveConvId] = React.useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  // Messages
  const [messages, setMessages] = React.useState<Record<string, SSMessage[]>>({});
  const [loadingMessages, setLoadingMessages] = React.useState(false);
  const [hasMore, setHasMore] = React.useState<Record<string, boolean>>({});

  // Input
  const [input, setInput] = React.useState('');
  const [replyTo, setReplyTo] = React.useState<SSMessage | null>(null);
  const [isSending, setIsSending] = React.useState(false);
  const [uploadingFile, setUploadingFile] = React.useState(false);

  // New conversation modal
  const [showNewConv, setShowNewConv] = React.useState(false);
  const [allUsers, setAllUsers] = React.useState<CrmUserItem[]>([]);

  // Search conversations
  const [convSearch, setConvSearch] = React.useState('');

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const typingTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const activeConv = conversations.find((c) => c._id === activeConvId);
  const activeMessages = activeConvId ? (messages[activeConvId] || []) : [];

  // ── Socket ───────────────────────────────────────────────────────────────────
  const { socket, isConnected, presence, typing, joinConversation, leaveConversation,
    sendTypingStart, sendTypingStop, markRead } = useSupraSpaceSocket(token || null);

  // ── Init ─────────────────────────────────────────────────────────────────────
  React.useEffect(() => {
    const t = localStorage.getItem('crm_token');
    const u = localStorage.getItem('crm_user');
    if (!t) { router.replace('/crm'); return; }
    setToken(t);
    if (u) {
      try { setCurrentUserId(JSON.parse(u)._id); } catch {}
    }

    const init = async () => {
      try {
        const [meRes, convRes, usersRes] = await Promise.all([
          apiClient.get('/api/crm/me', { headers: { Authorization: `Bearer ${t}` } }),
          apiClient.get('/api/supraspace/conversations', { headers: { Authorization: `Bearer ${t}` } }),
          apiClient.get('/api/supraspace/users', { headers: { Authorization: `Bearer ${t}` } }),
        ]);
        const me = meRes.data?.data || meRes.data;
        setCurrentUserId(me._id);
        setConversations(convRes.data?.data || []);
        setAllUsers(usersRes.data?.data || []);
      } catch {
        router.replace('/crm');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [router]);

  // ── Bind socket events directly on the socket instance ───────────────────────
  // This runs whenever the socket object changes (i.e. connects/reconnects),
  // ensuring handlers are always attached to the live socket — never a stale ref.
  React.useEffect(() => {
    if (!socket) return;

    const handleNewMessage = ({ conversationId, message }: { conversationId: string; message: SSMessage }) => {
      // Append to messages map
      setMessages((prev) => {
        const existing = prev[conversationId] || [];
        // Deduplicate by _id (in case optimistic + server both arrive)
        if (existing.find((m) => m._id === message._id)) return prev;
        return { ...prev, [conversationId]: [...existing, message] };
      });
      // Bubble up lastMessage in sidebar
      setConversations((prev) =>
        prev
          .map((c) =>
            c._id === conversationId
              ? { ...c, lastMessage: message, lastMessageAt: message.createdAt }
              : c
          )
          .sort(
            (a, b) =>
              new Date(b.lastMessageAt || 0).getTime() -
              new Date(a.lastMessageAt || 0).getTime()
          )
      );
    };

    const handleMessageDeleted = ({ conversationId, messageId }: { conversationId: string; messageId: string }) => {
      setMessages((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map((m) =>
          m._id === messageId
            ? { ...m, isDeleted: true, content: '', attachments: [] }
            : m
        ),
      }));
    };

    const handleNewConversation = (conv: SSConversation) => {
      setConversations((prev) => [conv, ...prev.filter((c) => c._id !== conv._id)]);
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('conversation:new', handleNewConversation);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('conversation:new', handleNewConversation);
    };
  }, [socket]); // re-runs only when socket instance changes

  // ── Auto-scroll to bottom ─────────────────────────────────────────────────────
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length]);

  // ── Load messages + join conversation room when active conv changes ───────────
  React.useEffect(() => {
    if (!activeConvId || !token) return;

    // Always join the socket room so we receive real-time events for this conv
    joinConversation(activeConvId);

    // Only fetch from API if we don't already have messages cached
    if (!messages[activeConvId]) {
      const load = async () => {
        setLoadingMessages(true);
        try {
          const res = await apiClient.get(
            `/api/supraspace/conversations/${activeConvId}/messages`,
            { headers: { Authorization: `Bearer ${token}` }, params: { limit: 40 } }
          );
          const fetched = res.data?.data || [];
          setMessages((prev) => ({ ...prev, [activeConvId]: fetched }));
          setHasMore((prev) => ({ ...prev, [activeConvId]: fetched.length === 40 }));
        } catch {}
        finally { setLoadingMessages(false); }
      };
      load();
    }

    markRead(activeConvId);

    return () => leaveConversation(activeConvId);
  }, [activeConvId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Send message ──────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || !activeConvId || isSending) return;
    setIsSending(true);
    sendTypingStop(activeConvId);
    const content = input.trim();
    const replyToId = replyTo?._id;
    setInput('');
    setReplyTo(null);
    try {
      await apiClient.post(
        `/api/supraspace/conversations/${activeConvId}/messages`,
        { content, replyTo: replyToId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // NOTE: no local push here — the socket event handles adding it to state
      // so both sender and receiver use the same code path
    } catch {
      // Restore input on failure
      setInput(content);
    } finally {
      setIsSending(false);
    }
  };

  // ── File upload ───────────────────────────────────────────────────────────────
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !activeConvId) return;
    setUploadingFile(true);
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append('files', f));
    if (replyTo) formData.append('replyTo', replyTo._id);
    setReplyTo(null);
    try {
      await apiClient.post(
        `/api/supraspace/conversations/${activeConvId}/upload`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );
      // Socket will deliver the message to all members including sender
    } catch {}
    finally { setUploadingFile(false); }
  };

  // ── Typing indicator ──────────────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (!activeConvId) return;
    sendTypingStart(activeConvId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTypingStop(activeConvId!), 2000);
  };

  // ── Delete message ────────────────────────────────────────────────────────────
  const handleDelete = async (messageId: string) => {
    if (!activeConvId) return;
    // Optimistic UI — hide immediately
    setMessages((prev) => ({
      ...prev,
      [activeConvId]: (prev[activeConvId] || []).map((m) =>
        m._id === messageId ? { ...m, isDeleted: true, content: '', attachments: [] } : m
      ),
    }));
    try {
      await apiClient.delete(`/api/supraspace/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Revert optimistic update on failure
      setMessages((prev) => ({
        ...prev,
        [activeConvId]: (prev[activeConvId] || []).map((m) =>
          m._id === messageId ? { ...m, isDeleted: false } : m
        ),
      }));
    }
  };

  // ── Start DM ──
  const handleStartDM = async (targetUserId: string) => {
    setShowNewConv(false);
    try {
      const res = await apiClient.post('/api/supraspace/conversations/direct',
        { targetUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const conv = res.data?.data;
      setConversations((prev) => {
        const exists = prev.find((c) => c._id === conv._id);
        return exists ? prev : [conv, ...prev];
      });
      setActiveConvId(conv._id);
      setSidebarOpen(false);
    } catch {}
  };

  // ── Create group ──
  const handleCreateGroup = async (name: string, memberIds: string[]) => {
    setShowNewConv(false);
    try {
      const res = await apiClient.post('/api/supraspace/conversations/group',
        { name, memberIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const conv = res.data?.data;
      setConversations((prev) => [conv, ...prev]);
      setActiveConvId(conv._id);
      setSidebarOpen(false);
    } catch {}
  };

  // ── Load more ──
  const loadMore = async () => {
    if (!activeConvId || !hasMore[activeConvId] || loadingMessages) return;
    const oldest = activeMessages[0]?.createdAt;
    setLoadingMessages(true);
    try {
      const res = await apiClient.get(`/api/supraspace/conversations/${activeConvId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { before: oldest, limit: 40 },
      });
      const fetched = res.data?.data || [];
      setMessages((prev) => ({ ...prev, [activeConvId]: [...fetched, ...(prev[activeConvId] || [])] }));
      setHasMore((prev) => ({ ...prev, [activeConvId]: fetched.length === 40 }));
    } catch {}
    finally { setLoadingMessages(false); }
  };

  const typingUsers = activeConvId ? (typing[activeConvId] || []).filter(t => t.userId !== currentUserId) : [];

  const filteredConvs = conversations.filter((c) => {
    const name = getConvName(c, currentUserId).toLowerCase();
    return name.includes(convSearch.toLowerCase());
  });

  // ─── Loading ───
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
          </div>
          <p className="text-xs text-muted-foreground/40 tracking-widest uppercase">Loading Supra Space</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">

      {/* ── Topbar ── */}
      <header className="shrink-0 border-b border-border/40 bg-background/90 backdrop-blur-xl z-40">
        <div className="flex items-center justify-between h-14 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/crm/dashboard')}
              className="h-8 w-8 rounded-lg hover:bg-muted/60 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-sm">
              <Car className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none">Supra Space</p>
              <p className="text-[9px] uppercase tracking-[0.25em] text-emerald-600 mt-0.5 font-bold">
                Team Messaging
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-1.5',
              isConnected ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-border/40 bg-muted/10'
            )}>
              <span className={cn('h-1.5 w-1.5 rounded-full', isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/30')} />
              <span className={cn('text-[10px] font-semibold', isConnected ? 'text-emerald-600' : 'text-muted-foreground/40')}>
                {isConnected ? 'Live' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ══════════════════ SIDEBAR ══════════════════ */}
        <aside className={cn(
          'shrink-0 border-r border-border/40 bg-card flex flex-col transition-all duration-300 overflow-hidden',
          // Mobile: full-width overlay; Desktop: fixed 300px
          'absolute inset-y-14 left-0 z-30 w-full sm:w-[300px]',
          'lg:relative lg:inset-auto lg:z-auto',
          (!sidebarOpen && activeConvId) ? 'translate-x-[-100%] lg:translate-x-0' : 'translate-x-0',
          'lg:w-[300px] lg:flex'
        )}>

          {/* Sidebar header */}
          <div className="px-4 pt-4 pb-3 shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40">Messages</p>
              <button
                onClick={() => setShowNewConv(true)}
                className="h-7 w-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center transition-colors shadow-sm"
              >
                <Plus className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30" />
              <input
                value={convSearch}
                onChange={(e) => setConvSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full h-8 rounded-xl bg-muted/30 border border-border/30 pl-9 pr-3 text-xs focus:outline-none focus:border-emerald-500/30 transition-all"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
            {filteredConvs.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <MessageSquare className="h-8 w-8 text-muted-foreground/15" />
                <p className="text-xs text-muted-foreground/30">No conversations yet</p>
              </div>
            )}
            {filteredConvs.map((conv) => {
              const isActive = conv._id === activeConvId;
              const otherMember = conv.members.find((m) => m._id !== currentUserId);
              const isOnline = otherMember ? presence[otherMember._id] === 'online' : false;

              return (
                <button
                  key={conv._id}
                  onClick={() => { setActiveConvId(conv._id); setSidebarOpen(false); }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left',
                    isActive ? 'bg-emerald-500/10 border border-emerald-500/15' : 'hover:bg-muted/40'
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={getConvAvatar(conv, currentUserId)} />
                      <AvatarFallback className={cn(
                        'text-white text-[9px] font-bold',
                        conv.type === 'group' ? 'bg-purple-600' : 'bg-emerald-600'
                      )}>
                        {conv.type === 'group' ? <Hash className="h-4 w-4" /> : getConvAvatarIni(conv, currentUserId)}
                      </AvatarFallback>
                    </Avatar>
                    {conv.type === 'direct' && isOnline && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-card" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold truncate">{getConvName(conv, currentUserId)}</p>
                      {conv.lastMessageAt && (
                        <span className="text-[9px] text-muted-foreground/30 shrink-0 tabular-nums">
                          {fmtTime(conv.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground/40 truncate mt-0.5">
                      {conv.lastMessage?.isDeleted
                        ? 'Message deleted'
                        : conv.lastMessage?.content
                          ? conv.lastMessage.content
                          : conv.lastMessage?.attachments?.length
                            ? '📎 Attachment'
                            : 'No messages yet'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ══════════════════ CHAT AREA ══════════════════ */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* No conversation selected */}
          {!activeConvId && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
              <div className="h-16 w-16 rounded-2xl border-2 border-dashed border-border/25 flex items-center justify-center">
                <MessageSquare className="h-7 w-7 text-muted-foreground/15" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground/50">No conversation selected</p>
                <p className="text-xs text-muted-foreground/30 mt-1">Choose a conversation or start a new one</p>
              </div>
              <Button
                onClick={() => setShowNewConv(true)}
                size="sm"
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
              >
                <Plus className="h-4 w-4" /> New Message
              </Button>
            </div>
          )}

          {/* Active conversation */}
          {activeConvId && activeConv && (
            <>
              {/* Chat header */}
              <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border/30 bg-card/50">
                <button
                  className="lg:hidden h-8 w-8 rounded-lg hover:bg-muted/60 flex items-center justify-center"
                  onClick={() => setSidebarOpen(true)}
                >
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </button>

                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getConvAvatar(activeConv, currentUserId)} />
                    <AvatarFallback className={cn(
                      'text-white text-[9px] font-bold',
                      activeConv.type === 'group' ? 'bg-purple-600' : 'bg-emerald-600'
                    )}>
                      {activeConv.type === 'group' ? <Hash className="h-3.5 w-3.5" /> : getConvAvatarIni(activeConv, currentUserId)}
                    </AvatarFallback>
                  </Avatar>
                  {activeConv.type === 'direct' && (() => {
                    const other = activeConv.members.find((m) => m._id !== currentUserId);
                    return other && presence[other._id] === 'online' ? (
                      <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 border-2 border-card" />
                    ) : null;
                  })()}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold leading-none truncate">
                    {getConvName(activeConv, currentUserId)}
                  </p>
                  <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                    {activeConv.type === 'group'
                      ? `${activeConv.members.length} members`
                      : (() => {
                          const other = activeConv.members.find((m) => m._id !== currentUserId);
                          return other
                            ? presence[other._id] === 'online' ? 'Online' : 'Offline'
                            : '';
                        })()}
                  </p>
                </div>

                {activeConv.type === 'group' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 rounded-xl">
                      <DropdownMenuItem className="text-xs gap-2 rounded-lg">
                        <Users className="h-3.5 w-3.5" /> View Members
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto py-4 space-y-1">
                {/* Load more */}
                {hasMore[activeConvId] && (
                  <div className="flex justify-center pb-2">
                    <button
                      onClick={loadMore}
                      className="text-[11px] text-emerald-500/60 hover:text-emerald-500 font-semibold transition-colors"
                    >
                      {loadingMessages ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Load earlier messages'}
                    </button>
                  </div>
                )}

                {loadingMessages && activeMessages.length === 0 && (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-500/40" />
                  </div>
                )}

                {/* Render messages with date separators */}
                {activeMessages.map((msg, idx) => {
                  const prev = activeMessages[idx - 1];
                  const showDate = !prev || fmtDate(msg.createdAt) !== fmtDate(prev.createdAt);
                  const showAvatar = !prev || prev.sender._id !== msg.sender._id || showDate;
                  const isOwn = msg.sender._id === currentUserId;

                  return (
                    <React.Fragment key={msg._id}>
                      {showDate && <DateSeparator date={msg.createdAt} />}
                      <MessageBubble
                        message={msg}
                        isOwn={isOwn}
                        showAvatar={showAvatar}
                        onReply={setReplyTo}
                        onDelete={handleDelete}
                      />
                    </React.Fragment>
                  );
                })}

                {/* Typing indicator */}
                {typingUsers.length > 0 && (
                  <div className="flex items-center gap-2.5 px-4 py-1">
                    <div className="flex gap-1 items-center bg-card border border-border/40 rounded-2xl rounded-tl-sm px-3 py-2.5">
                      <span className="text-[11px] text-muted-foreground/50 italic">
                        {typingUsers.map((t) => t.fullName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing
                      </span>
                      <div className="flex gap-0.5 ml-1">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="h-1 w-1 rounded-full bg-muted-foreground/30 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="shrink-0 px-4 pb-4 space-y-2">
                {/* Reply preview */}
                {replyTo && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                    <Reply className="h-3.5 w-3.5 text-emerald-500/60 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-emerald-500/70">{replyTo.sender.fullName}</p>
                      <p className="text-[11px] text-muted-foreground/50 truncate">
                        {replyTo.content || '📎 Attachment'}
                      </p>
                    </div>
                    <button onClick={() => setReplyTo(null)} className="p-1 rounded-lg hover:bg-muted/60">
                      <X className="h-3.5 w-3.5 text-muted-foreground/40" />
                    </button>
                  </div>
                )}

                <div className="flex items-end gap-2 bg-card border border-border/40 rounded-2xl px-3 py-2 focus-within:border-emerald-500/30 transition-all">
                  {/* File upload */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="h-8 w-8 shrink-0 rounded-xl hover:bg-muted/60 flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground transition-colors mb-0.5"
                  >
                    {uploadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />

                  {/* Textarea */}
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                    }}
                    placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                    rows={1}
                    className="flex-1 resize-none bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/25 max-h-32 min-h-[32px] py-1"
                    style={{ lineHeight: '1.5' }}
                  />

                  {/* Send */}
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isSending}
                    className={cn(
                      'h-8 w-8 shrink-0 rounded-xl flex items-center justify-center transition-all mb-0.5',
                      input.trim()
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                        : 'bg-muted/30 text-muted-foreground/20 cursor-not-allowed'
                    )}
                  >
                    {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* New conversation modal */}
      {showNewConv && (
        <NewConversationModal
          users={allUsers}
          onClose={() => setShowNewConv(false)}
          onStartDM={handleStartDM}
          onCreateGroup={handleCreateGroup}
        />
      )}
    </div>
  );
}