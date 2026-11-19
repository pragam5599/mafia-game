import { describe, expect, it } from 'vitest';
import { GameError } from '../errors';
import { seededRng } from '../rng';
import { assignRoles, roleCounts } from '../roles';
import type { Member } from '../types';

const people = (n: number): Member[] => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}` }));

describe('roleCounts (RULES.md table)', () => {
  const table: [range: [number, number], mafia: number, doctor: number, detective: number][] = [
    [[4, 5], 1, 1, 1],
    [[6, 9], 2, 1, 1],
    [[10, 12], 3, 1, 1],
    [[13, 20], 4, 2, 2],
  ];
  for (const [[lo, hi], mafia, doctor, detective] of table) {
    it(`${lo}–${hi} players: ${mafia} Mafia, ${doctor} Doctor, ${detective} Detective`, () => {
      for (let n = lo; n <= hi; n++) {
        expect(roleCounts(n)).toEqual({ mafia, doctor, detective, villager: n - mafia - doctor - detective });
      }
    });
  }

  it('villager ranges match the table', () => {
    expect([roleCounts(4).villager, roleCounts(5).villager]).toEqual([1, 2]);
    expect([roleCounts(6).villager, roleCounts(9).villager]).toEqual([2, 5]);
    expect([roleCounts(10).villager, roleCounts(12).villager]).toEqual([5, 7]);
    expect([roleCounts(13).villager, roleCounts(20).villager]).toEqual([5, 12]);
  });

  it('rejects fewer than 4 or more than 20 players', () => {
    expect(() => roleCounts(3)).toThrow(GameError);
    expect(() => roleCounts(21)).toThrow(GameError);
  });
});

describe('assignRoles', () => {
  it('picks one narrator from everyone and deals the right roles to the rest', () => {
    for (const n of [5, 10, 13, 21]) {
      const { narratorId, players } = assignRoles(people(n), seededRng(n));
      expect(players).toHaveLength(n - 1);
      expect(players.some((p) => p.id === narratorId)).toBe(false);
      const counts = roleCounts(n - 1);
      for (const role of ['mafia', 'doctor', 'detective', 'villager'] as const) {
        expect(players.filter((p) => p.role === role)).toHaveLength(counts[role]);
      }
      expect(players.every((p) => p.alive && p.death === null)).toBe(true);
    }
  });

  it('the host (first member) can be picked as narrator', () => {
    const picked = new Set<string>();
    for (let seed = 0; seed < 200; seed++) picked.add(assignRoles(people(6), seededRng(seed)).narratorId);
    expect(picked.has('p0')).toBe(true);
    expect(picked.size).toBe(6); // everyone can be picked
  });

  it('keeps join order for the players', () => {
    const { narratorId, players } = assignRoles(people(8), seededRng(3));
    expect(players.map((p) => p.id)).toEqual(people(8).map((m) => m.id).filter((id) => id !== narratorId));
  });

  it('needs 5 to 21 people', () => {
    expect(() => assignRoles(people(4), seededRng(1))).toThrow(/5 people/);
    expect(() => assignRoles(people(22), seededRng(1))).toThrow(/21 people/);
  });
});
