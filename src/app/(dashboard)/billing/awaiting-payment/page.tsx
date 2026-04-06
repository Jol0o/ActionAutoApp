"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { apiClient } from "@/lib/api-client";
import { Payment } from "@/types/billing";
import { formatCurrency } from "@/utils/format";
import {
  AlertCircle, ChevronLeft, RefreshCw, Send, CheckCircle2,
  Clock, Loader2, X, Copy, Check, ExternalLink, Search,
  SortAsc, SortDesc, Filter,
} from "lucide-react";

const ORANGE = "#E55A00";
const PAGE_BG = "#07070a";
const CARD_BG = "#0f0f14";
const BORDER = "rgba(255,255,255,0.07)";
const DISPLAY = "'Rajdhani', var(--font-sans), sans-serif";
const MONO = "'Share Tech Mono', 'Roboto Mono', monospace";

function OverdueTag({ dueDate }: { dueDate?: string }) {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date();
  const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return (
    <span style={{ fontFamily: MONO, fontSize: 10, color: "#facc15", background: "rgba(250,204,21,0.1)", borderRadius: 6, padding: "2px 8px" }}>
      Due {due.toLocaleDateString()}
    </span>
  );
  return (
    <span style={{ fontFamily: MONO, fontSize: 10, color: "#f87171", background: "rgba(248,113,113,0.1)", borderRadius: 6, padding: "2px 8px" }}>
      {diff}d overdue
    </span>
  );
}

function AwaitingCard({ payment, onRequest, requestState }: {
  payment: Payment;
  onRequest: () => void;
  requestState: "idle" | "loading" | "success" | "error";
}) {
  const [hov, setHov] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const copyEmail = () => {
    navigator.clipboard.writeText(payment.customerEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "#111117" : CARD_BG,
        border: `1px solid ${hov ? "rgba(229,90,0,0.20)" : BORDER}`,
        borderRadius: 14, padding: "0", overflow: "hidden", transition: "all 0.14s",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Color accent top */}
      <div style={{ height: 3, background: payment.status === "failed" ? "#f87171" : ORANGE }} />

      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        {/* Name + Amount */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ minWidth: 0, flex: 1, marginRight: 10 }}>
            <p style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.9)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {payment.customerName}
            </p>
            <button onClick={copyEmail} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", padding: 0, cursor: "pointer", marginTop: 3 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: "rgba(255,255,255,0.3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>
                {payment.customerEmail}
              </span>
              {copied ? <Check style={{ width: 10, height: 10, color: "#4ade80" }} /> : <Copy style={{ width: 10, height: 10, color: "rgba(255,255,255,0.2)" }} />}
            </button>
          </div>
          <p style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 700, color: "#fff", margin: 0, flexShrink: 0 }}>
            {formatCurrency(payment.amount)}
          </p>
        </div>

        {/* Description */}
        <p style={{ fontFamily: DISPLAY, fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {payment.description}
        </p>

        {/* Due date & invoice */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <OverdueTag dueDate={payment.dueDate} />
          {payment.invoiceNumber && (
            <span style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: "2px 8px" }}>
              #{payment.invoiceNumber}
            </span>
          )}
          <span style={{
            fontFamily: MONO, fontSize: 10, borderRadius: 6, padding: "2px 8px",
            background: payment.status === "failed" ? "rgba(248,113,113,0.1)" : "rgba(250,204,21,0.1)",
            color: payment.status === "failed" ? "#f87171" : "#facc15",
          }}>
            {payment.status}
          </span>
        </div>

        {/* Action button */}
        {requestState === "success" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 9 }}>
            <CheckCircle2 style={{ width: 13, height: 13, color: "#4ade80" }} />
            <span style={{ fontFamily: DISPLAY, fontSize: 13, fontWeight: 600, color: "#4ade80" }}>Request sent!</span>
          </div>
        ) : requestState === "error" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 9 }}>
            <X style={{ width: 13, height: 13, color: "#f87171" }} />
            <span style={{ fontFamily: DISPLAY, fontSize: 13, fontWeight: 600, color: "#f87171" }}>Failed. Try again.</span>
          </div>
        ) : (
          <button onClick={onRequest} disabled={requestState === "loading"}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              padding: "9px 0", background: requestState === "loading" ? "rgba(229,90,0,0.5)" : ORANGE,
              border: "none", borderRadius: 9, color: "#fff", cursor: requestState === "loading" ? "not-allowed" : "pointer",
              fontFamily: DISPLAY, fontSize: 13, fontWeight: 700, transition: "background 0.13s",
            }}
          >
            {requestState === "loading"
              ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} />
              : <Send style={{ width: 12, height: 12 }} />
            }
            Send Payment Request
          </button>
        )}
      </div>
    </div>
  );
}

