import type { Ref } from 'vue'

interface ScrambleRevealOptions {
  threshold?: number
  delay?: number
  rootMargin?: string
  once?: boolean
}

interface ScrambleTarget {
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
export function useScrambleReveal(options: ScrambleRevealOptions = {}) {
  const {
    threshold = 0.4,
    delay = 0,
    rootMargin = '0px',
    once = true,
  } = options

  const target = ref(null) as Ref<ScrambleTarget | null>

  let observer: IntersectionObserver | null = null
  let timer = 0

  function cleanup() {
    if (observer) {
      observer.disconnect()
      observer = null
    }
    if (timer) {
      clearTimeout(timer)
      timer = 0
    }
  }

  watch(target, (instance) => {
    cleanup()
    if (!instance) return

    const el = (instance as unknown as { $el?: Element }).$el
    if (!el || !(el instanceof Element)) return

    if (typeof IntersectionObserver === 'undefined') {
      instance.start()
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue

          if (timer) clearTimeout(timer)
          timer = window.setTimeout(() => instance.start(), delay)

          if (once) cleanup()
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
 *   <ScrambleLink v-for="(r, i) in items" :key="i" :ref="r" ... />
 */
export function useScrambleRevealGroup(
  count: number,
  options: ScrambleRevealOptions & { gap?: number } = {},
) {
  const { gap = 150, ...rest } = options

  return Array.from({ length: count }, (_, i) =>
    useScrambleReveal({ ...rest, delay: (rest.delay ?? 0) + i * gap }))
}