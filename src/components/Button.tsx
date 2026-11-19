import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors, effects, radius, spacing } from '@/theme';
import { Text } from './Text';

// Figma: Button (28:19). Primary = the one action that moves the game on.
export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', disabled = false, style }: Props) {
  const labelColor = disabled
    ? colors.disabled.text
    : variant === 'primary'
      ? colors.text.onAccent
      : variant === 'secondary'
        ? colors.text.primary
        : colors.text.secondary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && (disabled ? styles.filledDisabled : styles.primary),
        variant === 'primary' && !disabled && pressed && styles.primaryPressed,
        variant === 'secondary' && (disabled ? styles.filledDisabled : styles.secondary),
        variant !== 'primary' && !disabled && pressed && styles.pressed,
        style,
      ]}
    >
      <Text variant="labelM" color={labelColor} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
  },
  primary: { backgroundColor: colors.accent.default, ...effects.glowAccent },
  primaryPressed: { backgroundColor: colors.accent.hover },
  secondary: { borderWidth: 1, borderColor: colors.border.strong },
  filledDisabled: { backgroundColor: colors.disabled.bg },
  pressed: { opacity: 0.7 },
});
