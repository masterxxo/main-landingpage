<template>
  <section
    ref="section"
    id="hero"
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
        <clipPath id="about-mobile-clip" clipPathUnits="objectBoundingBox">
          <path ref="aboutMobileClipPath" :d="HERO_CLIP_INITIAL" />
        </clipPath>
      </defs>
    </svg>

    <div ref="heroStage" class="hero-stage">
      <div ref="grid" class="hero-grid" aria-hidden="true">
        <span class="hero-grid__vertical" />
        <span class="hero-grid__horizontal" />
      </div>

      <div ref="heroCard" class="hero-card">
        <div ref="heroTilt" class="hero-card__tilt">
          <HeroCardVisual
            image="/img/hero_main.png"
            second-image="/img/about_img.jpeg"
            :active="isRevealed"
            :reveal="cardReveal"
            :show-second="cardShowSecond"
            :second-zoom="0.93"
            :second-focus-y="0.12"
            fixed-size
            @revealed="handleHeroRevealed"
          />
          <ClipBorder ref="heroBorder" class="hero-card__border" :path="restingCardPath" />
          <span ref="heroAnnotation" class="hero-card__annotation">IMAGE / 03</span>
        </div>
      </div>

      <div ref="title" class="project-title">
        <span class="project-title__index">001</span>
        <h1>STAY CURIOUS.<br>EVERYTHING ELSE FOLLOWS.</h1>
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
        play-overlay
        @open="openVideo"
      />

      <AnimatedWriterText
        class="hero-statement"
        :active="showEndContent"
        text="Eight years of writing code taught me how software should work. Now AI writes it, and I do what I always wanted to do — build the software. Same curiosity, different job. Less typing, more thinking."
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

      <div id="about" ref="aboutSection" class="about-section">
        <div ref="aboutBg" class="about-bg" aria-hidden="true" />
        <span ref="aboutSideLabel" class="about-sidelabel" aria-hidden="true">ROGSON</span>
        <img ref="aboutMobileImage" class="about-mobile-image" src="/img/about_img.jpeg" alt="" aria-hidden="true">
        <div ref="aboutCopy" class="about-copy">
          <span ref="aboutIndex" class="about-copy__index">002</span>
          <h2 ref="aboutTitle" class="about-copy__title">ABOUT</h2>
          <AnimatedWriterText
            class="about-copy__text"
            :class="{ 'is-active': aboutActive }"
            :active="aboutActive"
            :ms-per-character="18"
            text="8 years on the frontend — Vue, React, and everything that came with actually shipping products. On the side, I taught myself the backend too — curiosity doesn't wait for someone to greenlight it. Now I'm moving into product engineering: owning software end to end instead of just one layer of it. AI handles a lot of the code these days — I handle the thinking."
          />
        </div>
      </div>
    </div>

    <VideoModal
      :open="isVideoOpen"
      :origin="videoOrigin"
      video-id="KvMY1uzSC1E"
      list-id="RDKvMY1uzSC1E"
      @close="isVideoOpen = false"
    />
  </section>
</template>

<script setup lang="ts">
import type { VideoModalOrigin } from '~/components/VideoModal.vue'
import { HERO_CLIP_INITIAL, SIDE_PLACEHOLDER_CLIP, SMALL_PLACEHOLDER_CLIP } from '~/constants/heroClipPaths'
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

const section = ref<HTMLElement | null>(null)
const heroStage = ref<HTMLElement | null>(null)
const heroCard = ref<HTMLElement | null>(null)
const heroTilt = ref<HTMLElement | null>(null)
const heroLabels = ref<HTMLElement | null>(null)
const title = ref<HTMLElement | null>(null)
const grid = ref<HTMLElement | null>(null)
const heroAnnotation = ref<HTMLElement | null>(null)
const heroClipPath = ref<SVGPathElement | null>(null)
const heroBorder = ref<{ pathEl: SVGPathElement | null, root: SVGSVGElement | null } | null>(null)
const smallPlaceholder = ref<{ root: HTMLElement | null } | null>(null)
const sidePlaceholder = ref<{ root: HTMLElement | null } | null>(null)
const aboutBg = ref<HTMLElement | null>(null)
const aboutSection = ref<HTMLElement | null>(null)
const aboutMobileImage = ref<HTMLImageElement | null>(null)
const aboutMobileClipPath = ref<SVGPathElement | null>(null)
const aboutIndex = ref<HTMLElement | null>(null)
const aboutTitle = ref<HTMLElement | null>(null)
const aboutSideLabel = ref<HTMLElement | null>(null)
const aboutCopy = ref<HTMLElement | null>(null)
const aboutActive = ref(false)

