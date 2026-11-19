import { describe, expect, it } from 'vitest';
import { GameError } from '../errors';
import { LAST_WORDS } from '../copy';
import { refreshSkips, startNight, stepStates, validTargets } from '../night';
import type { Player, Role } from '../types';
import { N, alive, playNight, run, toNight1 } from './fixture';

const mk = (id: string, role: Role, isAlive = true): Player => ({
  id,
  name: id,
  role,
  alive: isAlive,
  death: isAlive ? null : { cause: 'night', round: 1 },
});

describe('Night targets', () => {
  const s = toNight1();

  it('Mafia cannot pick a partner; only alive players are listed', () => {
    const t = validTargets(s.players, 'mafia');
    expect(t).not.toContain('aarav');
    expect(t).not.toContain('tara');
    expect(t).toContain('isha');
    expect(() => run(s, [{ type: 'nightPick', by: N, targetId: 'tara' }])).toThrow(GameError);
  });

  it('Detective cannot pick themselves', () => {
    expect(validTargets(s.players, 'detective')).not.toContain('rohan');
  });

  it('Doctor can pick anyone alive, including themselves', () => {
    expect(validTargets(s.players, 'doctor')).toContain('isha');
    expect(validTargets(s.players, 'doctor')).toHaveLength(9);
  });

  it('dead players are never listed', () => {
    const players = [mk('a', 'mafia'), mk('b', 'villager', false), mk('c', 'doctor')];
    for (const step of ['mafia', 'doctor', 'detective'] as const) expect(validTargets(players, step)).not.toContain('b');
  });
});

describe('Night steps', () => {
  it('only the narrator can act', () => {
    expect(() => run(toNight1(), [{ type: 'nightPick', by: 'aarav', targetId: 'zoya' }])).toThrow(/narrator/);
  });

  it('tapping another name changes the pick (one Confirm button only)', () => {
    const s = run(toNight1(), [
      { type: 'nightPick', by: N, targetId: 'zoya' },
      { type: 'nightPick', by: N, targetId: 'kabir' },
    ]);
    expect(s.night?.picks.mafia).toBe('kabir');
    expect(s.night?.step).toBe('mafia');
  });

  it('Confirm needs a pick first', () => {
    expect(() => run(toNight1(), [{ type: 'nightConfirm', by: N }])).toThrow(/Tap who/);
  });

  it('step 1 has no Back', () => {
    expect(() => run(toNight1(), [{ type: 'nightBack', by: N }])).toThrow(/no Back/);
  });

  it('Back on step 3 returns to step 2', () => {
    const s = run(toNight1(), [
      { type: 'nightPick', by: N, targetId: 'zoya' },
      { type: 'nightConfirm', by: N },
      { type: 'nightPick', by: N, targetId: 'isha' },
      { type: 'nightConfirm', by: N },
      { type: 'nightBack', by: N },
    ]);
    expect(s.night?.step).toBe('doctor');
    expect(s.night?.picks.doctor).toBe('isha'); // pick kept so it can be changed
  });

  it('Finish night goes straight to Dawn (no "are you sure")', () => {
    const s = playNight(toNight1(), 'zoya', 'isha', 'aarav');
    expect(s.phase).toBe('dawn');
    expect(s.night).toBeNull();
  });

  it('the target dies when the Doctor saves someone else', () => {
    const s = playNight(toNight1(), 'zoya', 'isha', 'kabir');
    expect(s.lastNight?.killedId).toBe('zoya');
    expect(alive(s, 'zoya')).toBe(false);
    expect(s.players.find((p) => p.id === 'zoya')?.death).toEqual({ cause: 'night', round: 1 });
    expect(LAST_WORDS.night).toContain(s.lastNight?.lastWords);
  });

  it('a save uses the "No one died tonight." line', () => {
    const s = playNight(toNight1(), 'zoya', 'zoya', 'kabir');
    expect(s.lastNight?.lastWords).toBe(LAST_WORDS.saved);
  });

  it('Detective result is yes/no: is that player Mafia', () => {
    expect(playNight(toNight1(), 'zoya', 'isha', 'aarav').lastNight?.checkedIsMafia).toBe(true);
    expect(playNight(toNight1(), 'zoya', 'isha', 'isha').lastNight?.checkedIsMafia).toBe(false);
  });

  it('Step Bar states follow the night', () => {
    const s = run(toNight1(), [
      { type: 'nightPick', by: N, targetId: 'zoya' },
      { type: 'nightConfirm', by: N },
    ]);
    expect(stepStates(s.night!)).toEqual({ mafia: 'done', doctor: 'now', detective: 'upcoming' });
  });
});

describe('Skipping dead roles', () => {
  it('dead Detective → Doctor step finishes the night', () => {
    const players = [mk('m', 'mafia'), mk('d', 'doctor'), mk('x', 'detective', false), mk('v', 'villager'), mk('w', 'villager')];
    expect(startNight(players).skipped).toEqual(['detective']);
  });

  it('with 2 Doctors, skip only when both are dead', () => {
    const one = [mk('m', 'mafia'), mk('d1', 'doctor', false), mk('d2', 'doctor'), mk('t', 'detective'), mk('v', 'villager')];
    expect(startNight(one).skipped).toEqual([]);
    const both = [mk('m', 'mafia'), mk('d1', 'doctor', false), mk('d2', 'doctor', false), mk('t', 'detective'), mk('v', 'villager')];
    expect(startNight(both).skipped).toEqual(['doctor']);
  });

  it('13+ players: both Detectives wake together; neither can be checked', () => {
    const players = [mk('m', 'mafia'), mk('t1', 'detective'), mk('t2', 'detective'), mk('v', 'villager')];
    expect(validTargets(players, 'detective')).toEqual(['m', 'v']);
  });

  it('a role whose last member leaves mid-night is skipped for the steps still ahead', () => {
    let s = run(toNight1(), [
      { type: 'nightPick', by: N, targetId: 'zoya' },
      { type: 'leave', by: 'rohan' }, // the only Detective
    ]);
    expect(s.night?.skipped).toEqual(['detective']);
    s = run(s, [
      { type: 'nightConfirm', by: N },
      { type: 'nightPick', by: N, targetId: 'isha' },
      { type: 'nightConfirm', by: N },
    ]);
    expect(s.phase).toBe('dawn'); // Doctor step was the last one
    expect(s.lastNight?.checkedId).toBeNull();
  });

  it('a pick on someone who has since left is cleared', () => {
    const s = toNight1();
    const draft = { ...s.night!, picks: { mafia: 'zoya', doctor: null, detective: null } };
    const players = s.players.map((p) => (p.id === 'zoya' ? { ...p, alive: false } : p));
    expect(refreshSkips(draft, players).picks.mafia).toBeNull();
  });
});
