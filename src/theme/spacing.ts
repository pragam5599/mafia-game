export const spacing = {
  '2xs': 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 14,
  full: 999,
} as const;

/** Mobile frame from Figma: 390 × 844, side padding 24. */
export const layout = {
  frameWidth: 390,
  frameHeight: 844,
  gutter: spacing['2xl'],
  topInset: 60,
  bottomInset: 34,
} as const;
