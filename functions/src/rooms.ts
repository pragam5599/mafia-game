import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { col, db, requireUid, secureRng, stringArg } from './admin';
import {
  canJoin,
  nameInRoom,
  nameInRoomTaken,
  generateRoomCode,
  nextHost,
  normalizeRoomCode,
  roomShouldClose,
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
  type Member,
  type RoomDoc,
  type RoomMode,
  type UserDoc,
} from './game/index';

// Rooms (lobby). Any signed-in player can create one and becomes host.
// 4-character code, unique among open rooms. Nobody can join after Start. Empty rooms close after 30 min.

const roomRef = (code: string) => db.collection(col.rooms).doc(code);
/** users/{uid}/private/current: { code } so a player can get back to their game (only they can read it). */
export const currentRef = (uid: string) => db.collection(col.users).doc(uid).collection('private').doc('current');

const CODE_SHAPE = new RegExp(`^[${ROOM_CODE_ALPHABET}]{${ROOM_CODE_LENGTH}}$`);

async function me(uid: string): Promise<Member> {
  const profile = (await db.collection(col.users).doc(uid).get()).data() as UserDoc | undefined;
  if (!profile?.username) throw new HttpsError('failed-precondition', 'Type your name first.', { reason: 'noName' });
  return { id: uid, name: profile.username };
}

/** A room counts as open unless it is closed or has sat empty for 30 minutes. */
function isOpen(room: RoomDoc | undefined, now: number): room is RoomDoc {
  return !!room && room.status !== 'closed' && !roomShouldClose(room.emptySince, now);
}

function readCode(data: unknown): string {
  const code = normalizeRoomCode(stringArg(data, 'code'));
  if (!CODE_SHAPE.test(code)) throw new HttpsError('invalid-argument', 'Room codes are 4 letters and numbers.', { reason: 'badCode' });
  return code;
}

export const createRoom = onCall(async (req) => {
  const uid = requireUid(req);
  const host = await me(uid);
  const mode: RoomMode = (req.data as { mode?: unknown } | null)?.mode === 'B' ? 'B' : 'A';
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = generateRoomCode(secureRng, () => false);
    const created = await db.runTransaction(async (tx) => {
      const now = Date.now();
      const existing = (await tx.get(roomRef(code))).data() as RoomDoc | undefined;
      if (isOpen(existing, now)) return false; // taken by an open room; try another code
      const room: RoomDoc = {
        code,
        status: 'lobby',
        hostId: uid,
        members: [host],
        memberIds: [uid],
        createdAt: now,
        updatedAt: now,
        emptySince: null,
        game: null,
        mode,
      };
      tx.set(roomRef(code), room);
      tx.set(currentRef(uid), { code });
      return true;
    });
    if (created) return { code };
  }
  throw new HttpsError('unavailable', 'Could not make a room right now. Try again.', { reason: 'noCode' });
});

export const joinRoom = onCall(async (req) => {
  const uid = requireUid(req);
  const code = readCode(req.data);
  const player = await me(uid);
  await db.runTransaction(async (tx) => {
    const now = Date.now();
    const room = (await tx.get(roomRef(code))).data() as RoomDoc | undefined;
    if (!isOpen(room, now)) throw new HttpsError('not-found', 'No open room with that code.', { reason: 'noRoom' });
    if (room.memberIds.includes(uid)) {
      tx.set(currentRef(uid), { code }); // already in (e.g. reconnecting)
      return;
    }
    if (room.status !== 'lobby') throw new HttpsError('failed-precondition', 'This game has already started.', { reason: 'started' });
    if (!canJoin(false, room.members.length)) throw new HttpsError('resource-exhausted', 'This room is full.', { reason: 'full' });
    if (nameInRoom(player.name, room.members)) {
      throw new HttpsError('already-exists', nameInRoomTaken(player.name), { reason: 'nameTaken' });
    }
    tx.update(roomRef(code), {
      members: [...room.members, player],
      memberIds: [...room.memberIds, uid],
      emptySince: null,
      updatedAt: now,
    });
    tx.set(currentRef(uid), { code });
  });
  return { code };
});

/** Leave the lobby. (Leaving a running game goes through the game engine, Phase 6.) */
export const leaveRoom = onCall(async (req) => {
  const uid = requireUid(req);
  const code = readCode(req.data);
  await db.runTransaction(async (tx) => {
    const now = Date.now();
    const room = (await tx.get(roomRef(code))).data() as RoomDoc | undefined;
    if (!room || !room.memberIds.includes(uid)) return;
    if (room.status !== 'lobby') throw new HttpsError('failed-precondition', 'Use Leave game during a game.', { reason: 'started' });
    const members = room.members.filter((m) => m.id !== uid);
    const presence = Object.fromEntries(members.map((m) => [m.id, { online: true, since: now }]));
    const hostId = room.hostId === uid ? (nextHost(room.members, uid, presence, [uid]) ?? uid) : room.hostId;
    tx.update(roomRef(code), {
      members,
      memberIds: members.map((m) => m.id),
      hostId,
      emptySince: members.length === 0 ? now : null,
      updatedAt: now,
    });
    tx.delete(currentRef(uid));
  });
  return { code };
});

/** Host only, before Start: removes a player from the lobby (H2). Their phone shows the room as gone. */
export const removePlayer = onCall(async (req) => {
  const uid = requireUid(req);
  const code = readCode(req.data);
  const playerId = stringArg(req.data, 'playerId');
  await db.runTransaction(async (tx) => {
    const room = (await tx.get(roomRef(code))).data() as RoomDoc | undefined;
    if (!room || room.hostId !== uid) throw new HttpsError('permission-denied', 'Only the host can remove players.', { reason: 'notHost' });
    if (room.status !== 'lobby') throw new HttpsError('failed-precondition', 'The game has already started.', { reason: 'started' });
    if (playerId === uid) throw new HttpsError('invalid-argument', 'Use Back to leave the room.', { reason: 'self' });
    if (!room.memberIds.includes(playerId)) return; // already gone
    const members = room.members.filter((m) => m.id !== playerId);
    tx.update(roomRef(code), { members, memberIds: members.map((m) => m.id), updatedAt: Date.now() });
    tx.delete(currentRef(playerId));
  });
  return { code };
});
