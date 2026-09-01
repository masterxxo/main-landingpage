export const ABOUT_CARD_FINAL = {
  maxWidth: 620,
  widthRatio: 1 / 3,
  heightRatio: 0.72,
} as const

export const ABOUT_PHASE = {
  regrow: { start: 0, duration: 0.3 },
  flip: { start: 0.3, duration: 0.26 },
  shrink: { start: 0.64, duration: 0.3 },
  copyIn: { start: 0.8, duration: 0.24 },
} as const
