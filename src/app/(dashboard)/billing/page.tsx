"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient } from "@/lib/api-client";
import { Payment, PaymentStats, CreatePaymentData } from "@/types/billing";
import { DriverPayout, DeliverableShipment, DriverPayoutStats } from "@/types/driver-payout";
import { formatCurrency } from "@/utils/format";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Loader2,
  Receipt,
  Send,
  Users,
} from "lucide-react";

import { StatusBadge } from "@/components/billing/StatusBadges";
import { PaymentsTab } from "@/components/billing/PaymentsTab";
import { DriverPayoutsTab } from "@/components/billing/DriverPayoutsTab";

export default function BillingPage() {
  const { getToken } = useAuth();

  // ── Payments state ──────────────────────────────────────────────
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [pendingPayments, setPendingPayments] = React.useState<Payment[]>([]);
  const [stats, setStats] = React.useState<PaymentStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  // ── Create payment dialog state ─────────────────────────────────
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [createForm, setCreateForm] = React.useState<CreatePaymentData>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    amount: 0,
    description: "",
    dueDate: "",
    notes: "",
  });
  const [isCreating, setIsCreating] = React.useState(false);

  // ── Payment detail modal state ──────────────────────────────────
  const [paymentDetailView, setPaymentDetailView] = React.useState<Payment | null>(null);

  // ── Request payment inline feedback ────────────────────────────
  const [requestingPaymentId, setRequestingPaymentId] = React.useState<string | null>(null);
  const [requestFeedback, setRequestFeedback] = React.useState<{ id: string; ok: boolean; msg: string } | null>(null);

  // ── Tab + driver payout state ───────────────────────────────────
  const [billingTab, setBillingTab] = React.useState<"payments" | "driver-payouts">("payments");
  const [deliverableShipments, setDeliverableShipments] = React.useState<DeliverableShipment[]>([]);
  const [payouts, setPayouts] = React.useState<DriverPayout[]>([]);
  const [payoutStats, setPayoutStats] = React.useState<DriverPayoutStats | null>(null);
  const [payoutsLoading, setPayoutsLoading] = React.useState(false);
  const [createPayoutTarget, setCreatePayoutTarget] = React.useState<DeliverableShipment | null>(null);
  const [createPayoutAmount, setCreatePayoutAmount] = React.useState<number>(0);
  const [createPayoutNotes, setCreatePayoutNotes] = React.useState("");
  const [isCreatingPayout, setIsCreatingPayout] = React.useState(false);
  const [payoutError, setPayoutError] = React.useState<string | null>(null);
  const [confirmingId, setConfirmingId] = React.useState<string | null>(null);

  // ── Helpers ─────────────────────────────────────────────────────
  const authHeaders = async () => {
    const token = await getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // ── Fetch payments ───────────────────────────────────────────────
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = await authHeaders();
      const [paymentsRes, pendingRes, statsRes] = await Promise.all([
        apiClient.get("/api/payments", {
          headers,
          params: { status: statusFilter !== "all" ? statusFilter : undefined, search: search || undefined },
        }),
        apiClient.get("/api/payments/pending", { headers }),
        apiClient.get("/api/payments/stats", { headers }),
      ]);
      setPayments(paymentsRes.data.data.payments || []);
      setPendingPayments(pendingRes.data.data || []);
      setStats(statsRes.data.data || null);
    } catch (err) {
      console.error("[Billing] Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, search]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  // Handle ?tab= URL param on mount
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "driver-payouts") {
      setBillingTab("driver-payouts");
      window.history.replaceState({}, "", "/billing");
    }
  }, []);

  // ── Payment handlers ─────────────────────────────────────────────
  const handleCreatePayment = async () => {
    if (!createForm.customerName || !createForm.customerEmail || !createForm.amount || !createForm.description) return;
    setIsCreating(true);
    try {
      const headers = await authHeaders();
      await apiClient.post("/api/payments", createForm, { headers });
      setShowCreateDialog(false);
      setCreateForm({ customerName: "", customerEmail: "", customerPhone: "", amount: 0, description: "", dueDate: "", notes: "" });
      fetchData();
    } catch (err) {
      console.error("[Billing] Error creating payment:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRequestPayment = async (payment: Payment) => {
    setRequestingPaymentId(payment._id);
    setRequestFeedback(null);
    try {
      const headers = await authHeaders();
      await apiClient.post(`/api/payments/${payment._id}/request`, {}, { headers });
      setRequestFeedback({ id: payment._id, ok: true, msg: "Payment request sent to customer." });
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to send payment request.";
      setRequestFeedback({ id: payment._id, ok: false, msg });
    } finally {
      setRequestingPaymentId(null);
      // Auto-clear feedback after 4s
      setTimeout(() => setRequestFeedback(null), 4000);
    }
  };

  const handleCancelPayment = async (paymentId: string) => {
    try {
      const headers = await authHeaders();
      await apiClient.post(`/api/payments/${paymentId}/cancel`, {}, { headers });
      fetchData();
    } catch (err) {
      console.error("[Billing] Cancel error:", err);
    }
  };

  const handleUpdateStatus = async (paymentId: string, status: Payment["status"]) => {
    try {
      const headers = await authHeaders();
      await apiClient.patch(`/api/payments/${paymentId}`, { status }, { headers });
      fetchData();
    } catch (err) {
      console.error("[Billing] Update status error:", err);
    }
  };

  // ── Driver payout handlers ───────────────────────────────────────
  const fetchPayoutData = React.useCallback(async () => {
    setPayoutsLoading(true);
    try {
      const headers = await authHeaders();
      const [deliverableRes, payoutsRes, statsRes] = await Promise.all([
        apiClient.get("/api/driver-payouts/deliverable", { headers }),
        apiClient.get("/api/driver-payouts", { headers }),
        apiClient.get("/api/driver-payouts/stats", { headers }),
      ]);
      setDeliverableShipments(deliverableRes.data.data || []);
      setPayouts(payoutsRes.data.data || []);
      setPayoutStats(statsRes.data.data || null);
    } catch (err) {
      console.error("[Billing] Error fetching payout data:", err);
    } finally {
      setPayoutsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (billingTab === "driver-payouts") fetchPayoutData();
  }, [billingTab, fetchPayoutData]);

  const handleCreatePayout = async () => {
    if (!createPayoutTarget || createPayoutAmount <= 0) return;
    setIsCreatingPayout(true);
    setPayoutError(null);
    try {
      const headers = await authHeaders();
      await apiClient.post("/api/driver-payouts", {
        shipmentId: createPayoutTarget._id,
        driverId: createPayoutTarget.assignedDriverId._id,
        amount: createPayoutAmount,
        notes: createPayoutNotes,
      }, { headers });
      setCreatePayoutTarget(null);
      setCreatePayoutAmount(0);
      setCreatePayoutNotes("");
      fetchPayoutData();
    } catch (err: any) {
      setPayoutError(err.response?.data?.message || "Failed to send payout");
    } finally {
      setIsCreatingPayout(false);
    }
  };

  const handleConfirmDelivery = async (shipmentId: string) => {
    setConfirmingId(shipmentId);
    try {
      const headers = await authHeaders();
      await apiClient.post(`/api/shipments/${shipmentId}/confirm-delivery`, {}, { headers });
      fetchPayoutData();
    } catch (err) {
      console.error("[Billing] Confirm delivery error:", err);
    } finally {
      setConfirmingId(null);
    }
  };

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden">
      {/* ── Left sidebar: Pending Payments (status display) ── */}
      <aside className="w-full lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-border bg-muted/30 overflow-y-auto shrink-0">
        <div className="p-4 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Receipt className="size-5 text-primary" />
              <h2 className="font-semibold text-foreground">Awaiting Payment</h2>
            </div>
            <Badge variant="secondary" className="font-mono">{pendingPayments.length}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Customers who have pending or failed payments.</p>
        </div>

        <div className="p-3 space-y-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))
          ) : pendingPayments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="size-10 mx-auto mb-3 text-emerald-500" />
              <p className="font-medium">All caught up!</p>
              <p className="text-xs mt-1">No pending payments.</p>
            </div>
          ) : (
            pendingPayments.map((p) => (
              <div
                key={p._id}
                className="w-full text-left p-3 rounded-lg border border-border bg-background space-y-2"
              >
                <div className="flex justify-between items-start">
                  <span className="font-medium text-sm text-foreground truncate max-w-[60%]">{p.customerName}</span>
                  <span className="font-bold text-sm text-foreground">{formatCurrency(p.amount)}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{p.description}</p>
                <div className="flex items-center justify-between">
                  <StatusBadge status={p.status} />
                  {p.dueDate && (
                    <span className="text-[10px] text-muted-foreground">
                      Due {new Date(p.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {/* Request Payment button */}
                {requestFeedback?.id === p._id ? (
                  <p className={`text-xs font-medium ${requestFeedback.ok ? "text-emerald-600" : "text-destructive"}`}>
                    {requestFeedback.msg}
                  </p>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-7 text-xs"
                    disabled={requestingPaymentId === p._id}
                    onClick={() => handleRequestPayment(p)}
                  >
                    {requestingPaymentId === p._id
                      ? <Loader2 className="size-3 mr-1.5 animate-spin" />
                      : <Send className="size-3 mr-1.5" />
                    }
                    Request Payment
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ── Main content area ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 space-y-6">
          {/* Header + tab switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Billing</h1>
              <p className="text-sm text-muted-foreground">Manage payments and driver payouts.</p>
              <div className="flex items-center gap-1 mt-3 p-1 bg-muted rounded-lg w-fit">
                <button
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${billingTab === "payments" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setBillingTab("payments")}
                >
                  Payments
                </button>
                <button
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${billingTab === "driver-payouts" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setBillingTab("driver-payouts")}
                >
                  <Users className="size-3.5" />
                  Driver Payouts
                </button>
              </div>
            </div>
          </div>

          {/* Payments tab */}
          {billingTab === "payments" && (
            <PaymentsTab
              payments={payments}
              stats={stats}
              isLoading={isLoading}
              search={search}
              statusFilter={statusFilter}
              showCreateDialog={showCreateDialog}
              createForm={createForm}
              isCreating={isCreating}
              paymentDetailView={paymentDetailView}
              onSearch={setSearch}
              onStatusFilter={setStatusFilter}
              onRefresh={fetchData}
              onShowCreateDialog={setShowCreateDialog}
              onCreateFormChange={setCreateForm}
              onCreatePayment={handleCreatePayment}
              onRequestPayment={handleRequestPayment}
              onCancelPayment={handleCancelPayment}
              onUpdateStatus={handleUpdateStatus}
              onViewDetail={setPaymentDetailView}
            />
          )}

          {/* Driver Payouts tab */}
          {billingTab === "driver-payouts" && (
            <DriverPayoutsTab
              deliverableShipments={deliverableShipments}
              payouts={payouts}
              payoutStats={payoutStats}
              payoutsLoading={payoutsLoading}
              confirmingId={confirmingId}
              createPayoutTarget={createPayoutTarget}
              createPayoutAmount={createPayoutAmount}
              createPayoutNotes={createPayoutNotes}
              payoutError={payoutError}
              isCreatingPayout={isCreatingPayout}
              onRefresh={fetchPayoutData}
              onConfirmDelivery={handleConfirmDelivery}
              onSetPayoutTarget={setCreatePayoutTarget}
              onPayoutAmountChange={setCreatePayoutAmount}
              onPayoutNotesChange={setCreatePayoutNotes}
              onPayoutClose={() => { setCreatePayoutTarget(null); setPayoutError(null); }}
              onCreatePayout={handleCreatePayout}
            />
          )}
        </div>
      </main>
    </div>
  );
}
