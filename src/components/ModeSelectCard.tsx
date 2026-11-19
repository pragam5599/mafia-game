import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { colors, effects, withAlpha } from '@/theme';
import { DividerDeco } from './DividerDeco';
import { Icon } from './Icon';
import { Illustration } from './Illustration';
import { Text } from './Text';

// Figma: Mode Select Card (45:1939). A5 carousel poster, 280×460.
// Focus = centre card (glow, badge). Idle = side card peeking (dimmed, shown at ~86% scale).
export type Mode = 'A' | 'B';

const content = {
  A: {
    badge: 'Mode I',
    title: 'The Narrator',
    body: 'One player runs the night out loud. Everyone else plays from their phone.',
    stats: [
      ['5–21', 'Players'],
      ['Human', 'Narrator'],
      ['In person', 'Table'],
    ],
    footnote: 'Best with 8 to 12 players in one room.',
  },
  B: {
    badge: 'Mode II',
    title: 'The Dealer',
    body: 'The app only deals the roles. One narrator runs the whole game out loud.',
    stats: [
      ['5–21', 'Players'],
      ['Human', 'Narrator'],
      ['In person', 'Table'],
    ],
    footnote: 'Phones show roles only. Everything else happens at the table.',
  },
} as const;

const CARD_RADIUS = 18; // Figma poster corner; not on the radius scale.

export function ModeSelectCard({ mode, focused }: { mode: Mode; focused: boolean }) {
  const c = content[mode];
  const locked = false; // Mode B is playable now (deal only); the locked look is kept for later modes.
  // Figma positions children from the card's outer edge; RN positions them inside the border.
  const bw = focused ? (mode === 'A' ? 2 : 1.5) : 1;
  const frame = focused
    ? mode === 'A'
      ? [{ borderWidth: 2, borderColor: colors.accent.default }, effects.glowAccent]
      : [{ borderWidth: 1.5, borderColor: colors.border.highlight }, effects.glowHighlight]
    : [{ borderWidth: 1, borderColor: colors.border.subtle }];

  return (
    <View style={[styles.shadowHost, ...frame]}>
      <View style={styles.clip}>
        <View style={[styles.art, { left: -bw, top: -bw }]}>
          {mode === 'A' ? (
            <Illustration name="scene" style={styles.scene} />
          ) : (
            <Illustration name="radio" style={styles.radio} />
          )}
        </View>
        <LinearGradient
          colors={[withAlpha(colors.bg.surface, 0), colors.bg.surface]}
          style={[styles.fade, { left: -bw, top: 160 - bw }]}
        />
        {locked ? (
          <>
            <View style={[styles.lockedDim, { left: -bw, top: -bw }]} />
            <View style={[styles.bigLock, { left: 118 - bw, top: 108 - bw }]}>
              <Icon name="lock" size={44} />
            </View>
          </>
        ) : null}

        <View style={[styles.badges, { left: 14 - bw, top: 14 - bw }]}>
          <View style={styles.badgeMode}>
            <Text variant="labelS">{c.badge}</Text>
          </View>
          {focused && !locked ? (
            <View style={styles.badgeSelected}>
              <Icon name="check" size={14} />
              <Text variant="labelS" color={colors.text.onAccent}>
                Selected
              </Text>
            </View>
          ) : null}
          {locked ? (
            <View style={styles.badgeSoon}>
              <Icon name="lock" size={14} />
              <Text variant="labelS" color={colors.highlight.default}>
                Coming soon
              </Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.content, { left: 20 - bw, top: 258 - bw }]}>
          <Text variant="displayL">{c.title}</Text>
          <Text variant="bodyS" color={colors.text.secondary}>
            {c.body}
          </Text>
          <DividerDeco />
          <View style={styles.stats}>
            {c.stats.map(([value, label]) => (
              <View key={label} style={styles.stat}>
                <Text variant="headingS" color={locked ? colors.highlight.default : colors.text.primary} numberOfLines={1}>
                  {value}
                </Text>
                <Text variant="labelS" color={colors.text.muted}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
          <Text variant="bodyS" color={colors.text.muted}>
            {c.footnote}
          </Text>
        </View>

        {!focused ? <View style={[styles.idleDim, { left: -bw, top: -bw }]} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowHost: { width: 280, height: 460, borderRadius: CARD_RADIUS, backgroundColor: colors.bg.surface },
  clip: { flex: 1, borderRadius: CARD_RADIUS - 1, overflow: 'hidden' },
  art: { position: 'absolute', width: 280, height: 290, overflow: 'hidden' },
  scene: { position: 'absolute', left: -24, top: -257, width: 342, height: 608 },
  radio: { position: 'absolute', left: -22, top: 0, width: 324.8, height: 290 },
  fade: { position: 'absolute', width: 280, height: 140 },
  lockedDim: { position: 'absolute', width: 280, height: 290, backgroundColor: colors.bg.base, opacity: 0.45 },
  bigLock: { position: 'absolute' },
  badges: {
    position: 'absolute',
    width: 252,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeMode: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.strong,
    backgroundColor: colors.bg.overlay,
  },
  badgeSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.accent.default,
  },
  badgeSoon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.highlight,
    backgroundColor: colors.highlight.subtle,
  },
  content: { position: 'absolute', width: 240, gap: 10 },
  stats: { flexDirection: 'row' },
  stat: { flex: 1, minWidth: 0, alignItems: 'center', gap: 2 },
  idleDim: { position: 'absolute', width: 280, height: 460, backgroundColor: colors.bg.base, opacity: 0.35 },
});
