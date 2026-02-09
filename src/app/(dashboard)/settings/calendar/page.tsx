"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CalendarSettings() {
  const [isConnected, setIsConnected] = useState(false);

  const connectGoogleCalendar = () => {
    const scope = encodeURIComponent([
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ].join(' '));

    const redirectUri = encodeURIComponent(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/callback`);
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `response_type=code&` +
      `scope=${scope}&` +
      `access_type=offline&` +
      `prompt=consent`;

    window.location.href = authUrl;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google Calendar Integration</CardTitle>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <Button onClick={connectGoogleCalendar}>
            Connect Google Calendar
          </Button>
        ) : (
          <p>Connected to Google Calendar</p>
        )}
      </CardContent>
    </Card>
  );
}