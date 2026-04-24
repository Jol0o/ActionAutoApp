"use client";

import React, { useState } from "react";
import { useSignIn } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Mail,
  Lock,
  Chrome,
  ArrowRight,
  AlertCircle,
  Facebook,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function SignInForm({ onToggleMode }: { onToggleMode?: () => void }) {
  const { signIn, isLoaded } = useSignIn();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await (signIn as any).create({
        identifier: email,
        password: password,
      });

      if (result.status === "complete") {
        toast.success("Welcome back to Action Auto!");
        const searchParamRedirect = searchParams.get("redirect_url");
        const finalUrl =
          searchParamRedirect || (result as any).targetUrl || "/";
        window.location.href = finalUrl;
      } else if (result.status === "needs_upgrade") {
        router.push(`/upgrade?email=${encodeURIComponent(email)}`);
      }
    } catch (err: any) {
      const errorMessage =
        err.errors?.[0]?.longMessage || "Invalid email or password";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      "https://xj3pd14h-5000.asse.devtunnels.ms";
    const redirectUrl = searchParams.get("redirect_url");
    const token = searchParams.get("token");
    let url = `${backendUrl}/api/auth/google`;

    const params = new URLSearchParams();
    if (redirectUrl) params.append("redirect_url", redirectUrl);
    if (token) params.append("inviteToken", token);

    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    window.location.href = url;
  };

  return (
    <div className="w-full space-y-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
          Welcome Back <span className="animate-bounce">👋</span>
        </h1>
        <p className="text-zinc-500 text-lg font-light leading-relaxed">
          Today is a new day. It&apos;s your day. You shape it.{" "}
          <br className="hidden md:block" />
          Sign in to start managing your projects.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-zinc-400 text-sm font-medium ml-1"
            >
              Email
            </Label>
            <div className="relative group">
              <Input
                id="email"
                type="email"
                placeholder="Example@email.com"
                className="h-12 bg-white/[0.03] border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all rounded-xl placeholder:text-zinc-700"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <Label
                htmlFor="password"
                className="text-zinc-400 text-sm font-medium"
              >
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs text-blue-500 hover:text-blue-400 font-medium transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative group">
              <PasswordInput
                id="password"
                placeholder="At least 8 characters"
                className="h-12 bg-white/[0.03] border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all rounded-xl placeholder:text-zinc-700"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-3 text-xs font-medium bg-red-500/10 text-red-400 rounded-lg border border-red-500/20"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          type="submit"
          className="w-full h-14 bg-[#1b252b] hover:bg-[#25323a] text-white font-bold transition-all active:scale-[0.98] rounded-xl text-lg border border-white/5"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Sign In"}
        </Button>
      </form>

      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/5" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#0a0a0a] px-4 text-zinc-500 font-medium tracking-widest">
            Or
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Button
          variant="outline"
          type="button"
          className="h-12 bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all rounded-xl font-medium flex items-center justify-center gap-3 text-zinc-300"
          onClick={handleGoogleLogin}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </Button>
      </div>

      <div className="text-center pt-4">
        <p className="text-zinc-500 text-sm font-light">
          Don&apos;t you have an account?{" "}
          <button
            onClick={onToggleMode}
            className="text-blue-500 font-bold hover:underline ml-1"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
