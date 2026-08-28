<template>
  <section
    ref="section"
    class="hero-scroll"
    :class="{ 'is-video-visible': isVideoVisible, 'is-static': isStaticLayout }"
  >
    <svg class="hero-clip-defs" aria-hidden="true">
      <defs>
        <clipPath id="hero-card-clip" clipPathUnits="objectBoundingBox">
          <path ref="heroClipPath" :d="restingCardPath" />
        </clipPath>
        <clipPath id="small-placeholder-clip" clipPathUnits="objectBoundingBox">
          <path :d="SMALL_PLACEHOLDER_CLIP" />
        </clipPath>
        <clipPath id="side-placeholder-clip" clipPathUnits="objectBoundingBox">
          <path :d="SIDE_PLACEHOLDER_CLIP" />
        </clipPath>
      </defs>
    </svg>

    <div class="hero-stage">
      <div ref="heroCard" class="hero-card">
        <div ref="heroTilt" class="hero-card__tilt">
          <HeroParallax
            image="/img/hero_1.png"
            depth-map="/img/hero-depth-12.png"
            :active="isRevealed"
            :strength="0"
            :drift="0"
            fixed-size
            @revealed="handleHeroRevealed"
          />
          <svg
            class="hero-card__border"
            viewBox="0 0 1 1"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              ref="heroBorderPath"
              :d="restingCardPath"
              vector-effect="non-scaling-stroke"
            />
          </svg>
          <span ref="heroAnnotation" class="hero-card__annotation">IMAGE / 03</span>
        </div>
      </div>

      <div ref="title" class="project-title">
        <span class="project-title__index">001</span>
        <h1>LOREM IPSUM DOLOR<br>AMET CONSECTETUR.</h1>
      </div>

      <div ref="smallPlaceholder" class="media-placeholder media-placeholder--small">
        <svg class="media-placeholder__border" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
          <path :d="SMALL_PLACEHOLDER_CLIP" vector-effect="non-scaling-stroke" />
        </svg>
        <span>IMAGE / 01</span>
      </div>

      <div ref="sidePlaceholder" class="media-placeholder media-placeholder--side">
        <svg class="media-placeholder__border" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
          <path :d="SIDE_PLACEHOLDER_CLIP" vector-effect="non-scaling-stroke" />
        </svg>
        <span>IMAGE / 02</span>
      </div>

      <div v-show="showLabels" ref="heroLabels" class="hero-labels">
        <div
          v-for="(label, index) in labels"
          :key="label.text"
          class="hero-label"
        >
          <span v-show="visibleLabels[index]" class="hero-label__index">{{ label.index }}</span>
          <ScrambleLink
            :ref="instance => setLabelRef(index, instance)"
            :text="label.text"
            :font-size="140"
            :scramble-duration="SCRAMBLE_MS_PER_CHAR"
            :scramble-fps="60"
            font-family="Cabinet Grotesk"
            :hover="false"
            plain
            sequential
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  HERO_CLIP_FINAL,
  HERO_CLIP_INITIAL,
  SIDE_PLACEHOLDER_CLIP,
  SMALL_PLACEHOLDER_CLIP,
} from '~/constants/heroClipPaths'
import type { ScrambleTarget } from '~/composables/useScrambleReveal'

interface HeroLabel {
  index: string
  text: string
}

const labels: HeroLabel[] = [
  { index: '01R', text: 'LEARN.' },
  { index: '02O', text: 'CREATE.' },
  { index: '03G', text: 'BE CURIOUS.' },
]

// --- Choreografia labeli -----------------------------------------------------
// SCRAMBLE_MS_PER_CHAR MUSI być zgodne z propem :scramble-duration na
// <ScrambleLink> — obie wartości opisują czas „rozsypania" jednego znaku.
const SCRAMBLE_MS_PER_CHAR = 140
const LABEL_START_DELAY = 250
const LABEL_GAP_MS = 180

// --- Mapa faz scrollowego timeline (postęp ScrollTriggera 0–1) --------------
const RESHAPE_START = 0.08 // start zjazdu i zmiany kształtu karty
const RESHAPE_DURATION = 0.72
const TILT_ACTIVE_FROM = 0.72 // od tego progu karta reaguje na ruch myszką