const cardReveal = ref<number | undefined>(undefined)
const cardShowSecond = ref(false)

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

const isVideoOpen = ref(false)
const videoOrigin = ref<VideoModalOrigin | null>(null)

function openVideo(rect: DOMRect): void {
  const { top, left, width, height } = rect
  videoOrigin.value = { top, left, width, height }
  isVideoOpen.value = true
}

const scroll = useHeroScrollTimeline(
  {
    section,
    stage: heroStage,
    card: heroCard,
    clipPath: heroClipPath,
    borderPath: computed(() => heroBorder.value?.pathEl ?? null),
    border: computed(() => heroBorder.value?.root ?? null),
    labels: heroLabels,
    title,
    grid,
    smallPlaceholder: computed(() => smallPlaceholder.value?.root ?? null),
    sidePlaceholder: computed(() => sidePlaceholder.value?.root ?? null),
    annotation: heroAnnotation,
    aboutBg,
    aboutSideLabel,
    aboutCopy,
    cardReveal,
    cardShowSecond,
  },
  {
    onActivate: () => tilt.enable(),
    onDeactivate: () => tilt.disable(),
  },
)

const { isStaticLayout, heroSettled, restingCardPath } = scroll
const showEndContent = computed(() => isStaticLayout.value || heroSettled.value)
useAboutReveal(
  {
    heroSection: section,
    aboutSection,
    image: aboutMobileImage,
    clipPath: aboutMobileClipPath,
    index: aboutIndex,
    title: aboutTitle,
  },
  aboutActive,
)

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
  height: 560svh;
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
  --hero-grid-x: 66.4%;
  --hero-grid-y: 28%;
  --hero-grid-color: rgb(255 255 255 / 28%);
  --navigation-frame-inset: 16px;
  --navigation-header-height: 51px;
  --navigation-rail-width: 67px;

  --about-final-width: min(33.333vw, 620px);
  --about-final-left: calc((100vw - var(--about-final-width)) / 2);
  --about-sidelabel-gap: clamp(16px, 3vw, 56px);
  --about-copy-gap: clamp(24px, 4vw, 72px);

  position: sticky;
  top: 0;
  width: 100%;
  height: 100svh;
  overflow: hidden;
}

.about-bg {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: #000;
  pointer-events: none;
}

.about-section {
  display: contents;
}

.about-mobile-image {
  display: none;
}

.about-sidelabel {
  position: absolute;
  top: 50%;
  left: calc(var(--about-final-left) - var(--about-sidelabel-gap));
  z-index: 4;
  transform: translate(-160px, -50%) rotate(180deg);
  writing-mode: vertical-rl;
  text-orientation: sideways;
  color: #fff;
  font-family: 'Cabinet Grotesk', sans-serif;
  font-size: clamp(88px, 9.5vw, 160px);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.04em;
  white-space: nowrap;
  pointer-events: none;
}

.about-copy {
  position: absolute;
  top: 50%;
  left: calc(var(--about-final-left) + var(--about-final-width) + var(--about-copy-gap));
  z-index: 4;
  width: min(26vw, 380px);
  transform: translateY(-50%);
  color: rgb(255 255 255 / 72%);
  font-family: 'Cabinet Grotesk', sans-serif;
}

.about-copy__index {
  display: block;
  margin-bottom: 14px;
  color: rgb(255 255 255 / 55%);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
}

.about-copy__title {
  margin: 0 0 12px;
  color: #fff;
  font-size: clamp(24px, 2.4vw, 40px);
  font-weight: 900;
  line-height: 0.9;
  letter-spacing: -0.05em;
}

.about-copy__text {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
}

