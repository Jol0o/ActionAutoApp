import * as React from "react";
import { Loader2, Clock, CheckCircle2, XCircle, RefreshCw, Ban } from "lucide-react";
import { Payment } from "@/types/billing";
import { DriverPayout } from "@/types/driver-payout";

const DISPLAY = "'Rajdhani', var(--font-sans), sans-serif";

// ─── Supra dark-bg badge colours ──────────────────────────────────────────────
// Background: very low-opacity tint so it sits on #0a0a0c without clashing.
// Text: mid-ramp (300) — readable on near-black.
// Dot: solid ramp-400 for the status indicator.
const PAYMENT_STATUS_CONFIG: Record<
  string,
  { bg: string; color: string; dot: string; label: string; icon: React.ReactNode }
> = {
  pending: {
    bg: "rgba(251,191,36,0.10)", color: "#FCD34D", dot: "#F59E0B",
    label: "Pending",
    icon: <Clock style={{ width: 10, height: 10 }} />,
  },
  processing: {
    bg: "rgba(96,165,250,0.10)", color: "#93C5FD", dot: "#3B82F6",
    label: "Processing",
    icon: <Loader2 style={{ width: 10, height: 10, animation: "supraSpin 1s linear infinite" }} />,
  },
  succeeded: {
    bg: "rgba(52,211,153,0.10)", color: "#6EE7B7", dot: "#10B981",
    label: "Succeeded",
    icon: <CheckCircle2 style={{ width: 10, height: 10 }} />,
  },
  paid: {
    bg: "rgba(52,211,153,0.10)", color: "#6EE7B7", dot: "#10B981",
    label: "Paid",
    icon: <CheckCircle2 style={{ width: 10, height: 10 }} />,
  },
  failed: {
    bg: "rgba(248,113,113,0.10)", color: "#FCA5A5", dot: "#EF4444",
    label: "Failed",
    icon: <XCircle style={{ width: 10, height: 10 }} />,
  },
  refunded: {
    bg: "rgba(196,181,253,0.10)", color: "#C4B5FD", dot: "#8B5CF6",
    label: "Refunded",
    icon: <RefreshCw style={{ width: 10, height: 10 }} />,
  },
  cancelled: {
    bg: "rgba(156,163,175,0.10)", color: "rgba(156,163,175,0.75)", dot: "#6B7280",
    label: "Cancelled",
    icon: <Ban style={{ width: 10, height: 10 }} />,
  },
  completed: {
    bg: "rgba(52,211,153,0.10)", color: "#6EE7B7", dot: "#10B981",
    label: "Completed",
    icon: <CheckCircle2 style={{ width: 10, height: 10 }} />,
  },
};

const PAYOUT_STATUS_CONFIG: Record<
  string,
  { bg: string; color: string; dot: string; label: string; icon: React.ReactNode }
> = {
  paid: {
    bg: "rgba(52,211,153,0.10)", color: "#6EE7B7", dot: "#10B981",
    label: "Paid",
    icon: <CheckCircle2 style={{ width: 10, height: 10 }} />,
  },
  processing: {
    bg: "rgba(96,165,250,0.10)", color: "#93C5FD", dot: "#3B82F6",
    label: "Processing",
    icon: <Loader2 style={{ width: 10, height: 10, animation: "supraSpin 1s linear infinite" }} />,
  },
  pending: {
    bg: "rgba(251,191,36,0.10)", color: "#FCD34D", dot: "#F59E0B",
    label: "Pending",
    icon: <Clock style={{ width: 10, height: 10 }} />,
  },
  failed: {
    bg: "rgba(248,113,113,0.10)", color: "#FCA5A5", dot: "#EF4444",
    label: "Failed",
    icon: <XCircle style={{ width: 10, height: 10 }} />,
  },
};

// ─── StatusBadge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: Payment["status"] | string }) {
  const cfg = PAYMENT_STATUS_CONFIG[status] ?? PAYMENT_STATUS_CONFIG.pending;
  return (
    <>
      <style>{`@keyframes supraSpin { to { transform: rotate(360deg); } }`}</style>
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: cfg.bg,
        color: cfg.color,
        fontFamily: DISPLAY, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
        padding: "2px 9px", borderRadius: 20, whiteSpace: "nowrap" as const,
      }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot, display: "inline-block", flexShrink: 0 }} />
        {cfg.label}
      </span>
    </>
  );
}

// ─── PayoutStatusBadge ────────────────────────────────────────────────────────
export function PayoutStatusBadge({ status }: { status: DriverPayout["status"] | string }) {
  const cfg = PAYOUT_STATUS_CONFIG[status] ?? PAYOUT_STATUS_CONFIG.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: cfg.bg, color: cfg.color,
      fontFamily: DISPLAY, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
      padding: "2px 9px", borderRadius: 20, whiteSpace: "nowrap" as const,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot, display: "inline-block", flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

// ─── StatCard — Supra dark treatment ─────────────────────────────────────────
export function StatCard({
  label,
  value,
  icon,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  loading: boolean;
  /** @deprecated — no longer used; Supra theme handles all accent colours */
  accent?: string;
}) {
  return (
    <div style={{
      position: "relative", overflow: "hidden",
      background: "#111116",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 10, padding: "14px 15px",
    }}>
      {/* Carbon crosshatch */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `
          repeating-linear-gradient(45deg, rgba(255,255,255,0.014) 0px, rgba(255,255,255,0.014) 1px, transparent 1px, transparent 8px),
          repeating-linear-gradient(-45deg, rgba(255,255,255,0.010) 0px, rgba(255,255,255,0.010) 1px, transparent 1px, transparent 8px)
        `,
      }} />
      {/* Orange bottom stripe */}
      <div aria-hidden style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(229,90,0,0.28)" }} />

      {/* Icon + spinner row */}
      <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 11 }}>
        <div style={{ padding: 7, borderRadius: 8, background: "rgba(255,255,255,0.06)" }}>
          {icon}
        </div>
        {loading && (
          <Loader2 style={{
            width: 12, height: 12, color: "rgba(255,255,255,0.26)",
            animation: "supraSpin 1s linear infinite", marginTop: 2,
          }} />
        )}
      </div>

      <p style={{
        position: "relative", fontSize: 10, fontWeight: 700,
        letterSpacing: "0.10em", textTransform: "uppercase" as const,
        color: "rgba(255,255,255,0.28)", marginBottom: 5, fontFamily: DISPLAY,
      }}>
        {label}
      </p>

      {loading ? (
        <div style={{ height: 24, width: 80, background: "rgba(255,255,255,0.08)", borderRadius: 4 }} />
      ) : (
        <p style={{
          position: "relative", fontFamily: DISPLAY, fontSize: 22, fontWeight: 700,
          color: "#fff", letterSpacing: "-0.01em",
        }}>
          {value}
        </p>
      )}
    </div>
  );
}