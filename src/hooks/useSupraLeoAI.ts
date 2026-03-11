// ─── Supra Leo AI · Hook (v3 — root cause fixes) ────────────────────────────
//
// ROOT FIX 1: Male voice re-selected before EVERY utterance (Chrome drops refs)
// ROOT FIX 2: Fetches full lead body from /api/leads/:id/thread
// ROOT FIX 3: TTS ONLY reads emails. ALL prompts are visual. Mic NEVER hears AI.
//

'use client'

import * as React from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

export type SpeakState =
  | 'idle'
  | 'fetching'
  | 'speaking'
  | 'paused'
  | 'waiting-command'   // visual prompt shown — NO TTS, NO mic yet
  | 'listening'         // mic on for command
  | 'listening-reply'   // mic on for reply dictation
  | 'sending'
  | 'done'
  | 'error'

export interface SupraLeoEmail {
  subject: string
  from: string
  date: string
  snippet: string
}

export interface SupraLeoMessage {
  leadId: string
  sender: string
  senderEmail: string
  subject: string
  snippet: string
  body: string
  status: string
  canReply: boolean
}

export interface LeadReadData {
  leadId: string
  firstName?: string
  lastName?: string
  senderName?: string
  senderEmail?: string
  email?: string
  subject?: string
  body?: string
  status?: string
}

export interface UseSupraLeoAIReturn {
  state: SpeakState
  email: SupraLeoEmail | null
  message: SupraLeoMessage | null
  errorMsg: string | null
  voiceName: string | null
  transcript: string
  isBrowserSupported: boolean

  readLead: (data: LeadReadData) => void
  readText: (text: string) => void
  startListeningForCommand: () => void
  startReplyListening: () => void
  setTranscript: (text: string) => void
  sendReply: () => Promise<void>
  stop: () => void
  pauseSpeech: () => void
  resumeSpeech: () => void
  dismiss: () => void

