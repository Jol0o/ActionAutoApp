"use client"

import * as React from "react"
import { Plus, Send, Smile, Paperclip, Calendar, MoreHorizontal, XCircle, MoreVertical } from "lucide-react"
import { GlassCard } from "@/components/ui/GlassCard"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface SmsReplySectionProps {
  message: string
  setMessage: (msg: string) => void
  onSend: () => void
  isSending: boolean
  onApptOpen: () => void
  onStatusChange: (status: string) => void
}

export function SmsReplySection({
  message,
  setMessage,
  onSend,
  isSending,
  onApptOpen,
  onStatusChange
}: SmsReplySectionProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="px-6 py-6 bg-black/40 backdrop-blur-xl border-t border-white/5 relative">
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-6 mb-4 z-50"
          >
            <GlassCard className="p-2 flex flex-col gap-1 min-w-[180px] shadow-2xl">
              <button
                onClick={() => { onApptOpen(); setIsMenuOpen(false) }}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-sm font-semibold text-foreground"
              >
                <Calendar className="size-4 text-primary" /> Schedule
              </button>
              <button
                onClick={() => { onStatusChange('Closed'); setIsMenuOpen(false) }}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-sm font-semibold text-rose-400"
              >
                <XCircle className="size-4" /> Close Lead
              </button>
              <div className="h-px bg-white/5 my-1" />
              <button className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-xs font-medium text-foreground/50">
                <MoreHorizontal className="size-4" /> More Actions
              </button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-3 max-w-5xl mx-auto">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={cn(
            "size-10 rounded-full flex items-center justify-center transition-all duration-300 shrink-0",
            isMenuOpen ? "bg-white/20 rotate-45" : "bg-white/5 hover:bg-white/10"
          )}
        >
          <Plus className="size-5 text-white" />
        </button>

        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="SMS Message..."
            rows={1}
            className="w-full bg-white/5 border border-white/10 rounded-[24px] px-5 py-3 text-[14.5px] text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white/10 transition-all resize-none max-h-[150px] scrollbar-hide"
            style={{ height: 'auto' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }}
          />
          <button className="absolute right-4 bottom-3 text-white/30 hover:text-white transition-colors">
            <Smile className="size-4" />
          </button>
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          disabled={!message.trim() || isSending}
          onClick={onSend}
          className={cn(
            "size-10 rounded-full flex items-center justify-center transition-all duration-500 shrink-0",
            message.trim() ? "bg-primary shadow-lg shadow-primary/40" : "bg-white/5 opacity-50 cursor-not-allowed"
          )}
        >
          <Send className={cn("size-5 text-white", isSending && "animate-pulse")} />
        </motion.button>
      </div>

      <div className="flex justify-center mt-3">
        <span className={cn(
          "text-[10px] font-black uppercase tracking-[0.2em]",
          message.length > 140 ? "text-amber-500" : "text-white/20"
        )}>
          {message.length} / 160
        </span>
      </div>
    </div>
  )
}
