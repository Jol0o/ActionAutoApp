import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@clerk/nextjs'

export interface Lead {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  source: string
  status: 'New' | 'Contacted' | 'Appointment Set' | 'Closed'
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

  return {
    leads,
    isLoading,
    refetch,
    updateLeadStatus: updateLeadMutation.mutate,
  }
}
