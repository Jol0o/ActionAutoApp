"use client";

import * as React from "react";
import { useSignIn, useSignUp, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { Loader2, Truck, ArrowLeft, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";

const passwordRules = [
  { key: "length", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { key: "uppercase", label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { key: "number", label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { key: "special", label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function DriverAuthForm() {
  const { signIn, setActive: setSignInActive, isLoaded: isSignInLoaded } =
    useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: isSignUpLoaded } =
    useSignUp();
  const { getToken } = useAuth();
  const router = useRouter();

  const [mode, setMode] = React.useState<Mode>("login");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Login fields
  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPassword, setLoginPassword] = React.useState("");

  // Register fields
  const [regName, setRegName] = React.useState("");
  const [regEmail, setRegEmail] = React.useState("");
  const [regPassword, setRegPassword] = React.useState("");
  const [regConfirmPassword, setRegConfirmPassword] = React.useState("");
  const [dealerEmail, setDealerEmail] = React.useState("");

  // Email verification state (registration)
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [verificationCode, setVerificationCode] = React.useState("");

  // 2FA state (login)
  const [needs2FA, setNeeds2FA] = React.useState(false);
  const [twoFACode, setTwoFACode] = React.useState("");
  const [twoFAStrategy, setTwoFAStrategy] = React.useState<string>("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[DriverAuth] Login attempt:", loginEmail);
    console.log("[DriverAuth] isSignInLoaded:", isSignInLoaded, "signIn:", !!signIn);
    if (!isSignInLoaded || !signIn) return;
    setError(null);
    setIsSubmitting(true);

    try {
      console.log("[DriverAuth] Calling signIn.create...");
      const result = await signIn.create({
        identifier: loginEmail,
        password: loginPassword,
      });
      console.log("[DriverAuth] signIn.create status:", result.status);

      // Handle multi-step sign-in flow
      let finalResult = result;

      if (result.status === "needs_first_factor") {
        console.log("[DriverAuth] Needs first factor, attempting password...");
        finalResult = await signIn.attemptFirstFactor({
          strategy: "password",
          password: loginPassword,
        });
        console.log("[DriverAuth] attemptFirstFactor status:", finalResult.status);
      }

      if (finalResult.status === "needs_second_factor") {
        console.log("[DriverAuth] Needs second factor, checking available strategies...");
        const secondFactors = finalResult.supportedSecondFactors;
        console.log("[DriverAuth] Available 2FA strategies:", secondFactors);

        // Prefer email_code, then phone_code, then totp
        const emailFactor = secondFactors?.find((f: any) => f.strategy === "email_code");
        const phoneFactor = secondFactors?.find((f: any) => f.strategy === "phone_code");
        const totpFactor = secondFactors?.find((f: any) => f.strategy === "totp");

        const chosenStrategy = emailFactor ? "email_code" : phoneFactor ? "phone_code" : totpFactor ? "totp" : null;

        if (!chosenStrategy) {
          setError("Two-factor authentication method not supported. Please contact your admin.");
          return;
        }

        // For email_code and phone_code, we need to prepare (send the code)
        if (chosenStrategy === "email_code" || chosenStrategy === "phone_code") {
          console.log("[DriverAuth] Preparing 2FA with strategy:", chosenStrategy);
          await signIn.prepareSecondFactor({
            strategy: chosenStrategy as "email_code" | "phone_code",
          });
        }

        setTwoFAStrategy(chosenStrategy);
        setNeeds2FA(true);
        console.log("[DriverAuth] Showing 2FA input for strategy:", chosenStrategy);
        return;
      }

      if (finalResult.status === "complete" && finalResult.createdSessionId) {
        console.log("[DriverAuth] Sign-in complete! Setting active session...");
        await setSignInActive({ session: finalResult.createdSessionId });
        console.log("[DriverAuth] Session active, redirecting to /driver/pending");
        router.push("/driver/pending");
      } else {
        console.log("[DriverAuth] Unexpected final status:", finalResult.status);
        setError("Sign in could not be completed. Status: " + finalResult.status);
      }
    } catch (err: any) {
      console.error("[DriverAuth] Login error:", err);
      const msg =
        err.errors?.[0]?.longMessage ||
        err.errors?.[0]?.message ||
        "Login failed. Please check your credentials.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignInLoaded || !signIn) return;
    setError(null);
    setIsSubmitting(true);

    try {
      console.log("[DriverAuth] Attempting 2FA with strategy:", twoFAStrategy, "code:", twoFACode);
      const result = await signIn.attemptSecondFactor({
        strategy: twoFAStrategy as "email_code" | "phone_code" | "totp",
        code: twoFACode,
      });
      console.log("[DriverAuth] 2FA result status:", result.status);

      if (result.status === "complete" && result.createdSessionId) {
        console.log("[DriverAuth] 2FA complete! Setting active session...");
        await setSignInActive({ session: result.createdSessionId });
        router.push("/driver/pending");
      } else {
        setError("Verification could not be completed. Status: " + result.status);
      }
    } catch (err: any) {
      console.error("[DriverAuth] 2FA error:", err);
      const msg =
        err.errors?.[0]?.longMessage ||
        err.errors?.[0]?.message ||
        "Invalid verification code. Please try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignUpLoaded || !signUp) return;
    setError(null);

    // Validate password requirements
    const failedRules = passwordRules.filter((r) => !r.test(regPassword));
    if (failedRules.length > 0) {
      setError(`Password must have: ${failedRules.map((r) => r.label.toLowerCase()).join(", ")}`);
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!dealerEmail.trim()) {
      setError("Dealer email is required");
      return;
    }

    setIsSubmitting(true);

    try {
      // Split name into first/last
      const nameParts = regName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      await signUp.create({
        emailAddress: regEmail,
        password: regPassword,
        firstName,
        lastName,
      });

      // Prepare email verification
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setPendingVerification(true);
    } catch (err: any) {
      const msg =
        err.errors?.[0]?.longMessage ||
        err.errors?.[0]?.message ||
        "Registration failed. Please try again.";
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
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await setSignUpActive({ session: result.createdSessionId });

        // Now create driver request
        try {
          const token = await getToken();
          await apiClient.createDriverRequest(
            { dealerEmail: dealerEmail.trim() },
            { headers: { Authorization: `Bearer ${token}` } },
          );
        } catch (err: any) {
          // Log but don't block — user is already created
          console.error("Failed to create driver request:", err);
        }

        router.push("/driver/pending");
      }
    } catch (err: any) {
      const msg =
        err.errors?.[0]?.longMessage ||
        err.errors?.[0]?.message ||
        "Invalid verification code.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (needs2FA) {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            Two-Factor Authentication
          </h3>
          <p className="text-sm text-muted-foreground">
            {twoFAStrategy === "email_code"
              ? `We sent a verification code to your email (${loginEmail})`
              : twoFAStrategy === "phone_code"
                ? "We sent a verification code to your phone"
                : "Enter the code from your authenticator app"}
          </p>
        </div>

        <form onSubmit={handle2FAVerify} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="2fa-code">Verification Code</Label>
            <Input
              id="2fa-code"
              value={twoFACode}
              onChange={(e) => setTwoFACode(e.target.value)}
              placeholder="Enter 6-digit code"
              className="text-center text-lg tracking-widest"
              required
            />
          </div>

          {error && (
            <p className="text-xs text-destructive text-center">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
            Verify & Sign In
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-xs"
            onClick={() => {
              setNeeds2FA(false);
              setTwoFACode("");
              setTwoFAStrategy("");
              setError(null);
            }}
          >
            <ArrowLeft className="size-3 mr-1" />
            Back to login
          </Button>
        </form>
      </div>
    );
  }

  if (pendingVerification) {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            Verify Your Email
          </h3>
          <p className="text-sm text-muted-foreground">
            We sent a verification code to <strong>{regEmail}</strong>
          </p>
        </div>

        <form onSubmit={handleVerifyEmail} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              className="text-center text-lg tracking-widest"
              required
            />
          </div>

          {error && (
            <p className="text-xs text-destructive text-center">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
            Verify & Continue
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-xs"
            onClick={() => {
              setPendingVerification(false);
              setVerificationCode("");
              setError(null);
            }}
          >
            <ArrowLeft className="size-3 mr-1" />
            Back to registration
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Login / Register toggle */}
      <div className="flex rounded-lg bg-muted p-1 gap-1">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setError(null);
          }}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === "login"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("register");
            setError(null);
          }}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === "register"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Register
        </button>
      </div>

      {error && (
        <p className="text-xs text-destructive text-center bg-destructive/10 rounded-md p-2">
          {error}
        </p>
      )}

      {mode === "login" ? (
        <form onSubmit={handleLogin} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="driver@email.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
            Sign In as Driver
          </Button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="reg-name">Full Name</Label>
            <Input
              id="reg-name"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-email">Email</Label>
            <Input
              id="reg-email"
              type="email"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              placeholder="driver@email.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-password">Password</Label>
            <Input
              id="reg-password"
              type="password"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              placeholder="Create a password"
              required
            />
            {regPassword.length > 0 && (
              <div className="grid grid-cols-2 gap-1 pt-1">
                {passwordRules.map((rule) => {
                  const passed = rule.test(regPassword);
                  return (
                    <div
                      key={rule.key}
                      className={cn(
                        "flex items-center gap-1 text-[11px]",
                        passed ? "text-emerald-600" : "text-muted-foreground"
                      )}
                    >
                      {passed ? (
                        <Check className="size-3" />
                      ) : (
                        <X className="size-3" />
                      )}
                      {rule.label}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-confirm">Confirm Password</Label>
            <Input
              id="reg-confirm"
              type="password"
              value={regConfirmPassword}
              onChange={(e) => setRegConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
            />
          </div>

          <div className="border-t border-border pt-3 space-y-2">
            <Label htmlFor="dealer-email" className="flex items-center gap-1.5">
              <Truck className="size-3.5 text-emerald-500" />
              Dealer Email
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dealer-email"
              type="email"
              value={dealerEmail}
              onChange={(e) => setDealerEmail(e.target.value)}
              placeholder="dealer@company.com"
              required
            />
            <p className="text-[11px] text-muted-foreground">
              Enter the email of the dealer/admin you want to work with. A
              request will be sent for their approval.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
            Create Driver Account
          </Button>
        </form>
      )}
    </div>
  );
}
