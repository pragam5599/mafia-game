import { describe, expect, it } from 'vitest';
import { DISCUSSION_MS, EXTENSION_MS, ROLE_CHECK_GRACE_MS, VOTE_MS } from '../config';
import { reduce, playAgain, waitingForAck, createGame } from '../engine';
import { GameError } from '../errors';
import { seededRng } from '../rng';
import { timeLeft } from '../timer';
import { NONE } from '../vote';
import { MEMBERS, N, T0, everyoneAcks, playNight, run, scriptedGame, toNight1, voteTimeUp } from './fixture';

const rng = seededRng(5);
const at = (ms: number) => ({ now: T0 + ms, rng });

describe('Role check', () => {
  it('narrator can start once everyone has seen their role', () => {
    const s = scriptedGame();
    expect(() => run(s, [{ type: 'startGame', by: N }])).toThrow(/seen their role/);
    const started = run(s, [...everyoneAcks(s), { type: 'startGame', by: N }]);
    expect(started.phase).toBe('night');
    expect(started.round).toBe(1);
  });

  it('…or after 30 s if someone has not acknowledged', () => {
    const s = run(scriptedGame(), [{ type: 'ackRole', by: 'aarav' }]);
    expect(waitingForAck(s)).toHaveLength(8);
    expect(() => reduce(s, { type: 'startGame', by: N }, at(ROLE_CHECK_GRACE_MS - 1))).toThrow(GameError);
    expect(reduce(s, { type: 'startGame', by: N }, at(ROLE_CHECK_GRACE_MS)).phase).toBe('night');
  });

  it('the narrator is not a player and does not acknowledge', () => {
    expect(() => run(scriptedGame(), [{ type: 'ackRole', by: N }])).toThrow(/not a player/);
  });

  it('only the narrator taps Start game', () => {
    const s = scriptedGame();
    expect(() => run(s, [...everyoneAcks(s), { type: 'startGame', by: 'host' }])).toThrow(/narrator/);
  });
});

describe('Discussion', () => {
  const toDiscussion = () => run(playNight(toNight1(), 'zoya', 'zoya', 'aarav'), [{ type: 'announceDawn', by: N }]);

  it('starts at 3:00', () => {
    const s = toDiscussion();
    expect(s.phase).toBe('discussion');
    expect(timeLeft(s.discussion!.timer, T0)).toBe(DISCUSSION_MS);
  });

  it('+1 min up to 3 times per round, and the cap resets each round', () => {
    let s = toDiscussion();
    s = run(s, [
      { type: 'addMinute', by: N },
      { type: 'addMinute', by: N },
      { type: 'addMinute', by: N },
    ]);
    expect(timeLeft(s.discussion!.timer, T0)).toBe(DISCUSSION_MS + 3 * EXTENSION_MS);
    expect(() => run(s, [{ type: 'addMinute', by: N }])).toThrow(/3 times/);

    // Next round: cap is back to 0 of 3.
    s = run(s, [
      { type: 'startVoting', by: N },
      ...['host', 'aarav', 'tara', 'isha', 'rohan', 'zoya', 'kabir', 'dev', 'nina'].map(
        (by) => ({ type: 'castVote', by, choice: NONE }) as const,
      ),
    ]);
    s = run(voteTimeUp(s), [
      { type: 'revealVote', by: N },
      { type: 'startNextNight', by: N },
    ]);
    s = run(playNight(s, 'kabir', 'isha', 'tara'), [{ type: 'announceDawn', by: N }]);
    expect(s.discussion?.extensionsUsed).toBe(0);
    expect(run(s, [{ type: 'addMinute', by: N }]).discussion?.extensionsUsed).toBe(1);
  });

  it('+1 min at 0:00 gives a fresh minute', () => {
    const s = toDiscussion();
    const late = reduce(s, { type: 'addMinute', by: N }, at(DISCUSSION_MS + 5000));
    expect(timeLeft(late.discussion!.timer, T0 + DISCUSSION_MS + 5000)).toBe(EXTENSION_MS);
  });

  it('pause stops the timer; resume continues from the same time', () => {
    let s = toDiscussion();
    s = reduce(s, { type: 'pause', by: N }, at(10_000));
    expect(timeLeft(s.discussion!.timer, T0 + 99_000)).toBe(DISCUSSION_MS - 10_000);
    expect(() => reduce(s, { type: 'startVoting', by: N }, at(11_000))).toThrow(/paused/);
    s = reduce(s, { type: 'resume', by: N }, at(100_000));
    expect(timeLeft(s.discussion!.timer, T0 + 100_000)).toBe(DISCUSSION_MS - 10_000);
  });
});

