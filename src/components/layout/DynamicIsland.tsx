"use client"

import * as React from "react"
import { DynamicIslandBase } from "@/components/ui/DynamicIslandBase"
import { CreditCard, CheckCircle2, AlertCircle, Zap } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function DynamicIsland() {
  const [state, setState] = React.useState<"idle" | "success" | "warning">("idle")
  const [credits, setCredits] = React.useState(50.00)
  const [isExpanded, setIsExpanded] = React.useState(false)

  // Simulation: Trigger success state
  const triggerSuccess = () => {
    setState("success")
    setTimeout(() => setState("idle"), 3000)
  }

  return (
    <div 
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className="cursor-pointer"
      onClick={triggerSuccess}
    >
      <DynamicIslandBase isExpanded={isExpanded} className={state === "warning" ? "border-red-500/50" : ""}>
        <AnimatePresence mode="wait">
          {state === "idle" && (
            <motion.div 
              key="idle"
              className="flex items-center gap-3"
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -5, opacity: 0 }}
            >
              <Zap className="size-4 text-primary fill-primary" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/50 leading-none">Credits</span>
                <span className="text-sm font-black tracking-tight text-white">${credits.toFixed(2)}</span>
              </div>
              {isExpanded && (
                <motion.div 
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  className="pl-4 border-l border-white/10 ml-2"
                >
                  <span className="text-[10px] font-bold text-primary uppercase whitespace-nowrap">Click to Top-up</span>
                </motion.div>
              )}
            </motion.div>
          )}

          {state === "success" && (
            <motion.div 
              key="success"
              className="flex items-center gap-2"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <CheckCircle2 className="size-5 text-green-500" />
              <span className="text-xs font-black uppercase tracking-widest">Message Sent!</span>
            </motion.div>
          )}

          {state === "warning" && (
            <motion.div 
              key="warning"
              className="flex items-center gap-2"
              initial={{ x: [-2, 2, -2, 2, 0] }}
            >
              <AlertCircle className="size-5 text-red-500 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest text-red-500">Low Balance</span>
            </motion.div>
          )}
        </AnimatePresence>
      </DynamicIslandBase>
    </div>
  )
}
