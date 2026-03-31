'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'

export type ChatModule =
  | 'appointments'
  | 'timeproof'
  | 'supraspace'
  | 'biometrics'
  | 'feeds'
  | 'general'

export interface ChatMessage {
  _id?: string
  role: 'user' | 'assistant'
  content: string
  module?: ChatModule
  createdAt: string | Date
  streaming?: boolean
}

interface UseChatOptions {
  module?: ChatModule
  autoLoadHistory?: boolean
}

export function useSupraLeoChat(options: UseChatOptions = {}) {
  const { module = 'general', autoLoadHistory = false } = options

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const abortRef = useRef<AbortController | null>(null)

  const getToken = useCallback(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('crm_token') || ''
  }, [])

  // ── Backend base URL (set NEXT_PUBLIC_API_URL in .env.local) ──────────────
  const getBackendUrl = useCallback(() => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
  }, [])

  const loadHistory = useCallback(async (pageNum = 1, append = false) => {
    const token = getToken()
    if (!token) return

    setIsLoadingHistory(true)
    try {
      const res = await apiClient.get('/api/supraleo/chat/history', {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: pageNum, limit: 50 },
      })
      const data = res.data?.data
      const fetched: ChatMessage[] = (data?.messages || []).map((m: any) => ({
        ...m,
        createdAt: m.createdAt || new Date().toISOString(),
      }))

      if (append) {
        setMessages(prev => [...fetched, ...prev])
      } else {
        setMessages(fetched)
      }
      setHasMore(data?.hasMore || false)
      setPage(pageNum)
    } catch {
      // Silently ignore — user may have no history yet
    } finally {
      setIsLoadingHistory(false)
    }
  }, [getToken])

  useEffect(() => {
    if (autoLoadHistory) {
      loadHistory(1, false)
    }
  }, [autoLoadHistory, loadHistory])

  const loadMoreHistory = useCallback(() => {
    if (!hasMore || isLoadingHistory) return
    loadHistory(page + 1, true)
  }, [hasMore, isLoadingHistory, page, loadHistory])

  const sendMessage = useCallback(async (
    content: string,
    contextData?: Record<string, any>
  ) => {
    const token = getToken()
    if (!token || !content.trim() || isLoading) return

    const userMsg: ChatMessage = {
      role: 'user',
      content: content.trim(),
      module,
      createdAt: new Date().toISOString(),
    }
    const assistantMsgId = `streaming-${Date.now()}`
    const assistantMsg: ChatMessage = {
      _id: assistantMsgId,
      role: 'assistant',
      content: '',
      module,
      createdAt: new Date().toISOString(),
      streaming: true,
    }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setIsLoading(true)
    setError(null)

    abortRef.current = new AbortController()

    try {
      const response = await fetch(`${getBackendUrl()}/api/supraleo/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: content.trim(),
          module,
          context: contextData,
          stream: true,
        }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData?.message || `HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6).trim()
            if (!raw) continue
            try {
              const parsed = JSON.parse(raw)
              if (parsed.type === 'delta') {
                setMessages(prev =>
                  prev.map(m =>
                    m._id === assistantMsgId
                      ? { ...m, content: m.content + parsed.text }
                      : m
                  )
                )
              } else if (parsed.type === 'done') {
                setMessages(prev =>
                  prev.map(m =>
                    m._id === assistantMsgId
                      ? { ...m, _id: parsed.messageId, streaming: false }
                      : m
                  )
                )
              } else if (parsed.type === 'error') {
                throw new Error(parsed.message)
              }
            } catch {
              // Skip malformed SSE events
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setMessages(prev =>
          prev.map(m =>
            m._id === assistantMsgId
              ? { ...m, streaming: false, content: m.content || '(Stopped)' }
              : m
          )
        )
      } else {
        const errMsg = err?.message || 'Failed to get AI response'
        setError(errMsg)
        setMessages(prev =>
          prev.map(m =>
            m._id === assistantMsgId
              ? { ...m, streaming: false, content: `Error: ${errMsg}` }
              : m
          )
        )
      }
    } finally {
      setIsLoading(false)
    }
  }, [getToken, getBackendUrl, isLoading, module])

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const clearHistory = useCallback(async () => {
    const token = getToken()
    if (!token) return
    try {
      await apiClient.delete('/api/supraleo/chat/history', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setMessages([])
      setPage(1)
      setHasMore(false)
    } catch {
      setError('Failed to clear history')
    }
  }, [getToken])

  const addSystemMessage = useCallback((content: string) => {
    const msg: ChatMessage = {
      role: 'assistant',
      content,
      module,
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, msg])
  }, [module])

  return {
    messages,
    isLoading,
    isLoadingHistory,
    hasMore,
    error,
    sendMessage,
    stopGeneration,
    clearHistory,
    loadHistory,
    loadMoreHistory,
    addSystemMessage,
    setMessages,
  }
}