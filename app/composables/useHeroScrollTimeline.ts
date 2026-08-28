import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { ComputedRef, Ref } from 'vue'
import { HERO_CLIP_FINAL, HERO_CLIP_INITIAL } from '~/constants/heroClipPaths'
import { DESKTOP_MIN_WIDTH, HERO_CARD, HERO_TIMELINE } from '~/constants/heroLayout'

export interface HeroScrollElements {
  section: Ref<HTMLElement | null>
  card: Ref<HTMLElement | null>
  clipPath: Ref<SVGPathElement | null>
  borderPath: Ref<SVGPathElement | null>
  labels: Ref<HTMLElement | null>
  title: Ref<HTMLElement | null>
  smallPlaceholder: Ref<HTMLElement | null>
  sidePlaceholder: Ref<HTMLElement | null>
  annotation: Ref<HTMLElement | null>
}

interface HeroScrollHooks {
  /** Wołane, gdy powstaje wersja desktopowa (scroll aktywny). */
  onActivate?: () => void
  /** Wołane, gdy wersja desktopowa jest niszczona (zmiana breakpointu / reduced-motion). */
  onDeactivate?: () => void
}

export interface HeroScrollTimeline {
  /** Reduced-motion na szerokim ekranie → renderujemy statyczny układ końcowy. */
  isStaticLayout: Ref<boolean>
  /** Kształt maski/obrysu karty w stanie spoczynku (zależny od trybu). */
  restingCardPath: ComputedRef<string>
  /** Postęp scrollowego timeline (0–1); 0 gdy timeline nie istnieje. */
  getProgress: () => number
}

/**
 * Buduje i utrzymuje scrollowo-scrubowany timeline sceny hero (zjazd karty,
 * morfowanie kształtu, wjazd tytułu i kadrów) wraz z responsywnym cyklem życia:
 * pełna wersja tylko dla `min-width: DESKTOP_MIN_WIDTH` bez reduced-motion,
 * w pozostałych przypadkach timeline nie powstaje.
 */
export function useHeroScrollTimeline(
  els: HeroScrollElements,
  hooks: HeroScrollHooks = {},
): HeroScrollTimeline {
  const isStaticLayout = ref(false)
  const restingCardPath = computed(
    () => (isStaticLayout.value ? HERO_CLIP_FINAL : HERO_CLIP_INITIAL),
  )

  let timeline: gsap.core.Timeline | null = null
  let desktopQuery: MediaQueryList | null = null
  let staticQuery: MediaQueryList | null = null

  function getProgress(): number {
    return timeline?.progress() ?? 0
  }

  function syncRestingPath(): void {
    els.clipPath.value?.setAttribute('d', restingCardPath.value)
    els.borderPath.value?.setAttribute('d', restingCardPath.value)
  }

  function build(): void {
    const { section, card, clipPath, borderPath, labels } = els
    const { title, smallPlaceholder, sidePlaceholder, annotation } = els

    // Wszystkie ref-y to bezwarunkowe elementy template — guard chroni tylko
    // przed wywołaniem przed mountem.
    if (
      !section.value || !card.value || !clipPath.value || !borderPath.value
      || !labels.value || !title.value || !smallPlaceholder.value
      || !sidePlaceholder.value || !annotation.value
    ) return

    gsap.set([title.value, smallPlaceholder.value, sidePlaceholder.value, annotation.value], {
      autoAlpha: 0,
    })
    clipPath.value.setAttribute('d', HERO_CLIP_INITIAL)
    borderPath.value.setAttribute('d', HERO_CLIP_INITIAL)

    timeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section.value,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        invalidateOnRefresh: true,
      },
    })

    timeline
      .to(labels.value, {
        autoAlpha: 0,
        y: -30,
        duration: HERO_TIMELINE.labelsOut.duration,
      }, HERO_TIMELINE.labelsOut.start)
      .to(card.value, {
        width: () => Math.min(window.innerWidth * HERO_CARD.widthRatio, HERO_CARD.maxWidth),
        height: HERO_CARD.height,
        left: () => window.innerWidth * HERO_CARD.leftRatio,
        top: () => window.innerHeight * HERO_CARD.topRatio,
        duration: HERO_TIMELINE.reshape.duration,
      }, HERO_TIMELINE.reshape.start)
      // Maska (clip-path) i widoczny obrys morfują JEDNYM tweenem, żeby nie mogły
      // się rozjechać — dlatego HERO_CLIP_INITIAL/FINAL mają identyczny zestaw komend.
      .to([clipPath.value, borderPath.value], {
        attr: { d: HERO_CLIP_FINAL },
        duration: HERO_TIMELINE.reshape.duration,
      }, HERO_TIMELINE.reshape.start)
      .fromTo(title.value, { y: 36 }, {
        autoAlpha: 1,
        y: 0,
        duration: HERO_TIMELINE.title.duration,
      }, HERO_TIMELINE.title.start)
      .fromTo(smallPlaceholder.value, { x: -80 }, {
        autoAlpha: 1,
        x: 0,
        duration: HERO_TIMELINE.smallPlaceholder.duration,
      }, HERO_TIMELINE.smallPlaceholder.start)
      .fromTo(sidePlaceholder.value, { x: 140 }, {
        autoAlpha: 1,
        x: 0,
        duration: HERO_TIMELINE.sidePlaceholder.duration,
      }, HERO_TIMELINE.sidePlaceholder.start)
      .to(annotation.value, {
        autoAlpha: 1,
        duration: HERO_TIMELINE.annotation.duration,
      }, HERO_TIMELINE.annotation.start)
  }

  function teardown(): void {
    timeline?.scrollTrigger?.kill()
    timeline?.kill()
    timeline = null

    // Kształt spoczynkowy zależy od trybu (statyczny układ → od razu finalny).
    syncRestingPath()

    // Czyścimy tylko to, co timeline animuje. `clearProps: 'all'` zdejmowało też
    // niezwiązane style inline (np. clip-path zaślepek → prostokątne tło dookoła).
    for (const node of [
      els.card, els.labels, els.title,
      els.smallPlaceholder, els.sidePlaceholder, els.annotation,
    ]) {
      if (node.value) {
        gsap.set(node.value, { clearProps: 'opacity,visibility,transform,width,height,top,left' })
      }
    }
  }

  function handleDesktopChange(event: MediaQueryListEvent | MediaQueryList): void {
    teardown()
    hooks.onDeactivate?.()
    if (event.matches) {
      build()
      hooks.onActivate?.()
    }
  }

  function handleStaticChange(event: MediaQueryListEvent): void {
    isStaticLayout.value = event.matches
    syncRestingPath()
  }

  onMounted(() => {
    gsap.registerPlugin(ScrollTrigger)

    staticQuery = window.matchMedia(
      `(min-width: ${DESKTOP_MIN_WIDTH}px) and (prefers-reduced-motion: reduce)`,
    )
    isStaticLayout.value = staticQuery.matches
    staticQuery.addEventListener('change', handleStaticChange)

    desktopQuery = window.matchMedia(
      `(min-width: ${DESKTOP_MIN_WIDTH}px) and (prefers-reduced-motion: no-preference)`,
    )
    handleDesktopChange(desktopQuery)
    desktopQuery.addEventListener('change', handleDesktopChange)
  })

  onBeforeUnmount(() => {
    staticQuery?.removeEventListener('change', handleStaticChange)
    desktopQuery?.removeEventListener('change', handleDesktopChange)
    teardown()
  })

  return { isStaticLayout, restingCardPath, getProgress }
}
