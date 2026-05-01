"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { apiClient } from "@/lib/api-client";
import {
  FileText,
  Archive,
  MapPin,
  CreditCard,
  Truck,
  CheckSquare,
  Loader2,
  AlertCircle,
  Calendar,
  Database,
  Users,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/format";
import { Payment } from "@/types/billing";
import { DriverPayout } from "@/types/driver-payout";
import { ReportCard } from "@/components/reports/ReportCard";
import { EmptyState } from "@/components/reports/EmptyState";
import { ReportPreviewModal } from "@/components/reports/ReportPreviewModal";
import { ReportsAnalytics } from "@/components/reports/ReportsAnalytics";
import {
  Quote as TransportQuote,
  Shipment as TransportShipment,
} from "@/types/transportation";
import {
  TransportationAnalytics,
  TransportationPreviewModal,
  generateShipmentReportPdf,
  generateQuoteReportPdf,
  buildShipmentSummary,
  buildQuoteSummary,
  fmtCurrency as transportFmtCurrency,
  fmtNumber,
} from "@/components/reports/transportation";
import {
  saveGeneratedReportFile,
  type ReportFileCategory,
} from "@/lib/report-files";
import {
  loadLogoBase64,
  generateDocId,
  formatGeneratedAt,
  embedFonts,
  drawReportPageHeader,
  drawContinuedLabel,
  drawSectionTitle,
  drawEmptyState,
  drawSummaryCards,
  applyFootersToAllPages,
  TABLE_BODY_STYLES,
  TABLE_HEAD_STYLES_PRIMARY,
  TABLE_HEAD_STYLES_SECONDARY,
  TABLE_ALTERNATE_ROW,
  TABLE_BODY_ROW,
} from "@/utils/reportPdfTemplate";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabValue = "ALL" | "Transportation" | "Driver Reports" | "Billings";

interface AssignedDriver {
  _id: string;
  name: string;
  email: string;
}

interface Shipment {
  _id: string;
  status:
    | "Available for Pickup"
    | "Cancelled"
    | "Delivered"
    | "Dispatched"
    | "In-Route";
  origin: string;
  destination: string;
  trackingNumber?: string;
  pickedUp?: string;
  delivered?: string;
  assignedDriverId?: AssignedDriver | string | null;
  assignedAt?: string;
  proofOfDelivery?: { submittedAt?: string; confirmedAt?: string };
  preservedQuoteData?: {
    firstName?: string;
    lastName?: string;
    vehicleName?: string;
    rate?: number;
  };
  createdAt: string;
}

interface ReportData {
  shipments: Shipment[]; // already month-filtered
  payments: Payment[]; // already month-filtered
  payouts: DriverPayout[]; // already month-filtered
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function driverName(s: Shipment): string {
  if (!s.assignedDriverId) return "—";
  if (typeof s.assignedDriverId === "object")
    return s.assignedDriverId.name || "—";
  return "—";
}

function customerName(s: Shipment): string {
  return (
    [s.preservedQuoteData?.firstName, s.preservedQuoteData?.lastName]
      .filter(Boolean)
      .join(" ") || "—"
  );
}

function calcDuration(pickedUp?: string, delivered?: string): string {
  if (!pickedUp || !delivered) return "—";
  const diff = new Date(delivered).getTime() - new Date(pickedUp).getTime();
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtDate(d?: string): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// ─── PDF generators ───────────────────────────────────────────────────────────

async function generateDriverReportPdf(
  data: ReportData,
  monthLabel: string,
): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "landscape" });

  const assigned = data.shipments.filter((s) => s.assignedDriverId != null);
  const driverMap = new Map<string, { name: string; loads: Shipment[] }>();
  assigned.forEach((s) => {
    const d =
      typeof s.assignedDriverId === "object" ? s.assignedDriverId : null;
    if (!d) return;
    if (!driverMap.has(d._id))
      driverMap.set(d._id, { name: d.name, loads: [] });
    driverMap.get(d._id)!.loads.push(s);
  });

  const delivered = assigned.filter((s) => s.status === "Delivered").length;
  const approved = assigned.filter(
    (s) => !!s.proofOfDelivery?.confirmedAt,
  ).length;
  const pendingApproval = assigned.filter(
    (s) => s.proofOfDelivery?.submittedAt && !s.proofOfDelivery?.confirmedAt,
  ).length;

  const logoBase64 = await loadLogoBase64();
  const docId = generateDocId("DRV");
  const generatedAt = new Date();
  const generatedAtLabel = formatGeneratedAt(generatedAt);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const left = 14;
  const right = pageWidth - 14;
  const contentWidth = right - left;

  const hOpts = (sub?: string) => ({
    reportTitle: "Driver Reports",
    periodLabel: monthLabel,
    subtitle: sub,
    logoBase64,
    pageWidth,
    left,
    right,
  });
  const sOpts = (title: string, y: number) => ({ title, y, left, right });
  const eOpts = (y: number, msg: string, sub: string) => ({
    y,
    message: msg,
    sub,
    left,
    right,
    contentWidth,
    pageWidth,
  });
  const footerOpts = {
    docId,
    generatedAtLabel,
    reportTitle: "Driver Reports",
    pageWidth,
    pageHeight,
    left,
    right,
  };

  // ── Page 1: Summary + Assigned Loads ──────────────────────────────────────
  drawReportPageHeader(doc, hOpts());
  drawSectionTitle(doc, sOpts("Summary", 31));

  const cardBottomY = drawSummaryCards(doc, {
    cards: [
      { label: "Total Drivers", value: String(driverMap.size) },
      { label: "Assigned Loads", value: String(assigned.length) },
      { label: "Delivered", value: String(delivered) },
      { label: "Pending Approval", value: String(pendingApproval) },
      { label: "Dealer Approved", value: String(approved) },
    ],
    y: 34,
    left,
    contentWidth,
  });

  const s1TitleY = cardBottomY + 10;
  drawSectionTitle(doc, sOpts("Assigned Loads", s1TitleY));

  if (assigned.length === 0) {
    drawEmptyState(
      doc,
      eOpts(
        s1TitleY + 4,
        "No loads assigned this period.",
        "Loads will appear here once drivers are assigned.",
      ),
    );
  } else {
    autoTable(doc, {
      startY: s1TitleY + 3,
      head: [
        [
          "Driver",
          "Vehicle",
          "Customer",
          "Origin",
          "Destination",
          "Pick-Up Date",
          "Delivered",
          "Duration",
          "Status",
          "Dealer Approved",
        ],
      ],
      body: assigned.map((s) => [
        driverName(s),
        s.preservedQuoteData?.vehicleName || "—",
        customerName(s),
        s.origin || "—",
        s.destination || "—",
        fmtDate(s.pickedUp),
        fmtDate(s.delivered),
        calcDuration(s.pickedUp, s.delivered),
        s.status,
        s.proofOfDelivery?.confirmedAt
          ? "Approved"
          : s.proofOfDelivery?.submittedAt
            ? "Pending"
            : "—",
      ]),
      margin: { left, right: 14, bottom: 20, top: 30 },
      styles: TABLE_BODY_STYLES,
      headStyles: TABLE_HEAD_STYLES_PRIMARY,
      alternateRowStyles: TABLE_ALTERNATE_ROW,
      bodyStyles: TABLE_BODY_ROW,
      columnStyles: {
        5: { halign: "right" },
        6: { halign: "right" },
        7: { halign: "right" },
      },
      didDrawPage: (data: any) => {
        if (data.pageNumber > 1) {
          drawReportPageHeader(doc, hOpts("Driver Reports (continued)"));
          drawContinuedLabel(doc, right);
        }
      },
    });
  }

  // ── Page 2: Analytics ─────────────────────────────────────────────────────
  doc.addPage();
  drawReportPageHeader(doc, hOpts("Driver Reports • Analytics"));
  drawSectionTitle(doc, sOpts("Per-Driver Summary", 31));

  const driverRows = Array.from(driverMap.values()).map(({ name, loads }) => {
    const dDelivered = loads.filter((x) => x.status === "Delivered").length;
    const dApproved = loads.filter(
      (x) => !!x.proofOfDelivery?.confirmedAt,
    ).length;
    const dPending = loads.filter(
      (x) => x.proofOfDelivery?.submittedAt && !x.proofOfDelivery?.confirmedAt,
    ).length;
    const dInProgress = loads.filter(
      (x) => x.status === "In-Route" || x.status === "Dispatched",
    ).length;
    const dCancelled = loads.filter((x) => x.status === "Cancelled").length;
    const rate =
      loads.length > 0
        ? `${Math.round((dDelivered / loads.length) * 100)}%`
        : "0%";
    const vehicles =
      [
        ...new Set(
          loads.map((x) => x.preservedQuoteData?.vehicleName).filter(Boolean),
        ),
      ].join(", ") || "—";
    return [
      name,
      String(loads.length),
      String(dDelivered),
      rate,
      String(dApproved),
      String(dPending),
      String(dInProgress),
      String(dCancelled),
      vehicles,
    ];
  });

  if (driverRows.length === 0) {
    drawEmptyState(
      doc,
      eOpts(
        34,
        "No drivers assigned this period.",
        "Per-driver breakdown will appear once drivers have loads.",
      ),
    );
  } else {
    autoTable(doc, {
      startY: 34,
      head: [
        [
          "Driver",
          "Total Loads",
          "Delivered",
          "Success Rate",
          "Approved",
          "Pending Approval",
          "In Progress",
          "Cancelled",
          "Vehicles Handled",
        ],
      ],
      body: driverRows,
      margin: { left, right: 14, bottom: 20 },
      styles: TABLE_BODY_STYLES,
      headStyles: TABLE_HEAD_STYLES_PRIMARY,
      alternateRowStyles: TABLE_ALTERNATE_ROW,
      bodyStyles: TABLE_BODY_ROW,
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right" },
        6: { halign: "right" },
        7: { halign: "right" },
      },
    });
  }

  // ── Section: Pending Dealer Approvals ─────────────────────────────────────
  const lastY2 = (doc as any).lastAutoTable?.finalY ?? 80;
  const s3TitleY = lastY2 + 12;
  if (s3TitleY < 170) {
    drawSectionTitle(doc, sOpts("Pending Dealer Approvals", s3TitleY));

    const pendingRows = assigned
      .filter(
        (s) =>
          s.proofOfDelivery?.submittedAt && !s.proofOfDelivery?.confirmedAt,
      )
      .map((s) => [
        driverName(s),
        customerName(s),
        s.preservedQuoteData?.vehicleName || "—",
        `${s.origin || "—"} → ${s.destination || "—"}`,
        fmtDate(s.proofOfDelivery?.submittedAt),
        s.status,
      ]);

    if (pendingRows.length === 0) {
      drawEmptyState(
        doc,
        eOpts(
          s3TitleY + 4,
          "No pending approvals.",
          "All submitted proofs have been reviewed.",
        ),
      );
    } else {
      autoTable(doc, {
        startY: s3TitleY + 3,
        head: [
          [
            "Driver",
            "Customer",
            "Vehicle",
            "Route",
            "Proof Submitted",
            "Status",
          ],
        ],
        body: pendingRows,
        margin: { left, right: 14, bottom: 20 },
        styles: TABLE_BODY_STYLES,
        headStyles: TABLE_HEAD_STYLES_SECONDARY,
        alternateRowStyles: TABLE_ALTERNATE_ROW,
        bodyStyles: TABLE_BODY_ROW,
        columnStyles: { 4: { halign: "right" } },
      });
    }
  }

  applyFootersToAllPages(doc, footerOpts);
  return doc.output("blob");
}

