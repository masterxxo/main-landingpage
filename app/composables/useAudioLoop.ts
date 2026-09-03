const AUDIO_SRC = '/sound/main_theme.mp3'
const AUDIO_VOLUME = 0.1

let audioElement: HTMLAudioElement | null = null

function ensureAudioElement(): HTMLAudioElement | null {
  if (import.meta.server) return null

  if (!audioElement) {
    audioElement = new Audio(AUDIO_SRC)
    audioElement.loop = true
    audioElement.preload = 'none'
    audioElement.volume = AUDIO_VOLUME
  }

  return audioElement
}

export function useAudioLoop() {
  const isPlaying = useState<boolean>('audio-loop-playing', () => false)

  async function play(): Promise<void> {
    const element = ensureAudioElement()
    if (!element) return

    try {
      await element.play()
      isPlaying.value = true
    }
    catch {
      isPlaying.value = false
    }
  }

  function pause(): void {
    const element = ensureAudioElement()
    if (!element) return

    element.pause()
    isPlaying.value = false
  }

  function toggle(): void {
    if (isPlaying.value) pause()
    else void play()
  }

  return {
    isPlaying,
    play,
    pause,
    toggle,
  }
}
