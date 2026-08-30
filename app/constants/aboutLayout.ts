/** Od tej szerokości viewportu (px) gramy pełną, scrollowaną wersję ABOUT. */
export const DESKTOP_MIN_WIDTH = 1024

/**
 * Geometria karty ABOUT w stanie POCZĄTKOWYM — musi 1:1 odpowiadać końcowej
 * geometrii karty hero (`HERO_CARD` w `constants/heroLayout.ts`), żeby przejście
 * między sekcjami wyglądało jak jeden i ten sam kadr.
 *
 * UWAGA: te same liczby są zapisane w regułach `.about-card` / `.is-static`
 * w `AboutSection.vue` — przy zmianie aktualizuj oba miejsca.
 */
export const ABOUT_CARD_START = {
  maxWidth: 480,
  widthRatio: 0.27, // * window.innerWidth
  height: 430,
  leftRatio: 0.39, // * window.innerWidth
  topRatio: 0.5, // * window.innerHeight
} as const

/**
 * Geometria karty ABOUT w stanie DOCELOWYM (rewers zmniejszony do ~1/3 ekranu,
 * wyśrodkowany). `left` / `top` liczymy w runtime z faktycznego rozmiaru karty.
 */
export const ABOUT_CARD_FINAL = {
  maxWidth: 620,
  widthRatio: 1 / 3, // * window.innerWidth
  heightRatio: 0.72, // * window.innerHeight
} as const

/**
 * Choreografia scrollowego timeline (jednostki postępu ScrollTriggera 0–1):
 * `start` = kiedy beat wchodzi, `duration` = jak długo trwa na osi postępu.
 *
 * FAZA 1 — przykrycie hero:
 *   expand — kadr DOM rośnie do pełnego ekranu, a JEDNOCZEŚNIE shader kadru
 *            (ten sam co środkowa karta hero) odgrywa wejście hero WSTECZ:
 *            `reveal` 1 → 0, czyli „zoom out” + obrót wokół pionowej osi aż do
 *            ustawienia bokiem. W połowie tej drogi jest styk faz.
 *   flip   — `reveal` 0 → 1 z drugą teksturą (`about_img.jpeg`): kadr wraca
 *            frontem i dojeżdża do coveru — rewers na całą stronę.
 *   hold   — rewers trzymany na całą stronę.
 *
 * FAZA 2 — zjazd i pomniejszenie:
 *   shrink — rewers zjeżdża w dół i zmniejsza się do ~1/3 szerokości ekranu.
 *   copyIn — wjazd pionowego „ROGSON" i miejsca na opis po prawej.
 *
 * Podmiana tekstury awers→rewers następuje na styku `expand`/`flip` (kadr jest
 * wtedy ustawiony bokiem, `reveal` ≈ 0). Kształt ramki (`clip-path` + obrys) NIE
 * jest morfowany — kadr cały czas ma kształt ramki hero (`HERO_CLIP_FINAL`).
 */
export const ABOUT_TIMELINE = {
  expand: { start: 0, duration: 0.3 },
  flip: { start: 0.3, duration: 0.16 },
  hold: { start: 0.46, duration: 0.1 },
  shrink: { start: 0.56, duration: 0.34 },
  copyIn: { start: 0.74, duration: 0.26 },
} as const
