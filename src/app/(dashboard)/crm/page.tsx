"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Car,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  Fingerprint,
  ScanFace,
  Terminal,
  Copy,
  Check,
  KeyRound,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api-client"
import {
  isWebAuthnSupported,
  startAuthentication,
} from "@/lib/webauthn"

type LoginMode = "password" | "biometric" | "ssh"

export default function CrmLoginPage() {
  const router = useRouter()

  // Form state
  const [username, setUsername]             = React.useState("")
  const [password, setPassword]             = React.useState("")
  const [showPassword, setShowPassword]     = React.useState(false)
  const [isLoading, setIsLoading]           = React.useState(false)
  const [error, setError]                   = React.useState("")
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true)

  // Mode
  const [loginMode, setLoginMode] = React.useState<LoginMode>("password")

  // Biometric state
  const [biometricAvailable, setBiometricAvailable] = React.useState(false)
  const [biometricLoading, setBiometricLoading]     = React.useState(false)

  // SSH key state
  const [sshChallenge, setSshChallenge]       = React.useState("")
  const [sshStoreKey, setSshStoreKey]         = React.useState("")
  const [sshSignature, setSshSignature]       = React.useState("")
  const [sshLoading, setSshLoading]           = React.useState(false)
  const [sshCopied, setSshCopied]             = React.useState(false)
  const [sshChallengeReady, setSshChallengeReady] = React.useState(false)

  /* ── Check existing session & biometric support ──────────────────────────── */
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

    isWebAuthnSupported().then(setBiometricAvailable)
  }, [router])

  /* ── Password Login ──────────────────────────────────────────────────────── */
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

  /* ── Biometric Login ─────────────────────────────────────────────────────── */
  const handleBiometricLogin = async () => {
    setError("")
    setBiometricLoading(true)

    try {
      const optRes = await apiClient.post("/api/crm/biometric/auth/options", {
        username: username.trim() || undefined,
      })
      const { options, storeKey } = optRes.data?.data

      const credential = await startAuthentication(options)

      const verifyRes = await apiClient.post("/api/crm/biometric/auth/verify", {
        credential,
        storeKey,
      })

      const data = verifyRes.data?.data
      if (data.token && data.user) {
        localStorage.setItem("crm_token", data.token)
        localStorage.setItem("crm_user", JSON.stringify(data.user))
        router.push("/crm/dashboard")
      } else {
        setError("Biometric authentication failed.")
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Biometric authentication failed. Try password login."

      if (!msg.toLowerCase().includes("cancel")) {
        setError(msg)
      }
    } finally {
      setBiometricLoading(false)
    }
  }

  /* ── SSH Key Login ───────────────────────────────────────────────────────── */

  // Step 1: Request challenge from server
  const handleSshRequestChallenge = async () => {
    setError("")
    setSshLoading(true)
    setSshChallengeReady(false)
    setSshSignature("")

    if (!username.trim()) {
      setError("Enter your Employee ID first to request an SSH challenge.")
      setSshLoading(false)
      return
    }

    try {
      const res = await apiClient.post("/api/crm/biometric/ssh/challenge", {
        username: username.trim(),
      })
      const data = res.data?.data
      setSshChallenge(data.challenge)
      setSshStoreKey(data.storeKey)
      setSshChallengeReady(true)
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to get SSH challenge. Do you have an SSH key registered?"
      )
    } finally {
      setSshLoading(false)
    }
  }

  // Copy the terminal command
  const copySshCommand = () => {
    const cmd = `echo "${sshChallenge}" | ssh-keygen -Y sign -f ~/.ssh/id_ed25519 -n crm-login`
    navigator.clipboard.writeText(cmd)
    setSshCopied(true)
    setTimeout(() => setSshCopied(false), 2000)
  }

  // Step 2: Submit signature for verification
  const handleSshVerify = async () => {
    setError("")
    if (!sshSignature.trim()) {
      setError("Please paste the signature output from your terminal.")
      return
    }

    setSshLoading(true)
    try {
      const res = await apiClient.post("/api/crm/biometric/ssh/verify", {
        username: username.trim(),
        storeKey: sshStoreKey,
        signature: sshSignature.trim(),
      })

      const data = res.data?.data
      if (data.token && data.user) {
        localStorage.setItem("crm_token", data.token)
        localStorage.setItem("crm_user", JSON.stringify(data.user))
        router.push("/crm/dashboard")
      } else {
        setError("SSH authentication failed.")
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "SSH signature verification failed.")
    } finally {
      setSshLoading(false)
    }
  }

  /* ── Mode switch ─────────────────────────────────────────────────────────── */
  const switchMode = (mode: LoginMode) => {
    setError("")
    setLoginMode(mode)
    setSshChallengeReady(false)
    setSshChallenge("")
    setSshSignature("")
  }

  /* ── Auth check loader ───────────────────────────────────────────────────── */
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

  /* ── Login Page ──────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-background">
      <div className="w-full max-w-[400px] space-y-8">

        {/* ── Brand ── */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-14 w-14 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Car className="h-7 w-7 text-white" />
            </div>
            <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background flex items-center justify-center">
              <span className="h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background" />
            </span>
          </div>
          <div className="text-center leading-none">
            <p className="text-base font-bold tracking-tight">Action Auto</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-emerald-600 mt-1">
              CRM System
            </p>
          </div>
        </div>

        {/* ── Card ── */}
        <div className="rounded-2xl border border-border/50 bg-card p-7 space-y-5 shadow-sm">
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-xs text-muted-foreground/50">Sign in to your employee portal</p>
          </div>

          {/* ── Auth Method Tabs ── */}
          <div className="flex rounded-xl border border-border/40 bg-muted/20 p-0.5 gap-0.5">
            <button
              onClick={() => switchMode("password")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-medium transition-all ${
                loginMode === "password"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground/50 hover:text-muted-foreground"
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Password
            </button>
            {biometricAvailable && (
              <button
                onClick={() => switchMode("biometric")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-medium transition-all ${
                  loginMode === "biometric"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground/50 hover:text-muted-foreground"
                }`}
              >
                <Fingerprint className="h-3.5 w-3.5" />
                Biometric
              </button>
            )}
            <button
              onClick={() => switchMode("ssh")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-medium transition-all ${
                loginMode === "ssh"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground/50 hover:text-muted-foreground"
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              SSH Key
            </button>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 px-3.5 py-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
              <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/*  PASSWORD MODE                                                 */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {loginMode === "password" && (
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
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/*  BIOMETRIC MODE                                                */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {loginMode === "biometric" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/50">
                  Employee ID (optional)
                </Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. 2026-00001"
                  disabled={biometricLoading}
                  className="h-10 rounded-xl border-border/50 bg-muted/20 text-sm focus-visible:ring-emerald-500/30"
                />
                <p className="text-[10px] text-muted-foreground/40">
                  Leave blank to use discoverable credentials
                </p>
              </div>

              <Button
                type="button"
                onClick={handleBiometricLogin}
                disabled={biometricLoading || isLoading}
                className="w-full h-12 rounded-xl border-2 border-emerald-600/30 bg-emerald-600/5 hover:bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 text-sm font-medium gap-3 transition-all"
                variant="ghost"
              >
                {biometricLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <div className="flex items-center gap-2">
                    <Fingerprint className="h-5 w-5" />
                    <span className="text-muted-foreground/30">/</span>
                    <ScanFace className="h-5 w-5" />
                  </div>
                )}
                {biometricLoading ? "Verifying biometric…" : "Authenticate with Biometrics"}
              </Button>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/*  SSH KEY MODE                                                  */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {loginMode === "ssh" && (
            <div className="space-y-4">
              {/* Step 1: Employee ID + Get Challenge */}
              {!sshChallengeReady && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/50">
                      Employee ID
                    </Label>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. 2026-00001"
                      disabled={sshLoading}
                      className="h-10 rounded-xl border-border/50 bg-muted/20 text-sm focus-visible:ring-emerald-500/30"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleSshRequestChallenge}
                    disabled={sshLoading}
                    className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium gap-2 transition-all"
                  >
                    {sshLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Terminal className="h-4 w-4" />
                    )}
                    {sshLoading ? "Requesting…" : "Get SSH Challenge"}
                  </Button>

                  <div className="rounded-xl bg-muted/20 border border-border/30 px-3.5 py-2.5 space-y-1.5">
                    <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">How it works</p>
                    <ol className="text-[11px] text-muted-foreground/50 space-y-1 list-decimal pl-4">
                      <li>Enter your Employee ID and click &quot;Get SSH Challenge&quot;</li>
                      <li>Copy the sign command and run it in your terminal</li>
                      <li>Paste the signature output back here to sign in</li>
                    </ol>
                  </div>
                </>
              )}

              {/* Step 2: Show challenge + collect signature */}
              {sshChallengeReady && (
                <>
                  {/* Challenge display */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/50">
                      Step 1 — Run this in your terminal
                    </p>
                    <div className="relative rounded-xl bg-zinc-950 dark:bg-zinc-900 border border-border/30 p-3 group">
                      <code className="text-[10px] text-emerald-400 font-mono break-all leading-relaxed block pr-8">
                        echo &quot;{sshChallenge}&quot; | ssh-keygen -Y sign -f ~/.ssh/id_ed25519 -n crm-login
                      </code>
                      <button
                        onClick={copySshCommand}
                        className="absolute top-2.5 right-2.5 h-7 w-7 rounded-md flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                        title="Copy command"
                      >
                        {sshCopied ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground/40">
                      Using a different key? Replace <code className="text-[10px] bg-muted/40 rounded px-1 py-0.5">id_ed25519</code> with your key file name.
                    </p>
                  </div>

                  {/* Signature input */}
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/50">
                      Step 2 — Paste the signature output
                    </p>
                    <textarea
                      value={sshSignature}
                      onChange={(e) => setSshSignature(e.target.value)}
                      placeholder={"-----BEGIN SSH SIGNATURE-----\n...\n-----END SSH SIGNATURE-----"}
                      rows={5}
                      disabled={sshLoading}
                      className="w-full rounded-xl border border-border/50 bg-muted/20 text-xs font-mono p-3 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 placeholder:text-muted-foreground/20"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleSshVerify}
                      disabled={sshLoading || !sshSignature.trim()}
                      className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium gap-2 transition-all"
                    >
                      {sshLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Terminal className="h-4 w-4" />
                      )}
                      {sshLoading ? "Verifying…" : "Verify & Sign In"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setSshChallengeReady(false)
                        setSshChallenge("")
                        setSshSignature("")
                        setSshStoreKey("")
                      }}
                      className="h-10 rounded-xl text-xs text-muted-foreground"
                    >
                      Reset
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Footer separator ── */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border/40" />
            <p className="text-[10px] text-muted-foreground/30 font-medium">
              Authorized personnel only
            </p>
            <div className="flex-1 h-px bg-border/40" />
          </div>
        </div>

        {/* ── Footer ── */}
        <p className="text-center text-[10px] text-muted-foreground/30">
          Action Auto CRM v1.0 &middot; Customer Lifecycle Management
        </p>
      </div>
    </div>
  )
}
