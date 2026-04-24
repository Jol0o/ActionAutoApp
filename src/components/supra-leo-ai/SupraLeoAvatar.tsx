'use client'

import * as React from 'react'
import { useRef, useEffect, useCallback } from 'react'

export type LeoState =
  | 'idle' | 'listening' | 'speaking' | 'thinking'
  | 'reading' | 'waiting-command' | 'error'

interface Props {
  state?: LeoState
  size?: number
  onClick?: () => void
  className?: string
  style?: React.CSSProperties
  animate?: boolean
}

// State → color config
const STATE_COLORS: Record<LeoState, { primary: string; secondary: string; glow: string }> = {
  idle:              { primary: '#3B82F6', secondary: '#1D4ED8', glow: 'rgba(59,130,246,0.4)' },
  listening:         { primary: '#10B981', secondary: '#059669', glow: 'rgba(16,185,129,0.45)' },
  speaking:          { primary: '#F59E0B', secondary: '#D97706', glow: 'rgba(245,158,11,0.45)' },
  thinking:          { primary: '#8B5CF6', secondary: '#7C3AED', glow: 'rgba(139,92,246,0.45)' },
  reading:           { primary: '#06B6D4', secondary: '#0891B2', glow: 'rgba(6,182,212,0.45)' },
  'waiting-command': { primary: '#10B981', secondary: '#047857', glow: 'rgba(16,185,129,0.35)' },
  error:             { primary: '#EF4444', secondary: '#DC2626', glow: 'rgba(239,68,68,0.45)' },
}

