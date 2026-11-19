import type { Transaction } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { col, db, requireUid, secureRng, stringArg } from './admin';
import { currentRef } from './rooms';
import {
  canStart,
  createGame,
  GameError,
  narratorView,
  normalizeRoomCode,
  playAgain as engineAgain,
  publicView,
  reduce,
  roleDocs,
  validVoteTargets,
  NONE,
  type Action,
  type GameState,
  type PrivateStateDoc,
  type RoomDoc,
} from './game/index';

// The server decides: role assignment, night result, vote tally, win check and timers run here.
// Every request reads the full state, runs the shared engine, then writes the three views.

const IS_EMULATOR = process.env.FUNCTIONS_EMULATOR === 'true';
const roomRef = (code: string) => db.collection(col.rooms).doc(code);
const stateRef = (code: string) => roomRef(code).collection('private').doc('state');
const isFake = (id: string) => id.startsWith('fake_');

/** Engine rule errors become readable callable errors (reason = engine code). */
function run<T>(fn: () => T): T {
  try {
    return fn();
  } catch (e) {
    if (e instanceof GameError) throw new HttpsError('failed-precondition', e.message, { reason: e.code });
    throw e;
  }
}

/** Emulator-only: fake players acknowledge at once and vote at random, so one phone can play. */
function fakesAct(s: GameState, now: number): GameState {
  if (!IS_EMULATOR) return s;
  let out = s;
  const ctx = { now, rng: secureRng };
  if (out.phase === 'roleCheck') {
    for (const p of out.players) if (isFake(p.id) && !out.acknowledged.includes(p.id)) out = reduce(out, { type: 'ackRole', by: p.id }, ctx);
  }
  if (out.phase === 'vote' && out.vote && !out.pause) {
    for (const p of out.players) {
      if (out.phase !== 'vote' || !p.alive || !isFake(p.id) || p.id in (out.vote?.ballots ?? {})) continue;
      const targets = validVoteTargets(out.players, p.id);
      const choice = secureRng() < 0.3 || !targets.length ? NONE : targets[Math.floor(secureRng() * targets.length)];
      out = reduce(out, { type: 'castVote', by: p.id, choice }, ctx);
    }
  }
  return out;
}

/** Writes the full state and every view (game start / play again). */
function writeViews(tx: Transaction, code: string, s: GameState, version: number, now: number, everyone: string[], gameNumber?: number) {
  tx.set(stateRef(code), { state: s, version } satisfies PrivateStateDoc);
  tx.update(roomRef(code), {
    status: 'playing',
    hostId: s.hostId,
    game: publicView(s, now),
    updatedAt: now,
    ...(gameNumber ? { gameNumber } : {}),
  });
  const roles = roleDocs(s);
  for (const id of everyone) {
    if (isFake(id)) continue;
    tx.set(roomRef(code).collection('roles').doc(id), roles[id] ?? { role: 'narrator', partners: [], myVote: null });
  }
  tx.set(roomRef(code).collection('narrator').doc('view'), narratorView(s, now));
}

/** Everything except heartbeat bookkeeping: if only this is equal, phones do not need new views. */
const meaningful = (s: GameState) => JSON.stringify({ ...s, lastSeen: null, presence: null });

/**
 * After an in-game action: always save the state, but only rewrite the views that changed, so the
 * 15-second "still here" heartbeats do not rewrite every phone's documents.
 */
function writeChanges(tx: Transaction, code: string, prev: GameState, next: GameState, version: number, now: number, everyone: string[]) {
  tx.set(stateRef(code), { state: next, version } satisfies PrivateStateDoc);
  if (meaningful(prev) === meaningful(next)) return;
  tx.update(roomRef(code), { hostId: next.hostId, game: publicView(next, now), updatedAt: now });
  const before = roleDocs(prev);
  const after = roleDocs(next);
  for (const id of everyone) {
    if (isFake(id) || JSON.stringify(before[id]) === JSON.stringify(after[id])) continue;
    tx.set(roomRef(code).collection('roles').doc(id), after[id] ?? { role: 'narrator', partners: [], myVote: null });
  }
  tx.set(roomRef(code).collection('narrator').doc('view'), narratorView(next, now));
}

async function clearDeadChat(code: string) {
  const docs = await roomRef(code).collection('deadChat').listDocuments();
  await Promise.all(docs.map((d) => d.delete()));
}

