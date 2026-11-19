import { StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, effects, radius, spacing } from '@/theme';
import { Text } from './Text';

// Figma: Announcement Card (30:251). Public results: dawn, vote result, win.
export type AnnouncementKind = 'death' | 'saved' | 'eliminated' | 'noElimination' | 'townWins' | 'mafiaWins';

type Props = {
  kind: AnnouncementKind;
  eyebrow: string;
  title: string;
  detail: string;
  /** Auto last words, shown in quotes. */
  lastWords?: string;
};

const look: Record<AnnouncementKind, { accent: string; eyebrow: string; frame: ViewStyle }> = {
  death: { accent: colors.border.accent, eyebrow: colors.role.mafia, frame: {} },
  eliminated: { accent: colors.border.accent, eyebrow: colors.role.mafia, frame: {} },
  saved: { accent: colors.success.default, eyebrow: colors.role.doctor, frame: {} },
  noElimination: { accent: colors.border.strong, eyebrow: colors.text.muted, frame: {} },
  townWins: { accent: colors.success.default, eyebrow: colors.role.doctor, frame: effects.glowHighlight },
  mafiaWins: { accent: colors.border.accent, eyebrow: colors.role.mafia, frame: effects.glowAccent },
};

export function AnnouncementCard({ kind, eyebrow, title, detail, lastWords }: Props) {
  const l = look[kind];
  const isWin = kind === 'townWins' || kind === 'mafiaWins';
  return (
    <View style={[styles.root, { borderColor: l.accent }, l.frame]}>
      <Text variant="labelS" color={l.eyebrow} align="center">
        {eyebrow}
      </Text>
      <Text variant={isWin ? 'displayL' : 'displayM'} align="center">
        {title}
      </Text>
      <View style={[styles.rule, { backgroundColor: l.accent }]} />
      <Text variant="bodyMStrong" color={colors.text.secondary} align="center">
        {detail}
      </Text>
      {lastWords ? (
        <Text variant="bodyS" color={colors.text.muted} align="center">
          {`"${lastWords}"`}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing['3xl'],
    backgroundColor: colors.bg.surface,
    borderWidth: 1.5,
    borderRadius: radius.lg,
  },
  rule: { width: 48, height: 1 },
});
