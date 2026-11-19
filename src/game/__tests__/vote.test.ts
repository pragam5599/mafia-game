import { describe, expect, it } from 'vitest';
import { GameError } from '../errors';
import type { Player, Role } from '../types';
import { NONE, eligibleVoters, tallyVotes, validateVote, validVoteTargets } from '../vote';

const mk = (id: string, role: Role = 'villager', alive = true): Player => ({
  id,
  name: id,
  role,
  alive,
  death: alive ? null : { cause: 'vote', round: 1 },
});
const players = [mk('a', 'mafia'), mk('b', 'mafia'), mk('c'), mk('d'), mk('e'), mk('dead', 'villager', false)];

describe('Who can vote for whom', () => {
  it('only alive players vote', () => {
    expect(eligibleVoters(players)).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(() => validateVote(players, 'dead', 'a')).toThrow(GameError);
  });

  it('no one can vote for themselves', () => {
    expect(validVoteTargets(players, 'c')).not.toContain('c');
    expect(() => validateVote(players, 'c', 'c')).toThrow(GameError);
  });

  it('Mafia may vote for partners', () => {
    expect(() => validateVote(players, 'a', 'b')).not.toThrow();
  });

  it('None is always allowed; dead players cannot be voted for', () => {
    expect(() => validateVote(players, 'a', NONE)).not.toThrow();
    expect(() => validateVote(players, 'a', 'dead')).toThrow(GameError);
  });
});

describe('Tally', () => {
  it('top player with ≥ 2 votes and no tie is eliminated', () => {
    const t = tallyVotes(players, { a: 'c', b: 'c', c: 'd', d: NONE });
    expect(t.eliminatedId).toBe('c');
    expect(t.reason).toBe('eliminated');
    expect(t.counts).toEqual({ c: 2, d: 1 });
  });

  it('tie at the top → no one', () => {
    const t = tallyVotes(players, { a: 'c', b: 'c', c: 'd', d: 'c', e: 'd' });
    expect(t.counts).toEqual({ c: 3, d: 2 });
    expect(t.eliminatedId).toBe('c');
    const tie = tallyVotes(players, { a: 'c', b: 'c', c: 'd', e: 'd' });
    expect(tie.reason).toBe('tie');
    expect(tie.eliminatedId).toBeNull();
  });

  it('top count under 2 → no one', () => {
    expect(tallyVotes(players, { a: 'c' }).reason).toBe('tooFewVotes');
    expect(tallyVotes(players, {}).reason).toBe('tooFewVotes');
  });

  it('missing votes count as None and None is ignored', () => {
    const t = tallyVotes(players, { a: 'c', b: 'c' });
    expect(t.none).toBe(3);
    expect(t.ballots).toEqual({ a: 'c', b: 'c', c: NONE, d: NONE, e: NONE });
    expect(t.eliminatedId).toBe('c');
  });

  it('ballots from people who cannot vote are dropped', () => {
    const t = tallyVotes(players, { dead: 'c', a: 'c' });
    expect(t.counts).toEqual({ c: 1 });
  });
});
