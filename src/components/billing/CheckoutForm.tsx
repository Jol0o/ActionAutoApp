"use client";

import * as React from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { AlertCircle, Loader2, CreditCard } from "lucide-react";
import { Payment } from "@/types/billing";
import { formatCurrency } from "@/utils/format";

const DISPLAY = "'Rajdhani', var(--font-sans), sans-serif";
const MONO    = "'Share Tech Mono', 'Roboto Mono', monospace";
const ORANGE  = "#E55A00";

export function CheckoutForm({
  payment,
  onSuccess,
  onError,
}: {
  payment: Payment;
  onSuccess: (payment: Payment) => void;
  onError: (message: string) => void;
}) {
  const stripe     = useStripe();
  const elements   = useElements();
  const [processing, setProcessing] = React.useState(false);
  const [message,    setMessage]    = React.useState<string | null>(null);
  const [btnHover,   setBtnHover]   = React.useState(false);

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/billing?success=true` },
      redirect: "if_required",
    });

    if (error) {
      setMessage(error.message || "An unexpected error occurred.");
      onError(error.message || "Payment failed");
      setProcessing(false);
    } else if (paymentIntent?.status === "succeeded") {
      onSuccess(payment);
    } else {
      setMessage("Payment is being processed…");
      setProcessing(false);
    }
  };

  const fmt = (n: number) =>
    `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Share+Tech+Mono&display=swap');
        @keyframes supraSheen { 0%,62%{left:-110%} 100%{left:230%} }
        @keyframes supraSpin  { to{transform:rotate(360deg)} }
      `}</style>

      {/* Amount card */}
      <div style={{
        position: "relative", overflow: "hidden",
        background: "#111116",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12, padding: "16px 20px",
      }}>
        {/* Carbon texture */}
        <div aria-hidden style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `
            repeating-linear-gradient(45deg, rgba(255,255,255,0.016) 0px, rgba(255,255,255,0.016) 1px, transparent 1px, transparent 8px),
            repeating-linear-gradient(-45deg, rgba(255,255,255,0.011) 0px, rgba(255,255,255,0.011) 1px, transparent 1px, transparent 8px)
          `,
        }} />
        {/* Left racing stripe */}
        <div aria-hidden style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: ORANGE }} />
        {/* Orange bottom accent */}
        <div aria-hidden style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(229,90,0,0.28)" }} />

        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div>
            <p style={{ fontFamily: DISPLAY, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.28)", marginBottom: 6 }}>
              Amount due
            </p>
            <p style={{ fontFamily: DISPLAY, fontSize: 36, fontWeight: 700, color: ORANGE, letterSpacing: "-0.02em", lineHeight: 1 }}>
              {fmt(payment.amount)}
            </p>
          </div>
          <div style={{ textAlign: "right", paddingTop: 2 }}>
            <p style={{ fontFamily: MONO, fontSize: 11, color: "rgba(229,90,0,0.55)", letterSpacing: "0.07em" }}>
              {payment.invoiceNumber || payment._id.slice(-8)}
            </p>
          </div>
        </div>
        <p style={{ position: "relative", fontFamily: DISPLAY, fontSize: 12, color: "rgba(255,255,255,0.38)", letterSpacing: "0.02em" }}>
          {payment.description}
        </p>
      </div>

      {/* Stripe PaymentElement — inherits surrounding theme as much as possible */}
      <div style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 12, padding: "16px",
      }}>
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {/* Error message */}
      {message && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "11px 14px", borderRadius: 9,
          background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.20)",
          fontFamily: DISPLAY, fontSize: 13, color: "#FCA5A5",
        }}>
          <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
          {message}
        </div>
      )}

      {/* Pay button */}
      <button
        onClick={handleSubmit}
        disabled={processing || !stripe || !elements}
        onMouseEnter={() => setBtnHover(true)}
        onMouseLeave={() => setBtnHover(false)}
        style={{
          position: "relative", overflow: "hidden",
          width: "100%", padding: "14px 20px", borderRadius: 10,
          background: btnHover && !processing ? "#cf4f00" : ORANGE,
          border: "none", cursor: processing || !stripe || !elements ? "not-allowed" : "pointer",
          opacity: processing || !stripe || !elements ? 0.65 : 1,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
          fontFamily: DISPLAY, fontSize: 16, fontWeight: 700, color: "white", letterSpacing: "0.03em",
          transition: "background 0.14s",
        }}
      >
        {!processing && (
          <span aria-hidden style={{
            position: "absolute", top: 0, bottom: 0, left: "-110%", width: "55%",
            background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.09),transparent)",
            transform: "skewX(-20deg)", animation: "supraSheen 3.2s ease-in-out infinite",
            pointerEvents: "none",
          }} />
        )}
        {processing
          ? <><Loader2 style={{ width: 18, height: 18, animation: "supraSpin 1s linear infinite" }} />Processing…</>
          : <><CreditCard style={{ width: 18, height: 18 }} />Pay {fmt(payment.amount)}</>
        }
      </button>
    </div>
  );
}