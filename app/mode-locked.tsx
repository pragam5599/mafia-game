import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Illustration, Seal, Text } from '@/components';
import { colors, spacing, withAlpha } from '@/theme';

// A5c · Mode locked in (46:4228). Splash ~2 s, then Home (dissolve). Mode B reuses it with its own words.

const WORDS = {
  A: { title: 'The Narrator', line: 'One of you will run the night.' },
  B: { title: 'The Dealer', line: 'The app deals the roles. You play at the table.' },
} as const;

const SPLASH_MS = 2000;

function Corner({ style }: { style: object }) {
  return <View style={[styles.corner, style]} />;
}

export default function ModeLockedIn() {
  const insets = useSafeAreaInsets();
  const mode = useLocalSearchParams<{ mode?: string }>().mode === 'B' ? 'B' : 'A';
  const words = WORDS[mode];
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: SPLASH_MS, easing: Easing.inOut(Easing.quad), useNativeDriver: false }).start();
    const id = setTimeout(() => router.replace('/home'), SPLASH_MS);
    return () => clearTimeout(id);
  }, [progress]);

  return (
    <View style={styles.root}>
      <Illustration name="scene" style={styles.keyArt} />
      <LinearGradient colors={[withAlpha(colors.bg.base, 0.95), withAlpha(colors.bg.base, 0)]} style={styles.fadeTop} />
      <LinearGradient colors={[withAlpha(colors.bg.base, 0), colors.bg.base]} style={styles.fadeBottom} />
      <View style={styles.below} />

      {/* Art Deco frame with diamond corners. */}
      <View style={styles.frame} />
      <Corner style={{ top: 10, left: 10 }} />
      <Corner style={{ top: 10, right: 10 }} />
      <Corner style={{ bottom: 10, left: 10 }} />
      <Corner style={{ bottom: 10, right: 10 }} />

      <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing['2xl']) + 46 }]}>
        <Seal letter={mode} />
        <View style={styles.text}>
          <Text variant="labelM" color={colors.highlight.default} align="center">
            Mode locked in
          </Text>
          <Text variant="displayXL" align="center">
            {words.title}
          </Text>
          <Text variant="bodyM" color={colors.text.secondary} align="center" style={styles.line}>
            {words.line}
          </Text>
        </View>
        <View style={styles.loaderTrack}>
          <Animated.View
            style={[styles.loaderFill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
          />
        </View>
        <Text variant="labelS" color={colors.text.muted} align="center">
          Opening the lobby
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base, overflow: 'hidden' },
  // Figma Key art: Scene at 390 × 693, top −150.
  keyArt: { position: 'absolute', left: 0, right: 0, top: -150, height: 693.33 },
  fadeTop: { position: 'absolute', left: 0, right: 0, top: 0, height: 200 },
  fadeBottom: { position: 'absolute', left: 0, right: 0, top: 328.33, height: 215 },
  below: { position: 'absolute', left: 0, right: 0, top: 543.33, bottom: 0, backgroundColor: colors.bg.base },
  frame: {
    position: 'absolute',
    left: 14,
    right: 14,
    top: 14,
    bottom: 14,
    borderWidth: 1,
    borderColor: colors.highlight.default,
    borderRadius: 10,
    opacity: 0.45,
  },
  corner: { position: 'absolute', width: 8, height: 8, backgroundColor: colors.highlight.default, transform: [{ rotate: '45deg' }] },
  content: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: spacing['2xl'] },
  text: { alignSelf: 'stretch', marginTop: 16, gap: 2 },
  line: { marginTop: 8 },
  loaderTrack: { width: 200, height: 3, borderRadius: 2, backgroundColor: colors.bg.overlay, marginTop: 26, marginBottom: 9, overflow: 'hidden' },
  loaderFill: { height: 3, borderRadius: 2, backgroundColor: colors.accent.default },
});
