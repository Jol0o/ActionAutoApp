"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"
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
  endOfWeek
} from "date-fns"

interface AppointmentCalendarProps {
  appointments: Appointment[]
  onCreateAppointment: (date?: Date) => void
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
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter(apt => 
      isSameDay(new Date(apt.startTime), day)
    )
  }

  const getEntryTypeColor = (entryType: string) => {
    switch (entryType) {
      case 'appointment': return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
      case 'event': return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
      case 'task': return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
      case 'reminder': return 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300'
      default: return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
    }
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
            const isCurrentMonth = isSameMonth(day, currentMonth)
            
            return (
              <button
                key={day.toString()}
                onClick={() => onCreateAppointment(day)}
                className={`min-h-28 border rounded-lg p-2 text-left hover:border-green-500 transition-colors ${
                  !isCurrentMonth ? 'bg-muted/50 opacity-50' : 'bg-card'
                } ${isToday ? 'ring-2 ring-green-500' : ''}`}
              >
                <div className="text-sm font-medium mb-1">
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayAppointments.slice(0, 3).map((apt) => (
                    <div
                     key={apt._id}
                      className={`w-full text-xs p-1 rounded hover:opacity-80 transition-opacity truncate cursor-pointer ${getEntryTypeColor(apt.entryType)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                       onSelectAppointment(apt);
                      }}
                    >
                      <span className="font-medium">{format(new Date(apt.startTime), 'h:mm a')}</span>
                      {' '}
                      {apt.title}
                    </div>
                  ))}
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-muted-foreground pl-1">
                      +{dayAppointments.length - 3} more
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}