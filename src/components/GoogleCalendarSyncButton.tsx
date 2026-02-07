"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Check, AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@clerk/nextjs"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface GoogleCalendarSyncButtonProps {
  onSyncComplete?: () => void
}

export function GoogleCalendarSyncButton({ onSyncComplete }: GoogleCalendarSyncButtonProps) {
  const { getToken } = useAuth()
  const [isSyncing, setIsSyncing] = React.useState(false)
  const [syncResult, setSyncResult] = React.useState<{
    success: boolean
    message: string
  } | null>(null)

  const handleSync = async () => {
    try {
      setIsSyncing(true)
      setSyncResult(null)

      const token = await getToken()
      const response = await apiClient.post('/api/appointments/sync/google-calendar', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = response.data?.data || response.data
      setSyncResult({
        success: true,
        message: `Successfully synced ${data.syncedAppointments || 0} appointments from Google Calendar`
      })

      if (onSyncComplete) {
        onSyncComplete()
      }

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSyncResult(null)
      }, 5000)
    } catch (error: any) {
      console.error('Failed to sync with Google Calendar:', error)
      setSyncResult({
        success: false,
        message: error.response?.data?.message || 'Failed to sync with Google Calendar'
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={isSyncing}
        className="gap-2"
      >
        <RefreshCw className={`size-4 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Syncing...' : 'Sync with Google Calendar'}
      </Button>

      {syncResult && (
        <Alert variant={syncResult.success ? "default" : "destructive"} className="mt-2">
          {syncResult.success ? (
            <Check className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{syncResult.message}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}