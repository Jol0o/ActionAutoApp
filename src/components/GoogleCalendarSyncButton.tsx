"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Check, AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/providers/AuthProvider"

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

      console.log('[GoogleCalendarSyncButton] Starting sync...')

      // FIX: Corrected endpoint from '/api/appointments/sync/google-calendar'
      // to '/api/google-calendar/sync-events' which actually exists in the router
      const response = await apiClient.post(
        '/api/google-calendar/sync-events',
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 120000,
        }
      )

      const data = response.data?.data || response.data
      const syncedCount = data?.syncedAppointments ?? 0

      console.log('[GoogleCalendarSyncButton] Sync successful:', syncedCount, 'events')

      setSyncResult('success')
      setMessage(`Synced ${syncedCount} event${syncedCount !== 1 ? 's' : ''} from Google Calendar.`)

      if (onSyncComplete) {
        console.log('[GoogleCalendarSyncButton] Calling onSyncComplete...')
        await onSyncComplete()
        console.log('[GoogleCalendarSyncButton] onSyncComplete finished')
      }
    } catch (error: any) {
      console.error('[GoogleCalendarSyncButton] Sync error:', error)
      setSyncResult('error')

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        setMessage('Sync timed out. Please try again.')
      } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        setMessage('Cannot reach server. Check that the backend is running.')
      } else if (error.response?.status === 401) {
        const errMsg = error.response?.data?.message || ''
        // FIX: Distinguish between "not connected" and "needs reconnection"
        if (errMsg.toLowerCase().includes('reconnect')) {
          setMessage('Google Calendar needs to be reconnected. Please disconnect and reconnect your calendar.')
        } else {
          setMessage('Not authorized. Please connect Google Calendar first.')
        }
      } else if (error.response?.status === 500) {
        const errMsg = error.response?.data?.message || 'Server error during sync'
        // FIX: Detect missing refresh token error and give actionable message
        if (
          errMsg.toLowerCase().includes('refresh token') ||
          errMsg.toLowerCase().includes('no refresh token')
        ) {
          setMessage('Google Calendar needs to be reconnected. Please disconnect and reconnect your calendar.')
        } else {
          setMessage(errMsg)
        }
      } else {
        setMessage(error.response?.data?.message || 'Failed to sync.')
      }

      // Even on error, refresh data in case a partial sync occurred
      if (onSyncComplete) {
        console.log('[GoogleCalendarSyncButton] Error occurred, but refreshing data anyway...')
        await onSyncComplete()
      }
    } finally {
      setSyncing(false)
      // Clear message after 5 seconds
      setTimeout(() => {
        setSyncResult(null)
        setMessage(null)
      }, 5000)
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
          className={`absolute top-full right-0 mt-2 px-3 py-2 rounded-md text-sm whitespace-nowrap z-50 shadow-md max-w-xs ${
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