import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuth } from "@/providers/AuthProvider"

export interface Lead {
  _id: string
  // Contact Information
  firstName: string
  lastName: string
  email: string
  phone: string
  senderEmail?: string
  senderName?: string

  // Email Fields
  subject?: string
  body?: string
  parsedContent?: string
  threadId?: string
  messageId?: string
  isRead?: boolean
  isPending?: boolean
  labels?: string[]
  channel?: string

  // Lead Information
  source: string
  status: 'New' | 'Contacted' | 'Pending' | 'Appointment Set' | 'Closed'
  vehicle: {
    year: string
    make: string
    model: string
  }
  comments: string
  appointment?: any
  createdAt: string
  updatedAt: string
}

// ─── Small helper so every post-sync refetch waits for DB writes ─────────────
const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

export const useLeads = () => {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  const getAuthHeaders = async () => {
    const token = await getToken()
    return { headers: { Authorization: `Bearer ${token}` } }
  }

  // ── Fetch all leads ────────────────────────────────────────────────────────
  const { data: leads = [], isLoading, refetch } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const headers = await getAuthHeaders()
      const response = await apiClient.get('/api/leads', headers)
      // Backend returns array directly or wrapped in data field
      return Array.isArray(response.data) ? response.data : response.data?.data || []
    },
    // Always re-fetch from network — never serve stale leads from cache
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  // ── Shared invalidation helper — waits for DB then refreshes ──────────────
  const invalidateAndRefetch = async (waitMs = 600) => {
    await delay(waitMs)
    await queryClient.invalidateQueries({ queryKey: ['leads'] })
    await refetch()
  }

  // ── Update lead status ─────────────────────────────────────────────────────
  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const headers = await getAuthHeaders()
      const response = await apiClient.patch(`/api/leads/${id}`, { status }, headers)
      return response.data
    },
    onSuccess: () => invalidateAndRefetch(300),
  })

  // ── Mark as read ───────────────────────────────────────────────────────────
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders()
      const response = await apiClient.patch(`/api/leads/${id}/read`, {}, headers)
      return response.data
    },
    onSuccess: () => invalidateAndRefetch(300),
  })

  // ── Mark as pending ────────────────────────────────────────────────────────
  const markAsPendingMutation = useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders()
      const response = await apiClient.patch(`/api/leads/${id}/pending`, {}, headers)
      return response.data
    },
    onSuccess: () => invalidateAndRefetch(300),
  })

  // ── Reply to inquiry ───────────────────────────────────────────────────────
  const replyMutation = useMutation({
    mutationFn: async ({ id, message }: { id: string; message: string }) => {
      const headers = await getAuthHeaders()
      const response = await apiClient.post(`/api/leads/${id}/reply`, { message }, headers)
      return response.data
    },
    onSuccess: () => invalidateAndRefetch(300),
  })

  // ── Sync Gmail (legacy endpoint kept for compat) ───────────────────────────
  const syncGmailMutation = useMutation({
    mutationFn: async () => {
      const headers = await getAuthHeaders()
      const response = await apiClient.syncPost(`/api/leads/sync-central`, {}, headers)
      return response.data
    },
    // After sync, wait 1s for all DB writes to settle before refetching
    onSuccess: () => invalidateAndRefetch(1000),
  })

  return {
    leads,
    isLoading,
    refetch: () => invalidateAndRefetch(0),
    updateLeadStatus: updateLeadMutation.mutate,
    markAsRead: markAsReadMutation.mutate,
    markAsPending: markAsPendingMutation.mutate,
    reply: replyMutation.mutate,
    syncGmail: syncGmailMutation.mutateAsync,
    isSyncingGmail: syncGmailMutation.isPending,
  }
}
