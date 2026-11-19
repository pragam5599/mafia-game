import type { NightResult } from './night';
import { pickOne, type Rng } from './rng';
import type { Player, PlayerId, Role, Winner } from './types';
import type { VoteTally } from './vote';

// Game copy from RULES.md "Copy" and the Announcement Card in Figma. Shown exactly as written.

export const LAST_WORDS = {
  night: ['The night was not kind.', 'Found at first light.', 'Gone before dawn.', 'The Mafia chose quietly.'],
  vote: ['The town has spoken.', 'The vote was cast.', 'Not everyone agreed.', 'The room chose.'],
  saved: 'No one died tonight.',
  noElimination: 'No one was eliminated.',
} as const;

/** Written from the cause of death; never mentions the role. */
export function lastWordsFor(cause: 'night' | 'vote', rng: Rng): string {
  return pickOne(LAST_WORDS[cause], rng);
}

export const ROLE_NAME: Record<Role, string> = {
  mafia: 'Mafia',
  doctor: 'Doctor',
  detective: 'Detective',
  villager: 'Villager',
};

export const KEY_STRINGS = {
  narratorReveal: 'You are the Narrator',
  nightPlayers: 'Close your eyes. The narrator will wake your role.',
  vote: 'Votes are secret. Only the narrator sees who voted whom. No vote in 30 seconds counts as None.',
  nameIntro: 'Other players see this name in the room.',
  nightHint: 'Tap who they point at. Once they agree, say the last line, then confirm.',
} as const;

export const nameInRoomTaken = (name: string) => `${name} is already in this room. Add a letter or pick another.`;

/** Say-aloud script per night step (RULES.md "Night rules"). */
export const NIGHT_SCRIPT = {
  mafia: { wake: 'Mafia, wake up. Point at one person to kill.', sleep: 'Mafia, close your eyes.' },
  doctor: { wake: 'Doctor, wake up. Who do you want to save?', sleep: 'Doctor, close your eyes.' },
  detective: { wake: 'Detective, wake up. Who do you want to check?', sleep: 'Detective, close your eyes.' },
} as const;

export type AnnouncementKind = 'death' | 'saved' | 'eliminated' | 'noElimination' | 'townWins' | 'mafiaWins';

export type Announcement = {
  kind: AnnouncementKind;
  eyebrow: string;
  title: string;
  detail: string;
  lastWords: string;
};

function nameOf(players: readonly Player[], id: PlayerId): Player {
  const p = players.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown player ${id}`);
  return p;
}

export function dawnAnnouncement(result: NightResult, players: readonly Player[]): Announcement {
  const eyebrow = `Dawn · Night ${result.round}`;
  if (result.killedId === null) {
    // Players' card (P5). The narrator's N6 card names who the Mafia chose instead.
    return { kind: 'saved', eyebrow, title: 'No one died tonight', detail: 'Everyone made it through the night.', lastWords: result.lastWords };
  }
  const p = nameOf(players, result.killedId);
  return { kind: 'death', eyebrow, title: `${p.name} was killed`, detail: `Role: ${ROLE_NAME[p.role]}`, lastWords: result.lastWords };
}

/** N6 (narrator only): the save, with who the Mafia chose. */
export function narratorDawnDetail(result: NightResult, players: readonly Player[]): string | null {
  if (result.killedId !== null) return null;
  const name = nameOf(players, result.targetId).name;
  return `Mafia chose ${name}. The Doctor saved ${name}.`;
}

export function voteAnnouncement(
  tally: Pick<VoteTally, 'eliminatedId'> & { round: number; lastWords: string },
  players: readonly Player[],
): Announcement {
  const eyebrow = `Day ${tally.round} · Vote result`;
  if (tally.eliminatedId === null) {
    return {
      kind: 'noElimination',
      eyebrow,
      title: 'No one was eliminated',
      detail: 'Tie, or fewer than 2 votes.',
      lastWords: tally.lastWords,
    };
  }
  const p = nameOf(players, tally.eliminatedId);
  return { kind: 'eliminated', eyebrow, title: `${p.name} is eliminated`, detail: `Role: ${ROLE_NAME[p.role]}`, lastWords: tally.lastWords };
}

export function winAnnouncement(winner: Winner): Announcement {
  return winner === 'town'
    ? { kind: 'townWins', eyebrow: 'Game over', title: 'Town wins', detail: 'Every Mafia player is out.', lastWords: 'The streets are quiet again.' }
    : { kind: 'mafiaWins', eyebrow: 'Game over', title: 'Mafia wins', detail: 'The Mafia now match the Town.', lastWords: 'The city belongs to the family.' };
}

/** N9 "Win check" line. */
export function winCheckLine(counts: { mafia: number; town: number }, winner: Winner | null): string {
  const base = `Mafia ${counts.mafia} vs Town ${counts.town}.`;
  if (winner === 'town') return `${base} Town wins.`;
  if (winner === 'mafia') return `${base} Mafia wins.`;
  return `${base} The game continues.`;
}
