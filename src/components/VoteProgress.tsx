import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';
import { Text } from './Text';

// Figma: Vote Progress (29:136). How many have voted; never who voted whom.
type Props = {
  done: number;
  total: number;
  label?: string;
};

export function VoteProgress({ done, total, label = 'Voted' }: Props) {
  const share = total > 0 ? Math.min(1, done / total) : 0;
  return (
    <View style={styles.root}>
      <Text variant="labelS" color={colors.text.secondary}>
        {label}
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${share * 100}%` }]} />
      </View>
      <Text variant="labelM">{`${done} of ${total}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: colors.bg.overlay },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.accent.default },
});
