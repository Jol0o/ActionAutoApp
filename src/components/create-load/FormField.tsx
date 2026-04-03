"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"

export function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
}

export function Field({
  label,
  required,
  icon: Icon,
  children,
  className,
}: {
  label: string
  required?: boolean
  icon?: React.ElementType
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <Label className="text-[11px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
        {Icon && <Icon className="size-3 text-muted-foreground/70" />}
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}
