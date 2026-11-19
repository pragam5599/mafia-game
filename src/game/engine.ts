import {
  DISCUSSION_MS,
  EXTENSION_MS,
  MAX_EXTENSIONS,
  NARRATOR_OFFLINE_END_MS,
  PRESENCE_TIMEOUT_MS,
  ROLE_CHECK_GRACE_MS,
  VOTE_MS,
} from './config';
import { LAST_WORDS, lastWordsFor } from './copy';
import { GameError } from './errors';
import {
  backStep,
  confirmStep,
  pickTarget,
  refreshSkips,
  resolveNight,
  startNight,
  type NightDraft,
  type NightResult,
} from './night';
import { assignRoles } from './roles';
import type { Rng } from './rng';
import { hostShouldHandOver, nextHost, type Presence } from './room';
import { extendTimer, isExpired, pauseTimer, resumeTimer, startTimer, type Timer } from './timer';
import type { Member, Phase, Player, PlayerId, Winner } from './types';
import { tallyVotes, validateVote, type VoteChoice, type VoteTally } from './vote';
import { checkWinner } from './win';

// The server runs this. Phones only send actions and render the state they are allowed to see.
// Flow: Role check → Night 1 → (Dawn → Discussion → Vote → Reveal → Round status → Night)… → Game over.

export type VoteResult = VoteTally & { round: number; lastWords: string };

export type GameState = {
  phase: Phase;
  /** Night number; Day n follows Night n. 0 during role check. */
  round: number;
  /** Everyone in the room in join order, narrator included. */
  members: Member[];
  narratorId: PlayerId;
  hostId: PlayerId;
  /** Everyone except the narrator, in join order. */
  players: Player[];
  acknowledged: PlayerId[];
  roleCheckStartedAt: number;
  night: NightDraft | null;
  lastNight: NightResult | null;
  discussion: { timer: Timer; extensionsUsed: number } | null;
  vote: { timer: Timer; ballots: Record<PlayerId, VoteChoice> } | null;
  lastVote: VoteResult | null;
  winner: Winner | null;
  endedBy: 'win' | 'host' | null;
  /** `manual` = the narrator pressed Pause (kept if they then drop, restored when they return). */
  pause: { reason: 'narrator' | 'narratorOffline'; since: number; manual: boolean } | null;
  presence: Record<PlayerId, Presence>;
  /** Last "still here" from each phone; silence for PRESENCE_TIMEOUT_MS marks them offline. */
  lastSeen: Record<PlayerId, number>;
  /** Members who left for good. A player who leaves is eliminated; their role stays hidden. */
  left: PlayerId[];
};

export type Action =
  | { type: 'ackRole'; by: PlayerId }
  | { type: 'startGame'; by: PlayerId }
  | { type: 'nightPick'; by: PlayerId; targetId: PlayerId }
  | { type: 'nightConfirm'; by: PlayerId }
  | { type: 'nightBack'; by: PlayerId }
  | { type: 'announceDawn'; by: PlayerId }
  | { type: 'addMinute'; by: PlayerId }
  | { type: 'startVoting'; by: PlayerId }
  | { type: 'castVote'; by: PlayerId; choice: VoteChoice }
  | { type: 'revealVote'; by: PlayerId }
  | { type: 'startNextNight'; by: PlayerId }
  | { type: 'pause'; by: PlayerId }
  | { type: 'resume'; by: PlayerId }
  | { type: 'leave'; by: PlayerId }
  | { type: 'endGame'; by: PlayerId }
  | { type: 'presence'; id: PlayerId; online: boolean }
  /** "Still here" from a phone (every HEARTBEAT_MS). Also runs the offline check. */
  | { type: 'heartbeat'; by: PlayerId }
  /** Time-based checks: vote timer, host handover. The server sends this on a schedule. */
  | { type: 'tick' };

export type Context = { now: number; rng: Rng };

