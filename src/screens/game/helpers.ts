import type { Status } from '@/components';
import type { PublicPlayer } from '@/game/model';
import type { Role } from '@/game/types';
import type { VoteChoice } from '@/game/vote';
import { NONE } from '@/game/vote';

// Small view helpers shared by narrator and player screens.

export function statusOf(p: PublicPlayer): Status {
  if (p.alive) return 'alive';
  return p.deathCause === 'night' ? 'dead' : 'eliminated';
}

/** N9 detail line for someone who is out. */
export function deathDetail(p: PublicPlayer): string | undefined {
  if (p.alive || p.deathRound === null) return undefined;
  if (p.deathCause === 'night') return `Killed · Night ${p.deathRound}`;
  if (p.deathCause === 'vote') return `Voted out · Day ${p.deathRound}`;
  return 'Left the game';
}

export const nameOf = (players: PublicPlayer[], id: string | null | undefined) =>
  players.find((p) => p.id === id)?.name ?? '';

/** "Totals: Rohan 3 · Isha 2 · None 1" (biggest first, None last). */
export function totalsLine(players: PublicPlayer[], ballots: Record<string, VoteChoice>): string {
  const counts = new Map<string, number>();
  let none = 0;
  for (const c of Object.values(ballots)) {
    if (c === NONE) none++;
    else counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  const parts = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id, n]) => `${nameOf(players, id)} ${n}`);
  if (none) parts.push(`None ${none}`);
  return parts.length ? `Totals: ${parts.join(' · ')}` : 'No votes yet';
}

/** Mafia role-card line with partners (P3). */
export function mafiaDescription(partners: string[]): string {
  if (partners.length === 0) return 'Each night, pick one person to kill.';
  if (partners.length === 1) return `Each night, agree with your partner on one person to kill. Partner: ${partners[0]}.`;
  return `Each night, agree with your partners on one person to kill. Partners: ${partners.join(', ')}.`;
}

/** "Game over · Day 2" or "· Night 3" when it ended at dawn. */
export function gameOverEyebrow(players: PublicPlayer[], round: number): string {
  const votedOutNow = players.some((p) => p.deathCause === 'vote' && p.deathRound === round);
  return `Game over · ${votedOutNow ? 'Day' : 'Night'} ${round}`;
}

export const roleOrHidden = (role: Role | undefined, hidden: boolean) => (hidden ? undefined : role);
