import type { Ref } from 'vue'

interface ScrambleRevealOptions {
  threshold?: number
  delay?: number
  rootMargin?: string
  once?: boolean
}

export interface ScrambleTarget {
  $el?: Element
  start: () => void
  stop: () => void
}

/**
 * Odpala animację ScrambleLink, gdy element wjedzie w viewport.
 *
 *   const heading = useScrambleReveal()
 *   <ScrambleLink :ref="heading" text="APPS" :hover="false" />
 *
 * Zwrócony ref podpinasz przez `:ref="..."` (nie `ref="..."`).
 */
export function useScrambleReveal(
  options: ScrambleRevealOptions = {},
): Ref<ScrambleTarget | null> {
  const {
    threshold = 0.4,
    delay = 0,
    rootMargin = '0px',
    once = true,
  } = options

  const target = ref(null) as Ref<ScrambleTarget | null>

  let observer: IntersectionObserver | null = null
  let timer = 0

  function cleanup(): void {
    if (observer) {
      observer.disconnect()
      observer = null
    }
    if (timer) {
      clearTimeout(timer)
      timer = 0
    }
  }

  function scheduleStart(instance: ScrambleTarget): void {
    if (timer) clearTimeout(timer)
    timer = window.setTimeout(() => {
      timer = 0
      instance.start()
    }, delay)
  }

  watch(target, (instance) => {
    cleanup()
    if (!instance) return

    const el = instance.$el
    if (!el || !(el instanceof Element)) return

    if (typeof IntersectionObserver === 'undefined') {
      scheduleStart(instance)
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue

          scheduleStart(instance)

          if (once && observer) {
            observer.disconnect()
            observer = null
          }
        }
      },
      { threshold, rootMargin },
    )

    observer.observe(el)
  })

  onBeforeUnmount(cleanup)

  return target
}

/**
 * Wersja dla grupy napisów — każdy kolejny startuje z opóźnieniem.
 *
 *   const items = useScrambleRevealGroup(3, { gap: 180 })
 *   const setItemRef = (i, instance) => { items[i].value = instance }
 *   <ScrambleLink v-for="(_, i) in items" :key="i" :ref="el => setItemRef(i, el)" ... />
 */
export function useScrambleRevealGroup(
  count: number,
  options: ScrambleRevealOptions & { gap?: number } = {},
): Array<Ref<ScrambleTarget | null>> {
  const { gap = 150, ...rest } = options

  return Array.from({ length: count }, (_, i) =>
    useScrambleReveal({ ...rest, delay: (rest.delay ?? 0) + i * gap }))
}
