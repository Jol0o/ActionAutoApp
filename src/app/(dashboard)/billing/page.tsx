"use client";

import * as React from "react";
import { useAuth } from "@/providers/AuthProvider";
import { apiClient } from "@/lib/api-client";
import { Payment, PaymentStats, CreatePaymentData } from "@/types/billing";
import { DriverPayout, DeliverableShipment, DriverPayoutStats } from "@/types/driver-payout";
import { formatCurrency } from "@/utils/format";

import { CheckCircle2, Loader2, Receipt, Send, Users } from "lucide-react";

import { StatusBadge } from "@/components/billing/StatusBadges";
import { BalanceCard } from "@/components/billing/BalanceCard";
import { ReceiveModal } from "@/components/billing/ReceiveModal";
import { SendModal } from "@/components/billing/SendModal";
import { PaymentsTab } from "@/components/billing/PaymentsTab";
import { DriverPayoutsTab } from "@/components/billing/DriverPayoutsTab";

const DISPLAY = "'Rajdhani', var(--font-sans), sans-serif";
const MONO    = "'Share Tech Mono', 'Roboto Mono', monospace";
const ORANGE  = "#E55A00";
const PAGE_BG = "#0a0a0c";

export default function BillingPage() {
 const { getToken, userId: authUserId } = useAuth();

  const [balance,     setBalance]     = React.useState<number | null>(null);
  const [activeModal, setActiveModal] = React.useState<"receive" | "send" | null>(null);

  const [payments,        setPayments]        = React.useState<Payment[]>([]);
  const [pendingPayments, setPendingPayments] = React.useState<Payment[]>([]);
  const [stats,           setStats]           = React.useState<PaymentStats | null>(null);
  const [isLoading,       setIsLoading]       = React.useState(true);
  const [search,          setSearch]          = React.useState("");
  const [statusFilter,    setStatusFilter]    = React.useState("all");

  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [createForm,       setCreateForm]       = React.useState<CreatePaymentData>({
    customerName: "", customerEmail: "", customerPhone: "",
    amount: 0, description: "", dueDate: "", notes: "",
  });
  const [isCreating, setIsCreating] = React.useState(false);
  const [paymentDetailView, setPaymentDetailView] = React.useState<Payment | null>(null);
  const [requestingPaymentId, setRequestingPaymentId] = React.useState<string | null>(null);
  const [requestFeedback,     setRequestFeedback]     = React.useState<{ id: string; ok: boolean; msg: string } | null>(null);

  const [billingTab,           setBillingTab]           = React.useState<"payments" | "driver-payouts" | "awaiting-payment">("payments");
  const [deliverableShipments, setDeliverableShipments] = React.useState<DeliverableShipment[]>([]);
  const [payouts,              setPayouts]              = React.useState<DriverPayout[]>([]);
  const [payoutStats,          setPayoutStats]          = React.useState<DriverPayoutStats | null>(null);
  const [payoutsLoading,       setPayoutsLoading]       = React.useState(false);
  const [createPayoutTarget,   setCreatePayoutTarget]   = React.useState<DeliverableShipment | null>(null);
  const [createPayoutAmount,   setCreatePayoutAmount]   = React.useState<number>(0);
  const [createPayoutNotes,    setCreatePayoutNotes]    = React.useState("");
  const [isCreatingPayout,     setIsCreatingPayout]     = React.useState(false);
  const [payoutError,          setPayoutError]          = React.useState<string | null>(null);
  const [confirmingId,         setConfirmingId]         = React.useState<string | null>(null);

  const authHeaders = async () => {
    const token = await getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = await authHeaders();
      const [paymentsRes, pendingRes, statsRes, balanceRes] = await Promise.allSettled([
        apiClient.get("/api/payments", { headers, params: { status: statusFilter !== "all" ? statusFilter : undefined, search: search || undefined } }),
        apiClient.get("/api/payments/pending", { headers }),
        apiClient.get("/api/payments/stats",   { headers }),
        apiClient.get("/api/billing/balance",  { headers }),
      ]);
      if (paymentsRes.status === "fulfilled") setPayments(paymentsRes.value.data.data.payments || []);
      if (pendingRes.status  === "fulfilled") setPendingPayments(pendingRes.value.data.data || []);
      if (statsRes.status    === "fulfilled") setStats(statsRes.value.data.data || null);
      if (balanceRes.status  === "fulfilled") setBalance(balanceRes.value.data.data?.balance ?? null);
    } catch (err) { console.error("[Billing] fetchData:", err); }
    finally { setIsLoading(false); }
  }, [statusFilter, search]);

  React.useEffect(() => { fetchData(); }, [fetchData]);
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "driver-payouts") { setBillingTab("driver-payouts"); window.history.replaceState({}, "", "/billing"); }
  }, []);

  const handleCreatePayment = async () => {
    if (!createForm.customerName || !createForm.customerEmail || !createForm.amount || !createForm.description) return;
    setIsCreating(true);
    try {
      await apiClient.post("/api/payments", createForm, { headers: await authHeaders() });
      setShowCreateDialog(false);
      setCreateForm({ customerName: "", customerEmail: "", customerPhone: "", amount: 0, description: "", dueDate: "", notes: "" });
      fetchData();
    } catch (err) { console.error("[Billing] createPayment:", err); }
    finally { setIsCreating(false); }
  };

  const handleRequestPayment = async (payment: Payment) => {
    setRequestingPaymentId(payment._id); setRequestFeedback(null);
    try {
      await apiClient.post(`/api/payments/${payment._id}/request`, {}, { headers: await authHeaders() });
      setRequestFeedback({ id: payment._id, ok: true, msg: "Payment request sent." });
    } catch (err: any) {
      setRequestFeedback({ id: payment._id, ok: false, msg: err.response?.data?.message || "Failed." });
    } finally {
      setRequestingPaymentId(null);
      setTimeout(() => setRequestFeedback(null), 4000);
    }
  };

  const handleCancelPayment = async (id: string) => {
    try { await apiClient.post(`/api/payments/${id}/cancel`, {}, { headers: await authHeaders() }); fetchData(); }
    catch (err) { console.error("[Billing] cancel:", err); }
  };

  const handleUpdateStatus = async (id: string, status: Payment["status"]) => {
    try { await apiClient.patch(`/api/payments/${id}`, { status }, { headers: await authHeaders() }); fetchData(); }
    catch (err) { console.error("[Billing] updateStatus:", err); }
  };

  const fetchPayoutData = React.useCallback(async () => {
    setPayoutsLoading(true);
    try {
      const headers = await authHeaders();
      const [dRes, pRes, sRes] = await Promise.all([
        apiClient.get("/api/driver-payouts/deliverable", { headers }),
        apiClient.get("/api/driver-payouts",             { headers }),
        apiClient.get("/api/driver-payouts/stats",       { headers }),
      ]);
      setDeliverableShipments(dRes.data.data || []);
      setPayouts(pRes.data.data || []);
      setPayoutStats(sRes.data.data || null);
    } catch (err) { console.error("[Billing] fetchPayouts:", err); }
    finally { setPayoutsLoading(false); }
  }, []);

  React.useEffect(() => { if (billingTab === "driver-payouts") fetchPayoutData(); }, [billingTab, fetchPayoutData]);

  const handleCreatePayout = async () => {
    if (!createPayoutTarget || createPayoutAmount <= 0) return;
    setIsCreatingPayout(true); setPayoutError(null);
    try {
      await apiClient.post("/api/driver-payouts", {
        shipmentId: createPayoutTarget._id, driverId: createPayoutTarget.assignedDriverId._id,
        amount: createPayoutAmount, notes: createPayoutNotes,
      }, { headers: await authHeaders() });
      setCreatePayoutTarget(null); setCreatePayoutAmount(0); setCreatePayoutNotes("");
      fetchPayoutData();
    } catch (err: any) { setPayoutError(err.response?.data?.message || "Failed to send payout"); }
    finally { setIsCreatingPayout(false); }
  };

  const handleConfirmDelivery = async (id: string) => {
    setConfirmingId(id);
    try { await apiClient.post(`/api/shipments/${id}/confirm-delivery`, {}, { headers: await authHeaders() }); fetchPayoutData(); }
    catch (err) { console.error("[Billing] confirmDelivery:", err); }
    finally { setConfirmingId(null); }
  };

  const displayBalance = balance ?? stats?.totalRevenue ?? 0;
  const userId   = authUserId ?? "USR-0000";
  const userName = "Account";

  const tabs = [
    { key: "payments"         as const, Icon: Receipt, label: "Payments" },
    { key: "driver-payouts"   as const, Icon: Users,   label: "Driver Payouts" },
    { key: "awaiting-payment" as const, Icon: Send,    label: "Awaiting Payment", badge: pendingPayments.length },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Share+Tech+Mono&display=swap');
        @keyframes supraSheen { 0%,62%{left:-110%} 100%{left:230%} }
        @keyframes supraSpin  { to{transform:rotate(360deg)} }
      `}</style>

      <div className="dark" style={{ background: PAGE_BG, minHeight: "100%", fontFamily: DISPLAY }}>
        <div style={{ maxWidth: "100%", padding: "20px 20px 40px", overflowY: "auto" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Header */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ height: 3, width: 20, background: ORANGE, borderRadius: 1 }} />
                  <div style={{ height: 3, width: 12, background: "rgba(229,90,0,0.50)", borderRadius: 1 }} />
                </div>
                <h1 style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em", lineHeight: 1 }}>
                  SupraPay
                </h1>
              </div>
              <p style={{ fontFamily: DISPLAY, fontSize: 12, color: "rgba(255,255,255,0.28)", letterSpacing: "0.05em", paddingLeft: 28 }}>
                Manage payments and driver payouts
              </p>
            </div>

            {/* Balance card */}
            <BalanceCard
              balance={displayBalance} userId={userId} userName={userName}
              isLoading={isLoading} stats={stats}
              onReceive={() => setActiveModal("receive")}
              onSend={() => setActiveModal("send")}
            />

            {/* Tab switcher */}
            <div>
              <div style={{ display: "inline-flex", flexWrap: "wrap", gap: 3, padding: 4, background: "#111116", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10 }}>
                {tabs.map(({ key, Icon, label, badge }) => {
                  const active = billingTab === key;
                  return (
                    <button key={key} onClick={() => setBillingTab(key)}
                      style={{
                        display: "flex", alignItems: "center", gap: 7,
                        padding: "8px 16px", borderRadius: 7, border: "none",
                        background: active ? ORANGE : "transparent",
                        color: active ? "white" : "rgba(255,255,255,0.38)",
                        fontFamily: DISPLAY, fontSize: 13, fontWeight: 600,
                        letterSpacing: "0.02em", cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.72)"; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.38)"; }}
                    >
                      <Icon style={{ width: 14, height: 14 }} />
                      {label}
                      {badge !== undefined && badge > 0 && (
                        <span style={{
                          fontFamily: MONO, fontSize: 10, fontWeight: 700,
                          background: active ? "rgba(0,0,0,0.20)" : "rgba(229,90,0,0.18)",
                          color:      active ? "rgba(255,255,255,0.90)" : ORANGE,
                          borderRadius: 10, padding: "1px 7px", marginLeft: 2,
                        }}>
                          {badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payments tab */}
            {billingTab === "payments" && (
              <PaymentsTab
                payments={payments} stats={stats} isLoading={isLoading}
                search={search} statusFilter={statusFilter}
                showCreateDialog={showCreateDialog} createForm={createForm} isCreating={isCreating}
                paymentDetailView={paymentDetailView}
                onSearch={setSearch} onStatusFilter={setStatusFilter} onRefresh={fetchData}
                onShowCreateDialog={setShowCreateDialog} onCreateFormChange={setCreateForm}
                onCreatePayment={handleCreatePayment} onRequestPayment={handleRequestPayment}
                onCancelPayment={handleCancelPayment} onUpdateStatus={handleUpdateStatus}
                onViewDetail={setPaymentDetailView}
              />
            )}

            {/* Driver payouts tab */}
            {billingTab === "driver-payouts" && (
              <DriverPayoutsTab
                deliverableShipments={deliverableShipments} payouts={payouts}
                payoutStats={payoutStats} payoutsLoading={payoutsLoading}
                confirmingId={confirmingId} createPayoutTarget={createPayoutTarget}
                createPayoutAmount={createPayoutAmount} createPayoutNotes={createPayoutNotes}
                payoutError={payoutError} isCreatingPayout={isCreatingPayout}
                onRefresh={fetchPayoutData} onConfirmDelivery={handleConfirmDelivery}
                onSetPayoutTarget={setCreatePayoutTarget} onPayoutAmountChange={setCreatePayoutAmount}
                onPayoutNotesChange={setCreatePayoutNotes}
                onPayoutClose={() => { setCreatePayoutTarget(null); setPayoutError(null); }}
                onCreatePayout={handleCreatePayout}
              />
            )}

            {/* Awaiting payment tab */}
            {billingTab === "awaiting-payment" && (
              <div>
                <p style={{ fontFamily: DISPLAY, fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 16 }}>
                  Customers with outstanding invoices that have not yet been paid.
                </p>
                {isLoading ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} style={{ height: 140, background: "rgba(255,255,255,0.05)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)" }} />
                    ))}
                  </div>
                ) : pendingPayments.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
                    <CheckCircle2 style={{ width: 36, height: 36, color: "#6EE7B7", display: "block", margin: "0 auto 12px" }} />
                    <p style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.70)", marginBottom: 5 }}>All caught up!</p>
                    <p style={{ fontFamily: DISPLAY, fontSize: 13, color: "rgba(255,255,255,0.30)" }}>No pending payments at the moment.</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                    {pendingPayments.map(p => (
                      <AwaitingCard
                        key={p._id} payment={p}
                        isRequesting={requestingPaymentId === p._id}
                        feedback={requestFeedback?.id === p._id ? requestFeedback : null}
                        onRequest={() => handleRequestPayment(p)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      <ReceiveModal open={activeModal === "receive"} userId={userId} userName={userName} onClose={() => setActiveModal(null)} />
      <SendModal open={activeModal === "send"} onClose={() => setActiveModal(null)} onSuccess={fetchData} getToken={getToken} />
    </>
  );
}

function AwaitingCard({ payment, isRequesting, feedback, onRequest }: {
  payment: Payment; isRequesting: boolean;
  feedback: { ok: boolean; msg: string } | null; onRequest: () => void;
}) {
  const [hover,    setHover]    = React.useState(false);
  const [btnHover, setBtnHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: "relative", overflow: "hidden",
        background: hover ? "#111116" : "rgba(255,255,255,0.04)",
        border: `1px solid ${hover ? "rgba(229,90,0,0.22)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 12, padding: "14px 14px 14px 18px",
        transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 10,
      }}
    >
      <div aria-hidden style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: ORANGE, borderRadius: "4px 0 0 4px" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <p style={{ fontFamily: DISPLAY, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 8 }}>
          {payment.customerName}
        </p>
        <p style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", flexShrink: 0 }}>
          {formatCurrency(payment.amount)}
        </p>
      </div>
      <p style={{ fontFamily: DISPLAY, fontSize: 12, color: "rgba(255,255,255,0.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {payment.description}
      </p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <StatusBadge status={payment.status} />
        {payment.dueDate && (
          <span style={{ fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.28)" }}>
            Due {new Date(payment.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
      {feedback ? (
        <p style={{ fontFamily: DISPLAY, fontSize: 12, fontWeight: 600, color: feedback.ok ? "#6EE7B7" : "#FCA5A5" }}>
          {feedback.msg}
        </p>
      ) : (
        <button onClick={onRequest} disabled={isRequesting}
          onMouseEnter={() => setBtnHover(true)} onMouseLeave={() => setBtnHover(false)}
          style={{
            position: "relative", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            width: "100%", padding: "8px 12px", borderRadius: 7,
            background: btnHover && !isRequesting ? "#cf4f00" : ORANGE,
            border: "none", color: "white", cursor: isRequesting ? "not-allowed" : "pointer",
            fontFamily: DISPLAY, fontSize: 13, fontWeight: 600, letterSpacing: "0.03em",
            opacity: isRequesting ? 0.65 : 1, transition: "background 0.14s",
          }}
        >
          {isRequesting
            ? <Loader2 style={{ width: 13, height: 13, animation: "supraSpin 1s linear infinite" }} />
            : <Send style={{ width: 12, height: 12 }} />
          }
          Request Payment
        </button>
      )}
    </div>
  );
}