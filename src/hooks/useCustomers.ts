"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/providers/AuthProvider"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CustomerTransaction {
  _id: string
  type: "lead" | "appointment" | "purchase" | "quote" | "inquiry" | "other"
  status: "pending" | "active" | "completed" | "cancelled" | "failed"
  title: string
  description?: string
  amount?: number
  currency?: string
  referenceId?: string
  referenceModel?: string
  metadata?: Record<string, any>
  occurredAt: string
  createdAt?: string
}

export interface CustomerConversation {
  _id: string
  channel: "email" | "sms" | "phone" | "in-person" | "chat" | "other"
  direction: "inbound" | "outbound"
  senderType: "customer" | "agent" | "system"
  senderName?: string
  content: string
  subject?: string
  referenceId?: string
  sentAt: string
  createdAt?: string
}

export interface CustomerStats {
  totalTransactions: number
  totalConversations: number
  totalAppointments: number
  lastContactedAt?: string
  firstContactedAt?: string
  lifetimeValue?: number
}

export interface Customer {
  _id: string
  organizationId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  alternatePhone?: string
  fullName?: string
  dateOfBirth?: string
  address?: {
    street?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  notes?: string
  tags?: string[]
  preferredContactMethod?: "email" | "phone" | "sms"
  source: "lead" | "manual" | "import" | "booking"
  isActive: boolean
  vehicleInterest?: {
    year?: string
    make?: string
    model?: string
    trim?: string
    vin?: string
    budget?: string
    condition?: "new" | "used" | "certified"
  }
  transactions: CustomerTransaction[]
  conversations: CustomerConversation[]
  stats: CustomerStats
  createdAt: string
  updatedAt: string
}

export interface CustomerListResult {
  customers: Customer[]
  total: number
  page: number
  pages: number
}

export interface OrgCustomerStats {
  total: number
  active: number
  fromLeads: number
  manual: number
  recentlyAdded: number
}

export interface CustomerListOptions {
  page?: number
  limit?: number
  search?: string
  source?: string
  isActive?: boolean
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface CreateCustomerInput {
  firstName: string
  lastName: string
  email: string
  phone: string
  alternatePhone?: string
  dateOfBirth?: string
  address?: Customer["address"]
  notes?: string
  tags?: string[]
  preferredContactMethod?: Customer["preferredContactMethod"]
  vehicleInterest?: Customer["vehicleInterest"]
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCustomers(options: CustomerListOptions = {}) {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  const getHeaders = React.useCallback(async () => {
    const token = await getToken()
    return { headers: { Authorization: `Bearer ${token}` } }
  }, [getToken])

  // ── List ──────────────────────────────────────────────────────────────────
  const {
    data: listData,
    isLoading,
    error,
    refetch,
  } = useQuery<CustomerListResult>({
    queryKey: ["customers", options],
    queryFn: async () => {
      const headers = await getHeaders()
      const params = new URLSearchParams()
      if (options.page) params.set("page", String(options.page))
      if (options.limit) params.set("limit", String(options.limit))
      if (options.search) params.set("search", options.search)
      if (options.source) params.set("source", options.source)
      if (options.isActive !== undefined) params.set("isActive", String(options.isActive))
      if (options.sortBy) params.set("sortBy", options.sortBy)
      if (options.sortOrder) params.set("sortOrder", options.sortOrder)

      const res = await apiClient.get(`/api/customers?${params}`, headers)
      return res.data?.data
    },
    staleTime: 30_000,
  })

  // ── Stats ─────────────────────────────────────────────────────────────────
  const { data: stats } = useQuery<OrgCustomerStats>({
    queryKey: ["customers-stats"],
    queryFn: async () => {
      const headers = await getHeaders()
      const res = await apiClient.get("/api/customers/stats", headers)
      return res.data?.data
    },
    staleTime: 60_000,
  })

  // ── Single Customer ───────────────────────────────────────────────────────
  const fetchCustomer = React.useCallback(
    async (id: string): Promise<Customer> => {
      const headers = await getHeaders()
      const res = await apiClient.get(`/api/customers/${id}`, headers)
      return res.data?.data
    },
    [getHeaders]
  )

  // ── Create ────────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (data: CreateCustomerInput) => {
      const headers = await getHeaders()
      const res = await apiClient.post("/api/customers", data, headers)
      return res.data?.data as Customer
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      queryClient.invalidateQueries({ queryKey: ["customers-stats"] })
    },
  })

  // ── Update ────────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateCustomerInput> }) => {
      const headers = await getHeaders()
      const res = await apiClient.patch(`/api/customers/${id}`, data, headers)
      return res.data?.data as Customer
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
    },
  })

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const headers = await getHeaders()
      await apiClient.delete(`/api/customers/${id}`, headers)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      queryClient.invalidateQueries({ queryKey: ["customers-stats"] })
    },
  })

  // ── Add Conversation ──────────────────────────────────────────────────────
  const addConversationMutation = useMutation({
    mutationFn: async ({
      customerId,
      data,
    }: {
      customerId: string
      data: Partial<CustomerConversation>
    }) => {
      const headers = await getHeaders()
      const res = await apiClient.post(
        `/api/customers/${customerId}/conversations`,
        data,
        headers
      )
      return res.data?.data as Customer
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  })

  // ── Add Transaction ───────────────────────────────────────────────────────
  const addTransactionMutation = useMutation({
    mutationFn: async ({
      customerId,
      data,
    }: {
      customerId: string
      data: Partial<CustomerTransaction>
    }) => {
      const headers = await getHeaders()
      const res = await apiClient.post(
        `/api/customers/${customerId}/transactions`,
        data,
        headers
      )
      return res.data?.data as Customer
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  })

  return {
    customers: listData?.customers ?? [],
    total: listData?.total ?? 0,
    pages: listData?.pages ?? 1,
    page: listData?.page ?? 1,
    stats,
    isLoading,
    error,
    refetch,
    fetchCustomer,
    createCustomer: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateCustomer: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteCustomer: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    addConversation: addConversationMutation.mutateAsync,
    addTransaction: addTransactionMutation.mutateAsync,
  }
}