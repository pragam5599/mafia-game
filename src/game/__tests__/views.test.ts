import { describe, expect, it } from 'vitest';
import { narratorView, publicView, roleDocs } from '../views';
import { NONE } from '../vote';
import { N, T0, playNight, run, toNight1 } from './fixture';

// The public view goes to every phone in the room, so it must never carry a hidden role or a ballot.

const ROLE_WORDS = /"role":"(mafia|doctor|detective|villager)"/g;

describe('Public view (every phone)', () => {
  it('has no roles of living players', () => {
    const s = toNight1();
    const view = JSON.stringify(publicView(s, T0));
    expect(view.match(ROLE_WORDS)).toBeNull();
    expect(publicView(s, T0).players.every((p) => p.role === null)).toBe(true);
  });

  it('reveals a role on death, but not for someone who left', () => {
    let s = run(toNight1(), [{ type: 'leave', by: 'tara' }]);
    s = playNight(s, 'zoya', 'isha', 'aarav');
    const players = publicView(s, T0).players;
    expect(players.find((p) => p.id === 'zoya')?.role).toBe('villager');
    expect(players.find((p) => p.id === 'tara')?.role).toBeNull();
  });

  it('shows only "Voted: X of N", never who voted whom', () => {
    const s = run(playNight(toNight1(), 'zoya', 'zoya', 'aarav'), [
      { type: 'announceDawn', by: N },
      { type: 'startVoting', by: N },
      { type: 'castVote', by: 'host', choice: 'kabir' },
      { type: 'castVote', by: 'aarav', choice: NONE },
    ]);
    const view = publicView(s, T0);
    // The vote section is only a count and a timer: no ballot map, no choices.
    expect(Object.keys(view.vote!).sort()).toEqual(['remainingMs', 'running', 'total', 'totalMs', 'voted']);
    expect(view.vote).toMatchObject({ voted: 2, total: 9 });
    expect(JSON.stringify(view)).not.toMatch(/ballots|none/);
  });

  it('holds the dawn announcement only once the narrator announces', () => {
    const atDawn = playNight(toNight1(), 'zoya', 'isha', 'aarav');
    expect(publicView(atDawn, T0).announcement).toBeNull(); // players still see the night screen
    const announced = run(atDawn, [{ type: 'announceDawn', by: N }]);
    expect(publicView(announced, T0).announcement?.title).toBe('Zoya was killed');
  });

  it('every role is public at game over', () => {
    let s = toNight1();
    s.players = s.players.map((p) => (['host', 'zoya', 'kabir', 'dev'].includes(p.id) ? { ...p, alive: false, death: { cause: 'vote', round: 0 } } : p));
    s = run(playNight(s, 'nina', 'isha', 'tara'), [{ type: 'announceDawn', by: N }]);
    expect(publicView(s, T0).players.every((p) => p.role !== null)).toBe(true);
    expect(publicView(s, T0).announcement?.title).toBe('Mafia wins');
  });
});

describe('Private docs', () => {
  it('each player gets only their role; Mafia get partners; narrator gets "narrator"', () => {
    const docs = roleDocs(toNight1());
    expect(docs.zoya).toEqual({ role: 'villager', partners: [], myVote: null });
    expect(docs.aarav.partners).toEqual([{ id: 'tara', name: 'Tara' }]);
    expect(docs[N].role).toBe('narrator');
  });

  it('narrator view has every role, the night picks and the detective answer', () => {
    const s = run(toNight1(), [
      { type: 'nightPick', by: N, targetId: 'zoya' },
      { type: 'nightConfirm', by: N },
      { type: 'nightPick', by: N, targetId: 'isha' },
      { type: 'nightConfirm', by: N },
      { type: 'nightPick', by: N, targetId: 'aarav' },
    ]);
    const v = narratorView(s, T0);
    expect(Object.keys(v.roles)).toHaveLength(9);
    expect(v.night?.picks).toEqual({ mafia: 'zoya', doctor: 'isha', detective: 'aarav' });
    expect(v.night?.checkedIsMafia).toBe(true);
  });
});
