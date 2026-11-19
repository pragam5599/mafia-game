import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { ActionChip } from './ActionChip';
import { Text } from './Text';

// Figma: Mode Card (37:249). List-style mode picker. Disabled = not available yet.
export type ModeCardState = 'selected' | 'default' | 'disabled';

type Props = {
  modeLabel: string;
  title: string;
  description: string;
  meta?: string[];
  state?: ModeCardState;
  onPress?: () => void;
};

export function ModeCard({ modeLabel, title, description, meta, state = 'default', onPress }: Props) {
  const selected = state === 'selected';
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled: state === 'disabled' }}
      disabled={!onPress || state === 'disabled'}
      onPress={onPress}
      style={[styles.root, selected ? styles.selected : styles.default, state === 'disabled' && styles.disabled]}
    >
      <View style={styles.topRow}>
        <Text variant="labelS" color={selected ? colors.accent.default : colors.highlight.default}>
          {modeLabel}
        </Text>
        {selected ? (
          <Image source={require('../../assets/icons/radio-selected.svg')} style={styles.radio} />
        ) : (
          <View style={[styles.radio, styles.radioOff]} />
        )}
      </View>
      <Text variant="displayM">{title}</Text>
      <Text variant="bodyS" color={colors.text.secondary}>
        {description}
      </Text>
      {meta?.length ? (
        <View style={styles.meta}>
          {meta.map((m) => (
            <ActionChip key={m} label={m} />
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { alignSelf: 'stretch', gap: 10, padding: spacing.xl, borderRadius: radius.lg },
  selected: { backgroundColor: colors.accent.subtle, borderWidth: 1.5, borderColor: colors.border.accent },
  default: { backgroundColor: colors.bg.surface, borderWidth: 1, borderColor: colors.border.subtle },
  disabled: { opacity: 0.5 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  radio: { width: 22, height: 22 },
  radioOff: { borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border.strong },
  meta: { flexDirection: 'row', gap: 6 },
});
