"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface DynamicIslandBaseProps {
  children: React.ReactNode
  className?: string
  isExpanded?: boolean
}

const DynamicIslandBase = ({
  children,
  className,
  isExpanded = false
}: DynamicIslandBaseProps) => {
  return (
    <motion.div
      layout
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
        mass: 1
      }}
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-[100]",
        "bg-black text-white shadow-2xl",
        "flex items-center justify-center transition-all duration-500",
        "border border-white/10 backdrop-blur-3xl",
        isExpanded 
          ? "rounded-[2rem] px-6 py-4 min-w-[300px]" 
          : "rounded-full px-4 py-2 min-w-[120px]",
        className
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isExpanded ? "expanded" : "collapsed"}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="w-full h-full flex items-center justify-center"
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Subtle Glow Effect */}
      <div className="absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/20 pointer-events-none" />
    </motion.div>
  )
}

export { DynamicIslandBase }
