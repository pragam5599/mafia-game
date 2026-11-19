import { describe, expect, it } from 'vitest';
import { HOST_OFFLINE_HANDOVER_MS, NARRATOR_OFFLINE_END_MS, VOTE_MS } from '../config';
import { reduce, type GameState } from '../engine';
import { GameError } from '../errors';
import { seededRng } from '../rng';
import { canStart } from '../room';
import { nameInRoom } from '../username';
import { canSeeRole, visibleRoles, voteView } from '../visibility';
import { NONE } from '../vote';
import { N, T0, alive, playNight, run, toNight1, voteTimeUp } from './fixture';

// One test per line of RULES.md "Acceptance tests", in the same words.
// Scripted 9-player game (2 Mafia, 1 Doctor, 1 Detective, 5 Villagers) + narrator.
// Mafia: aarav, tara. Doctor: isha. Detective: rohan. Narrator: meera. Host: host (a villager).

const rng = seededRng(42);

/** Night 1 with no death (Doctor saves) → discussion → vote open. */
function toVote(): GameState {
  let s = playNight(toNight1(), 'zoya', 'zoya', 'aarav');
  s = run(s, [
    { type: 'announceDawn', by: N },
    { type: 'startVoting', by: N },
  ]);
  return s;
}

describe('Acceptance tests (RULES.md)', () => {
  it('Start stays locked until 5 people have joined.', () => {
    expect(canStart(1)).toBe(false);
    expect(canStart(4)).toBe(false);
    expect(canStart(5)).toBe(true);
    expect(canStart(21)).toBe(true);
  });

  it('Doctor saves the Mafia target → no one dies, status stays Alive.', () => {
    const s = playNight(toNight1(), 'zoya', 'zoya', 'aarav');
    expect(s.phase).toBe('dawn');
    expect(s.lastNight?.killedId).toBeNull();
    expect(alive(s, 'zoya')).toBe(true);
    expect(s.players.every((p) => p.alive)).toBe(true);
  });

  it('Back on the Doctor step lets the narrator change the Mafia target.', () => {
    let s = run(toNight1(), [
      { type: 'nightPick', by: N, targetId: 'zoya' },
      { type: 'nightConfirm', by: N },
    ]);
    expect(s.night?.step).toBe('doctor');
    s = run(s, [
      { type: 'nightBack', by: N },
      { type: 'nightPick', by: N, targetId: 'kabir' },
      { type: 'nightConfirm', by: N },
      { type: 'nightPick', by: N, targetId: 'isha' },
      { type: 'nightConfirm', by: N },
      { type: 'nightPick', by: N, targetId: 'dev' },
      { type: 'nightConfirm', by: N },
    ]);
    expect(s.lastNight?.targetId).toBe('kabir');
    expect(alive(s, 'kabir')).toBe(false);
    expect(alive(s, 'zoya')).toBe(true);
  });

  it('Dead Doctor → Doctor step skipped.', () => {
    // Night 1: Mafia kill the Doctor.
    let s = playNight(toNight1(), 'isha', 'zoya', 'aarav');
    expect(alive(s, 'isha')).toBe(false);
    s = run(s, [
      { type: 'announceDawn', by: N },
      { type: 'startVoting', by: N },
      ...['host', 'aarav', 'tara', 'rohan', 'zoya', 'kabir', 'dev', 'nina'].map(
        (by) => ({ type: 'castVote', by, choice: NONE }) as const,
      ),
    ]);
    s = run(voteTimeUp(s), [
      { type: 'revealVote', by: N },
      { type: 'startNextNight', by: N },
    ]);
    expect(s.night?.skipped).toEqual(['doctor']);
    s = run(s, [
      { type: 'nightPick', by: N, targetId: 'zoya' },
      { type: 'nightConfirm', by: N },
    ]);
    expect(s.night?.step).toBe('detective'); // straight past the Doctor
  });

  it('Vote tie → no one eliminated. Top count of 1 → no one eliminated.', () => {
    // Tie: 2 for zoya, 2 for kabir, the rest None.
    let tie = run(toVote(), [
      { type: 'castVote', by: 'host', choice: 'zoya' },
      { type: 'castVote', by: 'aarav', choice: 'zoya' },
      { type: 'castVote', by: 'tara', choice: 'kabir' },
      { type: 'castVote', by: 'isha', choice: 'kabir' },
    ]);
    tie = reduce(tie, { type: 'tick' }, { now: T0 + VOTE_MS, rng });
    expect(tie.lastVote?.reason).toBe('tie');
    expect(tie.lastVote?.eliminatedId).toBeNull();

    // Top count 1: one vote each.
    let low = run(toVote(), [
      { type: 'castVote', by: 'host', choice: 'zoya' },
      { type: 'castVote', by: 'aarav', choice: 'kabir' },
    ]);
    low = reduce(low, { type: 'tick' }, { now: T0 + VOTE_MS, rng });
    expect(low.lastVote?.reason).toBe('tooFewVotes');
    expect(low.lastVote?.eliminatedId).toBeNull();

    const revealed = run(low, [{ type: 'revealVote', by: N }], T0 + VOTE_MS);
    expect(revealed.players.every((p) => p.alive)).toBe(true);
  });

  it('None votes ignored. No vote in 30 s = None.', () => {
    let s = run(toVote(), [
      { type: 'castVote', by: 'host', choice: 'zoya' },
      { type: 'castVote', by: 'aarav', choice: 'zoya' },
      { type: 'castVote', by: 'tara', choice: NONE },
      { type: 'castVote', by: 'isha', choice: NONE },
      { type: 'castVote', by: 'rohan', choice: NONE },
    ]);
    expect(s.phase).toBe('vote'); // 4 people have not voted yet
    s = reduce(s, { type: 'tick' }, { now: T0 + VOTE_MS - 1, rng });
    expect(s.phase).toBe('vote'); // timer not done
    s = reduce(s, { type: 'tick' }, { now: T0 + VOTE_MS, rng });
    expect(s.phase).toBe('reveal');
    // 3 chose None, 4 timed out → 7 None, all ignored; zoya's 2 votes win.
    expect(s.lastVote?.none).toBe(7);
    expect(s.lastVote?.ballots.kabir).toBe(NONE);
    expect(s.lastVote?.eliminatedId).toBe('zoya');
  });

  it('Players never see who voted whom; the narrator does.', () => {
    const s = run(toVote(), [
      { type: 'castVote', by: 'host', choice: 'zoya' },
      { type: 'castVote', by: 'aarav', choice: 'kabir' },
    ]);
    const asPlayer = voteView(s, 'zoya');
    expect(asPlayer).toEqual({ kind: 'player', voted: 2, total: 9, myVote: null });
    expect(JSON.stringify(asPlayer)).not.toContain('kabir');

    const asNarrator = voteView(s, N);
    expect(asNarrator?.kind).toBe('narrator');
    expect(asNarrator && 'ballots' in asNarrator && asNarrator.ballots).toEqual({ host: 'zoya', aarav: 'kabir' });
  });

  it('Mafia equal to Town after Dawn → Mafia win.', () => {
    // Kill town players until 2 Mafia vs 3 Town, then one more night kill → 2 vs 2.
    let s = toNight1();
    s.players = s.players.map((p) => (['host', 'zoya', 'kabir', 'dev'].includes(p.id) ? { ...p, alive: false, death: { cause: 'vote', round: 0 } } : p));
    // Alive: aarav, tara (Mafia) + isha, rohan, nina (Town) = 2 vs 3.
    s = playNight(s, 'nina', 'isha', 'tara');
    expect(s.phase).toBe('dawn');
    s = run(s, [{ type: 'announceDawn', by: N }]);
    expect(s.phase).toBe('gameOver');
    expect(s.winner).toBe('mafia');
  });

  it('Narrator offline pauses the game; host can end it after 2 min.', () => {
    let s = toVote();
    s = reduce(s, { type: 'presence', id: N, online: false }, { now: T0 + 1000, rng });
    expect(s.pause?.reason).toBe('narratorOffline');
    expect(() => reduce(s, { type: 'castVote', by: 'host', choice: 'zoya' }, { now: T0 + 2000, rng })).toThrow(GameError);
    // Timers stop while paused: far past 30 s, the vote is still open.
    s = reduce(s, { type: 'tick' }, { now: T0 + 10 * VOTE_MS, rng });
    expect(s.phase).toBe('vote');

    const early = T0 + 1000 + NARRATOR_OFFLINE_END_MS - 1;
    expect(() => reduce(s, { type: 'endGame', by: 'host' }, { now: early, rng })).toThrow(/2 minutes/);
    expect(() => reduce(s, { type: 'endGame', by: 'zoya' }, { now: T0 + 1000 + NARRATOR_OFFLINE_END_MS, rng })).toThrow(/host/);

    const ended = reduce(s, { type: 'endGame', by: 'host' }, { now: T0 + 1000 + NARRATOR_OFFLINE_END_MS, rng });
    expect(ended.phase).toBe('gameOver');
    expect(ended.endedBy).toBe('host');
  });

  it('Host offline 2 min → host passes to next in join order.', () => {
    let s = toNight1();
    // Everyone else's phone keeps saying "still here"; the host's phone goes quiet.
    const others = s.members.filter((m) => m.id !== 'host').map((m) => m.id);
    const beat = (st: typeof s, at: number) => others.reduce((x, id) => reduce(x, { type: 'heartbeat', by: id }, { now: at, rng }), st);
    s = reduce(s, { type: 'presence', id: 'host', online: false }, { now: T0, rng });
    s = beat(s, T0 + HOST_OFFLINE_HANDOVER_MS - 1);
    s = reduce(s, { type: 'tick' }, { now: T0 + HOST_OFFLINE_HANDOVER_MS - 1, rng });
    expect(s.hostId).toBe('host'); // back within 2 min keeps host
    s = beat(s, T0 + HOST_OFFLINE_HANDOVER_MS);
    s = reduce(s, { type: 'tick' }, { now: T0 + HOST_OFFLINE_HANDOVER_MS, rng });
    expect(s.hostId).toBe('aarav'); // next in join order
    // If they return, they are a normal player.
    s = reduce(s, { type: 'presence', id: 'host', online: true }, { now: T0 + HOST_OFFLINE_HANDOVER_MS + 1, rng });
    expect(s.hostId).toBe('aarav');
  });

  it('Two players in one room cannot share a name ("Isha" = "isha"); other rooms can.', () => {
    const room = [{ id: 'host', name: 'Isha' }];
    expect(nameInRoom('isha', room)).toBe(true);
    expect(nameInRoom('Isha', [{ id: 'x', name: 'Rohan' }])).toBe(false);
  });

  it('A player who leaves is eliminated and their role stays hidden until the game ends.', () => {
    let s = run(toNight1(), [{ type: 'leave', by: 'tara' }]);
    const tara = s.players.find((p) => p.id === 'tara')!;
    expect(tara.alive).toBe(false);
    expect(tara.death?.cause).toBe('left');
    expect(canSeeRole(s, 'zoya', 'tara')).toBe(false); // town can't see it
    expect(canSeeRole(s, N, 'tara')).toBe(true); // narrator sees every role
    expect(visibleRoles(s, 'zoya')).toEqual({ zoya: 'villager' });

    // Compare: someone killed at night has their role revealed.
    s = playNight(s, 'zoya', 'isha', 'aarav');
    expect(canSeeRole(s, 'kabir', 'zoya')).toBe(true);

    // Aarav (last Mafia) is voted out → Town wins → everything is revealed.
    s = run(s, [
      { type: 'announceDawn', by: N },
      { type: 'startVoting', by: N },
      ...['host', 'isha', 'rohan', 'kabir', 'dev', 'nina'].map((by) => ({ type: 'castVote', by, choice: 'aarav' }) as const),
      { type: 'castVote', by: 'aarav', choice: NONE },
    ]);
    s = run(voteTimeUp(s), [{ type: 'revealVote', by: N }]);
    expect(s.phase).toBe('gameOver');
    expect(s.winner).toBe('town');
    expect(canSeeRole(s, 'zoya', 'tara')).toBe(true);
  });
});
