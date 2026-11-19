import type { GameState } from './engine';
import type { PlayerId, Role } from './types';
import { eligibleVoters, NONE, type VoteChoice } from './vote';

// Who may see what. The server uses these to write each phone's private view;
// Firestore rules enforce the same split (Phase 3).

/**
 * A player sees their own role (+ Mafia partners while alive). Roles of the dead are public,
 * except players who left: hidden until the game ends. Eliminated players see only their own role
 * on top of what is public. The narrator sees every role. At game over, everyone sees everything.
 */
export function canSeeRole(state: GameState, viewerId: PlayerId, targetId: PlayerId): boolean {
  if (state.phase === 'gameOver') return true;
  if (viewerId === state.narratorId) return true;
  if (viewerId === targetId) return true;
  const target = state.players.find((p) => p.id === targetId);
  if (!target) return false;
  if (!target.alive && target.death?.cause !== 'left') return true;
  const viewer = state.players.find((p) => p.id === viewerId);
  return !!viewer?.alive && viewer.role === 'mafia' && target.role === 'mafia';
}

export function visibleRoles(state: GameState, viewerId: PlayerId): Record<PlayerId, Role> {
  const out: Record<PlayerId, Role> = {};
  for (const p of state.players) if (canSeeRole(state, viewerId, p.id)) out[p.id] = p.role;
  return out;
}

export type VoteView =
  | { kind: 'narrator'; ballots: Record<PlayerId, VoteChoice>; voted: number; total: number }
  | { kind: 'player'; voted: number; total: number; myVote: VoteChoice | null };

/** Players see only "Voted: X of N" (and their own pick). Only the narrator sees who voted whom. */
export function voteView(state: GameState, viewerId: PlayerId): VoteView | null {
  const live = state.vote?.ballots ?? null;
  const ballots = live ?? state.lastVote?.ballots ?? null;
  if (!ballots) return null;
  // A closed tally already lists every eligible voter (missing = None).
  const total = live ? eligibleVoters(state.players).length : Object.keys(ballots).length;
  const voted = live ? Object.keys(live).length : Object.values(ballots).filter((c) => c !== NONE).length;
  if (viewerId === state.narratorId) return { kind: 'narrator', ballots: { ...ballots }, voted, total };
  return { kind: 'player', voted, total, myVote: ballots[viewerId] ?? null };
}
