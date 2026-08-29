/** Od tej szerokości viewportu (px) gramy pełną, scrollowaną wersję hero. */
export const DESKTOP_MIN_WIDTH = 1024

/**
 * Geometria karty hero w stanie docelowym (po zjeździe na scrollu).
 * Wartości `*Ratio` są mnożone przez wymiar okna w runtime.
 *
 * UWAGA: te same liczby są zapisane w regule
 * `@media (min-width: 1024px) and (prefers-reduced-motion: reduce)`
 * w `HeroSection.vue` — przy zmianie aktualizuj oba miejsca.
 */
export const HERO_CARD = {
  maxWidth: 480,
  widthRatio: 0.27, // * window.innerWidth
  height: 430,
  leftRatio: 0.39, // * window.innerWidth
  topRatio: 0.5, // * window.innerHeight
} as const

/**
 * Choreografia scrollowego timeline w jednostkach postępu ScrollTriggera (0–1):
 * `start` = kiedy tween wchodzi, `duration` = jak długo trwa na osi postępu.
 * Czytaj to jak scenopis — widać kolejność i nakładanie się beatów.
 */
export const HERO_TIMELINE = {
  reshape: { start: 0.08, duration: 0.72 }, // zjazd + zmiana kształtu karty
  labelsOut: { start: 0, duration: 0.2 },
  title: { start: 0.48, duration: 0.28 },
  smallPlaceholder: { start: 0.56, duration: 0.34 },
  sidePlaceholder: { start: 0.46, duration: 0.42 },
  grid: { start: 0.62, duration: 0.28 },
  annotation: { start: 0.62, duration: 0.18 },
  /** Od tego progu postępu karta reaguje na tilt wskaźnikiem. */
  tiltActiveFrom: 0.72,
} as const

/**
 * Timing sekwencyjnego odsłaniania labeli.
 * `scrambleMsPerChar` MUSI być równe propowi `:scramble-duration` na `<ScrambleLink>`.
 */
export const HERO_LABELS = {
  scrambleMsPerChar: 140,
  startDelay: 250,
  gapMs: 180,
} as const
