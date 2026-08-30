/**
 * Stałe fazy ABOUT — druga część scrollowego timeline sceny hero.
 *
 * Kadr środkowy hero (ta sama instancja `<HeroParallax>`) po dojechaniu do małej
 * karty NIE jest zastępowany nową sekcją. Na dalszy scroll odwracamy efekt:
 * kadr rośnie z powrotem na pełny ekran, obraca się wokół pionowej osi i
 * podmienia teksturę na `about_img.jpeg`, po czym zjeżdża i zmniejsza się do
 * ~1/3 ekranu (finał ABOUT: pionowy „ROGSON" + blok opisu).
 *
 * Choreografię trzyma `useHeroScrollTimeline` — bity ABOUT są dopinane do tego
 * samego GSAP timeline za bitami hero (patrz `ABOUT_PHASE`).
 */

/**
 * Geometria kadru w stanie DOCELOWYM fazy ABOUT (rewers zmniejszony do ~1/3
 * ekranu, wyśrodkowany). `left` / `top` liczymy w runtime z faktycznego rozmiaru.
 *
 * UWAGA: te same liczby są w regułach `.hero-card` w wariantach
 * reduced-motion / `max-width: 1023px` w `HeroSection.vue` — aktualizuj oba miejsca.
 */
export const ABOUT_CARD_FINAL = {
  maxWidth: 620,
  widthRatio: 1 / 3, // * window.innerWidth
  heightRatio: 0.72, // * window.innerHeight
} as const

/**
 * Choreografia bitów ABOUT w jednostkach postępu (0–1), liczonych OD KOŃCA
 * bitów hero (`useHeroScrollTimeline` dodaje offset `HERO_END`). `start` = kiedy
 * bit wchodzi, `duration` = jak długo trwa na osi postępu.
 *
 *   regrow — kadr DOM rośnie z małej karty z powrotem na pełny ekran, WCIĄŻ
 *            awersem (`cardReveal` = 1): obraz „rozchodzi się" i sam przykrywa
 *            tytuł oraz kadry hero. Pod spodem nie ma jeszcze czerni.
 *   flip   — dopiero na pełnym ekranie kadr obraca się awers→rewers:
 *            `cardReveal` 1→0 (bokiem), w połowie podmiana tekstury na
 *            `about_img.jpeg`, `cardReveal` 0→1 (z powrotem frontem). Czarne tło
 *            włącza się na starcie tego bitu — kadr zasłania cały ekran, więc
 *            jest to niewidoczne.
 *   hold   — rewers trzymany na całą stronę.
 *   shrink — rewers zjeżdża i zmniejsza się do ~1/3 ekranu; dopiero teraz wokół
 *            kadru odsłania się czerń (puste miejsca).
 *   copyIn — wjazd pionowego „ROGSON" i bloku opisu po prawej.
 *
 * Kształt ramki (`clip-path` + obrys) NIE jest morfowany — kadr cały czas ma
 * kształt karty hero w spoczynku (`HERO_CLIP_FINAL`).
 */
export const ABOUT_PHASE = {
  regrow: { start: 0, duration: 0.3 },
  flip: { start: 0.3, duration: 0.26 },
  hold: { start: 0.56, duration: 0.08 },
  shrink: { start: 0.64, duration: 0.3 },
  copyIn: { start: 0.8, duration: 0.24 },
} as const
