"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Check, AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@clerk/nextjs"

interface GoogleCalendarSyncButtonProps {
  onSyncComplete?: () => void
}

export function GoogleCalendarSyncButton({ onSyncComplete }: GoogleCalendarSyncButtonProps) {
  const { getToken } = useAuth()
  const [syncing, setSyncing] = React.useState(false)
  const [syncResult, setSyncResult] = React.useState<'success' | 'error' | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)

  const handleSync = async () => {
    try {
      setSyncing(true)
      setSyncResult(null)
      setMessage(null)

      const token = await getToken()

      const response = await apiClient.post(
        '/api/appointments/sync/google-calendar',
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 120000,
        }
      )

      const data = response.data?.data || response.data
      const syncedCount = data?.syncedAppointments ?? 0

      setSyncResult('success')
      setMessage(`Synced ${syncedCount} new event${syncedCount !== 1 ? 's' : ''} from Google Calendar.`)

      onSyncComplete?.()
    } catch (error: any) {
      console.error('Google Calendar sync error:', error)
      setSyncResult('error')

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        setMessage('Sync timed out. Try again — subsequent syncs are faster.')
      } else if (error.message === 'Network Error') {
        setMessage('Could not reach the server. Check that your backend is running and Google Calendar is connected.')
      } else if (error.response?.status === 401) {
        setMessage('Google Calendar not connected. Please connect it first.')
      } else {
        setMessage(error.response?.data?.message || 'Failed to sync with Google Calendar.')
      }
    } finally {
      setSyncing(false)
      setTimeout(() => {
        setSyncResult(null)
        setMessage(null)
      }, 4000)
    }
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={syncing}
      >
        {syncing ? (
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        ) : syncResult === 'success' ? (
          <Check className="mr-2 h-4 w-4 text-green-500" />
        ) : syncResult === 'error' ? (
          <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
        ) : (
          <RefreshCw className="mr-2 h-4 w-4" />
        )}
        {syncing ? 'Syncing...' : 'Sync Calendar'}
      </Button>
      {message && (
        <div
          className={`absolute top-full right-0 mt-2 px-3 py-2 rounded-md text-sm whitespace-nowrap z-50 shadow-md ${
            syncResult === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message}
        </div>
      )}
    </div>
  )
}