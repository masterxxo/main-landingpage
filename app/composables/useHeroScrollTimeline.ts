import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { ComputedRef, Ref } from 'vue'
import { HERO_CLIP_FINAL, HERO_CLIP_INITIAL } from '~/constants/heroClipPaths'
import { DESKTOP_MIN_WIDTH, HERO_CARD, HERO_TIMELINE } from '~/constants/heroLayout'
import { ABOUT_CARD_FINAL, ABOUT_PHASE } from '~/constants/aboutLayout'

export interface HeroScrollElements {
  section: Ref<HTMLElement | null>
  card: Ref<HTMLElement | null>
  clipPath: Ref<SVGPathElement | null>
  borderPath: Ref<SVGPathElement | null>
  /** Korzeń <svg> obrysu karty — wygaszany, gdy kadr rośnie na pełny ekran. */
  border: Ref<SVGSVGElement | null>
  labels: Ref<HTMLElement | null>
  title: Ref<HTMLElement | null>
  grid: Ref<HTMLElement | null>
  smallPlaceholder: Ref<HTMLElement | null>
  sidePlaceholder: Ref<HTMLElement | null>
  annotation: Ref<HTMLElement | null>
  /** Czarne „dno" fazy ABOUT — kryciem steruje timeline (patrz `build`). */
  aboutBg: Ref<HTMLElement | null>
  /** Pionowy napis „ROGSON" po lewej stronie kadru (faza ABOUT). */
  aboutSideLabel: Ref<HTMLElement | null>
  /** Blok opisu po prawej stronie kadru (faza ABOUT). */
  aboutCopy: Ref<HTMLElement | null>
  /** Zewnętrzny scrub wejścia kadru (`HeroParallax` `:reveal`): 1 = kadr hero. */
  cardReveal: Ref<number | undefined>
  /** `true` → shader kadru pokazuje rewers (`about_img.jpeg`). */
  cardShowSecond: Ref<boolean>
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
  /** Ustawiane, gdy scroll minie bity hero (kadr w spoczynku) — start treści końcowej. */
  heroSettled: Ref<boolean>
  /** Ustawiane po pierwszym osiągnięciu końca całego timeline (koniec fazy ABOUT). */
  hasReachedEnd: Ref<boolean>
  /** Kształt maski/obrysu karty w stanie spoczynku (zależny od trybu). */
  restingCardPath: ComputedRef<string>
  /** Postęp scrollowego timeline (0–1); 0 gdy timeline nie istnieje. */
  getProgress: () => number
}

/** Koniec bitów hero na osi timeline — bity ABOUT startują od tego offsetu. */
const HERO_END = Math.max(
  ...Object.values(HERO_TIMELINE)
    .filter((v): v is { start: number, duration: number } => typeof v === 'object')
    .map(v => v.start + v.duration),
)

/** Docelowa geometria kadru w fazie ABOUT (rewers ~1/3 ekranu, wyśrodkowany). */
function aboutFinalRect() {
  const width = Math.min(window.innerWidth * ABOUT_CARD_FINAL.widthRatio, ABOUT_CARD_FINAL.maxWidth)
  const height = window.innerHeight * ABOUT_CARD_FINAL.heightRatio
  return {
    width,
    height,
    left: (window.innerWidth - width) / 2,
    top: (window.innerHeight - height) / 2,
  }
}

/**
 * Buduje i utrzymuje scrollowo-scrubowany timeline sceny hero wraz z fazą ABOUT
 * (zjazd karty, morfowanie kształtu, wjazd tytułu i kadrów, a następnie
 * odwrócenie zjazdu: kadr rośnie z powrotem na pełny ekran, obraca się i
 * podmienia teksturę na `about_img.jpeg`, po czym zjeżdża do ~1/3 ekranu z
 * pionowym „ROGSON" i opisem). Pełna wersja tylko dla `min-width:
 * DESKTOP_MIN_WIDTH` bez reduced-motion; w pozostałych przypadkach timeline nie
 * powstaje, a wariant statyczny/mobilny opisuje CSS.
 */
