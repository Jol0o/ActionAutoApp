"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface IPhoneBubbleProps {
  content: string
  isOwn: boolean
  timestamp?: Date
  status?: "sent" | "delivered" | "read" | "failed"
  className?: string
}

const IPhoneBubble = ({
  content,
  isOwn,
  timestamp,
  status,
  className
}: IPhoneBubbleProps) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 10, x: isOwn ? 10 : -10 }}
      animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
        mass: 0.8
      }}
      className={cn(
        "flex w-full mb-1 px-4 group",
        isOwn ? "justify-end" : "justify-start",
        className
      )}
    >
      <div className={cn(
        "relative max-w-[80%] px-4 py-3 transition-all duration-300",
        isOwn
          ? "bg-primary text-primary-foreground rounded-[22px] rounded-br-[6px] shadow-lg shadow-primary/20"
          : "bg-muted text-foreground rounded-[22px] rounded-bl-[6px] backdrop-blur-xl border border-border shadow-md"
      )}>
        <p className="text-[15px] leading-[1.4] font-medium tracking-[-0.01em] whitespace-pre-wrap">
          {content}
        </p>

        {timestamp && (
          <div className={cn(
            "mt-1.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
            isOwn ? "justify-end" : "justify-start"
          )}>
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export { IPhoneBubble }
