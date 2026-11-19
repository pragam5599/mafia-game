import { VOTE_MS } from '../config';
import { createGame, reduce, type Action, type GameState } from '../engine';
import { seededRng, type Rng } from '../rng';
import type { Member, Role } from '../types';

// The scripted game from RULES.md "Acceptance tests":
// 9 players (2 Mafia, 1 Doctor, 1 Detective, 5 Villagers) + narrator.

export const T0 = 1_700_000_000_000;

export const LAYOUT: [id: string, role: Role | 'narrator'][] = [
  ['host', 'villager'], // the host is a normal player here
  ['aarav', 'mafia'],
  ['tara', 'mafia'],
  ['isha', 'doctor'],
  ['rohan', 'detective'],
  ['zoya', 'villager'],
  ['kabir', 'villager'],
  ['meera', 'narrator'],
  ['dev', 'villager'],
  ['nina', 'villager'],
];

export const MEMBERS: Member[] = LAYOUT.map(([id]) => ({ id, name: id[0].toUpperCase() + id.slice(1) }));

/** A game in role check with the fixed layout above (roles are random in real games). */
export function scriptedGame(rng: Rng = seededRng(1), now = T0): GameState {
  const s = createGame(MEMBERS, 'host', { now, rng });
  s.narratorId = 'meera';
  s.players = LAYOUT.filter(([, r]) => r !== 'narrator').map(([id, role]) => ({
    id,
    name: id[0].toUpperCase() + id.slice(1),
    role: role as Role,
    alive: true,
    death: null,
  }));
  return s;
}

/** Applies actions in order at time `now` with a fixed rng. */
export function run(state: GameState, actions: Action[], now = T0, rng: Rng = seededRng(7)): GameState {
  return actions.reduce((s, a) => reduce(s, a, { now, rng }), state);
}

export const N = 'meera'; // narrator

export function everyoneAcks(s: GameState): Action[] {
  return s.players.map((p) => ({ type: 'ackRole', by: p.id }) as const);
}

/** Role check → Night 1, Mafia step. */
export function toNight1(rng?: Rng): GameState {
  const s = scriptedGame(rng);
  return run(s, [...everyoneAcks(s), { type: 'startGame', by: N }]);
}

/** Plays one full night: Mafia target, Doctor save, Detective check. */
export function playNight(s: GameState, target: string, save: string | null, check: string | null, now = T0): GameState {
  const steps: Action[] = [
    { type: 'nightPick', by: N, targetId: target },
    { type: 'nightConfirm', by: N },
  ];
  if (save) steps.push({ type: 'nightPick', by: N, targetId: save }, { type: 'nightConfirm', by: N });
  if (check) steps.push({ type: 'nightPick', by: N, targetId: check }, { type: 'nightConfirm', by: N });
  return run(s, steps, now);
}

export const alive = (s: GameState, id: string) => s.players.find((p) => p.id === id)!.alive;

/** The vote always runs the full 30 s: let it run out (missing votes count as None). */
export function voteTimeUp(s: GameState, now = T0): GameState {
  return reduce(s, { type: 'tick' }, { now: now + VOTE_MS, rng: seededRng(7) });
}
