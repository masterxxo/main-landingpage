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
            image="/img/hero_main.png"
            depth-map="/img/hero-depth-12.png"
            :active="isRevealed"
            :strength="0"
            :drift="0"
            fixed-size
            @revealed="handleHeroRevealed"
          />
          <ClipBorder ref="heroBorder" class="hero-card__border" :path="restingCardPath" />
          <span ref="heroAnnotation" class="hero-card__annotation">IMAGE / 03</span>
        </div>
      </div>

      <div ref="title" class="project-title">
        <span class="project-title__index">001</span>
        <h1>LOREM IPSUM DOLOR<br>AMET CONSECTETUR.</h1>
      </div>

      <MediaPlaceholder
        ref="smallPlaceholder"
        class="hero-media hero-media--small"
        clip-id="small-placeholder-clip"
        :path="SMALL_PLACEHOLDER_CLIP"
        label="IMAGE / 01"
        image="/img/hero_image_1.jpeg"
      />

      <MediaPlaceholder
        ref="sidePlaceholder"
        class="hero-media hero-media--side"
        clip-id="side-placeholder-clip"
        :path="SIDE_PLACEHOLDER_CLIP"
        label="IMAGE / 02"
        image="/img/hero_image_2.jpeg"
      />

      <div v-show="labelsShown" ref="heroLabels" class="hero-labels">
        <div
          v-for="(label, index) in labels"
          :key="label.text"
          class="hero-label"
        >
          <span v-show="labelVisible[index]" class="hero-label__index">{{ label.index }}</span>
          <ScrambleLink
            :ref="instance => setLabelTarget(index, instance)"
            :text="label.text"
            :font-size="140"
            :scramble-duration="HERO_LABELS.scrambleMsPerChar"
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
import { SIDE_PLACEHOLDER_CLIP, SMALL_PLACEHOLDER_CLIP } from '~/constants/heroClipPaths'
import { HERO_LABELS, HERO_TIMELINE } from '~/constants/heroLayout'

interface HeroLabel {
  index: string
  text: string
}

const labels: HeroLabel[] = [
  { index: '01R', text: 'LEARN.' },
  { index: '02O', text: 'CREATE.' },
  { index: '03G', text: 'BE CURIOUS.' },
]

const { isRevealed, isVideoVisible, toHeroReady } = useBoot()

// --- Template refs ---------------------------------------------------------
const section = ref<HTMLElement | null>(null)
const heroCard = ref<HTMLElement | null>(null)
const heroTilt = ref<HTMLElement | null>(null)
const heroLabels = ref<HTMLElement | null>(null)
const title = ref<HTMLElement | null>(null)
const heroAnnotation = ref<HTMLElement | null>(null)
const heroClipPath = ref<SVGPathElement | null>(null)
const heroBorder = ref<{ pathEl: SVGPathElement | null } | null>(null)
const smallPlaceholder = ref<{ root: HTMLElement | null } | null>(null)
const sidePlaceholder = ref<{ root: HTMLElement | null } | null>(null)

// --- Sekwencyjne odsłanianie labeli -------------------------------------
const {
  containerShown: labelsShown,
  indexVisible: labelVisible,
  setTarget: setLabelTarget,
  play: playLabelReveal,
} = useHeroLabelReveal({
  texts: labels.map(label => label.text),
  onComplete: toHeroReady,
})

function handleHeroRevealed(): void {
  void playLabelReveal()
}

// --- Scrollowy timeline + tilt karty -----------------------------------
const scroll = useHeroScrollTimeline(
  {
    section,
    card: heroCard,
    clipPath: heroClipPath,
    borderPath: computed(() => heroBorder.value?.pathEl ?? null),
    labels: heroLabels,
    title,
    smallPlaceholder: computed(() => smallPlaceholder.value?.root ?? null),
    sidePlaceholder: computed(() => sidePlaceholder.value?.root ?? null),
    annotation: heroAnnotation,
  },
  {
    onActivate: () => tilt.enable(),
    onDeactivate: () => tilt.disable(),
  },
)

const { isStaticLayout, restingCardPath } = scroll

const tilt = useCardTilt({
  surface: heroCard,
  target: heroTilt,
  enabled: () => scroll.getProgress() >= HERO_TIMELINE.tiltActiveFrom,
})
</script>

<style scoped>
.hero-scroll {
  position: relative;
  width: 100%;
  height: 280svh; /* długość drogi scrolla dla scrubowanego timeline */
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
  --clip-border-stroke: rgb(255 255 255 / 28%);
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

/* Pozycja i rozmiar zaślepek — wygląd samego pola jest w MediaPlaceholder.vue. */
.hero-media--small {
  top: 30%;
  left: 7.2%;
  width: min(22vw, 360px);
  aspect-ratio: 16 / 8.8;
}

.hero-media--side {
  top: 15%;
  right: 4.3%;
  width: min(29vw, 520px);
  height: 80%;
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
  .hero-media {
    display: none;
  }
}

/* Reduced-motion (≥1024px): renderujemy KOŃCOWY układ statycznie — bez długiego
   scrolla i animacji, ale z pełną treścią (tytuł + kadry pozostają widoczne).
   Geometria karty musi odpowiadać stałym HERO_CARD w constants/heroLayout.ts. */
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
