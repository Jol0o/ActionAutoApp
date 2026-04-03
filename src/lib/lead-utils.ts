/**
 * Utility functions for Lead formatting and cleansing.
 */

export const cleanHTML = (html: string) => {
  if (!html) return ''
  return html
    .replace(/<!doctype[^>]*>/gi, '').replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/\r\n/g, '\n').trim()
}

export const getInitials = (a?: string, b?: string) => ((a?.[0] || '') + (b?.[0] || '')).toUpperCase() || '??'

export const fmtTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

export const fmtShort = (d: Date) => {
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (diff === 0) return fmtTime(d)
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export const fmtFull = (d: Date) => d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