/** `narratorCandidates` is a test-only option (fake players must never be picked to narrate). */
export function createGame(
  members: readonly Member[],
  hostId: PlayerId,
  ctx: Context,
  narratorCandidates?: readonly PlayerId[],
): GameState {
  const { narratorId, players } = assignRoles(members, ctx.rng, narratorCandidates);
  return {
    phase: 'roleCheck',
    round: 0,
    members: members.map((m) => ({ ...m })),
    narratorId,
    hostId,
    players,
    acknowledged: [],
    roleCheckStartedAt: ctx.now,
    night: null,
    lastNight: null,
    discussion: null,
    vote: null,
    lastVote: null,
    winner: null,
    endedBy: null,
    pause: null,
    presence: Object.fromEntries(members.map((m) => [m.id, { online: true, since: ctx.now }])),
    lastSeen: Object.fromEntries(members.map((m) => [m.id, ctx.now])),
    left: [],
  };
}

/** Play again: same room, nobody joins or leaves; narrator and roles are re-picked. Host only. */
/** `dealOnly`: Mode B has no game to finish; the narrator deals again at any time (not the host). */
export function playAgain(
  state: GameState,
  by: PlayerId,
  ctx: Context,
  narratorCandidates?: readonly PlayerId[],
  dealOnly = false,
): GameState {
  if (dealOnly) {
    if (by !== state.narratorId) throw new GameError('notNarrator', 'Only the narrator can deal again.');
  } else {
    if (by !== state.hostId) throw new GameError('notHost', 'Only the host can start a new game.');
    if (state.phase !== 'gameOver') throw new GameError('wrongPhase', 'The game is not over.');
  }
  const members = state.members.filter((m) => !state.left.includes(m.id));
  return createGame(members, state.hostId, ctx, narratorCandidates);
}

// ---------------------------------------------------------------------------------------------

/** Players who still need to acknowledge (people who left are not waited for). */
export function waitingForAck(state: GameState): PlayerId[] {
  return state.players.filter((p) => !state.left.includes(p.id) && !state.acknowledged.includes(p.id)).map((p) => p.id);
}

/** All seen, or 30 s have passed. */
export function canStartAfterRoleCheck(state: GameState, now: number): boolean {
  return waitingForAck(state).length === 0 || now - state.roleCheckStartedAt >= ROLE_CHECK_GRACE_MS;
}

export function hostCanEndGame(state: GameState, now: number): boolean {
  return (
    state.phase !== 'gameOver' &&
    state.pause?.reason === 'narratorOffline' &&
    now - state.pause.since >= NARRATOR_OFFLINE_END_MS
  );
}

