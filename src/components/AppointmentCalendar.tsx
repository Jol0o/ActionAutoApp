"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from "lucide-react"
import { Appointment } from "@/types/appointment"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from "date-fns"

interface AppointmentCalendarProps {
  appointments: Appointment[]
  onCreateAppointment: (date?: Date) => void
  onSelectAppointment: (appointment: Appointment) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Safely parse a startTime value that may be a string, Date, or garbage.
 * Returns null if the value produces an invalid Date.
 */
function safeDate(value: unknown): Date | null {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value as string)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Compare a parsed appointment date against a calendar-grid day using
 * explicit year/month/date components (immune to isSameDay edge-cases with
 * null values or non-standard date strings).
 */
function appointmentIsOnDay(apt: Appointment, day: Date): boolean {
  const start = safeDate(apt.startTime)
  if (!start) return false
  return (
    start.getFullYear() === day.getFullYear() &&
    start.getMonth()    === day.getMonth()    &&
    start.getDate()     === day.getDate()
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AppointmentCalendar({
  appointments,
  onCreateAppointment,
  onSelectAppointment,
}: AppointmentCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  // Tracks whether we've already auto-navigated so we don't jump away when the
  // user manually browses to a different month and appointments later refresh.
  const hasAutoNavigated = React.useRef(false)

  // ── Auto-navigate to the first month that contains upcoming events ──────────
  React.useEffect(() => {
    if (hasAutoNavigated.current || appointments.length === 0) return

    const now   = new Date()
    const today = startOfMonth(now)

    // Find the earliest upcoming appointment
    const firstUpcoming = appointments
      .filter((apt) => {
        const d = safeDate(apt.startTime)
        return d !== null && d >= now && apt.status !== "cancelled"
      })
      .sort((a, b) => {
        const da = safeDate(a.startTime)!
        const db = safeDate(b.startTime)!
        return da.getTime() - db.getTime()
      })[0]

    if (firstUpcoming) {
      const targetMonth = startOfMonth(safeDate(firstUpcoming.startTime)!)
      // Only jump if the first upcoming event is NOT already in the current view
      if (!isSameMonth(targetMonth, today)) {
        setCurrentMonth(targetMonth)
      }
    }

    hasAutoNavigated.current = true
  }, [appointments])

  // ── Calendar grid ───────────────────────────────────────────────────────────
  const monthStart    = startOfMonth(currentMonth)
  const monthEnd      = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd   = endOfWeek(monthEnd)
  const days          = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Count for the CURRENTLY displayed month (shown in header)
  const monthlyCount = React.useMemo(
    () =>
      appointments.filter((apt) => {
        const d = safeDate(apt.startTime)
        return d !== null && isSameMonth(d, currentMonth)
      }).length,
    [appointments, currentMonth]
  )

  // Count upcoming events in the next month (used for navigation hint)
  const nextMonthCount = React.useMemo(() => {
    const next = addMonths(currentMonth, 1)
    return appointments.filter((apt) => {
      const d = safeDate(apt.startTime)
      return d !== null && isSameMonth(d, next)
    }).length
  }, [appointments, currentMonth])

  const prevMonthCount = React.useMemo(() => {
    const prev = subMonths(currentMonth, 1)
    return appointments.filter((apt) => {
      const d = safeDate(apt.startTime)
      return d !== null && isSameMonth(d, prev)
    }).length
  }, [appointments, currentMonth])

  const getAppointmentsForDay = (day: Date): Appointment[] =>
    appointments.filter((apt) => appointmentIsOnDay(apt, day))

  const getEntryTypeColor = (entryType: string) => {
    switch (entryType) {
      case "appointment": return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
      case "event":       return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
      case "task":        return "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300"
      case "reminder":    return "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300"
      default:            return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Month title + event count badge */}
          <div className="flex items-center gap-2">
            <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
            {monthlyCount > 0 ? (
              <Badge variant="secondary" className="text-xs">
                {monthlyCount} event{monthlyCount !== 1 ? "s" : ""}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                No events
              </Badge>
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-2 items-center">
            {/* Prev month button — shows count hint if events exist there */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              title={
                prevMonthCount > 0
                  ? `${format(subMonths(currentMonth, 1), "MMMM")} has ${prevMonthCount} event${prevMonthCount !== 1 ? "s" : ""}`
                  : `Go to ${format(subMonths(currentMonth, 1), "MMMM")}`
              }
              className="relative"
            >
              <ChevronLeft className="size-4" />
              {prevMonthCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] text-white font-bold">
                  {prevMonthCount > 9 ? "9+" : prevMonthCount}
                </span>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Today
            </Button>

            {/* Next month button — shows count hint if events exist there */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              title={
                nextMonthCount > 0
                  ? `${format(addMonths(currentMonth, 1), "MMMM")} has ${nextMonthCount} event${nextMonthCount !== 1 ? "s" : ""}`
                  : `Go to ${format(addMonths(currentMonth, 1), "MMMM")}`
              }
              className="relative"
            >
              <ChevronRight className="size-4" />
              {nextMonthCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] text-white font-bold">
                  {nextMonthCount > 9 ? "9+" : nextMonthCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-muted-foreground p-2"
            >
              {day}
            </div>
          ))}

          {/* Day cells */}
          {days.map((day) => {
            const dayAppointments = getAppointmentsForDay(day)
            const todayFlag       = isToday(day)
            const currentMonthDay = isSameMonth(day, currentMonth)

            return (
              <div
                key={day.toISOString()}
                className={`min-h-28 border rounded-lg p-2 text-left transition-colors ${
                  !currentMonthDay
                    ? "bg-muted/50 opacity-50"
                    : "bg-card hover:bg-accent/50"
                } ${todayFlag ? "ring-2 ring-green-500" : ""}`}
              >
                {/* Date number + add button */}
                <div className="flex items-center justify-between mb-1">
                  <div
                    className={`text-sm font-medium ${
                      todayFlag
                        ? "h-6 w-6 flex items-center justify-center rounded-full bg-green-500 text-white text-xs"
                        : ""
                    }`}
                  >
                    {format(day, "d")}
                  </div>

                  {currentMonthDay && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                      onClick={(e) => {
                        e.stopPropagation()
                        onCreateAppointment(day)
                      }}
                      title="Add new appointment"
                    >
                      <Plus className="size-4" />
                    </Button>
                  )}
                </div>

                {/* Appointment pills */}
                <div className="space-y-1">
                  {dayAppointments.slice(0, 3).map((apt) => {
                    const start = safeDate(apt.startTime)
                    return (
                      <button
                        key={apt._id}
                        className={`w-full text-xs p-1.5 rounded hover:opacity-80 transition-all truncate cursor-pointer text-left ${getEntryTypeColor(
                          apt.entryType
                        )} hover:shadow-sm`}
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectAppointment(apt)
                        }}
                        title={`${apt.title} — Click to view details`}
                      >
                        {start && (
                          <div className="font-medium">
                            {format(start, "h:mm a")}
                          </div>
                        )}
                        <div className="truncate">{apt.title}</div>
                      </button>
                    )
                  })}

                  {dayAppointments.length > 3 && (
                    <button
                      className="w-full text-xs text-muted-foreground pl-1 hover:text-foreground transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (dayAppointments[3]) onSelectAppointment(dayAppointments[3])
                      }}
                    >
                      +{dayAppointments.length - 3} more
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty-month hint — only shown when the month has no events but there
            ARE appointments in the overall dataset */}
        {monthlyCount === 0 && appointments.length > 0 && (
          <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-muted-foreground/30 py-8 text-center text-muted-foreground">
            <CalendarDays className="h-10 w-10 opacity-30" />
            <div>
              <p className="font-medium">No events in {format(currentMonth, "MMMM yyyy")}</p>
              <p className="text-sm mt-1 opacity-70">
                You have {appointments.length} appointment
                {appointments.length !== 1 ? "s" : ""} in other months.
                Use the arrows above to navigate — blue dots indicate months with events.
              </p>
            </div>
            {/* Quick-jump to nearest upcoming event */}
            <NearestEventButton
              appointments={appointments}
              onNavigate={setCurrentMonth}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Helper sub-component ─────────────────────────────────────────────────────

/**
 * Renders a "Jump to next event" button that navigates to the month
 * containing the nearest upcoming (or most recent past) appointment.
 */
function NearestEventButton({
  appointments,
  onNavigate,
}: {
  appointments: Appointment[]
  onNavigate: (month: Date) => void
}) {
  const nearest = React.useMemo(() => {
    const now = new Date()

    // Prefer the nearest future event
    const future = appointments
      .filter((apt) => {
        const d = safeDate(apt.startTime)
        return d !== null && d >= now && apt.status !== "cancelled"
      })
      .sort((a, b) => safeDate(a.startTime)!.getTime() - safeDate(b.startTime)!.getTime())[0]

    if (future) return { apt: future, label: "Jump to next upcoming event" }

    // Fall back to the most recent past event
    const past = appointments
      .filter((apt) => {
        const d = safeDate(apt.startTime)
        return d !== null && d < now
      })
      .sort((a, b) => safeDate(b.startTime)!.getTime() - safeDate(a.startTime)!.getTime())[0]

    if (past) return { apt: past, label: "Jump to most recent event" }

    return null
  }, [appointments])

  if (!nearest) return null

  const targetDate = safeDate(nearest.apt.startTime)!

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onNavigate(startOfMonth(targetDate))}
    >
      {nearest.label} ({format(targetDate, "MMM yyyy")})
    </Button>
  )
}