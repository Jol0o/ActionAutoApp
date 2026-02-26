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
  CircleDot,
  Hash,
  Shield,
  Zap,
} from "lucide-react"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
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

function getGreeting(name: string) {
  const h = new Date().getHours()
  if (h >= 5 && h < 12)
    return { text: `Good Morning, ${name}`, icon: <Sun className="h-4 w-4 text-amber-400" /> }
  if (h >= 12 && h < 18)
    return { text: `Good Afternoon, ${name}`, icon: <Sunset className="h-4 w-4 text-orange-400" /> }
  return { text: `Good Evening, ${name}`, icon: <Moon className="h-4 w-4 text-indigo-400" /> }
}

function ini(n: string) {
  return n.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
}

function fmt(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

// ─── Live Clock ──────────────────────────────────────────────────────────────

function LiveClock() {
  const [now, setNow] = React.useState(new Date())
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border/50 px-3 py-1 bg-background/80 backdrop-blur-sm cursor-default select-none">
          <Clock className="h-3 w-3 text-muted-foreground/60" />
          <span className="font-mono text-xs font-medium tabular-nums text-foreground/80">
            {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">
          {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </TooltipContent>
    </Tooltip>
  )
}

// ─── Shift Timer ─────────────────────────────────────────────────────────────

function ShiftTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = React.useState({ h: 0, m: 0, s: 0 })

  React.useEffect(() => {
    const tick = () => {
      const diff = Date.now() - new Date(startTime).getTime()
      setElapsed({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startTime])

  const pad = (n: number) => n.toString().padStart(2, "0")
  const totalMin = elapsed.h * 60 + elapsed.m
  const progress = Math.min((totalMin / 480) * 100, 100)

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-end justify-center gap-0.5">
        {[
          { v: pad(elapsed.h), l: "h" },
          { v: pad(elapsed.m), l: "m" },
          { v: pad(elapsed.s), l: "s" },
        ].map((item, i) => (
          <React.Fragment key={item.l}>
            {i > 0 && (
              <span className="text-xl font-light text-muted-foreground/30 pb-1 mx-0.5">:</span>
            )}
            <div className="flex items-end gap-0.5">
              <span className="text-3xl font-mono font-semibold tabular-nums tracking-tight leading-none text-foreground">
                {item.v}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">
                {item.l}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>
      <div className="space-y-1.5 px-2">
        <Progress value={progress} className="h-[3px] bg-muted/40" />
        <p className="text-[10px] text-muted-foreground/50 text-center tabular-nums">
          {progress.toFixed(0)}% of 8-hour shift
        </p>
      </div>
    </div>
  )
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent: string
}) {
  return (
    <div className="group relative rounded-xl border border-border/50 bg-card px-4 py-3 flex items-center gap-3 hover:border-border transition-colors duration-200">
      <div className={`h-8 w-8 rounded-lg ${accent} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60 font-medium leading-none">
          {label}
        </p>
        <p className="text-sm font-semibold truncate mt-1 leading-none text-foreground">
          {value}
        </p>
      </div>
    </div>
  )
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export default function CrmDashboardPage() {
  const router = useRouter()
  const [user, setUser] = React.useState<CrmUserData | null>(null)
  const [token, setToken] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [todayLogs, setTodayLogs] = React.useState<CrmUserData["todayTimeLogs"]>([])
  const [isClocking, setIsClocking] = React.useState(false)
  const [clockMsg, setClockMsg] = React.useState("")

  React.useEffect(() => {
    const check = async () => {
      const t = localStorage.getItem("crm_token")
      if (!t) { router.replace("/crm"); return }
      try {
        const res = await apiClient.get("/api/crm/me", { headers: { Authorization: `Bearer ${t}` } })
        const data = res.data?.data || res.data
        setUser(data)
        setToken(t)
        setTodayLogs(data.todayTimeLogs || [])
      } catch {
        localStorage.removeItem("crm_token")
        localStorage.removeItem("crm_user")
        router.replace("/crm")
      } finally {
        setIsLoading(false)
      }
    }
    check()
  }, [router])

  const handleExit = async () => {
    try { await apiClient.post("/api/crm/logout", {}, { headers: { Authorization: `Bearer ${token}` } }) } catch {}
    localStorage.removeItem("crm_token")
    localStorage.removeItem("crm_user")
    router.push("/")
  }

  const handleClock = async (type: "time-in" | "time-out") => {
    setIsClocking(true)
    setClockMsg("")
    try {
      const res = await apiClient.post("/api/crm/time-clock", { type }, { headers: { Authorization: `Bearer ${token}` } })
      const data = res.data?.data || res.data
      setTodayLogs(data.todayLogs || [])
      setClockMsg(`${type === "time-in" ? "Clocked in" : "Clocked out"} at ${fmt(new Date())}`)
    } catch (err: any) {
      setClockMsg(err?.response?.data?.message || "Failed")
    } finally {
      setIsClocking(false)
    }
  }

  const timeIn = todayLogs?.find((l) => l.type === "time-in")
  const timeOut = todayLogs?.find((l) => l.type === "time-out")
  const hasClockedIn = !!timeIn
  const hasClockedOut = !!timeOut
  const isActive = hasClockedIn && !hasClockedOut
  const isComplete = hasClockedOut

  const finalHours = React.useMemo(() => {
    if (!timeIn || !timeOut) return null
    const diff = new Date(timeOut.timestamp).getTime() - new Date(timeIn.timestamp).getTime()
    return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`
  }, [timeIn, timeOut])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-600/10 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          </div>
          <p className="text-xs text-muted-foreground/60 tracking-wide">Loading workspace…</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const greeting = getGreeting(user.fullName.split(" ")[0])

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const statusConfig = {
    active: { label: "Active", classes: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
    complete: { label: "Complete", classes: "bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border-emerald-600/25" },
    idle: { label: "Idle", classes: "bg-muted/60 text-muted-foreground border-border/50" },
  }
  const currentStatus = isActive ? statusConfig.active : isComplete ? statusConfig.complete : statusConfig.idle

  return (
    <TooltipProvider>
      {/* Centered layout wrapper */}
      <div className="w-full space-y-5 pb-10 px-4 sm:px-6 lg:px-10 xl:px-16">

        {/* ══════════════════════════════════════════════
            TOPBAR
        ══════════════════════════════════════════════ */}
        <div className="flex items-center justify-between pt-1">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Car className="h-4 w-4 text-white" />
            </div>
            <div className="leading-none">
              <span className="text-sm font-bold tracking-tight">Action Auto</span>
              <span className="block text-[8px] font-bold uppercase tracking-[0.25em] text-emerald-600 mt-0.5">CRM</span>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <LiveClock />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-full gap-2 pl-1 pr-2.5 border border-border/50 hover:border-border hover:bg-muted/40 transition-all"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-emerald-600 text-white text-[9px] font-bold">
                      {ini(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-xs font-medium max-w-[100px] truncate">
                    {user.fullName}
                  </span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground/50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl p-0 overflow-hidden shadow-lg border-border/50">
                <div className="p-3.5 bg-muted/30">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="bg-emerald-600 text-white text-xs font-bold">
                        {ini(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{user.fullName}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-2.5">
                    <Badge variant="secondary" className="text-[9px] h-4.5 px-1.5 rounded-full">{user.username}</Badge>
                    <Badge variant="outline" className="text-[9px] h-4.5 px-1.5 rounded-full capitalize">{user.role}</Badge>
                  </div>
                </div>
                <DropdownMenuSeparator className="m-0" />
                <div className="p-1">
                  <DropdownMenuItem className="rounded-lg text-xs h-8 gap-2 cursor-pointer">
                    <User className="h-3.5 w-3.5 text-muted-foreground" /> My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg text-xs h-8 gap-2 cursor-pointer">
                    <Settings className="h-3.5 w-3.5 text-muted-foreground" /> Settings
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator className="m-0" />
                <div className="p-1">
                  <DropdownMenuItem
                    onClick={handleExit}
                    className="rounded-lg text-xs h-8 gap-2 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/5"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Exit CRM
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            PAGE HEADING
        ══════════════════════════════════════════════ */}
        <div className="text-center space-y-1 py-2">
          <div className="flex items-center justify-center gap-2">
            {greeting.icon}
            <h1 className="text-2xl font-bold tracking-tight">{greeting.text}</h1>
          </div>
          <p className="text-sm text-muted-foreground/60">{todayStr}</p>
        </div>

        {/* ══════════════════════════════════════════════
            MAIN CARDS
        ══════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* ── Identity Card ── */}
          <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
                Employee
              </p>
              <Badge
                className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${currentStatus.classes}`}
              >
                {currentStatus.label}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-emerald-500/20">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-emerald-600 text-white text-sm font-bold">
                  {ini(user.fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base font-semibold leading-tight">{user.fullName}</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">{user.email}</p>
              </div>
            </div>

            <Separator className="opacity-40" />

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
                <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/50 font-medium">Username</p>
                <p className="text-lg font-bold mt-1 leading-none">{user.username}</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
                <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/50 font-medium">Role</p>
                <p className="text-lg font-bold mt-1 leading-none capitalize">{user.role}</p>
              </div>
            </div>
          </div>

          {/* ── Time Clock Card ── */}
          <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
                Time Clock
              </p>
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isActive ? "bg-emerald-500 animate-pulse" : isComplete ? "bg-emerald-600" : "bg-muted-foreground/30"
                  }`}
                />
                <span className={`text-[10px] font-medium ${
                  isActive ? "text-emerald-600 dark:text-emerald-400"
                  : isComplete ? "text-emerald-700 dark:text-emerald-300"
                  : "text-muted-foreground/50"
                }`}>
                  {isActive ? "Shift active" : isComplete ? "Shift complete" : "Not clocked in"}
                </span>
              </div>
            </div>

            {/* Timer / Done / Idle display */}
            <div className="flex items-center justify-center min-h-[80px]">
              {isActive && timeIn && <ShiftTimer startTime={timeIn.timestamp} />}
              {isComplete && (
                <div className="text-center space-y-1.5">
                  <CheckCircle2 className="h-7 w-7 text-emerald-500 mx-auto" />
                  <p className="text-2xl font-bold tracking-tight leading-none">{finalHours}</p>
                  <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">Total hours</p>
                </div>
              )}
              {!hasClockedIn && (
                <div className="text-center space-y-1.5">
                  <div className="h-10 w-10 rounded-full border-2 border-dashed border-border/50 flex items-center justify-center mx-auto">
                    <Clock className="h-4 w-4 text-muted-foreground/30" />
                  </div>
                  <p className="text-xs text-muted-foreground/40">Ready to start</p>
                </div>
              )}
            </div>

            <Separator className="opacity-40" />

            {/* Clock In / Out times */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/50 font-medium">Clock In</p>
                <p className="text-sm font-semibold tabular-nums mt-0.5">
                  {timeIn ? fmt(new Date(timeIn.timestamp)) : "—"}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/50 font-medium">Clock Out</p>
                <p className="text-sm font-semibold tabular-nums mt-0.5">
                  {timeOut ? fmt(new Date(timeOut.timestamp)) : "—"}
                </p>
              </div>
            </div>

            {/* Action button */}
            {!hasClockedIn && (
              <Button
                onClick={() => handleClock("time-in")}
                disabled={isClocking}
                size="sm"
                className="w-full h-9 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-2 transition-all"
              >
                {isClocking
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <><Clock className="h-3.5 w-3.5" /> Clock In <ArrowRight className="h-3.5 w-3.5 ml-auto" /></>
                }
              </Button>
            )}
            {isActive && (
              <Button
                onClick={() => handleClock("time-out")}
                disabled={isClocking}
                variant="destructive"
                size="sm"
                className="w-full h-9 text-xs rounded-xl font-medium gap-2 transition-all"
              >
                {isClocking
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <><LogOut className="h-3.5 w-3.5" /> Clock Out <ArrowRight className="h-3.5 w-3.5 ml-auto" /></>
                }
              </Button>
            )}

            {clockMsg && (
              <p className="text-[11px] text-center text-muted-foreground/50">{clockMsg}</p>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            STAT ROW
        ══════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

          {/* Status */}
          <StatCard
            icon={<Zap className="h-4 w-4 text-emerald-600" />}
            accent="bg-emerald-500/10"
            label="Status"
            value={isActive ? "Active" : isComplete ? "Complete" : "Inactive"}
          />

          {/* View Timeproof Calendar */}
          <button
            onClick={() => router.push("/crm/timeproof")}
            className="group rounded-xl border border-border/50 bg-card px-4 py-3 flex items-center gap-3 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-200 text-left cursor-pointer"
          >
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
              <CalendarDays className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60 font-medium leading-none">Quick Link</p>
              <p className="text-sm font-semibold mt-1 leading-none text-foreground truncate">View Timeproof Calendar</p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          {/* My Account */}
          <button
            onClick={() => router.push("/crm/account")}
            className="group rounded-xl border border-border/50 bg-card px-4 py-3 flex items-center gap-3 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-200 text-left cursor-pointer"
          >
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
              <User className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60 font-medium leading-none">Quick Link</p>
              <p className="text-sm font-semibold mt-1 leading-none text-foreground">My Account</p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          {/* Role */}
          <StatCard
            icon={<Shield className="h-4 w-4 text-emerald-600" />}
            accent="bg-emerald-500/10"
            label="Role"
            value={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          />

        </div>

        {/* ══════════════════════════════════════════════
            APPOINTMENTS
        ══════════════════════════════════════════════ */}
        <AppointmentsPage />

      </div>
    </TooltipProvider>
  )
}