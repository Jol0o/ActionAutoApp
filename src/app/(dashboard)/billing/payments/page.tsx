"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { apiClient } from "@/lib/api-client";
import { Payment, PaymentStats, CreatePaymentData } from "@/types/billing";
import { formatCurrency } from "@/utils/format";
import {
  CreditCard, Plus, Search, RefreshCw, ChevronLeft,
  Send, X, CheckCircle2, RotateCcw, Ban, Download,
  Loader2, AlertCircle, Receipt,
} from "lucide-react";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  bg: "var(--color-background-tertiary, var(--background))",
  surface: "var(--color-background-secondary, var(--card))",
  hi: "var(--color-background-primary, var(--popover))",
  border: "var(--color-border-tertiary, var(--border))",
  borderHi: "var(--color-border-secondary, var(--border))",
  text: "var(--color-text-primary, var(--foreground))",
  textSub: "var(--color-text-secondary, var(--muted-foreground))",
  textMute: "var(--color-text-tertiary, var(--muted-foreground))",
  accent: "var(--color-text-info, #22C55E)",
  accentBg: "var(--color-background-info, rgba(34,197,94,0.12))",
  green: "var(--color-text-success, #22C55E)",
  greenBg: "var(--color-background-success, rgba(34,197,94,0.12))",
  amber: "var(--color-text-warning, #D97706)",
  amberBg: "var(--color-background-warning, rgba(217,119,6,0.12))",
  red: "var(--color-text-danger, #DC2626)",
  redBg: "var(--color-background-danger, rgba(220,38,38,0.12))",
};

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "info";
interface ToastItem { id: number; type: ToastType; msg: string; }

function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 2000, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
          background: T.hi, border: `0.5px solid ${t.type === "success" ? T.green : t.type === "error" ? T.red : T.borderHi}`,
          borderRadius: "var(--border-radius-lg)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
          animation: "slideIn 0.2s ease both",
          maxWidth: 340,
        }}>
          {t.type === "success" && <CheckCircle2 style={{ width: 14, height: 14, color: T.green, flexShrink: 0 }} />}
          {t.type === "error" && <AlertCircle style={{ width: 14, height: 14, color: T.red, flexShrink: 0 }} />}
          <p style={{ fontSize: 13, color: T.text, margin: 0, flex: 1 }}>{t.msg}</p>
          <button onClick={() => onDismiss(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMute, padding: 2, display: "flex" }}>
            <X style={{ width: 12, height: 12 }} />
          </button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const idRef = React.useRef(0);
  const push = React.useCallback((type: ToastType, msg: string) => {
    const id = ++idRef.current;
    setToasts(t => [...t, { id, type, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);
  const dismiss = React.useCallback((id: number) => setToasts(t => t.filter(x => x.id !== id)), []);
  return { toasts, push, dismiss };
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { c: string; bg: string }> = {
    succeeded: { c: T.green, bg: T.greenBg },
    pending: { c: T.amber, bg: T.amberBg },
    failed: { c: T.red, bg: T.redBg },
    processing: { c: T.accent, bg: T.accentBg },
    cancelled: { c: T.textSub, bg: T.surface },
    refunded: { c: T.textSub, bg: T.surface },
  };
  const s = map[status] ?? map.cancelled;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, fontWeight: 500, fontFamily: "var(--font-mono)",
      letterSpacing: "0.04em", textTransform: "uppercase",
      color: s.c, background: s.bg, borderRadius: 6, padding: "2px 8px",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.c }} />
      {status}
    </span>
  );
}

