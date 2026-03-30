"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 pt-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-9 flex-1 rounded-md" />
          <Skeleton className="h-9 flex-1 rounded-md" />
        </div>
      ))}
    </div>
  )
}

interface SectionCardProps {
  icon: React.ElementType
  title: string
  description: string
  children?: React.ReactNode
  skeletonRows?: number
  comingSoon?: boolean
}

export function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  skeletonRows = 3,
  comingSoon = true,
}: SectionCardProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="px-4 sm:px-5 pt-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="bg-green-500/10 dark:bg-green-500/20 p-1.5 rounded">
            <Icon className="size-4 text-green-600 dark:text-green-400" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold text-foreground">
              {title}
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
              {description}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-5 py-4">
        {comingSoon ? <SectionSkeleton rows={skeletonRows} /> : children}
      </CardContent>
    </Card>
  )
}
