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

export function drawLionFace(
  canvas: HTMLCanvasElement,
  state: LeoState,
  jawAmt: number,
  blinkFrac: number,
  dark: boolean,
) {
  const ctx = canvas.getContext('2d')!
  const W = canvas.width, H = canvas.height
  const cx = W / 2, cy = H / 2
  const r = Math.min(W, H) * 0.46
  ctx.clearRect(0, 0, W, H)

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.clip()

  // Background — deep warm dark always (lion lives in a dark context regardless of UI mode)
  const bgG = ctx.createRadialGradient(cx, cy * 0.7, 0, cx, cy, r)
  bgG.addColorStop(0, '#231a09')
  bgG.addColorStop(1, '#0e0900')
  ctx.fillStyle = bgG
  ctx.fillRect(0, 0, W, H)

  // Mane
  const MC = 30
  for (let i = 0; i < MC; i++) {
    const ang = (i / MC) * Math.PI * 2 - Math.PI / 2
    const iR = r * 0.51
    const oR = r * (0.87 + Math.sin(i * 1.9 + 0.5) * 0.065)
    const sp = 0.14 + (i % 5) * 0.012
    const x1 = cx + Math.cos(ang - sp) * iR, y1 = cy + Math.sin(ang - sp) * iR
    const x2 = cx + Math.cos(ang + sp) * iR, y2 = cy + Math.sin(ang + sp) * iR
    const xT = cx + Math.cos(ang) * oR, yT = cy + Math.sin(ang) * oR
    const mx = cx + Math.cos(ang) * (iR + (oR - iR) * 0.48) + Math.cos(ang + Math.PI / 2) * r * 0.035 * (i % 2 ? 1 : -1)
    const my = cy + Math.sin(ang) * (iR + (oR - iR) * 0.48) + Math.sin(ang + Math.PI / 2) * r * 0.035 * (i % 2 ? 1 : -1)
    const bot = Math.sin(ang) > 0.15
    const g = ctx.createLinearGradient(cx, cy, xT, yT)
    if (bot) {
      g.addColorStop(0, 'rgba(0,0,0,0)')
      g.addColorStop(0.15, 'rgba(98,60,12,0.95)')
      g.addColorStop(0.65, 'rgba(68,36,6,0.92)')
      g.addColorStop(1, 'rgba(38,18,2,0.97)')
    } else {
      g.addColorStop(0, 'rgba(0,0,0,0)')
      g.addColorStop(0.15, 'rgba(28,38,54,0.95)')
      g.addColorStop(0.65, 'rgba(16,24,36,0.92)')
      g.addColorStop(1, 'rgba(7,11,18,0.97)')
    }
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.quadraticCurveTo(mx, my, xT, yT)
    ctx.quadraticCurveTo(mx, my, x2, y2)
    ctx.closePath()
    ctx.fillStyle = g
    ctx.fill()
  }

  // Face
  const fR = r * 0.5
  const fG = ctx.createRadialGradient(cx, cy * 0.88, 0, cx, cy * 0.96, fR * 1.2)
  fG.addColorStop(0, '#d09448')
  fG.addColorStop(0.28, '#aa7028')
  fG.addColorStop(0.62, '#7e4a12')
  fG.addColorStop(1, '#4a2406')
  ctx.beginPath()
  ctx.ellipse(cx, cy * 0.94, fR, fR * 1.07, 0, 0, Math.PI * 2)
  ctx.fillStyle = fG
  ctx.fill()

  // Forehead shadow
  const fsh = ctx.createRadialGradient(cx, cy * 0.57, 0, cx, cy * 0.66, fR * 0.66)
  fsh.addColorStop(0, 'rgba(20,9,1,0.7)')
  fsh.addColorStop(1, 'rgba(20,9,1,0)')
  ctx.beginPath()
  ctx.ellipse(cx, cy * 0.67, fR * 0.5, fR * 0.43, 0, 0, Math.PI * 2)
  ctx.fillStyle = fsh
  ctx.fill()

  // Serious brows — inner ends angled DOWN toward nose
  ctx.save()
  ctx.lineCap = 'round'
  ctx.strokeStyle = 'rgba(22,9,1,0.65)'
  ctx.lineWidth = r * 0.035
  ctx.beginPath()
  ctx.moveTo(cx - fR * 0.46, cy * 0.748)
  ctx.quadraticCurveTo(cx - fR * 0.21, cy * 0.672, cx - fR * 0.045, cy * 0.708)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx + fR * 0.46, cy * 0.748)
  ctx.quadraticCurveTo(cx + fR * 0.21, cy * 0.672, cx + fR * 0.045, cy * 0.708)
  ctx.stroke()
  // Centre furrow crease
  ctx.strokeStyle = 'rgba(22,9,1,0.35)'
  ctx.lineWidth = r * 0.015
  ctx.beginPath()
  ctx.moveTo(cx - fR * 0.045, cy * 0.708)
  ctx.quadraticCurveTo(cx, cy * 0.698, cx + fR * 0.045, cy * 0.708)
  ctx.stroke()
  ctx.restore()

  // ── NATURAL LION EYES ──
  // Lions: almond-shaped, golden amber iris, ROUND pupil (not slit)
  const eY = cy * 0.816
  const eOx = fR * 0.305
  const eRx = fR * 0.175
  const eRyFull = eRx * 0.62
  const eRy = Math.max(eRx * 0.04, eRyFull * blinkFrac)

  const drawEye = (ex: number) => {
    // Socket shadow
    ctx.beginPath()
    ctx.ellipse(ex, eY + r * 0.018, eRx * 1.14, eRy * 1.28 + r * 0.016, 0, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(8,3,0,0.58)'
    ctx.fill()

    // Sclera — warm off-white (lion eyes aren't bright white)
    ctx.beginPath()
    ctx.ellipse(ex, eY, eRx, eRy, 0, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(240,214,168,0.88)'
    ctx.fill()

    if (blinkFrac > 0.1) {
      // Iris — natural golden amber
      const iG = ctx.createRadialGradient(ex - eRx * 0.1, eY - eRy * 0.16, 0, ex, eY, eRx * 0.82)
      if (state === 'listening') {
        // Amber-green shift
        iG.addColorStop(0, '#c8d848')
        iG.addColorStop(0.2, '#96b020')
        iG.addColorStop(0.52, '#5e7610')
        iG.addColorStop(0.84, '#304006')
        iG.addColorStop(1, '#182000')
      } else if (state === 'error') {
        iG.addColorStop(0, '#d87840')
        iG.addColorStop(0.3, '#ac4c1c')
        iG.addColorStop(0.68, '#782808')
        iG.addColorStop(1, '#3a1000')
      } else {
        // Natural lion gold — most authentic
        iG.addColorStop(0, '#f2ca50')
        iG.addColorStop(0.16, '#d89a10')
        iG.addColorStop(0.44, '#aa6a08')
        iG.addColorStop(0.76, '#703e04')
        iG.addColorStop(1, '#341a00')
      }
      ctx.beginPath()
      ctx.ellipse(ex, eY, eRx * 0.8, eRy * 0.88, 0, 0, Math.PI * 2)
      ctx.fillStyle = iG
      ctx.fill()

      // Iris radial texture (fine lines from pupil to limbal ring)
      ctx.save()
      ctx.globalAlpha = 0.1
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2
        ctx.beginPath()
        ctx.moveTo(ex + Math.cos(a) * eRx * 0.08, eY + Math.sin(a) * eRy * 0.08)
        ctx.lineTo(ex + Math.cos(a) * eRx * 0.76, eY + Math.sin(a) * eRy * 0.82)
        ctx.strokeStyle = '#200a00'
        ctx.lineWidth = 0.6
        ctx.stroke()
      }
      ctx.restore()

      // State active glow (very subtle)
      if (state !== 'idle') {
        const rc =
          state === 'listening' ? 'rgba(120,170,30,0.22)' :
          state === 'error' ? 'rgba(170,50,20,0.22)' :
          'rgba(190,135,18,0.18)'
        ctx.beginPath()
        ctx.ellipse(ex, eY, eRx * 0.82, eRy * 0.9, 0, 0, Math.PI * 2)
        ctx.strokeStyle = rc
        ctx.lineWidth = r * 0.016
        ctx.stroke()
      }

      // ROUND pupil (lions don't have slit pupils — that's domestic cats)
      const pR = eRx * 0.26
      const pG = ctx.createRadialGradient(ex, eY - eRy * 0.04, 0, ex, eY, pR)
      pG.addColorStop(0, '#180600')
      pG.addColorStop(0.7, '#0a0300')
      pG.addColorStop(1, '#050100')
      ctx.beginPath()
      ctx.arc(ex, eY, pR, 0, Math.PI * 2)
      ctx.fillStyle = pG
      ctx.fill()

      // Primary catchlight — 1 o'clock position
      ctx.beginPath()
      ctx.ellipse(ex + eRx * 0.2, eY - eRy * 0.3, eRx * 0.13, eRy * 0.15, -0.3, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.fill()

      // Secondary small catchlight — 7 o'clock
      ctx.beginPath()
      ctx.arc(ex - eRx * 0.14, eY + eRy * 0.28, eRx * 0.055, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.26)'
      ctx.fill()

      // Limbal ring (dark circle at iris edge — depth and realism)
      ctx.beginPath()
      ctx.ellipse(ex, eY, eRx * 0.8, eRy * 0.88, 0, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(8,3,0,0.52)'
      ctx.lineWidth = r * 0.02
      ctx.stroke()
    }

    // Upper eyelid — almond shape (peaks slightly toward nose side)
    ctx.beginPath()
    ctx.moveTo(ex - eRx, eY + eRy * 0.05)
    ctx.bezierCurveTo(ex - eRx * 0.4, eY - eRy * 1.5, ex + eRx * 0.2, eY - eRy * 1.42, ex + eRx, eY + eRy * 0.05)
    ctx.strokeStyle = 'rgba(16,5,0,0.68)'
    ctx.lineWidth = r * 0.024
    ctx.lineCap = 'round'
    ctx.stroke()

    // Lower eyelid
    ctx.beginPath()
    ctx.moveTo(ex - eRx, eY + eRy * 0.05)
    ctx.quadraticCurveTo(ex, eY + eRy * 0.52, ex + eRx, eY + eRy * 0.05)
    ctx.strokeStyle = 'rgba(16,5,0,0.32)'
    ctx.lineWidth = r * 0.013
    ctx.stroke()

    // Tear duct (inner corner pinkish)
    ctx.beginPath()
    ctx.arc(ex - eRx * 0.96, eY + eRy * 0.05, r * 0.015, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(192,148,86,0.48)'
    ctx.fill()
  }

  drawEye(cx - eOx)
  drawEye(cx + eOx)

  // Cheek / muzzle pale zone
  const mzG = ctx.createRadialGradient(cx, cy * 1.06, 0, cx, cy * 1.08, fR * 0.44)
  mzG.addColorStop(0, 'rgba(232,200,150,0.86)')
  mzG.addColorStop(0.45, 'rgba(198,162,108,0.5)')
  mzG.addColorStop(1, 'rgba(168,126,72,0)')
  ctx.beginPath()
  ctx.ellipse(cx, cy * 1.06, fR * 0.4, fR * 0.32, 0, 0, Math.PI * 2)
  ctx.fillStyle = mzG
  ctx.fill()

  // Nose
  const nY = cy * 0.988
  const nG = ctx.createRadialGradient(cx, nY - r * 0.013, 0, cx, nY, r * 0.07)
  nG.addColorStop(0, '#1c0902')
  nG.addColorStop(0.55, '#0e0400')
  nG.addColorStop(1, '#050100')
  ctx.beginPath()
  ctx.moveTo(cx, nY + r * 0.04)
  ctx.bezierCurveTo(cx - r * 0.076, nY + r * 0.012, cx - r * 0.08, nY - r * 0.032, cx - r * 0.032, nY - r * 0.042)
  ctx.quadraticCurveTo(cx, nY - r * 0.014, cx, nY - r * 0.008)
  ctx.quadraticCurveTo(cx, nY - r * 0.014, cx + r * 0.032, nY - r * 0.042)
  ctx.bezierCurveTo(cx + r * 0.08, nY - r * 0.032, cx + r * 0.076, nY + r * 0.012, cx, nY + r * 0.04)
  ctx.fillStyle = nG
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(cx - r * 0.013, nY - r * 0.01, r * 0.015, r * 0.009, -0.3, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.13)'
  ctx.fill()

  // Mouth — stern, set jaw
  const j = jawAmt
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx, nY + r * 0.04)
  ctx.lineTo(cx, nY + r * 0.062 + j * r * 0.018)
  ctx.strokeStyle = 'rgba(12,4,0,0.62)'
  ctx.lineWidth = r * 0.017
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx - r * 0.106, nY + r * 0.067 + j * r * 0.012)
  ctx.quadraticCurveTo(cx - r * 0.046, nY + r * 0.083 + j * r * 0.046, cx, nY + r * 0.067 + j * r * 0.022)
  ctx.quadraticCurveTo(cx + r * 0.046, nY + r * 0.083 + j * r * 0.046, cx + r * 0.106, nY + r * 0.067 + j * r * 0.012)
  ctx.strokeStyle = 'rgba(12,4,0,0.52)'
  ctx.lineWidth = r * 0.02
  ctx.stroke()

  // Whisker spots
  ;([
    [-0.24, 0.97], [-0.19, 1.03], [-0.14, 1.07],
    [0.24, 0.97], [0.19, 1.03], [0.14, 1.07],
  ] as [number, number][]).forEach(([dx, dy]) => {
    ctx.beginPath()
    ctx.arc(cx + fR * dx, cy * dy, r * 0.016, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(236,220,188,0.5)'
    ctx.fill()
  })

  // Whiskers
  ctx.save()
  ;([
    [cx - fR * 0.08, cy * 1.01, cx - r * 0.64, cy * 0.955, 0.5],
    [cx - fR * 0.08, cy * 1.05, cx - r * 0.66, cy * 1.038, 0.44],
    [cx - fR * 0.08, cy * 1.085, cx - r * 0.63, cy * 1.114, 0.36],
    [cx + fR * 0.08, cy * 1.01, cx + r * 0.64, cy * 0.955, 0.5],
    [cx + fR * 0.08, cy * 1.05, cx + r * 0.66, cy * 1.038, 0.44],
    [cx + fR * 0.08, cy * 1.085, cx + r * 0.63, cy * 1.114, 0.36],
  ] as [number, number, number, number, number][]).forEach(([x1, y1, x2, y2, op]) => {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.strokeStyle = `rgba(236,226,202,${op})`
    ctx.lineWidth = r * 0.011
    ctx.lineCap = 'round'
    ctx.stroke()
  })
  ctx.restore()

  // State ring
  if (state !== 'idle') {
    ctx.beginPath()
    ctx.arc(cx, cy, r - 0.5, 0, Math.PI * 2)
    ctx.strokeStyle =
      state === 'listening' ? 'rgba(70,158,80,0.4)' :
      state === 'error' ? 'rgba(175,52,30,0.4)' :
      'rgba(180,138,44,0.5)'
    ctx.lineWidth = 1.2
    ctx.stroke()
  }

  ctx.restore()

  // Outer border
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(180,136,44,0.2)'
  ctx.lineWidth = 0.8
  ctx.stroke()
}

export function SupraLeoAvatar({ state = 'idle', size = 44, onClick, className = '', style, animate = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const blinkRef = useRef(1)
  const blinkDirRef = useRef(-1)
  const jawRef = useRef(0)
  const rafRef = useRef<number>(0)
const blinkTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const tRef = useRef(0)

  const render = useCallback(() => {
    if (!canvasRef.current) return
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
    drawLionFace(canvasRef.current, state, jawRef.current, blinkRef.current, dark)
  }, [state])

  useEffect(() => {
    const sched = () => {
      blinkTimer.current = setTimeout(() => {
        blinkDirRef.current = -1
        setTimeout(() => { blinkDirRef.current = 1; sched() }, 135)
      }, 2600 + Math.random() * 3800)
    }
    sched()
    return () => { if (blinkTimer.current) clearTimeout(blinkTimer.current) }
  }, [])

  useEffect(() => {
    if (!animate) { render(); return }
    const loop = () => {
      tRef.current += 0.016
      blinkRef.current = Math.max(0.04, Math.min(1, blinkRef.current + blinkDirRef.current * 0.22))
      jawRef.current = state === 'speaking'
        ? (Math.sin(tRef.current * 8.5) * 0.5 + 0.5) * 0.72
        : Math.max(0, jawRef.current - 0.07)
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