export function useHeroScrollTimeline(
  els: HeroScrollElements,
  hooks: HeroScrollHooks = {},
): HeroScrollTimeline {
  const isStaticLayout = ref(false)
  const heroSettled = ref(false)
  const hasReachedEnd = ref(false)
  const restingCardPath = computed(
    () => (isStaticLayout.value ? HERO_CLIP_FINAL : HERO_CLIP_INITIAL),
  )

  let timeline: gsap.core.Timeline | null = null
  let desktopQuery: MediaQueryList | null = null
  let staticQuery: MediaQueryList | null = null
  // Próg postępu ScrollTriggera odpowiadający `HERO_END` (liczony po zbudowaniu).
  let heroSettleAt = 1

  function getProgress(): number {
    return timeline?.progress() ?? 0
  }

  function syncRestingPath(): void {
    els.clipPath.value?.setAttribute('d', restingCardPath.value)
    els.borderPath.value?.setAttribute('d', restingCardPath.value)
  }

  function build(): void {
    const { section, card, clipPath, borderPath, border, labels } = els
    const { title, grid, smallPlaceholder, sidePlaceholder, annotation } = els
    const { aboutBg, aboutSideLabel, aboutCopy } = els

    // Wszystkie ref-y to bezwarunkowe elementy template — guard chroni tylko
    // przed wywołaniem przed mountem.
    if (
      !section.value || !card.value || !clipPath.value || !borderPath.value
      || !border.value || !labels.value || !title.value || !grid.value
      || !smallPlaceholder.value || !sidePlaceholder.value || !annotation.value
      || !aboutBg.value || !aboutSideLabel.value || !aboutCopy.value
    ) return

    gsap.set([title.value, grid.value, smallPlaceholder.value, sidePlaceholder.value, annotation.value], {
      autoAlpha: 0,
    })
    gsap.set([aboutBg.value, aboutSideLabel.value, aboutCopy.value], { autoAlpha: 0 })
    els.cardShowSecond.value = false
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
        onUpdate: (self) => {
          if (self.progress >= heroSettleAt) heroSettled.value = true
          if (self.progress >= 0.995) hasReachedEnd.value = true
        },
      },
    })

    // ── Bity HERO (pasmo 0 … HERO_END) ─────────────────────────────────────
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
      .to(grid.value, {
        autoAlpha: 1,
        duration: HERO_TIMELINE.grid.duration,
      }, HERO_TIMELINE.grid.start)
      .to(annotation.value, {
        autoAlpha: 1,
        duration: HERO_TIMELINE.annotation.duration,
      }, HERO_TIMELINE.annotation.start)

    // ── Faza ABOUT (pasmo HERO_END … koniec) ──────────────────────────────
    // Odwrócenie zjazdu na TEJ SAMEJ instancji <HeroParallax>: kadr rośnie z
    // powrotem na pełny ekran (wciąż awersem — obraz „rozchodzi się" i sam
    // przykrywa treść hero), dopiero na pełnym ekranie obraca się awers→rewers
    // z podmianą tekstury, po czym zjeżdża i zmniejsza się do ~1/3.
    const { regrow, flip, shrink, copyIn } = ABOUT_PHASE

    // „Suwak obrotu" 0→1 w bicie `flip`:
    //   t 0→0.5 → cardReveal 1→0 (kadr odwraca się bokiem), awers
    //   t = 0.5 → podmiana tekstury na rewers (kadr bokiem)
    //   t 0.5→1 → cardReveal 0→1 (powrót frontem), rewers na całą stronę
    const flipProxy = { t: 0 }
    const applyFlip = (): void => {
      const t = flipProxy.t
      if (t < 0.5) {
        els.cardReveal.value = 1 - t * 2
        els.cardShowSecond.value = false
      }
      else {
        els.cardReveal.value = (t - 0.5) * 2
        els.cardShowSecond.value = true
      }
    }

    timeline
      // regrow — kadr DOM rośnie z małej karty z powrotem na pełny ekran.
      .to(card.value, {
        width: () => window.innerWidth,
        height: () => window.innerHeight,
        left: 0,
        top: 0,
        duration: regrow.duration,
      }, HERO_END + regrow.start)
      // Maska + obrys wracają do pełnego prostokąta (odwrócenie `reshape`),
      // żeby pełnoekranowy kadr nie był przycięty do kształtu karty hero.
      .to([clipPath.value, borderPath.value], {
        attr: { d: HERO_CLIP_INITIAL },
        duration: regrow.duration,
      }, HERO_END + regrow.start)
      // Treść hero gaśnie pod niezakrytymi jeszcze marginesami rosnącego kadru.
      .to([
        title.value, grid.value, smallPlaceholder.value, sidePlaceholder.value,
        annotation.value, border.value,
      ], {
        autoAlpha: 0,
        duration: regrow.duration * 0.5,
      }, HERO_END + regrow.start)

      // Czerń wchodzi dopiero TERAZ — kadr trzyma już pełny ekran i zasłania
      // hero, więc podmiana tła jest niewidoczna.
      .set(aboutBg.value, { autoAlpha: 1 }, HERO_END + flip.start)

      // flip — obrót awers→rewers na pełnym ekranie + podmiana tekstury.
      .to(flipProxy, {
        t: 1,
        duration: flip.duration,
        onUpdate: applyFlip,
      }, HERO_END + flip.start)

      // hold — rewers na całą stronę (przerwa między `flip` a `shrink`).

      // shrink — rewers zjeżdża i zmniejsza się do ~1/3; teraz odsłania się czerń.
      .to(card.value, {
        width: () => aboutFinalRect().width,
        height: () => aboutFinalRect().height,
        left: () => aboutFinalRect().left,
        top: () => aboutFinalRect().top,
        duration: shrink.duration,
      }, HERO_END + shrink.start)
      .to([clipPath.value, borderPath.value], {
        attr: { d: HERO_CLIP_FINAL },
        duration: shrink.duration,
      }, HERO_END + shrink.start)
      // Obrys wraca, gdy kadr jest już blisko docelowych proporcji.
      .to(border.value, {
        autoAlpha: 1,
        duration: shrink.duration * 0.5,
      }, HERO_END + shrink.start + shrink.duration * 0.45)

      // copyIn — wjazd pionowego „ROGSON" i bloku opisu po prawej.
      .fromTo(aboutSideLabel.value, { autoAlpha: 0, x: -160, yPercent: -44 }, {
        autoAlpha: 1,
        x: -160,
        yPercent: -50,
        duration: copyIn.duration,
      }, HERO_END + copyIn.start)
      .fromTo(aboutCopy.value, { autoAlpha: 0, x: 48 }, {
        autoAlpha: 1,
        x: 0,
        duration: copyIn.duration,
      }, HERO_END + copyIn.start)

    heroSettleAt = timeline.totalDuration() > 0 ? HERO_END / timeline.totalDuration() : 1
  }

  function teardown(): void {
    timeline?.scrollTrigger?.kill()
    timeline?.kill()
    timeline = null

    // Kształt spoczynkowy zależy od trybu (statyczny układ → od razu finalny).
    syncRestingPath()

    els.cardShowSecond.value = false
    els.cardReveal.value = undefined

    // Czyścimy tylko to, co timeline animuje. `clearProps: 'all'` zdejmowało też
    // niezwiązane style inline (np. clip-path zaślepek → prostokątne tło dookoła).
    for (const node of [
      els.card, els.labels, els.title, els.grid,
      els.smallPlaceholder, els.sidePlaceholder, els.annotation,
      els.border, els.aboutBg, els.aboutSideLabel, els.aboutCopy,
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

  return { isStaticLayout, heroSettled, hasReachedEnd, restingCardPath, getProgress }
}