async function generateBillingReportPdf(
  data: ReportData,
  monthLabel: string,
): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "landscape" });

  const totalRevenue = data.payments
    .filter((p) => p.status === "succeeded")
    .reduce((s, p) => s + p.amount, 0);
  const totalPending = data.payments
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + p.amount, 0);
  const totalPaidOut = data.payouts
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.amount, 0);
  const totalPendingOut = data.payouts
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + p.amount, 0);

  const logoBase64 = await loadLogoBase64();
  const docId = generateDocId("BIL");
  const generatedAt = new Date();
  const generatedAtLabel = formatGeneratedAt(generatedAt);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const left = 14;
  const right = pageWidth - 14;
  const contentWidth = right - left;

  const hOpts = (sub?: string) => ({
    reportTitle: "Billing Report",
    periodLabel: monthLabel,
    subtitle: sub,
    logoBase64,
    pageWidth,
    left,
    right,
  });
  const sOpts = (title: string, y: number) => ({ title, y, left, right });
  const eOpts = (y: number, msg: string, sub: string) => ({
    y,
    message: msg,
    sub,
    left,
    right,
    contentWidth,
    pageWidth,
  });
  const footerOpts = {
    docId,
    generatedAtLabel,
    reportTitle: "Billing Report",
    pageWidth,
    pageHeight,
    left,
    right,
  };

  // ── Page 1: Summary + Customer Payments ───────────────────────────────────
  drawReportPageHeader(doc, hOpts());
  drawSectionTitle(doc, sOpts("Summary", 31));

  const cardBottomY = drawSummaryCards(doc, {
    cards: [
      { label: "Total Revenue", value: formatCurrency(totalRevenue) },
      { label: "Pending Payments", value: formatCurrency(totalPending) },
      { label: "Driver Payouts Sent", value: formatCurrency(totalPaidOut) },
      { label: "Pending Payouts", value: formatCurrency(totalPendingOut) },
      {
        label: "Total Transactions",
        value: String(data.payments.length + data.payouts.length),
      },
    ],
    y: 34,
    left,
    contentWidth,
  });

  const paymentsTitleY = cardBottomY + 10;
  drawSectionTitle(doc, sOpts("Customer Payments to Dealer", paymentsTitleY));

  if (data.payments.length === 0) {
    drawEmptyState(
      doc,
      eOpts(
        paymentsTitleY + 4,
        "No customer payments for this period.",
        "Payments will appear here once recorded.",
      ),
    );
  } else {
    autoTable(doc, {
      startY: paymentsTitleY + 3,
      head: [
        [
          "Invoice #",
          "Customer",
          "Email",
          "Description",
          "Amount",
          "Status",
          "Date",
        ],
      ],
      body: data.payments.map((p) => [
        p.invoiceNumber || "—",
        p.customerName,
        p.customerEmail,
        p.description,
        formatCurrency(p.amount),
        p.status,
        fmtDate(p.paidAt || p.createdAt),
      ]),
      margin: { left, right: 14, bottom: 20, top: 30 },
      styles: TABLE_BODY_STYLES,
      headStyles: TABLE_HEAD_STYLES_PRIMARY,
      alternateRowStyles: TABLE_ALTERNATE_ROW,
      bodyStyles: TABLE_BODY_ROW,
      columnStyles: {
        4: { halign: "right" },
        6: { halign: "right" },
      },
      didDrawPage: (data: any) => {
        if (data.pageNumber > 1) {
          drawReportPageHeader(doc, hOpts("Billing Report (continued)"));
          drawContinuedLabel(doc, right);
        }
      },
    });
  }

  // ── Page 2: Driver Payouts + Analytics ────────────────────────────────────
  doc.addPage();
  drawReportPageHeader(doc, hOpts("Billing Report • Analytics"));
  drawSectionTitle(doc, sOpts("Driver Payouts from Dealer", 31));

  if (data.payouts.length === 0) {
    drawEmptyState(
      doc,
      eOpts(
        35,
        "No driver payouts for this period.",
        "Payouts will appear here once processed.",
      ),
    );
  } else {
    autoTable(doc, {
      startY: 34,
      head: [
        [
          "Payout #",
          "Driver",
          "Driver Email",
          "Amount",
          "Status",
          "Description",
          "Paid Date",
        ],
      ],
      body: data.payouts.map((p) => [
        p.payoutNumber || "—",
        p.driverName,
        p.driverEmail,
        formatCurrency(p.amount),
        p.status,
        p.description || "—",
        fmtDate(p.paidAt || p.createdAt),
      ]),
      margin: { left, right: 14, bottom: 20 },
      styles: TABLE_BODY_STYLES,
      headStyles: TABLE_HEAD_STYLES_PRIMARY,
      alternateRowStyles: TABLE_ALTERNATE_ROW,
      bodyStyles: TABLE_BODY_ROW,
      columnStyles: {
        3: { halign: "right" },
        6: { halign: "right" },
      },
    });
  }

  // ── Payment status breakdown ───────────────────────────────────────────────
  const lastY = (doc as any).lastAutoTable?.finalY ?? 76;
  if (lastY < 170) {
    const statusTitleY = lastY + 12;
    drawSectionTitle(doc, sOpts("Payment Summary by Status", statusTitleY));

    const byStatus: Record<string, { count: number; total: number }> = {};
    data.payments.forEach((p) => {
      if (!byStatus[p.status]) byStatus[p.status] = { count: 0, total: 0 };
      byStatus[p.status].count++;
      byStatus[p.status].total += p.amount;
    });

    const statusRows = Object.entries(byStatus).map(
      ([status, { count, total }]) => [
        status.charAt(0).toUpperCase() + status.slice(1),
        String(count),
        formatCurrency(total),
      ],
    );

    if (statusRows.length === 0) {
      drawEmptyState(
        doc,
        eOpts(
          statusTitleY + 4,
          "No payment status data.",
          "Status analytics will appear once payments are recorded.",
        ),
      );
    } else {
      autoTable(doc, {
        startY: statusTitleY + 3,
        head: [["Status", "No. of Payments", "Total Amount"]],
        body: statusRows,
        margin: { left, right: 110, bottom: 20 },
        styles: TABLE_BODY_STYLES,
        headStyles: TABLE_HEAD_STYLES_SECONDARY,
        alternateRowStyles: TABLE_ALTERNATE_ROW,
        columnStyles: {
          1: { halign: "right" },
          2: { halign: "right" },
        },
      });
    }
  }

  applyFootersToAllPages(doc, footerOpts);
  return doc.output("blob");
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: TabValue[] = [
  "ALL",
  "Transportation",
  "Driver Reports",
  "Billings",
];

