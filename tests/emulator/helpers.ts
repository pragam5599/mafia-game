import { deleteApp, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInAnonymously } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, httpsCallable, type Functions } from 'firebase/functions';

// Each test "phone" is its own Firebase app instance talking to the local emulators.

const PROJECT = 'demo-mafia';
const HOST = '127.0.0.1';
const config = { apiKey: 'demo-key', authDomain: `${PROJECT}.firebaseapp.com`, projectId: PROJECT, appId: 'demo-app' };

let n = 0;
const apps: FirebaseApp[] = [];

export type Phone = {
  uid: string | null;
  db: Firestore;
  fns: Functions;
  call: <T = unknown>(name: string, data?: unknown) => Promise<T>;
};

export function newPhone(): Phone {
  const app = initializeApp(config, `phone-${n++}-${Date.now()}`);
  apps.push(app);
  const auth = getAuth(app);
  connectAuthEmulator(auth, `http://${HOST}:9099`, { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, HOST, 8080);
  const fns = getFunctions(app, 'asia-south1');
  connectFunctionsEmulator(fns, HOST, 5001);
  const phone: Phone = {
    uid: null,
    db,
    fns,
    call: async (name, data = {}) => (await httpsCallable(fns, name)(data)).data as never,
  };
  // Keep uid in sync after sign-in.
  auth.onAuthStateChanged((u) => (phone.uid = u?.uid ?? null));
  (phone as Phone & { auth: typeof auth }).auth = auth;
  return phone;
}

/** No login: anonymous sign-in, then type a name (setName). */
export async function signedInPhone(name?: string): Promise<Phone> {
  const p = newPhone() as Phone & { auth: ReturnType<typeof getAuth> };
  const cred = await signInAnonymously(p.auth);
  p.uid = cred.user.uid;
  if (name) await p.call('setName', { name });
  return p;
}

export const uniqueName = (base: string) => `${base.slice(0, 9)}_${Math.random().toString(36).slice(2, 8)}`;

/** Writes a doc bypassing security rules (the emulator accepts the "owner" token). */
export async function seed(path: string, fields: Record<string, unknown>): Promise<void> {
  const res = await fetch(`http://${HOST}:8080/v1/projects/${PROJECT}/databases/(default)/documents/${path}`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: toFirestore(fields) }),
  });
  if (!res.ok) throw new Error(`seed ${path}: ${res.status} ${await res.text()}`);
}

function toValue(v: unknown): unknown {
  if (v === null) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  return { mapValue: { fields: toFirestore(v as Record<string, unknown>) } };
}

function toFirestore(o: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, toValue(v)]));
}

export async function cleanup() {
  await Promise.all(apps.splice(0).map((a) => deleteApp(a)));
}
