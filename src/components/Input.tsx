import { useState, type ReactNode } from 'react';
import { Platform, StyleSheet, TextInput, View, type TextInputProps, type TextStyle } from 'react-native';
import { colors, radius, spacing, type } from '@/theme';
import { Text } from './Text';

// Figma: Input (28:51). Focus = typing. Error = invalid or taken. Success = live check passed.
export type InputState = 'default' | 'error' | 'success';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  helper?: string;
  state?: InputState;
  /** Optional element before the text, e.g. a country-code picker. */
  leading?: ReactNode;
  /** Forces the focus look (used by the component preview). */
  forceFocus?: boolean;
};

export function Input({ label, helper, state = 'default', leading, forceFocus, onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const showFocus = (focused || forceFocus) && state === 'default';

  const fieldBorder =
    state === 'success'
      ? styles.success
      : state === 'error'
        ? styles.error
        : showFocus
          ? styles.focus
          : styles.idle;

  const helperColor =
    state === 'success' ? colors.success.default : state === 'error' ? colors.accent.default : colors.text.muted;

  return (
    <View style={styles.root}>
      <Text variant="labelS" color={colors.text.secondary}>
        {label}
      </Text>
      <View style={[styles.field, fieldBorder]}>
        {leading}
        <TextInput
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          placeholderTextColor={colors.text.muted}
          selectionColor={colors.highlight.default}
          cursorColor={colors.highlight.default}
          style={styles.text}
        />
      </View>
      {helper ? (
        <Text variant="bodyS" color={helperColor}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignSelf: 'stretch', gap: spacing.sm },
  field: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bg.raised,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  idle: { borderWidth: 1, borderColor: colors.border.subtle },
  focus: { borderWidth: 1.5, borderColor: colors.border.highlight },
  error: { borderWidth: 1.5, borderColor: colors.border.accent },
  success: { borderWidth: 1.5, borderColor: colors.success.default },
  text: {
    ...type.bodyM,
    flex: 1,
    color: colors.text.primary,
    paddingVertical: 0,
    // TextInput clips descenders if lineHeight is forced on iOS.
    lineHeight: undefined,
    // The field border already shows focus; drop the browser outline in the web preview.
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : {}),
  },
});
