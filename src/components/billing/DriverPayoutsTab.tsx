"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Send,
  Users,
  Wallet,
  UserCheck,
  AlertTriangle,
  ImageIcon,
} from "lucide-react";
import { DriverPayout, DeliverableShipment, DriverPayoutStats } from "@/types/driver-payout";
import { formatCurrency } from "@/utils/format";
import { StatCard, PayoutStatusBadge } from "@/components/billing/StatusBadges";
import { resolveImageUrl } from "@/lib/utils";

/* ================================================================
   CREATE PAYOUT MODAL
   ================================================================ */
function CreatePayoutModal({
  shipment,
  amount,
  notes,
  error,
  isSubmitting,
  onAmountChange,
  onNotesChange,
  onClose,
  onSubmit,
}: {
  shipment: DeliverableShipment | null;
  amount: number;
  notes: string;
  error: string | null;
  isSubmitting: boolean;
  onAmountChange: (v: number) => void;
  onNotesChange: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!shipment) return null;

  const driver = shipment.assignedDriverId;

  return (
    <Dialog open={!!shipment} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="size-4 text-primary" />
            Pay Driver via Stripe
          </DialogTitle>
          <DialogDescription>
            Send a Stripe payout to {driver.name} for shipment {shipment.trackingNumber || shipment._id.slice(-6)}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Driver info */}
          <div className="p-3 rounded-lg border border-border bg-muted/30 flex items-center gap-3">
            <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="size-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{driver.name}</p>
              <p className="text-xs text-muted-foreground">{driver.email}</p>
            </div>
            <div className="ml-auto flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <UserCheck className="size-3.5" />
              Stripe Connected
            </div>
          </div>

          {/* Shipment info */}
          <div className="p-3 rounded-lg border border-border bg-muted/30 text-sm space-y-1">
            <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-1">Shipment</p>
            <p className="font-medium">{shipment.preservedQuoteData?.vehicleName || "Vehicle"}</p>
            <p className="text-xs text-muted-foreground">{shipment.origin} → {shipment.destination}</p>
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="payout-amount">Payout Amount ($) *</Label>
            <Input
              id="payout-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount || ""}
              onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
              className="mt-1"
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="payout-notes">Notes (optional)</Label>
            <Textarea
              id="payout-notes"
              rows={2}
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="e.g. bonus included"
              className="mt-1"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 text-sm text-red-700 dark:text-red-300">
              <AlertTriangle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          <Button
            className="w-full"
            onClick={onSubmit}
            disabled={isSubmitting || amount <= 0}
          >
            {isSubmitting ? (
              <><Loader2 className="size-4 mr-2 animate-spin" />Sending Payout...</>
            ) : (
              <><Send className="size-4 mr-2" />Send {amount > 0 ? formatCurrency(amount) : ""} to Driver</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ================================================================
   DRIVER PAYOUTS TAB PROPS
   ================================================================ */
export interface DriverPayoutsTabProps {
  deliverableShipments: DeliverableShipment[];
  payouts: DriverPayout[];
  payoutStats: DriverPayoutStats | null;
  payoutsLoading: boolean;
  confirmingId: string | null;
  createPayoutTarget: DeliverableShipment | null;
  createPayoutAmount: number;
  createPayoutNotes: string;
  payoutError: string | null;
  isCreatingPayout: boolean;
  onRefresh: () => void;
  onConfirmDelivery: (shipmentId: string) => void;
  onSetPayoutTarget: (s: DeliverableShipment) => void;
  onPayoutAmountChange: (v: number) => void;
  onPayoutNotesChange: (v: string) => void;
  onPayoutClose: () => void;
  onCreatePayout: () => void;
}

/* ================================================================
   DRIVER PAYOUTS TAB
   ================================================================ */
export function DriverPayoutsTab({
  deliverableShipments,
  payouts,
  payoutStats,
  payoutsLoading,
  confirmingId,
  createPayoutTarget,
  createPayoutAmount,
  createPayoutNotes,
  payoutError,
  isCreatingPayout,
  onRefresh,
  onConfirmDelivery,
  onSetPayoutTarget,
  onPayoutAmountChange,
  onPayoutNotesChange,
  onPayoutClose,
  onCreatePayout,
}: DriverPayoutsTabProps) {
  const readyToPay = deliverableShipments.filter(
    (s) => !s.pendingConfirmation && (!s.existingPayout || s.existingPayout.status === "failed")
  );
  const pendingConfirmation = deliverableShipments.filter((s) => s.pendingConfirmation);

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Paid Out"
          value={formatCurrency(payoutStats?.totalPaid || 0)}
          icon={<Wallet className="size-5 text-emerald-600 dark:text-emerald-400" />}
          loading={payoutsLoading}
        />
        <StatCard
          label="Pending Payouts"
          value={formatCurrency(payoutStats?.totalPending || 0)}
          icon={<Clock className="size-5 text-amber-600 dark:text-amber-400" />}
          loading={payoutsLoading}
        />
        <StatCard
          label="Drivers Paid"
          value={String(payoutStats?.countPaid || 0)}
          icon={<UserCheck className="size-5 text-blue-600 dark:text-blue-400" />}
          loading={payoutsLoading}
        />
        <StatCard
          label="Ready to Pay"
          value={String(readyToPay.length)}
          icon={<Send className="size-5 text-indigo-600 dark:text-indigo-400" />}
          loading={payoutsLoading}
        />
      </div>

      {/* Refresh */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className={`size-4 mr-2 ${payoutsLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Section A: Pending Confirmation */}
      {(payoutsLoading || pendingConfirmation.length > 0) && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <ImageIcon className="size-4 text-amber-500" />
            Pending Confirmation
          </h3>
          <Card className="border-amber-200 dark:border-amber-800 shadow-sm overflow-hidden p-0">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-amber-50/50 dark:bg-amber-950/30">
                  <TableRow className="hover:bg-transparent border-amber-200 dark:border-amber-800">
                    <TableHead className="font-semibold">Tracking #</TableHead>
                    <TableHead className="font-semibold">Driver</TableHead>
                    <TableHead className="font-semibold">Vehicle</TableHead>
                    <TableHead className="font-semibold">Proof</TableHead>
                    <TableHead className="font-semibold">Note</TableHead>
                    <TableHead className="font-semibold text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payoutsLoading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <TableRow key={i} className="border-border">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    pendingConfirmation.map((s) => {
                      const imgSrc = resolveImageUrl(s.proofOfDelivery?.imageUrl);
                      return (
                        <TableRow key={s._id} className="border-border hover:bg-muted/50">
                          <TableCell className="font-mono text-xs">{s.trackingNumber || "—"}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{s.assignedDriverId.name}</p>
                              <p className="text-xs text-muted-foreground">{s.assignedDriverId.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{s.preservedQuoteData?.vehicleName || "—"}</TableCell>
                          <TableCell>
                            {imgSrc ? (
                              <a href={imgSrc} target="_blank" rel="noopener noreferrer" className="block">
                                <img
                                  src={imgSrc}
                                  alt="Proof"
                                  className="size-12 rounded object-cover border border-border hover:opacity-80 transition-opacity"
                                />
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                            {s.proofOfDelivery?.note || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-emerald-500 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950"
                              onClick={() => onConfirmDelivery(s._id)}
                              disabled={confirmingId === s._id}
                            >
                              {confirmingId === s._id ? (
                                <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="size-3.5 mr-1.5" />
                              )}
                              Confirm Delivery
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Section B: Ready to Pay */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">Delivered Loads — Ready to Pay</h3>
        <Card className="border-border shadow-sm overflow-hidden p-0">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="font-semibold">Tracking #</TableHead>
                  <TableHead className="font-semibold">Driver</TableHead>
                  <TableHead className="font-semibold">Vehicle</TableHead>
                  <TableHead className="font-semibold">Route</TableHead>
                  <TableHead className="font-semibold">Rate</TableHead>
                  <TableHead className="font-semibold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payoutsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-border">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : readyToPay.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      <CheckCircle2 className="size-8 mx-auto mb-2 text-emerald-500" />
                      All delivered loads have been paid.
                    </TableCell>
                  </TableRow>
                ) : (
                  readyToPay.map((s) => (
                    <TableRow key={s._id} className="border-border hover:bg-muted/50">
                      <TableCell className="font-mono text-xs">{s.trackingNumber || "—"}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{s.assignedDriverId.name}</p>
                          <p className="text-xs text-muted-foreground">{s.assignedDriverId.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{s.preservedQuoteData?.vehicleName || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                        {s.origin} → {s.destination}
                      </TableCell>
                      <TableCell className="font-bold text-emerald-700 dark:text-emerald-400">
                        {s.preservedQuoteData?.rate != null ? formatCurrency(s.preservedQuoteData.rate) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {!s.assignedDriverId.stripeConnectAccountId ? (
                          <span className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                            <AlertTriangle className="size-3 text-amber-500" />
                            No Stripe
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => {
                              onSetPayoutTarget(s);
                              onPayoutAmountChange(s.preservedQuoteData?.rate || 0);
                              onPayoutNotesChange("");
                            }}
                          >
                            <Send className="size-3.5 mr-1.5" />
                            Pay Driver
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Payout History */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">Payout History</h3>
        <Card className="border-border shadow-sm overflow-hidden p-0">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="font-semibold">Payout #</TableHead>
                  <TableHead className="font-semibold">Driver</TableHead>
                  <TableHead className="font-semibold">Shipment</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payoutsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-border">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : payouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No payouts sent yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  payouts.map((p) => {
                    const driver = typeof p.driverId === "object" ? p.driverId : null;
                    const shipment = typeof p.shipmentId === "object" ? p.shipmentId : null;
                    return (
                      <TableRow key={p._id} className="border-border hover:bg-muted/50">
                        <TableCell className="font-mono text-xs">{p.payoutNumber || "—"}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{driver?.name || p.driverName}</p>
                            <p className="text-xs text-muted-foreground">{driver?.email || p.driverEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{shipment?.trackingNumber || "—"}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(p.amount)}</TableCell>
                        <TableCell><PayoutStatusBadge status={p.status} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {p.paidAt
                            ? new Date(p.paidAt).toLocaleDateString()
                            : new Date(p.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Create Payout Modal */}
      <CreatePayoutModal
        shipment={createPayoutTarget}
        amount={createPayoutAmount}
        notes={createPayoutNotes}
        error={payoutError}
        isSubmitting={isCreatingPayout}
        onAmountChange={onPayoutAmountChange}
        onNotesChange={onPayoutNotesChange}
        onClose={onPayoutClose}
        onSubmit={onCreatePayout}
      />
    </div>
  );
}
