import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuth } from "@/providers/AuthProvider"
import { useRef, useCallback } from 'react'

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

const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

// Longer timeout specifically for the leads list fetch.
// The default apiClient timeout (30s) is too tight when the DB query is slow
// on first load or after a sync. 60s gives the backend enough headroom.
const LEADS_FETCH_TIMEOUT_MS = 60_000

export const useLeads = () => {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  // Concurrency guard: only one invalidate+refetch runs at a time.
  // Without this, concurrent mutation onSuccess callbacks (e.g. markAsRead
  // firing while a sync is in progress) stack up and cause request pile-up.
  const refetchInProgress = useRef(false)

  const getAuthHeaders = async () => {
    const token = await getToken()
    return { headers: { Authorization: `Bearer ${token}` } }
  }

  // ── Fetch all leads ────────────────────────────────────────────────────────
  const { data: leads = [], isLoading, refetch } = useQuery({
    queryKey: ['leads'],
    queryFn: async ({ signal }) => {
      const token = await getToken()

      // Pass the React Query AbortSignal into axios so that when React Query
      // cancels a stale request (e.g. component unmounts, or a newer fetch
      // supersedes this one), the in-flight HTTP request is also cancelled.
      // Previously, cancelled queries kept running to completion on the server,
      // which was a primary driver of the concurrent-request pile-up.
      const response = await apiClient.get('/api/leads', {
        headers: { Authorization: `Bearer ${token}` },
        signal,
        timeout: LEADS_FETCH_TIMEOUT_MS,
      })

      return Array.isArray(response.data)
        ? response.data
        : response.data?.data || []
    },
    // Always re-fetch from network — never serve stale leads from cache
    staleTime: 0,
    refetchOnWindowFocus: true,
    // Retry once on timeout/network error before surfacing the failure.
    // Retrying immediately on a timeout would just compound the problem,
    // so we wait 2s to let any in-flight requests drain first.
    retry: (failureCount, error: any) => {
      if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        return failureCount < 1
      }
      return false
    },
    retryDelay: 2000,
  })

  // ── Shared invalidation helper — guards against concurrent calls ──────────
  const invalidateAndRefetch = useCallback(async (waitMs = 600) => {
    if (refetchInProgress.current) return
    refetchInProgress.current = true
    try {
      if (waitMs > 0) await delay(waitMs)
      await queryClient.invalidateQueries({ queryKey: ['leads'] })
      await refetch()
    } finally {
      refetchInProgress.current = false
    }
  }, [queryClient, refetch])

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
    // isRead is cosmetic — skip the delay, update immediately
    onSuccess: () => invalidateAndRefetch(0),
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

  // ── Sync Gmail (central) ───────────────────────────────────────────────────
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