import * as React from 'react'
import { SpeakState } from '@/hooks/useSupraLeoAI'

interface Props { state: SpeakState; onClick: () => void; size?: 'sm' | 'md' | 'lg' }

const SIZE = { sm: 'h-10 w-10 text-lg', md: 'h-14 w-14 text-2xl', lg: 'h-20 w-20 text-4xl' }

export function SupraLeoAvatar({ state, onClick, size = 'md' }: Props) {
  const isSpeaking  = state === 'speaking'
  const isFetching  = state === 'fetching' || state === 'sending'
  const isListening = state === 'listening' || state === 'listening-reply'
  const isWaiting   = state === 'waiting-command'
  const isError     = state === 'error'

  const bgClass = isError
    ? 'bg-rose-600 border-rose-400 hover:bg-rose-700'
    : isListening
      ? 'bg-gradient-to-br from-emerald-500 to-teal-700 border-emerald-400'
      : isWaiting
        ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 border-emerald-400'
        : isSpeaking
          ? 'bg-gradient-to-br from-violet-600 to-indigo-700 border-violet-400'
          : 'bg-gradient-to-br from-violet-500 to-purple-700 border-violet-400 hover:from-violet-600'

  return (
    <button onClick={onClick} aria-label="Supra Leo AI"
      className={`relative flex items-center justify-center rounded-full shadow-lg border-2 transition-all duration-300 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${SIZE[size]} ${bgClass}`}>
      {isSpeaking && (<><span className="absolute inset-0 rounded-full bg-violet-400/30 animate-ping" /><span className="absolute -inset-1 rounded-full bg-violet-400/15 animate-ping [animation-delay:0.3s]" /></>)}
      {isListening && (<><span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" /><span className="absolute -inset-1 rounded-full bg-emerald-400/15 animate-ping [animation-delay:0.3s]" /></>)}
      {isWaiting && <span className="absolute inset-0 rounded-full bg-emerald-400/20 animate-pulse" />}
      {isFetching && <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-white/80 animate-spin" />}
      <span className="relative z-10 leading-none">{isError ? '⚠️' : isFetching ? '⏳' : isListening ? '🎙️' : isWaiting ? '✅' : '🦁'}</span>
    </button>
  )
}