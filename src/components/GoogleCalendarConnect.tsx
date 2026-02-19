"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Check, X, Loader2, AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@clerk/nextjs"

export interface GoogleCalendarConnectProps {
  title?: string
  description?: string
  showFeatures?: boolean
  features?: string[]
}

export function GoogleCalendarConnect({
  title = 'Google Calendar Integration',
  description,
  showFeatures = true,
  features = [
    'Bidirectional sync (App and Google Calendar)',
    'Auto-sync to participants\' calendars',
    'Real-time webhook notifications',
    'Customer bookings sync'
  ]
}: GoogleCalendarConnectProps = {}) {
  const { getToken } = useAuth()
  const [isConnected, setIsConnected] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isConnecting, setIsConnecting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      setIsLoading(true)
      const token = await getToken()
      const response = await apiClient.get('/api/google-calendar/status', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      const data = response.data?.data || response.data
      setIsConnected(data.connected || false)
    } catch (error) {
      console.error('Failed to check Google Calendar connection:', error)
      setIsConnected(false)
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
      
      const data = response.data?.data || response.data
      
      if (data.authUrl) {
        // Open in popup window instead of full redirect
        const width = 500
        const height = 600
        const left = window.screenX + (window.outerWidth - width) / 2
        const top = window.screenY + (window.outerHeight - height) / 2
        
        const popup = window.open(
          data.authUrl,
          'Google Auth',
          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        )
        
        if (!popup) {
          setError('Popup blocked. Please allow popups and try again.')
          setIsConnecting(false)
          return
        }

        // Check popup status
        const checkPopupTimer = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkPopupTimer)
            // Popup closed, check if we're still connected
            checkConnection()
            setIsConnecting(false)
          }
        }, 500)

        // Fallback: close timer after 5 minutes
        setTimeout(() => {
          clearInterval(checkPopupTimer)
          setIsConnecting(false)
        }, 300000)
      } else {
        setError('Failed to get authorization URL')
        setIsConnecting(false)
      }
    } catch (error: any) {
      console.error('Failed to connect Google Calendar:', error)
      setError(error.response?.data?.message || 'Failed to connect to Google Calendar. Please check your internet connection.')
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      setIsConnecting(true)
      setError(null)
      
      const token = await getToken()
      await apiClient.post('/api/google-calendar/disconnect', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setIsConnected(false)
    } catch (error: any) {
      console.error('Failed to disconnect Google Calendar:', error)
      setError(error.response?.data?.message || 'Failed to disconnect from Google Calendar')
    } finally {
      setIsConnecting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Checking Google Calendar connection...</span>
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
            <div className="bg-blue-100 dark:bg-blue-950 p-2 rounded-lg">
              <Calendar className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>
                {description || (isConnected 
                  ? 'Your account is synced and up to date'
                  : `Connect to sync with ${title}`
                )}
              </CardDescription>
            </div>
          </div>
          <Badge variant={isConnected ? "default" : "secondary"} className={isConnected ? "bg-green-500" : ""}>
            {isConnected ? (
              <>
                <Check className="size-3 mr-1" />
                Connected
              </>
            ) : (
              <>
                <X className="size-3 mr-1" />
                Not Connected
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {isConnected ? (
            <>
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Active Features:</h4>
                <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
                  {showFeatures && features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="size-4" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    'Disconnect'
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Benefits:</h4>
                <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                  <li>Sync all inquiries with {title}</li>
                  <li>Automatic updates when you make changes</li>
                  <li>Share events with participants</li>
                  <li>Get notifications on all your devices</li>
                </ul>
              </div>

              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Calendar className="size-4 mr-2" />
                    Connect {title}
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}