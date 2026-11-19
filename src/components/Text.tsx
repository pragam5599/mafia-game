import { Platform, StyleSheet, Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { colors, type, type TypeVariant } from '@/theme';

export type TextProps = RNTextProps & {
  variant?: TypeVariant;
  color?: string;
  align?: 'left' | 'center' | 'right';
};

/** Typed text. Shows the string exactly as written: never changes case. */
export function Text({ variant = 'bodyM', color = colors.text.primary, align, style, ...rest }: TextProps) {
  return (
    <RNText
      {...rest}
      style={[type[variant], styles.base, { color }, align && { textAlign: align }, style]}
    />
  );
}

const styles = StyleSheet.create({
  // Android adds extra top/bottom padding to text; Figma line heights assume none.
  base: Platform.select({ android: { includeFontPadding: false }, default: {} }),
});
