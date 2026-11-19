import { MIN_VOTES_TO_ELIMINATE } from './config';
import { GameError } from './errors';
import type { Player, PlayerId } from './types';

// Day vote, RULES.md "Day rules".

export const NONE = 'none';
export type VoteChoice = PlayerId | typeof NONE;

export type VoteTally = {
  /** Every eligible voter; anyone who did not vote in time is None. */
  ballots: Record<PlayerId, VoteChoice>;
  counts: Record<PlayerId, number>;
  none: number;
  topCount: number;
  eliminatedId: PlayerId | null;
  reason: 'eliminated' | 'tie' | 'tooFewVotes';
};

/** Alive players vote (the narrator is not a player; the dead cannot vote). */
export function eligibleVoters(players: readonly Player[]): PlayerId[] {
  return players.filter((p) => p.alive).map((p) => p.id);
}

/** Pick a player or None. No one can vote for themselves; Mafia may vote for partners. */
export function validVoteTargets(players: readonly Player[], voterId: PlayerId): PlayerId[] {
  return players.filter((p) => p.alive && p.id !== voterId).map((p) => p.id);
}

export function validateVote(players: readonly Player[], voterId: PlayerId, choice: VoteChoice): void {
  if (!eligibleVoters(players).includes(voterId)) {
    throw new GameError('notAlive', `${voterId} cannot vote.`);
  }
  if (choice !== NONE && !validVoteTargets(players, voterId).includes(choice)) {
    throw new GameError('invalidTarget', `${voterId} cannot vote for ${choice}.`);
  }
}

/** None votes are ignored. Top player is out only with ≥ 2 votes and no tie. */
export function tallyVotes(players: readonly Player[], cast: Readonly<Record<PlayerId, VoteChoice>>): VoteTally {
  const ballots: Record<PlayerId, VoteChoice> = {};
  for (const id of eligibleVoters(players)) ballots[id] = cast[id] ?? NONE;

  const counts: Record<PlayerId, number> = {};
  let none = 0;
  for (const choice of Object.values(ballots)) {
    if (choice === NONE) none++;
    else counts[choice] = (counts[choice] ?? 0) + 1;
  }

  const topCount = Math.max(0, ...Object.values(counts));
  const leaders = Object.keys(counts).filter((id) => counts[id] === topCount);
  const reason = topCount < MIN_VOTES_TO_ELIMINATE ? 'tooFewVotes' : leaders.length > 1 ? 'tie' : 'eliminated';
  return { ballots, counts, none, topCount, eliminatedId: reason === 'eliminated' ? leaders[0] : null, reason };
}
