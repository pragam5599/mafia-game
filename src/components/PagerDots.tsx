import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme';

// Figma: Pager Dots (45:1379). Carousel position; active dot is a red pill.
export function PagerDots({ count, active }: { count: number; active: number }) {
  return (
    <View style={styles.root}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.dot, i === active && styles.active]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border.strong },
  active: { width: 22, backgroundColor: colors.accent.default },
});
