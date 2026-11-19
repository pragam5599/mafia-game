import { randomInt } from 'node:crypto';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import type { Rng } from './game/index';

// Firebase emulators: default credentials. Vercel (the free live server): the service-account key
// is kept in a Vercel secret (FIREBASE_SERVICE_ACCOUNT), never in the repo.
const key = process.env.FIREBASE_SERVICE_ACCOUNT;
initializeApp(key ? { credential: cert(JSON.parse(key)) } : undefined);

// Every function module imports this file first, so this applies to all of them.
// Mumbai, near the players. (Only used by the emulators now; live runs on Vercel, see api/.)
setGlobalOptions({ region: 'asia-south1', maxInstances: 10 });

export const db = getFirestore();

/** Secure randomness for roles, narrator pick, room codes and last words. */
export const secureRng: Rng = () => randomInt(0, 2 ** 32) / 2 ** 32;

/** Signed-in user id, or an "unauthenticated" error. */
export function requireUid(req: CallableRequest<unknown>): string {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in first.');
  return uid;
}

/** Reads a string field from callable data, or fails with "invalid-argument". */
export function stringArg(data: unknown, key: string): string {
  const v = (data as Record<string, unknown> | null)?.[key];
  if (typeof v !== 'string' || v.length === 0 || v.length > 200) {
    throw new HttpsError('invalid-argument', `Missing ${key}.`);
  }
  return v;
}

/** Firestore collections. */
export const col = {
  users: 'users', // users/{uid}: { username } (the name typed on this device; readable by signed-in users)
  rooms: 'rooms', // rooms/{code}: lobby + public game view (members only)
} as const;
