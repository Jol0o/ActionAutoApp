import { Shipment, Quote } from "@/types/transportation";
import {
  buildShipmentSummary,
  buildQuoteSummary,
  fmtCurrency,
  fmtNumber,
  shipmentCustomer,
  shipmentVehicle,
  shipmentVin,
  shipmentRate,
  shipmentTransportType,
  driverName,
  quoteCustomer,
  quoteVehicle,
  quoteFromAddr,
  quoteToAddr,
  quoteEta,
  quoteTransportType,
} from "./helpers";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export { triggerDownload };

export async function generateShipmentReportPdf(
  shipments: Shipment[],
  monthLabel: string,
): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "landscape" });
  const summary = buildShipmentSummary(shipments);

  const generatedAt = new Date();
  const generatedAtLabel = generatedAt.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const left = 14;
  const right = pageWidth - 14;
  const contentWidth = right - left;

  const drawReportHeader = (subtitle?: string) => {
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(left, 10, 8, 8, 1.5, 1.5, "F");

    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("AA", left + 4, 15.4, { align: "center" });

    doc.setTextColor(20, 26, 38);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Action Auto Utah", left + 12, 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(95, 107, 122);
    doc.text(subtitle || "Shipment Report", left + 12, 18.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(33, 41, 54);
    doc.text("Shipment Report", right, 13.8, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(95, 107, 122);
    doc.text(`Period: ${monthLabel}`, right, 17.8, { align: "right" });

    doc.setDrawColor(218, 225, 235);
    doc.setLineWidth(0.2);
    doc.line(left, 22.5, right, 22.5);
  };

  const drawSectionTitle = (title: string, y: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(31, 41, 55);
    doc.text(title, left, y);
    const lineStart = left + doc.getTextWidth(title) + 3;
    doc.setDrawColor(224, 230, 238);
    doc.line(lineStart, y - 0.8, right, y - 0.8);
  };

  drawReportHeader();

  // Summary block
  const summaryTitleY = 31;
  drawSectionTitle("Summary", summaryTitleY);

  const stats = [
    { label: "Total Shipments", value: String(summary.total) },
    { label: "Delivered", value: String(summary.delivered) },
    {
      label: "In Transit",
      value: String(summary.inRoute + summary.dispatched),
    },
    { label: "Available", value: String(summary.available) },
    { label: "Revenue", value: fmtCurrency(summary.totalRate) },
    { label: "Success Rate", value: `${summary.onTimeRate}%` },
  ];

  const cardGap = 4;
  const cardW = (contentWidth - cardGap * (stats.length - 1)) / stats.length;
  const cardY = 34;
  const cardH = 16;
  stats.forEach((stat, i) => {
    const x = left + i * (cardW + cardGap);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(223, 231, 241);
    doc.roundedRect(x, cardY, cardW, cardH, 1.8, 1.8, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(107, 114, 128);
    doc.text(stat.label, x + 3, cardY + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(16, 132, 96);
    doc.text(stat.value, x + 3, cardY + 12);
  });

  // Shipments table section
  const shipmentsTitleY = cardY + cardH + 10;
  drawSectionTitle("Shipments Table", shipmentsTitleY);

  if (shipments.length === 0) {
    const emptyY = shipmentsTitleY + 4;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(223, 231, 241);
    doc.roundedRect(left, emptyY, contentWidth, 42, 2, 2, "FD");

    doc.setTextColor(170, 180, 195);
    doc.setFontSize(18);
    doc.text("📭", pageWidth / 2, emptyY + 18, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(87, 96, 110);
    doc.text("No shipment data for this period", pageWidth / 2, emptyY + 27, {
      align: "center",
    });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(126, 137, 154);
    doc.text(
      "Data will appear here once shipments are recorded.",
      pageWidth / 2,
      emptyY + 33,
      { align: "center" },
    );
  } else {
    autoTable(doc, {
      startY: shipmentsTitleY + 3,
      head: [
        [
          "Tracking #",
          "Status",
          "Customer",
          "Vehicle",
          "VIN",
          "Origin",
          "Destination",
          "Type",
          "Rate",
          "Driver",
        ],
      ],
      body: shipments.map((s) => [
        s.trackingNumber || "—",
        s.status,
        shipmentCustomer(s),
        shipmentVehicle(s),
        shipmentVin(s),
        s.origin || "—",
        s.destination || "—",
        shipmentTransportType(s),
        fmtCurrency(shipmentRate(s)),
        driverName(s),
      ]),
      margin: { left, right, bottom: 16 },
      styles: {
        fontSize: 7.2,
        cellPadding: { top: 2.6, right: 2.8, bottom: 2.6, left: 2.8 },
        minCellHeight: 7,
        textColor: [36, 44, 56],
        lineColor: [226, 232, 240],
        lineWidth: 0.12,
      },
      headStyles: {
        fillColor: [16, 132, 96],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "left",
      },
      alternateRowStyles: { fillColor: [247, 250, 248] },
      bodyStyles: { fillColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 23 },
        1: { cellWidth: 19 },
        2: { cellWidth: 29 },
        3: { cellWidth: 30 },
        4: { cellWidth: 23 },
        5: { cellWidth: 28 },
        6: { cellWidth: 28 },
        7: { cellWidth: 18 },
        8: { cellWidth: 22, halign: "right" },
        9: { cellWidth: 28 },
      },
    });
  }

  // Page 2 analytics sections
  doc.addPage();
  drawReportHeader("Shipment Report • Analytics");

  const statusGroups: Record<string, Shipment[]> = {};
  shipments.forEach((s) => {
    if (!statusGroups[s.status]) statusGroups[s.status] = [];
    statusGroups[s.status].push(s);
  });

  drawSectionTitle("Status Breakdown", 31);
  const breakdownRows = Object.entries(statusGroups)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([status, items]) => {
      const totalRate = items.reduce(
        (sum, s) => sum + ((s.quoteId || s.preservedQuoteData)?.rate || 0),
        0,
      );
      const avgRate = items.length > 0 ? totalRate / items.length : 0;
      const withDriver = items.filter((s) => s.assignedDriverId).length;
      const pct =
        shipments.length > 0
          ? `${Math.round((items.length / shipments.length) * 100)}%`
          : "0%";
      return [
        status,
        String(items.length),
        pct,
        fmtCurrency(totalRate),
        fmtCurrency(avgRate),
        String(withDriver),
      ];
    });

  autoTable(doc, {
    startY: 34,
    head: [
      [
        "Status",
        "Count",
        "Percentage",
        "Total Revenue",
        "Avg Rate",
        "With Driver",
      ],
    ],
    body:
      breakdownRows.length > 0
        ? breakdownRows
        : [["No status data", "0", "0%", "$0.00", "$0.00", "0"]],
    margin: { left, right, bottom: 16 },
    styles: {
      fontSize: 7.6,
      cellPadding: { top: 2.8, right: 3, bottom: 2.8, left: 3 },
      minCellHeight: 7.5,
      textColor: [36, 44, 56],
      lineColor: [226, 232, 240],
      lineWidth: 0.12,
    },
    headStyles: {
      fillColor: [16, 132, 96],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "left",
    },
    alternateRowStyles: { fillColor: [247, 250, 248] },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
    },
  });

  const lastY = (doc as any).lastAutoTable?.finalY ?? 76;
  const routeMap = new Map<
    string,
    { count: number; totalRate: number; totalMiles: number }
  >();
  shipments.forEach((s) => {
    const key = `${s.origin || "?"} → ${s.destination || "?"}`;
    const existing = routeMap.get(key) || {
      count: 0,
      totalRate: 0,
      totalMiles: 0,
    };
    existing.count++;
    existing.totalRate += (s.quoteId || s.preservedQuoteData)?.rate || 0;
    existing.totalMiles += (s.quoteId || s.preservedQuoteData)?.miles || 0;
    routeMap.set(key, existing);
  });

  const routeRows = Array.from(routeMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 15)
    .map(([route, data]) => [
      route,
      String(data.count),
      fmtNumber(data.totalMiles),
      fmtCurrency(data.totalRate),
      fmtCurrency(data.count > 0 ? data.totalRate / data.count : 0),
    ]);

  const routeTitleY = lastY + 12;
  drawSectionTitle("Route Analysis", routeTitleY);
  autoTable(doc, {
    startY: routeTitleY + 3,
    head: [["Route", "Shipments", "Total Miles", "Total Revenue", "Avg Rate"]],
    body:
      routeRows.length > 0
        ? routeRows
        : [["No route data", "0", "0", "$0.00", "$0.00"]],
    margin: { left, right, bottom: 16 },
    styles: {
      fontSize: 7.6,
      cellPadding: { top: 2.8, right: 3, bottom: 2.8, left: 3 },
      minCellHeight: 7.5,
      textColor: [36, 44, 56],
      lineColor: [226, 232, 240],
      lineWidth: 0.12,
    },
    headStyles: {
      fillColor: [11, 116, 84],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "left",
    },
    alternateRowStyles: { fillColor: [247, 250, 248] },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerY = pageHeight - 8.5;

    doc.setDrawColor(224, 230, 238);
    doc.setLineWidth(0.2);
    doc.line(left, footerY - 3.7, right, footerY - 3.7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(115, 125, 141);
    doc.text("Action Auto Utah · Shipment Report", left, footerY);
    doc.text(`Generated ${generatedAtLabel}`, pageWidth / 2, footerY, {
      align: "center",
    });
    doc.text(`Page ${i} of ${totalPages}`, right, footerY, { align: "right" });
  }

  return doc.output("blob");
}

export async function generateQuoteReportPdf(
  quotes: Quote[],
  monthLabel: string,
): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "landscape" });
  const summary = buildQuoteSummary(quotes);

  doc.setFillColor(245, 158, 11);
  doc.rect(0, 0, 297, 22, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("ACTION AUTO UTAH", 14, 10);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Quotes & Drafts Report", 14, 17);
  doc.setTextColor(0);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`Period: ${monthLabel}`, 14, 29);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`,
    14,
    35,
  );
  doc.setTextColor(0);

  const stats = [
    { label: "Total Quotes", value: String(summary.total) },
    { label: "Booked", value: String(summary.booked) },
    { label: "Conversion", value: `${summary.conversionRate}%` },
    { label: "Pending", value: String(summary.pending) },
    { label: "Total Value", value: fmtCurrency(summary.totalRate) },
    { label: "Avg Rate", value: fmtCurrency(summary.avgRate) },
  ];
  const boxW = 46,
    boxH = 14,
    startX = 14,
    startY = 41;
  stats.forEach((stat, i) => {
    const x = startX + (i % 6) * (boxW + 2);
    doc.setFillColor(255, 251, 235);
    doc.roundedRect(x, startY, boxW, boxH, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(245, 158, 11);
    doc.text(stat.value, x + boxW / 2, startY + 6.5, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(100);
    doc.text(stat.label, x + boxW / 2, startY + 11.5, { align: "center" });
  });
  doc.setTextColor(0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("All Quotes & Drafts", 14, 63);

  autoTable(doc, {
    startY: 66,
    head: [
      [
        "Customer",
        "Vehicle",
        "From",
        "To",
        "Miles",
        "Rate",
        "ETA",
        "Type",
        "Units",
        "Status",
      ],
    ],
    body:
      quotes.length > 0
        ? quotes.map((q) => [
          quoteCustomer(q),
          quoteVehicle(q),
          quoteFromAddr(q),
          quoteToAddr(q),
          fmtNumber(q.miles || 0),
          fmtCurrency(q.rate || 0),
          quoteEta(q),
          quoteTransportType(q),
          String(q.units || 1),
          q.status,
        ])
        : [["No quotes this period", "", "", "", "", "", "", "", "", ""]],
    styles: { fontSize: 6.5, cellPadding: 1.8 },
    headStyles: {
      fillColor: [245, 158, 11],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [255, 251, 235] },
    margin: { left: 14, right: 14 },
  });

  doc.addPage();

  doc.setFillColor(245, 158, 11);
  doc.rect(0, 0, 297, 10, "F");
  doc.setTextColor(255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(
    `ACTION AUTO UTAH  —  Quotes & Drafts Report  —  ${monthLabel}  (continued)`,
    14,
    7,
  );
  doc.setTextColor(0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Quote Status Breakdown", 14, 20);

  const statusMap: Record<string, Quote[]> = {};
  quotes.forEach((q) => {
    const key = q.status || "unknown";
    if (!statusMap[key]) statusMap[key] = [];
    statusMap[key].push(q);
  });

  const statusRows = Object.entries(statusMap).map(([status, items]) => {
    const totalRate = items.reduce((sum, q) => sum + (q.rate || 0), 0);
    const avgRate = items.length > 0 ? totalRate / items.length : 0;
    const totalMiles = items.reduce((sum, q) => sum + (q.miles || 0), 0);
    return [
      status.charAt(0).toUpperCase() + status.slice(1),
      String(items.length),
      `${Math.round((items.length / quotes.length) * 100)}%`,
      fmtCurrency(totalRate),
      fmtCurrency(avgRate),
      fmtNumber(totalMiles),
    ];
  });

  autoTable(doc, {
    startY: 23,
    head: [
      [
        "Status",
        "Count",
        "Percentage",
        "Total Value",
        "Avg Rate",
        "Total Miles",
      ],
    ],
    body:
      statusRows.length > 0 ? statusRows : [["No data", "", "", "", "", ""]],
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    headStyles: {
      fillColor: [245, 158, 11],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [255, 251, 235] },
    margin: { left: 14, right: 14 },
  });

  const lastY = (doc as any).lastAutoTable?.finalY ?? 70;
  if (lastY < 150) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Vehicle & Service Analysis", 14, lastY + 12);

    const enclosed = quotes.filter((q) => q.enclosedTrailer).length;
    const open = quotes.length - enclosed;
    const inoperable = quotes.filter((q) => q.vehicleInoperable).length;
    const operable = quotes.length - inoperable;
    const multiUnit = quotes.filter((q) => q.units > 1).length;

    autoTable(doc, {
      startY: lastY + 15,
      head: [["Metric", "Value", "Percentage"]],
      body: [
        [
          "Enclosed Trailer",
          String(enclosed),
          `${quotes.length > 0 ? Math.round((enclosed / quotes.length) * 100) : 0}%`,
        ],
        [
          "Open Trailer",
          String(open),
          `${quotes.length > 0 ? Math.round((open / quotes.length) * 100) : 0}%`,
        ],
        [
          "Inoperable Vehicles",
          String(inoperable),
          `${quotes.length > 0 ? Math.round((inoperable / quotes.length) * 100) : 0}%`,
        ],
        [
          "Operable Vehicles",
          String(operable),
          `${quotes.length > 0 ? Math.round((operable / quotes.length) * 100) : 0}%`,
        ],
        [
          "Multi-Unit Shipments",
          String(multiUnit),
          `${quotes.length > 0 ? Math.round((multiUnit / quotes.length) * 100) : 0}%`,
        ],
      ],
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: {
        fillColor: [217, 119, 6],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [255, 251, 235] },
      margin: { left: 14, right: 110 },
    });
  }

  return doc.output("blob");
}