/** Host taps Start (5+ joined). The narrator is picked at random, then roles. Nobody can join after. */
export const startGame = onCall(async (req) => {
  const uid = requireUid(req);
  const code = normalizeRoomCode(stringArg(req.data, 'code'));
  await clearDeadChat(code);
  await db.runTransaction(async (tx) => {
    const now = Date.now();
    const room = (await tx.get(roomRef(code))).data() as RoomDoc | undefined;
    if (!room) throw new HttpsError('not-found', 'No room with that code.', { reason: 'noRoom' });
    if (room.hostId !== uid) throw new HttpsError('permission-denied', 'Only the host can start.', { reason: 'notHost' });
    if (room.status !== 'lobby') throw new HttpsError('failed-precondition', 'The game has already started.', { reason: 'started' });
    if (!canStart(room.members.length)) {
      throw new HttpsError('failed-precondition', 'Needs 5 people to start.', { reason: 'notEnoughPeople' });
    }
    // Emulator-only test aid: pick who narrates (so a script can narrate while a phone plays).
    const devNarrator = IS_EMULATOR ? (req.data as { devNarratorId?: string }).devNarratorId : undefined;
    const real = IS_EMULATOR
      ? devNarrator && room.memberIds.includes(devNarrator)
        ? [devNarrator]
        : room.mode === 'B'
          ? undefined // Mode B: the narrator has nothing to do in the app, so a fake player can be it
          : room.members.filter((m) => !isFake(m.id)).map((m) => m.id)
      : undefined;
    const state = fakesAct(run(() => createGame(room.members, room.hostId, { now, rng: secureRng }, real)), now);
    writeViews(tx, code, state, 1, now, room.memberIds, (room.gameNumber ?? 0) + 1);
  });
  return { code };
});

/** Every in-game tap. The server sets who is acting; phones cannot act for someone else. */
export const gameAction = onCall(async (req) => {
  const uid = requireUid(req);
  const code = normalizeRoomCode(stringArg(req.data, 'code'));
  const raw = (req.data as { action?: { type?: string } }).action;
  if (!raw || typeof raw.type !== 'string') throw new HttpsError('invalid-argument', 'Missing action.');

  let action: Action;
  if (raw.type === 'tick') action = { type: 'tick' };
  else if (raw.type === 'presence') action = { type: 'presence', id: uid, online: !!(raw as { online?: boolean }).online };
  else action = { ...(raw as object), by: uid } as Action;

  const result = await db.runTransaction(async (tx) => {
    const now = Date.now();
    const [roomSnap, stateSnap] = await Promise.all([tx.get(roomRef(code)), tx.get(stateRef(code))]);
    const room = roomSnap.data() as RoomDoc | undefined;
    const saved = stateSnap.data() as PrivateStateDoc | undefined;
    if (!room || !saved || room.status !== 'playing') throw new HttpsError('failed-precondition', 'No game is running here.', { reason: 'noGame' });
    if (!room.memberIds.includes(uid)) throw new HttpsError('permission-denied', 'You are not in this room.', { reason: 'notMember' });

    const next = fakesAct(run(() => reduce(saved.state, action, { now, rng: secureRng })), now);
    if (JSON.stringify(next) === JSON.stringify(saved.state)) return { changed: false };
    writeChanges(tx, code, saved.state, next, saved.version + 1, now, room.memberIds);
    if (action.type === 'leave') tx.delete(currentRef(uid)); // left for good: no "back to your game"
    return { changed: meaningful(next) !== meaningful(saved.state) };
  });
  return result;
});

/** Host: new game in the same room. Narrator and roles are re-picked; nobody joins or leaves. */
export const playAgain = onCall(async (req) => {
  const uid = requireUid(req);
  const code = normalizeRoomCode(stringArg(req.data, 'code'));
  await clearDeadChat(code);
  await db.runTransaction(async (tx) => {
    const now = Date.now();
    const [roomSnap, stateSnap] = await Promise.all([tx.get(roomRef(code)), tx.get(stateRef(code))]);
    const room = roomSnap.data() as RoomDoc | undefined;
    const saved = stateSnap.data() as PrivateStateDoc | undefined;
    if (!room || !saved) throw new HttpsError('failed-precondition', 'No game here.', { reason: 'noGame' });
    const devNarrator = IS_EMULATOR ? (req.data as { devNarratorId?: string }).devNarratorId : undefined;
    const real = IS_EMULATOR
      ? devNarrator && room.memberIds.includes(devNarrator)
        ? [devNarrator]
        : room.mode === 'B'
          ? undefined // Mode B: the narrator has nothing to do in the app, so a fake player can be it
          : room.members.filter((m) => !isFake(m.id)).map((m) => m.id)
      : undefined;
    // Emulator only: a fake narrator cannot tap, so the host deals for them.
    const fakeNarrator = IS_EMULATOR && isFake(saved.state.narratorId) && uid === room.hostId;
    const dealer = room.mode === 'B' && fakeNarrator ? saved.state.narratorId : uid;
    const next = fakesAct(run(() => engineAgain(saved.state, dealer, { now, rng: secureRng }, real, room.mode === 'B')), now);
    writeViews(tx, code, next, saved.version + 1, now, room.memberIds, (room.gameNumber ?? 1) + 1);
  });
  return { code };
});