.hero-grid {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.hero-grid__vertical,
.hero-grid__horizontal {
  position: absolute;
  display: block;
  background: var(--hero-grid-color);
}

.hero-grid__vertical {
  top: calc(var(--navigation-frame-inset) + var(--navigation-header-height));
  bottom: var(--navigation-frame-inset);
  left: var(--hero-grid-x);
  width: 1px;
}

.hero-grid__horizontal {
  top: var(--hero-grid-y);
  left: calc(var(--navigation-frame-inset) + var(--navigation-rail-width));
  right: calc(100% - var(--hero-grid-x));
  height: 1px;
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
  font-size: clamp(32px, calc(4.4vw - 10px), 74px);
  font-weight: 900;
  line-height: 0.88;
  letter-spacing: -0.055em;
}

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

.hero-statement {
  position: absolute;
  bottom: 7%;
  left: 7.2%;
  z-index: 2;
  width: min(27vw, 430px);
  font-family: 'Cabinet Grotesk', sans-serif;
  line-height: 1.35;
  pointer-events: none;
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

@media (max-width: 968px) {
  .hero-scroll {
    height: calc(205svh + var(--mobile-about-height, 100svh));
  }

  .hero-stage {
    position: relative;
    overflow: visible;
  }

  .hero-grid {
    --hero-grid-x: 76%;
    --hero-grid-y: 42%;
  }

  .project-title {
    top: 11%;
    left: 24px;
    z-index: 5;
    width: calc(100% - 48px);
  }

  .project-title h1 {
    font-size: clamp(34px, 9.5vw, 62px);
  }

  .hero-media--small {
    top: 45%;
    left: 24px;
    z-index: 5;
    width: min(42vw, 240px);
  }

  .hero-media--side {
    top: 48%;
    right: 24px;
    z-index: 5;
    width: min(34vw, 210px);
    height: 27svh;
  }

  .hero-statement {
    bottom: 7%;
    left: 24px;
    z-index: 2;
    width: min(66vw, 430px);
    font-size: 14px;
  }

  .hero-card__annotation {
    top: auto;
    bottom: 18px;
    left: auto;
    right: 24px;
  }

  .hero-labels {
    right: 24px;
    bottom: 56px;
    max-width: calc(100% - 48px);
  }

  .hero-label:not(:last-child) {
    margin-bottom: -4px;
  }

  .hero-label__index {
    font-size: 10px;
  }

  .hero-labels :deep(.scramble__text),
  .hero-labels :deep(.scramble__sizer) {
    font-size: clamp(40px, 10vw, 94px) !important;
  }

  .about-section {
    position: absolute;
    top: 100%;
    left: 0;
    display: flex;
    flex-direction: column;
    gap: 28px;
    width: 100%;
    min-height: 100svh;
    padding: 72px 24px 56px;
    overflow: hidden;
    background: #000;
  }

  .about-bg,
  .about-sidelabel {
    display: none;
  }

  .about-mobile-image {
    display: block;
    align-self: center;
    width: min(100%, 392px);
    height: min(48svh, 392px);
    object-fit: cover;
    object-position: center 62%;
    clip-path: url('#about-mobile-clip');
  }

  .about-copy {
    position: relative;
    top: auto;
    left: auto;
    z-index: 1;
    width: 100%;
    max-width: 560px;
    transform: none;
  }

  .about-copy__title {
    font-size: clamp(36px, 12vw, 64px);
  }

  .about-copy__text {
    min-height: 210px;
    opacity: 0;
    font-size: 14px;
    transition: opacity 220ms ease;
  }

  .about-copy__text.is-active {
    opacity: 1;
  }
}

@media (min-width: 969px) and (max-width: 1023px) {
  .hero-labels {
    right: 64px;
  }

  .hero-label:not(:last-child) {
    margin-bottom: -8px;
  }

  .hero-labels :deep(.scramble__text),
  .hero-labels :deep(.scramble__sizer) {
    font-size: 82px !important;
  }
}

@media (min-width: 1024px) and (max-width: 1399px) {
  .hero-labels {
    right: clamp(64px, 9vw, 126px);
  }

  .hero-labels :deep(.scramble__text),
  .hero-labels :deep(.scramble__sizer) {
    font-size: calc(82px + (100vw - 1024px) * 0.155) !important;
  }
}

@media (min-width: 969px) and (prefers-reduced-motion: reduce) {
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

  .about-bg,
  .about-sidelabel,
  .about-copy {
    display: none;
  }
}

@media (max-width: 968px) and (prefers-reduced-motion: reduce) {
  .about-copy__text {
    transition: none;
  }
}
</style>
