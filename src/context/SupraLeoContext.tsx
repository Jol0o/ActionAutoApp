// ─── Supra Leo AI · Global Context ───────────────────────────────────────────
// Provides AI state to any component in the CRM.
// Wrap your app (or CRM layout) with <SupraLeoProvider>.
//
// Usage:
//   import { useSupraLeo } from '@/contexts/SupraLeoContext'
//   const { readMessage, activeLeadId, aiState } = useSupraLeo()

'use client'

import * as React from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

export type SupraLeoAIState =
  | 'idle'           // Waiting for user action
  | 'preparing'      // Fetching message data from backend
  | 'reading'        // TTS is reading the message aloud
  | 'prompting'      // "Say Reply or Stop" prompt playing/played
  | 'listening'      // STT is capturing voice for command detection
  | 'listening-reply' // STT is capturing voice for reply dictation
  | 'sending'        // Reply is being sent
  | 'paused'         // TTS paused
  | 'done'           // Operation completed
  | 'error'          // An error occurred

export interface MessageContext {
  leadId: string
  sender: string
  senderEmail: string
  subject: string
  snippet: string
  status: string
  canReply: boolean
  speechScript: string
}

export interface SupraLeoContextValue {
  // ── State ──
  aiState: SupraLeoAIState
  activeLeadId: string | null
  activeMessage: MessageContext | null
  errorMsg: string | null
  voiceName: string | null
  transcript: string
  isBrowserSupported: boolean

  // ── Actions ──
  /** Read a specific lead message aloud. Pass the leadId. */
  readMessage: (leadId: string) => void
  /** Read arbitrary text (for thread messages not stored as leads) */
  readText: (text: string, context?: Partial<MessageContext>) => void
  /** Stop everything and reset */
  stop: () => void
  /** Pause TTS */
  pause: () => void
  /** Resume TTS */
  resume: () => void
  /** Manually trigger reply listening */
  startReplyListening: () => void
  /** Set the transcript text (for manual edits before sending) */
  setTranscript: (text: string) => void
  /** Send the current transcript as a reply */
  sendReply: () => Promise<void>
  /** Dismiss / close the AI panel */
  dismiss: () => void
}

const SupraLeoContext = React.createContext<SupraLeoContextValue | null>(null)

export function useSupraLeo(): SupraLeoContextValue {
  const ctx = React.useContext(SupraLeoContext)
  if (!ctx) {
    throw new Error('useSupraLeo must be used within a <SupraLeoProvider>')
  }
  return ctx
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Check browser support for Speech APIs */
function checkBrowserSupport(): boolean {
  if (typeof window === 'undefined') return false
  return 'speechSynthesis' in window && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
}

/** Get a preferred male voice from available voices */
function getMaleVoice(): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices()
  // Prefer English male voices
  const maleKeywords = ['male', 'daniel', 'james', 'david', 'mark', 'google uk english male', 'microsoft david', 'microsoft mark']
  const englishVoices = voices.filter(v => v.lang.startsWith('en'))

  for (const keyword of maleKeywords) {
    const match = englishVoices.find(v => v.name.toLowerCase().includes(keyword))
    if (match) return match
  }

  // Fallback: any English voice
  if (englishVoices.length > 0) return englishVoices[0]
  // Ultimate fallback: any voice
  return voices[0] || null
}

/** Create a SpeechRecognition instance */
function createRecognition(): SpeechRecognition | null {
  if (typeof window === 'undefined') return null
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SpeechRecognition) return null
  const recognition = new SpeechRecognition()
  recognition.continuous = false
  recognition.interimResults = false
  recognition.lang = 'en-US'
  return recognition
}

// ─── Provider ────────────────────────────────────────────────────────────────

interface ProviderProps {
  children: React.ReactNode
  /** API client instance (axios-like) with .get/.post methods */
  apiClient: any
  /** Function to get auth token (Clerk's getToken or similar) */
  getAuthToken: () => Promise<string | null>
  /** Optional: callback when reply is sent successfully */
  onReplySent?: (leadId: string, message: string) => void
}

