<template>
  <section
    ref="section"
    class="about-scroll"
    :class="{ 'is-static': isStaticLayout }"
  >
    <svg class="about-clip-defs" aria-hidden="true">
      <defs>
        <clipPath id="about-card-clip" clipPathUnits="objectBoundingBox">
          <path ref="clipPath" :d="restingCardPath" />
        </clipPath>
      </defs>
    </svg>

    <div class="about-stage">
      <div ref="bg" class="about-bg" aria-hidden="true" />

      <span ref="sideLabel" class="about-sidelabel" aria-hidden="true">ROGSON</span>

      <div ref="card" class="about-card">
        <!-- Ten sam render co środkowa karta hero (ten sam shader: zoom + obrót).
             FAZA 1 odgrywa wejście hero wstecz przez `:reveal` 1→0, w połowie
             podmienia teksturę na rewers (`show-second`), potem `reveal` 0→1. -->
        <HeroParallax
          image="/img/hero_main.png"
          depth-map="/img/hero-depth-12.png"
          second-image="/img/about_img.jpeg"
          :reveal="frontReveal"
          :show-second="showSecond"
          :strength="0"
          :drift="0"
          fixed-size
          skip-intro
        />
        <span ref="annotation" class="about-card__annotation" aria-hidden="true">IMAGE / 03</span>
        <ClipBorder ref="aboutBorder" class="about-card__border" :path="restingCardPath" />
      </div>

      <div ref="copy" class="about-copy">
        <span class="about-copy__index">002</span>
        <h2 class="about-copy__title">ABOUT</h2>
        <p class="about-copy__text">
          Placeholder — krótki opis o Rogson. Treść dopasujemy później.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Druga sekcja landing page. FAZA 1: kadr środkowy z hero rośnie na pełny ekran
// (przykrywa hero) i „obraca się" wokół pionowej osi, odsłaniając rewers
// `about_img.jpeg` na całą stronę. FAZA 2: rewers zjeżdża w dół i zmniejsza się
// do ~1/3 szerokości, z powrotem w kształcie i ramce z hero; wjeżdżają „ROGSON"
// oraz miejsce na opis.

const section = ref<HTMLElement | null>(null)
const bg = ref<HTMLElement | null>(null)
const card = ref<HTMLElement | null>(null)
const clipPath = ref<SVGPathElement | null>(null)
const aboutBorder = ref<{ pathEl: SVGPathElement | null, root: SVGSVGElement | null } | null>(null)
const annotation = ref<HTMLElement | null>(null)
const sideLabel = ref<HTMLElement | null>(null)
const copy = ref<HTMLElement | null>(null)

// Sterowanie shaderem kadru (HeroParallax): postęp „wejścia" i podmiana tekstury.
const frontReveal = ref(1)
const showSecond = ref(false)

const { isStaticLayout, restingCardPath } = useAboutScrollTimeline({
  section,
  card,
  frontReveal,
  showSecond,
  clipPath,
  borderPath: computed(() => aboutBorder.value?.pathEl ?? null),
  border: computed(() => aboutBorder.value?.root ?? null),
  bg,
  annotation,
  sideLabel,
  copy,
})
</script>

<style scoped>
.about-scroll {
  position: relative;
  width: 100%;
  height: 300svh; /* długość drogi scrolla dla scrubowanego timeline */

  /* Nakładka na końcówkę hero: przesuwa start pinu ABOUT na moment, w którym
     kadr hero dojeżdża do spoczynku (hero ma ~100svh „martwego" scrolla po
     zakończeniu swojego timeline'u). Dzięki temu nie ma pustej przerwy między
     sekcjami. Wyłączone dla reduced-motion i wąskich ekranów (patrz media). */
  margin-top: -105svh;

  /* Sam blok jest przezroczysty — czerń rysuje `.about-bg` WEWNĄTRZ `.about-stage`,
     więc pojawia się dopiero razem z widocznością sceny (`.is-live`), a nie
     przykrywa hero, dopóki sekcja faktycznie go nie przejmuje. */
  background: transparent;
}

.about-clip-defs {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}

