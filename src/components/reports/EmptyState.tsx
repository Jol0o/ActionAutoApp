"use client"

import React from "react"

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
      <div className="size-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-foreground text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">{description}</p>
      </div>
    </div>
  )
}
