"use client";

import * as React from "react";
import {
  Eye,
  EyeOff,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Receipt,
  PlusCircle,
} from "lucide-react";
import { PaymentStats } from "@/types/billing";
import { formatCurrency } from "@/utils/format";

const ORANGE = "#E55A00";
const ORANGE_DIM = "rgba(229,90,0,0.55)";
const ORANGE_MUTED = "rgba(229,90,0,0.28)";
const ORANGE_BG = "rgba(229,90,0,0.08)";
const ORANGE_BORDER = "rgba(229,90,0,0.30)";

const MONO = "'Share Tech Mono', 'Roboto Mono', ui-monospace, monospace";
const DISPLAY = "'Rajdhani', var(--font-sans), sans-serif";

const card: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
  borderRadius: 16,
  background: "#0a0a0c",
  border: "1px solid #1e1e24",
  fontFamily: DISPLAY,
};

const carbonBg: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  backgroundImage: `
    repeating-linear-gradient(45deg,  rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 8px),
    repeating-linear-gradient(-45deg, rgba(255,255,255,0.013) 0px, rgba(255,255,255,0.013) 1px, transparent 1px, transparent 8px)
  `,
};

interface BalanceCardProps {
  balance: number;
  userId: string;
  userName: string;
  isLoading: boolean;
  stats: PaymentStats | null;
  onReceive: () => void;
  onSend: () => void;
  onCashIn: () => void;
}

