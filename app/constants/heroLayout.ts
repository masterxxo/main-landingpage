export const HERO_CARD = {
  maxWidth: 480,
  widthRatio: 0.27,
  height: 430,
  leftRatio: 0.39,
  topRatio: 0.5,
} as const

export const MOBILE_HERO_PIN_SCREENS = 1.05

export const HERO_TIMELINE = {
  reshape: { start: 0.08, duration: 0.72 },
  labelsOut: { start: 0, duration: 0.2 },
  title: { start: 0.48, duration: 0.28 },
  smallPlaceholder: { start: 0.56, duration: 0.34 },
  sidePlaceholder: { start: 0.46, duration: 0.42 },
  grid: { start: 0.62, duration: 0.28 },
  annotation: { start: 0.62, duration: 0.18 },
  tiltActiveFrom: 0.72,
} as const

export const HERO_LABELS = {
  scrambleMsPerChar: 140,
  startDelay: 250,
  gapMs: 180,
} as const
