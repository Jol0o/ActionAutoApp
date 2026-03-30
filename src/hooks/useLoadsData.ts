import * as React from "react"
import { getLoads, getLoadStats, LoadStats, LoadsPagination } from "@/lib/api/loads"
import { Load } from "@/types/load"
import { useAuth } from "@/providers/AuthProvider"

export function useLoadsData(searchQuery?: string, selectedStatus?: string) {
  const [loads, setLoads] = React.useState<Load[]>([])
  const [pagination, setPagination] = React.useState<LoadsPagination | null>(null)
  const [stats, setStats] = React.useState<LoadStats>({
    all: 0, Posted: 0, Assigned: 0, "In-Transit": 0, Delivered: 0, Cancelled: 0,
  })
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [page, setPage] = React.useState(1)
  const { isLoaded, isSignedIn } = useAuth()

  const fetchLoads = React.useCallback(async (p = 1) => {
    setIsLoading(true)
    setError(null)
    try {
      const status = selectedStatus && selectedStatus !== "all" ? selectedStatus : undefined
      const q      = searchQuery?.trim() || undefined
      const [result, statsData] = await Promise.all([
        getLoads({ status, q, page: p, limit: 20 }),
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

  // Debounced re-fetch when search/status changes
  React.useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    const t = setTimeout(() => fetchLoads(1), searchQuery ? 400 : 0)
    return () => clearTimeout(t)
  }, [isLoaded, isSignedIn, fetchLoads, searchQuery])

  const loadMore = React.useCallback(() => {
    if (pagination?.hasMore) fetchLoads(page + 1)
  }, [pagination, page, fetchLoads])

  return { loads, pagination, stats, isLoading, error, fetchLoads: () => fetchLoads(1), loadMore }
}
