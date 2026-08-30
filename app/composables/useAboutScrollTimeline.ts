import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { ComputedRef, Ref } from 'vue'
import { HERO_CLIP_FINAL } from '~/constants/heroClipPaths'
import {
  ABOUT_CARD_FINAL,
  ABOUT_CARD_START,
  ABOUT_TIMELINE,
  DESKTOP_MIN_WIDTH,
} from '~/constants/aboutLayout'

export interface AboutScrollElements {
  section: Ref<HTMLElement | null>
  /** Warstwa kadru — nosi `clip-path` (kształt ramki hero) i layout (w/h/top/left). */
  card: Ref<HTMLElement | null>
  /** Postęp „wejścia" shaderu kadru: 1 = kadr hero, 0 = zoom out + obrót bokiem. */
  frontReveal: Ref<number>
  /** `true` → shader kadru pokazuje rewers (`about_img.jpeg`). */
  showSecond: Ref<boolean>
  /** <path> maski `clip-path` kadru (kształt stały, tylko skalowany z kadrem). */
  clipPath: Ref<SVGPathElement | null>
  /** <path> widocznego obrysu ramki. */
  borderPath: Ref<SVGPathElement | null>
  /** Cały <svg> obrysu — wygaszany, gdy kadr jest na pełny ekran (ramka się rozjeżdża). */
  border: Ref<HTMLElement | SVGElement | null>
  /** Czarne tło sekcji — pełne krycie, odsłaniane razem z `.about-stage`. */
  bg: Ref<HTMLElement | null>
  /** Etykieta „IMAGE / 03" w rogu kadru (ciągłość z kartą hero). */
  annotation: Ref<HTMLElement | null>
  /** Pionowy napis „ROGSON" po lewej stronie kadru. */
  sideLabel: Ref<HTMLElement | null>
  /** Miejsce na opis po prawej stronie kadru. */
  copy: Ref<HTMLElement | null>
}

interface AboutScrollHooks {
  onActivate?: () => void
  onDeactivate?: () => void
}

export interface AboutScrollTimeline {
  /** Reduced-motion na szerokim ekranie → statyczny układ końcowy. */
  isStaticLayout: Ref<boolean>
  /** Kształt maski/obrysu kadru (kształt ramki hero — stały przez całe przejście). */
  restingCardPath: ComputedRef<string>
}

/** Docelowa geometria kadru (rewers ~1/3 ekranu, wyśrodkowany). */
function finalCardRect() {
  const width = Math.min(window.innerWidth * ABOUT_CARD_FINAL.widthRatio, ABOUT_CARD_FINAL.maxWidth)
  const height = window.innerHeight * ABOUT_CARD_FINAL.heightRatio
  return {
    width,
    height,
    left: (window.innerWidth - width) / 2,
    top: (window.innerHeight - height) / 2,
  }
}

/** Startowa geometria kadru — pokrywa się z końcowym stanem karty hero. */
function startCardRect() {
  return {
    width: Math.min(window.innerWidth * ABOUT_CARD_START.widthRatio, ABOUT_CARD_START.maxWidth),
    height: ABOUT_CARD_START.height,
    left: window.innerWidth * ABOUT_CARD_START.leftRatio,
    top: window.innerHeight * ABOUT_CARD_START.topRatio,
  }
}

/**
 * Scrollowo-scrubowany timeline sekcji ABOUT w dwóch fazach:
 *  1. kadr DOM rośnie do pełnego ekranu, a shader (ten sam co środkowa karta
 *     hero) odgrywa wejście hero WSTECZ — `reveal` 1 → 0 (zoom out + obrót
 *     wokół pionowej osi), w połowie podmiana tekstury na rewers, potem
 *     `reveal` 0 → 1 z rewersem: `about_img.jpeg` na całą stronę;
 *  2. rewers zjeżdża w dół i zmniejsza się do ~1/3 ekranu, wjeżdżają „ROGSON"
 *     i miejsce na opis.
 * Cykl życia (desktop / reduced-motion) analogicznie do `useHeroScrollTimeline`.
 */
