import * as React from "react"
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react"
import { fmtTime } from "@/lib/lead-utils"

export interface Toast { 
  id: string
  type: 'success' | 'error' | 'info'
  message: string
  ts: Date 
}

interface ToastStackProps {
  toasts: Toast[]
  dismiss: (id: string) => void
}

export const ToastStack = React.memo(({ toasts, dismiss }: ToastStackProps) => {
  const V = {
    success: { cls: 'border-emerald-500/40 bg-[#0c2016]', icon: <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> },
    error: { cls: 'border-rose-500/40 bg-[#200c10]', icon: <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" /> },
    info: { cls: 'border-sky-500/40 bg-[#0c1620]', icon: <Info className="h-4 w-4 text-sky-400 shrink-0" /> },
  }

  return (
    <div className="fixed top-5 right-5 z-50 space-y-2 max-w-sm pointer-events-none">
      {toasts.map(t => {
        const v = V[t.type]
        return (
          <div key={t.id} className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl border animate-in slide-in-from-top-3 duration-200 ${v.cls}`}>
            {v.icon}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-100 leading-snug">{t.message}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{fmtTime(t.ts)}</p>
            </div>
            <button onClick={() => dismiss(t.id)} className="text-slate-600 hover:text-slate-300 transition-colors mt-0.5">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
})

ToastStack.displayName = "ToastStack"
