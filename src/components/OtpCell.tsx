import { StyleSheet, View } from 'react-native';
import { colors, radius } from '@/theme';
import { Text } from './Text';

// Figma: OTP Cell (28:61). One digit of the 6-digit code. Active = cursor position.
export type OtpCellState = 'empty' | 'filled' | 'active';

type Props = {
  digit?: string;
  state?: OtpCellState;
};

export function OtpCell({ digit = '', state = 'empty' }: Props) {
  return (
    <View style={[styles.base, styles[state]]}>
      <Text variant="headingS" color={state === 'active' ? colors.highlight.default : colors.text.primary}>
        {state === 'active' && !digit ? '|' : digit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 44,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.raised,
    borderRadius: radius.sm,
  },
  empty: { borderWidth: 1, borderColor: colors.border.subtle },
  filled: { borderWidth: 1, borderColor: colors.border.strong },
  active: { borderWidth: 1.5, borderColor: colors.border.highlight },
});
