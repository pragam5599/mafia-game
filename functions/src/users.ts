import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { col, db, requireUid, stringArg } from './admin';
import { checkName, cleanName, nameInRoom, nameInRoomTaken, type RoomDoc } from './game/index';
import { currentRef } from './rooms';

// Name: 1–16 readable characters, typed on the first screen. Only unique inside a room.
// Renaming in a lobby renames you there too; during a game it waits (the narrator calls you by it).

export const setName = onCall(async (req) => {
  const uid = requireUid(req);
  const name = cleanName(stringArg(req.data, 'name'));
  const problem = checkName(name);
  if (problem) throw new HttpsError('invalid-argument', 'Use 1 to 16 characters.', { reason: problem });

  await db.runTransaction(async (tx) => {
    const code = (await tx.get(currentRef(uid))).data()?.code as string | undefined;
    const roomRef = code ? db.collection(col.rooms).doc(code) : null;
    const room = roomRef ? ((await tx.get(roomRef)).data() as RoomDoc | undefined) : undefined;
    if (roomRef && room && room.status !== 'closed' && room.memberIds.includes(uid)) {
      if (room.status !== 'lobby') {
        throw new HttpsError('failed-precondition', 'You can change your name after this game.', { reason: 'inGame' });
      }
      if (nameInRoom(name, room.members, uid)) throw new HttpsError('already-exists', nameInRoomTaken(name), { reason: 'nameTaken' });
      tx.update(roomRef, { members: room.members.map((m) => (m.id === uid ? { ...m, name } : m)), updatedAt: Date.now() });
    }
    tx.set(db.collection(col.users).doc(uid), { username: name });
  });
  return { name };
});
