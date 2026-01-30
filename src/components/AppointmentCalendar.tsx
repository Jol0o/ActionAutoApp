"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Appointment } from "@/types/appointment"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns"

interface AppointmentCalendarProps {
  appointments: Appointment[]
  onCreateAppointment: () => void
  onSelectAppointment: (appointment: Appointment) => void
}

export function AppointmentCalendar({
  appointments,
  onCreateAppointment,
  onSelectAppointment
}: AppointmentCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter(apt => 
      isSameDay(new Date(apt.startTime), day)
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{format(currentMonth, 'MMMM yyyy')}</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
          {days.map((day) => {
            const dayAppointments = getAppointmentsForDay(day)
            const isToday = isSameDay(day, new Date())
            
            return (
              <div
                key={day.toString()}
                className={`min-h-24 border rounded-lg p-2 ${
                  !isSameMonth(day, currentMonth) ? 'bg-muted/50' : 'bg-card'
                } ${isToday ? 'ring-2 ring-green-500' : ''}`}
              >
                <div className="text-sm font-medium mb-1">
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayAppointments.slice(0, 2).map((apt) => (
                    <button
                      key={apt._id}
                      className="w-full text-left text-xs p-1 rounded bg-green-100 dark:bg-green-950 hover:bg-green-200 dark:hover:bg-green-900 transition-colors truncate"
                      onClick={() => onSelectAppointment(apt)}
                    >
                      {apt.title}
                    </button>
                  ))}
                  {dayAppointments.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayAppointments.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}