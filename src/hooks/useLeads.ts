import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@clerk/nextjs'

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
  threadId?: string
  messageId?: string
  isRead?: boolean
  isPending?: boolean
  labels?: string[]
  
  // Lead Information
  source: string
  status: 'New' | 'Contacted' | 'Pending' | 'Appointment Set' | 'Closed'
  vehicle: {
    year: string
    make: string
    model: string
  }
  comments: string
  createdAt: string
  updatedAt: string
}

export const useLeads = () => {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  // Helper to get auth headers
  const getAuthHeaders = async () => {
    const token = await getToken()
    return { headers: { Authorization: `Bearer ${token}` } }
  }

  // Fetch all leads
  const { data: leads = [], isLoading, refetch } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const headers = await getAuthHeaders()
      const response = await apiClient.get('/api/leads', headers)
      return response.data || []
    },
  })

  // Update lead status
  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const headers = await getAuthHeaders()
      const response = await apiClient.patch(
        `/api/leads/${id}`,
        { status },
        headers
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      refetch()
    },
  })

  // Mark as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders()
      const response = await apiClient.patch(
        `/api/leads/${id}/read`,
        {},
        headers
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      refetch()
    },
  })

  // Mark as pending
  const markAsPendingMutation = useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders()
      const response = await apiClient.patch(
        `/api/leads/${id}/pending`,
        {},
        headers
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      refetch()
    },
  })

  // Reply to inquiry
  const replyMutation = useMutation({
    mutationFn: async ({ id, message }: { id: string; message: string }) => {
      const headers = await getAuthHeaders()
      const response = await apiClient.post(
        `/api/leads/${id}/reply`,
        { message },
        headers
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      refetch()
    },
  })

  // Sync Gmail inquiries
  const syncGmailMutation = useMutation({
    mutationFn: async () => {
      const headers = await getAuthHeaders()
      const response = await apiClient.post(
        `/api/leads/sync-gmail`,
        {},
        headers
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      refetch()
    },
  })

  return {
    leads,
    isLoading,
    refetch,
    updateLeadStatus: updateLeadMutation.mutate,
    markAsRead: markAsReadMutation.mutate,
    markAsPending: markAsPendingMutation.mutate,
    reply: replyMutation.mutate,
    syncGmail: syncGmailMutation.mutate,
    isSyncingGmail: syncGmailMutation.isPending,
  }
}
