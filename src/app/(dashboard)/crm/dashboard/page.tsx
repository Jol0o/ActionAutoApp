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
  CalendarDays,
  Sun,
  Moon,
  Sunset,
  ArrowRight,
  Fingerprint,
  CalendarCheck,
  Activity,
  Sparkles,
  Coffee,
  Play,
  MessageSquare,
  Rss,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { apiClient } from "@/lib/api-client"
import { SupraLeoAI } from "@/components/supra-leo-ai/SupraLeoAI"

// ─── NEW import ───────────────────────────────────────────────────────────────
import { DashboardNotifications } from "@/components/crm/DashboardNotifications"

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
  if (h >= 5 && h < 12) return { text: `Good Morning, ${name}`, icon: <Sun className="h-4 w-4 text-amber-400" /> }
  if (h >= 12 && h < 18) return { text: `Good Afternoon, ${name}`, icon: <Sunset className="h-4 w-4 text-orange-400" /> }
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
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/15 px-3.5 py-1.5 bg-emerald-500/5 cursor-default select-none">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span className="font-mono text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
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

interface ShiftTimerProps {
  startTime: string
  breakAccumulatedMs: number
  breakStartedAt: number | null
}

function ShiftTimer({ startTime, breakAccumulatedMs, breakStartedAt }: ShiftTimerProps) {
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0)

  React.useEffect(() => {
    const id = setInterval(forceUpdate, 1000)
    return () => clearInterval(id)
  }, [])

  const now = Date.now()
  const totalElapsedMs = now - new Date(startTime).getTime()
  const currentBreakMs = breakAccumulatedMs + (breakStartedAt ? now - breakStartedAt : 0)
  const workedMs = Math.max(0, totalElapsedMs - currentBreakMs)

  const pad = (n: number) => n.toString().padStart(2, "0")
  const toHMS = (ms: number) => ({
    h: Math.floor(ms / 3600000),
    m: Math.floor((ms % 3600000) / 60000),
    s: Math.floor((ms % 60000) / 1000),
  })

  const worked = toHMS(workedMs)
  const breakTime = toHMS(currentBreakMs)
  const isOnBreak = breakStartedAt !== null

  return (
    <div className="w-full space-y-5">
      <div className="flex items-end justify-center gap-1">
        {[{ v: pad(worked.h), l: "hrs" }, { v: pad(worked.m), l: "min" }, { v: pad(worked.s), l: "sec" }].map((item, i) => (
          <React.Fragment key={item.l}>
            {i > 0 && (
              <span className={`text-2xl font-thin pb-2 mx-1 transition-colors duration-300 ${isOnBreak ? "text-amber-400/30" : "text-muted-foreground/20"}`}>:</span>
            )}
            <div className="flex flex-col items-center gap-1">
              <span className={`text-5xl font-mono font-bold tabular-nums tracking-tighter leading-none transition-colors duration-300 ${isOnBreak ? "text-muted-foreground/40" : ""}`}>
                {item.v}
              </span>
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground/30 font-medium">{item.l}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {isOnBreak && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2">
          <Coffee className="h-3.5 w-3.5 text-amber-500/70" />
          <span className="text-xs font-semibold text-amber-500/70">On Break</span>
          <span className="font-mono text-xs text-amber-500/50 tabular-nums ml-1">
            {pad(breakTime.h)}:{pad(breakTime.m)}:{pad(breakTime.s)}
          </span>
        </div>
      )}

      {!isOnBreak && currentBreakMs > 0 && (
        <div className="flex items-center justify-center gap-2">
          <Coffee className="h-3 w-3 text-muted-foreground/25" />
          <span className="text-[10px] text-muted-foreground/30 tabular-nums">
            Break: {pad(breakTime.h)}:{pad(breakTime.m)}:{pad(breakTime.s)}
          </span>
        </div>
      )}

      {!isOnBreak && currentBreakMs === 0 && (
        <div className="flex justify-center">
          <span className="text-[10px] text-muted-foreground/30 tabular-nums">
            {worked.h > 0 ? `${worked.h}h ${worked.m}m worked` : `${worked.m}m worked`}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Quick Action Button ──────────────────────────────────────────────────────

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/40 bg-card p-5 hover:border-emerald-500/25 hover:bg-emerald-500/[0.02] transition-all duration-200 cursor-pointer w-full aspect-square sm:aspect-auto sm:py-6"
    >
      <div className="h-11 w-11 rounded-xl bg-muted/40 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors duration-200">
        {icon}
      </div>
      <span className="text-xs font-semibold">{label}</span>
    </button>
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
  const [isOnBreak, setIsOnBreak] = React.useState(false)
  const [breakStartedAt, setBreakStartedAt] = React.useState<number | null>(null)
  const [breakAccumulatedMs, setBreakAccumulatedMs] = React.useState(0)

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
      if (type === "time-out") {
        setIsOnBreak(false)
        setBreakStartedAt(null)
        setBreakAccumulatedMs(0)
      }
      setClockMsg(`${type === "time-in" ? "Clocked in" : "Clocked out"} at ${fmt(new Date())}`)
    } catch (err: any) {
      setClockMsg(err?.response?.data?.message || "Failed")
    } finally {
      setIsClocking(false)
    }
  }

  const handleBreak = async () => {
    setClockMsg("")
    if (!isOnBreak) {
      const now = Date.now()
      setIsOnBreak(true)
      setBreakStartedAt(now)
      try {
        await apiClient.post("/api/crm/time-clock", { type: "break-start" }, { headers: { Authorization: `Bearer ${token}` } })
      } catch { /* non-blocking */ }
      setClockMsg(`Break started at ${fmt(new Date())}`)
    } else {
      const now = Date.now()
      const elapsed = breakStartedAt ? now - breakStartedAt : 0
      setBreakAccumulatedMs((prev) => prev + elapsed)
      setIsOnBreak(false)
      setBreakStartedAt(null)
      try {
        await apiClient.post("/api/crm/time-clock", { type: "break-end" }, { headers: { Authorization: `Bearer ${token}` } })
      } catch { /* non-blocking */ }
      setClockMsg(`Break ended at ${fmt(new Date())}`)
    }
  }

  const timeIn  = todayLogs?.find((l) => l.type === "time-in")
  const timeOut = todayLogs?.find((l) => l.type === "time-out")
  const hasClockedIn  = !!timeIn
  const hasClockedOut = !!timeOut
  const isActive   = hasClockedIn && !hasClockedOut
  const isComplete = hasClockedOut

  const finalHours = React.useMemo(() => {
    if (!timeIn || !timeOut) return null
    const totalMs = new Date(timeOut.timestamp).getTime() - new Date(timeIn.timestamp).getTime()
    const workedMs = Math.max(0, totalMs - breakAccumulatedMs)
    const h = Math.floor(workedMs / 3600000)
    const m = Math.floor((workedMs % 3600000) / 60000)
    return `${h}h ${m}m`
  }, [timeIn, timeOut, breakAccumulatedMs])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
          </div>
          <p className="text-xs text-muted-foreground/40 tracking-widest uppercase">Loading</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const greeting = getGreeting(user.fullName.split(" ")[0])
  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  })

  return (
    <TooltipProvider>
      <div className="min-h-screen w-full bg-background">

        {/* ── Topbar ── */}
        <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/90 backdrop-blur-xl">
          <div className="flex items-center justify-between h-14 px-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-sm">
                <Car className="h-4 w-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold leading-none">Action Auto</p>
                <p className="text-[9px] uppercase tracking-[0.25em] text-emerald-600 mt-0.5 font-bold">Workspace</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <LiveClock />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 gap-2 pl-1.5 pr-3 rounded-full border border-border/40 hover:bg-muted/50">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="bg-emerald-600 text-white text-[9px] font-bold">{ini(user.fullName)}</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-xs font-medium max-w-[100px] truncate">{user.fullName}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground/40" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-0 overflow-hidden shadow-xl border-border/40">
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-emerald-600 text-white text-xs font-bold">{ini(user.fullName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{user.fullName}</p>
                        <p className="text-[11px] text-muted-foreground/50 truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="m-0" />
                  <div className="p-1.5">
                    <DropdownMenuItem className="rounded-xl text-xs h-9 gap-2.5 cursor-pointer">
                      <User className="h-3.5 w-3.5 text-muted-foreground" /> My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/crm/settings")} className="rounded-xl text-xs h-9 gap-2.5 cursor-pointer">
                      <Settings className="h-3.5 w-3.5 text-muted-foreground" /> Settings
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator className="m-0" />
                  <div className="p-1.5">
                    <DropdownMenuItem onClick={handleExit} className="rounded-xl text-xs h-9 gap-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/5">
                      <LogOut className="h-3.5 w-3.5" /> Exit CRM
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="max-w-screen-xl mx-auto px-6 py-8 space-y-6">

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {greeting.icon}
              <h1 className="text-xl font-bold tracking-tight">{greeting.text}</h1>
              <Badge variant="outline" className="text-[10px] h-5 px-2 rounded-full capitalize font-semibold hidden sm:inline-flex">
                {user.role}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground/40 hidden sm:block">{todayStr}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* ─── Time Clock ─── */}
            <div className="lg:col-span-5 rounded-2xl border border-border/40 bg-card flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground/40" />
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40">Time Clock</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${isOnBreak ? "bg-amber-400 animate-pulse" : isActive ? "bg-emerald-500 animate-pulse" : isComplete ? "bg-emerald-500" : "bg-muted-foreground/20"}`} />
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${isOnBreak ? "text-amber-500" : isActive ? "text-emerald-500" : isComplete ? "text-emerald-600" : "text-muted-foreground/30"}`}>
                    {isOnBreak ? "On Break" : isActive ? "On Shift" : isComplete ? "Completed" : "Off Clock"}
                  </span>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center px-8 py-10 min-h-[200px]">
                {isActive && timeIn && (
                  <ShiftTimer
                    startTime={timeIn.timestamp}
                    breakAccumulatedMs={breakAccumulatedMs}
                    breakStartedAt={breakStartedAt}
                  />
                )}
                {isComplete && (
                  <div className="text-center space-y-3">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                    <p className="text-5xl font-mono font-bold tracking-tighter">{finalHours}</p>
                    <p className="text-xs text-muted-foreground/40 uppercase tracking-widest">Shift Complete</p>
                  </div>
                )}
                {!hasClockedIn && (
                  <div className="text-center space-y-3">
                    <div className="h-16 w-16 rounded-2xl border-2 border-dashed border-border/25 flex items-center justify-center mx-auto">
                      <Activity className="h-7 w-7 text-muted-foreground/15" />
                    </div>
                    <p className="text-sm text-muted-foreground/30">Not clocked in yet</p>
                  </div>
                )}
              </div>

              <div className="px-6 py-5 border-t border-border/30 space-y-4 bg-muted/[0.015]">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground/30 font-semibold mb-1.5">Time In</p>
                    <p className="text-2xl font-mono font-bold tabular-nums leading-none">
                      {timeIn ? fmt(new Date(timeIn.timestamp)) : "——"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground/30 font-semibold mb-1.5">Time Out</p>
                    <p className="text-2xl font-mono font-bold tabular-nums leading-none">
                      {timeOut ? fmt(new Date(timeOut.timestamp)) : "——"}
                    </p>
                  </div>
                </div>

                {!hasClockedIn && (
                  <Button
                    onClick={() => handleClock("time-in")}
                    disabled={isClocking}
                    className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-2 shadow-md shadow-emerald-600/15"
                  >
                    {isClocking
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <><Sparkles className="h-4 w-4" /> Start Shift <ArrowRight className="h-4 w-4 ml-auto opacity-50" /></>}
                  </Button>
                )}
                {isActive && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={handleBreak}
                      variant="outline"
                      className={`h-11 rounded-xl font-semibold gap-2 transition-all ${
                        isOnBreak
                          ? "border-amber-500/30 bg-amber-500/5 text-amber-600 hover:bg-amber-500/10 hover:border-amber-500/40"
                          : "border-border/50 hover:border-amber-500/30 hover:bg-amber-500/5 hover:text-amber-600"
                      }`}
                    >
                      {isOnBreak
                        ? <><Play className="h-4 w-4" /> Resume</>
                        : <><Coffee className="h-4 w-4" /> Break</>}
                    </Button>
                    <Button
                      onClick={() => handleClock("time-out")}
                      disabled={isClocking || isOnBreak}
                      variant="destructive"
                      className="h-11 rounded-xl font-semibold gap-2 transition-all disabled:opacity-40"
                    >
                      {isClocking
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <><LogOut className="h-4 w-4" /> End Shift</>}
                    </Button>
                  </div>
                )}

                {clockMsg && (
                  <p className="text-xs text-center text-emerald-500/60 font-medium">{clockMsg}</p>
                )}
              </div>
            </div>

            {/* ─── Right column ─── */}
            <div className="lg:col-span-7 flex flex-col gap-6">

              <div className="rounded-2xl border border-border/40 bg-card p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40 mb-5">My Profile</p>
                <div className="flex items-center gap-4 pb-5 border-b border-border/30">
                  <Avatar className="h-14 w-14 ring-2 ring-border/40">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-emerald-600 text-white text-base font-bold">{ini(user.fullName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-base font-bold">{user.fullName}</p>
                    <p className="text-sm text-muted-foreground/50 mt-0.5">{user.email}</p>
                    <div className="flex gap-1.5 mt-2">
                      <Badge variant="secondary" className="text-[10px] h-5 px-2 rounded-full font-semibold">{user.username}</Badge>
                      <Badge variant="outline"   className="text-[10px] h-5 px-2 rounded-full capitalize font-semibold">{user.role}</Badge>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-4">
                  {[
                    { label: "Full Name", value: user.fullName },
                    { label: "Username",  value: user.username },
                    { label: "Role",      value: user.role },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-muted/30 px-4 py-3">
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-semibold">{item.label}</p>
                      <p className="text-sm font-bold mt-1.5 truncate capitalize">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border/40 bg-card p-6 flex-1">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40 mb-5">Quick Actions</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <QuickAction icon={<CalendarCheck className="h-5 w-5 text-emerald-500" />} label="Appointments" onClick={() => router.push("/crm/appointments")} />
                  <QuickAction icon={<CalendarDays className="h-5 w-5 text-emerald-500" />} label="Timeproof" onClick={() => router.push("/crm/timeproof")} />
                  <QuickAction icon={<MessageSquare className="h-5 w-5 text-emerald-500" />} label="Supra Space" onClick={() => router.push("/crm/supra-space")} />
                  <QuickAction icon={<Fingerprint className="h-5 w-5 text-emerald-500" />} label="Biometrics" onClick={() => router.push("/crm/biometrics")} />
                  <QuickAction icon={<Rss className="h-5 w-5 text-emerald-500" />} label="Feeds" onClick={() => router.push("/crm/feeds")} />
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>

      {/* ── Supra Leo AI badge (unchanged) ── */}
      <SupraLeoAI />

      {/* ── Dashboard Notifications — renders after full auth ── */}
      <DashboardNotifications
        user={user}
        token={token}
        hasClockedIn={hasClockedIn}
      />

    </TooltipProvider>
  )
}