.about-stage {
  --about-final-width: min(33.333vw, 620px);
  --about-final-left: calc((100vw - var(--about-final-width)) / 2);
  --about-sidelabel-gap: clamp(16px, 3vw, 56px);
  --about-copy-gap: clamp(24px, 4vw, 72px);

  position: sticky;
  top: 0;
  width: 100%;
  height: 100svh;
  overflow: hidden;
  background: transparent;

  /* Sticky już „przyklejone", ale cała scena (z tłem) jest niewidoczna, dopóki
     `.about-scroll` nie dostanie `.is-live` od ScrollTriggera — czyli do chwili,
     gdy kadr hero dojeżdża do spoczynku. */
  visibility: hidden;
}

.about-scroll.is-live .about-stage {
  visibility: visible;
}

.about-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: #000;
  pointer-events: none;
}

.about-card {
  position: absolute;
  top: 50vh; /* ABOUT_CARD_START.topRatio */
  left: 39vw; /* ABOUT_CARD_START.leftRatio */
  z-index: 2;
  width: min(27vw, 480px); /* ABOUT_CARD_START width */
  height: 430px; /* ABOUT_CARD_START.height */
  overflow: hidden;
  clip-path: url('#about-card-clip');
  /* width/height/top/left są animowane w JS (layout na scrollu — jak w hero).
     „Obrót" i zoom robi shader kadru (HeroParallax), nie transform DOM-u. */
  will-change: clip-path, width, height, top, left;
}

.about-card__border {
  --clip-border-stroke: rgb(255 255 255 / 28%);
}

/* Ciągłość z kartą hero (ta sama etykieta w rogu); znika na starcie „obrotu". */
.about-card__annotation {
  position: absolute;
  top: 18px;
  left: 18%;
  z-index: 3;
  color: rgb(255 255 255 / 72%);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  line-height: 1;
  pointer-events: none;
}

.about-sidelabel {
  position: absolute;
  top: 50%;
  left: calc(var(--about-final-left) - var(--about-sidelabel-gap));
  z-index: 2;
  transform: translate(-100%, -50%) rotate(180deg);
  writing-mode: vertical-rl;
  text-orientation: sideways;
  color: #fff;
  font-family: 'Cabinet Grotesk', sans-serif;
  font-size: clamp(48px, 7vw, 120px);
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
  z-index: 2;
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

/* Reduced-motion (≥1024px): statyczny układ końcowy — rewers w docelowym
   rozmiarze, bez scrolla i „obrotu". Geometria odpowiada ABOUT_CARD_FINAL. */
@media (min-width: 1024px) and (prefers-reduced-motion: reduce) {
  .about-scroll {
    height: 100svh;
    margin-top: 0;
  }

  .about-stage {
    position: relative;
    visibility: visible;
  }

  .about-card__annotation {
    display: none;
  }

  .about-card {
    top: calc((100svh - 72svh) / 2);
    left: var(--about-final-left);
    width: var(--about-final-width);
    height: 72svh;
    will-change: auto;
  }
}

/* Wąski ekran: układ desktopowy się nie mieści — statyczny stos
   (napis / kadr / opis), bez scrubowanego timeline. */
@media (max-width: 1023px) {
  .about-scroll {
    height: auto;
    min-height: 100svh;
    margin-top: 0;
  }

  .about-stage {
    position: relative;
    visibility: visible;
    height: auto;
    min-height: 100svh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 28px;
    padding: 96px 24px;
  }

  .about-card__annotation {
    display: none;
  }

  .about-card {
    position: relative;
    top: auto;
    left: auto;
    width: min(78vw, 380px);
    height: auto;
    aspect-ratio: 4 / 5;
  }

  .about-sidelabel {
    position: relative;
    top: auto;
    left: auto;
    transform: none;
    writing-mode: horizontal-tb;
    text-orientation: mixed;
    font-size: clamp(40px, 12vw, 72px);
  }

  .about-copy {
    position: relative;
    top: auto;
    left: auto;
    width: min(78vw, 380px);
    transform: none;
  }
}
</style>
