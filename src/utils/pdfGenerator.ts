import { jsPDF } from "jspdf";
import { Shipment } from "@/types/transportation";

export type ShipmentPDFResult = "saved" | "cancelled" | "initiated";

/**
 * Generate and download a professional PDF of shipment details
 * Professional design by Action Auto Utah - Powered By Supra AI
 */
export const generateShipmentPDF = async (
  shipment: Shipment,
): Promise<ShipmentPDFResult> => {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Get quote data
  const quote = shipment.quoteId || shipment.preservedQuoteData;
  const vehicle = quote?.vehicleId;
  const vehicleName = vehicle
    ? `${vehicle.year} ${vehicle.make} ${vehicle.modelName}`
    : quote?.vehicleName || "N/A";

  // Updated color system aligned with dashboard
  const colors = {
    page: "#f8fafc",
    card: "#ffffff",
    border: "#dbe3ee",
    headerDark: "#0f172a",
    headerTone: "#132339",
    brand: "#22c55e",
    brandDark: "#16a34a",
    text: "#111827",
    textMuted: "#6b7280",
    textSoft: "#94a3b8",
  };

  // Helper function to format dates
  const formatDate = (date?: string) => {
    if (!date) return "Not Scheduled";
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available for Pickup":
        return "#f59e0b";
      case "Delivered":
        return "#10b981";
      case "Cancelled":
        return "#ef4444";
      case "In-Route":
        return "#3b82f6";
      case "Dispatched":
        return "#8b5cf6";
      default:
        return "#6b7280";
    }
  };

  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;
  let yPosition = 12;
  const generatedAt = new Date();

  const currentDate = generatedAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const drawPageBackground = () => {
    const bg = hexToRgb(colors.page);
    pdf.setFillColor(bg.r, bg.g, bg.b);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");
  };

  const drawHeader = (isContinuation = false) => {
    drawPageBackground();

    const dark = hexToRgb(colors.headerDark);
    const tone = hexToRgb(colors.headerTone);
    const brand = hexToRgb(colors.brand);

    pdf.setFillColor(dark.r, dark.g, dark.b);
    pdf.rect(0, 0, pageWidth, 34, "F");
    pdf.setFillColor(tone.r, tone.g, tone.b);
    pdf.rect(pageWidth * 0.62, 0, pageWidth * 0.38, 34, "F");
    pdf.setFillColor(brand.r, brand.g, brand.b);
    pdf.rect(0, 0, 5, 34, "F");

    pdf.setFillColor(brand.r, brand.g, brand.b);
    pdf.roundedRect(marginX, 8, 10, 10, 2, 2, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.text("AA", marginX + 5, 14.5, { align: "center" });

    pdf.setFontSize(14);
    pdf.text("ACTION AUTO UTAH", marginX + 14, 13);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.text("Powered by Supra AI", marginX + 14, 17.5);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10.5);
    pdf.text("Shipment Documentation", pageWidth - marginX, 12.5, {
      align: "right",
    });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.text(`Issue Date: ${currentDate}`, pageWidth - marginX, 17, {
      align: "right",
    });
    pdf.text(`Report Type: Shipment Document`, pageWidth - marginX, 21, {
      align: "right",
    });

    pdf.setDrawColor(46, 58, 77);
    pdf.setLineWidth(0.3);
    pdf.line(marginX, 26.5, pageWidth - marginX, 26.5);

    if (isContinuation) {
      pdf.setTextColor(188, 199, 215);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.2);
      pdf.text("Continued", pageWidth - marginX, 30.5, { align: "right" });
    }

    yPosition = 42;
  };

  const ensureSpace = (neededHeight: number) => {
    if (yPosition + neededHeight <= pageHeight - 26) return;
    pdf.addPage();
    drawHeader(true);
  };

  const drawSectionTitle = (title: string) => {
    pdf.setTextColor(17, 24, 39);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10.5);
    pdf.text(title, marginX, yPosition);

    const lineStart = marginX + pdf.getTextWidth(title) + 3;
    pdf.setDrawColor(198, 208, 222);
    pdf.setLineWidth(0.35);
    pdf.line(lineStart, yPosition - 0.8, pageWidth - marginX, yPosition - 0.8);
    yPosition += 5;
  };

  const drawCard = (x: number, y: number, width: number, height: number) => {
    const card = hexToRgb(colors.card);
    pdf.setFillColor(card.r, card.g, card.b);
    pdf.setDrawColor(216, 225, 237);
    pdf.setLineWidth(0.35);
    pdf.roundedRect(x, y, width, height, 2.2, 2.2, "FD");
  };

  const drawKeyValueRows = (
    rows: Array<{ label: string; value: string }>,
    valueX: number,
    rowHeight = 8.5,
  ) => {
    rows.forEach((row, index) => {
      const rowY = yPosition + index * rowHeight;
      if (index % 2 === 1) {
        pdf.setFillColor(250, 252, 255);
        pdf.rect(marginX + 1.2, rowY - 4.8, contentWidth - 2.4, rowHeight, "F");
      }

      pdf.setTextColor(100, 116, 139);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.8);
      pdf.text(row.label.toUpperCase(), marginX + 5, rowY);

      pdf.setTextColor(30, 41, 59);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.7);
      pdf.text(row.value || "N/A", valueX, rowY);
    });

    yPosition += rows.length * rowHeight + 2;
  };

  drawHeader(false);

  // Hero: Tracking / Vehicle / Status
  ensureSpace(27);
  drawCard(marginX, yPosition, contentWidth, 23);

  pdf.setTextColor(100, 116, 139);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.text("Tracking Number", marginX + 5, yPosition + 7);

  pdf.setTextColor(17, 24, 39);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text(
    shipment.trackingNumber || "Not Assigned",
    marginX + 5,
    yPosition + 14.5,
  );

  pdf.setTextColor(100, 116, 139);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.8);
  pdf.text("Vehicle", marginX + 5, yPosition + 19.5);
  pdf.setTextColor(36, 52, 76);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.3);
  pdf.text(vehicleName, marginX + 25, yPosition + 19.5);

  const statusColor = getStatusColor(shipment.status);
  const statusRgb = hexToRgb(statusColor);
  const statusText = (shipment.status || "Unknown").toUpperCase();
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  const statusWidth = Math.max(42, pdf.getTextWidth(statusText) + 16);
  const statusX = pageWidth - marginX - statusWidth;
  pdf.setFillColor(statusRgb.r, statusRgb.g, statusRgb.b);
  pdf.roundedRect(statusX, yPosition + 5.2, statusWidth, 8.4, 4, 4, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.text(statusText, statusX + statusWidth / 2, yPosition + 10.9, {
    align: "center",
  });

  yPosition += 30;

  // Customer Information
  ensureSpace(40);
  drawSectionTitle("Customer Information");
  const customerRows = [
    {
      label: "Full Name",
      value:
        `${quote?.firstName || ""} ${quote?.lastName || ""}`.trim() || "N/A",
    },
    { label: "Email Address", value: quote?.email || "N/A" },
    { label: "Phone Number", value: quote?.phone || "N/A" },
  ];
  const customerCardHeight = customerRows.length * 8.5 + 4;
  drawCard(marginX, yPosition - 1.2, contentWidth, customerCardHeight);
  drawKeyValueRows(customerRows, marginX + 60);
  yPosition += 3;

  // Vehicle Information
  ensureSpace(48);
  drawSectionTitle("Vehicle Information");
  const vehicleRows = [
    { label: "Vehicle", value: vehicleName },
    { label: "VIN Number", value: vehicle?.vin || quote?.vin || "N/A" },
    {
      label: "Stock Number",
      value: vehicle?.stockNumber || quote?.stockNumber || "N/A",
    },
    { label: "Location", value: quote?.vehicleLocation || "N/A" },
  ];
  const vehicleCardHeight = vehicleRows.length * 8.5 + 4;
  drawCard(marginX, yPosition - 1.2, contentWidth, vehicleCardHeight);
  drawKeyValueRows(vehicleRows, marginX + 60);
  yPosition += 3;

  // Route Information
  ensureSpace(38);
  drawSectionTitle("Route Information");
  drawCard(marginX, yPosition - 1.2, contentWidth, 29);

  const routeX = marginX + 7;
  const routeTop = yPosition + 5;
  pdf.setDrawColor(205, 214, 229);
  pdf.setLineWidth(0.9);
  pdf.line(routeX, routeTop + 2.5, routeX, routeTop + 12.5);

  pdf.setFillColor(34, 197, 94);
  pdf.circle(routeX, routeTop, 2.5, "F");
  pdf.setTextColor(100, 116, 139);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.6);
  pdf.text("ORIGIN", routeX + 6, routeTop - 0.8);
  pdf.setTextColor(30, 41, 59);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(shipment.origin || "N/A", routeX + 6, routeTop + 3.8);

  pdf.setFillColor(239, 68, 68);
  pdf.circle(routeX, routeTop + 15.2, 2.5, "F");
  pdf.setTextColor(100, 116, 139);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.6);
  pdf.text("DESTINATION", routeX + 6, routeTop + 14.6);
  pdf.setTextColor(30, 41, 59);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(shipment.destination || "N/A", routeX + 6, routeTop + 19);

  yPosition += 34;

  // Shipment Timeline
  const timelineData = [
    {
      label: "Requested Pickup",
      date: formatDate(shipment.requestedPickupDate),
    },
    { label: "Scheduled Pickup", date: formatDate(shipment.scheduledPickup) },
    { label: "Actual Pickup", date: formatDate(shipment.pickedUp) },
    {
      label: "Scheduled Delivery",
      date: formatDate(shipment.scheduledDelivery),
    },
    { label: "Actual Delivery", date: formatDate(shipment.delivered) },
  ];

  ensureSpace(58);
  drawSectionTitle("Shipment Timeline");
  const timelineCardHeight = timelineData.length * 9 + 5;
  drawCard(marginX, yPosition - 1.2, contentWidth, timelineCardHeight);

  timelineData.forEach((item, index) => {
    const rowY = yPosition + index * 9;
    if (index % 2 === 1) {
      pdf.setFillColor(250, 252, 255);
      pdf.rect(marginX + 1.2, rowY - 5, contentWidth - 2.4, 9, "F");
    }

    const stepColor = index === 0 ? [37, 99, 235] : [99, 102, 241];
    pdf.setFillColor(stepColor[0], stepColor[1], stepColor[2]);
    pdf.circle(marginX + 7, rowY - 0.2, 2.3, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.8);
    pdf.text(String(index + 1), marginX + 7, rowY + 0.9, { align: "center" });

    pdf.setTextColor(71, 85, 105);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.1);
    pdf.text(item.label, marginX + 12, rowY);

    pdf.setTextColor(30, 41, 59);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.6);
    pdf.text(item.date, pageWidth - marginX - 4, rowY, { align: "right" });
  });

  yPosition += timelineData.length * 9 + 8;

  // Transport Details + Rate block
  ensureSpace(56);
  drawSectionTitle("Transport Details");

  const detailsRows = [
    {
      label: "Transport Type",
      value: quote?.enclosedTrailer ? "Enclosed Trailer" : "Open Trailer",
    },
    {
      label: "Vehicle Condition",
      value: quote?.vehicleInoperable ? "Inoperable" : "Operable",
    },
    { label: "Distance", value: `${quote?.miles || "N/A"} miles` },
    { label: "Units", value: `${quote?.units || "N/A"}` },
  ];

  const detailsCardHeight = detailsRows.length * 8.5 + 4;
  drawCard(marginX, yPosition - 1.2, contentWidth, detailsCardHeight);
  drawKeyValueRows(detailsRows, marginX + 60);

  const rateBoxY = yPosition + 2;
  const brand = hexToRgb(colors.brandDark);
  const brandSoft = hexToRgb(colors.brand);
  pdf.setFillColor(brand.r, brand.g, brand.b);
  pdf.roundedRect(marginX, rateBoxY, contentWidth, 15, 2, 2, "F");
  pdf.setFillColor(brandSoft.r, brandSoft.g, brandSoft.b);
  pdf.rect(marginX, rateBoxY, contentWidth * 0.28, 15, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.text("TOTAL TRANSPORT RATE", marginX + 5, rateBoxY + 6.2);
  pdf.setFontSize(15);
  pdf.text(
    `$${quote?.rate?.toLocaleString() || "N/A"}`,
    marginX + 5,
    rateBoxY + 12.3,
  );
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.2);
  pdf.text("USD", pageWidth - marginX - 5, rateBoxY + 12.1, { align: "right" });

  // Footer on all pages
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    const footerY = pageHeight - 12;
    pdf.setDrawColor(220, 228, 239);
    pdf.setLineWidth(0.3);
    pdf.line(marginX, footerY - 4.5, pageWidth - marginX, footerY - 4.5);

    pdf.setTextColor(100, 116, 139);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.text(`Document ID: ${shipment._id}`, marginX, footerY);
    pdf.text(
      `Generated: ${generatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ${generatedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`,
      pageWidth / 2,
      footerY,
      { align: "center" },
    );
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, footerY, {
      align: "right",
    });
  }

  // ============================================
  // SAVE PDF
  // ============================================
  const fileName = `ActionAutoUtah_Shipment_${shipment.trackingNumber || shipment._id}.pdf`;
  const pdfBlob = pdf.output("blob");

  if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
    try {
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: "PDF Document",
            accept: { "application/pdf": [".pdf"] },
          },
        ],
      });

      const writable = await fileHandle.createWritable();
      await writable.write(pdfBlob);
      await writable.close();
      return "saved";
    } catch (error: any) {
      if (error?.name === "AbortError") {
        return "cancelled";
      }
      throw error;
    }
  }

  await (pdf as any).save(fileName, { returnPromise: true });
  return "initiated";
};

// Helper function to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

// Helper function to load image as base64
async function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/jpeg", 0.8);
      resolve(dataURL);
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

function canAttemptImageForPdf(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("data:") || url.startsWith("blob:")) return true;

  if (url.startsWith("/")) return true;

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return true;
  }

  if (typeof window === "undefined") return false;

  try {
    const targetUrl = new URL(url, window.location.origin);
    const currentOrigin = window.location.origin;
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

    if (targetUrl.origin === currentOrigin) return true;

    if (apiBaseUrl) {
      const apiOrigin = new URL(apiBaseUrl).origin;
      if (targetUrl.origin === apiOrigin) return true;
    }

    return false;
  } catch {
    return false;
  }
}
