import { HERO_LABELS } from '~/constants/heroLayout'
import type { ScrambleTarget } from '~/composables/useScrambleReveal'

interface HeroLabelRevealOptions {
  /** Teksty labeli — długość tekstu wyznacza czas trwania każdej animacji. */
  texts: string[]
  /** Wołane, gdy ostatni label skończył się rozsypywać. */
  onComplete?: () => void
}

function visibleCharCount(text: string): number {
  return text.replace(/\s/g, '').length
}

/**
 * Sekwencyjne odsłanianie labeli hero: kontener wjeżdża, a potem każdy label
 * po kolei „rozsypuje się" (ScrambleLink). Kolejny startuje dopiero, gdy
 * poprzedni skończył — stąd czas liczony z długości tekstu i `scrambleMsPerChar`.
 */
export function useHeroLabelReveal({ texts, onComplete }: HeroLabelRevealOptions) {
  const containerShown = ref(false)
  const indexVisible = ref<boolean[]>(texts.map(() => false))
  const targets: Array<ScrambleTarget | null> = texts.map(() => null)
  const timers: number[] = []

  function setTarget(index: number, instance: unknown): void {
    targets[index] = instance as ScrambleTarget | null
  }

  async function play(): Promise<void> {
    containerShown.value = true
    await nextTick()

    let delay = HERO_LABELS.startDelay

    texts.forEach((text, index) => {
      timers.push(window.setTimeout(() => {
        indexVisible.value[index] = true
        targets[index]?.start()
      }, delay))

      delay += visibleCharCount(text) * HERO_LABELS.scrambleMsPerChar + HERO_LABELS.gapMs
    })

    // Callback dopiero po tym, jak ostatni label dobiegł końca.
    timers.push(window.setTimeout(() => onComplete?.(), delay))
  }

  onBeforeUnmount(() => {
    timers.forEach(id => clearTimeout(id))
  })

  return { containerShown, indexVisible, setTarget, play }
}
