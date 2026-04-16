"use client"

import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

interface GlassCardProps extends HTMLMotionProps<"div"> {
  gradient?: boolean
  intensity?: "low" | "medium" | "high"
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, gradient = false, intensity = "medium", children, ...props }, ref) => {
    const intensityMap = {
      low: "backdrop-blur-md bg-white/5 border-white/5",
      medium: "backdrop-blur-xl bg-white/10 border-white/10",
      high: "backdrop-blur-2xl bg-white/20 border-white/20",
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={cn(
          "relative overflow-hidden rounded-3xl border shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]",
          intensityMap[intensity],
          gradient && "bg-gradient-to-br from-white/10 to-transparent",
          className
        )}
        {...props}
      >
        {/* Subtle Inner Glow */}
        <div className="absolute inset-0 pointer-events-none rounded-3xl ring-1 ring-inset ring-white/10" />
        {children}
      </motion.div>
    )
  }
)

GlassCard.displayName = "GlassCard"

export { GlassCard }
