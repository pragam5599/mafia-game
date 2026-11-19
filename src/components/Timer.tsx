import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { Text } from './Text';

// Figma: Timer (29:109). Large = discussion. Compact = 30-second vote and short countdowns.

/** 180 → "03:00". */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

type Props = {
  label: string;
  secondsLeft: number;
  size?: 'large' | 'compact';
  /** 0–1 share of time left, for the Large track. */
  progress?: number;
  caption?: string;
};

export function Timer({ label, secondsLeft, size = 'large', progress = 1, caption }: Props) {
  if (size === 'compact') {
    return (
      <View style={styles.compact}>
        <Text variant="labelS" color={colors.highlight.default}>
          {label}
        </Text>
        <Text variant="headingS" color={colors.text.primary}>
          {formatClock(secondsLeft)}
        </Text>
        {caption ? (
          <Text variant="bodyS" color={colors.text.muted}>
            {caption}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.large}>
      <Text variant="labelS" color={colors.highlight.default}>
        {label}
      </Text>
      <Text variant="numericTimer" color={colors.text.primary}>
        {formatClock(secondsLeft)}
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(1, Math.max(0, progress)) * 100}%` }]} />
      </View>
      {caption ? (
        <Text variant="bodyS" color={colors.text.muted}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  large: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing['2xl'],
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.lg,
  },
  track: {
    alignSelf: 'stretch',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: colors.bg.overlay,
  },
  fill: { height: 4, backgroundColor: colors.highlight.default },
  compact: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.highlight.subtle,
    borderWidth: 1,
    borderColor: colors.border.highlight,
    borderRadius: radius.full,
  },
});