export function reduce(prev: GameState, action: Action, ctx: Context): GameState {
  const s: GameState = JSON.parse(JSON.stringify(prev));
  const { now } = ctx;

  const narratorOnly = (by: PlayerId) => {
    if (by !== s.narratorId) throw new GameError('notNarrator', 'Only the narrator can do this.');
  };
  const inPhase = (...phases: Phase[]) => {
    if (!phases.includes(s.phase)) throw new GameError('wrongPhase', `Not allowed during ${s.phase}.`);
  };
  const notPaused = () => {
    if (s.pause) throw new GameError('paused', 'The game is paused.');
  };
  const player = (id: PlayerId) => {
    const p = s.players.find((x) => x.id === id);
    if (!p) throw new GameError('notAPlayer', `${id} is not a player in this game.`);
    return p;
  };

  switch (action.type) {
    case 'ackRole': {
      inPhase('roleCheck');
      player(action.by);
      if (!s.acknowledged.includes(action.by)) s.acknowledged.push(action.by);
      return s;
    }

    case 'startGame': {
      narratorOnly(action.by);
      inPhase('roleCheck');
      notPaused();
      if (!canStartAfterRoleCheck(s, now)) {
        throw new GameError('rolesNotSeen', 'Wait until everyone has seen their role, or 30 seconds.');
      }
      s.phase = 'night';
      s.round = 1;
      s.night = startNight(s.players);
      return s;
    }

    case 'nightPick': {
      narratorOnly(action.by);
      inPhase('night');
      notPaused();
      s.night = pickTarget(s.night!, s.players, action.targetId);
      return s;
    }

    case 'nightBack': {
      narratorOnly(action.by);
      inPhase('night');
      notPaused();
      s.night = backStep(s.night!);
      return s;
    }

    case 'nightConfirm': {
      narratorOnly(action.by);
      inPhase('night');
      notPaused();
      const { draft, finished } = confirmStep(s.night!);
      if (!finished) {
        s.night = draft;
        return s;
      }
      // Finish night → Dawn. The death applies now; the narrator reviews before announcing.
      const saved = draft.picks.mafia !== null && draft.picks.doctor === draft.picks.mafia && !draft.skipped.includes('doctor');
      const result = resolveNight(draft, s.players, s.round, saved ? LAST_WORDS.saved : lastWordsFor('night', ctx.rng));
      if (result.killedId) {
        const victim = player(result.killedId);
        victim.alive = false;
        victim.death = { cause: 'night', round: s.round };
      }
      s.lastNight = result;
      s.night = null;
      s.phase = 'dawn';
      return s;
    }

    case 'announceDawn': {
      narratorOnly(action.by);
      inPhase('dawn');
      notPaused();
      if (endIfWon(s)) return s; // win check after Dawn
      s.phase = 'discussion';
      s.discussion = { timer: startTimer(DISCUSSION_MS, now), extensionsUsed: 0 };
      return s;
    }

    case 'addMinute': {
      narratorOnly(action.by);
      inPhase('discussion');
      notPaused();
      const d = s.discussion!;
      if (d.extensionsUsed >= MAX_EXTENSIONS) throw new GameError('extensionCap', 'You can add a minute 3 times per round.');
      d.timer = extendTimer(d.timer, EXTENSION_MS, now);
      d.extensionsUsed++;
      return s;
    }

    case 'startVoting': {
      narratorOnly(action.by);
      inPhase('discussion');
      notPaused();
      s.discussion = null;
      s.phase = 'vote';
      s.vote = { timer: startTimer(VOTE_MS, now), ballots: {} };
      return s;
    }

    case 'castVote': {
      inPhase('vote');
      notPaused();
      if (action.by in s.vote!.ballots) throw new GameError('alreadyVoted', 'Your vote is locked.');
      validateVote(s.players, action.by, action.choice);
      s.vote!.ballots[action.by] = action.choice;
      closeVoteIfDone(s, now, ctx.rng);
      return s;
    }

    case 'revealVote': {
      narratorOnly(action.by);
      inPhase('reveal');
      notPaused();
      const out = s.lastVote!.eliminatedId;
      if (out) {
        const p = player(out);
        p.alive = false;
        p.death = { cause: 'vote', round: s.round };
      }
      if (endIfWon(s)) return s; // win check after every Reveal
      s.phase = 'roundStatus';
      return s;
    }

    case 'startNextNight': {
      narratorOnly(action.by);
      inPhase('roundStatus');
      notPaused();
      s.round++;
      s.phase = 'night';
      s.night = startNight(s.players);
      return s;
    }

    case 'pause': {
      narratorOnly(action.by);
      if (s.phase === 'gameOver' || s.pause) return s;
      pauseAll(s, 'narrator', now);
      return s;
    }

    case 'resume': {
      narratorOnly(action.by);
      if (!s.pause) return s;
      resumeAll(s, now);
      closeVoteIfDone(s, now, ctx.rng);
      return s;
    }

    case 'leave': {
      const id = action.by;
      if (s.left.includes(id)) return s;
      s.left.push(id);
      s.presence[id] = { online: false, since: now };
      if (s.phase === 'gameOver') return s;

      const p = s.players.find((x) => x.id === id);
      if (p?.alive) {
        p.alive = false;
        p.death = { cause: 'left', round: s.round };
      }
      if (s.night) s.night = refreshSkips(s.night, s.players);
      if (s.vote) {
        delete s.vote.ballots[id];
        closeVoteIfDone(s, now, ctx.rng);
      }
      if (id === s.narratorId) narratorWentOffline(s, now);
      if (id === s.hostId) handOverHost(s, false);
      return s;
    }

    case 'endGame': {
      if (action.by !== s.hostId) throw new GameError('notHost', 'Only the host can end the game.');
      if (!hostCanEndGame(s, now)) {
        throw new GameError('narratorNotOfflineLongEnough', 'The host can end the game after the narrator is offline for 2 minutes.');
      }
      s.phase = 'gameOver';
      s.endedBy = 'host';
      s.winner = null;
      s.pause = null;
      s.night = null;
      s.discussion = null;
      s.vote = null;
      return s;
    }

    case 'presence': {
      if (s.left.includes(action.id)) return s;
      if (action.online) s.lastSeen[action.id] = now;
      setPresence(s, action.id, action.online, now, ctx.rng);
      return s;
    }

    case 'heartbeat': {
      if (s.left.includes(action.by) || !s.members.some((m) => m.id === action.by)) return s;
      s.lastSeen[action.by] = now;
      setPresence(s, action.by, true, now, ctx.rng);
      sweepOffline(s, now, ctx.rng);
      if (hostShouldHandOver(s.presence[s.hostId], now)) handOverHost(s, true);
      return s;
    }

    case 'tick': {
      sweepOffline(s, now, ctx.rng);
      if (hostShouldHandOver(s.presence[s.hostId], now)) handOverHost(s, true);
      if (!s.pause) closeVoteIfDone(s, now, ctx.rng);
      return s;
    }
  }
}

