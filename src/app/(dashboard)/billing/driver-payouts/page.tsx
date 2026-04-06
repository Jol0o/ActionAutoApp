"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { apiClient } from "@/lib/api-client";
import { DriverPayout, DeliverableShipment, DriverPayoutStats } from "@/types/driver-payout";
import { formatCurrency } from "@/utils/format";
import {
  Users, ChevronLeft, RefreshCw, Truck, CheckCircle2,
  DollarSign, Clock, X, Loader2, Plus, AlertCircle, Package,
} from "lucide-react";

const ORANGE = "#E55A00";
const PAGE_BG = "#07070a";
const CARD_BG = "#0f0f14";
const BORDER = "rgba(255,255,255,0.07)";
const DISPLAY = "'Rajdhani', var(--font-sans), sans-serif";
const MONO = "'Share Tech Mono', 'Roboto Mono', monospace";

function PayoutStatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    pending:   { bg: "rgba(250,204,21,0.12)",  text: "#facc15" },
    paid:      { bg: "rgba(74,222,128,0.12)",  text: "#4ade80" },
    confirmed: { bg: "rgba(96,165,250,0.12)",  text: "#60a5fa" },
    cancelled: { bg: "rgba(148,163,184,0.12)", text: "#94a3b8" },
  };
  const c = colors[status] || colors.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: c.bg, color: c.text, borderRadius: 6, padding: "3px 9px",
      fontFamily: MONO, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.text }} />
      {status}
    </span>
  );
}