describe('Vote', () => {
  const toVote = () =>
    run(playNight(toNight1(), 'zoya', 'zoya', 'aarav'), [
      { type: 'announceDawn', by: N },
      { type: 'startVoting', by: N },
    ]);

  it('stays open the full 30 s even when everyone has voted, then closes', () => {
    let s = run(
      toVote(),
      ['host', 'aarav', 'tara', 'isha', 'rohan', 'zoya', 'kabir', 'dev', 'nina'].map(
        (by) => ({ type: 'castVote', by, choice: by === 'zoya' ? 'kabir' : 'zoya' }) as const,
      ),
    );
    expect(s.phase).toBe('vote'); // the narrator keeps watching until the timer ends
    s = reduce(s, { type: 'tick' }, at(VOTE_MS - 1));
    expect(s.phase).toBe('vote');
    s = voteTimeUp(s);
    expect(s.phase).toBe('reveal');
    expect(s.lastVote?.eliminatedId).toBe('zoya');
    expect(s.players.find((p) => p.id === 'zoya')?.alive).toBe(true); // not until Reveal to all
    const revealed = run(s, [{ type: 'revealVote', by: N }]);
    expect(revealed.players.find((p) => p.id === 'zoya')?.death).toEqual({ cause: 'vote', round: 1 });
    expect(revealed.phase).toBe('roundStatus');
  });

  it('a vote is locked once cast', () => {
    const s = run(toVote(), [{ type: 'castVote', by: 'host', choice: 'zoya' }]);
    expect(() => run(s, [{ type: 'castVote', by: 'host', choice: 'kabir' }])).toThrow(/locked/);
  });

  it('the narrator does not vote', () => {
    expect(() => run(toVote(), [{ type: 'castVote', by: N, choice: 'zoya' }])).toThrow(GameError);
  });

  it('ticks before 30 s keep the vote open', () => {
    const s = reduce(toVote(), { type: 'tick' }, at(VOTE_MS - 1));
    expect(s.phase).toBe('vote');
  });
});

describe('Pause and presence', () => {
  it('a narrator who paused and then dropped stays paused when back', () => {
    let s = toNight1();
    s = reduce(s, { type: 'pause', by: N }, at(0));
    s = reduce(s, { type: 'presence', id: N, online: false }, at(1000));
    expect(s.pause).toMatchObject({ reason: 'narratorOffline', manual: true });
    s = reduce(s, { type: 'presence', id: N, online: true }, at(2000));
    expect(s.pause).toMatchObject({ reason: 'narrator' });
  });

  it('a narrator who only dropped resumes automatically', () => {
    let s = toNight1();
    s = reduce(s, { type: 'presence', id: N, online: false }, at(0));
    s = reduce(s, { type: 'presence', id: N, online: true }, at(5000));
    expect(s.pause).toBeNull();
  });

  it('host leaving hands over straight away', () => {
    const s = run(toNight1(), [{ type: 'leave', by: 'host' }]);
    expect(s.hostId).toBe('aarav');
  });

  it('narrator leaving pauses the game (host can end after 2 min)', () => {
    const s = run(toNight1(), [{ type: 'leave', by: N }]);
    expect(s.pause?.reason).toBe('narratorOffline');
  });
});