export function SupraLeoProvider({ children, apiClient, getAuthToken, onReplySent }: ProviderProps) {
  const [aiState, setAiState] = React.useState<SupraLeoAIState>('idle')
  const [activeLeadId, setActiveLeadId] = React.useState<string | null>(null)
  const [activeMessage, setActiveMessage] = React.useState<MessageContext | null>(null)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [voiceName, setVoiceName] = React.useState<string | null>(null)
  const [transcript, setTranscript] = React.useState('')
  const [isBrowserSupported] = React.useState(() => checkBrowserSupport())

  const recognitionRef = React.useRef<SpeechRecognition | null>(null)
  const utteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null)
  const voiceRef = React.useRef<SpeechSynthesisVoice | null>(null)

  // Preload voices
  React.useEffect(() => {
    if (!isBrowserSupported) return
    const loadVoices = () => {
      const voice = getMaleVoice()
      if (voice) {
        voiceRef.current = voice
        setVoiceName(voice.name)
      }
    }
    loadVoices()
    speechSynthesis.onvoiceschanged = loadVoices
    return () => { speechSynthesis.onvoiceschanged = null }
  }, [isBrowserSupported])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      speechSynthesis.cancel()
      recognitionRef.current?.abort()
    }
  }, [])

  // ── Internal: Speak text with TTS ──────────────────────────────────────

  const speak = React.useCallback((text: string, onEnd?: () => void): SpeechSynthesisUtterance => {
    speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    if (voiceRef.current) utterance.voice = voiceRef.current
    utterance.rate = 1.0
    utterance.pitch = 0.95
    utterance.volume = 1.0

    utterance.onend = () => onEnd?.()
    utterance.onerror = (e) => {
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.error('[SupraLeo] TTS error:', e.error)
        setErrorMsg(`Speech error: ${e.error}`)
        setAiState('error')
      }
    }

    utteranceRef.current = utterance
    speechSynthesis.speak(utterance)
    return utterance
  }, [])

  // ── Internal: Listen for voice command ─────────────────────────────────

  const listenForCommand = React.useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      const recognition = createRecognition()
      if (!recognition) {
        reject(new Error('Speech recognition not supported'))
        return
      }
      recognitionRef.current = recognition
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const text = event.results[0]?.[0]?.transcript?.toLowerCase().trim() || ''
        resolve(text)
      }
      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          resolve('') // Treat no-speech as empty (will prompt again or timeout)
        } else {
          reject(new Error(`Recognition error: ${event.error}`))
        }
      }
      recognition.onend = () => {
        // If no result was captured, resolve empty
        resolve('')
      }

      try {
        recognition.start()
      } catch (err) {
        reject(err)
      }
    })
  }, [])

  // ── Internal: Listen for reply dictation ───────────────────────────────

  const listenForReply = React.useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      const recognition = createRecognition()
      if (!recognition) {
        reject(new Error('Speech recognition not supported'))
        return
      }
      recognitionRef.current = recognition
      recognition.continuous = true
      recognition.interimResults = false

      let fullTranscript = ''

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            fullTranscript += event.results[i][0].transcript + ' '
            setTranscript(fullTranscript.trim())
          }
        }
      }

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          resolve(fullTranscript.trim())
        } else {
          reject(new Error(`Recognition error: ${event.error}`))
        }
      }

      recognition.onend = () => {
        resolve(fullTranscript.trim())
      }

      try {
        recognition.start()
      } catch (err) {
        reject(err)
      }
    })
  }, [])

  // ── Main Flow: Read Message ────────────────────────────────────────────

  const readMessage = React.useCallback(async (leadId: string) => {
    if (!isBrowserSupported) {
      setErrorMsg('Your browser does not support Speech APIs. Please use Chrome or Edge.')
      setAiState('error')
      return
    }

    try {
      // 1. Prepare message
      setAiState('preparing')
      setActiveLeadId(leadId)
      setErrorMsg(null)
      setTranscript('')

      const token = await getAuthToken()
      if (!token) {
        throw new Error('Authentication required')
      }

      const res = await apiClient.get(`/api/supraleo/prepare-message/${leadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = res.data?.data || res.data

      const msgContext: MessageContext = {
        leadId: data.leadId,
        sender: data.sender?.name || 'Unknown',
        senderEmail: data.sender?.email || '',
        subject: data.subject || '(No subject)',
        snippet: data.snippet || '',
        status: data.status,
        canReply: data.canReply,
        speechScript: data.speechScript,
      }
      setActiveMessage(msgContext)

      // 2. Read message aloud
      setAiState('reading')
      await new Promise<void>((resolve) => {
        speak(msgContext.speechScript, resolve)
      })

      // 3. Prompt for command
      if (msgContext.canReply) {
        setAiState('prompting')
        await new Promise<void>((resolve) => {
          speak(
            "You can say 'Reply' to continue the conversation, or say 'Stop' to close the AI assistance.",
            resolve
          )
        })

        // 4. Listen for command
        setAiState('listening')
        const command = await listenForCommand()

        if (command.includes('reply') || command.includes('respond') || command.includes('answer')) {
          // 5. Start reply dictation
          setAiState('listening-reply')
          speak("I'm listening. Please dictate your reply.")

          // Small delay for the prompt to finish
          await new Promise(r => setTimeout(r, 2500))

          const replyText = await listenForReply()
          setTranscript(replyText)

          if (replyText.trim()) {
            // Show transcript and wait for user confirmation via UI
            // (The panel will show the transcript with Send/Edit/Cancel buttons)
            setAiState('done')
          } else {
            speak("I didn't catch that. You can type your reply manually or try again.")
            setAiState('done')
          }
        } else {
          // User said "stop" or something else
          speak("Okay, closing AI assistance.")
          await new Promise(r => setTimeout(r, 1500))
          setAiState('idle')
          setActiveLeadId(null)
          setActiveMessage(null)
        }
      } else {
        // Lead is closed, can't reply
        speak("This inquiry is closed. No reply can be sent.")
        await new Promise(r => setTimeout(r, 2500))
        setAiState('done')
      }
    } catch (err: any) {
      console.error('[SupraLeo] Error:', err)
      setErrorMsg(err?.response?.data?.message || err.message || 'An error occurred')
      setAiState('error')
    }
  }, [isBrowserSupported, getAuthToken, apiClient, speak, listenForCommand, listenForReply])

  // ── Read arbitrary text ────────────────────────────────────────────────

  const readText = React.useCallback((text: string, context?: Partial<MessageContext>) => {
    if (!isBrowserSupported) {
      setErrorMsg('Browser not supported')
      setAiState('error')
      return
    }

    setAiState('reading')
    setErrorMsg(null)
    if (context) {
      setActiveMessage({
        leadId: context.leadId || '',
        sender: context.sender || 'Unknown',
        senderEmail: context.senderEmail || '',
        subject: context.subject || '',
        snippet: text.substring(0, 200),
        status: context.status || '',
        canReply: context.canReply ?? false,
        speechScript: text,
      })
    }

    speak(text, () => {
      setAiState('done')
    })
  }, [isBrowserSupported, speak])

  // ── Stop ───────────────────────────────────────────────────────────────

  const stop = React.useCallback(() => {
    speechSynthesis.cancel()
    recognitionRef.current?.abort()
    recognitionRef.current = null
    setAiState('idle')
    setActiveLeadId(null)
    setActiveMessage(null)
    setTranscript('')
    setErrorMsg(null)
  }, [])

  // ── Pause / Resume ─────────────────────────────────────────────────────

  const pause = React.useCallback(() => {
    speechSynthesis.pause()
    setAiState('paused')
  }, [])

  const resume = React.useCallback(() => {
    speechSynthesis.resume()
    setAiState('reading')
  }, [])

  // ── Start Reply Listening (manual trigger) ─────────────────────────────

  const startReplyListening = React.useCallback(async () => {
    if (!isBrowserSupported) return

    setAiState('listening-reply')
    setTranscript('')

    try {
      speak("I'm listening. Please dictate your reply.")
      await new Promise(r => setTimeout(r, 2500))

      const replyText = await listenForReply()
      setTranscript(replyText)
      setAiState('done')
    } catch (err: any) {
      setErrorMsg(err.message || 'Voice recognition failed')
      setAiState('error')
    }
  }, [isBrowserSupported, speak, listenForReply])

  // ── Send Reply ─────────────────────────────────────────────────────────

  const sendReply = React.useCallback(async () => {
    if (!activeLeadId || !transcript.trim()) return

    try {
      setAiState('sending')
      const token = await getAuthToken()
      if (!token) throw new Error('Authentication required')

      await apiClient.post(
        `/api/leads/${activeLeadId}/reply`,
        { message: transcript.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      speak("Reply sent successfully.")
      onReplySent?.(activeLeadId, transcript.trim())

      await new Promise(r => setTimeout(r, 2000))
      setTranscript('')
      setAiState('done')
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err.message || 'Failed to send reply')
      setAiState('error')
    }
  }, [activeLeadId, transcript, getAuthToken, apiClient, speak, onReplySent])

  // ── Dismiss ────────────────────────────────────────────────────────────

  const dismiss = React.useCallback(() => {
    speechSynthesis.cancel()
    recognitionRef.current?.abort()
    recognitionRef.current = null
    setAiState('idle')
    setTranscript('')
    setErrorMsg(null)
    // Keep activeLeadId and activeMessage for context
  }, [])

  // ── Context value ──────────────────────────────────────────────────────

  const value = React.useMemo<SupraLeoContextValue>(() => ({
    aiState,
    activeLeadId,
    activeMessage,
    errorMsg,
    voiceName,
    transcript,
    isBrowserSupported,
    readMessage,
    readText,
    stop,
    pause,
    resume,
    startReplyListening,
    setTranscript,
    sendReply,
    dismiss,
  }), [
    aiState, activeLeadId, activeMessage, errorMsg, voiceName,
    transcript, isBrowserSupported, readMessage, readText, stop,
    pause, resume, startReplyListening, sendReply, dismiss,
  ])

  return (
    <SupraLeoContext.Provider value={value}>
      {children}
    </SupraLeoContext.Provider>
  )
}