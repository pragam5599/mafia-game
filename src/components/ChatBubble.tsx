import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { Text } from './Text';

// Figma: Chat Bubble (29:153). Dead-only chat.
type Props = {
  sender: string;
  message: string;
  mine?: boolean;
};

export function ChatBubble({ sender, message, mine = false }: Props) {
  return (
    <View style={[styles.root, mine ? styles.mine : styles.other]}>
      {/* Figma has the "You" label in plain black on the red bubble; secondary keeps it readable. */}
      <Text variant="labelS" color={colors.text.secondary}>
        {mine ? 'You' : sender}
      </Text>
      <Text variant="bodyM">{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 260,
    maxWidth: '80%',
    gap: spacing['2xs'],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  other: { alignSelf: 'flex-start', backgroundColor: colors.bg.raised, borderColor: colors.border.subtle },
  mine: { alignSelf: 'flex-start', backgroundColor: colors.accent.subtle, borderColor: colors.border.accent },
});