// --- Geometria karty w stanie docelowym ------------------------------------
// UWAGA: te same wartości są zapisane w regule @media (prefers-reduced-motion)
// w <style> poniżej — przy zmianie aktualizuj oba miejsca.
const CARD_MAX_WIDTH = 480
const CARD_WIDTH_RATIO = 0.27 // * window.innerWidth
const CARD_HEIGHT = 430
const CARD_LEFT_RATIO = 0.39 // * window.innerWidth
const CARD_TOP_RATIO = 0.5 // * window.innerHeight

const { isRevealed, isVideoVisible, toHeroReady } = useBoot()
const showLabels = ref<boolean>(false)
const visibleLabels = ref<boolean[]>(labels.map(() => false))
const labelRefs = ref<Array<ScrambleTarget | null>>(labels.map(() => null))
const section = ref<HTMLElement | null>(null)
const heroCard = ref<HTMLDivElement | null>(null)
const heroTilt = ref<HTMLDivElement | null>(null)
const heroLabels = ref<HTMLDivElement | null>(null)
const title = ref<HTMLDivElement | null>(null)
const smallPlaceholder = ref<HTMLDivElement | null>(null)
const sidePlaceholder = ref<HTMLDivElement | null>(null)
const heroClipPath = ref<SVGPathElement | null>(null)
const heroBorderPath = ref<SVGPathElement | null>(null)
const heroAnnotation = ref<HTMLSpanElement | null>(null)

// Gdy użytkownik prosi o ograniczenie ruchu (i ekran jest wystarczająco szeroki),
// renderujemy KOŃCOWY układ statycznie — bez scrolla i animacji, ale z pełną treścią.
const isStaticLayout = ref<boolean>(false)
const restingCardPath = computed(
  () => (isStaticLayout.value ? HERO_CLIP_FINAL : HERO_CLIP_INITIAL),
)

let scrollTimeline: gsap.core.Timeline | null = null
let tiltXTo: gsap.QuickToFunc | null = null
let tiltYTo: gsap.QuickToFunc | null = null
let desktopQuery: MediaQueryList | null = null
let staticQuery: MediaQueryList | null = null
const labelTimers: number[] = []

function getCardWidth(): number {
  return Math.min(window.innerWidth * CARD_WIDTH_RATIO, CARD_MAX_WIDTH)
}

function handleTilt(event: PointerEvent): void {
  if (!heroCard.value || !scrollTimeline || scrollTimeline.progress() < TILT_ACTIVE_FROM) return

  const rect = heroCard.value.getBoundingClientRect()
  const x = (event.clientX - rect.left) / rect.width - 0.5
  const y = (event.clientY - rect.top) / rect.height - 0.5

  tiltXTo?.(-y * 8)
  tiltYTo?.(x * 8)
}

function resetTilt(): void {
  tiltXTo?.(0)
  tiltYTo?.(0)
}

async function handleHeroRevealed(): Promise<void> {
  showLabels.value = true
  await nextTick()

  let delay = LABEL_START_DELAY

  labels.forEach((label, index) => {
    const timer = window.setTimeout(() => {
      visibleLabels.value[index] = true
      labelRefs.value[index]?.start()
    }, delay)

    labelTimers.push(timer)
    delay += label.text.replace(/\s/g, '').length * SCRAMBLE_MS_PER_CHAR + LABEL_GAP_MS
  })

  // Nawigację odsłaniamy dopiero, gdy ostatni label skończył animację.
  labelTimers.push(window.setTimeout(toHeroReady, delay))
}

