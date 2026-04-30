"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/context/ThemeContext";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { apiClient } from "@/lib/api-client";
import { Payment } from "@/types/billing";
import { formatCurrency } from "@/utils/format";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DollarSign, Clock, CheckCircle2, CreditCard, XCircle,
  Loader2, RefreshCw, ArrowRight, ChevronLeft, Receipt, Search,
} from "lucide-react";

import { StatusBadge } from "@/components/billing/StatusBadges";
import { CheckoutForm } from "@/components/billing/CheckoutForm";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

const T = {
  bg: "var(--customer-payments-bg, var(--background))",
  surface: "var(--customer-payments-surface, var(--card))",
  hi: "var(--customer-payments-hi, var(--popover))",
  border: "var(--customer-payments-border, var(--border))",
  borderHi: "var(--customer-payments-border-hi, var(--input))",
  text: "var(--customer-payments-text, var(--foreground))",
  textSub: "var(--customer-payments-text-sub, var(--muted-foreground))",
  textMute: "var(--customer-payments-text-mute, var(--muted-foreground))",
  accent: "#2563EB",
  accentBg: "rgba(37,99,235,0.12)",
  green: "#16A34A",
  greenBg: "rgba(34,197,94,0.12)",
  amber: "#D97706",
  amberBg: "rgba(217,119,6,0.12)",
  red: "#DC2626",
  redBg: "rgba(220,38,38,0.12)",
};

function SummaryCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <div
      style={{
        background: T.surface,
        border: `0.5px solid ${T.border}`,
        borderRadius: 14,
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        <Icon style={{ width: 14, height: 14, color }} />
      </div>
      <p
        style={{
          fontSize: 11,
          color: T.textMute,
          margin: 0,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontWeight: 700,
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: "6px 0 0" }}>
        {value}
      </p>
      <p style={{ fontSize: 11, color: T.textSub, margin: "4px 0 0" }}>{sub}</p>
    </div>
  );
}

interface PaymentStats {
  totalOwed: number;
  totalPaid: number;
  pendingCount: number;
}

type PaymentFilter =
  | "all"
  | "action_required"
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "refunded";

