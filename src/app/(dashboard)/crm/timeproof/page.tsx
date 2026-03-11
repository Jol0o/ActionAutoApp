"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Flame,
  Timer,
  Calendar,
  TrendingUp,
  Loader2,
  Copy,
  Check,
  Download,
  Shield,
  Radio,
  Zap,
  Clock,
  X,
} from "lucide-react"
import { apiClient } from "@/lib/api-client"

/* ─────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────── */
interface Session {
  in: string
  out: string | null
  duration: number
  isLive: boolean
}

interface DayData {
  sessions: Session[]
  totalSeconds: number
}

interface HoursSummary {
  hours: number
  minutes: number
  totalSeconds: number
  decimal: number
}

interface TimeprofData {
  user: {
    _id: string
    fullName: string
    username: string
    avatar?: string
    role: string
  }
  calendar: Record<string, DayData>
  summary: {
    today: HoursSummary
    thisWeek: HoursSummary
    thisMonth: HoursSummary
  }
  streak: number
  longestStreak: number
  hourPattern: number[]
  isLive: boolean
  range: { startDate: string; endDate: string }
}

/* ─────────────────────────────────────────────────────────────────────────
   Utilities
───────────────────────────────────────────────────────────────────────── */
const toDateStr = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

const fmtHHMM = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

const fmtHuman = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0 && m === 0) return "0m"
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })

/* Color tiers matching OnlineJobs.ph style */
const getDayColor = (seconds: number, isToday: boolean) => {
  if (isToday && seconds === 0)
    return { bg: "bg-amber-400/10 border-amber-400/40", bar: "bg-muted/40", text: "text-muted-foreground/30" }
  const h = seconds / 3600
  if (h === 0) return { bg: "", bar: "", text: "" }
  if (h >= 9)   return { bg: "bg-emerald-950/[0.07] border-emerald-500/25", bar: "bg-emerald-500",   text: "text-white" }
  if (h >= 6)   return { bg: "bg-emerald-950/[0.05] border-emerald-600/20", bar: "bg-emerald-600",   text: "text-white" }
  if (h >= 4)   return { bg: "bg-sky-950/[0.05] border-sky-600/20",         bar: "bg-sky-600",       text: "text-white" }
  if (h >= 2)   return { bg: "bg-sky-950/[0.03] border-sky-700/15",         bar: "bg-sky-700",       text: "text-white" }
  return              { bg: "bg-rose-950/[0.05] border-rose-500/20",        bar: "bg-rose-500",      text: "text-white" }
}

