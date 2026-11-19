import { StyleSheet, View } from 'react-native';
import { radius, spacing } from '@/theme';
import { Text } from './Text';

// Shared pill shape for Role Tag and Status Tag.
type Props = { label: string; textColor: string; borderColor: string; backgroundColor: string };

export function Pill({ label, textColor, borderColor, backgroundColor }: Props) {
  return (
    <View style={[styles.pill, { borderColor, backgroundColor }]}>
      <Text variant="labelS" color={textColor} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing['2xs'],
    borderRadius: radius.full,
    borderWidth: 1,
  },
});
