'use client'

import * as React from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Global CSS ────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=Outfit:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400&display=swap');

  :root {
    --sl-bg:       #0a0908;
    --sl-bg2:      #100e0c;
    --sl-bg3:      #161210;
    --sl-gold:     #c9923a;
    --sl-gold-lt:  #e4b96a;
    --sl-gold-dim: rgba(201,146,58,0.12);
    --sl-gold-ln:  rgba(201,146,58,0.2);
    --sl-warm:     rgba(255,247,235,0.88);
    --sl-warm2:    rgba(255,247,235,0.5);
    --sl-warm3:    rgba(255,247,235,0.22);
    --sl-warm4:    rgba(255,247,235,0.06);
    --sl-green:    #3ec87a;
    --sl-red:      #d9534f;
    --sl-blue:     #5ba4cf;
    --sl-border:   rgba(201,146,58,0.14);
    --sl-border2:  rgba(255,247,235,0.06);
    --sl-radius:   16px;
    --sl-radius-sm: 8px;
  }

  @keyframes sl-breathe   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.012)} }
  @keyframes sl-float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
  @keyframes sl-spin      { to{transform:rotate(360deg)} }
  @keyframes sl-dot       { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.35;transform:scale(0.75)} }
  @keyframes sl-ring      { 0%{transform:scale(0.88);opacity:0.5} 100%{transform:scale(2.1);opacity:0} }
  @keyframes sl-wave      { 0%,100%{transform:scaleY(0.12)} 50%{transform:scaleY(1)} }
  @keyframes sl-panel-in  { from{opacity:0;transform:translateY(12px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes sl-msg-in    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sl-cursor    { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes sl-tab-pill  { from{opacity:0;transform:scaleX(0.7)} to{opacity:1;transform:scaleX(1)} }
  @keyframes sl-shimmer   { 0%{background-position:200% center} 100%{background-position:-200% center} }
  @keyframes sl-fade-in   { from{opacity:0} to{opacity:1} }

  .sl-display { font-family: 'Cormorant Garamond', serif; }
  .sl-ui      { font-family: 'Outfit', sans-serif; }
  .sl-mono    { font-family: 'JetBrains Mono', monospace; }

  .sl-glass {
    background: rgba(10,9,8,0.97);
    backdrop-filter: blur(32px) saturate(1.6);
    -webkit-backdrop-filter: blur(32px) saturate(1.6);
  }

  .sl-panel-anim { animation: sl-panel-in 0.32s cubic-bezier(0.16,1,0.3,1) forwards; }
  .sl-breathe    { animation: sl-breathe 4.5s ease-in-out infinite; }
  .sl-float      { animation: sl-float 5.5s ease-in-out infinite; }
  .sl-msg-in     { animation: sl-msg-in 0.24s cubic-bezier(0.16,1,0.3,1) forwards; }
  .sl-cursor     { animation: sl-cursor 0.9s step-end infinite; display:inline-block; width:1.5px; height:0.85em; background:var(--sl-gold); margin-left:2px; vertical-align:text-bottom; border-radius:1px; }
  .sl-wavebar    { animation: sl-wave 0.5s ease-in-out infinite; }

  .sl-chat-scroll::-webkit-scrollbar       { width:2px; }
  .sl-chat-scroll::-webkit-scrollbar-track { background:transparent; }
  .sl-chat-scroll::-webkit-scrollbar-thumb { background:rgba(201,146,58,0.18); border-radius:2px; }

  /* ── Tab system ── */
  .sl-tabs-container {
    position: relative;
    display: flex;
    align-items: center;
    gap: 2px;
    background: rgba(255,247,235,0.04);
    border: 1px solid rgba(201,146,58,0.12);
    border-radius: 10px;
    padding: 3px;
  }
  .sl-tab-btn {
    position: relative; z-index: 1;
    flex: 1; height: 28px;
    border: none; cursor: pointer;
    border-radius: 7px;
    font-family: 'Outfit', sans-serif;
    font-size: 11px; font-weight: 500;
    letter-spacing: 0.04em;
    transition: color 0.2s ease;
    background: transparent;
    display: flex; align-items: center; justify-content: center; gap: 5px;
  }
  .sl-tab-btn.active  { color: #0a0908; }
  .sl-tab-btn:not(.active) { color: rgba(255,247,235,0.3); }
  .sl-tab-btn:not(.active):hover { color: rgba(255,247,235,0.6); }
  .sl-tab-pill {
    position: absolute;
    height: calc(100% - 6px);
    border-radius: 7px;
    background: linear-gradient(135deg, #c9923a, #e4b96a);
    box-shadow: 0 2px 8px rgba(201,146,58,0.35);
    transition: left 0.22s cubic-bezier(0.4,0,0.2,1), width 0.22s cubic-bezier(0.4,0,0.2,1);
    top: 3px;
    pointer-events: none;
  }

  .sl-input-wrap {
    display: flex; gap: 8px; align-items: flex-end;
    background: rgba(255,247,235,0.03);
    border: 1px solid rgba(201,146,58,0.16);
    border-radius: 12px;
    padding: 10px 10px 10px 14px;
    transition: border-color 0.2s;
  }
  .sl-input-wrap:focus-within {
    border-color: rgba(201,146,58,0.4);
    background: rgba(201,146,58,0.03);
  }

  .sl-send-btn {
    width: 32px; height: 32px; border-radius: 9px;
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; flex-shrink: 0;
    transition: all 0.2s;
  }
  .sl-send-btn.ready {
    background: linear-gradient(135deg,#a06820,#c9923a);
    color: #0a0908;
    box-shadow: 0 0 16px rgba(201,146,58,0.32);
  }
  .sl-send-btn.empty {
    background: rgba(201,146,58,0.06);
    color: rgba(201,146,58,0.25);
  }

  .sl-action-btn {
    display: inline-flex; align-items: center; gap: 5px;
    height: 30px; padding: 0 13px; border-radius: 8px;
    border: 1px solid rgba(201,146,58,0.16);
    background: rgba(201,146,58,0.04);
    color: rgba(201,146,58,0.55);
    font-family: 'Outfit', sans-serif;
    font-size: 11px; font-weight: 500;
    cursor: pointer; transition: all 0.18s;
  }
  .sl-action-btn:hover {
    border-color: rgba(201,146,58,0.4);
    background: rgba(201,146,58,0.1);
    color: #e4b96a;
  }
  .sl-action-btn.danger {
    border-color: rgba(217,83,79,0.16);
    background: rgba(217,83,79,0.04);
    color: rgba(217,83,79,0.5);
  }
  .sl-action-btn.danger:hover {
    border-color: rgba(217,83,79,0.4);
    background: rgba(217,83,79,0.1);
    color: #e07070;
  }

  .sl-section-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8.5px; font-weight: 400;
    letter-spacing: 0.22em;
    color: rgba(201,146,58,0.38);
    text-transform: uppercase;
  }

  .sl-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(201,146,58,0.14), transparent);
  }
`

function injectCSS() {
  if (typeof document === 'undefined') return
  if (document.getElementById('sl-v6')) return
  const el = document.createElement('style')
  el.id = 'sl-v6'
  el.textContent = GLOBAL_CSS
  document.head.appendChild(el)
}

// ─── Types ─────────────────────────────────────────────────────────────────────
export type LeoState = 'idle' | 'listening' | 'speaking' | 'thinking' | 'reading' | 'error'
type PanelTab = 'assistant' | 'chat'

interface ChatMessage {
  id: string
  role: 'user' | 'leo'
  text: string
  ts: number
  streaming?: boolean
}

// ─── Canvas Lion Renderer (unchanged logic) ────────────────────────────────────
function drawLion(canvas: HTMLCanvasElement, state: LeoState, blink: boolean, jawAmt = 0) {
  const ctx = canvas.getContext('2d')!
  const W = canvas.width, H = canvas.height
  const cx = W / 2, cy = H / 2
  const sc = W / 200
  ctx.clearRect(0, 0, W, H)

  const isActive = state !== 'idle'
  const eyeCol = state === 'listening' ? '#3ec87a' : state === 'error' ? '#d9534f' : '#c9923a'

  const bg = ctx.createRadialGradient(cx, cy * 0.8, 0, cx, cy, W * 0.5)
  bg.addColorStop(0, '#1c1510'); bg.addColorStop(0.6, '#100c08'); bg.addColorStop(1, '#080503')
  ctx.beginPath(); ctx.arc(cx, cy, W * 0.5, 0, Math.PI * 2)
  ctx.fillStyle = bg; ctx.fill()

  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2 - Math.PI / 2
    const r1 = W * 0.28, r2 = W * 0.48 * (0.84 + Math.sin(i * 2.1) * 0.1)
    const tw = 0.15 + (i % 3) * 0.022
    const x1 = cx + Math.cos(a - tw) * r1, y1 = cy + Math.sin(a - tw) * r1
    const x2 = cx + Math.cos(a + tw) * r1, y2 = cy + Math.sin(a + tw) * r1
    const xt = cx + Math.cos(a) * r2, yt = cy + Math.sin(a) * r2
    const mx = cx + Math.cos(a) * (r1 + (r2 - r1) * 0.45) + Math.cos(a + Math.PI / 2) * W * 0.02 * (i % 2 ? 1 : -1)
    const my = cy + Math.sin(a) * (r1 + (r2 - r1) * 0.45) + Math.sin(a + Math.PI / 2) * W * 0.02 * (i % 2 ? 1 : -1)
    const g = ctx.createLinearGradient(cx, cy, xt, yt)
    const bot = Math.sin(a + Math.PI * 0.5)
    if (bot > 0.2) {
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.3, 'rgba(75,45,12,0.9)'); g.addColorStop(1, 'rgba(45,26,6,0.95)')
    } else {
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.3, 'rgba(42,52,68,0.92)'); g.addColorStop(1, 'rgba(22,30,42,0.96)')
    }
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, xt, yt); ctx.quadraticCurveTo(mx, my, x2, y2); ctx.closePath()
    ctx.fillStyle = g; ctx.fill()
  }

  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 - Math.PI / 2 + 0.13
    const r1 = W * 0.235, r2 = W * 0.4 * (0.8 + Math.sin(i * 1.8 + 1) * 0.12)
    const tw = 0.17 + (i % 3) * 0.026
    const x1 = cx + Math.cos(a - tw) * r1, y1 = cy + Math.sin(a - tw) * r1
    const x2 = cx + Math.cos(a + tw) * r1, y2 = cy + Math.sin(a + tw) * r1
    const xt = cx + Math.cos(a) * r2, yt = cy + Math.sin(a) * r2
    const mx = cx + Math.cos(a) * (r1 + (r2 - r1) * 0.42) + Math.cos(a + Math.PI / 2) * W * 0.018 * (i % 2 ? 1 : -1)
    const my = cy + Math.sin(a) * (r1 + (r2 - r1) * 0.42) + Math.sin(a + Math.PI / 2) * W * 0.018 * (i % 2 ? 1 : -1)
    const g = ctx.createLinearGradient(cx, cy, xt, yt)
    const v = i % 3
    if (v === 0) { g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.25, 'rgba(185,92,18,0.88)'); g.addColorStop(1, 'rgba(120,55,6,0.9)') }
    else if (v === 1) { g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.25, 'rgba(205,112,22,0.85)'); g.addColorStop(1, 'rgba(140,70,8,0.88)') }
    else { g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.25, 'rgba(165,78,14,0.85)'); g.addColorStop(1, 'rgba(105,48,5,0.9)') }
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, xt, yt); ctx.quadraticCurveTo(mx, my, x2, y2); ctx.closePath()
    ctx.fillStyle = g; ctx.fill()
    ctx.beginPath(); ctx.moveTo((x1 + x2) / 2, (y1 + y2) / 2); ctx.quadraticCurveTo(mx, my, xt, yt)
    ctx.strokeStyle = `rgba(220,140,40,${0.07 + v * 0.03})`; ctx.lineWidth = sc * 0.6; ctx.stroke()
  }

  const fR = W * 0.232
  const fg = ctx.createRadialGradient(cx, cy * 0.88, 0, cx, cy * 0.92, fR * 1.1)
  fg.addColorStop(0, '#c07c42'); fg.addColorStop(0.4, '#9a5e28'); fg.addColorStop(0.75, '#7a4018'); fg.addColorStop(1, '#4e2208')
  ctx.beginPath(); ctx.ellipse(cx, cy * 0.94, fR, fR * 1.05, 0, 0, Math.PI * 2); ctx.fillStyle = fg; ctx.fill()

  const fd = ctx.createRadialGradient(cx, cy * 0.62, 0, cx, cy * 0.7, fR * 0.7)
  fd.addColorStop(0, 'rgba(38,20,6,0.65)'); fd.addColorStop(1, 'rgba(50,28,8,0)')
  ctx.beginPath(); ctx.ellipse(cx, cy * 0.72, fR * 0.5, fR * 0.44, 0, 0, Math.PI * 2); ctx.fillStyle = fd; ctx.fill()

  ctx.beginPath(); ctx.moveTo(cx - W * 0.18, cy * 0.72); ctx.quadraticCurveTo(cx - W * 0.1, cy * 0.655, cx - W * 0.028, cy * 0.688)
  ctx.strokeStyle = 'rgba(32,14,4,0.6)'; ctx.lineWidth = sc * 6; ctx.lineCap = 'round'; ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx + W * 0.18, cy * 0.72); ctx.quadraticCurveTo(cx + W * 0.1, cy * 0.655, cx + W * 0.028, cy * 0.688); ctx.stroke()

  const ckL = ctx.createRadialGradient(cx - fR * 0.5, cy, 0, cx - fR * 0.5, cy, fR * 0.5)
  ckL.addColorStop(0, 'rgba(200,155,85,0.2)'); ckL.addColorStop(1, 'rgba(200,155,85,0)')
  ctx.beginPath(); ctx.ellipse(cx - fR * 0.5, cy, fR * 0.38, fR * 0.3, -0.2, 0, Math.PI * 2); ctx.fillStyle = ckL; ctx.fill()
  const ckR = ctx.createRadialGradient(cx + fR * 0.5, cy, 0, cx + fR * 0.5, cy, fR * 0.5)
  ckR.addColorStop(0, 'rgba(200,155,85,0.2)'); ckR.addColorStop(1, 'rgba(200,155,85,0)')
  ctx.beginPath(); ctx.ellipse(cx + fR * 0.5, cy, fR * 0.38, fR * 0.3, 0.2, 0, Math.PI * 2); ctx.fillStyle = ckR; ctx.fill()

  const eY = cy * 0.82, eOx = W * 0.108
  const eRx = W * 0.066, eRy = blink ? W * 0.006 : W * 0.051

  const drawEye = (ex: number, ey: number) => {
    ctx.beginPath(); ctx.ellipse(ex, ey + sc * 2, eRx * 1.15, eRy * 1.3 + sc * 2, 0, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(15,6,1,0.6)'; ctx.fill()
    ctx.beginPath(); ctx.ellipse(ex, ey, eRx * 1.02, eRy, 0, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(235,215,175,0.85)'; ctx.fill()
    if (!blink) {
      const ig = ctx.createRadialGradient(ex - eRx * 0.2, ey - eRy * 0.22, 0, ex, ey, eRx * 0.88)
      ig.addColorStop(0, '#f0cc50'); ig.addColorStop(0.22, '#e0980e'); ig.addColorStop(0.55, '#b06005'); ig.addColorStop(0.88, '#6e3200'); ig.addColorStop(1, '#2e1200')
      ctx.beginPath(); ctx.ellipse(ex, ey, eRx * 0.86, eRy * 0.9, 0, 0, Math.PI * 2); ctx.fillStyle = ig; ctx.fill()
      if (isActive) {
        ctx.beginPath(); ctx.ellipse(ex, ey, eRx * 0.88, eRy * 0.92, 0, 0, Math.PI * 2)
        ctx.strokeStyle = eyeCol; ctx.lineWidth = sc * 0.8; ctx.globalAlpha = 0.4; ctx.stroke(); ctx.globalAlpha = 1
      }
      const pg = ctx.createRadialGradient(ex, ey, 0, ex, ey, eRx * 0.3)
      pg.addColorStop(0, '#140600'); pg.addColorStop(1, '#060200')
      ctx.beginPath(); ctx.ellipse(ex, ey, eRx * 0.32, eRy * 0.65, 0, 0, Math.PI * 2); ctx.fillStyle = pg; ctx.fill()
      ctx.beginPath(); ctx.ellipse(ex + eRx * 0.25, ey - eRy * 0.28, eRx * 0.16, eRy * 0.18, -0.4, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill()
      ctx.beginPath(); ctx.arc(ex - eRx * 0.18, ey + eRy * 0.28, eRx * 0.065, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill()
    }
    ctx.beginPath(); ctx.moveTo(ex - eRx, ey); ctx.quadraticCurveTo(ex, ey - eRy * 1.3, ex + eRx, ey)
    ctx.strokeStyle = 'rgba(25,10,2,0.55)'; ctx.lineWidth = sc * 1.4; ctx.stroke()
  }
  drawEye(cx - eOx, eY); drawEye(cx + eOx, eY)

  const mz = ctx.createRadialGradient(cx, cy * 1.08, 0, cx, cy * 1.08, W * 0.18)
  mz.addColorStop(0, 'rgba(215,185,135,0.85)'); mz.addColorStop(0.5, 'rgba(185,150,98,0.5)'); mz.addColorStop(1, 'rgba(160,118,68,0)')
  ctx.beginPath(); ctx.ellipse(cx, cy * 1.08, W * 0.165, W * 0.13, 0, 0, Math.PI * 2); ctx.fillStyle = mz; ctx.fill()

  const nY = cy * 0.982
  const ng = ctx.createRadialGradient(cx, nY - W * 0.016, 0, cx, nY, W * 0.062)
  ng.addColorStop(0, '#2e1808'); ng.addColorStop(0.6, '#160a03'); ng.addColorStop(1, '#080301')
  ctx.beginPath()
  ctx.moveTo(cx, nY + W * 0.032)
  ctx.bezierCurveTo(cx - W * 0.06, nY + W * 0.01, cx - W * 0.065, nY - W * 0.028, cx - W * 0.028, nY - W * 0.035)
  ctx.quadraticCurveTo(cx, nY - W * 0.015, cx, nY - W * 0.008)
  ctx.quadraticCurveTo(cx, nY - W * 0.015, cx + W * 0.028, nY - W * 0.035)
  ctx.bezierCurveTo(cx + W * 0.065, nY - W * 0.028, cx + W * 0.06, nY + W * 0.01, cx, nY + W * 0.032)
  ctx.fillStyle = ng; ctx.fill()

  const j = jawAmt
  ctx.beginPath(); ctx.moveTo(cx, nY + W * 0.032); ctx.lineTo(cx, nY + W * 0.05 + j * W * 0.018)
  ctx.strokeStyle = 'rgba(18,7,1,0.65)'; ctx.lineWidth = sc * 1.6; ctx.lineCap = 'round'; ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx - W * 0.084, nY + W * 0.052 + j * W * 0.01)
  ctx.quadraticCurveTo(cx - W * 0.038, nY + W * 0.068 + j * W * 0.044, cx, nY + W * 0.052 + j * W * 0.018)
  ctx.quadraticCurveTo(cx + W * 0.038, nY + W * 0.068 + j * W * 0.044, cx + W * 0.084, nY + W * 0.052 + j * W * 0.01)
  ctx.strokeStyle = 'rgba(18,7,1,0.6)'; ctx.lineWidth = sc * 1.8; ctx.stroke()

  const ch = ctx.createRadialGradient(cx, cy * 1.2, 0, cx, cy * 1.2, W * 0.09)
  ch.addColorStop(0, 'rgba(235,230,210,0.5)'); ch.addColorStop(1, 'rgba(235,230,210,0)')
  ctx.beginPath(); ctx.ellipse(cx, cy * 1.2, W * 0.09, W * 0.075, 0, 0, Math.PI * 2); ctx.fillStyle = ch; ctx.fill()

  ctx.save()
  ;([
    [cx - W * 0.06, cy * 1.04, cx - W * 0.44, cy * 0.975, 0.65],
    [cx - W * 0.06, cy * 1.08, cx - W * 0.45, cy * 1.068, 0.58],
    [cx - W * 0.06, cy * 1.11, cx - W * 0.43, cy * 1.155, 0.5],
    [cx + W * 0.06, cy * 1.04, cx + W * 0.44, cy * 0.975, 0.65],
    [cx + W * 0.06, cy * 1.08, cx + W * 0.45, cy * 1.068, 0.58],
    [cx + W * 0.06, cy * 1.11, cx + W * 0.43, cy * 1.155, 0.5],
  ] as [number,number,number,number,number][]).forEach(([x1,y1,x2,y2,op]) => {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2)
    ctx.strokeStyle = `rgba(235,228,208,${op})`; ctx.lineWidth = sc * 0.85; ctx.stroke()
  })
  ctx.restore()

  if (isActive) {
    ctx.save(); ctx.globalAlpha = 0.45
    ctx.beginPath(); ctx.arc(cx, cy, W * 0.495, 0, Math.PI * 2)
    if (state === 'listening') { ctx.strokeStyle = '#3ec87a'; ctx.lineWidth = sc * 1.5; ctx.setLineDash([5,3]) }
    else if (state === 'error') { ctx.strokeStyle = '#d9534f'; ctx.lineWidth = sc * 2; ctx.setLineDash([4,3]) }
    else { ctx.strokeStyle = '#c9923a'; ctx.lineWidth = sc * 1.5; ctx.setLineDash([8,5]) }
    ctx.stroke(); ctx.setLineDash([])
    ctx.strokeStyle = state === 'listening' ? '#3ec87a' : state === 'error' ? '#d9534f' : '#c9923a'
    ctx.lineWidth = sc * 1.4; ctx.globalAlpha = 0.5
    const co = sc * 3.5
    ctx.beginPath(); ctx.moveTo(co, co + sc*10); ctx.lineTo(co, co); ctx.lineTo(co+sc*10, co); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(W-co-sc*10, co); ctx.lineTo(W-co, co); ctx.lineTo(W-co, co+sc*10); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(co, H-co-sc*10); ctx.lineTo(co, H-co); ctx.lineTo(co+sc*10, H-co); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(W-co-sc*10, H-co); ctx.lineTo(W-co, H-co); ctx.lineTo(W-co, H-co-sc*10); ctx.stroke()
    ctx.restore()
  }

  ctx.save(); ctx.globalCompositeOperation = 'destination-in'
  ctx.beginPath(); ctx.arc(cx, cy, W * 0.5, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill()
  ctx.restore()
}

function LeoCanvas({ state, size, onClick }: { state: LeoState; size: number; onClick?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const blinkTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
 const jawRAF = useRef<number | undefined>(undefined)
  const blinkRef = useRef(false)
  const jawRef = useRef(0)

  const render = useCallback(() => {
    if (canvasRef.current) drawLion(canvasRef.current, state, blinkRef.current, jawRef.current)
  }, [state])

  useEffect(() => {
    render()
    const scheduleBlink = () => {
      blinkTimer.current = setTimeout(() => {
        blinkRef.current = true; render()
        setTimeout(() => { blinkRef.current = false; render(); scheduleBlink() }, 160)
      }, 2800 + Math.random() * 4000)
    }
    scheduleBlink()
    return () => { if (blinkTimer.current) clearTimeout(blinkTimer.current) }
  }, [render])

  useEffect(() => {
    if (state !== 'speaking') { jawRef.current = 0; render(); return }
    const animate = () => {
      jawRef.current = (Math.sin(Date.now() / 88) * 0.5 + 0.5) * 0.8
      render(); jawRAF.current = requestAnimationFrame(animate)
    }
    jawRAF.current = requestAnimationFrame(animate)
    return () => { if (jawRAF.current) cancelAnimationFrame(jawRAF.current) }
  }, [state, render])

  return (
    <canvas
      ref={canvasRef}
      width={size} height={size}
      onClick={onClick}
      style={{ borderRadius: '50%', display: 'block', cursor: onClick ? 'pointer' : 'default', animation: 'sl-breathe 4.5s ease-in-out infinite' }}
    />
  )
}

// ─── Status Pill ───────────────────────────────────────────────────────────────
const STATE_CONF: Record<LeoState, { label: string; dot: string; tc: string }> = {
  idle:      { label: 'Standby',    dot: '#c9923a', tc: 'rgba(201,146,58,0.6)' },
  listening: { label: 'Listening',  dot: '#3ec87a', tc: '#3ec87a' },
  speaking:  { label: 'Speaking',   dot: '#c9923a', tc: '#c9923a' },
  thinking:  { label: 'Processing', dot: '#c9923a', tc: '#c9923a' },
  reading:   { label: 'Reading',    dot: '#c9923a', tc: 'rgba(201,146,58,0.7)' },
  error:     { label: 'Error',      dot: '#d9534f', tc: '#d9534f' },
}

function StatusPill({ state }: { state: LeoState }) {
  const c = STATE_CONF[state]
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 100,
      border: `1px solid ${c.dot}28`,
      background: `${c.dot}10`,
    }}>
      <div style={{
        width: 5, height: 5, borderRadius: '50%',
        background: c.dot, boxShadow: `0 0 6px ${c.dot}`,
        animation: state !== 'idle' ? 'sl-dot 1.4s ease-in-out infinite' : 'none',
      }} />
      <span className="sl-mono" style={{ fontSize: 9, color: c.tc, letterSpacing: '0.14em' }}>
        {c.label}
      </span>
    </div>
  )
}

// ─── Waveform ──────────────────────────────────────────────────────────────────
function Waveform({ state }: { state: LeoState }) {
  if (state === 'idle') return null
  const color = state === 'listening' ? '#3ec87a' : '#c9923a'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2.5, height: 20 }}>
      {Array.from({ length: 14 }).map((_, i) => {
        const edge = i < 2 || i > 11
        return (
          <div
            key={i}
            className="sl-wavebar"
            style={{
              width: 2, height: edge ? 5 : 16, borderRadius: 2,
              background: color, opacity: edge ? 0.18 : 0.8,
              transformOrigin: 'center',
              animationDuration: `${(0.3 + Math.random() * 0.45).toFixed(2)}s`,
              animationDelay: `${(i * 0.045).toFixed(2)}s`,
            }}
          />
        )
      })}
    </div>
  )
}

// ─── Tabs (animated sliding pill) ─────────────────────────────────────────────
interface TabConfig {
  id: PanelTab
  label: string
  icon: string
}

const TABS: TabConfig[] = [
  { id: 'assistant', label: 'Assistant', icon: '◆' },
  { id: 'chat',      label: 'Chat',      icon: '⌘' },
]

function PanelTabs({ active, onChange }: { active: PanelTab; onChange: (t: PanelTab) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const idx = TABS.findIndex(t => t.id === active)
    const btns = container.querySelectorAll<HTMLButtonElement>('.sl-tab-btn')
    const btn = btns[idx]
    if (!btn) return
    const containerRect = container.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()
    setPillStyle({
      left: btnRect.left - containerRect.left,
      width: btnRect.width,
    })
  }, [active])

  return (
    <div ref={containerRef} className="sl-tabs-container" style={{ position: 'relative', margin: '14px 18px 0' }}>
      {/* Sliding pill */}
      <div
        className="sl-tab-pill"
        style={{
          left: pillStyle.left,
          width: pillStyle.width || '50%',
        }}
      />
      {TABS.map(t => (
        <button
          key={t.id}
          className={`sl-tab-btn${active === t.id ? ' active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          <span style={{ fontSize: 10 }}>{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ─── Chat Tab ──────────────────────────────────────────────────────────────────
function LeoChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text, ts: Date.now() }
    const leoMsgId = (Date.now() + 1).toString()
    const leoMsg: ChatMessage = { id: leoMsgId, role: 'leo', text: '', ts: Date.now(), streaming: true }

    setMessages(prev => [...prev, userMsg, leoMsg])
    setInput('')
    setIsLoading(true)

    const history = [...messages, userMsg].map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    }))

    try {
      abortRef.current = new AbortController()
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are Supra Leo, a sharp and composed AI field assistant embedded inside a CRM or sales tool. You help users with anything they ask — lead intelligence, email drafts, objection handling, scheduling, strategy, or general questions. Keep answers concise and clear. Use a confident, warm tone — direct but never cold. You may use light markdown (bold, bullets) for structure when it helps readability. Never break character.`,
          messages: history,
          stream: true,
        }),
      })

      if (!res.ok || !res.body) throw new Error('API error')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              accumulated += parsed.delta.text
              setMessages(prev => prev.map(m => m.id === leoMsgId ? { ...m, text: accumulated } : m))
            }
          } catch { /* skip */ }
        }
      }

      setMessages(prev => prev.map(m => m.id === leoMsgId ? { ...m, streaming: false } : m))
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setMessages(prev => prev.map(m => m.id === leoMsgId ? { ...m, text: m.text || '…', streaming: false } : m))
      } else {
        setMessages(prev => prev.map(m => m.id === leoMsgId ? { ...m, text: 'Something went wrong. Please try again.', streaming: false } : m))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const QUICK_PROMPTS = ['Draft a follow-up email', 'Handle price objection', 'Summarize this lead']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 370 }}>
      {/* Messages */}
      <div
        ref={scrollRef}
        className="sl-chat-scroll"
        style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '20px 0 8px' }}>
            <div style={{ opacity: 0.75 }}>
              <LeoCanvas state="idle" size={48} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="sl-display" style={{ fontSize: 16, color: '#e4b96a', letterSpacing: '0.08em', marginBottom: 7, fontWeight: 600 }}>
                How can I help you today?
              </div>
              <div className="sl-ui" style={{ fontSize: 12, fontWeight: 300, color: 'rgba(255,247,235,0.28)', lineHeight: 1.7 }}>
                Leads, replies, strategy — just ask.
              </div>
            </div>
            {/* Quick prompts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', padding: '0 4px' }}>
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => { setInput(p); inputRef.current?.focus() }}
                  className="sl-ui"
                  style={{
                    padding: '9px 14px', borderRadius: 9, cursor: 'pointer',
                    fontSize: 12, fontWeight: 400, textAlign: 'left',
                    border: '1px solid rgba(201,146,58,0.14)',
                    background: 'rgba(201,146,58,0.04)',
                    color: 'rgba(255,247,235,0.45)',
                    transition: 'all 0.16s',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(201,146,58,0.35)'
                    e.currentTarget.style.color = '#e4b96a'
                    e.currentTarget.style.background = 'rgba(201,146,58,0.08)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(201,146,58,0.14)'
                    e.currentTarget.style.color = 'rgba(255,247,235,0.45)'
                    e.currentTarget.style.background = 'rgba(201,146,58,0.04)'
                  }}
                >
                  {p}
                  <span style={{ fontSize: 12, opacity: 0.4 }}>→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className="sl-msg-in"
            style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8 }}
          >
            {msg.role === 'leo' && (
              <div style={{ flexShrink: 0, marginBottom: 2 }}>
                <LeoCanvas state={msg.streaming ? 'thinking' : 'idle'} size={24} />
              </div>
            )}
            <div style={{
              maxWidth: '80%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '13px 13px 4px 13px' : '13px 13px 13px 4px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, rgba(140,86,24,0.6), rgba(201,146,58,0.42))'
                : 'rgba(255,247,235,0.04)',
              border: msg.role === 'user'
                ? '1px solid rgba(201,146,58,0.32)'
                : '1px solid rgba(255,247,235,0.06)',
              boxShadow: msg.role === 'user' ? '0 2px 14px rgba(201,146,58,0.1)' : 'none',
            }}>
              {msg.role === 'leo' && msg.text === '' && msg.streaming ? (
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '3px 2px' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: '#c9923a',
                      animation: `sl-dot 1.2s ease-in-out ${i*0.18}s infinite`,
                    }} />
                  ))}
                </div>
              ) : (
                <div
                  className="sl-ui"
                  style={{
                    fontSize: 13, fontWeight: 300, lineHeight: 1.65,
                    color: msg.role === 'user' ? 'rgba(255,247,235,0.92)' : 'rgba(255,247,235,0.75)',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}
                >
                  {msg.text}
                  {msg.streaming && msg.text && <span className="sl-cursor" />}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="sl-divider" />

      {/* Input */}
      <div style={{ padding: '12px 16px 14px', flexShrink: 0 }}>
        <div className="sl-input-wrap">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask Supra Leo anything…"
            rows={1}
            disabled={isLoading}
            className="sl-ui"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              resize: 'none', color: 'rgba(255,247,235,0.88)',
              fontSize: 13, fontWeight: 300, lineHeight: 1.55, padding: 0,
              maxHeight: 80, overflowY: 'auto',
            }}
          />
          {isLoading ? (
            <button
              onClick={() => abortRef.current?.abort()}
              className="sl-send-btn"
              style={{ background: 'rgba(217,83,79,0.08)', border: '1px solid rgba(217,83,79,0.25)', color: '#d9534f', fontSize: 11 }}
              title="Stop"
            >⏹</button>
          ) : (
            <button
              onClick={sendMessage}
              className={`sl-send-btn ${input.trim() ? 'ready' : 'empty'}`}
            >↑</button>
          )}
        </div>
        <div className="sl-mono" style={{ fontSize: 8, color: 'rgba(255,247,235,0.12)', letterSpacing: '0.14em', marginTop: 7, textAlign: 'center' }}>
          ENTER TO SEND  ·  SHIFT+ENTER FOR NEWLINE
        </div>
      </div>
    </div>
  )
}

// ─── Panel ─────────────────────────────────────────────────────────────────────
export interface LeoMessage {
  sender?: string; senderEmail?: string; subject?: string; snippet?: string; status?: string
}

interface LeoPanelProps {
  state: LeoState; message: LeoMessage | null; transcript: string
  voiceName: string | null; errorMsg: string | null
  onStop: () => void; onPause: () => void; onResume: () => void; onClose: () => void
  onReplay: () => void; onListen: () => void; onVoiceReply: () => void
  onSendReply: (t: string) => void; onSetTranscript: (t: string) => void
}

function LeoPanel({
  state, message, transcript, voiceName, errorMsg,
  onStop, onPause, onClose, onReplay, onListen, onVoiceReply, onSendReply,
}: LeoPanelProps) {
  const [reply, setReply] = useState('')
  const [tab, setTab] = useState<PanelTab>('assistant')
  const isActive = state !== 'idle'

  return (
    <div
      className="sl-glass sl-panel-anim sl-ui"
      style={{
        width: 356,
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 28px 80px rgba(0,0,0,0.92), 0 0 0 1px rgba(201,146,58,0.16), inset 0 1px 0 rgba(255,247,235,0.06)',
        border: '1px solid rgba(201,146,58,0.16)',
      }}
    >
      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent 5%,rgba(201,146,58,0.6) 35%,rgba(228,185,106,0.8) 50%,rgba(201,146,58,0.6) 65%,transparent 95%)', zIndex: 10 }} />

      {/* Corner accents */}
      {(['tl','tr','bl','br'] as const).map(c => (
        <div key={c} style={{
          position: 'absolute', width: 14, height: 14, zIndex: 9, pointerEvents: 'none',
          top: c.startsWith('t') ? 0 : 'auto', bottom: c.startsWith('b') ? 0 : 'auto',
          left: c.endsWith('l') ? 0 : 'auto', right: c.endsWith('r') ? 0 : 'auto',
          borderTop: c.startsWith('t') ? '1.5px solid rgba(201,146,58,0.5)' : 'none',
          borderBottom: c.startsWith('b') ? '1.5px solid rgba(201,146,58,0.3)' : 'none',
          borderLeft: c.endsWith('l') ? '1.5px solid rgba(201,146,58,0.5)' : 'none',
          borderRight: c.endsWith('r') ? '1.5px solid rgba(201,146,58,0.3)' : 'none',
        }} />
      ))}

      <div style={{ position: 'relative', zIndex: 2 }}>

        {/* ── Header ── */}
        <div style={{ padding: '18px 18px 14px', display: 'flex', alignItems: 'center', gap: 13 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <LeoCanvas state={state} size={46} />
            {isActive && (
              <div style={{
                position: 'absolute', inset: -4, borderRadius: '50%',
                border: '1px solid rgba(201,146,58,0.3)',
                animation: 'sl-ring 2.8s ease-out infinite',
                pointerEvents: 'none',
              }} />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 5 }}>
              <span className="sl-display" style={{ fontSize: 16, fontWeight: 600, color: '#e4b96a', letterSpacing: '0.12em', lineHeight: 1 }}>
                Supra Leo
              </span>
              <span className="sl-mono" style={{ fontSize: 8.5, color: 'rgba(201,146,58,0.35)', letterSpacing: '0.16em' }}>
                v4.0
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <StatusPill state={state} />
              {isActive && <Waveform state={state} />}
            </div>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0, cursor: 'pointer',
              background: 'rgba(255,247,235,0.04)', border: '1px solid rgba(255,247,235,0.08)',
              color: 'rgba(255,247,235,0.3)', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.16s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(217,83,79,0.1)'
              e.currentTarget.style.borderColor = 'rgba(217,83,79,0.35)'
              e.currentTarget.style.color = '#d9534f'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,247,235,0.04)'
              e.currentTarget.style.borderColor = 'rgba(255,247,235,0.08)'
              e.currentTarget.style.color = 'rgba(255,247,235,0.3)'
            }}
          >×</button>
        </div>

        {/* ── Tabs ── */}
        <PanelTabs active={tab} onChange={setTab} />

        {/* Separator after tabs */}
        <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(201,146,58,0.12),transparent)', margin: '14px 0 0' }} />

        {/* ─── Tab: Assistant ─── */}
        {tab === 'assistant' && (
          <>
            <div style={{ padding: '16px 18px', minHeight: 80 }}>

              {/* Error state */}
              {state === 'error' && errorMsg && (
                <div style={{ background: 'rgba(217,83,79,0.05)', border: '1px solid rgba(217,83,79,0.18)', borderRadius: 10, padding: '11px 13px', marginBottom: 14 }}>
                  <div className="sl-section-label" style={{ color: '#d9534f', marginBottom: 5 }}>System Error</div>
                  <p className="sl-ui" style={{ fontSize: 12.5, fontWeight: 300, color: 'rgba(217,83,79,0.8)', lineHeight: 1.6, margin: 0 }}>{errorMsg}</p>
                </div>
              )}

              {/* Message card */}
              {message && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(20,16,10,0.8), rgba(16,14,10,0.8))',
                  border: '1px solid rgba(201,146,58,0.16)',
                  borderRadius: 12, padding: '13px 15px', marginBottom: 14,
                  boxShadow: 'inset 0 1px 0 rgba(201,146,58,0.06)',
                }}>
                  {message.sender && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 9,
                        background: 'linear-gradient(135deg,#3a2208,#8a5618)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 600, color: '#e4b96a', flexShrink: 0,
                        fontFamily: "'Cormorant Garamond',serif",
                        border: '1px solid rgba(201,146,58,0.2)',
                      }}>
                        {message.sender[0]?.toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="sl-ui" style={{ fontSize: 13, fontWeight: 500, color: '#e4b96a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {message.sender}
                        </div>
                        {message.senderEmail && (
                          <div className="sl-mono" style={{ fontSize: 9, color: 'rgba(255,247,235,0.26)' }}>
                            {message.senderEmail}
                          </div>
                        )}
                      </div>
                      {message.status && (
                        <div className="sl-mono" style={{
                          fontSize: 8, padding: '3px 9px', borderRadius: 100, flexShrink: 0,
                          background: 'rgba(62,200,122,0.07)', border: '1px solid rgba(62,200,122,0.2)', color: '#3ec87a',
                        }}>
                          {message.status.toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}
                  {message.subject && (
                    <div className="sl-ui" style={{ fontSize: 12.5, fontWeight: 400, color: 'rgba(255,247,235,0.68)', lineHeight: 1.45, marginBottom: message.snippet ? 8 : 0 }}>
                      {message.subject}
                    </div>
                  )}
                  {message.snippet && (
                    <div className="sl-ui" style={{
                      fontSize: 11.5, fontWeight: 300, color: 'rgba(255,247,235,0.32)', lineHeight: 1.6,
                      borderTop: '1px solid rgba(201,146,58,0.08)', paddingTop: 8,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {message.snippet}
                    </div>
                  )}
                </div>
              )}

              {/* Thinking */}
              {state === 'thinking' && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 13px', marginBottom: 14,
                  background: 'rgba(201,146,58,0.04)',
                  border: '1px solid rgba(201,146,58,0.1)', borderRadius: 10,
                }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, border: '1.5px solid transparent', borderTopColor: '#c9923a', borderRightColor: 'rgba(201,146,58,0.25)', animation: 'sl-spin 0.9s linear infinite' }} />
                  <div>
                    <div className="sl-section-label" style={{ marginBottom: 3 }}>Neural Processing</div>
                    <div className="sl-ui" style={{ fontSize: 12, fontWeight: 300, color: 'rgba(255,247,235,0.42)' }}>Analyzing your message…</div>
                  </div>
                </div>
              )}

              {/* Transcript */}
              {transcript && (
                <div style={{ marginBottom: 14 }}>
                  <div className="sl-section-label" style={{ marginBottom: 8 }}>Transcript</div>
                  <div className="sl-ui" style={{
                    fontSize: 12.5, fontWeight: 300, fontStyle: 'italic',
                    color: 'rgba(255,247,235,0.68)', lineHeight: 1.7,
                    maxHeight: 72, overflowY: 'auto',
                    padding: '10px 13px',
                    background: 'rgba(201,146,58,0.03)',
                    border: '1px solid rgba(201,146,58,0.1)',
                    borderLeft: '2px solid rgba(201,146,58,0.4)',
                    borderRadius: '0 9px 9px 0',
                  }}>
                    {transcript}
                  </div>
                </div>
              )}

              {/* Listening */}
              {state === 'listening' && (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                  padding: '15px 16px', marginBottom: 14,
                  background: 'rgba(62,200,122,0.03)',
                  border: '1px solid rgba(62,200,122,0.14)', borderRadius: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3ec87a', boxShadow: '0 0 10px rgba(62,200,122,0.8)', animation: 'sl-dot 0.75s ease-in-out infinite' }} />
                    <span className="sl-mono" style={{ fontSize: 9, color: '#3ec87a', letterSpacing: '0.18em' }}>LISTENING FOR COMMAND</span>
                  </div>
                  <Waveform state="listening" />
                  <div className="sl-ui" style={{ fontSize: 11.5, fontWeight: 300, fontStyle: 'italic', color: 'rgba(62,200,122,0.45)', textAlign: 'center' }}>
                    Say "Reply", "Stop", or "Read again"
                  </div>
                </div>
              )}

              {/* Idle empty state */}
              {state === 'idle' && !message && !transcript && (
                <div style={{ textAlign: 'center', padding: '20px 0 14px' }}>
                  <div style={{ fontSize: 28, marginBottom: 12, filter: 'drop-shadow(0 0 10px rgba(201,146,58,0.25))' }}>🦁</div>
                  <div className="sl-ui" style={{ fontSize: 12.5, fontWeight: 300, color: 'rgba(255,247,235,0.28)', lineHeight: 1.75 }}>
                    Open a lead to activate<br />AI-powered voice assistance
                  </div>
                </div>
              )}
            </div>

            {/* Reply compose */}
            {(state !== 'idle' || !!message) && (
              <>
                <div className="sl-divider" />
                <div style={{ padding: '13px 18px 14px' }}>
                  <div className="sl-section-label" style={{ marginBottom: 9 }}>Reply</div>
                  <div className="sl-input-wrap">
                    <textarea
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSendReply(reply); setReply('') } }}
                      placeholder="Compose your reply…"
                      rows={1}
                      className="sl-ui"
                      style={{
                        flex: 1, background: 'none', border: 'none', outline: 'none',
                        resize: 'none', color: 'rgba(255,247,235,0.85)',
                        fontSize: 13, fontWeight: 300, lineHeight: 1.55, padding: 0,
                      }}
                    />
                    <button
                      onClick={() => { onSendReply(reply); setReply('') }}
                      className={`sl-send-btn ${reply.trim() ? 'ready' : 'empty'}`}
                    >↑</button>
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="sl-divider" />
            <div style={{ padding: '10px 18px 16px', display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
              {state === 'speaking' && (
                <>
                  <button className="sl-action-btn" onClick={onPause}><span>⏸</span> Pause</button>
                  <button className="sl-action-btn danger" onClick={onStop}><span>⏹</span> Stop</button>
                </>
              )}
              {state === 'idle' && message && (
                <button className="sl-action-btn" onClick={onReplay}><span style={{ fontSize: 12 }}>↺</span> Replay</button>
              )}
              {(state === 'idle' || state === 'speaking' || state === 'reading') && (
                <button className="sl-action-btn" onClick={onListen}><span>⌘</span> Command</button>
              )}
              {state !== 'listening' && message && (
                <button className="sl-action-btn" onClick={onVoiceReply}><span>🎤</span> Voice Reply</button>
              )}
              {state === 'listening' && (
                <button className="sl-action-btn danger" onClick={onStop}><span>⏹</span> Stop</button>
              )}
            </div>
          </>
        )}

        {/* ─── Tab: Chat ─── */}
        {tab === 'chat' && <LeoChatTab />}

      </div>
    </div>
  )
}

// ─── Floating Badge ────────────────────────────────────────────────────────────
function LeoBadge({ state, onClick }: { state: LeoState; onClick: () => void }) {
  const isActive = state !== 'idle'
  return (
    <button
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', padding: 0, cursor: 'pointer', outline: 'none', position: 'relative' }}
    >
      <div
        className="sl-glass"
        style={{
          display: 'flex', alignItems: 'center', borderRadius: 54, padding: '5px 18px 5px 5px', gap: 13,
          border: `1px solid ${isActive ? 'rgba(201,146,58,0.55)' : 'rgba(201,146,58,0.2)'}`,
          boxShadow: isActive
            ? '0 0 28px rgba(201,146,58,0.18), 0 8px 36px rgba(0,0,0,0.85)'
            : '0 4px 24px rgba(0,0,0,0.75)',
          transition: 'all 0.3s',
        }}
      >
        <div className="sl-float" style={{ flexShrink: 0 }}>
          <LeoCanvas state={state} size={58} />
        </div>
        <div>
          <div className="sl-display" style={{ fontSize: 15, fontWeight: 600, color: '#e4b96a', letterSpacing: '0.12em', lineHeight: 1, marginBottom: 6 }}>
            Supra Leo
          </div>
          <StatusPill state={state} />
        </div>
      </div>
      {isActive && (
        <div style={{
          position: 'absolute', inset: -8, borderRadius: 62,
          border: '1px solid rgba(201,146,58,0.22)',
          animation: 'sl-ring 2.8s ease-out infinite',
          pointerEvents: 'none',
        }} />
      )}
    </button>
  )
}

// ─── Main Export ───────────────────────────────────────────────────────────────
export interface SupraLeoAIProps {
  variant?: 'floating' | 'toolbar'
  position?: 'bottom-right' | 'bottom-left'
  state?: LeoState
  message?: LeoMessage | null
  transcript?: string
  voiceName?: string | null
  errorMsg?: string | null
  onStop?: () => void
  onPause?: () => void
  onResume?: () => void
  onReplay?: () => void
  onListen?: () => void
  onVoiceReply?: () => void
  onSendReply?: (t: string) => void
  onSetTranscript?: (t: string) => void
}

export function SupraLeoAI({
  variant = 'floating', position = 'bottom-right',
  state = 'idle', message = null, transcript = '',
  voiceName = null, errorMsg = null,
  onStop = () => {}, onPause = () => {}, onResume = () => {},
  onReplay = () => {}, onListen = () => {}, onVoiceReply = () => {},
  onSendReply = () => {}, onSetTranscript = () => {},
}: SupraLeoAIProps) {
  const [panelOpen, setPanelOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { injectCSS() }, [])

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setPanelOpen(false) }
    if (panelOpen) document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [panelOpen])

  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent).detail
      if (d?.leadId) setPanelOpen(true)
    }
    window.addEventListener('supraleo:read-message', h)
    return () => window.removeEventListener('supraleo:read-message', h)
  }, [])

  const panelProps: LeoPanelProps = {
    state, message, transcript, voiceName, errorMsg,
    onStop, onPause, onResume,
    onClose: () => { setPanelOpen(false); onStop() },
    onReplay, onListen, onVoiceReply, onSendReply, onSetTranscript,
  }

  const isLeft = position === 'bottom-left'

  return (
    <div ref={ref}>
      {variant === 'toolbar' ? (
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <LeoBadge state={state} onClick={() => setPanelOpen(p => !p)} />
          {panelOpen && (
            <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 12px)', zIndex: 9999 }}>
              <LeoPanel {...panelProps} onClose={() => setPanelOpen(false)} />
            </div>
          )}
        </div>
      ) : (
        <div style={{
          position: 'fixed',
          bottom: 'var(--leo-bottom,24px)',
          ...(isLeft ? { left: 'var(--leo-side,24px)' } : { right: 'var(--leo-side,24px)' }),
          zIndex: 9999,
          display: 'flex', flexDirection: 'column',
          alignItems: isLeft ? 'flex-start' : 'flex-end',
          gap: 14,
        }}>
          {panelOpen && <LeoPanel {...panelProps} />}
          <LeoBadge state={state} onClick={() => setPanelOpen(p => !p)} />
        </div>
      )}
    </div>
  )
}

export default SupraLeoAI