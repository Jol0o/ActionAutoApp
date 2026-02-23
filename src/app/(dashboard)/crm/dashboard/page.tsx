"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Car,
  LogOut,
  User,
  Settings,
  Clock,
  ChevronDown,
  Loader2,
  CheckCircle2,
  Timer,
  CalendarDays,
  Sun,
  Moon,
  Sunset,
  ArrowRight,
  Activity,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api-client"
import AppointmentsPage from "@/app/(dashboard)/appointments/page"

// ─── Types ───────────────────────────────────────────────────────────────────

interface CrmUserData {
  _id: string
  fullName: string
  username: string
  email: string
  avatar?: string
  role: string
  todayTimeLogs?: Array<{
    _id: string
    type: "time-in" | "time-out"
    timestamp: string
  }>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(name: string): { text: string; icon: React.ReactNode } {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12)
    return {
      text: `Good Morning, ${name}`,
      icon: <Sun className="h-6 w-6 text-amber-500" />,
    }
  if (hour >= 12 && hour < 18)
    return {
      text: `Good Afternoon, ${name}`,
      icon: <Sunset className="h-6 w-6 text-orange-500" />,
    }
  return {
    text: `Good Evening, ${name}`,
    icon: <Moon className="h-6 w-6 text-indigo-400" />,
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

// ─── Real-Time Clock ─────────────────────────────────────────────────────────

function LiveClock() {
  const [now, setNow] = React.useState(new Date())

  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })

  return (
    <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full bg-muted/60 border">
      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{dateStr}</span>
      <div className="w-px h-4 bg-border" />
      <span className="text-sm font-mono font-semibold tabular-nums tracking-wide">
        {timeStr}
      </span>
    </div>
  )
}

// ─── Time Clock Module ───────────────────────────────────────────────────────

