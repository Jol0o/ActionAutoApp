// hooks/useAppointments.ts

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Appointment } from '@/types/appointment';
import { AxiosError } from 'axios';

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async (params?: {
    status?: string;
    entryType?: string;
    startDate?: Date;
    endDate?: Date;
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiClient.get('/api/appointments', { params });
      const data = response.data?.data || response.data;
      
      setAppointments(data.appointments || []);
    } catch (err) {
      const axiosError = err as AxiosError;
      const message = (axiosError.response?.data as any)?.message || 'Failed to fetch appointments';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAppointmentById = useCallback(async (id: string) => {
    try {
      const response = await apiClient.get(`/api/appointments/${id}`);
      return response.data?.data || response.data;
    } catch (err) {
      const axiosError = err as AxiosError;
      const message = (axiosError.response?.data as any)?.message || 'Failed to fetch appointment';
      throw new Error(message);
    }
  }, []);

  const createAppointment = useCallback(async (data: any) => {
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
      
      const response = await apiClient.post('/api/appointments', sanitizedData);
      const appointment = response.data?.data || response.data;
      
      setAppointments(prev => [appointment, ...prev]);
      return appointment;
    } catch (err) {
      const axiosError = err as AxiosError;
      const errorMessage = (axiosError.response?.data as any)?.message 
        || (axiosError.response?.data as any)?.error
        || axiosError.message 
        || 'Failed to create appointment';
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

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

      const response = await apiClient.patch(`/api/appointments/${id}`, sanitizedData);
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
  }, []);

  const cancelAppointment = useCallback(async (id: string) => {
    try {
      await apiClient.post(`/api/appointments/${id}/cancel`);
      setAppointments(prev => 
        prev.map(a => a._id === id ? { ...a, status: 'cancelled' as const } : a)
      );
    } catch (err) {
      const axiosError = err as AxiosError;
      const message = (axiosError.response?.data as any)?.message || 'Failed to cancel appointment';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const deleteAppointment = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/api/appointments/${id}`);
      setAppointments(prev => prev.filter(a => a._id !== id));
    } catch (err) {
      const axiosError = err as AxiosError;
      const message = (axiosError.response?.data as any)?.message || 'Failed to delete appointment';
      setError(message);
      throw new Error(message);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

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