function PayoutModal({ target, onClose, onCreated, getToken }: {
  target: DeliverableShipment; onClose: () => void; onCreated: () => void; getToken: () => Promise<string | null>;
}) {
  const [amount, setAmount] = React.useState(0);
  const [notes, setNotes] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    if (amount <= 0) { setError("Amount must be greater than 0."); return; }
    setLoading(true); setError(null);
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await apiClient.post("/api/driver-payouts", {
        shipmentId: target._id,
        driverId: target.assignedDriverId._id,
        amount, notes,
      }, { headers });
      onCreated(); onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || "Failed to create payout.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#0f0f14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18, padding: "26px 26px", width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <h3 style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>Send Driver Payout</h3>
            <p style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0, marginTop: 3 }}>{target.trackingNumber}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 14px", marginBottom: 18 }}>
          <p style={{ fontFamily: DISPLAY, fontSize: 13, color: "rgba(255,255,255,0.6)", margin: 0 }}>Driver</p>
          <p style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 700, color: "#fff", margin: 0, marginTop: 2 }}>
            {target.assignedDriverId?.name || "Unknown Driver"}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontFamily: DISPLAY, fontSize: 12, color: "rgba(255,255,255,0.45)" }}>Payout Amount (USD) <span style={{ color: ORANGE }}>*</span></label>
            <input type="number" value={amount || ""} onChange={e => setAmount(parseFloat(e.target.value) || 0)}
              placeholder="0.00" min="0" step="0.01"
              style={{ display: "block", width: "100%", boxSizing: "border-box", marginTop: 6, background: "#0a0a0d", border: `1px solid ${BORDER}`, borderRadius: 9, padding: "11px 14px", color: "#fff", fontFamily: MONO, fontSize: 16, outline: "none" }}
            />
          </div>
          <div>
            <label style={{ fontFamily: DISPLAY, fontSize: 12, color: "rgba(255,255,255,0.45)" }}>Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Delivery bonus, route details..."
              style={{ display: "block", width: "100%", boxSizing: "border-box", marginTop: 6, background: "#0a0a0d", border: `1px solid ${BORDER}`, borderRadius: 9, padding: "10px 14px", color: "#fff", fontFamily: DISPLAY, fontSize: 13, outline: "none", resize: "vertical" }}
            />
          </div>
          {error && <p style={{ fontFamily: DISPLAY, fontSize: 13, color: "#f87171" }}>{error}</p>}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "11px 0", background: "transparent", border: `1px solid ${BORDER}`, borderRadius: 10, color: "rgba(255,255,255,0.5)", fontFamily: DISPLAY, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSubmit} disabled={loading} style={{ flex: 2, padding: "11px 0", background: loading ? "rgba(229,90,0,0.5)" : ORANGE, border: "none", borderRadius: 10, color: "#fff", fontFamily: DISPLAY, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {loading ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <DollarSign style={{ width: 14, height: 14 }} />}
              {loading ? "Sending..." : "Send Payout"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DriverPayoutsPage() {
  const { getToken } = useAuth();
  const [deliverable, setDeliverable] = React.useState<DeliverableShipment[]>([]);
  const [payouts, setPayouts] = React.useState<DriverPayout[]>([]);
  const [payoutStats, setPayoutStats] = React.useState<DriverPayoutStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [payoutTarget, setPayoutTarget] = React.useState<DeliverableShipment | null>(null);
  const [confirmingId, setConfirmingId] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<"deliverable" | "history">("deliverable");

  const authHeaders = async () => {
    const token = await getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const headers = await authHeaders();
      const [dRes, pRes, sRes] = await Promise.all([
        apiClient.get("/api/driver-payouts/deliverable", { headers }),
        apiClient.get("/api/driver-payouts", { headers }),
        apiClient.get("/api/driver-payouts/stats", { headers }),
      ]);
      setDeliverable(dRes.data.data || []);
      setPayouts(pRes.data.data || []);
      setPayoutStats(sRes.data.data || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const confirmDelivery = async (id: string) => {
    setConfirmingId(id);
    try {
      await apiClient.post(`/api/shipments/${id}/confirm-delivery`, {}, { headers: await authHeaders() });
      fetchData();
    } catch (e) { console.error(e); }
    finally { setConfirmingId(null); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Share+Tech+Mono&display=swap');
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      <div className="dark" style={{ background: PAGE_BG, minHeight: "100%", fontFamily: DISPLAY }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 60px" }}>

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
            <Link href="/billing" style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.35)", textDecoration: "none", fontFamily: DISPLAY, fontSize: 13 }}>
              <ChevronLeft style={{ width: 15, height: 15 }} /> Dashboard
            </Link>
            <span style={{ color: BORDER }}>›</span>
            <h1 style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>Driver Payouts</h1>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 24 }}>
            {[
              { label: "Total Paid Out", val: formatCurrency(payoutStats?.totalPaidOut ?? 0), color: "#4ade80" },
              { label: "Pending Payouts", val: formatCurrency(payoutStats?.pendingAmount ?? 0), color: "#facc15" },
              { label: "Deliverable Jobs", val: String(deliverable.length), color: ORANGE },
              { label: "All Payouts", val: String(payouts.length), color: "#60a5fa" },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 16px" }}>
                <p style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                <p style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 700, color, margin: 0, marginTop: 6 }}>{val}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 18, background: "#0d0d11", border: `1px solid ${BORDER}`, borderRadius: 10, padding: 4, width: "fit-content" }}>
            {[["deliverable", "Ready to Pay", Truck], ["history", "Payout History", DollarSign]].map(([key, label, Icon]: any) => (
              <button key={key} onClick={() => setTab(key)}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 7, border: "none", background: tab === key ? ORANGE : "transparent", color: tab === key ? "#fff" : "rgba(255,255,255,0.38)", fontFamily: DISPLAY, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                <Icon style={{ width: 13, height: 13 }} /> {label}
                {key === "deliverable" && deliverable.length > 0 && (
                  <span style={{ background: tab === key ? "rgba(0,0,0,0.2)" : `${ORANGE}22`, color: tab === key ? "#fff" : ORANGE, borderRadius: 8, padding: "1px 7px", fontFamily: MONO, fontSize: 10 }}>{deliverable.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button onClick={fetchData} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "transparent", border: `1px solid ${BORDER}`, borderRadius: 8, color: "rgba(255,255,255,0.4)", fontFamily: DISPLAY, fontSize: 12, cursor: "pointer" }}>
              <RefreshCw style={{ width: 13, height: 13 }} /> Refresh
            </button>
          </div>

          {/* Deliverable tab */}
          {tab === "deliverable" && (
            loading ? (
              <div style={{ padding: "50px 0", textAlign: "center" }}>
                <RefreshCw style={{ width: 22, height: 22, color: "rgba(255,255,255,0.2)", animation: "spin 1s linear infinite" }} />
              </div>
            ) : deliverable.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14 }}>
                <Package style={{ width: 36, height: 36, color: "rgba(255,255,255,0.1)", display: "block", margin: "0 auto 14px" }} />
                <p style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>No deliverable shipments</p>
                <p style={{ fontFamily: DISPLAY, fontSize: 13, color: "rgba(255,255,255,0.25)" }}>Completed shipments awaiting payout will appear here.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                {deliverable.map(s => (
                  <div key={s._id} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "18px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0, letterSpacing: "0.05em" }}>TRACKING</p>
                        <p style={{ fontFamily: MONO, fontSize: 13, color: "#fff", margin: 0, marginTop: 3 }}>{s.trackingNumber}</p>
                      </div>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: `${ORANGE}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Truck style={{ width: 15, height: 15, color: ORANGE }} />
                      </div>
                    </div>
                    <div>
                      <p style={{ fontFamily: DISPLAY, fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>Driver</p>
                      <p style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 700, color: "#fff", margin: 0, marginTop: 2 }}>{s.assignedDriverId?.name || "—"}</p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => confirmDelivery(s._id)} disabled={confirmingId === s._id}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 9, color: "#4ade80", fontFamily: DISPLAY, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        {confirmingId === s._id ? <Loader2 style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} /> : <CheckCircle2 style={{ width: 12, height: 12 }} />}
                        Confirm
                      </button>
                      <button onClick={() => setPayoutTarget(s)}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", background: ORANGE, border: "none", borderRadius: 9, color: "#fff", fontFamily: DISPLAY, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        <DollarSign style={{ width: 12, height: 12 }} /> Pay Driver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* History tab */}
          {tab === "history" && (
            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 12, padding: "11px 16px", borderBottom: `1px solid ${BORDER}` }}>
                {["Driver", "Shipment", "Amount", "Status"].map(h => (
                  <span key={h} style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</span>
                ))}
              </div>
              {loading ? (
                <div style={{ padding: "40px 0", textAlign: "center" }}>
                  <RefreshCw style={{ width: 20, height: 20, color: "rgba(255,255,255,0.2)", animation: "spin 1s linear infinite" }} />
                </div>
              ) : payouts.length === 0 ? (
                <p style={{ fontFamily: DISPLAY, fontSize: 14, color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "40px 0" }}>No payouts yet</p>
              ) : payouts.map(p => (
                <div key={p._id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 12, alignItems: "center", padding: "13px 16px", borderBottom: `1px solid ${BORDER}` }}>
                  <div>
                    <p style={{ fontFamily: DISPLAY, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)", margin: 0 }}>{(p.driverId as any)?.name || "—"}</p>
                    <p style={{ fontFamily: MONO, fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>{new Date(p.createdAt || "").toLocaleDateString()}</p>
                  </div>
                  <p style={{ fontFamily: MONO, fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>{(p.shipmentId as any)?.trackingNumber || "—"}</p>
                  <p style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>{formatCurrency(p.amount)}</p>
                  <PayoutStatusBadge status={p.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {payoutTarget && (
        <PayoutModal target={payoutTarget} onClose={() => setPayoutTarget(null)} onCreated={fetchData} getToken={getToken} />
      )}
    </>
  );
}