function TabIcon({ tab }: { tab: TabValue }) {
  if (tab === "ALL") return <CheckSquare className="size-3.5" />;
  if (tab === "Transportation") return <Truck className="size-3.5" />;
  if (tab === "Driver Reports") return <MapPin className="size-3.5" />;
  return <CreditCard className="size-3.5" />;
}

function getMonthOptions() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    };
  });
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = React.useState<TabValue>(() => {
    const tab = searchParams.get("tab");
    if (tab && (TABS as readonly string[]).includes(tab))
      return tab as TabValue;
    return "ALL";
  });
  const [selectedMonth, setSelectedMonth] = React.useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [downloading, setDownloading] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<"driver" | "billing" | null>(
    null,
  );
  const [transportPreview, setTransportPreview] = React.useState<
    "shipment" | "quote" | null
  >(null);
  const [driverSearch, setDriverSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const [rawShipments, setRawShipments] = React.useState<Shipment[]>([]);
  const [rawTransportShipments, setRawTransportShipments] = React.useState<
    TransportShipment[]
  >([]);
  const [rawQuotes, setRawQuotes] = React.useState<TransportQuote[]>([]);
  const [rawPayments, setRawPayments] = React.useState<Payment[]>([]);
  const [rawPayouts, setRawPayouts] = React.useState<DriverPayout[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const monthOptions = React.useMemo(() => getMonthOptions(), []);

  const fetchAll = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [sRes, pRes, payRes, qRes] = await Promise.all([
        apiClient.get("/api/shipments", { headers }),
        apiClient.get("/api/payments", { headers }),
        apiClient.get("/api/driver-payouts", { headers }),
        apiClient.get("/api/quotes", { headers }),
      ]);
      const shipmentData = Array.isArray(sRes.data?.data) ? sRes.data.data : [];
      setRawShipments(shipmentData);
      setRawTransportShipments(shipmentData);
      setRawPayments(
        Array.isArray(pRes.data?.data?.payments) ? pRes.data.data.payments : [],
      );
      setRawPayouts(Array.isArray(payRes.data?.data) ? payRes.data.data : []);
      setRawQuotes(Array.isArray(qRes.data?.data) ? qRes.data.data : []);
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Failed to load reports.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Month-filtered data
  const reportData: ReportData = React.useMemo(
    () => ({
      shipments: rawShipments.filter((s) =>
        (s.assignedAt || s.createdAt)?.startsWith(selectedMonth),
      ),
      payments: rawPayments.filter((p) =>
        p.createdAt?.startsWith(selectedMonth),
      ),
      payouts: rawPayouts.filter((p) => p.createdAt?.startsWith(selectedMonth)),
    }),
    [rawShipments, rawPayments, rawPayouts, selectedMonth],
  );

  const filteredTransportShipments = React.useMemo(
    () =>
      rawTransportShipments.filter((s) =>
        s.createdAt?.startsWith(selectedMonth),
      ),
    [rawTransportShipments, selectedMonth],
  );
  const filteredQuotes = React.useMemo(
    () => rawQuotes.filter((q) => q.createdAt?.startsWith(selectedMonth)),
    [rawQuotes, selectedMonth],
  );
  const shipmentSummary = React.useMemo(
    () => buildShipmentSummary(filteredTransportShipments),
    [filteredTransportShipments],
  );
  const quoteSummary = React.useMemo(
    () => buildQuoteSummary(filteredQuotes),
    [filteredQuotes],
  );

  const monthLabel =
    monthOptions.find((o) => o.value === selectedMonth)?.label ?? selectedMonth;

  // Reset filters when tab or month changes
  React.useEffect(() => {
    setDriverSearch("");
    setStatusFilter("all");
  }, [activeTab, selectedMonth]);

  // Apply tab-specific filters on top of the month-filtered data
  const filteredData: ReportData = React.useMemo(() => {
    let { shipments, payments, payouts } = reportData;

    if (driverSearch.trim()) {
      const q = driverSearch.toLowerCase();
      shipments = shipments.filter((s) => {
        if (typeof s.assignedDriverId !== "object" || !s.assignedDriverId)
          return false;
        return s.assignedDriverId.name.toLowerCase().includes(q);
      });
    }

    if (statusFilter !== "all") {
      payments = payments.filter((p) => p.status === statusFilter);
    }

    return { shipments, payments, payouts };
  }, [reportData, driverSearch, statusFilter]);

  // Derived counts — from filtered data so card stats react to filters
  const assignedLoads = filteredData.shipments.filter(
    (s) => s.assignedDriverId != null,
  );
  const uniqueDrivers = new Set(
    assignedLoads
      .map((s) =>
        typeof s.assignedDriverId === "object"
          ? s.assignedDriverId?._id
          : s.assignedDriverId,
      )
      .filter(Boolean),
  ).size;
  const deliveredCount = assignedLoads.filter(
    (s) => s.status === "Delivered",
  ).length;
  const pendingApprovalCount = assignedLoads.filter(
    (s) => s.proofOfDelivery?.submittedAt && !s.proofOfDelivery?.confirmedAt,
  ).length;
  const totalRevenue = filteredData.payments
    .filter((p) => p.status === "succeeded")
    .reduce((s, p) => s + p.amount, 0);
  const totalPaidOut = filteredData.payouts
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.amount, 0);

  // Selection
  const visibleIds =
    activeTab === "ALL"
      ? ["driver-report", "billing-report", "shipment-report", "quote-report"]
      : activeTab === "Driver Reports"
        ? ["driver-report"]
        : activeTab === "Billings"
          ? ["billing-report"]
          : activeTab === "Transportation"
            ? ["shipment-report", "quote-report"]
            : [];

  const isAllSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const selectedCount = selected.size;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => {
      const n = new Set(prev);
      if (isAllSelected) visibleIds.forEach((id) => n.delete(id));
      else visibleIds.forEach((id) => n.add(id));
      return n;
    });
  }

  async function downloadReport(id: string) {
    setDownloading(id);
    try {
      const saveAndDownload = async (
        blob: Blob,
        fileName: string,
        category: ReportFileCategory,
        successMessage: string,
      ) => {
        try {
          await saveGeneratedReportFile({
            name: fileName,
            category,
            blob,
          });
        } catch {
          toast.error("Saved copy to Recent Generated Files failed.");
        }

        triggerDownload(blob, fileName);
        toast.success(successMessage);
      };

      if (id === "driver-report") {
        const blob = await generateDriverReportPdf(filteredData, monthLabel);
        await saveAndDownload(
          blob,
          `Driver_Reports_${monthLabel.replace(/\s+/g, "_")}.pdf`,
          "driver",
          `Driver Reports — ${monthLabel} downloaded.`,
        );
      } else if (id === "billing-report") {
        const blob = await generateBillingReportPdf(filteredData, monthLabel);
        await saveAndDownload(
          blob,
          `Billing_Report_${monthLabel.replace(/\s+/g, "_")}.pdf`,
          "billings",
          `Billing Report — ${monthLabel} downloaded.`,
        );
      } else if (id === "shipment-report") {
        const blob = await generateShipmentReportPdf(
          filteredTransportShipments,
          monthLabel,
        );
        await saveAndDownload(
          blob,
          `Shipment_Report_${monthLabel.replace(/\s+/g, "_")}.pdf`,
          "transportation",
          `Shipment Report — ${monthLabel} downloaded.`,
        );
      } else if (id === "quote-report") {
        const blob = await generateQuoteReportPdf(filteredQuotes, monthLabel);
        await saveAndDownload(
          blob,
          `Quotes_Drafts_Report_${monthLabel.replace(/\s+/g, "_")}.pdf`,
          "transportation",
          `Quotes Report — ${monthLabel} downloaded.`,
        );
      }
    } catch {
      toast.error("Failed to generate PDF.");
    } finally {
      setDownloading(null);
    }
  }

  async function handlePdf() {
    const picks = [...selected];
    if (picks.length === 0) return toast.info("Select a report to download.");
    if (picks.length > 1)
      return toast.info("Select only 1 report for PDF. Use ZIP for multiple.");
    await downloadReport(picks[0]);
  }

  async function handleZip() {
    const picks = [...selected];
    if (picks.length < 2)
      return toast.info("Select 2 or more reports to download as ZIP.");
    setDownloading("zip");
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      if (picks.includes("driver-report")) {
        const blob = await generateDriverReportPdf(filteredData, monthLabel);
        zip.file(`Driver Reports - ${monthLabel}.pdf`, blob);
      }
      if (picks.includes("billing-report")) {
        const blob = await generateBillingReportPdf(filteredData, monthLabel);
        zip.file(`Billing Report - ${monthLabel}.pdf`, blob);
      }
      if (picks.includes("shipment-report")) {
        const blob = await generateShipmentReportPdf(
          filteredTransportShipments,
          monthLabel,
        );
        zip.file(`Shipment Report - ${monthLabel}.pdf`, blob);
      }
      if (picks.includes("quote-report")) {
        const blob = await generateQuoteReportPdf(filteredQuotes, monthLabel);
        zip.file(`Quotes Report - ${monthLabel}.pdf`, blob);
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      triggerDownload(zipBlob, `ActionAuto Reports - ${monthLabel}.zip`);
      toast.success(`Reports downloaded as ZIP.`);
      setSelected(new Set());
    } catch {
      toast.error("Failed to generate ZIP.");
    } finally {
      setDownloading(null);
    }
  }

  const showDriver = activeTab === "ALL" || activeTab === "Driver Reports";
  const showBilling = activeTab === "ALL" || activeTab === "Billings";
  const showTransportation =
    activeTab === "ALL" || activeTab === "Transportation";

  return (
    <div className="p-4 sm:p-6 space-y-5 min-h-screen">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Reports Dashboard
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            View, filter, and download reports across all categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setSelected(new Set());
            }}
            className="h-8 rounded-md border border-border bg-background text-foreground text-xs px-2 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {monthOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs border-border"
            onClick={handlePdf}
            disabled={selectedCount !== 1 || !!downloading}
          >
            <FileText className="size-3.5" /> PDF
          </Button>
          <Button
            size="sm"
            className="gap-2 text-xs"
            onClick={handleZip}
            disabled={selectedCount < 2 || !!downloading}
          >
            {downloading === "zip" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Archive className="size-3.5" />
            )}
            ZIP
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="border-b border-border">
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <TabIcon tab={tab} />
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filter toolbar ── */}
      {(activeTab === "Driver Reports" || activeTab === "Billings") &&
        !loading &&
        !error && (
          <div className="flex items-center gap-3">
            {activeTab === "Driver Reports" && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter by driver name..."
                  value={driverSearch}
                  onChange={(e) => setDriverSearch(e.target.value)}
                  className="h-8 pl-8 pr-7 rounded-md border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary w-56"
                />
                {driverSearch && (
                  <button
                    onClick={() => setDriverSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            )}
            {activeTab === "Billings" && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 rounded-md border border-border bg-background text-foreground text-xs px-2 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Statuses</option>
                <option value="succeeded">Succeeded</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
                <option value="cancelled">Cancelled</option>
              </select>
            )}
            {(driverSearch || statusFilter !== "all") && (
              <span className="text-xs text-muted-foreground">
                Showing filtered results
              </span>
            )}
          </div>
        )}

      {/* ── Stats bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-card rounded-xl border border-border px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-6">
          <StatItem label="Total Reports" value={4} />
          <div className="w-px h-8 bg-border" />
          <StatItem label="Selected" value={selectedCount} highlight />
          <div className="w-px h-8 bg-border hidden sm:block" />
          <StatItem label="Transportation" value={2} muted />
          <StatItem label="Driver Reports" value={1} muted />
          <StatItem label="Billings" value={1} muted />
        </div>
        <button
          onClick={toggleSelectAll}
          className="text-sm font-medium text-primary hover:underline underline-offset-2 transition-colors"
        >
          {isAllSelected ? "Deselect All" : "Select All"}
        </button>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <AlertCircle className="size-8 text-destructive" />
          <p className="text-sm text-destructive font-medium">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchAll}>
            Try Again
          </Button>
        </div>
      ) : activeTab === "Transportation" ? (
        <div className="space-y-6">
          <TransportationAnalytics
            shipments={filteredTransportShipments}
            quotes={filteredQuotes}
            rawShipments={rawTransportShipments}
            rawQuotes={rawQuotes}
            monthLabel={monthLabel}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ReportCard
              title="Shipment Report"
              subtitle={monthLabel}
              description="Complete shipment tracking, delivery performance, route analysis, and revenue breakdown"
              category="Transportation"
              categoryClass="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              stats={[
                {
                  icon: <Truck className="size-3" />,
                  label: `${shipmentSummary.total} shipments`,
                },
                {
                  icon: <MapPin className="size-3" />,
                  label: `${fmtNumber(shipmentSummary.totalMiles)} mi`,
                },
                { icon: <Calendar className="size-3" />, label: monthLabel },
              ]}
              highlights={[
                {
                  label: "Delivered",
                  value: shipmentSummary.delivered,
                  color: "text-emerald-600 dark:text-emerald-400",
                },
                {
                  label: "Revenue",
                  value: transportFmtCurrency(shipmentSummary.totalRate),
                  color: "text-blue-600 dark:text-blue-400",
                },
              ]}
              isSelected={selected.has("shipment-report")}
              isDownloading={downloading === "shipment-report"}
              onToggle={() => toggleSelect("shipment-report")}
              onDownload={() => downloadReport("shipment-report")}
              onPreview={() => setTransportPreview("shipment")}
            />
            <ReportCard
              title="Quotes & Drafts Report"
              subtitle={monthLabel}
              description="Quote volume, conversion rates, pricing analysis, and service type breakdown"
              category="Transportation"
              categoryClass="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
              stats={[
                {
                  icon: <FileText className="size-3" />,
                  label: `${quoteSummary.total} quotes`,
                },
                {
                  icon: <Database className="size-3" />,
                  label: `${quoteSummary.conversionRate}% converted`,
                },
                { icon: <Calendar className="size-3" />, label: monthLabel },
              ]}
              highlights={[
                {
                  label: "Booked",
                  value: quoteSummary.booked,
                  color: "text-emerald-600 dark:text-emerald-400",
                },
                {
                  label: "Pending",
                  value: quoteSummary.pending,
                  color: "text-amber-600 dark:text-amber-400",
                },
              ]}
              isSelected={selected.has("quote-report")}
              isDownloading={downloading === "quote-report"}
              onToggle={() => toggleSelect("quote-report")}
              onDownload={() => downloadReport("quote-report")}
              onPreview={() => setTransportPreview("quote")}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === "ALL" && (
            <ReportsAnalytics
              shipments={reportData.shipments}
              rawPayments={rawPayments}
              monthLabel={monthLabel}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Driver Report Card */}
            {showDriver && (
              <ReportCard
                title={`Driver Reports`}
                subtitle={monthLabel}
                description="All driver assignments, delivery outcomes, per-driver performance, and dealer approval status"
                category="Driver Reports"
                categoryClass="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                stats={[
                  {
                    icon: <Users className="size-3" />,
                    label: `${uniqueDrivers} drivers`,
                  },
                  {
                    icon: <Database className="size-3" />,
                    label: `${assignedLoads.length} loads`,
                  },
                  { icon: <Calendar className="size-3" />, label: monthLabel },
                ]}
                highlights={[
                  {
                    label: "Delivered",
                    value: deliveredCount,
                    color: "text-emerald-600 dark:text-emerald-400",
                  },
                  {
                    label: "Pending Approval",
                    value: pendingApprovalCount,
                    color: "text-amber-600 dark:text-amber-400",
                  },
                ]}
                isSelected={selected.has("driver-report")}
                isDownloading={downloading === "driver-report"}
                onToggle={() => toggleSelect("driver-report")}
                onDownload={() => downloadReport("driver-report")}
                onPreview={() => setPreview("driver")}
              />
            )}

            {/* Billing Report Card */}
            {showBilling && (
              <ReportCard
                title={`Billing Report`}
                subtitle={monthLabel}
                description="Customer payments to dealer, driver payouts, and full transaction history for the period"
                category="Billings"
                categoryClass="bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800"
                stats={[
                  {
                    icon: <CreditCard className="size-3" />,
                    label: `${filteredData.payments.length} payments`,
                  },
                  {
                    icon: <Database className="size-3" />,
                    label: `${filteredData.payouts.length} payouts`,
                  },
                  { icon: <Calendar className="size-3" />, label: monthLabel },
                ]}
                highlights={[
                  {
                    label: "Revenue",
                    value: formatCurrency(totalRevenue),
                    color: "text-emerald-600 dark:text-emerald-400",
                  },
                  {
                    label: "Paid to Drivers",
                    value: formatCurrency(totalPaidOut),
                    color: "text-blue-600 dark:text-blue-400",
                  },
                ]}
                isSelected={selected.has("billing-report")}
                isDownloading={downloading === "billing-report"}
                onToggle={() => toggleSelect("billing-report")}
                onDownload={() => downloadReport("billing-report")}
                onPreview={() => setPreview("billing")}
              />
            )}

            {showTransportation && (
              <ReportCard
                title="Shipment Report"
                subtitle={monthLabel}
                description="Complete shipment tracking, delivery performance, route analysis, and revenue breakdown"
                category="Transportation"
                categoryClass="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                stats={[
                  {
                    icon: <Truck className="size-3" />,
                    label: `${shipmentSummary.total} shipments`,
                  },
                  {
                    icon: <MapPin className="size-3" />,
                    label: `${fmtNumber(shipmentSummary.totalMiles)} mi`,
                  },
                  { icon: <Calendar className="size-3" />, label: monthLabel },
                ]}
                highlights={[
                  {
                    label: "Delivered",
                    value: shipmentSummary.delivered,
                    color: "text-emerald-600 dark:text-emerald-400",
                  },
                  {
                    label: "Revenue",
                    value: transportFmtCurrency(shipmentSummary.totalRate),
                    color: "text-blue-600 dark:text-blue-400",
                  },
                ]}
                isSelected={selected.has("shipment-report")}
                isDownloading={downloading === "shipment-report"}
                onToggle={() => toggleSelect("shipment-report")}
                onDownload={() => downloadReport("shipment-report")}
                onPreview={() => setTransportPreview("shipment")}
              />
            )}

            {showTransportation && (
              <ReportCard
                title="Quotes & Drafts Report"
                subtitle={monthLabel}
                description="Quote volume, conversion rates, pricing analysis, and service type breakdown"
                category="Transportation"
                categoryClass="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                stats={[
                  {
                    icon: <FileText className="size-3" />,
                    label: `${quoteSummary.total} quotes`,
                  },
                  {
                    icon: <Database className="size-3" />,
                    label: `${quoteSummary.conversionRate}% converted`,
                  },
                  { icon: <Calendar className="size-3" />, label: monthLabel },
                ]}
                highlights={[
                  {
                    label: "Booked",
                    value: quoteSummary.booked,
                    color: "text-emerald-600 dark:text-emerald-400",
                  },
                  {
                    label: "Pending",
                    value: quoteSummary.pending,
                    color: "text-amber-600 dark:text-amber-400",
                  },
                ]}
                isSelected={selected.has("quote-report")}
                isDownloading={downloading === "quote-report"}
                onToggle={() => toggleSelect("quote-report")}
                onDownload={() => downloadReport("quote-report")}
                onPreview={() => setTransportPreview("quote")}
              />
            )}
          </div>
        </div>
      )}

      {preview && (
        <ReportPreviewModal
          open={!!preview}
          onClose={() => setPreview(null)}
          reportType={preview}
          shipments={filteredData.shipments}
          payments={filteredData.payments}
          payouts={filteredData.payouts}
          monthLabel={monthLabel}
          isDownloading={downloading === preview + "-report"}
          onDownload={() => downloadReport(preview + "-report")}
        />
      )}

      {transportPreview && (
        <TransportationPreviewModal
          open={!!transportPreview}
          onClose={() => setTransportPreview(null)}
          reportType={transportPreview}
          shipments={filteredTransportShipments}
          quotes={filteredQuotes}
          monthLabel={monthLabel}
          isDownloading={downloading === transportPreview + "-report"}
          onDownload={() => downloadReport(transportPreview + "-report")}
        />
      )}
    </div>
  );
}

// ─── Stat Item ────────────────────────────────────────────────────────────────

function StatItem({
  label,
  value,
  highlight,
  muted,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] text-muted-foreground font-medium">
        {label}
      </span>
      <span
        className={`text-xl font-bold leading-tight ${highlight ? "text-primary" : muted ? "text-muted-foreground" : "text-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}
