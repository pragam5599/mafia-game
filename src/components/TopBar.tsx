import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';
import { ActionChip } from './ActionChip';
import { BackChip } from './BackChip';
import { Text } from './Text';

// Figma: Top Bar (29:128). Eyebrow = phase or step (amber). Narrator variant adds Pause and Hide roles.

export type NarratorActions = {
  paused: boolean;
  onTogglePause: () => void;
  rolesHidden?: boolean;
  /** Omit on narrator screens that do not list roles. */
  onToggleHideRoles?: () => void;
};

type Props = {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  narrator?: NarratorActions;
  /** Extra chips on the right of the eyebrow row (e.g. Leave). */
  right?: ReactNode;
  /** Shows a Back chip above the title (screens before the game starts). */
  onBack?: () => void;
};

export function TopBar({ title, eyebrow, subtitle, narrator, right, onBack }: Props) {
  return (
    <View style={styles.root}>
      {onBack ? <BackChip onPress={onBack} /> : null}
      {eyebrow || narrator || right ? (
        <View style={styles.topRow}>
          {eyebrow ? (
            <Text variant="labelS" color={colors.highlight.default} numberOfLines={1} style={styles.eyebrow}>
              {eyebrow}
            </Text>
          ) : (
            <View />
          )}
          {narrator || right ? (
            <View style={styles.actions}>
              {right}
              {narrator ? (
                <ActionChip
                  label={narrator.paused ? 'Resume' : 'Pause'}
                  active={narrator.paused}
                  onPress={narrator.onTogglePause}
                />
              ) : null}
              {narrator?.onToggleHideRoles ? (
                <ActionChip
                  label="Hide roles"
                  active={narrator.rolesHidden}
                  onPress={narrator.onToggleHideRoles}
                />
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
      <Text variant="displayL">{title}</Text>
      {subtitle ? (
        <Text variant="bodyS" color={colors.text.secondary}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignSelf: 'stretch', gap: spacing.sm },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  eyebrow: { flexShrink: 1 },
  actions: { flexDirection: 'row', gap: 6 },
});