describe('Play again', () => {
  it('host only, after game over; narrator and roles are re-picked, same people', () => {
    let s = toNight1();
    s.players = s.players.map((p) => (p.role === 'mafia' ? p : { ...p, alive: p.id === 'isha' || p.id === 'rohan' }));
    s = playNight(s, 'rohan', 'isha', 'tara');
    s = run(s, [{ type: 'announceDawn', by: N }]);
    expect(s.phase).toBe('gameOver');

    expect(() => playAgain(s, 'zoya', { now: T0, rng })).toThrow(/host/);
    const narrators = new Set<string>();
    for (let seed = 0; seed < 40; seed++) {
      const next = playAgain(s, 'host', { now: T0, rng: seededRng(seed) });
      expect(next.phase).toBe('roleCheck');
      expect(next.members.map((m) => m.id)).toEqual(MEMBERS.map((m) => m.id));
      expect(next.hostId).toBe('host');
      narrators.add(next.narratorId);
    }
    expect(narrators.size).toBeGreaterThan(1);
  });

  it('not before the game is over', () => {
    expect(() => playAgain(toNight1(), 'host', { now: T0, rng })).toThrow(/not over/);
    // Mode B (deal only): the narrator (not the host) deals again at any time.
    expect(playAgain(toNight1(), N, { now: T0, rng }, undefined, true).phase).toBe('roleCheck');
    expect(() => playAgain(toNight1(), 'host', { now: T0, rng }, undefined, true)).toThrow(/narrator/);
  });

  it('createGame needs at least 5 people', () => {
    expect(() => createGame(MEMBERS.slice(0, 4), 'host', { now: T0, rng })).toThrow(/5 people/);
  });
});

describe('State stays plain JSON', () => {
  it('no undefined values and no shared references between steps', () => {
    const s1 = toNight1();
    const s2 = run(s1, [{ type: 'nightPick', by: N, targetId: 'zoya' }]);
    expect(s1.night?.picks.mafia).toBeNull(); // reduce never mutates its input
    expect(JSON.parse(JSON.stringify(s2))).toEqual(s2);
  });
});

describe('Dropped phones (heartbeats)', () => {
  it('a phone silent for 45 s counts as offline from its last heartbeat', () => {
    let s = toNight1();
    s = reduce(s, { type: 'heartbeat', by: 'zoya' }, at(10_000));
    s = reduce(s, { type: 'tick' }, at(10_000 + 44_999));
    expect(s.presence.zoya.online).toBe(true);
    s = reduce(s, { type: 'tick' }, at(10_000 + 45_000));
    expect(s.presence.zoya).toEqual({ online: false, since: T0 + 10_000 });
    // Back with the same account: online again.
    s = reduce(s, { type: 'heartbeat', by: 'zoya' }, at(70_000));
    expect(s.presence.zoya.online).toBe(true);
  });

  it('a silent narrator pauses the game; their next heartbeat resumes it', () => {
    let s = toNight1();
    s = reduce(s, { type: 'heartbeat', by: 'host' }, at(60_000)); // someone else's beat runs the check
    expect(s.pause).toMatchObject({ reason: 'narratorOffline', since: T0 });
    s = reduce(s, { type: 'heartbeat', by: N }, at(61_000));
    expect(s.pause).toBeNull();
  });

  it('a dropped player has no action and no vote (counts as None)', () => {
    let s = run(playNight(toNight1(), 'zoya', 'zoya', 'aarav'), [
      { type: 'announceDawn', by: N },
      { type: 'startVoting', by: N },
    ]);
    for (const id of ['host', 'aarav', 'tara', 'isha', 'rohan', 'kabir', 'dev', 'nina']) {
      s = reduce(s, { type: 'castVote', by: id, choice: 'zoya' }, at(1000));
    }
    expect(s.phase).toBe('vote'); // still waiting for Zoya, whose phone dropped
    for (const m of s.members) if (m.id !== 'zoya') s = reduce(s, { type: 'heartbeat', by: m.id }, at(VOTE_MS));
    s = reduce(s, { type: 'tick' }, at(VOTE_MS));
    expect(s.lastVote?.ballots.zoya).toBe(NONE);
  });

  it('heartbeats from people who left or are not in the room are ignored', () => {
    let s = run(toNight1(), [{ type: 'leave', by: 'dev' }]);
    s = reduce(s, { type: 'heartbeat', by: 'dev' }, at(1000));
    expect(s.presence.dev.online).toBe(false);
    expect(() => reduce(s, { type: 'heartbeat', by: 'stranger' }, at(1000))).not.toThrow();
  });
});
