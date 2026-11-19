import { NAME_MAX } from './config';

// RULES.md "Name": 1–16 readable characters. Saved on the device; only unique inside a room.

export type NameProblem = 'empty' | 'tooLong';

/** Trims and collapses spaces; strips control characters. */
export function cleanName(name: string): string {
  return name.replace(/[\p{C}]/gu, '').replace(/\s+/g, ' ').trim();
}

export function checkName(name: string): NameProblem | null {
  const n = cleanName(name);
  if (!n) return 'empty';
  if ([...n].length > NAME_MAX) return 'tooLong';
  return null;
}

/** "Isha" and "isha " are the same name inside a room. */
export function nameKey(name: string): string {
  return cleanName(name).toLowerCase();
}

export function nameInRoom(name: string, members: readonly { id: string; name: string }[], exceptId?: string): boolean {
  return members.some((m) => m.id !== exceptId && nameKey(m.name) === nameKey(name));
}
