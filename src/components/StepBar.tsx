import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';
import { Text } from './Text';

// Figma: Step Bar (29:95). Night progress: Step 1 Mafia, Step 2 Doctor, Step 3 Detective.
export type StepState = 'now' | 'done' | 'skipped' | 'upcoming';

export type Step = { name: string; state: StepState };

const look: Record<StepState, { bar: string; label: string; name: string; suffix: string }> = {
  now: { bar: colors.accent.default, label: colors.highlight.default, name: colors.text.primary, suffix: ' · now' },
  done: { bar: colors.success.default, label: colors.success.default, name: colors.text.secondary, suffix: ' · done' },
  skipped: { bar: colors.border.subtle, label: colors.text.muted, name: colors.text.muted, suffix: ' · skipped' },
  upcoming: { bar: colors.border.subtle, label: colors.text.muted, name: colors.text.muted, suffix: '' },
};

export function StepBar({ steps }: { steps: Step[] }) {
  return (
    <View style={styles.root}>
      {steps.map((step, i) => {
        const l = look[step.state];
        return (
          <View key={step.name} style={styles.segment}>
            <View style={[styles.bar, { backgroundColor: l.bar }]} />
            <Text variant="labelS" color={l.label} numberOfLines={1}>
              {`Step ${i + 1}${l.suffix}`}
            </Text>
            <Text
              variant="labelM"
              color={l.name}
              numberOfLines={1}
              style={step.state === 'skipped' && styles.struck}
            >
              {step.name}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignSelf: 'stretch', flexDirection: 'row', gap: spacing.sm },
  segment: { flex: 1, minWidth: 0, gap: 5 },
  bar: { height: 4, borderRadius: 2 },
  struck: { textDecorationLine: 'line-through' },
});
