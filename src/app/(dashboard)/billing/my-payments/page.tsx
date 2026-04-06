"use client";

/**
 * /billing/my-payments
 * Customer-facing page: view invoices addressed to the logged-in user,
 * and pay them directly via Stripe Elements.
 */
import * as React from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useAuth } from "@/providers/AuthProvider";
import { apiClient } from "@/lib/api-client";
import { Payment } from "@/types/billing";
import { formatCurrency } from "@/utils/format";
import {
  ChevronLeft, CreditCard, CheckCircle2, Clock,
  XCircle, ExternalLink, Loader2, X, RefreshCw,
  Receipt, AlertCircle,
} from "lucide-react";

// ─── Stripe init (public key) ─────────────────────────────────────────────────
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  bg:       "var(--color-background-tertiary)",
  surface:  "var(--color-background-secondary)",
  hi:       "var(--color-background-primary)",
  border:   "var(--color-border-tertiary)",
  borderHi: "var(--color-border-secondary)",
  text:     "var(--color-text-primary)",
  textSub:  "var(--color-text-secondary)",
  textMute: "var(--color-text-tertiary)",
  accent:   "var(--color-text-info)",
  accentBg: "var(--color-background-info)",
  green:    "var(--color-text-success)",
  greenBg:  "var(--color-background-success)",
  amber:    "var(--color-text-warning)",
  amberBg:  "var(--color-background-warning)",
  red:      "var(--color-text-danger)",
  redBg:    "var(--color-background-danger)",
};

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { c: string; bg: string }> = {
    succeeded: { c: T.green,  bg: T.greenBg },
    pending:   { c: T.amber,  bg: T.amberBg },
    failed:    { c: T.red,    bg: T.redBg   },
    processing:{ c: T.accent, bg: T.accentBg},
    cancelled: { c: T.textSub,bg: T.surface  },
  };
  const s = map[status] ?? map.cancelled;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, fontWeight: 500, fontFamily: "var(--font-mono)",
      letterSpacing: "0.04em", textTransform: "uppercase",
      color: s.c, background: s.bg,
      borderRadius: 6, padding: "2px 8px",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.c }} />
      {status}
    </span>
  );
}

// ─── Stripe payment form (inside Elements provider) ───────────────────────────
function PaymentForm({
  payment,
  onSuccess,
  onClose,
  getToken,
}: {
  payment: Payment;
  onSuccess: () => void;
  onClose: () => void;
  getToken: () => Promise<string | null>;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setStatus("submitting");
    setErrorMsg(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setStatus("error");
      setErrorMsg(submitError.message ?? "Validation error");
      return;
    }

    // Confirm on Stripe
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message ?? "Payment failed");
      return;
    }

    // Tell our backend
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await apiClient.post("/api/payments/confirm-customer", {
        paymentIntentId: paymentIntent?.id,
      }, { headers });
      setStatus("success");
      setTimeout(() => { onSuccess(); onClose(); }, 1800);
    } catch {
      setStatus("error");
      setErrorMsg("Payment processed but confirmation failed. Contact support.");
    }
  };

  if (status === "success") {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <CheckCircle2 style={{ width: 44, height: 44, color: T.green, display: "block", margin: "0 auto 14px" }} />
        <p style={{ fontSize: 16, fontWeight: 500, color: T.text, margin: 0 }}>Payment successful!</p>
        <p style={{ fontSize: 13, color: T.textSub, margin: "6px 0 0" }}>Your receipt will arrive by email.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Invoice summary */}
      <div style={{ background: T.surface, border: `0.5px solid ${T.border}`, borderRadius: "var(--border-radius-md)", padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: 13, color: T.textSub, margin: 0 }}>{payment.description}</p>
            {payment.invoiceNumber && (
              <p style={{ fontSize: 11, color: T.textMute, fontFamily: "var(--font-mono)", margin: "3px 0 0" }}>#{payment.invoiceNumber}</p>
            )}
          </div>
          <p style={{ fontSize: 20, fontWeight: 500, color: T.text, margin: 0 }}>{formatCurrency(payment.amount)}</p>
        </div>
      </div>

      {/* Stripe payment element */}
      <div style={{ borderRadius: "var(--border-radius-md)", overflow: "hidden" }}>
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {errorMsg && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: T.redBg, border: `0.5px solid ${T.red}`, borderRadius: "var(--border-radius-md)" }}>
          <AlertCircle style={{ width: 13, height: 13, color: T.red, flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: T.red, margin: 0 }}>{errorMsg}</p>
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" onClick={onClose} style={{
          flex: 1, padding: "11px 0", background: "transparent",
          border: `0.5px solid ${T.borderHi}`, borderRadius: "var(--border-radius-md)",
          color: T.textSub, fontSize: 13, fontWeight: 500, cursor: "pointer",
        }}>Cancel</button>
        <button type="submit" disabled={!stripe || status === "submitting"} style={{
          flex: 2, padding: "11px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          background: status === "submitting" ? T.accentBg : T.accent,
          border: "none", borderRadius: "var(--border-radius-md)",
          color: "#fff", fontSize: 13, fontWeight: 500, cursor: status === "submitting" ? "not-allowed" : "pointer",
          transition: "opacity 0.15s",
        }}>
          {status === "submitting"
            ? <><Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> Processing…</>
            : <><CreditCard style={{ width: 14, height: 14 }} /> Pay {formatCurrency(payment.amount)}</>
          }
        </button>
      </div>
    </form>
  );
}