export function drawLionFace(
  canvas: HTMLCanvasElement,
  state: LeoState,
  activityAmt: number,
  pulseFrac: number,
  dark: boolean,
) {
  const ctx = canvas.getContext('2d')!
  const W = canvas.width, H = canvas.height
  const cx = W / 2, cy = H / 2
  const r = Math.min(W, H) * 0.46
  ctx.clearRect(0, 0, W, H)

  const col = STATE_COLORS[state]
  const isActive = state !== 'idle' && state !== 'error'

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.clip()

  // Background – dark vs light
  const bgG = ctx.createRadialGradient(cx, cy * 0.5, 0, cx, cy, r * 1.1)
  if (dark) {
    bgG.addColorStop(0, '#0C1829')
    bgG.addColorStop(0.55, '#070F1C')
    bgG.addColorStop(1, '#030810')
  } else {
    bgG.addColorStop(0, '#EFF6FF')
    bgG.addColorStop(0.55, '#DBEAFE')
    bgG.addColorStop(1, '#BFDBFE')
  }
  ctx.fillStyle = bgG
  ctx.fillRect(0, 0, W, H)

  // HUD grid lines
  ctx.save()
  ctx.globalAlpha = dark ? 0.06 : 0.08
  ctx.strokeStyle = dark ? '#4AABF0' : '#3B82F6'
  ctx.lineWidth = 0.4
  const gs = r * 0.22
  for (let x = cx % gs; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
  for (let y = cy % gs; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
  ctx.globalAlpha = dark ? 0.08 : 0.1
  for (let i = 0; i < 5; i++) {
    const ly = cy + r * (0.45 + i * 0.12)
    if (ly > H) break
    const shrink = 1 - i * 0.15
    ctx.beginPath()
    ctx.moveTo(cx - r * shrink, ly)
    ctx.lineTo(cx + r * shrink, ly)
    const lg = ctx.createLinearGradient(cx - r, ly, cx + r, ly)
    lg.addColorStop(0, 'transparent')
    lg.addColorStop(0.3, col.primary)
    lg.addColorStop(0.7, col.primary)
    lg.addColorStop(1, 'transparent')
    ctx.strokeStyle = lg
    ctx.lineWidth = 0.5
    ctx.stroke()
  }
  ctx.restore()

  // Ambient state glow
  if (isActive) {
    const glowG = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r)
    glowG.addColorStop(0, 'transparent')
    glowG.addColorStop(0.6, 'transparent')
    glowG.addColorStop(1, col.glow.replace('0.4', dark ? '0.15' : '0.2'))
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = glowG
    ctx.fill()
  }

  // Pulse rings
  if (isActive && pulseFrac > 0) {
    for (let ring = 0; ring < 2; ring++) {
      const ringR = r * (0.52 + ring * 0.15 + pulseFrac * 0.08)
      const alpha = Math.max(0, (0.25 - ring * 0.08) * pulseFrac)
      ctx.beginPath()
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2)
      ctx.strokeStyle = `${col.primary}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`
      ctx.lineWidth = 0.8
      ctx.stroke()
    }
  }

  // LED DRL headlight strips
  const drlTopY = cy - r * 0.285
  const drlBotY = cy - r * 0.185
  const drlInner = r * 0.08
  const drlOuter = r * 0.44
  const drlBright = isActive ? 0.9 : (dark ? 0.55 : 0.7)

  const drawDRL = (side: 1 | -1) => {
    const sx = cx + side * drlInner
    const ex = cx + side * drlOuter

    ctx.save()
    ctx.shadowColor = col.primary
    ctx.shadowBlur = r * 0.12
    ctx.beginPath()
    ctx.moveTo(sx, drlTopY)
    ctx.lineTo(ex, drlTopY)
    const g1 = ctx.createLinearGradient(sx, 0, ex, 0)
    g1.addColorStop(0, `${col.primary}${Math.floor(drlBright * 255).toString(16).padStart(2, '0')}`)
    g1.addColorStop(0.7, `${col.primary}${Math.floor(drlBright * 0.9 * 255).toString(16).padStart(2, '0')}`)
    g1.addColorStop(1, `${col.primary}20`)
    if (side === -1) {
      g1.addColorStop(0, `${col.primary}20`)
      g1.addColorStop(0.3, `${col.primary}${Math.floor(drlBright * 0.9 * 255).toString(16).padStart(2, '0')}`)
      g1.addColorStop(1, `${col.primary}${Math.floor(drlBright * 255).toString(16).padStart(2, '0')}`)
    }
    ctx.strokeStyle = g1
    ctx.lineWidth = r * 0.028
    ctx.lineCap = 'round'
    ctx.stroke()

    ctx.globalAlpha = 0.5
    ctx.shadowBlur = r * 0.06
    ctx.beginPath()
    ctx.moveTo(sx + side * r * 0.04, drlBotY)
    ctx.lineTo(ex - side * r * 0.06, drlBotY)
    ctx.lineWidth = r * 0.014
    ctx.stroke()
    ctx.restore()

    ctx.save()
    ctx.globalAlpha = drlBright * 0.6
    ctx.shadowColor = col.primary
    ctx.shadowBlur = r * 0.06
    ctx.beginPath()
    ctx.moveTo(sx, drlTopY)
    ctx.lineTo(sx, drlBotY + r * 0.04)
    ctx.strokeStyle = col.primary
    ctx.lineWidth = r * 0.018
    ctx.lineCap = 'round'
    ctx.stroke()
    ctx.restore()
  }

  drawDRL(1)
  drawDRL(-1)

  // Central emblem
  const embR = r * 0.28
  const embY = cy + r * 0.06

  ctx.save()
  if (isActive) {
    ctx.shadowColor = col.primary
    ctx.shadowBlur = r * 0.18 * pulseFrac
  }

  const embG = ctx.createRadialGradient(cx, embY - embR * 0.2, 0, cx, embY, embR)
  if (dark) {
    embG.addColorStop(0, '#1A2E4A')
    embG.addColorStop(0.6, '#101D30')
    embG.addColorStop(1, '#080F1E')
  } else {
    embG.addColorStop(0, '#EFF6FF')
    embG.addColorStop(0.6, '#DBEAFE')
    embG.addColorStop(1, '#BFDBFE')
  }
  ctx.beginPath()
  ctx.arc(cx, embY, embR, 0, Math.PI * 2)
  ctx.fillStyle = embG
  ctx.fill()

  const borderG = ctx.createLinearGradient(cx - embR, embY - embR, cx + embR, embY + embR)
  borderG.addColorStop(0, dark ? 'rgba(160,200,240,0.7)' : 'rgba(59,130,246,0.8)')
  borderG.addColorStop(0.25, col.primary)
  borderG.addColorStop(0.5, dark ? 'rgba(80,130,190,0.5)' : 'rgba(37,99,235,0.6)')
  borderG.addColorStop(0.75, col.secondary)
  borderG.addColorStop(1, dark ? 'rgba(160,200,240,0.6)' : 'rgba(59,130,246,0.7)')
  ctx.beginPath()
  ctx.arc(cx, embY, embR, 0, Math.PI * 2)
  ctx.strokeStyle = borderG
  ctx.lineWidth = r * 0.022
  ctx.stroke()
  ctx.restore()

  if (activityAmt > 0.02) {
    ctx.save()
    ctx.shadowColor = col.primary
    ctx.shadowBlur = r * 0.08
    const arcStart = -Math.PI * 0.8
    const arcEnd = arcStart + Math.PI * 1.6 * activityAmt
    ctx.beginPath()
    ctx.arc(cx, embY, embR * 0.78, arcStart, arcEnd)
    const arcG = ctx.createLinearGradient(cx - embR, embY, cx + embR, embY)
    arcG.addColorStop(0, col.primary)
    arcG.addColorStop(1, col.secondary)
    ctx.strokeStyle = arcG
    ctx.lineWidth = r * 0.018
    ctx.lineCap = 'round'
    ctx.stroke()
    ctx.restore()
  }

  ctx.save()
  const fontSize = embR * 0.82
  ctx.font = `700 ${fontSize}px "Rajdhani", "DM Sans", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (isActive) {
    ctx.shadowColor = col.primary
    ctx.shadowBlur = r * 0.12
  }
  const textG = ctx.createLinearGradient(cx, embY - embR * 0.4, cx, embY + embR * 0.4)
  if (dark) {
    textG.addColorStop(0, 'rgba(200,225,255,0.95)')
    textG.addColorStop(0.4, col.primary)
    textG.addColorStop(1, col.secondary)
  } else {
    textG.addColorStop(0, col.primary)
    textG.addColorStop(0.4, col.secondary)
    textG.addColorStop(1, '#1D4ED8')
  }
  ctx.fillStyle = textG
  ctx.fillText('A', cx, embY + fontSize * 0.03)
  ctx.restore()

  ctx.save()
  ctx.globalAlpha = isActive ? 0.9 : 0.5
  ctx.shadowColor = col.primary
  ctx.shadowBlur = r * 0.05
  ctx.beginPath()
  ctx.arc(cx, embY - embR * 0.52, r * 0.022, 0, Math.PI * 2)
  ctx.fillStyle = col.primary
  ctx.fill()
  ctx.restore()

  // Car silhouette
  const carY = cy + r * 0.72
  const cW = r * 0.62
  ctx.save()
  ctx.globalAlpha = isActive ? 0.22 : (dark ? 0.12 : 0.18)
  const carG = ctx.createLinearGradient(cx - cW, carY, cx + cW, carY)
  carG.addColorStop(0, 'transparent')
  carG.addColorStop(0.2, col.primary)
  carG.addColorStop(0.8, col.primary)
  carG.addColorStop(1, 'transparent')
  ctx.fillStyle = carG

  ctx.beginPath()
  ctx.moveTo(cx - cW * 0.52, carY)
  ctx.lineTo(cx - cW * 0.42, carY - r * 0.055)
  ctx.bezierCurveTo(cx - cW * 0.32, carY - r * 0.055, cx - cW * 0.24, carY - r * 0.12, cx - cW * 0.14, carY - r * 0.13)
  ctx.lineTo(cx + cW * 0.14, carY - r * 0.13)
  ctx.bezierCurveTo(cx + cW * 0.24, carY - r * 0.12, cx + cW * 0.32, carY - r * 0.055, cx + cW * 0.42, carY - r * 0.055)
  ctx.lineTo(cx + cW * 0.52, carY)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // Motion lines
  ctx.save()
  for (let i = 0; i < 3; i++) {
    const ly = carY + r * (0.04 + i * 0.055)
    if (ly > cy + r) break
    const lw = cW * (0.6 - i * 0.15)
    ctx.globalAlpha = (0.1 - i * 0.025) * (isActive ? 1.4 : 0.7)
    const lg = ctx.createLinearGradient(cx - lw, ly, cx + lw, ly)
    lg.addColorStop(0, 'transparent')
    lg.addColorStop(0.4, col.primary)
    lg.addColorStop(0.6, col.primary)
    lg.addColorStop(1, 'transparent')
    ctx.beginPath()
    ctx.moveTo(cx - lw, ly)
    ctx.lineTo(cx + lw, ly)
    ctx.strokeStyle = lg
    ctx.lineWidth = 0.7
    ctx.stroke()
  }
  ctx.restore()

  ctx.restore() // end clip

  // Outer metallic ring
  const outerG = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r)
  if (dark) {
    outerG.addColorStop(0, 'rgba(160,200,240,0.5)')
    outerG.addColorStop(0.2, `${col.primary}55`)
    outerG.addColorStop(0.5, 'rgba(60,100,160,0.2)')
    outerG.addColorStop(0.8, `${col.secondary}44`)
    outerG.addColorStop(1, 'rgba(160,200,240,0.45)')
  } else {
    outerG.addColorStop(0, 'rgba(59,130,246,0.6)')
    outerG.addColorStop(0.2, `${col.primary}88`)
    outerG.addColorStop(0.5, 'rgba(37,99,235,0.4)')
    outerG.addColorStop(0.8, `${col.secondary}66`)
    outerG.addColorStop(1, 'rgba(59,130,246,0.55)')
  }
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.strokeStyle = outerG
  ctx.lineWidth = r * 0.025
  if (isActive) {
    ctx.shadowColor = col.primary
    ctx.shadowBlur = r * 0.1
  }
  ctx.stroke()
}

export function SupraLeoAvatar({
  state = 'idle',
  size = 44,
  onClick,
  className = '',
  style,
  animate = true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pulseRef = useRef(0)
  const pulseDirRef = useRef(1)
  const activityRef = useRef(0)
  const rafRef = useRef<number>(0)
  const tRef = useRef(0)
  const darkRef = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : true
  )

  const render = useCallback(() => {
    if (!canvasRef.current) return
    drawLionFace(canvasRef.current, state, activityRef.current, pulseRef.current, darkRef.current)
  }, [state])

  // Listen for system colour scheme changes and re-render
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      darkRef.current = e.matches
      render()
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [render])

  useEffect(() => {
    if (!animate) { render(); return }
    const loop = () => {
      tRef.current += 0.016

      pulseRef.current += pulseDirRef.current * 0.025
      if (pulseRef.current >= 1) { pulseRef.current = 1; pulseDirRef.current = -1 }
      if (pulseRef.current <= 0) { pulseRef.current = 0; pulseDirRef.current = 1 }

      activityRef.current = state === 'speaking'
        ? (Math.sin(tRef.current * 9) * 0.4 + 0.6) * 0.85
        : state === 'thinking' || state === 'reading'
          ? (Math.sin(tRef.current * 3) * 0.3 + 0.5) * 0.5
          : Math.max(0, activityRef.current - 0.04)

      render()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [state, animate, render])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      onClick={onClick}
      className={className}
      style={{ display: 'block', cursor: onClick ? 'pointer' : 'default', ...style }}
    />
  )
}

export default SupraLeoAvatar