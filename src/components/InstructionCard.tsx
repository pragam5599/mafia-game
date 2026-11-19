import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { Text } from './Text';

// Figma: Instruction Card (29:129). The narrator script: what to say aloud and what to tap.
type Props = {
  quote: string;
  label?: string;
  hint?: string;
};

export function InstructionCard({ quote, label = 'Say aloud', hint }: Props) {
  return (
    <View style={styles.root}>
      <Text variant="labelS" color={colors.highlight.default}>
        {label}
      </Text>
      <Text variant="bodyMStrong">{quote}</Text>
      {hint ? (
        <Text variant="bodyS" color={colors.text.secondary}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'stretch',
    gap: spacing.xs,
    padding: spacing.lg,
    backgroundColor: colors.highlight.subtle,
    borderWidth: 1,
    borderColor: colors.border.highlight,
    borderRadius: radius.md,
  },
});
