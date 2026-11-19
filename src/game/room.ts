import { EMPTY_ROOM_CLOSE_MS, HOST_OFFLINE_HANDOVER_MS, MAX_PEOPLE, MIN_PEOPLE, ROOM_CODE_LENGTH } from './config';
import { GameError } from './errors';
import { randomInt, type Rng } from './rng';
import type { Member, PlayerId } from './types';

// Rooms, lobby and host rules (RULES.md "Accounts and lobby", "Edge cases").

/** No 0/O or 1/I, so codes are easy to read out and type. */
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomCode(rng: Rng, isTaken: (code: string) => boolean, maxTries = 1000): string {
  for (let i = 0; i < maxTries; i++) {
    let code = '';
    for (let j = 0; j < ROOM_CODE_LENGTH; j++) code += ROOM_CODE_ALPHABET[randomInt(rng, ROOM_CODE_ALPHABET.length)];
    if (!isTaken(code)) return code;
  }
  throw new GameError('roomCodesExhausted', 'Could not find a free room code.');
}

/** What a player typed, ready to look up ("4f7k " → "4F7K"). */
export function normalizeRoomCode(input: string): string {
  return input.trim().toUpperCase();
}

/** Host can press Start once 5 people have joined. */
export function canStart(memberCount: number): boolean {
  return memberCount >= MIN_PEOPLE && memberCount <= MAX_PEOPLE;
}

/** Nobody can join after Start, or once the room is full. */
export function canJoin(started: boolean, memberCount: number): boolean {
  return !started && memberCount < MAX_PEOPLE;
}

export type Presence = { online: boolean; since: number };

/** Host keeps the role if back within 2 minutes. */
export function hostShouldHandOver(presence: Presence | undefined, now: number): boolean {
  return !!presence && !presence.online && now - presence.since >= HOST_OFFLINE_HANDOVER_MS;
}

/**
 * Next person in join order after the current host, preferring someone online.
 * Returns null if nobody else is left in the room.
 */
export function nextHost(
  members: readonly Member[],
  currentHostId: PlayerId,
  presence: Readonly<Record<PlayerId, Presence>>,
  leftIds: readonly PlayerId[],
): PlayerId | null {
  const start = members.findIndex((m) => m.id === currentHostId);
  const order = [...members.slice(start + 1), ...members.slice(0, Math.max(0, start))].filter(
    (m) => m.id !== currentHostId && !leftIds.includes(m.id),
  );
  return (order.find((m) => presence[m.id]?.online) ?? order[0])?.id ?? null;
}

/** An empty room closes after 30 minutes. */
export function roomShouldClose(emptySince: number | null, now: number): boolean {
  return emptySince !== null && now - emptySince >= EMPTY_ROOM_CLOSE_MS;
}
