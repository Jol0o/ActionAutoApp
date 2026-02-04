import { useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@clerk/nextjs';

interface UseAppointmentPollingOptions {
  appointmentId: string | null;
  onUpdate: (appointment: any) => void;
  enabled: boolean;
  intervalMs?: number;
}

/**
 * Hook to poll for appointment updates in real-time
 * Detects guest RSVP changes from Google Calendar
 */
export function useAppointmentPolling({
  appointmentId,
  onUpdate,
  enabled,
  intervalMs = 10000, // Poll every 10 seconds
}: UseAppointmentPollingOptions) {
  const { getToken, isSignedIn } = useAuth();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<string>('');

  const fetchAppointment = useCallback(async () => {
    if (!appointmentId || !isSignedIn || !enabled) return;

    try {
      const token = await getToken();
      if (!token) return;

      const response = await apiClient.get(`/api/appointments/${appointmentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const appointment = response.data?.data || response.data;
      
      // Compare with last fetch to detect changes
      const currentData = JSON.stringify(appointment.guestEmails);
      if (lastFetchRef.current && lastFetchRef.current !== currentData) {
        console.log('[useAppointmentPolling] Guest status changed, updating UI');
        onUpdate(appointment);
      }
      lastFetchRef.current = currentData;
    } catch (error) {
      console.error('[useAppointmentPolling] Error fetching appointment:', error);
      // Don't throw - just log and continue polling
    }
  }, [appointmentId, isSignedIn, enabled, getToken, onUpdate]);

  useEffect(() => {
    if (!enabled || !appointmentId) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchAppointment();

    // Start polling
    pollIntervalRef.current = setInterval(fetchAppointment, intervalMs);

    // Cleanup
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [enabled, appointmentId, fetchAppointment, intervalMs]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchAppointment();
  }, [fetchAppointment]);

  return { refresh };
}