export default function CustomerPaymentsPage() {
  const { theme } = useTheme();
  const { getToken } = useAuth();

  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [stats, setStats] = React.useState<PaymentStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<PaymentFilter>("all");

  // Payment flow state
  const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(null);
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = React.useState(false);
  const [paymentError, setPaymentError] = React.useState<string | null>(null);

  const authHeaders = React.useCallback(async () => {
    const token = await getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [getToken]);

  const fetchPayments = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = await authHeaders();
      const res = await apiClient.get("/api/payments/my-payments", { headers });
      setPayments(res.data.data.payments || []);
      setStats(res.data.data.stats || null);
    } catch (err) {
      console.error("[CustomerPayments] fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [authHeaders]);

  React.useEffect(() => { fetchPayments(); }, [fetchPayments]);

  // Handle Stripe return redirect
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      setPaymentSuccess(true);
      fetchPayments();
      window.history.replaceState({}, "", "/customer/payments");
    }
  }, []);

  const handlePayNow = async (payment: Payment) => {
    setSelectedPayment(payment);
    setClientSecret(null);
    setPaymentSuccess(false);
    setPaymentError(null);
    try {
      const headers = await authHeaders();
      const res = await apiClient.post(
        "/api/payments/create-customer-intent",
        { paymentId: payment._id },
        { headers }
      );
      setClientSecret(res.data.data.clientSecret);
    } catch (err: any) {
      setPaymentError(err.response?.data?.message || "Failed to initialize payment.");
    }
  };

  const handlePaymentSuccess = async (payment: Payment) => {
    try {
      const headers = await authHeaders();
      if (payment.stripePaymentIntentId) {
        await apiClient.post(
          "/api/payments/confirm-customer",
          { paymentIntentId: payment.stripePaymentIntentId },
          { headers }
        );
      }
    } catch {
      // Non-critical
    }
    setPaymentSuccess(true);
    setClientSecret(null);
    fetchPayments();
  };

  const handleBackToList = () => {
    setSelectedPayment(null);
    setClientSecret(null);
    setPaymentSuccess(false);
    setPaymentError(null);
  };

  const stripeOptions: StripeElementsOptions | undefined = clientSecret
    ? {
      clientSecret,
      appearance: {
        theme: "stripe",
        variables: { colorPrimary: "#16a34a", borderRadius: "8px" },
      },
    }
    : undefined;

  const filteredPayments = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    return payments.filter((payment) => {
      if (statusFilter === "action_required") {
        if (payment.status !== "pending" && payment.status !== "failed") return false;
      } else if (statusFilter !== "all" && payment.status !== statusFilter) {
        return false;
      }

      if (!query) return true;

      return (
        payment.description?.toLowerCase().includes(query) ||
        payment.invoiceNumber?.toLowerCase().includes(query) ||
        payment.customerName?.toLowerCase().includes(query) ||
        payment.customerEmail?.toLowerCase().includes(query)
      );
    });
  }, [payments, search, statusFilter]);

  const pending = filteredPayments.filter((p) => p.status === "pending" || p.status === "failed");
  const history = filteredPayments.filter((p) => p.status !== "pending" && p.status !== "failed");
  const actionRequiredAmount = pending.reduce((sum, payment) => sum + payment.amount, 0);
  const totalPaidCount = payments.filter((payment) => payment.status === "succeeded").length;
  const totalPaidAmount = stats?.totalPaid ?? history
    .filter((payment) => payment.status === "succeeded")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const averageInvoice = payments.length
    ? payments.reduce((sum, payment) => sum + payment.amount, 0) / payments.length
    : 0;
  const statusCounts = React.useMemo(
    () => ({
      all: payments.length,
      action_required: payments.filter(
        (payment) => payment.status === "pending" || payment.status === "failed",
      ).length,
      pending: payments.filter((payment) => payment.status === "pending").length,
      processing: payments.filter((payment) => payment.status === "processing").length,
      succeeded: payments.filter((payment) => payment.status === "succeeded").length,
      failed: payments.filter((payment) => payment.status === "failed").length,
      cancelled: payments.filter((payment) => payment.status === "cancelled").length,
      refunded: payments.filter((payment) => payment.status === "refunded").length,
    }),
    [payments],
  );

  const fmt = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  // ── Payment flow view ──────────────────────────────────────────
  if (selectedPayment && !paymentSuccess) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <button
          onClick={handleBackToList}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="size-4" />
          Back to Payments
        </button>

        <Card className="border-border shadow-lg">
          <CardHeader className="border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600/10 rounded-lg">
                <CreditCard className="size-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Complete Your Payment</CardTitle>
                <CardDescription>
                  {selectedPayment.invoiceNumber || "Invoice"} &middot; {selectedPayment.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {paymentError ? (
              <div className="text-center py-8 space-y-4">
                <XCircle className="size-12 mx-auto text-destructive" />
                <p className="text-destructive font-medium">{paymentError}</p>
                <Button variant="outline" onClick={() => handlePayNow(selectedPayment)}>
                  <RefreshCw className="size-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : !clientSecret ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-8 text-green-600 animate-spin" />
              </div>
            ) : (
              <Elements stripe={stripePromise} options={stripeOptions}>
                <CheckoutForm
                  payment={selectedPayment}
                  onSuccess={handlePaymentSuccess}
                  onError={(msg) => setPaymentError(msg)}
                />
              </Elements>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Payment success ────────────────────────────────────────────
  if (paymentSuccess) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <Card className="border-emerald-200 dark:border-emerald-800 shadow-lg">
          <CardContent className="p-8 text-center space-y-4">
            <div className="size-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
              <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Payment Successful!</h2>
            <p className="text-muted-foreground">Your payment has been processed successfully.</p>
            <Button onClick={handleBackToList} className="mt-4">
              <ArrowRight className="size-4 mr-2" />
              Back to Payments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main view ──────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes pageFade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ background: T.bg, minHeight: "100%", colorScheme: theme }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 20px 60px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <Link
              href="/customer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: T.textMute,
                textDecoration: "none",
                fontSize: 12,
              }}
            >
              <ChevronLeft style={{ width: 14, height: 14 }} /> Home
            </Link>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: T.text }}>My Payments</h1>
          </div>

          <section
            style={{
              animation: "pageFade 0.35s ease both",
              background: T.surface,
              border: `0.5px solid ${T.border}`,
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between" }}>
              <div style={{ maxWidth: 720 }}>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: T.textMute,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    fontFamily: "var(--font-mono)",
                    margin: "0 0 10px",
                  }}
                >
                  Billing overview
                </p>
                <h2 style={{ fontSize: 30, lineHeight: 1.1, fontWeight: 700, color: T.text, margin: 0 }}>
                  Track invoices, payment status, and history in one place.
                </h2>
                <p style={{ fontSize: 13, color: T.textSub, margin: "10px 0 0", maxWidth: 640 }}>
                  This page now follows the same card-based hierarchy as the main payments dashboard,
                  so the layout feels consistent and easier to scan.
                </p>
              </div>

              <div
                style={{
                  minWidth: 240,
                  display: "grid",
                  gap: 8,
                  alignContent: "start",
                }}
              >
                <div
                  style={{
                    borderRadius: 12,
                    background: T.accentBg,
                    color: T.accent,
                    padding: "10px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {stats?.pendingCount ?? pending.length} invoices need attention
                </div>
                <div
                  style={{
                    borderRadius: 12,
                    background: T.greenBg,
                    color: T.green,
                    padding: "10px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {totalPaidCount} completed payments recorded
                </div>
              </div>
            </div>
          </section>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <SummaryCard
              label="Amount Owed"
              value={formatCurrency(stats?.totalOwed ?? actionRequiredAmount)}
              sub={`${pending.length} invoices due`}
              icon={Clock}
              color={T.amber}
              bg={T.amberBg}
            />
            <SummaryCard
              label="Total Paid"
              value={formatCurrency(totalPaidAmount)}
              sub={`${totalPaidCount} completed payments`}
              icon={CheckCircle2}
              color={T.green}
              bg={T.greenBg}
            />
            <SummaryCard
              label="Open Invoices"
              value={String(stats?.pendingCount ?? pending.length)}
              sub="Need your action"
              icon={Receipt}
              color={T.red}
              bg={T.redBg}
            />
            <SummaryCard
              label="Average Invoice"
              value={formatCurrency(averageInvoice)}
              sub={`${payments.length} total invoices`}
              icon={DollarSign}
              color={T.accent}
              bg={T.accentBg}
            />
          </div>

          <section
            style={{
              background: T.surface,
              border: `0.5px solid ${T.border}`,
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                padding: 14,
                alignItems: "center",
                borderBottom: `0.5px solid ${T.border}`,
              }}
            >
              <div style={{ position: "relative", flex: "1 1 280px", maxWidth: 420 }}>
                <Search
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 14,
                    height: 14,
                    color: T.textMute,
                  }}
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search invoice, description, or customer..."
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    paddingLeft: 34,
                    paddingRight: 12,
                    paddingTop: 10,
                    paddingBottom: 10,
                    background: T.hi,
                    border: `0.5px solid ${T.borderHi}`,
                    borderRadius: 10,
                    color: T.text,
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>

              <button
                type="button"
                onClick={fetchPayments}
                style={{
                  marginLeft: "auto",
                  padding: "9px 11px",
                  background: "transparent",
                  border: `0.5px solid ${T.border}`,
                  borderRadius: 10,
                  cursor: "pointer",
                  color: T.textMute,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <RefreshCw style={{ width: 13, height: 13 }} />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                padding: 10,
                borderBottom: `0.5px solid ${T.border}`,
                overflowX: "auto",
              }}
            >
              {(
                [
                  "all",
                  "action_required",
                  "pending",
                  "processing",
                  "succeeded",
                  "failed",
                  "cancelled",
                  "refunded",
                ] as PaymentFilter[]
              ).map((status) => {
                const active = statusFilter === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: `0.5px solid ${active ? "#3B82F6" : "transparent"}`,
                      background: active ? "rgba(59,130,246,0.14)" : "transparent",
                      color: active ? "#3B82F6" : T.textSub,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      textTransform: "capitalize",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {status.replace("_", " ")} ({statusCounts[status] ?? 0})
                  </button>
                );
              })}
            </div>
          </section>

          <div style={{ display: "grid", gap: 16 }}>
            <Card
              style={{
                background: T.surface,
                border: `0.5px solid ${T.border}`,
                borderRadius: 16,
                overflow: "hidden",
                padding: 0,
              }}
            >
              <CardHeader style={{ padding: "16px 16px 14px", borderBottom: `0.5px solid ${T.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div>
                    <CardTitle>Pending Invoices</CardTitle>
                    <CardDescription>
                      {pending.length ? `${pending.length} invoices need payment` : "No pending invoices right now."}
                    </CardDescription>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: T.amber,
                      background: T.amberBg,
                      borderRadius: 999,
                      padding: "6px 10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatCurrency(actionRequiredAmount)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="font-semibold">Invoice #</TableHead>
                      <TableHead className="font-semibold">Description</TableHead>
                      <TableHead className="font-semibold">Amount</TableHead>
                      <TableHead className="font-semibold">Due Date</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 2 }).map((_, i) => (
                        <TableRow key={i} className="border-border">
                          {Array.from({ length: 6 }).map((_, j) => (
                            <TableCell key={j}><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : pending.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          <CheckCircle2 className="size-8 mx-auto mb-2 text-emerald-500" />
                          No pending invoices. You're all caught up!
                        </TableCell>
                      </TableRow>
                    ) : (
                      pending.map((p) => (
                        <TableRow key={p._id} className="border-border hover:bg-muted/50">
                          <TableCell className="font-mono text-xs">{p.invoiceNumber || "—"}</TableCell>
                          <TableCell className="text-sm max-w-50 truncate">{p.description}</TableCell>
                          <TableCell className="font-bold text-amber-700 dark:text-amber-400">
                            {formatCurrency(p.amount)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{fmt(p.dueDate)}</TableCell>
                          <TableCell><StatusBadge status={p.status} /></TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" onClick={() => handlePayNow(p)}>
                              <CreditCard className="size-3.5 mr-1.5" />
                              Pay Now
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card
              style={{
                background: T.surface,
                border: `0.5px solid ${T.border}`,
                borderRadius: 16,
                overflow: "hidden",
                padding: 0,
              }}
            >
              <CardHeader style={{ padding: "16px 16px 14px", borderBottom: `0.5px solid ${T.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div>
                    <CardTitle>Payment History</CardTitle>
                    <CardDescription>
                      {history.length ? `${history.length} completed or archived payments` : "No payment history yet."}
                    </CardDescription>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: T.green,
                      background: T.greenBg,
                      borderRadius: 999,
                      padding: "6px 10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatCurrency(totalPaidAmount)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="font-semibold">Invoice #</TableHead>
                      <TableHead className="font-semibold">Description</TableHead>
                      <TableHead className="font-semibold">Amount</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i} className="border-border">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <TableCell key={j}><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : history.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          No payment history yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      history.map((p) => (
                        <TableRow key={p._id} className="border-border hover:bg-muted/50">
                          <TableCell className="font-mono text-xs">{p.invoiceNumber || "—"}</TableCell>
                          <TableCell className="text-sm max-w-50 truncate">{p.description}</TableCell>
                          <TableCell className={`font-bold ${p.status === "succeeded" ? "text-emerald-700 dark:text-emerald-400" : ""}`}>
                            {formatCurrency(p.amount)}
                          </TableCell>
                          <TableCell><StatusBadge status={p.status} /></TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {fmt(p.paidAt || p.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
