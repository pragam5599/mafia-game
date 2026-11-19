import { MAX_PEOPLE, MAX_PLAYERS, MIN_PEOPLE, MIN_PLAYERS } from './config';
import { GameError } from './errors';
import { pickOne, shuffle, type Rng } from './rng';
import type { Member, Player, PlayerId, Role } from './types';

export type RoleCounts = Record<Role, number>;

/** RULES.md "Roles and player counts". Players exclude the narrator. */
export function roleCounts(playerCount: number): RoleCounts {
  if (playerCount < MIN_PLAYERS) {
    throw new GameError('notEnoughPeople', `Needs ${MIN_PLAYERS} players, has ${playerCount}.`);
  }
  if (playerCount > MAX_PLAYERS) {
    throw new GameError('tooManyPeople', `At most ${MAX_PLAYERS} players, has ${playerCount}.`);
  }
  const [mafia, doctor, detective] =
    playerCount <= 5 ? [1, 1, 1] : playerCount <= 9 ? [2, 1, 1] : playerCount <= 12 ? [3, 1, 1] : [4, 2, 2];
  return { mafia, doctor, detective, villager: playerCount - mafia - doctor - detective };
}

export function isTown(role: Role): boolean {
  return role !== 'mafia';
}

/**
 * At Start: pick the narrator at random from everyone (host included), then deal roles
 * at random to the rest. Players keep join order.
 */
export function assignRoles(
  members: readonly Member[],
  rng: Rng,
  narratorCandidates?: readonly PlayerId[],
): { narratorId: PlayerId; players: Player[] } {
  if (members.length < MIN_PEOPLE) {
    throw new GameError('notEnoughPeople', `Needs ${MIN_PEOPLE} people, has ${members.length}.`);
  }
  if (members.length > MAX_PEOPLE) {
    throw new GameError('tooManyPeople', `At most ${MAX_PEOPLE} people, has ${members.length}.`);
  }
  const pool = narratorCandidates?.length ? members.filter((m) => narratorCandidates.includes(m.id)) : members;
  const narratorId = pickOne(pool.length ? pool : members, rng).id;
  const seats = members.filter((m) => m.id !== narratorId);
  const counts = roleCounts(seats.length);
  const deck = shuffle(
    (Object.keys(counts) as Role[]).flatMap((role) => Array<Role>(counts[role]).fill(role)),
    rng,
  );
  const players = seats.map((m, i) => ({ id: m.id, name: m.name, role: deck[i], alive: true, death: null }));
  return { narratorId, players };
}
