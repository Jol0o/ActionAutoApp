import * as React from "react"
import { Search, Inbox } from "lucide-react"
import { Avatar } from "./atomic/Avatar"
import { ChannelBadge } from "./atomic/ChannelBadge"
import { StatusPill, STATUS_CONFIG } from "./atomic/StatusPill"
import { Pagination } from "./atomic/Pagination"
import { fmtShort } from "@/lib/lead-utils"
import { SupraLeoReadButton } from "@/components/supra-leo-ai/SupraLeoReadButton"

interface LeadsListProps {
  leads: any[]
  isLoading: boolean
  total: number
  pages: number
  currentPage: number
  selectedLeadId?: string
  searchQuery: string
  onSearchChange: (q: string) => void
  onPageChange: (p: number) => void
  onLeadSelect: (lead: any) => void
  highlightedLeadIds: Set<string>
  itemsPerPage: number
  sourceEmail: string
  markAsRead: (id: string) => void
}

export const LeadsList = React.memo(({
  leads,
  isLoading,
  total,
  pages,
  currentPage,
  selectedLeadId,
  searchQuery,
  onSearchChange,
  onPageChange,
  onLeadSelect,
  highlightedLeadIds,
  itemsPerPage,
  sourceEmail,
  markAsRead
}: LeadsListProps) => {
  const listRef = React.useRef<HTMLDivElement>(null)

  return (
    <div className={`flex flex-col bg-card border-r border-border shrink-0 w-[320px] xl:w-[360px] shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 ${selectedLeadId ? 'hidden lg:flex' : 'flex'}`}>
      
      {/* Search bar */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
          <input
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search by name, email, vehicle…"
            className="w-full pl-9 pr-3 h-8 rounded-lg bg-background border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-emerald-600/50 transition-colors"
          />
        </div>
      </div>

      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0">
        <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">Conversations</span>
        {!isLoading && leads.length > 0 && (
          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
            {total}
          </span>
        )}
      </div>

      {/* ── SCROLLABLE LIST ── */}
      <div ref={listRef} className="flex-1 overflow-y-auto min-h-0 space-y-2">
        {isLoading ? (
          <div className="flex flex-col p-4 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-20 w-full rounded-2xl bg-muted/40 animate-pulse border border-border/40" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-20 px-6 text-center">
            <div className="h-14 w-14 rounded-2xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center">
              <Inbox className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">No leads found</p>
            <p className="text-[10px] text-muted-foreground/40 font-mono">{sourceEmail}</p>
          </div>
        ) : (
          leads.map((lead: any) => {
            const sel = selectedLeadId === lead._id
            const sc = STATUS_CONFIG[lead.status]
            const isHighlighted = highlightedLeadIds.has(lead._id)

            return (
              <div 
                key={lead._id} 
                id={`lead-${lead._id}`} 
                onClick={() => { onLeadSelect(lead); if (!lead.isRead) markAsRead(lead._id); }}
                className={`group relative overflow-hidden p-3 rounded-2xl border cursor-pointer transition-all duration-300 mx-2 ${
                  sel ? 'border-emerald-500/50 bg-emerald-500/10 shadow-md ring-2 ring-emerald-500/10 scale-[1.01] z-10' :
                  isHighlighted ? 'border-emerald-500 bg-emerald-500/20 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500 animate-pulse' :
                  'border-border bg-card hover:border-emerald-500/40 hover:shadow-md hover:scale-[1.005]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar first={lead.firstName} last={lead.lastName} size="md" />
                    {!lead.isRead && (
                      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#060a07]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className={`text-sm font-semibold truncate leading-tight ${lead.isRead ? 'text-muted-foreground/70' : 'text-foreground'}`}>
                        {lead.firstName} {lead.lastName}
                      </p>
                      <span className="text-[10px] text-muted-foreground/50 shrink-0 tabular-nums">{fmtShort(new Date(lead.createdAt))}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground/50 truncate mb-1">{lead.email}</p>
                    <p className={`text-xs truncate leading-snug ${lead.isRead ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>
                      {lead.subject || '(No subject)'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-2.5 ml-12">
                  <ChannelBadge channel={lead.channel} />
                  <StatusPill status={lead.status} />
                  {lead._n > 1 && (
                    <span className="text-[9px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded-full">
                      +{lead._n - 1}
                    </span>
                  )}
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <SupraLeoReadButton lead={lead} size="sm" />
                  </div>
                </div>
                {sel && <div className="absolute inset-y-0 left-0 w-0.5 bg-emerald-400 rounded-r" />}
              </div>
            )
          })
        )}
      </div>

      <Pagination 
        currentPage={currentPage} 
        totalPages={pages} 
        totalItems={total}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange} 
      />
    </div>
  )
})

LeadsList.displayName = "LeadsList"
