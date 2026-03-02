"use client"

import * as React from "react"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DynamicPane {
  id: string
  selectedTab: string
  size: number
}

export interface TabOption {
  id: string
  label: string
  icon?: React.ReactNode
}

interface FullscreenContextValue {
  isFullscreen: boolean
  toggleFullscreen: () => void
  exitFullscreen: () => void
  isMultiPane: boolean
  panes: DynamicPane[]
  addPane: (tabId: string) => void
  removePane: (paneId: string) => void
  setPaneTab: (paneId: string, tabId: string) => void
  resizePane: (paneId: string, size: number) => void
  resetToSinglePane: () => void
}

const FullscreenContext = React.createContext<FullscreenContextValue | null>(null)

// ─── Session persistence ─────────────────────────────────────────────────────

const STORAGE_KEY = "fullscreen-pane-config-v2"

interface PersistedState {
  isFullscreen: boolean
  panes: DynamicPane[]
}

function loadSession(): PersistedState | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveSession(state: PersistedState) {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

// ─── Pane factory ────────────────────────────────────────────────────────────

let paneCounter = 0

function createPane(tabId: string, size = 50): DynamicPane {
  paneCounter += 1
  return { id: `pane-${paneCounter}-${Date.now()}`, selectedTab: tabId, size }
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function FullscreenProvider({
  children,
  defaultTab = "leads",
}: {
  children: React.ReactNode
  defaultTab?: string
}) {
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [panes, setPanes] = React.useState<DynamicPane[]>(() => [createPane(defaultTab)])
  const [hydrated, setHydrated] = React.useState(false)

  const isMultiPane = panes.length > 1

  React.useEffect(() => {
    const saved = loadSession()
    if (saved) {
      setIsFullscreen(saved.isFullscreen)
      if (saved.panes?.length) {
        setPanes(saved.panes)
        saved.panes.forEach((p) => {
          const match = p.id.match(/^pane-(\d+)/)
          if (match) paneCounter = Math.max(paneCounter, parseInt(match[1], 10))
        })
      }
    }
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!hydrated) return
    saveSession({ isFullscreen, panes })
  }, [isFullscreen, panes, hydrated])

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) setIsFullscreen(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isFullscreen])

  React.useEffect(() => {
    if (isFullscreen) {
      document.body.classList.add("app-fullscreen")
    } else {
      document.body.classList.remove("app-fullscreen")
    }
    return () => document.body.classList.remove("app-fullscreen")
  }, [isFullscreen])

  const toggleFullscreen = React.useCallback(() => setIsFullscreen((p) => !p), [])
  const exitFullscreen = React.useCallback(() => setIsFullscreen(false), [])

  const addPane = React.useCallback((tabId: string) => {
    setPanes((prev) => [...prev, createPane(tabId)])
  }, [])

  const removePane = React.useCallback((paneId: string) => {
    setPanes((prev) => {
      const next = prev.filter((p) => p.id !== paneId)
      return next.length === 0 ? [createPane("leads")] : next
    })
  }, [])

  const setPaneTab = React.useCallback((paneId: string, tabId: string) => {
    setPanes((prev) =>
      prev.map((p) => (p.id === paneId ? { ...p, selectedTab: tabId } : p))
    )
  }, [])

  const resizePane = React.useCallback((paneId: string, size: number) => {
    setPanes((prev) =>
      prev.map((p) => (p.id === paneId ? { ...p, size: Math.max(15, Math.min(85, size)) } : p))
    )
  }, [])

  const resetToSinglePane = React.useCallback(() => {
    setPanes((prev) => {
      const first = prev[0]
      return first ? [{ ...first, size: 50 }] : [createPane("leads")]
    })
  }, [])

  return (
    <FullscreenContext.Provider
      value={{
        isFullscreen, toggleFullscreen, exitFullscreen,
        isMultiPane, panes,
        addPane, removePane, setPaneTab, resizePane, resetToSinglePane,
      }}
    >
      {children}
    </FullscreenContext.Provider>
  )
}

export function useFullscreen() {
  const ctx = React.useContext(FullscreenContext)
  if (!ctx) throw new Error("useFullscreen must be used within <FullscreenProvider>")
  return ctx
}