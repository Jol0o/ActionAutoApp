"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Mail,
  Lock,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import {
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_LINK_CLASS,
  AUTH_PANEL_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
} from "./theme";

export function UpgradeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromUrl);
  const [step, setStep] = useState<"request" | "verify">(
    emailFromUrl ? "verify" : "request",
  );
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (emailFromUrl && step === "verify") {
      // Automatically request OTP if redirected from sign-in
      handleRequestOtp();
    }
  }, [emailFromUrl]);

  const handleRequestOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.post("/api/auth/send-upgrade-otp", { email });
      setStep("verify");
      toast.success("Verification code sent to your email");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to send verification code",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post("/api/auth/upgrade-legacy", {
        email,
        otp: code,
        newPassword,
      });

      if (response.data?.success) {
        toast.success("Account upgraded successfully! Please sign in.");
        router.push("/sign-in");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Upgrade failed. Check your code or try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className={AUTH_PANEL_CLASS}>
        <div className="bg-emerald-500/10 p-6 flex items-center justify-center border-b border-white/10">
          <ShieldCheck className="h-12 w-12 text-primary" />
        </div>

        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-zinc-100">
            Secure Your Account
          </CardTitle>
          <CardDescription className="text-center text-zinc-400">
            {step === "request"
              ? "Enter your email to start the account upgrade process."
              : "Verify your email and set a new password."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait">
            {step === "request" ? (
              <motion.form
                key="request-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleRequestOtp}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="email" className={AUTH_LABEL_CLASS}>
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      className={`pl-10 h-11 ${AUTH_INPUT_CLASS}`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                {error && (
                  <div className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {error}
                  </div>
                )}
                <Button
                  type="submit"
                  className={`${AUTH_PRIMARY_BUTTON_CLASS} h-11`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Send Verification Code"
                  )}
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="verify-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleUpgrade}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="code" className={AUTH_LABEL_CLASS}>
                    Verification Code
                  </Label>
                  <Input
                    id="code"
                    placeholder="123456"
                    className={`text-center text-xl font-mono tracking-widest h-12 ${AUTH_INPUT_CLASS}`}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={6}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password" className={AUTH_LABEL_CLASS}>
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <PasswordInput
                      id="new-password"
                      placeholder="Create a secure password"
                      className={`pl-10 h-11 ${AUTH_INPUT_CLASS}`}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirm-password"
                    className={AUTH_LABEL_CLASS}
                  >
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <PasswordInput
                      id="confirm-password"
                      placeholder="Repeat your password"
                      className={`pl-10 h-11 ${AUTH_INPUT_CLASS}`}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className={`${AUTH_PRIMARY_BUTTON_CLASS} h-11`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Upgrade & Complete"
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => setStep("request")}
                  className={`text-xs ${AUTH_LINK_CLASS} text-center w-full`}
                >
                  Didn't get a code? Try again
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </CardContent>
        <CardFooter className="bg-white/[0.02] p-4 border-t border-white/10">
          <p className="text-[10px] text-zinc-400 text-center w-full">
            For security, upgrading your account requires email verification.
            This ensures your data remains protected during our system update.
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
