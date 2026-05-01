import * as React from "react";
import { Phone, Mail, Clock3, Car, X, Calendar } from "lucide-react";
import { Avatar } from "./atomic/Avatar";
import { ChannelBadge } from "./atomic/ChannelBadge";
import { StatusPill } from "./atomic/StatusPill";
import { ParsedContent } from "./ParsedContent";
import { fmtFull } from "@/lib/lead-utils";
import { SupraLeoReadButton } from "@/components/supra-leo-ai/SupraLeoReadButton";
import { isAdfBody } from "@/lib/adf-parser";

interface ConversationViewProps {
  lead: any;
  threads: any[];
  onClose: () => void;
  sourceEmail: string;
}

export const ConversationView = React.memo(
  ({ lead, threads, onClose, sourceEmail }: ConversationViewProps) => {
    const msgRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (msgRef.current)
        msgRef.current.scrollTop = msgRef.current.scrollHeight;
    }, [threads, lead]);

    const vehicle = lead.vehicle;

    return (
      <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-slate-50/50 dark:bg-background">
        {/* ── Conversation header ── */}
        <div className="flex items-start justify-between gap-4 px-6 py-6 border-b border-border/40 bg-background shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar first={lead.firstName} last={lead.lastName} size="lg" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white truncate">
                  {lead.firstName} {lead.lastName}
                </h2>
                <ChannelBadge channel={lead.channel} />
                <StatusPill status={lead.status} />
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-[11px] text-slate-500">{lead.email}</span>
                {lead.phone && (
                  <span className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Phone className="h-2.5 w-2.5" />
                    {lead.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <SupraLeoReadButton lead={lead} size="md" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-700 hover:text-slate-300 hover:bg-[#1e3327] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Subject & meta strip ── */}
        <div className="px-6 py-3.5 border-b border-border/40 bg-card shrink-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <div className="flex items-center gap-1.5 text-[11px]">
              <Mail className="h-3 w-3 text-slate-700 shrink-0" />
              <span className="text-slate-300 font-medium text-[12px]">
                {lead.subject || "(No subject)"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
              <Clock3 className="h-3 w-3 shrink-0" />
              {fmtFull(new Date(lead.createdAt))}
            </div>
            {vehicle?.make && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] bg-black text-emerald-400 border border-emerald-800/60 font-medium">
                <Car className="h-2.5 w-2.5" />
                {[vehicle.year, vehicle.make, vehicle.model]
                  .filter(Boolean)
                  .join(" ")}
              </span>
            )}
            <span className="text-[10px] font-mono text-slate-700 ml-auto">
              via {sourceEmail}
            </span>
          </div>
          {lead.appointment && (
            <div className="mt-2 flex items-center gap-2 text-[11px] px-2.5 py-1.5 rounded-lg bg-violet-500/6 border border-violet-500/15 w-fit">
              <Calendar className="h-3 w-3 text-violet-400 shrink-0" />
              <span className="text-violet-300 font-medium">
                {new Date(lead.appointment.date).toLocaleDateString()} ·{" "}
                {lead.appointment.time}
                {lead.appointment.location && ` · ${lead.appointment.location}`}
              </span>
            </div>
          )}
        </div>

        {/* ── MESSAGE STREAM ── */}
        <div
          ref={msgRef}
          className="flex-1 overflow-y-auto min-h-0 px-10 py-10 space-y-10 bg-background scrollbar-dark"
        >
          {/* Original lead message */}
          <div className="flex items-start gap-3">
            <Avatar first={lead.firstName} last={lead.lastName} size="sm" />
            <div className="flex-1 max-w-2xl">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-[14px] font-bold text-white">
                  {lead.firstName} {lead.lastName}
                </span>
                <span className="text-xs text-slate-600">
                  {fmtFull(new Date(lead.createdAt))}
                </span>
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-border/40 bg-card px-7 py-6 shadow-2xl shadow-black/80 ring-1 ring-inset ring-white/[0.03]">
                <ParsedContent
                  content={lead.parsedContent}
                  rawBody={lead.body}
                />
              </div>
            </div>
          </div>

          {threads.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[#0f1f16]" />
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-900">
                {threads.length} repl{threads.length === 1 ? "y" : "ies"}
              </span>
              <div className="h-px flex-1 bg-[#1e3327]" />
            </div>
          )}

          {threads.map((msg: any) => {
            const msgBody = msg.message || msg.body || "";
            const msgIsAdf = !msg.isOwn && isAdfBody(msgBody);
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-4 ${msg.isOwn ? "flex-row-reverse" : ""}`}
              >
                {msg.isOwn ? (
                  <div className="h-8 w-8 rounded-full bg-emerald-700 border border-emerald-600/50 flex items-center justify-center text-emerald-200 text-[9px] font-bold shrink-0">
                    YOU
                  </div>
                ) : (
                  <Avatar first={msg.sender?.split(" ")[0]} size="sm" />
                )}
                <div
                  className={`flex flex-col ${msg.isOwn ? "items-end max-w-2xl" : msgIsAdf ? "flex-1 min-w-0" : "items-start max-w-2xl"}`}
                >
                  <div
                    className={`flex items-baseline gap-2 mb-2.5 ${msg.isOwn ? "flex-row-reverse" : ""}`}
                  >
                    <span className="text-[13px] font-semibold text-slate-200">
                      {msg.isOwn ? "You" : msg.sender}
                    </span>
                    <span className="text-[11px] text-slate-600">
                      {fmtFull(new Date(msg.timestamp))}
                    </span>
                  </div>
                  {msg.isOwn ? (
                    <div className="px-6 py-5 text-[15px] leading-relaxed shadow-xl shadow-black/60 rounded-2xl rounded-tr-sm bg-emerald-700 text-emerald-50 border border-emerald-600/40">
                      {msgBody}
                    </div>
                  ) : msgIsAdf ? (
                    <div className="w-full rounded-2xl rounded-tl-sm border border-border/40 bg-card px-7 py-6 shadow-2xl shadow-black/80 ring-1 ring-inset ring-white/[0.03]">
                      <ParsedContent rawBody={msgBody} />
                    </div>
                  ) : (
                    <div className="px-6 py-5 text-[15px] leading-relaxed shadow-xl shadow-black/60 rounded-2xl rounded-tl-sm bg-card text-foreground border border-border/40 ring-1 ring-inset ring-white/[0.02]">
                      {msgBody}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div className="h-1" />
        </div>
      </div>
    );
  },
);

ConversationView.displayName = "ConversationView";
