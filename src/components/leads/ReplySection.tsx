import * as React from "react"
import { Send, Circle, ChevronDown, Calendar, XCircle, Lock, LockOpen, Truck } from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { STATUS_CONFIG } from "./atomic/StatusPill"

interface ReplySectionProps {
  isClosed: boolean
  replyMessage: string
  setReplyMessage: (msg: string) => void
  onSend: () => void
  isSending: boolean
  onStatusChange: (status: string) => void
  onApptOpen: () => void
  onReopen: () => void
  onQuoteShipping: () => void
  selectedLeadStatus: string
}

export const ReplySection = React.memo(({
  isClosed,
  replyMessage,
  setReplyMessage,
  onSend,
  isSending,
  onStatusChange,
  onApptOpen,
  onReopen,
  onQuoteShipping,
  selectedLeadStatus
}: ReplySectionProps) => {
  
  if (isClosed) {
    return (
      <div className="border-t border-border/40 px-5 py-3.5 flex items-center justify-between bg-background shrink-0">
        <div className="flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-slate-700" />
          <span className="text-xs text-slate-600">This inquiry is closed</span>
        </div>
        <button
          onClick={onReopen}
          className="flex items-center gap-1.5 px-3 h-7 rounded-lg text-xs text-slate-500 hover:text-slate-200 border border-[#0d1f15] hover:border-emerald-800/50 hover:bg-[#070e09] transition-all"
        >
          <LockOpen className="h-3 w-3" /> Reopen
        </button>
      </div>
    )
  }

  return (
    <div className="border-t border-border/40 bg-background px-5 py-4 shrink-0">
      <div className="rounded-xl border border-border/40 bg-card overflow-hidden focus-within:border-emerald-600/60 focus-within:ring-1 focus-within:ring-emerald-900/40 transition-all">
        <textarea
          value={replyMessage}
          onChange={e => setReplyMessage(e.target.value)}
          placeholder="Write a reply…"
          rows={5}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onSend() } }}
          className="w-full px-4 pt-4 pb-2 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground/60 resize-none outline-none leading-relaxed"
        />
        <div className="flex items-center justify-between px-3 py-2.5 border-t border-[#0d1f15]">
          <div className="flex items-center gap-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-2.5 h-7 rounded-lg text-[11px] font-medium text-slate-600 hover:text-slate-200 hover:bg-[#0d1f15] transition-all">
                  <Circle className="h-3 w-3" /> Status <ChevronDown className="h-2.5 w-2.5 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#050a06] border border-[#0d1f15] rounded-xl shadow-2xl shadow-black/80 p-1">
                {Object.entries(STATUS_CONFIG)
                  .filter(([s]) => s !== selectedLeadStatus && s !== 'Inbound Calls')
                  .map(([s, c]) => (
                    <DropdownMenuItem key={s} onClick={() => onStatusChange(s)}
                      className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-100 rounded-lg cursor-pointer focus:bg-[#0d1f15] focus:text-slate-100 px-2 py-1.5">
                      <span className={`h-2 w-2 rounded-full ${c.dot} shrink-0`} />{c.label}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <button onClick={onApptOpen}
              className="flex items-center gap-1 px-2.5 h-7 rounded-lg text-[11px] font-medium text-slate-600 hover:text-slate-200 hover:bg-[#0d1f15] transition-all">
              <Calendar className="h-3 w-3" /> Schedule
            </button>
            <button onClick={onQuoteShipping}
              className="flex items-center gap-1 px-2.5 h-7 rounded-lg text-[11px] font-medium text-slate-600 hover:text-slate-200 hover:bg-[#0d1f15] transition-all">
              <Truck className="h-3 w-3" /> Quote Shipping
            </button>
            <button onClick={() => onStatusChange('Closed')}
              className="flex items-center gap-1 px-2.5 h-7 rounded-lg text-[11px] font-medium text-rose-700/70 hover:text-rose-400 hover:bg-rose-500/5 transition-all">
              <XCircle className="h-3 w-3" /> Close
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-700 hidden sm:block">⌘↵</span>
            <button
              onClick={onSend}
              disabled={isSending || !replyMessage.trim()}
              className="flex items-center gap-1.5 px-4 h-8 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-black/30"
            >
              <Send className="h-3.5 w-3.5" />
              {isSending ? 'Sending…' : 'Send Reply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

ReplySection.displayName = "ReplySection"
