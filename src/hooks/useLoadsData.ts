import * as React from "react"
import { getLoads, getLoadStats, deleteLoad, LoadStats, LoadsPagination } from "@/lib/api/loads"
import { Load } from "@/types/load"
import { useAuth } from "@/providers/AuthProvider"
import { initializeSocket } from "@/lib/socket.client"
import { PER_PAGE_OPTIONS, PerPageOption } from "./useTransportationData"

export function useLoadsData(searchQuery?: string, selectedStatus?: string) {
  const [loads, setLoads] = React.useState<Load[]>([])
  const [pagination, setPagination] = React.useState<LoadsPagination | null>(null)
  const [stats, setStats] = React.useState<LoadStats>({
    all: 0, Posted: 0, Assigned: 0, "In-Transit": 0, Delivered: 0, Cancelled: 0,
  })
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState<PerPageOption>(5)
  const { isLoaded, isSignedIn, getToken } = useAuth()

  // Refs so socket handler always sees the latest page/limit
  const pageRef = React.useRef(page)
  const limitRef = React.useRef(limit)
  React.useEffect(() => { pageRef.current = page }, [page])
  React.useEffect(() => { limitRef.current = limit }, [limit])

  const fetchLoads = React.useCallback(async (p = 1, l = limitRef.current) => {
    setIsLoading(true)
    setError(null)
    try {
      const status = selectedStatus && selectedStatus !== "all" ? selectedStatus : undefined
      const q      = searchQuery?.trim() || undefined
      const [result, statsData] = await Promise.all([
        getLoads({ status, q, page: p, limit: l }),
        getLoadStats(),
      ])
      setLoads(result.loads)
      setPagination(result.pagination)
      setStats(statsData)
      setPage(p)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load loads")
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, selectedStatus])

  // Debounced re-fetch when search/status changes — reset to page 1
  React.useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    const t = setTimeout(() => fetchLoads(1, limitRef.current), searchQuery ? 400 : 0)
    return () => clearTimeout(t)
  }, [isLoaded, isSignedIn, fetchLoads, searchQuery])

  // Socket.IO — realtime load:change events
  React.useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    let cleanup: (() => void) | undefined

    getToken().then((token) => {
      if (!token) return
      const socket = initializeSocket(token)

      const handleLoadChange = () => {
        fetchLoads(pageRef.current, limitRef.current)
        getLoadStats().then(setStats).catch(() => {})
      }

      socket.on("load:change", handleLoadChange)
      cleanup = () => { socket.off("load:change", handleLoadChange) }
    })

    return () => { cleanup?.() }
  }, [isLoaded, isSignedIn, getToken, fetchLoads])

  const changePage = React.useCallback((p: number) => {
    pageRef.current = p
    fetchLoads(p, limitRef.current)
  }, [fetchLoads])

  const changeLimit = React.useCallback((l: PerPageOption) => {
    limitRef.current = l
    setLimit(l)
    fetchLoads(1, l)
  }, [fetchLoads])

  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const handleDeleteLoad = React.useCallback(async (loadId: string) => {
    setDeletingId(loadId)
    try {
      await deleteLoad(loadId)
      setLoads((prev) => prev.filter((l) => l._id !== loadId))
      getLoadStats().then(setStats).catch(() => {})
    } finally {
      setDeletingId(null)
    }
  }, [])

  return {
    loads,
    pagination,
    page,
    limit,
    changePage,
    changeLimit,
    stats,
    isLoading,
    error,
    fetchLoads: () => fetchLoads(1, limitRef.current),
    handleDeleteLoad,
    deletingId,
  }
}
