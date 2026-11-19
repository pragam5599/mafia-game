import type { ViewStyle } from 'react-native';

// Figma effect styles as CSS box-shadows (React Native 0.76+ `boxShadow`, iOS + Android).
export const effects = {
  /** Glow/Accent: #c1121f @45%, blur 28, no offset. */
  glowAccent: { boxShadow: '0px 0px 28px 0px rgba(193, 18, 31, 0.45)' },
  /** Glow/Highlight: #e2a443 @40%, blur 32, no offset. */
  glowHighlight: { boxShadow: '0px 0px 32px 0px rgba(226, 164, 67, 0.4)' },
  /** Shadow/Card: #000 @55%, blur 30, y 10. */
  shadowCard: { boxShadow: '0px 10px 30px 0px rgba(0, 0, 0, 0.55)' },
} satisfies Record<string, ViewStyle>;
