import type { Announcement } from './copy';
import type { GameState, VoteResult } from './engine';
import type { NightDraft, NightResult } from './night';
import type { DeathCause, Member, Phase, PlayerId, Role, Winner } from './types';
import type { VoteChoice } from './vote';

// Firestore document shapes shared by the app and the Cloud Functions.
// The server writes three views of the one engine state, so each phone only receives what it may see:
//   rooms/{code}            public view (everyone in the room)
//   rooms/{code}/roles/{id} that person's role (+ Mafia partners, own vote)
//   rooms/{code}/narrator/view  every role, the night picks, who voted whom (narrator only)
//   rooms/{code}/private/state  the full engine state (server only)

export type RoomStatus = 'lobby' | 'playing' | 'closed';

/** rooms/{code}: readable by its members only. Written only by the server. */
export type RoomDoc = {
  code: string;
  status: RoomStatus;
  hostId: PlayerId;
  /** Join order. Names are what each player typed; unique inside the room. */
  members: Member[];
  /** Same ids as `members`, for security rules (`request.auth.uid in memberIds`). */
  memberIds: PlayerId[];
  createdAt: number;
  updatedAt: number;
  /** Set when the last person leaves; the room closes 30 minutes later. */
  emptySince: number | null;
  /** Public view of the running game. Null in the lobby. */
  game: PublicGame | null;
  /** Games started in this room (for "Game 2 · Room 4F7K"). */
  gameNumber?: number;
  /** A: the narrator runs the game on their phone. B: the app only deals roles (missing = A). */
  mode?: RoomMode;
};

export type RoomMode = 'A' | 'B';

/** The parts of the public game view that security rules rely on. */
export type PublicGameRef = {
  narratorId: PlayerId;
  /** Eliminated players (night, vote or left): the only people who may read dead chat. */
  dead: PlayerId[];
};

export type PublicPlayer = {
  id: PlayerId;
  name: string;
  alive: boolean;
  deathCause: DeathCause | null;
  deathRound: number | null;
  /** Revealed on death (night or vote) and to everyone at game over. Hidden for players who left. */
  role: Role | null;
};

/** A countdown as of `stampedAt` (server time). Phones count down from when they receive it. */
export type PublicTimer = { remainingMs: number; totalMs: number; running: boolean };

export type PublicGame = PublicGameRef & {
  phase: Phase;
  round: number;
  hostId: PlayerId;
  players: PublicPlayer[];
  /** Who has tapped "I have seen my role" (not secret: says nothing about roles). */
  acknowledged: PlayerId[];
  roleCheckStartedAt: number;
  /** What players see on their announcement screens (P5, P9, P11). Null while there is nothing new. */
  announcement: Announcement | null;
  discussion: (PublicTimer & { extensionsUsed: number }) | null;
  /** "Voted: X of N" only. Never who voted whom. */
  vote: (PublicTimer & { voted: number; total: number }) | null;
  pause: { reason: 'narrator' | 'narratorOffline'; since: number } | null;
  winner: Winner | null;
  endedBy: 'win' | 'host' | null;
  stampedAt: number;
};

/** rooms/{code}/roles/{uid}: readable by that player and the narrator. */
export type RoleDoc = {
  role: Role | 'narrator';
  /** Mafia partners (other Mafia), empty for everyone else. */
  partners: Member[];
  myVote: VoteChoice | null;
};

/** rooms/{code}/narrator/view: narrator only. */
export type NarratorView = {
  roles: Record<PlayerId, Role>;
  night: (NightDraft & { checkedIsMafia: boolean | null }) | null;
  lastNight: NightResult | null;
  /** Live ballots during the vote. */
  ballots: Record<PlayerId, VoteChoice> | null;
  lastVote: VoteResult | null;
  teamCounts: { mafia: number; town: number };
  /** Who would win if checked now (N9 win check). */
  winnerIfChecked: Winner | null;
  stampedAt: number;
};

/** rooms/{code}/private/state: server only. */
export type PrivateStateDoc = { state: GameState; version: number };

/** rooms/{code}/deadChat/{id}: eliminated players only. */
export type DeadChatMessage = { authorId: PlayerId; authorName: string; text: string; sentAt: unknown };

/** users/{uid}: public profile. */
export type UserDoc = { username: string };
