import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackChip, Button, Illustration, ModeSelectCard, PagerDots, Text, type Mode } from '@/components';
import { saveMode } from '@/firebase/api';
import { useSession } from '@/firebase/hooks';
import { colors, layout, spacing, withAlpha } from '@/theme';

// A5 · Choose mode (38:1376) and A5b · Mode B locked (46:3496).
// Swipeable posters; the backdrop changes with the focused card. Mode B is Coming soon.

const MODES: Mode[] = ['A', 'B'];
const CARD_H = 460;
const IDLE_SCALE = 0.86; // side cards peek at ~86% (Figma)
const STEP = 247.4; // centre-to-centre distance between cards in Figma

export default function ChooseMode() {
  const session = useSession();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scroller = useRef<Animated.FlatList<Mode>>(null);
  const [index, setIndex] = useState(0);
  const mode = MODES[index];
  const name = session.status === 'ready' ? session.profile.username : '';

  const side = (width - STEP) / 2; // centres the focused card
  const goTo = (i: number) => {
    setIndex(i);
    scroller.current?.scrollToOffset({ offset: i * STEP, animated: true });
  };
  const settle = (x: number) => setIndex(Math.max(0, Math.min(MODES.length - 1, Math.round(x / STEP))));

  const backdropB = scrollX.interpolate({ inputRange: [0, STEP], outputRange: [0, 1], extrapolate: 'clamp' });
  const backdropA = Animated.subtract(1, backdropB);

  return (
    <View style={styles.root}>
      {/* Backdrops cross-fade with the swipe. */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdropA }]}>
        <Illustration name="backdropA" style={styles.backdropA} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdropB }]}>
        <Illustration name="backdropB" style={styles.backdropB} />
      </Animated.View>
      <View style={styles.tint} />
      <LinearGradient colors={[withAlpha(colors.bg.base, 0.95), withAlpha(colors.bg.base, 0)]} style={styles.fadeTop} />
      <LinearGradient colors={[withAlpha(colors.bg.base, 0), colors.bg.base]} style={styles.fadeBottom} />

      <View style={[styles.header, { paddingTop: Math.max(58, insets.top + 10) }]}>
        <BackChip onPress={() => router.replace('/name')} />
        <View style={styles.headerRow}>
          <Text variant="bodyS" color={colors.text.secondary}>
            {name ? `Playing as ${name}` : ' '}
          </Text>
          <Text variant="labelM" color={colors.highlight.default}>
            {mode === 'A' ? 'I / II' : 'II / II'}
          </Text>
        </View>
        <Text variant="displayL">Choose your game</Text>
        <Text variant="bodyS" color={colors.text.secondary}>
          Swipe to pick how tonight is narrated.
        </Text>
      </View>

      <View style={styles.carouselArea}>
        <Animated.FlatList
          ref={scroller}
          data={MODES}
          keyExtractor={(m) => m}
          extraData={index}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={STEP}
          decelerationRate="fast"
          disableIntervalMomentum
          contentContainerStyle={{ paddingHorizontal: side }}
          style={styles.carousel}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: Platform.OS !== 'web',
          })}
          onMomentumScrollEnd={(e) => settle(e.nativeEvent.contentOffset.x)}
          onScrollEndDrag={(e) => settle(e.nativeEvent.contentOffset.x)}
          scrollEventThrottle={16}
          CellRendererComponent={({ index: i, style, ...rest }) => (
            // Keep the focused card on top of the one peeking behind it.
            <View style={[style, { zIndex: i === index ? 2 : 1 }]} {...rest} />
          )}
          renderItem={({ item, index: i }) => {
            const range = [(i - 1) * STEP, i * STEP, (i + 1) * STEP];
            const scale = scrollX.interpolate({ inputRange: range, outputRange: [IDLE_SCALE, 1, IDLE_SCALE], extrapolate: 'clamp' });
            return (
              <Pressable style={styles.slot} onPress={() => goTo(i)} accessibilityRole="button" accessibilityLabel={item === 'A' ? 'Mode I, The Narrator' : 'Mode II, The Dealer'}>
                <Animated.View style={{ transform: [{ scale }] }}>
                  <ModeSelectCard mode={item} focused={i === index} />
                </Animated.View>
              </Pressable>
            );
          }}
        />
        {/* "›" / "‹" hint toward the other card. */}
        <Pressable
          onPress={() => goTo(index === 0 ? 1 : 0)}
          style={[styles.arrow, index === 0 ? styles.arrowRight : styles.arrowLeft]}
          hitSlop={12}
          accessibilityLabel={index === 0 ? 'Show Mode II' : 'Show Mode I'}
        >
          <Text variant="arrow" color={colors.highlight.default} style={styles.arrowText}>
            {index === 0 ? '›' : '‹'}
          </Text>
        </Pressable>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing['2xl']) }]}>
        <PagerDots count={2} active={index} />
        <Button
          label={`Play Mode ${mode}`}
          onPress={async () => {
            await saveMode(mode);
            router.replace(`/mode-locked?mode=${mode}`);
          }}
        />
        <Text variant="bodyS" color={colors.text.muted} align="center">
          {mode === 'A' ? 'Swipe left to see Mode B' : 'Swipe right for Mode A'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base, overflow: 'hidden' },
  // Figma positions (blur already baked into the exports).
  backdropA: { position: 'absolute', left: -61, top: -82, width: 512, height: 876 },
  backdropB: { position: 'absolute', left: -307, top: -26, width: 1004, height: 902 },
  tint: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: colors.bg.base, opacity: 0.5 },
  fadeTop: { position: 'absolute', left: 0, right: 0, top: 0, height: 190 },
  fadeBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 284 },
  header: { paddingHorizontal: layout.gutter, gap: spacing.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  carouselArea: { flex: 1, justifyContent: 'center' },
  carousel: { flexGrow: 0, overflow: 'visible' },
  slot: { width: STEP, height: CARD_H + 40, alignItems: 'center', justifyContent: 'center' },
  arrow: { position: 'absolute', top: '50%', marginTop: -15 },
  arrowRight: { right: 6 },
  arrowLeft: { left: 6 },
  arrowText: { opacity: 0.9 },
  footer: { paddingHorizontal: layout.gutter, gap: spacing.xl, alignItems: 'stretch', paddingTop: spacing.xl },
});
