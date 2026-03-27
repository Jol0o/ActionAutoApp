'use client'

import * as React from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface LeadData {
  _id: string
  firstName?: string; lastName?: string; senderName?: string
  senderEmail?: string; email?: string; subject?: string
  body?: string; status?: string
}

interface Props {
  lead?: LeadData
  leadId?: string
  size?: 'sm' | 'md'
  className?: string
}

export function SupraLeoReadButton({ lead, leadId, size = 'sm', className = '' }: Props) {
  const [active, setActive] = React.useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const id = lead?._id || leadId
    if (!id) return
    setActive(true)
    setTimeout(() => setActive(false), 1600)
    window.dispatchEvent(new CustomEvent('supraleo:read-message', {
      detail: { leadId: id, firstName: lead?.firstName, lastName: lead?.lastName, senderName: lead?.senderName, senderEmail: lead?.senderEmail, email: lead?.email, subject: lead?.subject, body: lead?.body, status: lead?.status },
    }))
  }

  const dim = size === 'sm' ? 24 : 30
  const iconSz = size === 'sm' ? 13 : 16

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleClick}
          aria-label="Read with Supra Leo AI"
          className={className}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: dim, height: dim,
            border: `1px solid ${active ? 'rgba(184,137,46,0.6)' : 'rgba(184,137,46,0.2)'}`,
            borderRadius: 3,
            background: active ? 'rgba(184,137,46,0.14)' : 'rgba(184,137,46,0.05)',
            cursor: 'pointer',
            padding: 0,
            transition: 'background 0.14s, border-color 0.14s, transform 0.1s',
            transform: active ? 'scale(0.92)' : 'scale(1)',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            if (!active) {
              e.currentTarget.style.borderColor = 'rgba(184,137,46,0.42)'
              e.currentTarget.style.background = 'rgba(184,137,46,0.1)'
            }
          }}
          onMouseLeave={e => {
            if (!active) {
              e.currentTarget.style.borderColor = 'rgba(184,137,46,0.2)'
              e.currentTarget.style.background = 'rgba(184,137,46,0.05)'
            }
          }}
        >
          <svg width={iconSz} height={iconSz} viewBox="0 0 16 16" fill="none">
            {/* Lion head circle */}
            <circle cx="8" cy="7.5" r="4.2" stroke="rgba(184,137,46,0.8)" strokeWidth="0.9"/>
            {/* Mane spikes */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
              const rad = (deg * Math.PI) / 180
              const r1 = 4.5, r2 = i % 2 === 0 ? 6.0 : 5.4
              return (
                <line
                  key={deg}
                  x1={8 + Math.cos(rad) * r1}
                  y1={7.5 + Math.sin(rad) * r1}
                  x2={8 + Math.cos(rad) * r2}
                  y2={7.5 + Math.sin(rad) * r2}
                  stroke="rgba(184,137,46,0.65)"
                  strokeWidth={i % 2 === 0 ? 0.9 : 0.6}
                  strokeLinecap="round"
                />
              )
            })}
            {/* Eyes */}
            <circle cx="6.5" cy="6.9" r="0.7" fill="rgba(184,137,46,0.9)"/>
            <circle cx="9.5" cy="6.9" r="0.7" fill="rgba(184,137,46,0.9)"/>
            {/* Nose */}
            <ellipse cx="8" cy="8.5" rx="0.5" ry="0.35" fill="rgba(184,137,46,0.7)"/>
          </svg>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.08em' }}>
          Read with Supra Leo
        </span>
      </TooltipContent>
    </Tooltip>
  )
}

export default SupraLeoReadButton