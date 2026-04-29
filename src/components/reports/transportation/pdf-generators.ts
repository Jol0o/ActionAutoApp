import { Shipment, Quote } from "@/types/transportation"
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
} from "./helpers"

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export { triggerDownload }

export async function generateShipmentReportPdf(shipments: Shipment[], monthLabel: string): Promise<Blob> {
  const { jsPDF } = await import("jspdf")
  const autoTable = (await import("jspdf-autotable")).default
  const doc = new jsPDF({ orientation: "landscape" })
  const summary = buildShipmentSummary(shipments)

  doc.setFillColor(16, 185, 129)
  doc.rect(0, 0, 297, 22, "F")
  doc.setTextColor(255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text("ACTION AUTO UTAH", 14, 10)
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("Managed Load Report", 14, 17)
  doc.setTextColor(0)

  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text(`Period: ${monthLabel}`, 14, 29)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(100)
  doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`, 14, 35)
  doc.setTextColor(0)

  const stats = [
    { label: "Total Shipments", value: String(summary.total) },
    { label: "Delivered", value: String(summary.delivered) },
    { label: "In Transit", value: String(summary.inRoute + summary.dispatched) },
    { label: "Available", value: String(summary.available) },
    { label: "Total Revenue", value: fmtCurrency(summary.totalRate) },
    { label: "Success Rate", value: `${summary.onTimeRate}%` },
  ]
  const boxW = 46, boxH = 14, startX = 14, startY = 41
  stats.forEach((stat, i) => {
    const x = startX + (i % 6) * (boxW + 2)
    doc.setFillColor(236, 253, 245)
    doc.roundedRect(x, startY, boxW, boxH, 2, 2, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(16, 185, 129)
    doc.text(stat.value, x + boxW / 2, startY + 6.5, { align: "center" })
    doc.setFont("helvetica", "normal")
    doc.setFontSize(6)
    doc.setTextColor(100)
    doc.text(stat.label, x + boxW / 2, startY + 11.5, { align: "center" })
  })
  doc.setTextColor(0)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("All Shipments", 14, 63)

  autoTable(doc, {
    startY: 66,
    head: [["Tracking #", "Status", "Customer", "Vehicle", "VIN", "Origin", "Destination", "Type", "Rate", "Driver"]],
    body: shipments.length > 0
      ? shipments.map(s => [
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
      ])
      : [["No shipments this period", "", "", "", "", "", "", "", "", ""]],
    styles: { fontSize: 6.5, cellPadding: 2 },
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [236, 253, 245] },
    margin: { left: 14, right: 14 },
  })

  doc.addPage()

  doc.setFillColor(16, 185, 129)
  doc.rect(0, 0, 297, 10, "F")
  doc.setTextColor(255)
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text(`ACTION AUTO UTAH  —  Shipment Report  —  ${monthLabel}  (continued)`, 14, 7)
  doc.setTextColor(0)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("Load Status Breakdown", 14, 20)

  const statusGroups: Record<string, Shipment[]> = {}
  shipments.forEach(s => {
    if (!statusGroups[s.status]) statusGroups[s.status] = []
    statusGroups[s.status].push(s)
  })

  const breakdownRows = Object.entries(statusGroups).map(([status, items]) => {
    const totalRate = items.reduce((sum, s) => sum + ((s.quoteId as any)?.rate || (s as any).pricing?.estimatedRate || (s as any).pricing?.carrierPayAmount || (s as any).carrierPayAmount || 0), 0)
    const avgRate = items.length > 0 ? totalRate / items.length : 0
    const withDriver = items.filter(s => s.assignedDriverId).length
    return [status, String(items.length), `${Math.round((items.length / shipments.length) * 100)}%`, fmtCurrency(totalRate), fmtCurrency(avgRate), String(withDriver)]
  })

  autoTable(doc, {
    startY: 23,
    head: [["Status", "Count", "Percentage", "Total Revenue", "Avg Rate", "With Driver"]],
    body: breakdownRows.length > 0 ? breakdownRows : [["No data", "", "", "", "", ""]],
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [236, 253, 245] },
    margin: { left: 14, right: 14 },
  })

  const lastY = (doc as any).lastAutoTable?.finalY ?? 70
  if (lastY < 150) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("Route Analysis", 14, lastY + 12)

    const routeMap = new Map<string, { count: number; totalRate: number; totalMiles: number }>()
    shipments.forEach(s => {
      const key = `${s.origin || "?"} → ${s.destination || "?"}`
      const existing = routeMap.get(key) || { count: 0, totalRate: 0, totalMiles: 0 }
      existing.count++
      existing.totalRate += (s.quoteId as any)?.rate || (s as any).pricing?.estimatedRate || (s as any).pricing?.carrierPayAmount || (s as any).carrierPayAmount || 0
      existing.totalMiles += (s.quoteId as any)?.miles || (s as any).pricing?.miles || (s as any).miles || 0
      routeMap.set(key, existing)
    })

    const routeRows = Array.from(routeMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 15)
      .map(([route, data]) => [route, String(data.count), fmtNumber(data.totalMiles), fmtCurrency(data.totalRate), fmtCurrency(data.count > 0 ? data.totalRate / data.count : 0)])

    autoTable(doc, {
      startY: lastY + 15,
      head: [["Route", "Loads", "Total Miles", "Total Revenue", "Avg Rate"]],
      body: routeRows.length > 0 ? routeRows : [["No route data", "", "", "", ""]],
      styles: { fontSize: 7.5, cellPadding: 2.5 },
      headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [236, 253, 245] },
      margin: { left: 14, right: 14 },
    })
  }

  return doc.output("blob")
}

export async function generateQuoteReportPdf(quotes: Quote[], monthLabel: string): Promise<Blob> {
  const { jsPDF } = await import("jspdf")
  const autoTable = (await import("jspdf-autotable")).default
  const doc = new jsPDF({ orientation: "landscape" })
  const summary = buildQuoteSummary(quotes)

  doc.setFillColor(245, 158, 11)
  doc.rect(0, 0, 297, 22, "F")
  doc.setTextColor(255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text("ACTION AUTO UTAH", 14, 10)
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("Quotes & Drafts Report", 14, 17)
  doc.setTextColor(0)

  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text(`Period: ${monthLabel}`, 14, 29)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(100)
  doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`, 14, 35)
  doc.setTextColor(0)

  const stats = [
    { label: "Total Quotes", value: String(summary.total) },
    { label: "Booked", value: String(summary.booked) },
    { label: "Conversion", value: `${summary.conversionRate}%` },
    { label: "Pending", value: String(summary.pending) },
    { label: "Total Value", value: fmtCurrency(summary.totalRate) },
    { label: "Avg Rate", value: fmtCurrency(summary.avgRate) },
  ]
  const boxW = 46, boxH = 14, startX = 14, startY = 41
  stats.forEach((stat, i) => {
    const x = startX + (i % 6) * (boxW + 2)
    doc.setFillColor(255, 251, 235)
    doc.roundedRect(x, startY, boxW, boxH, 2, 2, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(245, 158, 11)
    doc.text(stat.value, x + boxW / 2, startY + 6.5, { align: "center" })
    doc.setFont("helvetica", "normal")
    doc.setFontSize(6)
    doc.setTextColor(100)
    doc.text(stat.label, x + boxW / 2, startY + 11.5, { align: "center" })
  })
  doc.setTextColor(0)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("All Quotes & Drafts", 14, 63)

  autoTable(doc, {
    startY: 66,
    head: [["Customer", "Vehicle", "From", "To", "Miles", "Rate", "ETA", "Type", "Units", "Status"]],
    body: quotes.length > 0
      ? quotes.map(q => [
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
    headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [255, 251, 235] },
    margin: { left: 14, right: 14 },
  })

  doc.addPage()

  doc.setFillColor(245, 158, 11)
  doc.rect(0, 0, 297, 10, "F")
  doc.setTextColor(255)
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text(`ACTION AUTO UTAH  —  Quotes & Drafts Report  —  ${monthLabel}  (continued)`, 14, 7)
  doc.setTextColor(0)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("Quote Status Breakdown", 14, 20)

  const statusMap: Record<string, Quote[]> = {}
  quotes.forEach(q => {
    const key = q.status || "unknown"
    if (!statusMap[key]) statusMap[key] = []
    statusMap[key].push(q)
  })

  const statusRows = Object.entries(statusMap).map(([status, items]) => {
    const totalRate = items.reduce((sum, q) => sum + (q.rate || 0), 0)
    const avgRate = items.length > 0 ? totalRate / items.length : 0
    const totalMiles = items.reduce((sum, q) => sum + (q.miles || 0), 0)
    return [
      status.charAt(0).toUpperCase() + status.slice(1),
      String(items.length),
      `${Math.round((items.length / quotes.length) * 100)}%`,
      fmtCurrency(totalRate),
      fmtCurrency(avgRate),
      fmtNumber(totalMiles),
    ]
  })

  autoTable(doc, {
    startY: 23,
    head: [["Status", "Count", "Percentage", "Total Value", "Avg Rate", "Total Miles"]],
    body: statusRows.length > 0 ? statusRows : [["No data", "", "", "", "", ""]],
    styles: { fontSize: 7.5, cellPadding: 2.5 },
    headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [255, 251, 235] },
    margin: { left: 14, right: 14 },
  })

  const lastY = (doc as any).lastAutoTable?.finalY ?? 70
  if (lastY < 150) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("Vehicle & Service Analysis", 14, lastY + 12)

    const enclosed = quotes.filter(q => q.enclosedTrailer).length
    const open = quotes.length - enclosed
    const inoperable = quotes.filter(q => q.vehicleInoperable).length
    const operable = quotes.length - inoperable
    const multiUnit = quotes.filter(q => q.units > 1).length

    autoTable(doc, {
      startY: lastY + 15,
      head: [["Metric", "Value", "Percentage"]],
      body: [
        ["Enclosed Trailer", String(enclosed), `${quotes.length > 0 ? Math.round((enclosed / quotes.length) * 100) : 0}%`],
        ["Open Trailer", String(open), `${quotes.length > 0 ? Math.round((open / quotes.length) * 100) : 0}%`],
        ["Inoperable Vehicles", String(inoperable), `${quotes.length > 0 ? Math.round((inoperable / quotes.length) * 100) : 0}%`],
        ["Operable Vehicles", String(operable), `${quotes.length > 0 ? Math.round((operable / quotes.length) * 100) : 0}%`],
        ["Multi-Unit Shipments", String(multiUnit), `${quotes.length > 0 ? Math.round((multiUnit / quotes.length) * 100) : 0}%`],
      ],
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [217, 119, 6], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [255, 251, 235] },
      margin: { left: 14, right: 110 },
    })
  }

  return doc.output("blob")
}
