"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Check, X, RefreshCw, ExternalLink } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@clerk/nextjs"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function GoogleCalendarConnect() {
  const [isConnected, setIsConnected] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isConnecting, setIsConnecting] = React.useState(false)
  const { getToken } = useAuth()

  // Check connection status on mount
  React.useEffect(() => {
    checkConnectionStatus()
  }, [])

  // Check for OAuth callback parameters
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const calendarConnected = params.get('calendar_connected')
    const calendarError = params.get('calendar_error')

    if (calendarConnected === 'true') {
      setIsConnected(true)
      setError(null)
      // Clean up URL
      window.history.replaceState({}, '', '/appointments')
    }

    if (calendarError) {
      setError(decodeURIComponent(calendarError))
      // Clean up URL
      window.history.replaceState({}, '', '/appointments')
    }
  }, [])

  const checkConnectionStatus = async () => {
    try {
      setIsLoading(true)
      const token = await getToken()
      const response = await apiClient.get('/api/google-calendar/status', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setIsConnected(response.data?.data?.connected || false)
    } catch (err: any) {
      console.error('Failed to check calendar status:', err)
      setError('Failed to check connection status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = async () => {
    try {
      setIsConnecting(true)
      setError(null)
      const token = await getToken()
      
      const response = await apiClient.get('/api/google-calendar/auth', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      const authUrl = response.data?.data?.authUrl
      
      if (authUrl) {
        // Redirect to Google OAuth
        window.location.href = authUrl
      } else {
        throw new Error('No authorization URL received')
      }
    } catch (err: any) {
      console.error('Failed to initiate Google Calendar connection:', err)
      setError(err.response?.data?.message || 'Failed to connect to Google Calendar')
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar?')) return

    try {
      setIsLoading(true)
      const token = await getToken()
      
      await apiClient.post('/api/google-calendar/disconnect', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setIsConnected(false)
      setError(null)
    } catch (err: any) {
      console.error('Failed to disconnect Google Calendar:', err)
      setError(err.response?.data?.message || 'Failed to disconnect')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && !isConnecting) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <RefreshCw className="size-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Checking calendar connection...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded ${isConnected ? 'bg-green-100 dark:bg-green-950' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <Calendar className={`size-5 ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`} />
            </div>
            <div>
              <CardTitle className="text-base">Google Calendar</CardTitle>
              <CardDescription>
                {isConnected 
                  ? 'Automatically sync appointments to your Google Calendar'
                  : 'Connect to automatically add appointments to your calendar'
                }
              </CardDescription>
            </div>
          </div>
          <Badge variant={isConnected ? "default" : "secondary"} className="gap-1">
            {isConnected ? (
              <>
                <Check className="size-3" />
                Connected
              </>
            ) : (
              <>
                <X className="size-3" />
                Not Connected
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isConnected ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm">
              <Check className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>New appointments will be automatically added to your Google Calendar</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Check className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>External guests can have events added to their calendars when they accept</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Check className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Updates and cancellations will sync automatically</span>
            </div>
            
            <div className="pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                className="text-red-600 hover:text-red-700"
              >
                Disconnect Google Calendar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">Benefits of connecting:</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Automatic calendar sync for all your appointments</li>
                <li>Guests can add events to their Google Calendars</li>
                <li>Real-time updates when guests accept or decline</li>
                <li>Reminders through Google Calendar</li>
              </ul>
            </div>
            
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Calendar className="size-4" />
                  Connect Google Calendar
                  <ExternalLink className="size-3" />
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}