function createDesktopAnimation(): void {
  // Wszystkie ref-y to bezwarunkowe elementy template — guard chroni tylko przed
  // wywołaniem przed mountem. Kolejność zgodna z użyciem w timeline poniżej.
  if (
    !section.value
    || !heroCard.value
    || !heroTilt.value
    || !heroLabels.value
    || !heroClipPath.value
    || !heroBorderPath.value
    || !heroAnnotation.value
    || !title.value
    || !smallPlaceholder.value
    || !sidePlaceholder.value
  ) return

  gsap.set([title.value, smallPlaceholder.value, sidePlaceholder.value, heroAnnotation.value], {
    autoAlpha: 0,
  })
  heroClipPath.value.setAttribute('d', HERO_CLIP_INITIAL)
  heroBorderPath.value.setAttribute('d', HERO_CLIP_INITIAL)

  tiltXTo = gsap.quickTo(heroTilt.value, 'rotationX', {
    duration: 0.45,
    ease: 'power3.out',
  })
  tiltYTo = gsap.quickTo(heroTilt.value, 'rotationY', {
    duration: 0.45,
    ease: 'power3.out',
  })

  scrollTimeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section.value,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      invalidateOnRefresh: true,
    },
  })

  scrollTimeline
    .to(heroLabels.value, { autoAlpha: 0, y: -30, duration: 0.2 }, 0)
    .to(heroCard.value, {
      width: getCardWidth,
      height: CARD_HEIGHT,
      left: () => window.innerWidth * CARD_LEFT_RATIO,
      top: () => window.innerHeight * CARD_TOP_RATIO,
      duration: RESHAPE_DURATION,
    }, RESHAPE_START)
    // Maska (clip-path) i widoczny obrys morfują tym samym tweenem, żeby nie mogły
    // się rozjechać — dlatego HERO_CLIP_INITIAL/FINAL mają identyczny zestaw komend.
    .to([heroClipPath.value, heroBorderPath.value], {
      attr: { d: HERO_CLIP_FINAL },
      duration: RESHAPE_DURATION,
    }, RESHAPE_START)
    .fromTo(title.value, { y: 36 }, {
      autoAlpha: 1,
      y: 0,
      duration: 0.28,
    }, 0.48)
    .fromTo(smallPlaceholder.value, { x: -80 }, {
      autoAlpha: 1,
      x: 0,
      duration: 0.34,
    }, 0.56)
    .fromTo(sidePlaceholder.value, { x: 140 }, {
      autoAlpha: 1,
      x: 0,
      duration: 0.42,
    }, 0.46)
    .to(heroAnnotation.value, {
      autoAlpha: 1,
      duration: 0.18,
    }, 0.62)

  heroCard.value.addEventListener('pointermove', handleTilt)
  heroCard.value.addEventListener('pointerleave', resetTilt)
}

function destroyDesktopAnimation(): void {
  heroCard.value?.removeEventListener('pointermove', handleTilt)
  heroCard.value?.removeEventListener('pointerleave', resetTilt)
  tiltXTo?.tween.kill()
  tiltYTo?.tween.kill()
  tiltXTo = null
  tiltYTo = null
  scrollTimeline?.scrollTrigger?.kill()
  scrollTimeline?.kill()
  scrollTimeline = null

  // Kształt spoczynkowy zależy od trybu: statyczny układ → od razu finalny.
  heroClipPath.value?.setAttribute('d', restingCardPath.value)
  heroBorderPath.value?.setAttribute('d', restingCardPath.value)

  for (const target of [
    heroCard, heroTilt, heroLabels, title,
    smallPlaceholder, sidePlaceholder, heroAnnotation,
  ]) {
    if (target.value) gsap.set(target.value, { clearProps: 'all' })
  }
}

function handleDesktopChange(event: MediaQueryListEvent | MediaQueryList): void {
  destroyDesktopAnimation()
  if (event.matches) createDesktopAnimation()
}

function handleStaticChange(event: MediaQueryListEvent): void {
  isStaticLayout.value = event.matches
  // Przełącz spoczynkowy kształt maski/obrysu bez czekania na scroll.
  heroClipPath.value?.setAttribute('d', restingCardPath.value)
  heroBorderPath.value?.setAttribute('d', restingCardPath.value)
}

function setLabelRef(index: number, instance: unknown): void {
  labelRefs.value[index] = instance as ScrambleTarget | null
}

onMounted(() => {
  gsap.registerPlugin(ScrollTrigger)

  staticQuery = window.matchMedia('(min-width: 1024px) and (prefers-reduced-motion: reduce)')
  isStaticLayout.value = staticQuery.matches
  staticQuery.addEventListener('change', handleStaticChange)

  desktopQuery = window.matchMedia('(min-width: 1024px) and (prefers-reduced-motion: no-preference)')
  handleDesktopChange(desktopQuery)
  desktopQuery.addEventListener('change', handleDesktopChange)
})

onBeforeUnmount(() => {
  labelTimers.forEach(timer => clearTimeout(timer))
  staticQuery?.removeEventListener('change', handleStaticChange)
  desktopQuery?.removeEventListener('change', handleDesktopChange)
  destroyDesktopAnimation()
})
</script>

