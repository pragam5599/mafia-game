import { StyleSheet, View } from 'react-native';
import type { RoleOrNarrator } from '@/game/types';
import { colors, effects, radius, spacing } from '@/theme';
import { Illustration, type IllustrationName } from './Illustration';
import { roleColor, roleLabel } from './RoleTag';
import { Text } from './Text';

// Figma: Role Card (30:339). Private role card; Hidden = sealed case file before hold to reveal.
export type RoleCardRole = RoleOrNarrator | 'hidden';

const art: Record<RoleCardRole, IllustrationName> = {
  hidden: 'hidden',
  mafia: 'duo',
  doctor: 'doctor',
  detective: 'detective',
  villager: 'villager',
  narrator: 'narrator',
};

// Default copy from the Figma variants. Screens pass `description` to add Mafia partners.
export const roleCardDescription: Record<RoleCardRole, string> = {
  hidden: 'Make sure nobody is looking at your screen.',
  mafia: 'Each night, agree with your partners on one person to kill.',
  doctor: 'Each night, save one person. You can save yourself.',
  detective: 'Each night, check one person. The narrator answers yes or no.',
  villager: 'No night action. Find the Mafia and vote them out.',
  narrator: 'You run the game. You see every role. You are not counted as a player.',
};

type Props = {
  role: RoleCardRole;
  description?: string;
  /** Words on the hidden card (players hold; the narrator taps). */
  hiddenLabel?: string;
};

export function RoleCard({ role, description = roleCardDescription[role], hiddenLabel = 'Hold to reveal' }: Props) {
  const hidden = role === 'hidden';
  const accent = hidden ? colors.border.strong : roleColor[role];
  return (
    <View style={[styles.outer, { borderColor: accent }, effects.shadowCard]}>
      <View style={styles.inner}>
        <Text variant="labelS" color={colors.text.secondary} align="center">
          {role === 'narrator' ? 'You were picked' : 'Your role'}
        </Text>
        {/* Duo art has its own 10px corner in Figma; the other role art is pre-shaped. */}
        <Illustration name={art[role]} style={[styles.art, role === 'mafia' && styles.duo]} />
        {hidden ? (
          <Text variant="displayM" align="center">
            {hiddenLabel}
          </Text>
        ) : (
          <Text variant="displayXL" color={accent} align="center">
            {roleLabel[role]}
          </Text>
        )}
        <Text variant="bodyS" color={colors.text.secondary} align="center">
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignSelf: 'stretch',
    padding: 6,
    backgroundColor: colors.bg.surface,
    borderWidth: 1.5,
    borderRadius: radius.lg,
  },
  inner: {
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['2xl'],
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  art: { width: 260, height: 200 },
  duo: { borderRadius: 10, backgroundColor: colors.accent.default },
});
