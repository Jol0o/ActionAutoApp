"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Phone,
  Mail,
  FileText,
  Clock3,
  DollarSign,
  Plus,
  Save,
  History,
  AlertCircle,
  CheckCircle2,
  UserPlus,
} from "lucide-react"
import { CustomerRecord, InboundCall } from "./types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${String(s).padStart(2, "0")}s`
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CustomerInfoPanelProps {
  call: InboundCall | null
  customer: CustomerRecord | null
  isLoadingCustomer: boolean
  onSaveNotes?: (notes: string) => void
  onCreateLead?: (data: { name: string; phone: string; email?: string }) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CustomerInfoPanel({
  call,
  customer,
  isLoadingCustomer,
  onSaveNotes,
  onCreateLead,
}: CustomerInfoPanelProps) {
  const [notes, setNotes] = React.useState(customer?.internalNotes || "")
  const [showCreateLead, setShowCreateLead] = React.useState(false)
  const [newLeadForm, setNewLeadForm] = React.useState({ name: "", phone: "", email: "" })

  React.useEffect(() => {
    setNotes(customer?.internalNotes || "")
  }, [customer])

  React.useEffect(() => {
    if (call) {
      setNewLeadForm((p) => ({ ...p, phone: call.callerNumber }))
    }
  }, [call])

  const accountStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
    active: {
      label: "Active",
      color: "text-emerald-700 dark:text-emerald-300",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    inactive: {
      label: "Inactive",
      color: "text-muted-foreground/60",
      bg: "bg-muted/30 border-border/50",
    },
    new: {
      label: "New Customer",
      color: "text-blue-700 dark:text-blue-300",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
  }

  // ── No active call ──
  if (!call) {
    return (
      <div className="flex flex-col rounded-2xl border border-border/50 bg-card overflow-hidden h-full">
        <div className="px-4 py-3 border-b border-border/50">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
            Customer Info
          </p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
          <div className="h-14 w-14 rounded-2xl border-2 border-dashed border-border/30 flex items-center justify-center">
            <User className="h-6 w-6 text-muted-foreground/15" />
          </div>
          <p className="text-xs text-muted-foreground/40">No caller connected</p>
        </div>
      </div>
    )
  }

  // ── Loading ──
  if (isLoadingCustomer) {
    return (
      <div className="flex flex-col rounded-2xl border border-border/50 bg-card overflow-hidden h-full">
        <div className="px-4 py-3 border-b border-border/50">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
            Customer Info
          </p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
          <div className="h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground/40">Looking up caller…</p>
        </div>
      </div>
    )
  }

  // ── Unknown caller – lead creation ──
  if (!customer) {
    return (
      <div className="flex flex-col rounded-2xl border border-border/50 bg-card overflow-hidden h-full">
        <div className="px-4 py-3 border-b border-border/50">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
            Customer Info
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                Unknown Caller
              </p>
              <p className="text-[11px] text-amber-600/70 dark:text-amber-400/70 mt-0.5">
                No CRM record found for{" "}
                <span className="font-mono font-semibold">{call.callerNumber}</span>
              </p>
            </div>
          </div>

          {!showCreateLead ? (
            <Button
              onClick={() => setShowCreateLead(true)}
              variant="outline"
              className="w-full h-10 text-xs gap-2 rounded-xl border-dashed border-border/60"
            >
              <UserPlus className="h-4 w-4 text-emerald-600" />
              Create New Lead
            </Button>
          ) : (
            <div className="space-y-3 rounded-xl border border-border/50 p-4 bg-muted/10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
                Quick Lead Creation
              </p>
              <div>
                <Label className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/40">
                  Name *
                </Label>
                <Input
                  value={newLeadForm.name}
                  onChange={(e) => setNewLeadForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Caller name"
                  className="mt-1 rounded-xl border-border/50 text-sm h-9"
                />
              </div>
              <div>
                <Label className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/40">
                  Phone
                </Label>
                <Input
                  value={newLeadForm.phone}
                  onChange={(e) => setNewLeadForm((p) => ({ ...p, phone: e.target.value }))}
                  className="mt-1 rounded-xl border-border/50 text-sm h-9 font-mono"
                />
              </div>
              <div>
                <Label className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/40">
                  Email
                </Label>
                <Input
                  value={newLeadForm.email}
                  onChange={(e) => setNewLeadForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="Optional"
                  className="mt-1 rounded-xl border-border/50 text-sm h-9"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateLead(false)}
                  className="rounded-lg text-xs flex-1"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!newLeadForm.name.trim()}
                  onClick={() => {
                    onCreateLead?.({
                      name: newLeadForm.name,
                      phone: newLeadForm.phone,
                      email: newLeadForm.email || undefined,
                    })
                    setShowCreateLead(false)
                    setNewLeadForm({ name: "", phone: "", email: "" })
                  }}
                  className="rounded-lg text-xs flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Create Lead
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Known customer ──
  const acctCfg = accountStatusConfig[customer.accountStatus] || accountStatusConfig.active

  return (
    <div className="flex flex-col rounded-2xl border border-border/50 bg-card overflow-hidden h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
          Customer Info
        </p>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-semibold ${acctCfg.bg} ${acctCfg.color}`}
        >
          <CheckCircle2 className="h-2.5 w-2.5" />
          {acctCfg.label}
        </span>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Identity */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {customer.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{customer.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {customer.email && (
                <span className="text-[10px] text-muted-foreground/50 truncate flex items-center gap-1">
                  <Mail className="h-2.5 w-2.5" /> {customer.email}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Contact details */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/40 font-medium">
              Phone
            </p>
            <p className="text-xs font-semibold font-mono mt-0.5">{customer.phone}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/40 font-medium">
              Account ID
            </p>
            <p className="text-xs font-semibold font-mono mt-0.5">{customer.id}</p>
          </div>
        </div>

        <Separator className="opacity-30" />

        {/* Recent transactions */}
        {customer.recentTransactions && customer.recentTransactions.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <DollarSign className="h-3 w-3 text-muted-foreground/40" />
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
                Recent Transactions
              </p>
            </div>
            <div className="space-y-1.5">
              {customer.recentTransactions.slice(0, 4).map((tx, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/20 border border-border/30"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium truncate">{tx.description}</p>
                    <p className="text-[9px] text-muted-foreground/40">{tx.date}</p>
                  </div>
                  <p className="text-xs font-bold shrink-0 ml-2">{tx.amount}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Previous call history */}
        {customer.previousCalls && customer.previousCalls.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <History className="h-3 w-3 text-muted-foreground/40" />
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
                Call History
              </p>
            </div>
            <div className="space-y-1.5">
              {customer.previousCalls.slice(0, 5).map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/20 border border-border/30"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium">{c.date}</p>
                    {c.notes && (
                      <p className="text-[9px] text-muted-foreground/40 truncate">{c.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <Clock3 className="h-2.5 w-2.5 text-muted-foreground/40" />
                    <span className="text-[10px] font-medium text-muted-foreground/60">
                      {formatDuration(c.duration)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator className="opacity-30" />

        {/* Internal notes */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <FileText className="h-3 w-3 text-muted-foreground/40" />
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
              Call Notes
            </p>
          </div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes for this call…"
            rows={3}
            className="text-sm resize-none rounded-xl border-border/50 bg-muted/20 focus-visible:ring-emerald-500/30"
          />
          <Button
            onClick={() => onSaveNotes?.(notes)}
            size="sm"
            variant="outline"
            className="mt-2 h-7 text-[10px] gap-1 rounded-lg"
          >
            <Save className="h-3 w-3" />
            Save Notes
          </Button>
        </div>
      </div>
    </div>
  )
}