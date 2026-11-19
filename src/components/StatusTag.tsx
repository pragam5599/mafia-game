import { colors } from '@/theme';
import { Pill } from './Pill';

// Figma: Status Tag (28:95). Player state during a round.
export type Status = 'alive' | 'dead' | 'eliminated' | 'target' | 'saved' | 'checked' | 'seen' | 'waiting';

const label: Record<Status, string> = {
  alive: 'Alive',
  dead: 'Dead',
  eliminated: 'Eliminated',
  target: 'Target',
  saved: 'Saved',
  checked: 'Checked',
  seen: 'Seen',
  waiting: 'Not yet',
};

const neutral = { bg: colors.bg.overlay, border: colors.border.subtle };
const look: Record<Status, { text: string; bg: string; border: string }> = {
  alive: { ...neutral, text: colors.text.secondary },
  dead: { ...neutral, text: colors.text.muted },
  eliminated: { ...neutral, text: colors.text.muted },
  waiting: { ...neutral, text: colors.text.muted },
  target: { text: colors.role.mafia, bg: colors.accent.subtle, border: colors.border.accent },
  saved: { text: colors.role.doctor, bg: colors.success.subtle, border: colors.success.default },
  seen: { text: colors.role.doctor, bg: colors.success.subtle, border: colors.success.default },
  checked: { text: colors.highlight.default, bg: colors.highlight.subtle, border: colors.border.highlight },
};

export function StatusTag({ status }: { status: Status }) {
  const l = look[status];
  return <Pill label={label[status]} textColor={l.text} borderColor={l.border} backgroundColor={l.bg} />;
}
