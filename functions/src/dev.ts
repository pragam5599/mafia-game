import { randomUUID } from 'node:crypto';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { col, db, requireUid, stringArg } from './admin';
import { canJoin, normalizeRoomCode, type RoomDoc } from './game/index';

// Test tools. They exist only in the local emulators and refuse to run anywhere else.

const IS_EMULATOR = process.env.FUNCTIONS_EMULATOR === 'true';
const NAMES = ['Aarav', 'Isha', 'Rohan', 'Tara', 'Zoya', 'Kabir', 'Meera', 'Dev', 'Nina', 'Arjun', 'Sana', 'Vikram', 'Anya', 'Kiran', 'Leela', 'Omar', 'Priya', 'Reza', 'Tanvi', 'Yash'];

/** Host only: adds fake players to the lobby so a game can start with one or two phones. */
export const devAddFakePlayers = onCall(async (req) => {
  if (!IS_EMULATOR) throw new HttpsError('permission-denied', 'Only available in test mode.');
  const uid = requireUid(req);
  const code = normalizeRoomCode(stringArg(req.data, 'code'));
  const count = Math.max(1, Math.min(20, Number((req.data as { count?: number }).count) || 4));
  await db.runTransaction(async (tx) => {
    const ref = db.collection(col.rooms).doc(code);
    const room = (await tx.get(ref)).data() as RoomDoc | undefined;
    if (!room || room.hostId !== uid || room.status !== 'lobby') {
      throw new HttpsError('failed-precondition', 'Only the host can add players, before the game starts.');
    }
    const members = [...room.members];
    const used = new Set(members.map((m) => m.name.toLowerCase()));
    for (let i = 0; i < count && canJoin(false, members.length); i++) {
      const base = NAMES.find((n) => !used.has(n.toLowerCase())) ?? `Guest${members.length}`;
      used.add(base.toLowerCase());
      members.push({ id: `fake_${randomUUID().slice(0, 8)}`, name: base });
    }
    tx.update(ref, { members, memberIds: members.map((m) => m.id), updatedAt: Date.now() });
  });
  return { code };
});
