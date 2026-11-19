import { describe, expect, it } from 'vitest';
import { EMPTY_ROOM_CLOSE_MS, HOST_OFFLINE_HANDOVER_MS } from '../config';
import { seededRng } from '../rng';
import {
  ROOM_CODE_ALPHABET,
  canJoin,
  generateRoomCode,
  hostShouldHandOver,
  nextHost,
  normalizeRoomCode,
  roomShouldClose,
} from '../room';
import { checkName, cleanName, nameInRoom } from '../username';

describe('Name', () => {
  it('1–16 readable characters, spaces tidied', () => {
    expect(checkName('')).toBe('empty');
    expect(checkName('   ')).toBe('empty');
    expect(checkName('A')).toBeNull();
    expect(checkName('Prägam S')).toBeNull();
    expect(checkName('a'.repeat(16))).toBeNull();
    expect(checkName('a'.repeat(17))).toBe('tooLong');
    expect(cleanName('  Isha \n  K ')).toBe('Isha K');
  });

  it('unique inside a room, ignoring case and spaces', () => {
    const members = [{ id: 'a', name: 'Isha' }];
    expect(nameInRoom('isha ', members)).toBe(true);
    expect(nameInRoom('Isha2', members)).toBe(false);
    expect(nameInRoom('Isha', members, 'a')).toBe(false); // their own name
  });
});

describe('Room', () => {
  it('4-character code from the readable alphabet, unique among open rooms', () => {
    const open = new Set<string>();
    const rng = seededRng(9);
    for (let i = 0; i < 500; i++) {
      const code = generateRoomCode(rng, (c) => open.has(c));
      expect(code).toMatch(new RegExp(`^[${ROOM_CODE_ALPHABET}]{4}$`));
      expect(open.has(code)).toBe(false);
      open.add(code);
    }
  });

  it('gives up if every code is taken', () => {
    expect(() => generateRoomCode(seededRng(1), () => true, 10)).toThrow(/free room code/);
  });

  it('typed codes are normalised', () => {
    expect(normalizeRoomCode(' 4f7k ')).toBe('4F7K');
  });

  it('nobody can join after Start or when full (21)', () => {
    expect(canJoin(false, 20)).toBe(true);
    expect(canJoin(false, 21)).toBe(false);
    expect(canJoin(true, 6)).toBe(false);
  });

  it('empty room closes after 30 minutes', () => {
    expect(roomShouldClose(null, 0)).toBe(false);
    expect(roomShouldClose(0, EMPTY_ROOM_CLOSE_MS - 1)).toBe(false);
    expect(roomShouldClose(0, EMPTY_ROOM_CLOSE_MS)).toBe(true);
  });
});

describe('Host handover', () => {
  const members = ['a', 'b', 'c', 'd'].map((id) => ({ id, name: id }));
  const online = (ids: string[]) => Object.fromEntries(members.map((m) => [m.id, { online: ids.includes(m.id), since: 0 }]));

  it('keeps host if back within 2 min', () => {
    expect(hostShouldHandOver({ online: false, since: 0 }, HOST_OFFLINE_HANDOVER_MS - 1)).toBe(false);
    expect(hostShouldHandOver({ online: false, since: 0 }, HOST_OFFLINE_HANDOVER_MS)).toBe(true);
    expect(hostShouldHandOver({ online: true, since: 0 }, 10 * HOST_OFFLINE_HANDOVER_MS)).toBe(false);
  });

  it('passes to the next person in join order, wrapping around', () => {
    expect(nextHost(members, 'a', online(['b', 'c', 'd']), [])).toBe('b');
    expect(nextHost(members, 'd', online(['a', 'b', 'c']), [])).toBe('a');
  });

  it('prefers someone online and skips people who left', () => {
    expect(nextHost(members, 'a', online(['d']), [])).toBe('d');
    expect(nextHost(members, 'a', online(['b', 'c', 'd']), ['b'])).toBe('c');
    expect(nextHost(members, 'a', online([]), ['b', 'c', 'd'])).toBeNull();
  });
});
