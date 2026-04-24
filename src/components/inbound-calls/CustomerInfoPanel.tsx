"use client"

import * as React from "react"
import {
  User,
  Mail,
  Phone,
  FileText,
  Clock,
  DollarSign,
  History,
  AlertTriangle,
  CheckCircle,
  UserPlus,
  Plus,
  Save,
  X,
} from "lucide-react"
import { CustomerRecord, InboundCall, OutboundCall } from "./types"

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${String(s).padStart(2, "0")}s`
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
}

interface CustomerInfoPanelProps {
  call: (InboundCall | OutboundCall) | null
  callerNumber?: string
  customer: CustomerRecord | null
  isLoadingCustomer: boolean
  onSaveNotes?: (notes: string) => void
  onCreateLead?: (data: { name: string; phone: string; email?: string }) => void
}

export function CustomerInfoPanel({
  call,
  callerNumber,
  customer,
  isLoadingCustomer,
  onSaveNotes,
  onCreateLead,
}: CustomerInfoPanelProps) {
  const [notes, setNotes] = React.useState("")
  const [showLead, setShowLead] = React.useState(false)
  const [leadForm, setLeadForm] = React.useState({ name: "", phone: "", email: "" })

  React.useEffect(() => { setNotes(customer?.internalNotes || "") }, [customer])
  React.useEffect(() => {
    const num = callerNumber || ""
    if (num) setLeadForm((p) => ({ ...p, phone: num }))
  }, [callerNumber])

  const statusConfig = {
    active: { label: "Active", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", dot: "bg-emerald-400" },
    inactive: { label: "Inactive", color: "text-zinc-500", bg: "bg-zinc-800", border: "border-zinc-700", dot: "bg-zinc-600" },
    new: { label: "New", color: "text-sky-400", bg: "bg-sky-400/10", border: "border-sky-400/20", dot: "bg-sky-400" },
  }

  if (!call) {
    return (
      <div className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden h-full">
        <div className="px-4 py-3 border-b border-zinc-800">
          <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-500">Customer</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
          <div className="h-12 w-12 rounded-xl border border-dashed border-zinc-800 flex items-center justify-center">
            <User className="h-5 w-5 text-zinc-700" />
          </div>
          <p className="text-xs text-zinc-600">No caller connected</p>
        </div>
      </div>
    )
  }

  if (isLoadingCustomer) {
    return (
      <div className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden h-full">
        <div className="px-4 py-3 border-b border-zinc-800">
          <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-500">Customer</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="h-5 w-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-600">Looking up caller...</p>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden h-full">
        <div className="px-4 py-3 border-b border-zinc-800">
          <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-500">Customer</span>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-400/5 border border-amber-400/15">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-400">Unknown Caller</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                No record found for <span className="font-mono text-zinc-400">{callerNumber}</span>
              </p>
            </div>
          </div>

          {!showLead ? (
            <button
              onClick={() => setShowLead(true)}
              className="w-full h-9 flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 text-xs font-medium transition-all"
            >
              <UserPlus className="h-3.5 w-3.5" /> Create Lead
            </button>
          ) : (
            <div className="space-y-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">New Lead</p>
                <button onClick={() => setShowLead(false)} className="text-zinc-600 hover:text-zinc-400">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {[
                { key: "name", label: "Name *", placeholder: "Full name", type: "text" },
                { key: "phone", label: "Phone", placeholder: "", type: "tel" },
                { key: "email", label: "Email", placeholder: "Optional", type: "email" },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="text-[9px] uppercase tracking-widest text-zinc-600 font-medium block mb-1">{label}</label>
                  <input
                    type={type}
                    value={(leadForm as any)[key]}
                    onChange={(e) => setLeadForm((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder || undefined}
                    className="w-full h-8 px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-mono placeholder:text-zinc-700 outline-none focus:border-violet-500/50 transition-colors"
                  />
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowLead(false)}
                  className="flex-1 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-medium hover:bg-zinc-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  disabled={!leadForm.name.trim()}
                  onClick={() => {
                    onCreateLead?.({ name: leadForm.name, phone: leadForm.phone, email: leadForm.email || undefined })
                    setShowLead(false)
                    setLeadForm({ name: "", phone: "", email: "" })
                  }}
                  className="flex-1 h-8 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-3 w-3" /> Create
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const sc = statusConfig[customer.accountStatus] || statusConfig.active

  return (
    <div className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden h-full">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-500">Customer</span>
        <span className={`flex items-center gap-1.5 text-[9px] font-semibold px-2 py-0.5 rounded-full border ${sc.bg} ${sc.border} ${sc.color}`}>
          <span className={`h-1 w-1 rounded-full ${sc.dot}`} /> {sc.label}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Identity */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {getInitials(customer.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-zinc-100 truncate">{customer.name}</p>
            {customer.email && (
              <p className="text-[10px] text-zinc-500 truncate mt-0.5 flex items-center gap-1">
                <Mail className="h-2.5 w-2.5" /> {customer.email}
              </p>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
            <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-medium">Phone</p>
            <p className="text-xs font-mono text-zinc-300 mt-0.5 truncate">{customer.phone}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
            <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-medium">Account</p>
            <p className="text-xs font-mono text-zinc-300 mt-0.5 truncate">{customer.id}</p>
          </div>
        </div>

        {/* Transactions */}
        {customer.recentTransactions && customer.recentTransactions.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <DollarSign className="h-3 w-3 text-zinc-600" />
              <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-medium">Transactions</p>
            </div>
            <div className="space-y-1">
              {customer.recentTransactions.slice(0, 3).map((tx, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-800/40 border border-zinc-700/30">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-zinc-300 truncate">{tx.description}</p>
                    <p className="text-[9px] text-zinc-600">{tx.date}</p>
                  </div>
                  <p className="text-xs font-bold text-zinc-200 shrink-0 ml-2">{tx.amount}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Call history */}
        {customer.previousCalls && customer.previousCalls.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <History className="h-3 w-3 text-zinc-600" />
              <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-medium">Call History</p>
            </div>
            <div className="space-y-1">
              {customer.previousCalls.slice(0, 4).map((c, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-800/40 border border-zinc-700/30">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-zinc-300">{c.date}</p>
                    {c.notes && <p className="text-[9px] text-zinc-600 truncate">{c.notes}</p>}
                  </div>
                  <p className="text-[10px] font-mono text-zinc-500 shrink-0 ml-2">{formatDuration(c.duration)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <FileText className="h-3 w-3 text-zinc-600" />
            <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-medium">Notes</p>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes for this call..."
            rows={3}
            className="w-full px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-xs text-zinc-300 placeholder:text-zinc-700 outline-none focus:border-violet-500/50 resize-none transition-colors"
          />
          <button
            onClick={() => onSaveNotes?.(notes)}
            className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-[10px] font-medium transition-all"
          >
            <Save className="h-3 w-3" /> Save Notes
          </button>
        </div>
      </div>
    </div>
  )
}