export default function AwaitingPaymentPage() {
  const { getToken } = useAuth();
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState<"amount-desc" | "amount-asc" | "date-desc" | "overdue">("overdue");
  const [requestStates, setRequestStates] = React.useState<Record<string, "idle" | "loading" | "success" | "error">>({});

  const authHeaders = async () => {
    const token = await getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const headers = await authHeaders();
      const res = await apiClient.get("/api/payments/pending", { headers });
      setPayments(res.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const handleRequest = async (payment: Payment) => {
    setRequestStates(s => ({ ...s, [payment._id]: "loading" }));
    try {
      await apiClient.post(`/api/payments/${payment._id}/request`, {}, { headers: await authHeaders() });
      setRequestStates(s => ({ ...s, [payment._id]: "success" }));
      setTimeout(() => setRequestStates(s => ({ ...s, [payment._id]: "idle" })), 4000);
    } catch {
      setRequestStates(s => ({ ...s, [payment._id]: "error" }));
      setTimeout(() => setRequestStates(s => ({ ...s, [payment._id]: "idle" })), 4000);
    }
  };

  const filtered = payments.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.customerName?.toLowerCase().includes(q) || p.customerEmail?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "amount-desc") return b.amount - a.amount;
    if (sort === "amount-asc") return a.amount - b.amount;
    if (sort === "overdue") {
      const aOverdue = a.dueDate ? new Date().getTime() - new Date(a.dueDate).getTime() : -Infinity;
      const bOverdue = b.dueDate ? new Date().getTime() - new Date(b.dueDate).getTime() : -Infinity;
      return bOverdue - aOverdue;
    }
    return new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime();
  });

  const totalOwed = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Share+Tech+Mono&display=swap');
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      <div className="dark" style={{ background: PAGE_BG, minHeight: "100%", fontFamily: DISPLAY }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 60px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
            <Link href="/billing" style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.35)", textDecoration: "none", fontFamily: DISPLAY, fontSize: 13 }}>
              <ChevronLeft style={{ width: 15, height: 15 }} /> Dashboard
            </Link>
            <span style={{ color: BORDER }}>›</span>
            <h1 style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>Awaiting Payment</h1>
            {payments.length > 0 && (
              <span style={{ fontFamily: MONO, fontSize: 11, background: `${ORANGE}20`, color: ORANGE, borderRadius: 8, padding: "3px 10px" }}>
                {payments.length}
              </span>
            )}
          </div>

          {/* Summary */}
          {payments.length > 0 && (
            <div style={{ background: "rgba(229,90,0,0.08)", border: "1px solid rgba(229,90,0,0.2)", borderRadius: 14, padding: "18px 22px", marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center" }}>
              <div>
                <p style={{ fontFamily: MONO, fontSize: 10, color: "rgba(229,90,0,0.7)", margin: 0, letterSpacing: "0.06em", textTransform: "uppercase" }}>Total Outstanding</p>
                <p style={{ fontFamily: DISPLAY, fontSize: 32, fontWeight: 700, color: "#fff", margin: 0, marginTop: 4 }}>{formatCurrency(totalOwed)}</p>
              </div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                <div>
                  <p style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>Customers</p>
                  <p style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.8)", margin: 0, marginTop: 2 }}>{payments.length}</p>
                </div>
                <div>
                  <p style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>Avg Invoice</p>
                  <p style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.8)", margin: 0, marginTop: 2 }}>{formatCurrency(totalOwed / payments.length)}</p>
                </div>
                <div>
                  <p style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>Overdue</p>
                  <p style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 700, color: "#f87171", margin: 0, marginTop: 2 }}>
                    {payments.filter(p => p.dueDate && new Date(p.dueDate) < new Date()).length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: "1 1 200px", minWidth: 180 }}>
              <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "rgba(255,255,255,0.3)" }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search customers..."
                style={{ width: "100%", boxSizing: "border-box", paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9, background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, color: "#fff", fontFamily: DISPLAY, fontSize: 13, outline: "none" }}
              />
            </div>
            <select value={sort} onChange={e => setSort(e.target.value as any)}
              style={{ padding: "9px 14px", background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, color: "rgba(255,255,255,0.7)", fontFamily: DISPLAY, fontSize: 13, outline: "none", cursor: "pointer" }}>
              <option value="overdue">Most Overdue</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
              <option value="date-desc">Newest First</option>
            </select>
            <button onClick={fetchData} style={{ padding: "9px 12px", background: "transparent", border: `1px solid ${BORDER}`, borderRadius: 9, cursor: "pointer", color: "rgba(255,255,255,0.4)" }}>
              <RefreshCw style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {/* Cards grid */}
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ height: 200, background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14, animation: "pulse 1.5s ease-in-out infinite" }} />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <CheckCircle2 style={{ width: 42, height: 42, color: "#4ade80", display: "block", margin: "0 auto 16px" }} />
              <p style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.7)", margin: 0 }}>
                {search ? "No results" : "All caught up!"}
              </p>
              <p style={{ fontFamily: DISPLAY, fontSize: 13, color: "rgba(255,255,255,0.3)", margin: 0, marginTop: 6 }}>
                {search ? "Try a different search." : "No pending or failed payments at the moment."}
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
              {sorted.map(p => (
                <AwaitingCard
                  key={p._id} payment={p}
                  onRequest={() => handleRequest(p)}
                  requestState={requestStates[p._id] || "idle"}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}