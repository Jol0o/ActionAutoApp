"use client"

import * as React from "react"
import { ShieldCheck, Info } from "lucide-react"
import { IPhoneBubble } from "@/components/ui/iPhoneBubble"
import { GlassCard } from "@/components/ui/GlassCard"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface SmsThreadViewProps {
  lead: any
  messages: any[]
  isTyping?: boolean
}

export function SmsThreadView({
  lead,
  messages,
  isTyping = false
}: SmsThreadViewProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background relative overflow-hidden transition-colors duration-500">
      {/* ── Ambient Background Depth ── */}

      {/* ── Thread Header ── */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-xl z-20 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="size-10 rounded-full bg-gradient-to-tr from-primary/80 to-primary/40 p-[2px] shadow-sm transition-transform group-hover:scale-105 duration-300">
               <div className="w-full h-full rounded-full bg-background flex items-center justify-center text-foreground font-black text-xs">
                  {lead.firstName?.[0]}{lead.lastName?.[0]}
               </div>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 size-3.5 bg-green-500 border-2 border-background rounded-full" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-[14px] font-black text-foreground leading-tight tracking-tight">
              {lead.firstName} {lead.lastName}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-[0.1em] text-primary flex items-center gap-1">
                <ShieldCheck className="size-2.5" /> Verified SMS
              </span>
              <span className="text-muted-foreground/30 select-none">•</span>
              <span className="text-[9px] font-bold text-muted-foreground tracking-wider">
                {lead.phone}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50 border border-border">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">ID</span>
              <span className="text-[9px] font-bold text-foreground/50">#{lead._id?.slice(-4)}</span>
           </div>
        </div>
      </div>

      {/* ── Message Stream ── */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-8 space-y-3 scrollbar-hide relative z-10 custom-scrollbar"
      >
        {/* Compliance Notice */}
        <div className="flex justify-center mb-8 px-10">
            <GlassCard className="px-4 py-2 border-primary/20 bg-primary/5 backdrop-blur-md flex items-center gap-2 rounded-full shadow-sm">
                <Info className="size-3 text-primary" />
                <span className="text-[9px] font-bold text-muted-foreground/80 tracking-tight">
                    TCPA Compliant • Opted-in via Website
                </span>
            </GlassCard>
        </div>

        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <IPhoneBubble
              key={msg.id || idx}
              content={msg.body || msg.content || msg.text || ""}
              isOwn={msg.direction === 'outbound' || msg.isOwn}
              timestamp={new Date(msg.createdAt || msg.timestamp || Date.now())}
              status={msg.status}
            />
          ))}

          {isTyping && (
            <motion.div
                initial={{ opacity: 0, scale: 0.9, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: -10 }}
                className="flex px-6 py-2"
            >
                <div className="bg-muted/50 backdrop-blur-xl border border-border px-3 py-2 rounded-[18px] rounded-tl-[4px] flex gap-1 items-center shadow-sm">
                    <span className="size-1.5 bg-primary/40 rounded-full animate-bounce" />
                    <span className="size-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="size-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
