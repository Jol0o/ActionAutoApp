"use client";

import * as React from "react";
import { Payment, PaymentStats, CreatePaymentData } from "@/types/billing";
import { formatCurrency } from "@/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DollarSign, Clock, CheckCircle2, Plus, Loader2, Receipt,
  RefreshCw, Ban, ExternalLink, Search, MoreVertical, Send,
} from "lucide-react";
import { StatusBadge, StatCard } from "@/components/billing/StatusBadges";

interface PaymentsTabProps {
  payments: Payment[];
  stats: PaymentStats | null;
  isLoading: boolean;
  search: string;
  statusFilter: string;
  showCreateDialog: boolean;
  createForm: CreatePaymentData;
  isCreating: boolean;
  paymentDetailView: Payment | null;
  onSearch: (v: string) => void;
  onStatusFilter: (v: string) => void;
  onShowCreateDialog: (v: boolean) => void;
  onCreateFormChange: (form: CreatePaymentData) => void;
  onCreatePayment: () => void;
  onRequestPayment: (p: Payment) => void;
  onCancelPayment: (id: string) => void;
  onUpdateStatus: (id: string, status: Payment["status"]) => void;
  onRefresh: () => void;
  onViewDetail: (p: Payment | null) => void;
}

export function PaymentsTab({
  payments, stats, isLoading, search, statusFilter, showCreateDialog, createForm,
  isCreating, paymentDetailView, onSearch, onStatusFilter, onShowCreateDialog,
  onCreateFormChange, onCreatePayment, onRequestPayment, onCancelPayment,
  onUpdateStatus, onRefresh, onViewDetail,
}: PaymentsTabProps) {
  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue"    value={formatCurrency(stats?.totalRevenue || 0)}              icon={<DollarSign className="size-5 text-emerald-600 dark:text-emerald-400" />} loading={isLoading} />
        <StatCard label="Pending Amount"   value={formatCurrency(stats?.pendingAmount || 0)}             icon={<Clock className="size-5 text-amber-600 dark:text-amber-400" />}         loading={isLoading} />
        <StatCard label="Completed"        value={String(stats?.byStatus?.succeeded?.count || 0)}        icon={<CheckCircle2 className="size-5 text-blue-600 dark:text-blue-400" />}      loading={isLoading} />
        <StatCard label="Total Payments"   value={String(stats?.totalCount || 0)}                        icon={<Receipt className="size-5 text-indigo-600 dark:text-indigo-400" />}      loading={isLoading} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search payments..."
            className="pl-9"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={onStatusFilter}>
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
        <Button variant="outline" size="icon" onClick={onRefresh}>
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
                      <TableCell key={j}><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
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
                  <TableRow
                    key={p._id}
                    className="hover:bg-muted/50 border-border cursor-pointer"
                    onClick={() => onViewDetail(p)}
                  >
                    <TableCell className="font-mono text-xs">{p.invoiceNumber || "—"}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{p.customerName}</p>
                        <p className="text-xs text-muted-foreground">{p.customerEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{p.description}</TableCell>
                    <TableCell className="font-bold">{formatCurrency(p.amount)}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {(p.status === "pending" || p.status === "failed") && (
                            <DropdownMenuItem onClick={() => onRequestPayment(p)}>
                              <Send className="size-4 mr-2" />Request Payment
                            </DropdownMenuItem>
                          )}
                          {p.status === "pending" && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => onCancelPayment(p._id)}
                            >
                              <Ban className="size-4 mr-2" />Cancel Payment
                            </DropdownMenuItem>
                          )}
                          {p.receiptUrl && (
                            <DropdownMenuItem asChild>
                              <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="size-4 mr-2" />View Receipt
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                            Change Status
                          </DropdownMenuLabel>
                          {(["pending", "processing", "succeeded", "failed", "refunded", "cancelled"] as Payment["status"][]).map((s) => (
                            <DropdownMenuItem
                              key={s}
                              disabled={p.status === s}
                              onClick={() => onUpdateStatus(p._id, s)}
                              className={`capitalize ${p.status === s ? "font-semibold" : ""}`}
                            >
                              {p.status === s
                                ? <CheckCircle2 className="size-3.5 mr-2 text-emerald-600" />
                                : <span className="size-3.5 mr-2 inline-block" />
                              }
                              {s}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Payment Dialog */}
      <CreatePaymentDialog
        open={showCreateDialog}
        form={createForm}
        isCreating={isCreating}
        onOpenChange={onShowCreateDialog}
        onFormChange={onCreateFormChange}
        onSubmit={onCreatePayment}
      />

      {/* Payment Detail Modal */}
      <PaymentDetailModal payment={paymentDetailView} onClose={() => onViewDetail(null)} />
    </>
  );
}

/* ================================================================
   CREATE PAYMENT DIALOG
   ================================================================ */
function CreatePaymentDialog({ open, form, isCreating, onOpenChange, onFormChange, onSubmit }: {
  open: boolean;
  form: CreatePaymentData;
  isCreating: boolean;
  onOpenChange: (v: boolean) => void;
  onFormChange: (f: CreatePaymentData) => void;
  onSubmit: () => void;
}) {
  const field = (key: keyof CreatePaymentData) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onFormChange({ ...form, [key]: e.target.value }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Payment</DialogTitle>
          <DialogDescription>Add a new pending payment for a customer.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cname">Customer Name *</Label>
              <Input id="cname" placeholder="John Doe" {...field("customerName")} />
            </div>
            <div>
              <Label htmlFor="cemail">Email *</Label>
              <Input id="cemail" type="email" placeholder="john@example.com" {...field("customerEmail")} />
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
                value={form.amount || ""}
                onChange={(e) => onFormChange({ ...form, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="cphone">Phone</Label>
              <Input id="cphone" placeholder="(555) 123-4567" {...field("customerPhone")} />
            </div>
          </div>
          <div>
            <Label htmlFor="cdesc">Description *</Label>
            <Input id="cdesc" placeholder="Vehicle transport - 2024 Toyota Camry" {...field("description")} />
          </div>
          <div>
            <Label htmlFor="cdue">Due Date</Label>
            <Input id="cdue" type="date" {...field("dueDate")} />
          </div>
          <div>
            <Label htmlFor="cnotes">Notes</Label>
            <Textarea id="cnotes" rows={2} placeholder="Optional notes..." {...field("notes")} />
          </div>
          <Button
            onClick={onSubmit}
            disabled={isCreating || !form.customerName || !form.customerEmail || !form.amount || !form.description}
            className="w-full"
          >
            {isCreating ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Plus className="size-4 mr-2" />}
            Create Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ================================================================
   PAYMENT DETAIL MODAL
   ================================================================ */
function PaymentDetailModal({ payment, onClose }: { payment: Payment | null; onClose: () => void }) {
  if (!payment) return null;

  const fmt = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <Dialog open={!!payment} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-lg">Payment Details</DialogTitle>
              <DialogDescription className="font-mono text-xs mt-0.5">
                {payment.invoiceNumber || payment._id}
              </DialogDescription>
            </div>
            <StatusBadge status={payment.status} />
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="p-4 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">Amount</p>
            <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(payment.amount)}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 uppercase">{payment.currency}</p>
          </div>

          <div className="space-y-2 p-4 rounded-lg border border-border bg-muted/30">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer</p>
            <p className="font-semibold text-foreground">{payment.customerName}</p>
            <p className="text-sm text-muted-foreground">{payment.customerEmail}</p>
            {payment.customerPhone && <p className="text-sm text-muted-foreground">{payment.customerPhone}</p>}
          </div>

          <div className="space-y-1 p-4 rounded-lg border border-border bg-muted/30">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</p>
            <p className="text-sm text-foreground">{payment.description}</p>
            {payment.notes && <p className="text-sm text-muted-foreground italic mt-1">{payment.notes}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-border bg-muted/30">
              <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Created</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{fmt(payment.createdAt)}</p>
            </div>
            {payment.dueDate && (
              <div className="p-3 rounded-lg border border-border bg-muted/30">
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Due Date</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{fmt(payment.dueDate)}</p>
              </div>
            )}
            {payment.paidAt && (
              <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/50">
                <p className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">Paid At</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{fmt(payment.paidAt)}</p>
              </div>
            )}
          </div>

          {payment.failureReason && (
            <div className="p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
              <p className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400 mb-1">Failure Reason</p>
              <p className="text-sm text-red-700 dark:text-red-300">{payment.failureReason}</p>
            </div>
          )}

          {payment.receiptUrl && (
            <a
              href={payment.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Receipt className="size-4" />
              View Receipt
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
