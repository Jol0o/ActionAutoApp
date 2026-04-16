"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GlassCard } from "@/components/ui/GlassCard"
import { Search, MapPin, CheckCircle2, Zap, Phone, ShieldCheck, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

const MOCK_NUMBERS = [
  "(801) 420-1337",
  "(801) 222-9012",
  "(385) 900-1122",
  "(801) 777-8899",
  "(385) 123-4567",
  "(801) 999-0000",
]

export function NumberProvisioningGala({ onComplete }: { onComplete: (num: string) => void }) {
  const [step, setStep] = React.useState<"scanning" | "select" | "confirm">("scanning")
  const [selected, setSelected] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (step === "scanning") {
      const timer = setTimeout(() => setStep("select"), 3000)
      return () => clearTimeout(timer)
    }
  }, [step])

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 overflow-hidden text-white">
      <AnimatePresence mode="wait">
        {step === "scanning" && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center gap-8"
          >
            <div className="relative">
              <div className="size-48 rounded-full border border-primary/20 flex items-center justify-center">
                 <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-t-2 border-primary shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                 />
                 <Search className="size-16 text-primary/40 animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tighter italic animate-pulse">Scanning Utah Area Codes...</h2>
              <p className="text-sm text-white/30 font-bold uppercase tracking-widest leading-relaxed">Localizing Virtual Identities For Your Dealership</p>
            </div>
          </motion.div>
        )}

        {step === "select" && (
          <motion.div
            key="select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-4xl space-y-8"
          >
            <div className="text-center space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Identity Selection</span>
                <h2 className="text-4xl font-black tracking-tighter uppercase italic">Choose Your Voice</h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
               {MOCK_NUMBERS.map((num, i) => (
                 <motion.div
                    key={num}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                 >
                    <GlassCard 
                        onClick={() => setSelected(num)}
                        className={cn(
                            "p-6 cursor-pointer border-white/5 bg-white/5 hover:bg-white/10 transition-all group relative",
                            selected === num ? "border-primary bg-primary/10 shadow-[0_0_30px_rgba(34,197,94,0.2)]" : ""
                        )}
                    >
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <Phone className={cn("size-6", selected === num ? "text-primary" : "text-white/20")} />
                                {selected === num && <ShieldCheck className="size-5 text-primary animate-in zoom-in" />}
                            </div>
                            <span className={cn(
                                "text-2xl font-black tracking-tighter",
                                selected === num ? "text-white" : "text-white/60 group-hover:text-white"
                            )}>
                                {num}
                            </span>
                            <div className="flex items-center gap-2">
                                <MapPin className="size-3 text-white/20" />
                                <span className="text-[10px] uppercase font-black tracking-widest text-white/20">Lehi, UT</span>
                            </div>
                        </div>
                    </GlassCard>
                 </motion.div>
               ))}
            </div>

            <div className="flex justify-center pt-8">
                <Button 
                    disabled={!selected}
                    onClick={() => setStep("confirm")}
                    className="h-14 px-12 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-2xl shadow-primary/40 group overflow-hidden relative"
                >
                    <span className="relative z-10 flex items-center gap-3">
                        Adopt This Identity <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <motion.div 
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-white/20 -skew-x-12"
                    />
                </Button>
            </div>
          </motion.div>
        )}

        {step === "confirm" && (
            <motion.div
                key="confirm"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8"
            >
                <div className="size-32 rounded-full bg-primary/20 flex items-center justify-center mx-auto relative">
                    <CheckCircle2 className="size-16 text-primary" />
                    <motion.div 
                        initial={{ scale: 0.5, opacity: 1 }}
                        animate={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="absolute inset-0 rounded-full border-2 border-primary"
                    />
                </div>
                <div className="space-y-2">
                    <h2 className="text-5xl font-black tracking-tighter italic uppercase">Provisioning Success</h2>
                    <p className="text-xl font-bold text-white/50">{selected} is now your dealership's official line.</p>
                </div>
                <Button 
                    onClick={() => onComplete(selected!)}
                    className="h-14 px-12 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:bg-slate-200"
                >
                    Enter CRM Pro
                </Button>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
