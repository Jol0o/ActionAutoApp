"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
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
  Loader2, RefreshCw, ArrowRight, ChevronLeft, Receipt,
} from "lucide-react";

import { StatusBadge, StatCard } from "@/components/billing/StatusBadges";
import { CheckoutForm } from "@/components/billing/CheckoutForm";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

interface PaymentStats {
  totalOwed: number;
  totalPaid: number;
  pendingCount: number;
}

export default function CustomerPaymentsPage() {
  const { getToken } = useAuth();

  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [stats, setStats] = React.useState<PaymentStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Payment flow state
  const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(null);
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = React.useState(false);
  const [paymentError, setPaymentError] = React.useState<string | null>(null);

  const authHeaders = async () => {
    const token = await getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

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
  }, []);

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

  const pending = payments.filter((p) => p.status === "pending" || p.status === "failed");
  const history = payments.filter((p) => p.status !== "pending" && p.status !== "failed");

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
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Payments</h1>
        <p className="text-sm text-muted-foreground">View your invoices and payment history.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Amount Owed"
          value={formatCurrency(stats?.totalOwed || 0)}
          icon={<Clock className="size-5 text-amber-600 dark:text-amber-400" />}
          loading={isLoading}
        />
        <StatCard
          label="Total Paid"
          value={formatCurrency(stats?.totalPaid || 0)}
          icon={<DollarSign className="size-5 text-emerald-600 dark:text-emerald-400" />}
          loading={isLoading}
        />
        <StatCard
          label="Pending Invoices"
          value={String(stats?.pendingCount || 0)}
          icon={<Receipt className="size-5 text-indigo-600 dark:text-indigo-400" />}
          loading={isLoading}
        />
      </div>

      {/* Pending Payments */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-2">Pending Invoices</h2>
        <Card className="border-border shadow-sm overflow-hidden p-0">
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
                      <TableCell className="text-sm max-w-[200px] truncate">{p.description}</TableCell>
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
      </div>

      {/* Payment History */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-2">Payment History</h2>
        <Card className="border-border shadow-sm overflow-hidden p-0">
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
                      <TableCell className="text-sm max-w-[200px] truncate">{p.description}</TableCell>
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
  );
}
