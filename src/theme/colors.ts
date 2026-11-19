// Noir palette (docs/DESIGN.md, Figma "Design System" variables).
// Screens and components use `colors` (semantic) only, never `primitives`.

export const primitives = {
  ink950: '#08080a',
  ink900: '#0f0f12',
  ink800: '#17171b',
  ink700: '#222228',
  ink600: '#2e2e35',
  ink500: '#4a4a52',
  smoke400: '#7c766d',
  smoke300: '#a69f94',
  smoke200: '#cfc6b8',
  paper100: '#efe6d6',
  paper50: '#f7f1e6',
  blood900: '#3a0609',
  blood700: '#7a0f16',
  blood500: '#c1121f',
  blood400: '#e0303c',
  amber900: '#3d2a0e',
  amber500: '#e2a443',
  amber300: '#f2c981',
  teal900: '#0f2a28',
  teal500: '#3e8e86',
  teal300: '#7cc4bb',
  black: '#000000',
} as const;

const p = primitives;

export const colors = {
  bg: {
    base: p.ink950,
    surface: p.ink900,
    raised: p.ink800,
    overlay: p.ink700,
    inverse: p.paper100,
  },
  border: {
    subtle: p.ink600,
    strong: p.smoke400,
    accent: p.blood500,
    highlight: p.amber500,
  },
  text: {
    primary: p.paper100,
    secondary: p.smoke300,
    muted: p.smoke400,
    inverse: p.ink950,
    onAccent: p.paper50,
  },
  accent: {
    default: p.blood500,
    hover: p.blood400,
    subtle: p.blood900,
  },
  highlight: {
    default: p.amber500,
    subtle: p.amber900,
  },
  success: {
    default: p.teal500,
    subtle: p.teal900,
  },
  role: {
    mafia: p.blood400,
    doctor: p.teal300,
    detective: p.amber300,
    villager: p.smoke200,
  },
  disabled: {
    bg: p.ink700,
    text: p.ink500,
  },
} as const;

/** Adds alpha to a #rrggbb token, e.g. withAlpha(colors.bg.surface, 0). */
export function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
