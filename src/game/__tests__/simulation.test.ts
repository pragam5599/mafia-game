import { describe, expect, it } from 'vitest';
import { VOTE_MS } from '../config';
import { createGame, reduce, type Action, type GameState } from '../engine';
import { validTargets } from '../night';
import { pickOne, seededRng, type Rng } from '../rng';
import { roleCounts } from '../roles';
import type { Member } from '../types';
import { NONE, validVoteTargets } from '../vote';
import { checkWinner } from '../win';

// Plays many random full games with only legal moves and checks the rules hold at every step.

function narratorMove(s: GameState, rng: Rng): Action | null {
  const by = s.narratorId;
  switch (s.phase) {
    case 'roleCheck':
      return { type: 'startGame', by };
    case 'night': {
      const d = s.night!;
      if (d.picks[d.step] === null) return { type: 'nightPick', by, targetId: pickOne(validTargets(s.players, d.step), rng) };
      return rng() < 0.1 && d.step !== 'mafia' ? { type: 'nightBack', by } : { type: 'nightConfirm', by };
    }
    case 'dawn':
      return { type: 'announceDawn', by };
    case 'discussion':
      return rng() < 0.2 && s.discussion!.extensionsUsed < 3 ? { type: 'addMinute', by } : { type: 'startVoting', by };
    case 'reveal':
      return { type: 'revealVote', by };
    case 'roundStatus':
      return { type: 'startNextNight', by };
    default:
      return null;
  }
}

function playRandomGame(seed: number) {
  const rng = seededRng(seed);
  const size = 5 + (seed % 17); // 5–21 people
  const members: Member[] = Array.from({ length: size }, (_, i) => ({ id: `p${i}`, name: `P${i}` }));
  let now = 1_000_000;
  let s = createGame(members, 'p0', { now, rng });
  s = s.players.reduce((st, p) => reduce(st, { type: 'ackRole', by: p.id }, { now, rng }), s);

  const counts = roleCounts(size - 1);
  expect(s.players.filter((p) => p.role === 'mafia')).toHaveLength(counts.mafia);

  for (let step = 0; step < 2000 && s.phase !== 'gameOver'; step++) {
    if (s.phase === 'vote') {
      // Some players vote (randomly), the rest time out.
      for (const p of s.players.filter((x) => x.alive)) {
        if (s.phase !== 'vote' || rng() < 0.2) continue;
        const choice = rng() < 0.25 ? NONE : pickOne(validVoteTargets(s.players, p.id), rng);
        s = reduce(s, { type: 'castVote', by: p.id, choice }, { now, rng });
      }
      now += VOTE_MS;
      // Every phone keeps saying "still here" (otherwise the silent narrator would pause the game).
      for (const m of s.members) s = reduce(s, { type: 'heartbeat', by: m.id }, { now, rng });
      s = reduce(s, { type: 'tick' }, { now, rng });
      expect(s.phase).toBe('reveal');
      continue;
    }
    const move = narratorMove(s, rng);
    if (!move) break;
    const before = s.players.filter((p) => p.alive).length;
    s = reduce(s, move, { now, rng });
    // At most one person leaves the game per step.
    expect(before - s.players.filter((p) => p.alive).length).toBeLessThanOrEqual(1);
    // The game never continues past a win at a check point.
    if (s.phase === 'discussion' || s.phase === 'roundStatus') expect(checkWinner(s.players)).toBeNull();
  }

  expect(s.phase).toBe('gameOver');
  expect(s.winner).toBe(checkWinner(s.players));
  return s;
}

describe('Random full games', () => {
  it('300 games from 5 to 21 people always end with a correct winner', () => {
    const winners = { town: 0, mafia: 0 };
    for (let seed = 1; seed <= 300; seed++) winners[playRandomGame(seed).winner!]++;
    expect(winners.town).toBeGreaterThan(0);
    expect(winners.mafia).toBeGreaterThan(0);
  });
});
