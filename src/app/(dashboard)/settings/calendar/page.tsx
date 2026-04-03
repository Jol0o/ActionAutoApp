"use client"

import { GoogleCalendarConnect } from "@/components/GoogleCalendarConnect"

export default function CalendarSettings() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Calendar Settings</h1>
        <p className="text-muted-foreground">
          Manage your dealership's Google Calendar integration. Connect one master account to sync all events, bookings, and customer inquiries across the team.
        </p>
      </div>

      <GoogleCalendarConnect 
        title="Dealership Calendar"
        description="Sync appointments and customer bookings with your official Google account."
      />
    </div>
  )
}