export function BalanceCard({
  balance,
  userId,
  userName,
  isLoading,
  stats,
  onReceive,
  onSend,
  onCashIn,
}: BalanceCardProps) {
  const [visible, setVisible] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return sessionStorage.getItem("billing_bal_vis") !== "false";
  });

  const [sendHover,    setSendHover]    = React.useState(false);
  const [recvHover,    setRecvHover]    = React.useState(false);
  const [cashInHover,  setCashInHover]  = React.useState(false);

  const toggle = () => {
    const next = !visible;
    setVisible(next);
    sessionStorage.setItem("billing_bal_vis", String(next));
  };

  const fmt = (n: number) =>
    n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const statItems = [
    {
      label: "Monthly recv.",
      value: formatCurrency(stats?.totalRevenue ?? 0),
      Icon: TrendingUp,
    },
    {
      label: "Pending",
      value: `${stats?.byStatus?.pending?.count ?? 0} invoices`,
      Icon: Clock,
    },
    {
      label: "Transactions",
      value: String(stats?.totalCount ?? 0),
      Icon: Receipt,
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Share+Tech+Mono&display=swap');
        @keyframes supraSheen {
          0%, 62% { left: -110%; }
          100%    { left: 230%;  }
        }
      `}</style>

      <div style={card}>
        {/* Carbon-fibre crosshatch */}
        <div aria-hidden style={carbonBg} />

        {/* Left racing stripe */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0, top: 0, bottom: 0,
            width: 4,
            background: ORANGE,
          }}
        />

        {/* Top accent line */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0, left: 4, right: 0,
            height: 1,
            background: `linear-gradient(90deg, ${ORANGE}, rgba(229,90,0,0.32), transparent)`,
          }}
        />

        <div style={{ position: "relative", padding: "22px 24px 20px 20px" }}>

          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ height: 3, width: 18, background: ORANGE, borderRadius: 1 }} />
                <div style={{ height: 3, width: 10, background: ORANGE_MUTED, borderRadius: 1 }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                Auto Finance
              </span>
            </div>

            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontSize: 10, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase",
              background: ORANGE_BG, border: `1px solid ${ORANGE_BORDER}`,
              color: ORANGE, borderRadius: 4, padding: "2px 9px",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: ORANGE, display: "inline-block" }} />
              Live balance
            </span>
          </div>

          {/* Balance + account ID row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 8 }}>
                Available Balance
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {isLoading ? (
                  <div style={{ height: 44, width: 200, borderRadius: 8, background: "rgba(255,255,255,0.06)", animation: "pulse 1.5s ease-in-out infinite" }} />
                ) : (
                  <p style={{ fontFamily: DISPLAY, fontSize: 44, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>
                    <span style={{ fontFamily: DISPLAY, fontSize: 26, color: ORANGE, verticalAlign: "top", marginTop: 7, display: "inline-block" }}>$</span>
                    {visible ? fmt(balance) : "\u00a0••••••••"}
                  </p>
                )}

                <button
                  onClick={toggle}
                  aria-label={visible ? "Hide balance" : "Show balance"}
                  style={{
                    flexShrink: 0,
                    width: 32, height: 32, borderRadius: 6,
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", transition: "background 0.15s",
                  }}
                >
                  {visible
                    ? <EyeOff style={{ width: 16, height: 16, color: "rgba(255,255,255,0.48)" }} />
                    : <Eye    style={{ width: 16, height: 16, color: "rgba(255,255,255,0.48)" }} />
                  }
                </button>
              </div>
            </div>

            {/* Account ID */}
            <div style={{ textAlign: "right", paddingTop: 4, flexShrink: 0 }}>
              <p style={{ fontSize: 10, letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)", marginBottom: 4 }}>
                Account
              </p>
              <p style={{ fontFamily: MONO, fontSize: 12, color: ORANGE_DIM, letterSpacing: "0.08em" }}>
                {userId}
              </p>
            </div>
          </div>

          {/* Stat pills */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 18 }}>
            {statItems.map(({ label, value, Icon }) => (
              <div
                key={label}
                style={{
                  position: "relative", overflow: "hidden",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 8, padding: "10px 12px",
                }}
              >
                <div aria-hidden style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: ORANGE_MUTED }} />

                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                  <Icon style={{ width: 11, height: 11, color: "rgba(255,255,255,0.26)", flexShrink: 0 }} />
                  <p style={{ fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.26)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {label}
                  </p>
                </div>

                {isLoading ? (
                  <div style={{ height: 16, width: 52, borderRadius: 3, background: "rgba(255,255,255,0.06)" }} />
                ) : (
                  <p style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.80)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {value}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* CTA row */}
          <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>

            {/* Receive */}
            <button
              onClick={onReceive}
              onMouseEnter={() => setRecvHover(true)}
              onMouseLeave={() => setRecvHover(false)}
              style={{
                flex: 1, display: "flex", alignItems: "center", gap: 10,
                padding: "11px 14px", borderRadius: 8,
                background: recvHover ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                cursor: "pointer", textAlign: "left", transition: "background 0.15s",
              }}
            >
              <span style={{ width: 34, height: 34, borderRadius: 6, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ArrowDownLeft style={{ width: 16, height: 16, color: "rgba(255,255,255,0.66)" }} />
              </span>
              <div>
                <p style={{ fontFamily: DISPLAY, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.78)", lineHeight: 1 }}>Receive</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", marginTop: 3, letterSpacing: "0.04em" }}>Generate QR</p>
              </div>
            </button>

            {/* Cash In */}
            <button
              onClick={onCashIn}
              onMouseEnter={() => setCashInHover(true)}
              onMouseLeave={() => setCashInHover(false)}
              style={{
                flex: 1, display: "flex", alignItems: "center", gap: 10,
                padding: "11px 14px", borderRadius: 8,
                background: cashInHover ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                cursor: "pointer", textAlign: "left", transition: "background 0.15s",
              }}
            >
              <span style={{ width: 34, height: 34, borderRadius: 6, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <PlusCircle style={{ width: 16, height: 16, color: ORANGE }} />
              </span>
              <div>
                <p style={{ fontFamily: DISPLAY, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.78)", lineHeight: 1 }}>Cash In</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", marginTop: 3, letterSpacing: "0.04em" }}>Add funds</p>
              </div>
            </button>

            {/* Send */}
            <button
              onClick={onSend}
              onMouseEnter={() => setSendHover(true)}
              onMouseLeave={() => setSendHover(false)}
              style={{
                flex: 1, display: "flex", alignItems: "center", gap: 10,
                padding: "11px 14px", borderRadius: 8,
                background: sendHover ? "#cf4f00" : ORANGE,
                border: "none",
                cursor: "pointer", textAlign: "left",
                position: "relative", overflow: "hidden",
                transition: "background 0.15s",
              }}
            >
              {/* Sheen sweep */}
              <span
                aria-hidden
                style={{
                  position: "absolute", top: 0, bottom: 0,
                  left: "-110%", width: "60%",
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)",
                  transform: "skewX(-20deg)",
                  animation: "supraSheen 3.2s ease-in-out infinite",
                  pointerEvents: "none",
                }}
              />
              <span style={{ width: 34, height: 34, borderRadius: 6, background: "rgba(0,0,0,0.20)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ArrowUpRight style={{ width: 16, height: 16, color: "#fff" }} />
              </span>
              <div>
                <p style={{ fontFamily: DISPLAY, fontSize: 14, fontWeight: 600, color: "#fff", lineHeight: 1 }}>Send</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.58)", marginTop: 3, letterSpacing: "0.04em" }}>Transfer funds</p>
              </div>
            </button>

          </div>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ fontFamily: MONO, fontSize: 11, color: "rgba(255,255,255,0.22)", letterSpacing: "0.08em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "58%" }}>
              {userName}
            </p>
            <p style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: ORANGE_DIM, fontFamily: DISPLAY, fontWeight: 600 }}>
              SupraPay v.1
            </p>
          </div>

        </div>
      </div>
    </>
  );
}