function TimeClockModule({
  user,
  token,
}: {
  user: CrmUserData
  token: string
}) {
  const [todayLogs, setTodayLogs] = React.useState<CrmUserData["todayTimeLogs"]>(
    user.todayTimeLogs || []
  )
  const [isClocking, setIsClocking] = React.useState(false)
  const [clockMsg, setClockMsg] = React.useState("")

  const timeIn = todayLogs?.find((l) => l.type === "time-in")
  const timeOut = todayLogs?.find((l) => l.type === "time-out")
  const hasClockedIn = !!timeIn
  const hasClockedOut = !!timeOut

  const elapsedTime = React.useMemo(() => {
    if (!timeIn) return null
    const start = new Date(timeIn.timestamp).getTime()
    const end = timeOut ? new Date(timeOut.timestamp).getTime() : Date.now()
    const diff = end - start
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    return `${hours}h ${minutes}m`
  }, [timeIn, timeOut])

  const handleClock = async (type: "time-in" | "time-out") => {
    setIsClocking(true)
    setClockMsg("")
    try {
      const res = await apiClient.post(
        "/api/crm/time-clock",
        { type },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = res.data?.data || res.data
      setTodayLogs(data.todayLogs || [])
      setClockMsg(
        type === "time-in"
          ? `Clocked in at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
          : `Clocked out at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      )
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || `Failed to ${type.replace("-", " ")}`
      setClockMsg(msg)
    } finally {
      setIsClocking(false)
    }
  }

  const statusBadge = hasClockedOut
    ? { label: "Shift Complete", className: "bg-green-600 hover:bg-green-600 text-white" }
    : hasClockedIn
    ? { label: "On Shift", className: "bg-blue-600 hover:bg-blue-600 text-white animate-pulse" }
    : { label: "Not Clocked In", className: "" }

  return (
    <Card className="overflow-hidden h-full">
      <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500" />
      <CardContent className="p-5 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600/10 dark:bg-blue-500/10">
              <Timer className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="font-semibold text-sm">Time Clock</span>
          </div>
          <Badge
            variant={hasClockedOut || hasClockedIn ? "default" : "secondary"}
            className={`text-xs ${statusBadge.className}`}
          >
            {statusBadge.label}
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2.5 rounded-lg bg-muted/50">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">In</p>
            <p className="text-sm font-semibold tabular-nums">
              {timeIn ? formatTime(new Date(timeIn.timestamp)) : "—"}
            </p>
          </div>
          <div className="text-center p-2.5 rounded-lg bg-muted/50">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Out</p>
            <p className="text-sm font-semibold tabular-nums">
              {timeOut ? formatTime(new Date(timeOut.timestamp)) : "—"}
            </p>
          </div>
          <div className="text-center p-2.5 rounded-lg bg-muted/50">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Hours</p>
            <p className="text-sm font-semibold tabular-nums">
              {elapsedTime || "—"}
            </p>
          </div>
        </div>

        {/* Spacer to push button down */}
        <div className="flex-1" />

        {/* Clock Button */}
        {!hasClockedIn ? (
          <button
            onClick={() => handleClock("time-in")}
            disabled={isClocking}
            className="w-full h-10 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            {isClocking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Clock className="h-4 w-4" />
                Clock In
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </>
            )}
          </button>
        ) : !hasClockedOut ? (
          <button
            onClick={() => handleClock("time-out")}
            disabled={isClocking}
            className="w-full h-10 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            {isClocking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                Clock Out
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </>
            )}
          </button>
        ) : (
          <div className="w-full h-10 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 flex items-center justify-center gap-2 text-green-700 dark:text-green-400 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Shift complete for today
          </div>
        )}

        {clockMsg && (
          <p className="text-xs text-muted-foreground mt-2.5 text-center">
            {clockMsg}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function CrmDashboardPage() {
  const router = useRouter()
  const [user, setUser] = React.useState<CrmUserData | null>(null)
  const [token, setToken] = React.useState<string>("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [profileOpen, setProfileOpen] = React.useState(false)
  const profileRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  React.useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("crm_token")
      if (!storedToken) {
        router.replace("/crm")
        return
      }
      try {
        const res = await apiClient.get("/api/crm/me", {
          headers: { Authorization: `Bearer ${storedToken}` },
        })
        const data = res.data?.data || res.data
        setUser(data)
        setToken(storedToken)
      } catch {
        localStorage.removeItem("crm_token")
        localStorage.removeItem("crm_user")
        router.replace("/crm")
      } finally {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const handleExit = async () => {
    try {
      await apiClient.post(
        "/api/crm/logout",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
    } catch {
      // Silent
    }
    localStorage.removeItem("crm_token")
    localStorage.removeItem("crm_user")
    router.push("/")
  }

  // Loading
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Car className="h-6 w-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border flex items-center justify-center">
              <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Loading CRM</p>
            <p className="text-xs text-muted-foreground mt-0.5">Preparing your workspace...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  const greeting = getGreeting(user.fullName.split(" ")[0])

  return (
    <div className="fixed inset-0 z-[100] bg-background overflow-auto">

      {/* ═══════════ TOP NAV ═══════════ */}
      <header className="sticky top-0 z-[110] w-full border-b bg-background/80 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4 lg:px-6 max-w-[1600px] mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 shadow-sm shadow-blue-600/20">
              <Car className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-none tracking-tight">Action Auto</p>
              <p className="text-[9px] font-extrabold text-green-600 uppercase tracking-[0.2em] leading-tight">
                CRM System
              </p>
            </div>
          </div>

          {/* Clock */}
          <LiveClock />

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 pl-2.5 pr-3 py-1.5 rounded-full hover:bg-muted/80 border border-transparent hover:border-border transition-all"
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.fullName} className="w-7 h-7 rounded-full object-cover ring-2 ring-background" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-background">
                  {getInitials(user.fullName)}
                </div>
              )}
              <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">
                {user.fullName}
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${profileOpen ? "rotate-180" : ""}`} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-card border rounded-xl shadow-xl shadow-black/5 dark:shadow-black/20 overflow-hidden">
                <div className="p-4 bg-muted/30">
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.fullName} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center text-xs font-bold">
                        {getInitials(user.fullName)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{user.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <Badge variant="secondary" className="text-[10px] font-medium">ID: {user.username}</Badge>
                    <Badge variant="secondary" className="text-[10px] font-medium capitalize">{user.role}</Badge>
                  </div>
                </div>
                <div className="p-1.5">
                  <button onClick={() => setProfileOpen(false)} className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted/80 transition-colors">
                    <User className="h-4 w-4 text-muted-foreground" />
                    My Profile
                  </button>
                  <button onClick={() => setProfileOpen(false)} className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted/80 transition-colors">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Settings
                  </button>
                </div>
                <div className="border-t p-1.5">
                  <button onClick={handleExit} className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                    <LogOut className="h-4 w-4" />
                    Exit CRM
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══════════ HERO: GREETING + TIME CLOCK ═══════════ */}
      <section className="border-b bg-muted/20">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6">
          <div className="grid grid-cols-2 gap-5 items-stretch">

            {/* Left: Greeting */}
            <Card className="overflow-hidden h-full">
              <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500" />
              <CardContent className="p-5 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600/10 dark:bg-blue-500/10">
                      {greeting.icon}
                    </div>
                    <span className="font-semibold text-sm">Daily Greeting</span>
                  </div>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {user.role}
                  </Badge>
                </div>

                {/* Main Greeting - flex-1 so it stretches */}
                <div className="flex-1 flex flex-col justify-center gap-2">
                  <h1 className="text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
                    {greeting.text}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Here&apos;s your dealership overview for today.
                  </p>
                </div>

                {/* Bottom Stats */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="text-center p-2.5 rounded-lg bg-muted/50">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Status</p>
                    <p className="text-sm font-semibold">
                      {user.todayTimeLogs?.find((l) => l.type === "time-in") &&
                      !user.todayTimeLogs?.find((l) => l.type === "time-out")
                        ? "Active"
                        : user.todayTimeLogs?.find((l) => l.type === "time-out")
                        ? "Complete"
                        : "Inactive"}
                    </p>
                  </div>
                  <div className="text-center p-2.5 rounded-lg bg-muted/50">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Date</p>
                    <p className="text-sm font-semibold">
                      {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="text-center p-2.5 rounded-lg bg-muted/50">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Role</p>
                    <p className="text-sm font-semibold capitalize truncate">{user.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right: Time Clock */}
            <div className="w-full h-full">
              <TimeClockModule user={user} token={token} />
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════ APPOINTMENTS ═══════════ */}
      <section className="max-w-[1600px] mx-auto">
        <AppointmentsPage />
      </section>

    </div>
  )
}