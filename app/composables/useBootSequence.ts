export type BootPhase = 'loading' | 'intro' | 'reveal' | 'ready'

export function useBoot() {
  const phase = useState<BootPhase>('boot-phase', () => 'loading')
  const progress = useState<number>('boot-progress', () => 0)
  const isHeroReady = useState<boolean>('boot-hero-ready', () => false)

  const isRevealed = computed(
    () => phase.value === 'reveal' || phase.value === 'ready',
  )

  const isVideoVisible = computed(
    () => phase.value === 'intro' || phase.value === 'reveal',
  )

  function toIntro() {
    if (phase.value === 'loading') {
      isHeroReady.value = false
      phase.value = 'intro'
    }
  }

  function toReveal() {
    if (phase.value === 'intro') phase.value = 'reveal'
  }

  function toReady() {
    phase.value = 'ready'
  }

  function toHeroReady() {
    // Ustawiamy dopiero, gdy sekwencja bootowa faktycznie odsłoniła hero.
    if (phase.value === 'reveal' || phase.value === 'ready') {
      isHeroReady.value = true
    }
  }

  return {
    phase,
    progress,
    isHeroReady,
    isRevealed,
    isVideoVisible,
    toIntro,
    toReveal,
    toReady,
    toHeroReady,
  }
}

export function preloadAssets(
  urls: string[],
  onProgress: (value: number) => void,
): Promise<void[]> {
  let done = 0

  const bump = () => {
    done += 1
    onProgress(done / urls.length)
  }

  return Promise.all(
    urls.map(url => new Promise<void>((resolve) => {
      const isVideo = /\.(mp4|webm|mov)$/i.test(url)

      if (isVideo) {
        const video = document.createElement('video')
        video.preload = 'auto'
        video.muted = true
        video.src = url

        const finish = () => {
          bump()
          resolve()
        }

        video.addEventListener('canplaythrough', finish, { once: true })
        video.addEventListener('error', finish, { once: true })
        video.load()
      }
      else {
        const img = new Image()
        img.src = url
        img.decode()
          .then(() => { bump(); resolve() })
          .catch(() => { bump(); resolve() })
      }
    })),
  )
}
