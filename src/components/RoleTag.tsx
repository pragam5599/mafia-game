import type { RoleOrNarrator } from '@/game/types';
import { colors } from '@/theme';
import { Pill } from './Pill';

// Figma: Role Tag (28:75). Only the narrator (and Mafia, for partners) see these during a game.

export const roleLabel: Record<RoleOrNarrator, string> = {
  mafia: 'Mafia',
  doctor: 'Doctor',
  detective: 'Detective',
  villager: 'Villager',
  narrator: 'Narrator',
};

export const roleColor: Record<RoleOrNarrator, string> = {
  mafia: colors.role.mafia,
  doctor: colors.role.doctor,
  detective: colors.role.detective,
  villager: colors.role.villager,
  narrator: colors.highlight.default,
};

export function RoleTag({ role }: { role: RoleOrNarrator }) {
  const c = roleColor[role];
  return <Pill label={roleLabel[role]} textColor={c} borderColor={c} backgroundColor={colors.bg.overlay} />;
}
