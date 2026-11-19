import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { Text } from './Text';

// Small titled boxes from the hi-fi screens:
// warning = A3 "Choose carefully" (amber); waiting = P2 "Waiting for the host to start" (dashed, centred).
type Props = {
  title: string;
  body?: string;
  kind?: 'warning' | 'waiting';
};

export function Notice({ title, body, kind = 'warning' }: Props) {
  const waiting = kind === 'waiting';
  return (
    <View style={[styles.root, waiting ? styles.waiting : styles.warning]}>
      <Text variant="labelS" color={colors.highlight.default} align={waiting ? 'center' : undefined}>
        {title}
      </Text>
      {body ? (
        <Text variant="bodyS" color={waiting ? colors.text.secondary : colors.text.primary} align={waiting ? 'center' : undefined}>
          {body}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignSelf: 'stretch', gap: spacing.xs, borderWidth: 1, borderRadius: radius.md, overflow: 'hidden' },
  warning: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.highlight.subtle,
    borderColor: colors.border.highlight,
  },
  waiting: {
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bg.surface,
    borderColor: colors.border.subtle,
    borderStyle: 'dashed',
  },
});
