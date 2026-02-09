import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Appointment } from '@/types/appointment';
import { AxiosError } from 'axios';
import { useAuth } from '@clerk/nextjs';

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoaded, isSignedIn, getToken } = useAuth();

  // Helper to get auth headers
  const getAuthHeaders = async () => {
    const token = await getToken();
    console.log('[useAppointments] Token for request:', token ? 'exists' : 'missing');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  const fetchAppointments = useCallback(async (params?: {
    status?: string;
    entryType?: string;
    startDate?: Date;
    endDate?: Date;
  }) => {
    if (!isSignedIn) {
      console.log('[fetchAppointments] User not signed in');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const authHeaders = await getAuthHeaders();
      console.log('[fetchAppointments] Making request with params:', params);
      
      const response = await apiClient.get('/api/appointments', { 
        params,
        ...authHeaders
      });
      
      const data = response.data?.data || response.data;
      setAppointments(data.appointments || []);
      console.log('[fetchAppointments] Success, got', data.appointments?.length || 0, 'appointments');
    } catch (err) {
      const axiosError = err as AxiosError;
      const message = (axiosError.response?.data as any)?.message || 'Failed to fetch appointments';
      console.error('[fetchAppointments] Error:', {
        message,
        status: axiosError.response?.status,
        data: axiosError.response?.data
      });
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, getToken]);

  const getAppointmentById = useCallback(async (id: string) => {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await apiClient.get(`/api/appointments/${id}`, authHeaders);
      return response.data?.data || response.data;
    } catch (err) {
      const axiosError = err as AxiosError;
      const message = (axiosError.response?.data as any)?.message || 'Failed to fetch appointment';
      throw new Error(message);
    }
  }, [getToken]);

  const createAppointment = useCallback(async (data: any) => {
    console.log('[createAppointment] Starting with data:', data);
    
    try {
      const sanitizedData = {
        ...data,
        conversationId: data.conversationId?.trim() || undefined,
        location: data.location?.trim() || undefined,
        description: data.description?.trim() || undefined,
        meetingLink: data.meetingLink?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        participants: Array.isArray(data.participants)
          ? data.participants.filter((p: string) => p && p.trim())
          : undefined,
        guestEmails: Array.isArray(data.guestEmails)
          ? data.guestEmails.filter((e: string) => e && e.trim())
          : undefined,
      };

      console.log('[createAppointment] Sanitized data:', sanitizedData);

      const authHeaders = await getAuthHeaders();
      console.log('[createAppointment] Making POST request');
      
      const response = await apiClient.post('/api/appointments', sanitizedData, authHeaders);
      const appointment = response.data?.data || response.data;

      console.log('[createAppointment] Success:', appointment);
      setAppointments(prev => [appointment, ...prev]);
      return appointment;
    } catch (err) {
      const axiosError = err as AxiosError;

      console.error('[createAppointment] Error details:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        message: axiosError.message,
        config: axiosError.config,
      });

      const errorMessage = (axiosError.response?.data as any)?.message
        || (axiosError.response?.data as any)?.error
        || axiosError.message
        || 'Failed to create appointment';

      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [getToken]);

  const updateAppointment = useCallback(async (id: string, data: any) => {
    try {
      const sanitizedData = {
        ...data,
        conversationId: data.conversationId?.trim() || undefined,
        location: data.location?.trim() || undefined,
        description: data.description?.trim() || undefined,
        meetingLink: data.meetingLink?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        participants: Array.isArray(data.participants)
          ? data.participants.filter((p: string) => p && p.trim())
          : undefined,
      };

      const authHeaders = await getAuthHeaders();
      const response = await apiClient.patch(`/api/appointments/${id}`, sanitizedData, authHeaders);
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
      const authHeaders = await getAuthHeaders();
      await apiClient.post(`/api/appointments/${id}/cancel`, {}, authHeaders);
      setAppointments(prev =>
        prev.map(a => a._id === id ? { ...a, status: 'cancelled' as const } : a)
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
      const authHeaders = await getAuthHeaders();
      await apiClient.delete(`/api/appointments/${id}`, authHeaders);
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
    getAppointmentById,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    deleteAppointment
  };
}