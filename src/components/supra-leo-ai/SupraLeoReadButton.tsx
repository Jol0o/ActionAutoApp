// ─── Supra Leo AI · Read Message Button ──────────────────────────────────────
// Accepts BOTH: lead={lead} (preferred) OR leadId={lead._id} (backward compat)

'use client'

import * as React from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface LeadData {
  _id: string
  firstName?: string
  lastName?: string
  senderName?: string
  senderEmail?: string
  email?: string
  subject?: string
  body?: string
  status?: string
}

interface Props {
  /** Full lead object (preferred) */
  lead?: LeadData
  /** Fallback: just the ID (backward compat with old LeadsTab) */
  leadId?: string
  size?: 'sm' | 'md'
  className?: string
}

export function SupraLeoReadButton({ lead, leadId, size = 'sm', className = '' }: Props) {
  const [flash, setFlash] = React.useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    const id = lead?._id || leadId
    if (!id) return

    setFlash(true)
    setTimeout(() => setFlash(false), 2000)

    window.dispatchEvent(new CustomEvent('supraleo:read-message', {
      detail: {
        leadId: id,
        firstName: lead?.firstName,
        lastName: lead?.lastName,
        senderName: lead?.senderName,
        senderEmail: lead?.senderEmail,
        email: lead?.email,
        subject: lead?.subject,
        body: lead?.body,
        status: lead?.status,
      },
    }))
  }

  const sz = size === 'sm' ? 'h-6 w-6 text-xs' : 'h-8 w-8 text-sm'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button onClick={handleClick} aria-label="Read with Supra Leo AI"
          className={`inline-flex items-center justify-center rounded-lg transition-all duration-200 shrink-0 ${
            flash ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/20 scale-95'
                  : 'bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-500/40'
          } ${sz} ${className}`}>
          🦁
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">Read with Supra Leo AI</TooltipContent>
    </Tooltip>
  )
}