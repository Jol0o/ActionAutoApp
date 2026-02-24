"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Car, Eye, EyeOff, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"

export default function CrmLoginPage() {
  const router = useRouter()
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true)

  // Check if already logged in — redirect to dashboard
  React.useEffect(() => {
    const token = localStorage.getItem("crm_token")
    if (token) {
      apiClient
        .get("/api/crm/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          router.replace("/crm/dashboard")
        })
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
      setError("Please enter both Employee ID and password")
      return
    }

    setIsLoading(true)

    try {
      const response = await apiClient.post("/api/crm/login", {
        username: username.trim(),
        password,
      })

      const data = response.data?.data || response.data
      const token = data.token
      const user = data.user

      if (token && user) {
        localStorage.setItem("crm_token", token)
        localStorage.setItem("crm_user", JSON.stringify(user))
        router.push("/crm/dashboard")
      } else {
        setError("Login failed. Please try again.")
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.data?.message ||
        "Invalid Employee ID or password"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  // Show nothing while checking existing auth
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30">
            <Car className="h-8 w-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              Action Auto
            </h1>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              CRM System
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-card border rounded-2xl p-8 shadow-lg">
          <div className="mb-6">
            <h2 className="text-2xl font-bold italic">
              Welcome back
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to continue | Employee Portal Login
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Employee ID */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Employee ID
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. 2026-00001"
                className="w-full h-12 px-4 rounded-lg bg-muted/50 border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                autoComplete="username"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-12 px-4 pr-12 rounded-lg bg-muted/50 border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Action Auto CRM v1.0 &middot; Customer Life Cycle Management
        </p>
      </div>
    </div>
  )
}