// ─── Create Payment Modal ─────────────────────────────────────────────────────
function CreateModal({
  open, onClose, onCreated, getToken,
}: {
  open: boolean; onClose: () => void; onCreated: () => void; getToken: () => Promise<string | null>;
}) {
  const [form, setForm] = React.useState<CreatePaymentData>({
    customerName: "", customerEmail: "", customerPhone: "",
    amount: 0, description: "", dueDate: "", notes: "",
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    if (!form.customerName || !form.customerEmail || !form.amount || !form.description) {
      setError("Please fill all required fields."); return;
    }
    setLoading(true); setError(null);
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await apiClient.post("/api/payments", form, { headers });
      onCreated(); onClose();
      setForm({ customerName: "", customerEmail: "", customerPhone: "", amount: 0, description: "", dueDate: "", notes: "" });
    } catch (e: any) { setError(e.response?.data?.message ?? "Failed to create payment."); }
    finally { setLoading(false); }
  };

  if (!open) return null;

  const Field = ({ label, k, type = "text", req = false }: { label: string; k: keyof CreatePaymentData; type?: string; req?: boolean }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12, color: T.textSub }}>
        {label}{req && <span style={{ color: T.red }}> *</span>}
      </label>
      <input type={type} value={form[k] as string || ""} placeholder={label}
        onChange={e => setForm(f => ({ ...f, [k]: type === "number" ? (parseFloat(e.target.value) || 0) : e.target.value }))}
        style={{ background: T.surface, border: `0.5px solid ${T.borderHi}`, borderRadius: "var(--border-radius-md)", padding: "9px 12px", color: T.text, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" }}
      />
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: T.hi, border: `0.5px solid ${T.borderHi}`, borderRadius: "var(--border-radius-lg)", padding: "24px 24px", width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 500, color: T.text, margin: 0 }}>New payment</h2>
            <p style={{ fontSize: 12, color: T.textMute, margin: "3px 0 0" }}>Create an invoice for a customer</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textSub, padding: 4, display: "flex" }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Customer name" k="customerName" req />
            <Field label="Customer email" k="customerEmail" type="email" req />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Phone" k="customerPhone" />
            <Field label="Amount (USD)" k="amount" type="number" req />
          </div>
          <Field label="Description" k="description" req />
          <Field label="Due date" k="dueDate" type="date" />
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 12, color: T.textSub }}>Notes</label>
            <textarea value={form.notes} placeholder="Optional notes…" onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
              style={{ background: T.surface, border: `0.5px solid ${T.borderHi}`, borderRadius: "var(--border-radius-md)", padding: "9px 12px", color: T.text, fontSize: 13, outline: "none", resize: "vertical", width: "100%", boxSizing: "border-box" }} />
          </div>
          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 12px", background: T.redBg, borderRadius: "var(--border-radius-md)" }}>
              <AlertCircle style={{ width: 13, height: 13, color: T.red }} />
              <p style={{ fontSize: 12, color: T.red, margin: 0 }}>{error}</p>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "10px 0", background: "transparent", border: `0.5px solid ${T.borderHi}`, borderRadius: "var(--border-radius-md)", color: T.textSub, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSubmit} disabled={loading} style={{ flex: 2, padding: "10px 0", background: T.accent, border: "none", borderRadius: "var(--border-radius-md)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, opacity: loading ? 0.7 : 1 }}>
              {loading ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> : <Plus style={{ width: 13, height: 13 }} />}
              {loading ? "Creating…" : "Create payment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────
function DetailDrawer({
  payment, onClose, onRefresh, getToken, toast,
}: {
  payment: Payment; onClose: () => void; onRefresh: () => void;
  getToken: () => Promise<string | null>;
  toast: (type: ToastType, msg: string) => void;
}) {
  const [loading, setLoading] = React.useState<string | null>(null);

  const authHeaders = async () => {
    const token = await getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const action = async (label: string, fn: () => Promise<void>) => {
    setLoading(label);
    try { await fn(); onRefresh(); onClose(); toast("success", `${label} successful`); }
    catch (e: any) { toast("error", e.response?.data?.message ?? `${label} failed`); }
    finally { setLoading(null); }
  };

  const Row = ({ label, val }: { label: string; val: React.ReactNode }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "9px 0", borderBottom: `0.5px solid ${T.border}` }}>
      <span style={{ fontSize: 12, color: T.textSub }}>{label}</span>
      <span style={{ fontSize: 12, color: T.text, fontFamily: "var(--font-mono)", textAlign: "right", maxWidth: "60%", wordBreak: "break-all" }}>{val}</span>
    </div>
  );

  return (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(420px,100vw)", background: T.hi, borderLeft: `0.5px solid ${T.borderHi}`, zIndex: 900, overflowY: "auto", padding: "22px 20px", boxShadow: "-8px 0 40px rgba(0,0,0,0.15)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
        <button onClick={onClose} style={{ background: T.surface, border: `0.5px solid ${T.border}`, borderRadius: "var(--border-radius-md)", padding: 7, cursor: "pointer", color: T.textSub, display: "flex" }}>
          <X style={{ width: 14, height: 14 }} />
        </button>
        <h3 style={{ fontSize: 16, fontWeight: 500, color: T.text, margin: 0 }}>Payment details</h3>
      </div>

      <div style={{ marginBottom: 18 }}>
        <p style={{ fontSize: 32, fontWeight: 500, color: T.text, margin: 0, letterSpacing: "-0.02em" }}>{formatCurrency(payment.amount)}</p>
        <div style={{ marginTop: 8 }}><StatusBadge status={payment.status} /></div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Row label="Customer" val={payment.customerName} />
        <Row label="Email" val={payment.customerEmail} />
        {payment.customerPhone && <Row label="Phone" val={payment.customerPhone} />}
        <Row label="Description" val={payment.description} />
        {payment.invoiceNumber && <Row label="Invoice #" val={payment.invoiceNumber} />}
        {payment.dueDate && <Row label="Due date" val={new Date(payment.dueDate).toLocaleDateString()} />}
        {payment.paidAt && <Row label="Paid at" val={new Date(payment.paidAt).toLocaleString()} />}
        {payment.paymentMethod && <Row label="Method" val={payment.paymentMethod} />}
        {payment.notes && <Row label="Notes" val={payment.notes} />}
      </div>

      {payment.receiptUrl && (
        <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", background: T.surface, border: `0.5px solid ${T.border}`, borderRadius: "var(--border-radius-md)", color: T.text, textDecoration: "none", fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
          <Download style={{ width: 13, height: 13 }} /> View receipt
        </a>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(payment.status === "pending" || payment.status === "failed") && (
          <button onClick={() => action("Send request", async () => { const h = await authHeaders(); await apiClient.post(`/api/payments/${payment._id}/request`, {}, { headers: h }); })}
            disabled={!!loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 0", background: T.accent, border: "none", borderRadius: "var(--border-radius-md)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", opacity: loading === "Send request" ? 0.6 : 1 }}>
            {loading === "Send request" ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> : <Send style={{ width: 13, height: 13 }} />}
            Send payment request
          </button>
        )}
        {payment.status === "succeeded" && (
          <button onClick={() => action("Refund", async () => { const h = await authHeaders(); await apiClient.post(`/api/payments/${payment._id}/refund`, {}, { headers: h }); })}
            disabled={!!loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 0", background: T.surface, border: `0.5px solid ${T.borderHi}`, borderRadius: "var(--border-radius-md)", color: T.textSub, fontSize: 13, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", opacity: loading === "Refund" ? 0.6 : 1 }}>
            {loading === "Refund" ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> : <RotateCcw style={{ width: 13, height: 13 }} />}
            Refund payment
          </button>
        )}
        {(payment.status === "pending" || payment.status === "processing") && (
          <button onClick={() => action("Cancel", async () => { const h = await authHeaders(); await apiClient.post(`/api/payments/${payment._id}/cancel`, {}, { headers: h }); })}
            disabled={!!loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 0", background: T.redBg, border: `0.5px solid ${T.red}`, borderRadius: "var(--border-radius-md)", color: T.red, fontSize: 13, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", opacity: loading === "Cancel" ? 0.6 : 1 }}>
            {loading === "Cancel" ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} /> : <Ban style={{ width: 13, height: 13 }} />}
            Cancel payment
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Payment Row ──────────────────────────────────────────────────────────────
function PaymentRow({ payment, onSelect }: { payment: Payment; onSelect: () => void }) {
  const [hov, setHov] = React.useState(false);
  return (
    <div onClick={onSelect} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto auto", alignItems: "center", gap: 12, padding: "12px 16px", background: hov ? T.surface : "transparent", borderBottom: `0.5px solid ${T.border}`, cursor: "pointer", transition: "background 0.1s" }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: T.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{payment.customerName}</p>
        <p style={{ fontSize: 11, color: T.textMute, fontFamily: "var(--font-mono)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{payment.customerEmail}</p>
      </div>
      <p style={{ fontSize: 12, color: T.textSub, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{payment.invoiceNumber ? `#${payment.invoiceNumber}` : payment.description}</p>
      <p style={{ fontSize: 13, fontWeight: 500, color: T.text, margin: 0, fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{formatCurrency(payment.amount)}</p>
      <StatusBadge status={payment.status} />
      <p style={{ fontSize: 11, color: T.textMute, fontFamily: "var(--font-mono)", margin: 0, whiteSpace: "nowrap" }}>{new Date(payment.createdAt || "").toLocaleDateString()}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const { getToken } = useAuth();
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [stats, setStats] = React.useState<PaymentStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [showCreate, setShowCreate] = React.useState(false);
  const [selected, setSelected] = React.useState<Payment | null>(null);
  const { toasts, push, dismiss } = useToast();

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [pRes, sRes] = await Promise.allSettled([
        apiClient.get("/api/payments", { headers, params: { status: statusFilter !== "all" ? statusFilter : undefined, search: search || undefined } }),
        apiClient.get("/api/payments/stats", { headers }),
      ]);
      if (pRes.status === "fulfilled") setPayments(pRes.value.data.data.payments ?? []);
      if (sRes.status === "fulfilled") setStats(sRes.value.data.data ?? null);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, [statusFilter, search, getToken]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const statuses = ["all", "pending", "processing", "succeeded", "failed", "refunded", "cancelled"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@500;600;700;800&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:translateX(0)}}
      `}</style>

      <div style={{ background: `linear-gradient(180deg, ${T.accentBg} 0%, ${T.bg} 180px)`, minHeight: "100%" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 20px 80px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
            <Link href="/billing" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.textMute, textDecoration: "none" }}>
              <ChevronLeft style={{ width: 14, height: 14 }} /> Dashboard
            </Link>
            <span style={{ color: T.border }}>›</span>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0, letterSpacing: "-0.02em", fontFamily: "'Epilogue', sans-serif" }}>
                Suprah<span style={{ color: T.accent }}>Pay</span> Payments
              </h1>
              <p style={{ fontSize: 10, fontWeight: 700, color: T.textMute, margin: "2px 0 0", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>
                Full Payment Stream
              </p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 24 }}>
            {[
              { label: "Revenue", val: formatCurrency(stats?.totalRevenue ?? 0), color: T.green },
              { label: "Pending", val: formatCurrency(stats?.pendingAmount ?? 0), color: T.amber },
              { label: "Volume", val: String(stats?.totalCount ?? 0), color: T.accent },
              { label: "Succeeded", val: String(stats?.byStatus?.succeeded?.count ?? 0), color: T.green },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ background: T.surface, border: `0.5px solid ${T.border}`, borderRadius: "var(--border-radius-lg)", padding: "14px 16px" }}>
                <p style={{ fontSize: 11, color: T.textMute, fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>{label}</p>
                <p style={{ fontSize: 22, fontWeight: 500, color, margin: "4px 0 0" }}>{isLoading ? "—" : val}</p>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14, alignItems: "center" }}>
            <div style={{ position: "relative", flex: "1 1 200px", minWidth: 180 }}>
              <Search style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: T.textMute }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, invoice…"
                style={{ width: "100%", boxSizing: "border-box", paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9, background: T.surface, border: `0.5px solid ${T.borderHi}`, borderRadius: "var(--border-radius-md)", color: T.text, fontSize: 13, outline: "none" }} />
            </div>

            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {statuses.map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  style={{ padding: "7px 12px", borderRadius: "var(--border-radius-md)", border: `0.5px solid ${statusFilter === s ? T.accent : T.border}`, background: statusFilter === s ? T.accentBg : "transparent", color: statusFilter === s ? T.accent : T.textSub, fontSize: 12, fontWeight: 500, cursor: "pointer", letterSpacing: "0.02em", textTransform: "capitalize" }}>
                  {s}
                </button>
              ))}
            </div>

            <button onClick={fetchData} style={{ padding: "8px 10px", background: "transparent", border: `0.5px solid ${T.border}`, borderRadius: "var(--border-radius-md)", cursor: "pointer", color: T.textMute, display: "flex" }}>
              <RefreshCw style={{ width: 13, height: 13 }} />
            </button>
            <button onClick={() => setShowCreate(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: T.accent, border: "none", borderRadius: "var(--border-radius-md)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
              <Plus style={{ width: 13, height: 13 }} /> New payment
            </button>
          </div>

          {/* Table */}
          <div style={{ background: T.surface, border: `0.5px solid ${T.border}`, borderRadius: "var(--border-radius-lg)", overflow: "hidden" }}>
            {/* Column headers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto auto", gap: 12, padding: "10px 16px", borderBottom: `0.5px solid ${T.border}`, background: T.bg }}>
              {["Customer", "Invoice", "Amount", "Status", "Date"].map(h => (
                <span key={h} style={{ fontSize: 11, color: T.textMute, fontFamily: "var(--font-mono)", letterSpacing: "0.07em", textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>

            {isLoading ? (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <RefreshCw style={{ width: 20, height: 20, color: T.textMute, animation: "spin 1s linear infinite", display: "block", margin: "0 auto" }} />
              </div>
            ) : payments.length === 0 ? (
              <div style={{ padding: "48px 0", textAlign: "center" }}>
                <Receipt style={{ width: 28, height: 28, color: T.textMute, display: "block", margin: "0 auto 10px" }} />
                <p style={{ fontSize: 13, color: T.textSub, margin: 0 }}>No payments found</p>
              </div>
            ) : (
              payments.map(p => <PaymentRow key={p._id} payment={p} onSelect={() => setSelected(p)} />)
            )}
          </div>

          {/* Total count */}
          {!isLoading && payments.length > 0 && (
            <p style={{ fontSize: 12, color: T.textMute, fontFamily: "var(--font-mono)", margin: "10px 0 0", textAlign: "right" }}>
              Showing {payments.length} records
            </p>
          )}
        </div>
      </div>

      <CreateModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { fetchData(); push("success", "Payment created successfully"); }} getToken={getToken} />
      {selected && (
        <DetailDrawer
          payment={selected}
          onClose={() => setSelected(null)}
          onRefresh={fetchData}
          getToken={getToken}
          toast={push}
        />
      )}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  );
}