<style scoped>
.hero-scroll {
  position: relative;
  width: 100%;
  height: 280svh;
  background: #05060a;
  transition: background-color 600ms ease;
}

.hero-scroll.is-video-visible {
  background-color: transparent;
}

.hero-clip-defs {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}

.hero-stage {
  position: sticky;
  top: 0;
  width: 100%;
  height: 100svh;
  overflow: hidden;
}

.hero-card {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 3;
  width: 100%;
  height: 100svh;
  overflow: hidden;
  clip-path: url('#hero-card-clip');
  /* top/left/width/height są nadal animowane w JS (layout na scrollu — patrz
     review 1.3, do przepisania na transformy). Nie da się ich promować do
     kompozytora, więc w will-change trzymamy tylko realnie kompozytowalny clip-path. */
  will-change: clip-path;
}

.hero-card__tilt {
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transform-perspective: 900px;
  will-change: transform;
}

.hero-card__border {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.hero-card__border path {
  fill: none;
  stroke: rgb(255 255 255 / 28%);
  stroke-width: 1;
}

.hero-card__annotation {
  position: absolute;
  top: 18px;
  left: 18%;
  color: rgb(255 255 255 / 72%);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  line-height: 1;
  pointer-events: none;
}

.project-title {
  position: absolute;
  top: 10%;
  left: 7.2%;
  z-index: 2;
  color: #fff;
  font-family: 'Cabinet Grotesk', sans-serif;
  pointer-events: none;
}

.project-title__index {
  display: block;
  margin-bottom: 12px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
}

.project-title h1 {
  margin: 0;
  font-size: clamp(42px, 4.4vw, 84px);
  font-weight: 900;
  line-height: 0.88;
  letter-spacing: -0.055em;
}

.media-placeholder {
  position: absolute;
  z-index: 2;
  overflow: hidden;
  background: #161820;
  color: rgb(255 255 255 / 55%);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
}

.media-placeholder span {
  position: absolute;
  top: 18px;
  left: 18px;
  z-index: 1;
}

.media-placeholder__border {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.media-placeholder__border path {
  fill: none;
  stroke: rgb(255 255 255 / 24%);
  stroke-width: 1;
}

.media-placeholder--small {
  top: 30%;
  left: 7.2%;
  width: min(22vw, 360px);
  aspect-ratio: 16 / 8.8;
  clip-path: url('#small-placeholder-clip');
}

.media-placeholder--side {
  top: 15%;
  right: 4.3%;
  width: min(29vw, 520px);
  height: 80%;
  clip-path: url('#side-placeholder-clip');
}

.hero-labels {
  position: absolute;
  bottom: 80px;
  right: 130px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  pointer-events: none;
  will-change: opacity, transform;
}

.hero-label {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 5px;
}

.hero-label:not(:last-child) {
  margin-bottom: -15px;
}

.hero-label:first-child {
  margin-right: 35%;
}

.hero-label:last-child {
  margin-right: 40%;
}

.hero-label__index {
  color: #fff;
  font-family: 'Cabinet Grotesk', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1;
}

.hero-labels :deep(.scramble) {
  padding: 0;
}

.hero-labels :deep(.scramble__text),
.hero-labels :deep(.scramble__sizer) {
  line-height: 1;
}

/* Wąski ekran: układ desktopowy się nie mieści — pokazujemy sam kadr + labele. */
@media (max-width: 1023px) {
  .hero-scroll {
    height: 100svh;
  }

  .project-title,
  .media-placeholder {
    display: none;
  }
}

/* Reduced-motion (≥1024px): renderujemy KOŃCOWY układ statycznie — bez długiego
   scrolla i animacji, ale z pełną treścią (tytuł + kadry pozostają widoczne).
   Geometria karty musi odpowiadać stałym CARD_* w <script>. */
@media (min-width: 1024px) and (prefers-reduced-motion: reduce) {
  .hero-scroll {
    height: 100svh;
  }

  .hero-stage {
    position: relative;
  }

  .hero-card {
    top: 50vh;
    left: 39vw;
    width: min(27vw, 480px);
    height: 430px;
    will-change: auto;
  }
}
</style>