// ─── Pay Modal ─────────────────────────────────────────────────────────────────
function PayModal({
  payment, onClose, onSuccess, getToken,
}: {
  payment: Payment; onClose: () => void; onSuccess: () => void; getToken: () => Promise<string | null>;
}) {
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await apiClient.post("/api/payments/create-customer-intent", {
          paymentId: payment._id,
        }, { headers });
        setClientSecret(res.data.data.clientSecret);
      } catch (e: any) {
        setError(e.response?.data?.message ?? "Failed to initialize payment.");
      } finally {
        setLoading(false);
      }
    })();
  }, [payment._id, getToken]);

  const appearance = {
    theme: "stripe" as const,
    variables: {
      colorPrimary: "#3b82f6",
      borderRadius: "8px",
      fontSizeBase: "14px",
    },
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: T.hi, border: `0.5px solid ${T.borderHi}`,
        borderRadius: "var(--border-radius-lg)", padding: "24px 24px",
        width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 500, color: T.text, margin: 0 }}>Complete payment</h2>
            <p style={{ fontSize: 12, color: T.textMute, margin: "3px 0 0", fontFamily: "var(--font-mono)" }}>Secured by Stripe</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textSub, padding: 4, display: "flex" }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <Loader2 style={{ width: 24, height: 24, color: T.accent, animation: "spin 1s linear infinite", display: "block", margin: "0 auto" }} />
            <p style={{ fontSize: 13, color: T.textSub, marginTop: 12 }}>Initializing payment…</p>
          </div>
        )}

        {error && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <AlertCircle style={{ width: 32, height: 32, color: T.red, display: "block", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 13, color: T.red, margin: 0 }}>{error}</p>
          </div>
        )}

        {!loading && !error && clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
            <PaymentForm payment={payment} onSuccess={onSuccess} onClose={onClose} getToken={getToken} />
          </Elements>
        )}
      </div>
    </div>
  );
}

