// ─── Inbound Calls – Shared Types ─────────────────────────────────────────────

export type AgentStatus = "available" | "on-call" | "break" | "offline"

export type BreakReason = "lunch" | "short-break" | "meeting" | "training"

export interface AgentInfo {
  name: string
  employeeId: string
  avatar?: string
  status: AgentStatus
  breakReason?: BreakReason
  /** ISO timestamp when the agent went live */
  liveAt?: string
}

export interface InboundCall {
  id: string
  callerNumber: string
  callerName?: string
  status: "ringing" | "connected" | "on-hold" | "ended"
  startedAt: string
  answeredAt?: string
  endedAt?: string
  duration?: number          // seconds
  isRecording?: boolean
  isMuted?: boolean
  /** Linked CRM lead id, if any */
  leadId?: string
  notes?: string
}

export interface QueuedCall {
  id: string
  callerNumber: string
  callerName?: string
  waitingSince: string       // ISO
  estimatedWait?: number     // seconds
  priority: "normal" | "high" | "vip"
}

export interface CallLogEntry {
  id: string
  callerNumber: string
  callerName?: string
  direction: "inbound" | "outbound"
  status: "answered" | "missed" | "voicemail"
  startedAt: string
  duration: number           // seconds
  notes?: string
}

export interface CustomerRecord {
  id: string
  name: string
  email?: string
  phone: string
  accountStatus: "active" | "inactive" | "new"
  recentTransactions?: { date: string; description: string; amount: string }[]
  previousCalls?: { date: string; duration: number; notes?: string }[]
  internalNotes?: string
}

// ─── Status config (mirrors the existing app palette) ────────────────────────

export const agentStatusConfig: Record<
  AgentStatus,
  { label: string; color: string; dot: string; bg: string }
> = {
  available: {
    label: "Available",
    color: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  "on-call": {
    label: "On Call",
    color: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500 animate-pulse",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  break: {
    label: "On Break",
    color: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  offline: {
    label: "Offline",
    color: "text-muted-foreground/60",
    dot: "bg-muted-foreground/40",
    bg: "bg-muted/30 border-border/50",
  },
}

export const breakReasonLabels: Record<BreakReason, string> = {
  lunch: "Lunch Break",
  "short-break": "Short Break",
  meeting: "In a Meeting",
  training: "Training",
}