  // Legacy compat
  activateSpeech: () => void
  stopSpeech: () => void
  readMessage: (leadId: string) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function checkSupport(): boolean {
  if (typeof window === 'undefined') return false
  return 'speechSynthesis' in window &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
}

function cleanForSpeech(html: string): string {
  if (!html) return ''
  return html
    .replace(/<!doctype[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '. ')
    .replace(/<\/p>/gi, '. ')
    .replace(/<\/div>/gi, '. ')
    .replace(/<\/li>/gi, '. ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .replace(/\.\s*\./g, '.')
    .trim()
}

// ─── MALE VOICE — re-selected fresh every time, never cached ─────────────────

const MALE_KW = [
  'daniel', 'james', 'david', 'mark', 'google uk english male',
  'microsoft david', 'microsoft mark', 'microsoft james',
  'aaron', 'arthur', 'fred', 'ralph', 'alex', 'reed',
  'rishi', 'tom', 'albert', 'guy', 'lee', 'malcolm',
]
const FEMALE_KW = [
  'female', 'samantha', 'victoria', 'karen', 'fiona', 'moira',
  'tessa', 'veena', 'kate', 'susan', 'zira', 'hazel',
  'shelley', 'sandy', 'catherine', 'allison', 'ava',
  'joana', 'jessica', 'sara', 'jenny', 'aria', 'emma',
  'google us english', 'google uk english female',
]

function isFemale(v: SpeechSynthesisVoice): boolean {
  const n = v.name.toLowerCase()
  return FEMALE_KW.some(k => n.includes(k))
}

function pickMaleVoice(): SpeechSynthesisVoice | null {
  const all = speechSynthesis.getVoices()
  if (!all.length) return null
  const en = all.filter(v => v.lang.startsWith('en'))

  for (const kw of MALE_KW) {
    const m = en.find(v => v.name.toLowerCase().includes(kw))
    if (m) return m
  }
  const nonF = en.filter(v => !isFemale(v))
  if (nonF.length) return nonF[0]
  const anyNF = all.filter(v => !isFemale(v))
  if (anyNF.length) return anyNF[0]
  return en[0] || all[0]
}

function waitForVoices(timeout = 3000): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const v = speechSynthesis.getVoices()
    if (v.length > 0) { resolve(v); return }
    let done = false
    const cb = () => {
      if (done) return
      const voices = speechSynthesis.getVoices()
      if (voices.length > 0) { done = true; speechSynthesis.onvoiceschanged = null; resolve(voices) }
    }
    speechSynthesis.onvoiceschanged = cb
    setTimeout(() => { if (!done) { done = true; speechSynthesis.onvoiceschanged = null; resolve(speechSynthesis.getVoices()) } }, timeout)
  })
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useSupraLeoAI(): UseSupraLeoAIReturn {
  const [state, setState]           = React.useState<SpeakState>('idle')
  const [email, setEmail]           = React.useState<SupraLeoEmail | null>(null)
  const [message, setMessage]       = React.useState<SupraLeoMessage | null>(null)
  const [errorMsg, setErrorMsg]     = React.useState<string | null>(null)
  const [voiceName, setVoiceName]   = React.useState<string | null>(null)
  const [transcript, setTranscript] = React.useState('')
  const [isBrowserSupported]        = React.useState(checkSupport)

  const recRef      = React.useRef<any>(null)
  const cancelRef   = React.useRef(false)

  // Preload voices
  React.useEffect(() => {
    if (!isBrowserSupported) return
    waitForVoices().then(() => {
      const v = pickMaleVoice()
      if (v) setVoiceName(v.name)
    })
  }, [isBrowserSupported])

  React.useEffect(() => () => { speechSynthesis.cancel(); recRef.current?.abort() }, [])

  // ══════════════════════════════════════════════════════════════════════
  // TTS — picks male voice FRESH before EVERY utterance
  // ══════════════════════════════════════════════════════════════════════

  const speak = React.useCallback(async (text: string): Promise<void> => {
    await waitForVoices()
    return new Promise((resolve, reject) => {
      speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(text)

      // ★★★ FRESH male voice pick — never reuse stale ref ★★★
      const male = pickMaleVoice()
      if (male) { utt.voice = male; setVoiceName(male.name) }

      utt.rate   = 1.0
      utt.pitch  = 0.85
      utt.volume = 1.0
      utt.onend   = () => resolve()
      utt.onerror = (e) => (e.error === 'canceled' || e.error === 'interrupted') ? resolve() : reject(new Error(e.error))
      speechSynthesis.speak(utt)
    })
  }, [])

  // ── STT: command (short) ──────────────────────────────────────────────

  const listenForCommand = React.useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SR) { resolve(''); return }
      const rec = new SR()
      recRef.current = rec
      rec.continuous = false; rec.interimResults = false; rec.lang = 'en-US'; rec.maxAlternatives = 3
      let done = false
      const fin = (v: string) => { if (!done) { done = true; resolve(v) } }
      rec.onresult = (e: any) => fin(e.results[0]?.[0]?.transcript?.toLowerCase().trim() || '')
      rec.onerror = () => fin('')
      rec.onend   = () => fin('')
      setTimeout(() => { fin(''); try { rec.stop() } catch {} }, 10000)
      try { rec.start() } catch { fin('') }
    })
  }, [])

  // ── STT: dictation (continuous) ───────────────────────────────────────

  const listenForReply = React.useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SR) { resolve(''); return }
      const rec = new SR()
      recRef.current = rec
      rec.continuous = true; rec.interimResults = false; rec.lang = 'en-US'
      let full = '', done = false
      const fin = () => { if (!done) { done = true; resolve(full.trim()) } }
      rec.onresult = (e: any) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) { full += e.results[i][0].transcript + ' '; setTranscript(full.trim()) }
        }
      }
      rec.onerror = fin; rec.onend = fin
      setTimeout(() => { fin(); try { rec.stop() } catch {} }, 30000)
      try { rec.start() } catch { fin() }
    })
  }, [])

  // ══════════════════════════════════════════════════════════════════════
  // MAIN: readLead
  //
  //  1. Fetch full body from /api/leads/:id/thread (list items lack body)
  //  2. TTS reads ONLY the email content (male voice, fresh pick)
  //  3. State → 'waiting-command' → panel shows VISUAL buttons
  //     ★ NO TTS prompt, NO auto-mic → AI voice can NEVER be picked up
  //  4. USER clicks button to proceed (Reply / Stop / Dictate)
  // ══════════════════════════════════════════════════════════════════════

  const readLead = React.useCallback(async (data: LeadReadData) => {
    if (!isBrowserSupported) { setErrorMsg('Use Chrome or Edge.'); setState('error'); return }

    cancelRef.current = false
    setState('fetching')
    setErrorMsg(null)
    setTranscript('')

    try {
      const sender      = data.senderName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unknown'
      const senderEmail = data.senderEmail || data.email || ''
      const subject     = data.subject || '(No subject)'
      const status      = data.status || 'New'
      const canReply    = status !== 'Closed'

      // ── FIX #2: Fetch full body from thread API ──
      let bodyRaw = data.body || ''
      try {
        const token = localStorage.getItem('crm_token') || ''
        const h: Record<string, string> = {}
        if (token) h['Authorization'] = `Bearer ${token}`
        const res = await fetch(`/api/leads/${data.leadId}/thread`, { headers: h })
        if (res.ok) {
          const json = await res.json()
          const msgs = json?.data?.messages || json?.messages || []
          if (msgs.length > 0) {
            const first = msgs[0]
            const tb = first.body || first.message || first.content || first.snippet || ''
            if (tb.length > bodyRaw.length) bodyRaw = tb
          }
        }
      } catch { /* fall back to what we have */ }

      const bodyClean = cleanForSpeech(bodyRaw)

      const msgCtx: SupraLeoMessage = {
        leadId: data.leadId, sender, senderEmail, subject,
        snippet: bodyClean.substring(0, 200), body: bodyClean, status, canReply,
      }
      setMessage(msgCtx)
      setEmail({ subject, from: `${sender} <${senderEmail}>`, date: new Date().toISOString(), snippet: bodyClean.substring(0, 200) })

      if (cancelRef.current) return

      // Build speech
      const parts: string[] = [`Message from ${sender}.`]
      if (subject !== '(No subject)') parts.push(`Subject: ${subject}.`)
      if (bodyClean) {
        parts.push(bodyClean.length > 800 ? bodyClean.substring(0, 800) + '... Message truncated.' : bodyClean)
      } else {
        parts.push('This message has no readable content.')
      }

      // ── STEP 1: TTS reads ONLY the email ──
      setState('speaking')
      await speak(parts.join(' '))
      if (cancelRef.current) return

      // ── STEP 2: Visual prompt — NO TTS, NO mic ──
      setState(canReply ? 'waiting-command' : 'done')

    } catch (err: any) {
      if (!cancelRef.current) { setErrorMsg(err.message || 'Error'); setState('error') }
    }
  }, [isBrowserSupported, speak])

  // ── User clicked "Reply by Voice" button ──────────────────────────────

  const startListeningForCommand = React.useCallback(async () => {
    if (!isBrowserSupported) return
    cancelRef.current = false
    setState('listening')
    const cmd = await listenForCommand()
    if (cancelRef.current) return

    if (cmd.includes('reply') || cmd.includes('respond') || cmd.includes('answer') || cmd.includes('yes')) {
      // Go straight to dictation
      setState('listening-reply')
      setTranscript('')
      const text = await listenForReply()
      if (!cancelRef.current) { setTranscript(text); setState('done') }
    } else if (cmd.includes('stop') || cmd.includes('close') || cmd.includes('no') || cmd.includes('cancel')) {
      setState('idle'); setMessage(null); setEmail(null)
    } else {
      setState('waiting-command')  // didn't catch — show buttons again
    }
  }, [isBrowserSupported, listenForCommand, listenForReply])

  // ── User clicked "Start Dictating" directly ───────────────────────────

  const startReplyListening = React.useCallback(async () => {
    if (!isBrowserSupported) return
    cancelRef.current = false
    setState('listening-reply')
    setTranscript('')
    const text = await listenForReply()
    if (!cancelRef.current) { setTranscript(text); setState('done') }
  }, [isBrowserSupported, listenForReply])

  // ── Read arbitrary text ───────────────────────────────────────────────

  const readText = React.useCallback(async (text: string) => {
    if (!isBrowserSupported) return
    cancelRef.current = false; setState('speaking'); setErrorMsg(null)
    try { await speak(text); if (!cancelRef.current) setState('done') }
    catch (err: any) { if (!cancelRef.current) { setErrorMsg(err.message); setState('error') } }
  }, [isBrowserSupported, speak])

  // ── Send reply ────────────────────────────────────────────────────────

  const sendReply = React.useCallback(async () => {
    if (!message?.leadId || !transcript.trim()) return
    setState('sending')
    try {
      const token = localStorage.getItem('crm_token') || ''
      const h: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) h['Authorization'] = `Bearer ${token}`
      const res = await fetch(`/api/leads/${message.leadId}/reply`, { method: 'POST', headers: h, body: JSON.stringify({ message: transcript.trim() }) })
      if (!res.ok) throw new Error('Failed to send')
      setTranscript(''); setState('done')
    } catch (err: any) { setErrorMsg(err.message || 'Failed'); setState('error') }
  }, [message, transcript])

  // ── Controls ──────────────────────────────────────────────────────────

  const stop = React.useCallback(() => {
    cancelRef.current = true; speechSynthesis.cancel(); recRef.current?.abort(); recRef.current = null
    setState('idle'); setMessage(null); setEmail(null); setTranscript(''); setErrorMsg(null)
  }, [])

  const pauseSpeech  = React.useCallback(() => { speechSynthesis.pause(); setState('paused') }, [])
  const resumeSpeech = React.useCallback(() => { speechSynthesis.resume(); setState('speaking') }, [])
  const dismiss = React.useCallback(() => {
    cancelRef.current = true; speechSynthesis.cancel(); recRef.current?.abort(); recRef.current = null
    setState('idle'); setTranscript(''); setErrorMsg(null)
  }, [])

  return {
    state, email, message, errorMsg, voiceName, transcript, isBrowserSupported,
    readLead, readText, startListeningForCommand, startReplyListening,
    setTranscript, sendReply, stop, pauseSpeech, resumeSpeech, dismiss,
    activateSpeech: () => {}, stopSpeech: stop, readMessage: () => {},
  }
}
