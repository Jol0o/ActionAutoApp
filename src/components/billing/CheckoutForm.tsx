"use client";

import * as React from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, CreditCard } from "lucide-react";
import { Payment } from "@/types/billing";
import { formatCurrency } from "@/utils/format";

export function CheckoutForm({ payment, onSuccess, onError }: {
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
      confirmParams: { return_url: `${window.location.origin}/billing?success=true` },
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
          <span className="text-2xl font-bold text-foreground">{formatCurrency(payment.amount)}</span>
        </div>
        <p className="text-xs text-muted-foreground">{payment.description}</p>
      </div>

      <PaymentElement options={{ layout: "tabs" }} />

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
        {isProcessing
          ? <><Loader2 className="size-5 mr-2 animate-spin" />Processing...</>
          : <><CreditCard className="size-5 mr-2" />Pay {formatCurrency(payment.amount)}</>
        }
      </Button>
    </div>
  );
}
