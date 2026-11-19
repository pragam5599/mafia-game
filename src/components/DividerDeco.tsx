import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';

// Figma: Divider/Deco (30:32). Art Deco divider: hairlines with a red diamond.
export function DividerDeco() {
  return (
    <View style={styles.root}>
      <View style={styles.line} />
      <View style={styles.diamondBox}>
        <View style={styles.diamond} />
      </View>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  line: { flex: 1, height: 1, backgroundColor: colors.border.strong },
  diamondBox: { width: 9.9, height: 9.9, alignItems: 'center', justifyContent: 'center' },
  diamond: { width: 7, height: 7, backgroundColor: colors.accent.default, transform: [{ rotate: '45deg' }] },
});
