import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Appointment } from '@/types/appointment';
import { AxiosError } from 'axios';
import { useAuth } from '@clerk/nextjs';


export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const fetchAppointments = useCallback(async (params?: {
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }) => {
    if (!isSignedIn) return;

    try {
      setIsLoading(true);
      setError(null);

      const token = await getToken();
      const response = await apiClient.get('/api/appointments', {
        params,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = response.data?.data || response.data;

      setAppointments(data.appointments || []);
    } catch (err) {
      const axiosError = err as AxiosError;
      const message = (axiosError.response?.data as any)?.message || 'Failed to fetch appointments';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, isSignedIn]);

  const createAppointment = useCallback(async (data: any) => {
    try {
      // Sanitize data: remove empty strings and convert to undefined for MongoDB
      const sanitizedData = {
        ...data,
        // Remove empty string for conversationId - MongoDB expects ObjectId or null/undefined
        conversationId: data.conversationId?.trim() || undefined,
        // Clean up other optional fields
        location: data.location?.trim() || undefined,
        description: data.description?.trim() || undefined,
        // Ensure participants is an array, filter out empty values
        participants: Array.isArray(data.participants)
          ? data.participants.filter((p: string) => p && p.trim())
          : undefined,
      };

      console.log('[createAppointment] Sending sanitized data:', sanitizedData);

      const token = await getToken();
      const response = await apiClient.post('/api/appointments', sanitizedData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const appointment = response.data?.data || response.data;

      setAppointments(prev => [appointment, ...prev]);
      return appointment;
    } catch (err) {
      const axiosError = err as AxiosError;

      // Log detailed error information
      console.error('[createAppointment] Error details:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        message: axiosError.message,
      });

      // Extract error message
      const errorMessage = (axiosError.response?.data as any)?.message
        || (axiosError.response?.data as any)?.error
        || axiosError.message
        || 'Failed to create appointment';

      // Set error state
      setError(errorMessage);

      // Re-throw with a user-friendly message
      throw new Error(errorMessage);
    }
  }, [getToken]);

  const updateAppointment = useCallback(async (id: string, data: any) => {
    try {
      // Sanitize data for updates too
      const sanitizedData = {
        ...data,
        conversationId: data.conversationId?.trim() || undefined,
        location: data.location?.trim() || undefined,
        description: data.description?.trim() || undefined,
        participants: Array.isArray(data.participants)
          ? data.participants.filter((p: string) => p && p.trim())
          : undefined,
      };

      const token = await getToken();
      const response = await apiClient.patch(`/api/appointments/${id}`, sanitizedData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const updated = response.data?.data || response.data;

      setAppointments(prev =>
        prev.map(a => a._id === id ? updated : a)
      );
      return updated;
    } catch (err) {
      const axiosError = err as AxiosError;
      const message = (axiosError.response?.data as any)?.message || 'Failed to update appointment';
      setError(message);
      throw new Error(message);
    }
  }, [getToken]);

  const cancelAppointment = useCallback(async (id: string) => {
    try {
      const token = await getToken();
      await apiClient.post(`/api/appointments/${id}/cancel`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAppointments(prev =>
        prev.map(a => a._id === id ? { ...a, status: 'cancelled' } : a)
      );
    } catch (err) {
      const axiosError = err as AxiosError;
      const message = (axiosError.response?.data as any)?.message || 'Failed to cancel appointment';
      setError(message);
      throw new Error(message);
    }
  }, [getToken]);

  const deleteAppointment = useCallback(async (id: string) => {
    try {
      const token = await getToken();
      await apiClient.delete(`/api/appointments/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAppointments(prev => prev.filter(a => a._id !== id));
    } catch (err) {
      const axiosError = err as AxiosError;
      const message = (axiosError.response?.data as any)?.message || 'Failed to delete appointment';
      setError(message);
      throw new Error(message);
    }
  }, [getToken]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchAppointments();
    } else if (isLoaded && !isSignedIn) {
      setIsLoading(false);
    }
  }, [fetchAppointments, isLoaded, isSignedIn]);

  return {
    appointments,
    isLoading,
    error,
    fetchAppointments,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    deleteAppointment
  };
}