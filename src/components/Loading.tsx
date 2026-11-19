import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';
import { Text } from './Text';

/** Full-screen wait state in the Noir style. */
export function Loading({ label }: { label?: string }) {
  return (
    <View style={styles.root}>
      <ActivityIndicator color={colors.highlight.default} />
      {label ? (
        <Text variant="labelS" color={colors.text.muted} align="center">
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: colors.bg.base },
});
