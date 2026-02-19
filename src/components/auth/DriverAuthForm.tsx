"use client";

import * as React from "react";
import { useSignUp } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const passwordRules = [
  { key: "length", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { key: "uppercase", label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { key: "number", label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { key: "special", label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function DriverAuthForm() {
  const { signUp, setActive: setSignUpActive, isLoaded: isSignUpLoaded } = useSignUp();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [regName, setRegName] = React.useState("");
  const [regEmail, setRegEmail] = React.useState("");
  const [regPassword, setRegPassword] = React.useState("");
  const [regConfirmPassword, setRegConfirmPassword] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [verificationCode, setVerificationCode] = React.useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignUpLoaded || !signUp) return;
    setError(null);
    const failedRules = passwordRules.filter((r) => !r.test(regPassword));
    if (failedRules.length > 0) {
      setError('Password must have: ' + failedRules.map((r) => r.label.toLowerCase()).join(', '));
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsSubmitting(true);
    try {
      const nameParts = regName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      await signUp.create({ emailAddress: regEmail, password: regPassword, firstName, lastName });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignUpLoaded || !signUp) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: verificationCode });
      if (result.status === "complete" && result.createdSessionId) {
        await setSignUpActive({ session: result.createdSessionId });
        // Navigate IMMEDIATELY after setSignUpActive — no awaits in between.
        // Any await here gives Clerk's deferred redirect time to fire (→ / → org-selection).
        // The pending page handles createDriverRequest on its own.
        window.location.href = "/driver/pending";
      }
    } catch (err: any) {
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || "Invalid verification code.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pendingVerification) {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Verify Your Email</h3>
          <p className="text-sm text-muted-foreground">We sent a verification code to <strong>{regEmail}</strong></p>
        </div>
        <form onSubmit={handleVerifyEmail} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input id="code" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="Enter 6-digit code" className="text-center text-lg tracking-widest" required />
          </div>
          {error && <p className="text-xs text-destructive text-center">{error}</p>}
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
            Verify & Continue
          </Button>
          <Button type="button" variant="ghost" className="w-full text-xs" onClick={() => { setPendingVerification(false); setVerificationCode(""); setError(null); }}>
            <ArrowLeft className="size-3 mr-1" />
            Back to registration
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-xs text-destructive text-center bg-destructive/10 rounded-md p-2">{error}</p>}
      <form onSubmit={handleRegister} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="reg-name">Full Name</Label>
          <Input id="reg-name" value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="John Doe" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reg-email">Email</Label>
          <Input id="reg-email" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="driver@email.com" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reg-password">Password</Label>
          <Input id="reg-password" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Create a password" required />
          {regPassword.length > 0 && (
            <div className="grid grid-cols-2 gap-1 pt-1">
              {passwordRules.map((rule) => {
                const passed = rule.test(regPassword);
                return (
                  <div key={rule.key} className={cn("flex items-center gap-1 text-[11px]", passed ? "text-emerald-600" : "text-muted-foreground")}>
                    {passed ? <Check className="size-3" /> : <X className="size-3" />}
                    {rule.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="reg-confirm">Confirm Password</Label>
          <Input id="reg-confirm" type="password" value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} placeholder="Confirm your password" required />
        </div>
        <div id="clerk-captcha" />
        <p className="text-[11px] text-muted-foreground pt-1">After registering, the admin will be notified and will approve your driver account.</p>
        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
          Create Driver Account
        </Button>
      </form>
    </div>
  );
}
