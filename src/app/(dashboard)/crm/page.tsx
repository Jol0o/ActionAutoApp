"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Car, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api-client"

export default function CrmLoginPage() {
  const router = useRouter()
  const [username, setUsername]           = React.useState("")
  const [password, setPassword]           = React.useState("")
  const [showPassword, setShowPassword]   = React.useState(false)
  const [isLoading, setIsLoading]         = React.useState(false)
  const [error, setError]                 = React.useState("")
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true)

  React.useEffect(() => {
    const token = localStorage.getItem("crm_token")
    if (token) {
      apiClient
        .get("/api/crm/me", { headers: { Authorization: `Bearer ${token}` } })
        .then(() => router.replace("/crm/dashboard"))
        .catch(() => {
          localStorage.removeItem("crm_token")
          localStorage.removeItem("crm_user")
          setIsCheckingAuth(false)
        })
    } else {
      setIsCheckingAuth(false)
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!username.trim() || !password.trim()) {
      setError("Please enter both Employee ID and password.")
      return
    }
    setIsLoading(true)
    try {
      const res = await apiClient.post("/api/crm/login", {
        username: username.trim(),
        password,
      })
      const data = res.data?.data || res.data
      if (data.token && data.user) {
        localStorage.setItem("crm_token", data.token)
        localStorage.setItem("crm_user", JSON.stringify(data.user))
        router.push("/crm/dashboard")
      } else {
        setError("Login failed. Please try again.")
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.data?.message ||
        "Invalid Employee ID or password."
      )
    } finally {
      setIsLoading(false)
    }
  }

  // ── Auth check loader ──────────────────────────────────────────────────────
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-600/10 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          </div>
          <p className="text-xs text-muted-foreground/50 tracking-wide">Checking session…</p>
        </div>
      </div>
    )
  }

  // ── Login page ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-background">
      <div className="w-full max-w-[400px] space-y-8">

        {/* ── Brand ── */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-14 w-14 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Car className="h-7 w-7 text-white" />
            </div>
            {/* online dot */}
            <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background flex items-center justify-center">
              <span className="h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background" />
            </span>
          </div>
          <div className="text-center leading-none">
            <p className="text-base font-bold tracking-tight">Action Auto</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-emerald-600 mt-1">CRM System</p>
          </div>
        </div>

        {/* ── Card ── */}
        <div className="rounded-2xl border border-border/50 bg-card p-7 space-y-6 shadow-sm">

          {/* heading */}
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-xs text-muted-foreground/50">Sign in to your employee portal</p>
          </div>

          {/* error */}
          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 px-3.5 py-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
              <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
            </div>
          )}

          {/* form */}
          <form onSubmit={handleLogin} className="space-y-4">

            <div className="space-y-1.5">
              <Label htmlFor="eid" className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/50">
                Employee ID
              </Label>
              <Input
                id="eid"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. 2026-00001"
                autoComplete="username"
                disabled={isLoading}
                className="h-10 rounded-xl border-border/50 bg-muted/20 text-sm focus-visible:ring-emerald-500/30"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pwd" className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/50">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="pwd"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="h-10 rounded-xl border-border/50 bg-muted/20 text-sm pr-10 focus-visible:ring-emerald-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium gap-2 mt-1 transition-all"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </>
              )}
            </Button>
          </form>

          {/* separator + note */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border/40" />
            <p className="text-[10px] text-muted-foreground/30 font-medium">Authorized personnel only</p>
            <div className="flex-1 h-px bg-border/40" />
          </div>
        </div>

        {/* footer */}
        <p className="text-center text-[10px] text-muted-foreground/30">
          Action Auto CRM v1.0 &middot; Customer Lifecycle Management
        </p>

      </div>
    </div>
  )
}