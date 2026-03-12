import * as React from 'react'

type SpeakState = 'speaking' | 'fetching' | 'sending' | 'listening' | 'listening-reply' | 'waiting-command' | 'error' | 'idle'

interface Props { state: SpeakState; onClick: () => void; size?: 'sm' | 'md' | 'lg' }

const SIZE = {
  sm: { btn: 'h-12 w-12', icon: 'text-xl', ring1: '-inset-1', ring2: '-inset-2.5' },
  md: { btn: 'h-16 w-16', icon: 'text-3xl', ring1: '-inset-1.5', ring2: '-inset-3' },
  lg: { btn: 'h-24 w-24', icon: 'text-5xl', ring1: '-inset-2', ring2: '-inset-4' },
}

export function SupraLeoAvatar({ state, onClick, size = 'md' }: Props) {
  const isSpeaking  = state === 'speaking'
  const isFetching  = state === 'fetching' || state === 'sending'
  const isListening = state === 'listening' || state === 'listening-reply'
  const isWaiting   = state === 'waiting-command'
  const isError     = state === 'error'
  const s = SIZE[size]

  const stateConfig = isError
    ? { bg: 'from-red-500 via-rose-500 to-red-700', glow: 'shadow-red-500/50', border: 'border-red-400/60', ring: 'ring-red-400/40' }
    : isListening
    ? { bg: 'from-emerald-400 via-green-500 to-teal-600', glow: 'shadow-emerald-400/60', border: 'border-emerald-300/70', ring: 'ring-emerald-400/40' }
    : isWaiting
    ? { bg: 'from-green-400 via-emerald-500 to-green-700', glow: 'shadow-green-400/50', border: 'border-green-300/60', ring: 'ring-green-400/40' }
    : isSpeaking
    ? { bg: 'from-lime-400 via-green-500 to-emerald-700', glow: 'shadow-lime-400/60', border: 'border-lime-300/60', ring: 'ring-lime-400/40' }
    : isFetching
    ? { bg: 'from-teal-400 via-green-500 to-teal-700', glow: 'shadow-teal-400/50', border: 'border-teal-300/60', ring: 'ring-teal-400/40' }
    : { bg: 'from-green-400 via-emerald-500 to-green-800', glow: 'shadow-green-500/40', border: 'border-green-300/50', ring: 'ring-green-400/30' }

  const icon = isError ? '⚠️' : isFetching ? '' : isListening ? '🎙️' : isWaiting ? '✅' : '🦁'

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Outer ambient glow ring */}
      {(isSpeaking || isListening) && (
        <span className={`absolute ${s.ring2} rounded-full bg-gradient-to-br ${stateConfig.bg} opacity-20 animate-ping [animation-duration:1.8s]`} />
      )}
      {/* Mid pulse ring */}
      {(isSpeaking || isListening || isWaiting) && (
        <span className={`absolute ${s.ring1} rounded-full bg-gradient-to-br ${stateConfig.bg} opacity-30 animate-ping [animation-duration:1.2s] [animation-delay:0.2s]`} />
      )}

      <button
        onClick={onClick}
        aria-label="Supra Leo AI"
        className={`
          relative flex items-center justify-center rounded-full
          bg-gradient-to-br ${stateConfig.bg}
          border ${stateConfig.border}
          shadow-xl ${stateConfig.glow}
          ring-2 ${stateConfig.ring}
          backdrop-blur-sm
          transition-all duration-300 ease-out
          hover:scale-105 hover:shadow-2xl active:scale-95
          focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-300/60
          select-none cursor-pointer
          ${s.btn}
        `}
        style={{
          boxShadow: `0 0 24px 4px rgba(52,211,153,0.25), 0 4px 16px rgba(0,0,0,0.3)`,
        }}
      >
        {/* Inner gloss overlay */}
        <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 via-transparent to-black/10 pointer-events-none" />

        {/* Spinning fetch indicator */}
        {isFetching && (
          <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-white/90 border-r-white/40 animate-spin" />
        )}

        {/* Waiting gentle breathe */}
        {isWaiting && (
          <span className="absolute inset-0 rounded-full bg-white/10 animate-pulse [animation-duration:2s]" />
        )}

        {/* Icon */}
        <span className={`relative z-10 leading-none drop-shadow-md ${s.icon}`}>
          {isFetching
            ? <span className="block h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            : icon}
        </span>
      </button>

      {/* Status dot */}
      <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white/80 shadow-sm ${
        isError ? 'bg-red-400' :
        isListening ? 'bg-emerald-300 animate-pulse' :
        isSpeaking ? 'bg-lime-300 animate-pulse' :
        isFetching ? 'bg-teal-300 animate-pulse' :
        isWaiting ? 'bg-green-300' :
        'bg-green-400'
      }`} />
    </div>
  )
}

// Demo
export default function Demo() {
  const states: SpeakState[] = ['idle', 'listening', 'speaking', 'fetching', 'waiting-command', 'error']
  const [active, setActive] = React.useState<SpeakState>('idle')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-12 bg-gray-950 font-sans">
      <div className="text-center">
        <p className="text-green-400/60 text-xs tracking-[0.3em] uppercase mb-2 font-mono">Supra Leo</p>
        <SupraLeoAvatar state={active} onClick={() => {}} size="lg" />
        <p className="mt-4 text-white/40 text-sm font-mono">{active}</p>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        {states.map(s => (
          <button
            key={s}
            onClick={() => setActive(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-mono border transition-all duration-200
              ${active === s
                ? 'bg-green-500/20 border-green-400/60 text-green-300'
                : 'bg-white/5 border-white/10 text-white/40 hover:border-green-500/40 hover:text-white/70'
              }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-6 items-end">
        {(['sm', 'md', 'lg'] as const).map(sz => (
          <div key={sz} className="flex flex-col items-center gap-2">
            <SupraLeoAvatar state={active} onClick={() => {}} size={sz} />
            <span className="text-white/20 text-xs font-mono">{sz}</span>
          </div>
        ))}
      </div>
    </div>
  )
}