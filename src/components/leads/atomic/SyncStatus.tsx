import * as React from "react"
import { fmtTime } from "@/lib/lead-utils"

interface SyncStatusProps {
  connected: boolean
  email: string
  sourceEmail: string
  lastSyncTime: Date | null
  statusLoaded: boolean
}

export const SyncStatus = React.memo(({ 
  connected, 
  email, 
  sourceEmail, 
  lastSyncTime,
  statusLoaded 
}: SyncStatusProps) => {
  if (!statusLoaded) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-amber-500/60">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500/60 animate-pulse" />
        Checking sync status…
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-amber-500/60">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500/60" />
        Centralized ingestion not configured
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Live sync
      </span>
      <span className="text-[#2e4a38]">·</span>
      <span className="text-muted-foreground">{email}</span>
      <span className="text-[#2e4a38]">·</span>
      <span className="font-mono text-muted-foreground/70 text-[10px]">{sourceEmail}</span>
      {lastSyncTime && (
        <>
          <span className="text-[#2e4a38]">·</span>
          <span className="text-slate-600">Last checked: {fmtTime(lastSyncTime)}</span>
        </>
      )}
    </div>
  )
})

SyncStatus.displayName = "SyncStatus"
