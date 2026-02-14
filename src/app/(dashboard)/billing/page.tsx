"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient } from "@/lib/api-client";
import { Payment, PaymentStats, CreatePaymentData } from "@/types/billing";
import { formatCurrency } from "@/utils/format";

import { loadStripe, Stripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Loader2,
  Receipt,
  ArrowRight,
  RefreshCw,
  Ban,
  ExternalLink,
  Search,
  ChevronLeft,
} from "lucide-react";

// Load Stripe outside of component to avoid re-creating on re-render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

/* ================================================================
   STRIPE CHECKOUT FORM (rendered inside <Elements>)
   ================================================================ */
function CheckoutForm({
  payment,
  onSuccess,
  onError,
}: {
  payment: Payment;
  onSuccess: (payment: Payment) => void;
  onError: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/billing?success=true`,
      },
      redirect: "if_required",
    });

    if (error) {
      setMessage(error.message || "An unexpected error occurred.");
      onError(error.message || "Payment failed");
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess(payment);
    } else {
      setMessage("Payment is being processed...");
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-muted-foreground">Amount Due</span>
          <span className="text-2xl font-bold text-foreground">
            {formatCurrency(payment.amount)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{payment.description}</p>
      </div>

      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      {message && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {message}
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isProcessing || !stripe || !elements}
        className="w-full h-12 text-base font-semibold"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="size-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="size-5 mr-2" />
            Pay {formatCurrency(payment.amount)}
          </>
        )}
      </Button>
    </div>
  );
}

/* ================================================================
   MAIN BILLING PAGE
   ================================================================ */
export default function BillingPage() {
  const { getToken } = useAuth();

  // Data state
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [pendingPayments, setPendingPayments] = React.useState<Payment[]>([]);
  const [stats, setStats] = React.useState<PaymentStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  // Payment flow state
  const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(null);
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = React.useState(false);
  const [paymentError, setPaymentError] = React.useState<string | null>(null);

  // Create payment dialog
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

  // Helpers
  const authHeaders = async () => {
    const token = await getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch all data
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

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Check for return from Stripe redirect
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      setPaymentSuccess(true);
      fetchData();
      // Clean URL
      window.history.replaceState({}, "", "/billing");
    }
  }, []);

  // Create new payment
  const handleCreatePayment = async () => {
    if (!createForm.customerName || !createForm.customerEmail || !createForm.amount || !createForm.description) return;
    setIsCreating(true);
    try {
      const headers = await authHeaders();
      await apiClient.post("/api/payments", createForm, { headers });
      setShowCreateDialog(false);
      setCreateForm({ customerName: "", customerEmail: "", customerPhone: "", amount: 0, description: "", dueDate: "", notes: "" });
      fetchData();
    } catch (err: any) {
      console.error("[Billing] Error creating payment:", err);
    } finally {
      setIsCreating(false);
    }
  };

  // Start payment flow
  const handleStartPayment = async (payment: Payment) => {
    setSelectedPayment(payment);
    setClientSecret(null);
    setPaymentSuccess(false);
    setPaymentError(null);

    try {
      const headers = await authHeaders();
      const res = await apiClient.post("/api/payments/create-intent", { paymentId: payment._id }, { headers });
      setClientSecret(res.data.data.clientSecret);
    } catch (err: any) {
      setPaymentError(err.response?.data?.message || "Failed to initialize payment");
    }
  };

  // Confirm payment success
  const handlePaymentSuccess = async (payment: Payment) => {
    try {
      const headers = await authHeaders();
      if (payment.stripePaymentIntentId) {
        await apiClient.post("/api/payments/confirm", { paymentIntentId: payment.stripePaymentIntentId }, { headers });
      }
    } catch {
      // Non-critical
    }
    setPaymentSuccess(true);
    setClientSecret(null);
    fetchData();
  };

  // Cancel payment
  const handleCancelPayment = async (paymentId: string) => {
    try {
      const headers = await authHeaders();
      await apiClient.post(`/api/payments/${paymentId}/cancel`, {}, { headers });
      fetchData();
    } catch (err: any) {
      console.error("[Billing] Cancel error:", err);
    }
  };

  // Back from payment form
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
          variables: {
            colorPrimary: "#2563eb",
            borderRadius: "8px",
          },
        },
      }
    : undefined;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden">
      {/* ============================================
          LEFT SIDEBAR - Pending Payments
          ============================================ */}
      <aside className="w-full lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-border bg-muted/30 overflow-y-auto shrink-0">
        <div className="p-4 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Receipt className="size-5 text-primary" />
              <h2 className="font-semibold text-foreground">Complete the Payment</h2>
            </div>
            <Badge variant="secondary" className="font-mono">
              {pendingPayments.length}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Pending and failed payments awaiting processing.
          </p>
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
              <button
                key={p._id}
                onClick={() => handleStartPayment(p)}
                className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-md ${
                  selectedPayment?._id === p._id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <span className="font-medium text-sm text-foreground truncate max-w-[60%]">
                    {p.customerName}
                  </span>
                  <span className="font-bold text-sm text-foreground">
                    {formatCurrency(p.amount)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mb-2">{p.description}</p>
                <div className="flex items-center justify-between">
                  <StatusBadge status={p.status} />
                  {p.dueDate && (
                    <span className="text-[10px] text-muted-foreground">
                      Due {new Date(p.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ============================================
          MAIN CONTENT AREA
          ============================================ */}
      <main className="flex-1 overflow-y-auto">
        {/* Payment Flow View */}
        {selectedPayment && !paymentSuccess ? (
          <div className="max-w-lg mx-auto p-6">
            <button
              onClick={handleBackToList}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ChevronLeft className="size-4" />
              Back to Billing
            </button>

            <Card className="border-border shadow-lg">
              <CardHeader className="border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <CreditCard className="size-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Process Payment</CardTitle>
                    <CardDescription>
                      {selectedPayment.invoiceNumber || "Payment"} &middot; {selectedPayment.customerName}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {paymentError ? (
                  <div className="text-center py-8 space-y-4">
                    <XCircle className="size-12 mx-auto text-destructive" />
                    <p className="text-destructive font-medium">{paymentError}</p>
                    <Button variant="outline" onClick={() => handleStartPayment(selectedPayment)}>
                      <RefreshCw className="size-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                ) : !clientSecret ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-8 text-primary animate-spin" />
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
        ) : paymentSuccess ? (
          /* Success State */
          <div className="max-w-lg mx-auto p-6">
            <Card className="border-emerald-200 dark:border-emerald-800 shadow-lg">
              <CardContent className="p-8 text-center space-y-4">
                <div className="size-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                  <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Payment Successful!</h2>
                <p className="text-muted-foreground">
                  The payment has been processed and the customer record has been updated.
                </p>
                <Button onClick={handleBackToList} className="mt-4">
                  <ArrowRight className="size-4 mr-2" />
                  Back to Billing
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Default: Dashboard + Payment List */
          <div className="p-4 sm:p-6 space-y-6">
            {/* Stats Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Billing</h1>
                <p className="text-sm text-muted-foreground">Manage customer payments and invoices.</p>
              </div>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="size-4 mr-2" />
                    New Payment
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Payment</DialogTitle>
                    <DialogDescription>Add a new pending payment for a customer.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="cname">Customer Name *</Label>
                        <Input
                          id="cname"
                          value={createForm.customerName}
                          onChange={(e) => setCreateForm((f) => ({ ...f, customerName: e.target.value }))}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cemail">Email *</Label>
                        <Input
                          id="cemail"
                          type="email"
                          value={createForm.customerEmail}
                          onChange={(e) => setCreateForm((f) => ({ ...f, customerEmail: e.target.value }))}
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="camount">Amount ($) *</Label>
                        <Input
                          id="camount"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={createForm.amount || ""}
                          onChange={(e) => setCreateForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cphone">Phone</Label>
                        <Input
                          id="cphone"
                          value={createForm.customerPhone}
                          onChange={(e) => setCreateForm((f) => ({ ...f, customerPhone: e.target.value }))}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="cdesc">Description *</Label>
                      <Input
                        id="cdesc"
                        value={createForm.description}
                        onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Vehicle transport - 2024 Toyota Camry"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cdue">Due Date</Label>
                      <Input
                        id="cdue"
                        type="date"
                        value={createForm.dueDate}
                        onChange={(e) => setCreateForm((f) => ({ ...f, dueDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cnotes">Notes</Label>
                      <Textarea
                        id="cnotes"
                        rows={2}
                        value={createForm.notes}
                        onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
                        placeholder="Optional notes..."
                      />
                    </div>
                    <Button
                      onClick={handleCreatePayment}
                      disabled={isCreating || !createForm.customerName || !createForm.customerEmail || !createForm.amount || !createForm.description}
                      className="w-full"
                    >
                      {isCreating ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Plus className="size-4 mr-2" />}
                      Create Payment
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Revenue"
                value={formatCurrency(stats?.totalRevenue || 0)}
                icon={<DollarSign className="size-5 text-emerald-600 dark:text-emerald-400" />}
                loading={isLoading}
              />
              <StatCard
                label="Pending Amount"
                value={formatCurrency(stats?.pendingAmount || 0)}
                icon={<Clock className="size-5 text-amber-600 dark:text-amber-400" />}
                loading={isLoading}
              />
              <StatCard
                label="Completed"
                value={String(stats?.byStatus?.succeeded?.count || 0)}
                icon={<CheckCircle2 className="size-5 text-blue-600 dark:text-blue-400" />}
                loading={isLoading}
              />
              <StatCard
                label="Total Payments"
                value={String(stats?.totalCount || 0)}
                icon={<Receipt className="size-5 text-indigo-600 dark:text-indigo-400" />}
                loading={isLoading}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="succeeded">Succeeded</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchData}>
                <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {/* Payments Table */}
            <Card className="border-border shadow-sm overflow-hidden p-0">
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="font-semibold">Invoice</TableHead>
                      <TableHead className="font-semibold">Customer</TableHead>
                      <TableHead className="font-semibold">Description</TableHead>
                      <TableHead className="font-semibold">Amount</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <TableRow key={i} className="border-border">
                          {Array.from({ length: 7 }).map((_, j) => (
                            <TableCell key={j}>
                              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          No payments found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      payments.map((p) => (
                        <TableRow key={p._id} className="hover:bg-muted/50 border-border">
                          <TableCell className="font-mono text-xs">{p.invoiceNumber || "—"}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{p.customerName}</p>
                              <p className="text-xs text-muted-foreground">{p.customerEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm">{p.description}</TableCell>
                          <TableCell className="font-bold">{formatCurrency(p.amount)}</TableCell>
                          <TableCell>
                            <StatusBadge status={p.status} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {(p.status === "pending" || p.status === "failed") && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleStartPayment(p)}
                                >
                                  <CreditCard className="size-3.5 mr-1" />
                                  Pay
                                </Button>
                              )}
                              {p.status === "pending" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCancelPayment(p._id)}
                                >
                                  <Ban className="size-3.5" />
                                </Button>
                              )}
                              {p.receiptUrl && (
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="size-3.5" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

/* ================================================================
   HELPER COMPONENTS
   ================================================================ */

function StatusBadge({ status }: { status: Payment["status"] }) {
  const config: Record<string, { color: string; icon: React.ReactNode }> = {
    pending: {
      color: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      icon: <Clock className="size-3" />,
    },
    processing: {
      color: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      icon: <Loader2 className="size-3 animate-spin" />,
    },
    succeeded: {
      color: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      icon: <CheckCircle2 className="size-3" />,
    },
    failed: {
      color: "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
      icon: <XCircle className="size-3" />,
    },
    refunded: {
      color: "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      icon: <RefreshCw className="size-3" />,
    },
    cancelled: {
      color: "bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
      icon: <Ban className="size-3" />,
    },
  };

  const c = config[status] || config.pending;

  return (
    <Badge variant="outline" className={`gap-1 capitalize ${c.color}`}>
      {c.icon}
      {status}
    </Badge>
  );
}

function StatCard({
  label,
  value,
  icon,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  loading: boolean;
}) {
  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-muted rounded-lg">{icon}</div>
          {loading && <Loader2 className="size-3 text-muted-foreground animate-spin" />}
        </div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}