// ─── Supra Leo AI · Text-to-Speech Utility ───────────────────────────────────
// Completely standalone. Zero imports from existing codebase.
// Selects the best available male voice via browser SpeechSynthesis API.

export interface TTSOptions {
  rate?: number    // 0.1–10   (default 0.95)
  pitch?: number   // 0–2      (default 0.82 — lower = more male)
  volume?: number  // 0–1      (default 1)
}

// Male voice preference keywords (checked in priority order)
const MALE_VOICE_KEYWORDS = [
  'david', 'james', 'daniel', 'alex', 'thomas', 'george',
  'fred', 'bruce', 'albert', 'male', 'man',
]

let _cachedVoice: SpeechSynthesisVoice | null = null

function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) return resolve(voices)
    window.speechSynthesis.onvoiceschanged = () =>
      resolve(window.speechSynthesis.getVoices())
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1500)
  })
}

export async function selectMaleVoice(): Promise<SpeechSynthesisVoice | null> {
  if (_cachedVoice) return _cachedVoice
  const voices = await waitForVoices()
  if (!voices.length) return null

  for (const kw of MALE_VOICE_KEYWORDS) {
    const found = voices.find(v => v.name.toLowerCase().includes(kw))
    if (found) { _cachedVoice = found; return found }
  }

  const enVoice = voices.find(v => v.lang.startsWith('en'))
  if (enVoice) { _cachedVoice = enVoice; return enVoice }

  _cachedVoice = voices[0]
  return voices[0]
}

// Chunk text to avoid Chrome's silent cutoff bug on long texts
function chunkText(text: string, maxWords = 40): string[] {
  const words = text.split(' ')
  const chunks: string[] = []
  let current: string[] = []

  for (const word of words) {
    current.push(word)
    if (current.length >= maxWords) {
      chunks.push(current.join(' '))
      current = []
    }
  }
  if (current.length) chunks.push(current.join(' '))
  return chunks
}

export async function speakText(
  text: string,
  opts: TTSOptions = {},
  onEnd?: () => void,
  onError?: (e: SpeechSynthesisErrorEvent) => void,
): Promise<() => void> {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('[SupraLeoAI] SpeechSynthesis not supported.')
    onEnd?.()
    return () => {}
  }

  window.speechSynthesis.cancel()
  const voice = await selectMaleVoice()
  const chunks = chunkText(text)
  let chunkIndex = 0

  const speakChunk = () => {
    if (chunkIndex >= chunks.length) { onEnd?.(); return }

    const utt = new SpeechSynthesisUtterance(chunks[chunkIndex++])
    if (voice) utt.voice = voice
    utt.rate   = opts.rate   ?? 0.95
    utt.pitch  = opts.pitch  ?? 0.82
    utt.volume = opts.volume ?? 1.0
    utt.lang   = voice?.lang ?? 'en-US'
    utt.onend  = speakChunk
    utt.onerror = (e) => { onError?.(e); onEnd?.() }

    window.speechSynthesis.speak(utt)
  }

  speakChunk()
  return () => window.speechSynthesis.cancel()
}

export function cleanEmailBody(html: string): string {
  if (!html) return ''
  return html
    .replace(/<!doctype[^>]*>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/\s{2,}/g, ' ')
    .trim()
}