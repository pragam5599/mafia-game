import { describe, expect, it } from 'vitest';
import type { Player, Role } from '../types';
import { checkWinner, teamCounts } from '../win';

const mk = (role: Role, alive = true, left = false): Player => ({
  id: Math.random().toString(36),
  name: role,
  role,
  alive,
  death: alive ? null : { cause: left ? 'left' : 'night', round: 1 },
});

describe('Win check', () => {
  it('Town wins when every Mafia is dead', () => {
    expect(checkWinner([mk('mafia', false), mk('villager'), mk('doctor')])).toBe('town');
  });

  it('Mafia wins when alive Mafia ≥ alive Town', () => {
    expect(checkWinner([mk('mafia'), mk('villager')])).toBe('mafia'); // equal
    expect(checkWinner([mk('mafia'), mk('mafia'), mk('villager')])).toBe('mafia'); // more
  });

  it('game continues otherwise', () => {
    expect(checkWinner([mk('mafia'), mk('villager'), mk('doctor')])).toBeNull();
  });

  it('players who left still count (their role decides, even though it is hidden)', () => {
    // The last Mafia leaves → Town wins at the next check.
    expect(checkWinner([mk('mafia', false, true), mk('villager'), mk('villager')])).toBe('town');
    // A Villager leaves → Mafia now match the Town.
    expect(checkWinner([mk('mafia'), mk('villager'), mk('villager', false, true)])).toBe('mafia');
  });

  it('counts alive players by team', () => {
    expect(teamCounts([mk('mafia'), mk('detective'), mk('villager'), mk('villager', false)])).toEqual({ mafia: 1, town: 2 });
  });
});
