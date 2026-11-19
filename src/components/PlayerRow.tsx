import { Pressable, StyleSheet, View } from 'react-native';
import type { RoleOrNarrator } from '@/game/types';
import { colors, radius, spacing } from '@/theme';
import { RoleTag } from './RoleTag';
import { StatusTag, type Status } from './StatusTag';
import { Text } from './Text';

// Figma: Player Row (29:51). Selected = current pick (red). Disabled = cannot be picked.
export type PlayerRowState = 'default' | 'selected' | 'disabled' | 'eliminated';

type Props = {
  name: string;
  /** Avatar letter; defaults to the first letter of the name ("-" for the None vote row). */
  initial?: string;
  detail?: string;
  role?: RoleOrNarrator;
  status?: Status;
  state?: PlayerRowState;
  onPress?: () => void;
};

export function PlayerRow({ name, initial: initialProp, detail, role, status, state = 'default', onPress }: Props) {
  const selected = state === 'selected';
  const out = state === 'eliminated';
  // Avatar letter only; the name itself is shown exactly as written.
  const initial = initialProp ?? name.trim().charAt(0).toUpperCase();

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected, disabled: state === 'disabled' } : undefined}
      disabled={!onPress || state === 'disabled' || out}
      onPress={onPress}
      style={[
        styles.row,
        selected ? styles.selected : out ? styles.eliminated : styles.default,
        state === 'disabled' && styles.disabled,
      ]}
    >
      <View style={[styles.avatar, selected && styles.avatarSelected]}>
        <Text variant="labelM" color={out ? colors.text.muted : colors.text.primary}>
          {initial}
        </Text>
      </View>
      <View style={styles.text}>
        <Text variant="bodyMStrong" color={out ? colors.text.muted : colors.text.primary} numberOfLines={1}>
          {name}
        </Text>
        {detail ? (
          <Text variant="bodyS" color={colors.text.secondary} numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
      </View>
      {role || status ? (
        <View style={styles.tags}>
          {role ? <RoleTag role={role} /> : null}
          {status ? <StatusTag status={status} /> : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  default: { backgroundColor: colors.bg.raised, borderWidth: 1, borderColor: colors.border.subtle },
  selected: { backgroundColor: colors.accent.subtle, borderWidth: 1.5, borderColor: colors.border.accent },
  eliminated: { backgroundColor: colors.bg.surface, borderWidth: 1, borderColor: colors.border.subtle },
  disabled: { opacity: 0.45 },
  avatar: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.bg.overlay,
    overflow: 'hidden',
  },
  avatarSelected: { borderColor: colors.border.accent },
  text: { flex: 1, minWidth: 0, gap: 2 },
  tags: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
