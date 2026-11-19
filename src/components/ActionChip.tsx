import { Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { Text } from './Text';

// Figma: Action Chip (28:27). Header toggles: Hide roles, Pause. Active = toggled on.
type Props = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

export function ActionChip({ label, active = false, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected: active } : undefined}
      disabled={!onPress}
      onPress={onPress}
      hitSlop={8}
      style={[styles.base, active ? styles.active : styles.default]}
    >
      <Text variant="labelS" color={active ? colors.highlight.default : colors.text.secondary} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  default: { backgroundColor: colors.bg.raised, borderColor: colors.border.subtle },
  active: { backgroundColor: colors.highlight.subtle, borderColor: colors.border.highlight },
});
