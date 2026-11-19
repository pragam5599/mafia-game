import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, spacing } from '@/theme';
import { Illustration } from './Illustration';

// The 390 × 844 frame every hi-fi screen sits in: base background, amber glow at the top,
// 24px side gutter, 16px gap between blocks. Screens marked "(scrolls)" pass `scroll`.
/** Top glow colour: amber on most screens, red at night, grey on the hidden role card (Figma). */
export type GlowTone = 'amber' | 'red' | 'grey';

const glowColor: Record<GlowTone, string> = {
  amber: colors.highlight.subtle,
  red: colors.accent.subtle,
  grey: colors.bg.overlay,
};

type Props = {
  children: ReactNode;
  scroll?: boolean;
  glow?: GlowTone | false;
  gap?: number;
  /** Lift the content above the keyboard (screens with text fields). */
  avoidKeyboard?: boolean;
  /** Extra layout for the content column, e.g. centred items. */
  contentStyle?: ViewStyle;
};

export function Screen({ children, scroll = false, glow = 'amber', gap = spacing.lg, avoidKeyboard = false, contentStyle }: Props) {
  const insets = useSafeAreaInsets();
  const padding: ViewStyle = {
    paddingTop: Math.max(layout.topInset, insets.top + spacing.md),
    paddingBottom: Math.max(insets.bottom, spacing['2xl']),
    paddingHorizontal: layout.gutter,
    gap,
    ...contentStyle,
  };

  // The glow belongs to the top of the frame, so on scrolling screens it scrolls away with the content.
  const glowLayer = glow ? (
    <View style={styles.glowClip}>
      <Illustration name="glowMask" style={styles.glow} tintColor={glowColor[glow]} />
    </View>
  ) : null;

  const body = (
    <>
      {scroll ? (
        <ScrollView
          style={styles.fill}
          contentContainerStyle={[styles.grow, padding]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {glowLayer}
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, padding]}>
          {glowLayer}
          {children}
        </View>
      )}
    </>
  );

  return (
    <View style={styles.root}>
      {avoidKeyboard ? (
        <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </View>
  );
}

/** Flexible space that pushes the following blocks (usually the main button) to the bottom. */
export function Spacer() {
  return <View style={styles.fill} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base, overflow: 'hidden' },
  // Figma "Glow": 460 × 340 ellipse at (-35, -210), blur included in the 680 × 560 export.
  // Clipped to the frame so the wide image never makes the page scroll sideways.
  glowClip: { position: 'absolute', left: 0, right: 0, top: 0, height: 240, overflow: 'hidden', pointerEvents: 'none' },
  glow: { position: 'absolute', left: -145, top: -320, width: 680, height: 560 },
  fill: { flex: 1 },
  grow: { flexGrow: 1 },
});
