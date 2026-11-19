import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';
import { Text } from './Text';

// Figma: Wordmark (30:25). App name lockup. "MAFIA" is uppercase in the artwork itself.
export function Wordmark() {
  return (
    <View style={styles.root}>
      <Text variant="wordmark" align="center">
        MAFIA
      </Text>
      <View style={styles.rule} />
      <Text variant="labelS" color={colors.text.secondary} align="center">
        The night game
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', alignSelf: 'center', gap: spacing.xs },
  rule: { width: 120, height: 2, backgroundColor: colors.accent.default },
});