/* ─────────────────────────────────────────────────────────────────────────
   Day Detail Popover
───────────────────────────────────────────────────────────────────────── */
const DayPopover = ({
  dateStr,
  dayData,
  onClose,
}: {
  dateStr: string
  dayData: DayData | null
  onClose: () => void
}) => {
  const date = new Date(dateStr + "T12:00:00")
  const isToday = dateStr === toDateStr(new Date())
  const label = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const HOUR_START = 6
  const HOUR_END = 22
  const toPos = (iso: string) => {
    const d = new Date(iso)
    const mins = (d.getHours() - HOUR_START) * 60 + d.getMinutes()
    return Math.max(0, Math.min(100, (mins / ((HOUR_END - HOUR_START) * 60)) * 100))
  }
  const nowPos = isToday
    ? (() => {
        const now = new Date()
        const mins = (now.getHours() - HOUR_START) * 60 + now.getMinutes()
        return Math.max(0, Math.min(100, (mins / ((HOUR_END - HOUR_START) * 60)) * 100))
      })()
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border/30">
          <div>
            <p className="text-xs font-black tracking-tight">{label}</p>
            {dayData && dayData.totalSeconds > 0 ? (
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                {dayData.sessions.length} session{dayData.sessions.length !== 1 ? "s" : ""} ·{" "}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {fmtHuman(dayData.totalSeconds)} total
                </span>
              </p>
            ) : (
              <p className="text-[10px] text-muted-foreground/35 mt-0.5">No activity</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {!dayData || dayData.sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Clock className="h-6 w-6 text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground/30">No activity recorded</p>
            </div>
          ) : (
            <>
              {/* Timeline bar */}
              <div className="space-y-1.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/35">
                  Timeline
                </p>
                <div className="relative h-8 rounded-lg bg-muted/20 overflow-hidden border border-border/20">
                  {[8, 10, 12, 14, 16, 18, 20].map((h) => (
                    <div
                      key={h}
                      className="absolute top-0 bottom-0 w-px bg-border/20"
                      style={{ left: `${((h - HOUR_START) / (HOUR_END - HOUR_START)) * 100}%` }}
                    />
                  ))}
                  {dayData.sessions.map((s, i) => {
                    const left = toPos(s.in)
                    const right = s.out ? toPos(s.out) : isToday ? nowPos ?? 100 : 100
                    const width = Math.max(right - left, 0.5)
                    return (
                      <div
                        key={i}
                        className={`absolute top-1 bottom-1 rounded-md ${
                          s.isLive ? "bg-emerald-400 animate-pulse" : "bg-emerald-500/80"
                        }`}
                        style={{ left: `${left}%`, width: `${width}%` }}
                      />
                    )
                  })}
                  {isToday && nowPos !== null && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white/50 z-10"
                      style={{ left: `${nowPos}%` }}
                    />
                  )}
                </div>
                <div className="flex justify-between">
                  {[6, 9, 12, 15, 18, 21].map((h) => (
                    <span key={h} className="text-[7px] text-muted-foreground/25">
                      {h > 12 ? `${h - 12}p` : h === 12 ? "12p" : `${h}a`}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sessions list */}
              <div className="space-y-1.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/35">
                  Sessions
                </p>
                {dayData.sessions.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 rounded-lg bg-muted/20 border border-border/20 px-3 py-2"
                  >
                    <div
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        s.isLive ? "bg-emerald-400 animate-pulse" : "bg-emerald-500"
                      }`}
                    />
                    <span className="text-[11px] font-mono text-muted-foreground flex-1">
                      {fmtTime(s.in)}
                      <span className="mx-1.5 text-muted-foreground/30">–</span>
                      {s.out ? (
                        fmtTime(s.out)
                      ) : (
                        <span className="text-emerald-500 font-bold">now</span>
                      )}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      {fmtHuman(s.duration)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Stat Card
───────────────────────────────────────────────────────────────────────── */
const StatCard = ({
  label,
  value,
  sub,
  icon: Icon,
  accent = false,
  amber = false,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  accent?: boolean
  amber?: boolean
}) => (
  <div
    className={`rounded-xl border px-4 py-3.5 space-y-2 ${
      accent
        ? "border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20"
        : amber
        ? "border-amber-500/25 bg-amber-50/40 dark:bg-amber-950/15"
        : "border-border/40 bg-card"
    }`}
  >
    <div className="flex items-center justify-between">
      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground/40">
        {label}
      </p>
      <Icon
        className={`h-3.5 w-3.5 ${
          accent ? "text-emerald-600" : amber ? "text-amber-500" : "text-muted-foreground/25"
        }`}
      />
    </div>
    <p
      className={`text-2xl font-black tracking-tight leading-none ${
        accent
          ? "text-emerald-700 dark:text-emerald-300"
          : amber
          ? "text-amber-700 dark:text-amber-300"
          : ""
      }`}
    >
      {value}
    </p>
    {sub && <p className="text-[10px] text-muted-foreground/40 leading-none">{sub}</p>}
  </div>
)

/* ─────────────────────────────────────────────────────────────────────────
   Work Rhythm bar chart (24-hour)
───────────────────────────────────────────────────────────────────────── */
const WorkRhythm = ({ pattern }: { pattern: number[] }) => {
  const max = Math.max(...pattern, 1)
  return (
    <div className="space-y-1">
      <div className="flex items-end gap-px h-10">
        {pattern.map((count, hour) => {
          const pct = (count / max) * 100
          const isCore = hour >= 8 && hour <= 18
          return (
            <div
              key={hour}
              className="flex-1 flex flex-col justify-end"
              title={`${hour}:00 — ${count} clock-in${count !== 1 ? "s" : ""}`}
            >
              <div
                className={`rounded-t-[2px] transition-all duration-500 ${
                  count === 0 ? "bg-muted/20" : isCore ? "bg-emerald-500/70" : "bg-amber-400/60"
                }`}
                style={{ height: `${Math.max(count > 0 ? 10 : 2, pct)}%` }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex">
        {[...Array(24)].map((_, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[7px] text-muted-foreground/20">
              {i === 0 ? "12a" : i === 6 ? "6a" : i === 12 ? "12p" : i === 18 ? "6p" : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Monthly Calendar Grid
───────────────────────────────────────────────────────────────────────── */
const MonthCalendar = ({
  year,
  month,
  calendar,
  onSelectDay,
  isLive,
}: {
  year: number
  month: number
  calendar: Record<string, DayData>
  onSelectDay: (ds: string) => void
  isLive: boolean
}) => {
  const todayStr = toDateStr(new Date())

  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="w-full">
      {/* Day header */}
      <div className="grid grid-cols-7 border-b border-border/30">
        {DAYS.map((d) => (
          <div
            key={d}
            className="py-2.5 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/35 border-r border-border/20 last:border-r-0"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Week rows */}
      {Array.from({ length: cells.length / 7 }, (_, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b border-border/20 last:border-b-0">
          {cells.slice(wi * 7, wi * 7 + 7).map((dayNum, di) => {
            if (dayNum === null) {
              return (
                <div
                  key={di}
                  className="border-r border-border/20 last:border-r-0 bg-muted/5 min-h-[90px] sm:min-h-[100px]"
                />
              )
            }

            const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`
            const data = calendar[ds]
            const isToday = ds === todayStr
            const isFuture = ds > todayStr
            const hasData = !!data && data.totalSeconds > 0
            const colors = getDayColor(data?.totalSeconds ?? 0, isToday)
            const isCurrentlyLive = isToday && isLive

            return (
              <div
                key={di}
                onClick={() => !isFuture && onSelectDay(ds)}
                className={[
                  "border-r border-border/20 last:border-r-0 min-h-[90px] sm:min-h-[100px] p-2 flex flex-col gap-1 transition-all duration-100",
                  isFuture ? "opacity-30 cursor-default select-none" : "cursor-pointer hover:bg-muted/20",
                  isToday || hasData ? `border ${colors.bg}` : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {/* Date number */}
                <div className="flex items-start justify-between">
                  <span
                    className={
                      isToday
                        ? "h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black"
                        : isFuture
                        ? "text-[12px] font-bold text-muted-foreground/20"
                        : "text-[12px] font-bold text-muted-foreground/50"
                    }
                  >
                    {dayNum}
                  </span>
                  {isCurrentlyLive && (
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mt-0.5" />
                  )}
                </div>

                {/* Hours badge */}
                {hasData && (
                  <div className="mt-auto space-y-1">
                    <div className={`rounded-[5px] px-1.5 py-1 text-center ${colors.bar}`}>
                      <span className={`text-[11px] font-black font-mono ${colors.text}`}>
                        {fmtHHMM(data.totalSeconds)}
                      </span>
                    </div>
                    {data.sessions.length > 1 && (
                      <div className="flex items-center gap-0.5 justify-center">
                        {data.sessions.slice(0, 3).map((_, i) => (
                          <span key={i} className="h-1 w-1 rounded-full bg-muted-foreground/20" />
                        ))}
                        {data.sessions.length > 3 && (
                          <span className="text-[7px] text-muted-foreground/25 ml-0.5">
                            +{data.sessions.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Today empty placeholder */}
                {isToday && !hasData && (
                  <div className="mt-auto">
                    <div className="rounded-[5px] px-1.5 py-1 bg-muted/25 text-center">
                      <span className="text-[10px] text-muted-foreground/25 font-mono">--:--</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────────────────────── */
export default function TimeprofPage() {
  const router = useRouter()

  const [data, setData] = React.useState<TimeprofData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")

  const now = new Date()
  const [viewYear, setViewYear] = React.useState(now.getFullYear())
  const [viewMonth, setViewMonth] = React.useState(now.getMonth())

  const [selectedDay, setSelectedDay] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)

  // Refresh live session every minute
  const [, setTick] = React.useState(0)
  React.useEffect(() => {
    if (!data?.isLive) return
    const id = setInterval(() => setTick((n) => n + 1), 60_000)
    return () => clearInterval(id)
  }, [data?.isLive])

  /* ── Fetch 365-day window so all months work without refetch ── */
  React.useEffect(() => {
    const token = localStorage.getItem("crm_token")
    if (!token) { router.replace("/crm"); return }

    setLoading(true)
    apiClient
      .get("/api/crm/timeproof/my?range=365", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setData(res.data?.data))
      .catch((e: any) =>
        setError(e?.response?.data?.message || "Failed to load timeproof data.")
      )
      .finally(() => setLoading(false))
  }, [router])

  /* ── Month navigation ── */
  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
  }
  const goToday = () => { setViewYear(now.getFullYear()); setViewMonth(now.getMonth()) }

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth()
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  /* ── Per-month stats ── */
  const monthSummary = React.useMemo(() => {
    if (!data) return { seconds: 0, days: 0 }
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-`
    let seconds = 0, days = 0
    for (const [ds, d] of Object.entries(data.calendar)) {
      if (ds.startsWith(prefix) && d.totalSeconds > 0) {
        seconds += d.totalSeconds
        days++
      }
    }
    return { seconds, days }
  }, [data, viewYear, viewMonth])

  /* ── 4-week avg ── */
  const fourWeekAvg = React.useMemo(() => {
    if (!data) return 0
    let total = 0
    for (let w = 0; w < 4; w++) {
      for (let d = 0; d < 7; d++) {
        const dt = new Date()
        dt.setDate(now.getDate() - w * 7 - d)
        total += data.calendar[toDateStr(dt)]?.totalSeconds ?? 0
      }
    }
    return total / 4 / 3600
  }, [data])

  /* ── Copy proof text ── */
  const copyProof = () => {
    if (!data) return
    const { summary, streak, user: u } = data
    navigator.clipboard.writeText(
      [
        `📋 TIMEPROOF REPORT`,
        `Employee : ${u.fullName.toUpperCase()}`,
        `ID       : ${u.username}`,
        `Period   : ${monthLabel}`,
        `Generated: ${new Date().toLocaleString()}`,
        `─────────────────────────────────`,
        `Today        : ${summary.today.hours}h ${summary.today.minutes}m`,
        `This Week    : ${summary.thisWeek.hours}h ${summary.thisWeek.minutes}m`,
        `${monthLabel.split(" ")[0]} Total : ${monthSummary.days} active days · ${fmtHHMM(monthSummary.seconds)}`,
        `Streak       : ${streak} consecutive day${streak !== 1 ? "s" : ""}`,
        `─────────────────────────────────`,
        `✓ Verified via Action Auto CRM`,
      ].join("\n")
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  /* ── Export CSV ── */
  const exportCSV = async () => {
    const token = localStorage.getItem("crm_token")
    try {
      const res = await apiClient.get("/api/crm/timeproof/export?range=365", {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      })
      const blob = new Blob([res.data], { type: "text/csv" })
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = `timeproof-${viewYear}-${String(viewMonth + 1).padStart(2, "0")}.csv`
      a.click()
    } catch {}
  }

  /* ─────────────── Loading ─────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-2xl bg-emerald-600/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="absolute inset-0 rounded-2xl ring-2 ring-emerald-500/20 ring-offset-2 ring-offset-background animate-ping" />
          </div>
          <p className="text-[11px] text-muted-foreground/40 tracking-[0.2em] uppercase font-semibold">
            Loading Timeproof…
          </p>
        </div>
      </div>
    )
  }

  /* ─────────────── Page ─────────────── */
  return (
    <div className="min-h-screen bg-background">

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-20 border-b border-border/40 bg-background/85 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => router.push("/crm/dashboard")}
            className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-muted/50 transition-colors text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-600/10 flex items-center justify-center">
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <span className="text-sm font-black tracking-tight">Timeproof</span>
            {data?.isLive && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <Radio className="h-2.5 w-2.5 animate-pulse" />
                Live
              </span>
            )}
          </div>

          {data && (
            <p className="hidden sm:block text-[11px] text-muted-foreground/40 font-semibold ml-1 truncate">
              — {data.user.fullName.toUpperCase()}
            </p>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={exportCSV}
              title="Export CSV"
              className="h-8 w-8 rounded-xl border border-border/40 flex items-center justify-center hover:bg-muted/30 transition-colors text-muted-foreground"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={copyProof}
              className={`h-8 px-3 rounded-xl border flex items-center gap-1.5 text-[11px] font-bold transition-all ${
                copied
                  ? "border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700"
                  : "border-border/40 hover:bg-muted/30 text-muted-foreground"
              }`}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{copied ? "Copied!" : "Copy Proof"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-5 space-y-4">

        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs text-rose-600">
            {error}
          </div>
        )}

        {data && (
          <>
            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                label="Today"
                value={fmtHuman(data.summary.today.totalSeconds)}
                sub={data.isLive ? "🟢 Live session" : data.summary.today.totalSeconds > 0 ? "Completed" : "Not clocked in"}
                icon={Timer}
                accent={data.summary.today.totalSeconds > 0}
              />
              <StatCard
                label="This Week"
                value={fmtHuman(data.summary.thisWeek.totalSeconds)}
                sub={`${data.summary.thisWeek.decimal.toFixed(1)}h of 40h`}
                icon={TrendingUp}
                accent={data.summary.thisWeek.decimal >= 40}
              />
              <StatCard
                label={monthLabel.split(" ")[0]}
                value={fmtHHMM(monthSummary.seconds)}
                sub={`${monthSummary.days} day${monthSummary.days !== 1 ? "s" : ""} active`}
                icon={Calendar}
              />
              <StatCard
                label="Streak"
                value={`${data.streak}d`}
                sub={`Best: ${data.longestStreak} days`}
                icon={Flame}
                amber
              />
            </div>

            {/* ── Calendar Card ── */}
            <div className="rounded-2xl border border-border/40 bg-card overflow-hidden shadow-sm">

              {/* Nav bar */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
                <h2 className="text-base font-black tracking-tight">{monthLabel}</h2>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={prevMonth}
                    className="h-8 w-8 rounded-lg border border-border/40 flex items-center justify-center hover:bg-muted/50 transition-colors text-muted-foreground"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="h-8 w-8 rounded-lg border border-border/40 flex items-center justify-center hover:bg-muted/50 transition-colors text-muted-foreground"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={goToday}
                    disabled={isCurrentMonth}
                    className="h-8 px-3 rounded-lg border border-border/40 text-[11px] font-semibold hover:bg-muted/50 transition-colors disabled:opacity-40 disabled:cursor-default text-muted-foreground"
                  >
                    Today
                  </button>
                </div>
              </div>

              {/* Month summary sub-bar */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-5 py-2.5 border-b border-border/20 bg-muted/10">
                <span className="text-[10px] text-muted-foreground/50">
                  Total:{" "}
                  <strong className="text-foreground/70 font-mono">{fmtHHMM(monthSummary.seconds)}</strong>
                </span>
                <span className="text-[10px] text-muted-foreground/50">
                  Active days:{" "}
                  <strong className="text-foreground/70">{monthSummary.days}</strong>
                </span>

                {/* Legend */}
                <div className="ml-auto hidden sm:flex items-center gap-3 flex-wrap">
                  {[
                    { label: "< 2h", cls: "bg-rose-500" },
                    { label: "2–4h", cls: "bg-sky-700" },
                    { label: "4–6h", cls: "bg-sky-600" },
                    { label: "6–9h", cls: "bg-emerald-600" },
                    { label: "9h+",  cls: "bg-emerald-500" },
                  ].map((c) => (
                    <span key={c.label} className="flex items-center gap-1">
                      <span className={`h-2.5 w-5 rounded-[3px] ${c.cls}`} />
                      <span className="text-[8px] text-muted-foreground/35">{c.label}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Grid */}
              <MonthCalendar
                year={viewYear}
                month={viewMonth}
                calendar={data.calendar}
                onSelectDay={setSelectedDay}
                isLive={data.isLive}
              />
            </div>

            {/* ── Work Rhythm + Quick Stats ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Work Rhythm */}
              <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black tracking-tight">Work Rhythm</p>
                    <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                      Clock-in frequency by hour of day
                    </p>
                  </div>
                  <Zap className="h-4 w-4 text-muted-foreground/20" />
                </div>
                <WorkRhythm pattern={data.hourPattern} />
                <div className="flex items-center gap-4 text-[9px] text-muted-foreground/35 pt-1 border-t border-border/20">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-4 rounded-sm bg-emerald-500/70" />
                    Core (8a–6p)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-4 rounded-sm bg-amber-400/60" />
                    Extended
                  </span>
                </div>
              </div>

              {/* Quick stats */}
              <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black tracking-tight">My Stats</p>
                    <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                      Personal performance summary
                    </p>
                  </div>
                  <TrendingUp className="h-4 w-4 text-muted-foreground/20" />
                </div>

                <div className="space-y-1.5">
                  {[
                    { label: "Current streak",   value: `${data.streak}d`, amber: true },
                    { label: "Longest streak",    value: `${data.longestStreak}d`, amber: false },
                    { label: "4-week avg / week", value: `${fourWeekAvg.toFixed(1)}h`, amber: false },
                    { label: "This month total",  value: fmtHHMM(data.summary.thisMonth.totalSeconds), amber: false },
                    { label: "This week total",   value: fmtHuman(data.summary.thisWeek.totalSeconds), amber: false },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/15 border border-border/20"
                    >
                      <span className="text-[11px] text-muted-foreground/55 flex-1">{s.label}</span>
                      <span
                        className={`text-[11px] font-bold font-mono ${
                          s.amber ? "text-amber-600 dark:text-amber-400" : "text-foreground/80"
                        }`}
                      >
                        {s.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Verified footer ── */}
            <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-950/20 p-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-emerald-600/10 flex items-center justify-center shrink-0">
                  <Shield className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-emerald-800 dark:text-emerald-300">
                    Timeproof Verified
                  </p>
                  <p className="text-[10px] text-emerald-700/50 dark:text-emerald-400/50 mt-0.5">
                    All timestamps are server-validated and IP-logged. Click any day to inspect individual sessions.
                  </p>
                </div>
                <button
                  onClick={copyProof}
                  className="shrink-0 h-8 px-3 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Share"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Day detail popover ── */}
      {selectedDay && (
        <DayPopover
          dateStr={selectedDay}
          dayData={data?.calendar[selectedDay] ?? null}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  )
}