export function useAboutScrollTimeline(
  els: AboutScrollElements,
  hooks: AboutScrollHooks = {},
): AboutScrollTimeline {
  const isStaticLayout = ref(false)
  const restingCardPath = computed(() => HERO_CLIP_FINAL)

  let timeline: gsap.core.Timeline | null = null
  let desktopQuery: MediaQueryList | null = null
  let staticQuery: MediaQueryList | null = null

  function applyStartState(): void {
    const { card, clipPath, borderPath, border, annotation, bg, sideLabel, copy } = els
    if (!card.value) return

    // Kadr startuje 1:1 jak środkowa karta hero w spoczynku, awersem do przodu.
    gsap.set(card.value, { ...startCardRect() })
    els.frontReveal.value = 1
    els.showSecond.value = false
    clipPath.value?.setAttribute('d', HERO_CLIP_FINAL)
    borderPath.value?.setAttribute('d', HERO_CLIP_FINAL)
    gsap.set([border.value, annotation.value].filter(Boolean), { autoAlpha: 1 })
    gsap.set([sideLabel.value, copy.value].filter(Boolean), { autoAlpha: 0 })
    // Tło jest pełne (opacity 1) — o jego widoczności decyduje `visibility`
    // na `.about-stage` (klasa `.is-live`), nie krycie.
    gsap.set(bg.value, { opacity: 1 })
  }

  function build(): void {
    const { section, card, clipPath, borderPath, border, annotation, sideLabel, copy } = els

    if (
      !section.value || !card.value || !clipPath.value || !borderPath.value
      || !border.value || !annotation.value || !sideLabel.value || !copy.value
    ) return

    applyStartState()

    const { expand, flip, shrink, copyIn } = ABOUT_TIMELINE

    // Jeden monotoniczny „suwak obrotu" 0→1 przez `expand`+`flip`:
    //   t 0→0.5  → reveal 1→0 (zoom out + obrót bokiem), awers
    //   t = 0.5  → podmiana tekstury na rewers
    //   t 0.5→1  → reveal 0→1 (powrót frontem do coveru), rewers
    // Odczyt z `t` w onUpdate jest odporny na scrub w obie strony.
    const flipProxy = { t: 0 }
    const applyFlip = (): void => {
      const t = flipProxy.t
      if (t < 0.5) {
        els.frontReveal.value = 1 - t * 2
        els.showSecond.value = false
      }
      else {
        els.frontReveal.value = (t - 0.5) * 2
        els.showSecond.value = true
      }
    }

    const setLive = (active: boolean): void => {
      section.value?.classList.toggle('is-live', active)
    }

    timeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section.value,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        invalidateOnRefresh: true,
        // Sekcja „ożywa" (staje się widoczna) dokładnie wtedy, gdy kadr hero
        // dojeżdża do spoczynku — ujemny `margin-top` na `.about-scroll` zrównuje
        // start pinu z końcem timeline'u hero. Do tego momentu `.about-stage`
        // siedzi w layoucie jako `visibility: hidden`.
        onToggle: self => setLive(self.isActive),
      },
    })

    setLive(timeline.scrollTrigger?.isActive ?? false)

    timeline
      // — FAZA 1 —
      // Kadr DOM rośnie do pełnego ekranu…
      .to(card.value, {
        width: () => window.innerWidth,
        height: () => window.innerHeight,
        left: 0,
        top: 0,
        duration: expand.duration,
      }, expand.start)
      // …a shader jednocześnie „cofa" wejście hero: reveal 1 → 0 (zoom out + obrót).
      .to(flipProxy, {
        t: 0.5,
        duration: expand.duration,
        onUpdate: applyFlip,
      }, expand.start)
      // Obrys ramki i etykieta znikają — przy pełnym ekranie i tak by się rozjechały.
      .to(border.value, {
        autoAlpha: 0,
        duration: expand.duration * 0.45,
      }, expand.start)
      .to(annotation.value, {
        autoAlpha: 0,
        duration: expand.duration * 0.35,
      }, expand.start)

      // Powrót frontem z rewersem — reveal 0 → 1: `about_img.jpeg` na całą stronę.
      .to(flipProxy, {
        t: 1,
        duration: flip.duration,
        onUpdate: applyFlip,
      }, flip.start)

      // — hold: rewers na całą stronę (odstęp między `flip` a `shrink`) —

      // — FAZA 2: rewers zjeżdża w dół i zmniejsza się do ~1/3 ekranu —
      .to(card.value, {
        width: () => finalCardRect().width,
        height: () => finalCardRect().height,
        left: () => finalCardRect().left,
        top: () => finalCardRect().top,
        duration: shrink.duration,
      }, shrink.start)
      // Ramka wraca, gdy kadr jest już blisko docelowych proporcji.
      .to(border.value, {
        autoAlpha: 1,
        duration: shrink.duration * 0.5,
      }, shrink.start + shrink.duration * 0.45)

      // — Wjazd pionowego „ROGSON" i miejsca na opis —
      .fromTo(sideLabel.value, { autoAlpha: 0, yPercent: 6 }, {
        autoAlpha: 1,
        yPercent: 0,
        duration: copyIn.duration,
      }, copyIn.start)
      .fromTo(copy.value, { autoAlpha: 0, x: 48 }, {
        autoAlpha: 1,
        x: 0,
        duration: copyIn.duration,
      }, copyIn.start)
  }

  function teardown(): void {
    timeline?.scrollTrigger?.kill()
    timeline?.kill()
    timeline = null
    els.section.value?.classList.remove('is-live')
    els.frontReveal.value = 1
    els.showSecond.value = false

    for (const node of [
      els.card, els.border, els.bg, els.annotation, els.sideLabel, els.copy,
    ]) {
      if (node.value) {
        gsap.set(node.value, {
          clearProps: 'opacity,visibility,transform,width,height,top,left',
        })
      }
    }
    els.clipPath.value?.setAttribute('d', HERO_CLIP_FINAL)
    els.borderPath.value?.setAttribute('d', HERO_CLIP_FINAL)
  }

  function handleDesktopChange(event: MediaQueryListEvent | MediaQueryList): void {
    teardown()
    hooks.onDeactivate?.()
    if (event.matches) {
      build()
      hooks.onActivate?.()
    }
    else {
      // Statyczny / mobilny wariant: od razu wylądowany rewers, bez scrolla.
      els.frontReveal.value = 1
      els.showSecond.value = true
    }
  }

  function handleStaticChange(event: MediaQueryListEvent): void {
    isStaticLayout.value = event.matches
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

  return { isStaticLayout, restingCardPath }
}