// ---------------------------------------------------------------------------------------------

function endIfWon(s: GameState): boolean {
  const winner = checkWinner(s.players);
  if (!winner) return false;
  s.winner = winner;
  s.endedBy = 'win';
  s.phase = 'gameOver';
  s.discussion = null;
  s.vote = null;
  s.night = null;
  return true;
}

/** Vote always runs the full 30 s (the narrator watches votes arrive), then closes. Missing = None. */
function closeVoteIfDone(s: GameState, now: number, rng: Rng) {
  if (s.phase !== 'vote' || !s.vote) return;
  if (!isExpired(s.vote.timer, now)) return;
  const tally = tallyVotes(s.players, s.vote.ballots);
  s.lastVote = {
    ...tally,
    round: s.round,
    lastWords: tally.eliminatedId ? lastWordsFor('vote', rng) : LAST_WORDS.noElimination,
  };
  s.vote = null;
  s.phase = 'reveal';
}

/** Online/offline change. The narrator going offline pauses the game; coming back resumes it. */
function setPresence(s: GameState, id: PlayerId, online: boolean, at: number, rng: Rng) {
  const before = s.presence[id];
  if (before && before.online === online) return;
  s.presence[id] = { online, since: at };
  if (id !== s.narratorId || s.phase === 'gameOver') return;
  if (!online) narratorWentOffline(s, at);
  else if (s.pause?.reason === 'narratorOffline') {
    if (s.pause.manual) s.pause = { reason: 'narrator', since: at, manual: true };
    else {
      resumeAll(s, at);
      closeVoteIfDone(s, at, rng);
    }
  }
}

/** Phones that have gone quiet count as offline from their last heartbeat (a dropped phone). */
function sweepOffline(s: GameState, now: number, rng: Rng) {
  for (const m of s.members) {
    if (s.left.includes(m.id) || !s.presence[m.id]?.online) continue;
    const last = s.lastSeen[m.id] ?? now;
    if (now - last >= PRESENCE_TIMEOUT_MS) setPresence(s, m.id, false, last, rng);
  }
}

/** Narrator offline pauses the game; the host's 2-minute clock starts now. */
function narratorWentOffline(s: GameState, now: number) {
  if (s.phase === 'gameOver') return;
  if (s.pause) s.pause = { reason: 'narratorOffline', since: now, manual: s.pause.manual };
  else pauseAll(s, 'narratorOffline', now);
}

function pauseAll(s: GameState, reason: 'narrator' | 'narratorOffline', now: number) {
  s.pause = { reason, since: now, manual: reason === 'narrator' };
  if (s.discussion) s.discussion.timer = pauseTimer(s.discussion.timer, now);
  if (s.vote) s.vote.timer = pauseTimer(s.vote.timer, now);
}

function resumeAll(s: GameState, now: number) {
  s.pause = null;
  if (s.discussion) s.discussion.timer = resumeTimer(s.discussion.timer, now);
  if (s.vote) s.vote.timer = resumeTimer(s.vote.timer, now);
}

/** If the old host returns they are a normal player. On a timeout, only hand to someone online. */
function handOverHost(s: GameState, requireOnline: boolean) {
  const next = nextHost(s.members, s.hostId, s.presence, s.left);
  if (next && (!requireOnline || s.presence[next]?.online)) s.hostId = next;
}
