import type { TextStyle } from 'react-native';

// Font family names as registered by useFonts in app/_layout.tsx.
export const fonts = {
  spectralBold: 'Spectral_700Bold',
  spectralExtraBold: 'Spectral_800ExtraBold',
  dmSansRegular: 'DMSans_400Regular',
  dmSansMedium: 'DMSans_500Medium',
  dmSansSemiBold: 'DMSans_600SemiBold',
  barlowSemiBold: 'BarlowCondensed_600SemiBold',
  barlowBold: 'BarlowCondensed_700Bold',
  bodoniBlack: 'BodoniModa_900Black',
  bodoniBoldItalic: 'BodoniModa_700Bold_Italic',
} as const;

// Figma tracking is a % of font size; React Native wants px.
const track = (size: number, percent: number) => (size * percent) / 100;

function style(fontFamily: string, fontSize: number, lineHeight: number, trackingPercent = 0): TextStyle {
  return { fontFamily, fontSize, lineHeight, letterSpacing: track(fontSize, trackingPercent) };
}

// No style changes case: text is shown exactly as written.
export const type = {
  displayXL: style(fonts.spectralExtraBold, 40, 46, -0.5),
  displayL: style(fonts.spectralExtraBold, 28, 34, -0.5),
  displayM: style(fonts.spectralBold, 21, 27),
  numericTimer: style(fonts.spectralExtraBold, 60, 62, -1),
  headingS: style(fonts.dmSansSemiBold, 17, 24),
  bodyM: style(fonts.dmSansRegular, 15, 22),
  bodyMStrong: style(fonts.dmSansMedium, 15, 22),
  bodyS: style(fonts.dmSansRegular, 13, 18),
  labelM: style(fonts.barlowBold, 16, 20, 1),
  labelS: style(fonts.barlowSemiBold, 13, 16, 2),
  // Wordmark only (Figma node 30:25): Bodoni Moda Black 44/48, +18%.
  wordmark: style(fonts.bodoniBlack, 44, 48, 18),
  // A5 carousel arrow (Figma 46:7631): Bodoni Moda Bold Italic 34/30.
  arrow: style(fonts.bodoniBoldItalic, 34, 30),
} as const;

export type TypeVariant = keyof typeof type;