// ─── Invoice card ─────────────────────────────────────────────────────────────
function InvoiceCard({
  payment, onPay,
}: {
  payment: Payment; onPay: () => void;
}) {
  const canPay = payment.status === "pending" || payment.status === "failed";
  const isPaid = payment.status === "succeeded";
  const isOverdue = payment.dueDate && new Date(payment.dueDate) < new Date() && canPay;

  return (
    <div style={{
      background: T.surface, border: `0.5px solid ${isOverdue ? T.red : T.border}`,
      borderRadius: "var(--border-radius-lg)", overflow: "hidden",
      transition: "border-color 0.15s",
    }}>
      <div style={{ height: 3, background: isPaid ? T.green : isOverdue ? T.red : canPay ? T.amber : T.border }} />
      <div style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ minWidth: 0, flex: 1, marginRight: 12 }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: T.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {payment.description}
            </p>
            {payment.invoiceNumber && (
              <p style={{ fontSize: 11, color: T.textMute, fontFamily: "var(--font-mono)", margin: "3px 0 0" }}>#{payment.invoiceNumber}</p>
            )}
          </div>
          <p style={{ fontSize: 18, fontWeight: 500, color: T.text, margin: 0, flexShrink: 0 }}>{formatCurrency(payment.amount)}</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          <StatusBadge status={payment.status} />
          {payment.dueDate && canPay && (
            <span style={{
              fontSize: 10, fontFamily: "var(--font-mono)",
              color: isOverdue ? T.red : T.amber,
              background: isOverdue ? T.redBg : T.amberBg,
              borderRadius: 6, padding: "2px 8px",
            }}>
              {isOverdue
                ? `Overdue ${Math.floor((Date.now() - new Date(payment.dueDate!).getTime()) / 86400000)}d`
                : `Due ${new Date(payment.dueDate!).toLocaleDateString()}`
              }
            </span>
          )}
          {payment.paidAt && (
            <span style={{ fontSize: 11, color: T.textMute, fontFamily: "var(--font-mono)" }}>
              Paid {new Date(payment.paidAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {canPay ? (
          <button onClick={onPay} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            width: "100%", padding: "10px 0",
            background: T.accent, border: "none",
            borderRadius: "var(--border-radius-md)", color: "#fff",
            fontSize: 13, fontWeight: 500, cursor: "pointer",
          }}>
            <CreditCard style={{ width: 13, height: 13 }} /> Pay now
          </button>
        ) : payment.receiptUrl ? (
          <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            width: "100%", padding: "9px 0",
            background: "transparent", border: `0.5px solid ${T.borderHi}`,
            borderRadius: "var(--border-radius-md)", color: T.textSub,
            fontSize: 12, fontWeight: 500, cursor: "pointer", textDecoration: "none",
          }}>
            <ExternalLink style={{ width: 12, height: 12 }} /> View receipt
          </a>
        ) : null}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MyPaymentsPage() {
  const { getToken } = useAuth();
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [stats, setStats]   = React.useState<{ totalOwed: number; totalPaid: number; pendingCount: number } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [payTarget, setPayTarget] = React.useState<Payment | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await apiClient.get("/api/payments/my-payments", { headers });
      setPayments(res.data.data.payments ?? []);
      setStats(res.data.data.stats ?? null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [getToken]);

  React.useEffect(() => { load(); }, [load]);

  const pending = payments.filter(p => p.status === "pending" || p.status === "failed");
  const history = payments.filter(p => p.status !== "pending" && p.status !== "failed");

  return (
    <>
      <style>{`@keyframes spin { to{transform:rotate(360deg)} }`}</style>

      <div style={{ background: T.bg, minHeight: "100%" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px 80px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
            <Link href="/billing" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.textMute, textDecoration: "none" }}>
              <ChevronLeft style={{ width: 14, height: 14 }} /> Dashboard
            </Link>
            <span style={{ color: T.border }}>›</span>
            <h1 style={{ fontSize: 20, fontWeight: 500, color: T.text, margin: 0 }}>My payments</h1>
          </div>

          {/* Stats */}
          {stats && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
              {[
                { label: "Amount owed", val: formatCurrency(stats.totalOwed), color: T.amber, bg: T.amberBg, icon: Clock },
                { label: "Total paid", val: formatCurrency(stats.totalPaid), color: T.green, bg: T.greenBg, icon: CheckCircle2 },
                { label: "Open invoices", val: String(stats.pendingCount), color: T.red, bg: T.redBg, icon: Receipt },
              ].map(({ label, val, color, bg, icon: Icon }) => (
                <div key={label} style={{ background: T.surface, border: `0.5px solid ${T.border}`, borderRadius: "var(--border-radius-lg)", padding: "16px 18px" }}>
                  <div style={{ width: 30, height: 30, borderRadius: "var(--border-radius-md)", background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                    <Icon style={{ width: 13, height: 13, color }} />
                  </div>
                  <p style={{ fontSize: 11, color: T.textMute, fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>{label}</p>
                  <p style={{ fontSize: 22, fontWeight: 500, color, margin: "4px 0 0" }}>{val}</p>
                </div>
              ))}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <Loader2 style={{ width: 24, height: 24, color: T.accent, animation: "spin 1s linear infinite", display: "block", margin: "0 auto" }} />
              <p style={{ fontSize: 13, color: T.textSub, marginTop: 12 }}>Loading your invoices…</p>
            </div>
          ) : payments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px", background: T.surface, border: `0.5px solid ${T.border}`, borderRadius: "var(--border-radius-lg)" }}>
              <CheckCircle2 style={{ width: 40, height: 40, color: T.green, display: "block", margin: "0 auto 14px" }} />
              <p style={{ fontSize: 16, fontWeight: 500, color: T.text, margin: 0 }}>You're all caught up!</p>
              <p style={{ fontSize: 13, color: T.textSub, margin: "6px 0 0" }}>No invoices have been sent to your account.</p>
            </div>
          ) : (
            <>
              {/* Pending / unpaid */}
              {pending.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <p style={{ fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: T.textMute, marginBottom: 12 }}>
                    Action required · {pending.length}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                    {pending.map(p => <InvoiceCard key={p._id} payment={p} onPay={() => setPayTarget(p)} />)}
                  </div>
                </div>
              )}

              {/* History */}
              {history.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: T.textMute, marginBottom: 12 }}>
                    History · {history.length}
                  </p>
                  <div style={{ background: T.surface, border: `0.5px solid ${T.border}`, borderRadius: "var(--border-radius-lg)", overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, padding: "10px 16px", borderBottom: `0.5px solid ${T.border}` }}>
                      {["Invoice", "Amount", "Status"].map(h => (
                        <span key={h} style={{ fontSize: 11, color: T.textMute, fontFamily: "var(--font-mono)", letterSpacing: "0.07em", textTransform: "uppercase" }}>{h}</span>
                      ))}
                    </div>
                    {history.map(p => (
                      <div key={p._id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, alignItems: "center", padding: "12px 16px", borderBottom: `0.5px solid ${T.border}` }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: T.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.description}</p>
                          <p style={{ fontSize: 11, color: T.textMute, fontFamily: "var(--font-mono)", margin: "2px 0 0" }}>
                            {p.invoiceNumber ? `#${p.invoiceNumber} · ` : ""}{new Date(p.createdAt || "").toLocaleDateString()}
                          </p>
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: T.text, margin: 0 }}>{formatCurrency(p.amount)}</p>
                        <StatusBadge status={p.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Pay modal */}
      {payTarget && (
        <PayModal
          payment={payTarget}
          onClose={() => setPayTarget(null)}
          onSuccess={() => { load(); setPayTarget(null); }}
          getToken={getToken}
        />
      )}
    </>
  );
}