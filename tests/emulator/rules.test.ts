import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, newPhone, seed, signedInPhone, uniqueName, type Phone } from './helpers';

// Firestore security rules (CLAUDE.md privacy): checked with real signed-in test users.

afterAll(cleanup);

let narrator: Phone, mafia: Phone, villager: Phone, dead: Phone, outsider: Phone;
let deadName: string;
let code: string;

beforeAll(async () => {
  [narrator, mafia, villager, outsider] = await Promise.all(
    ['nar', 'maf', 'vil', 'out'].map((n) => signedInPhone(uniqueName(n))),
  );
  deadName = uniqueName('dead');
  dead = await signedInPhone(deadName);

  code = `T${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  const ids = [narrator, mafia, villager, dead].map((p) => p.uid!);
  await seed(`rooms/${code}`, {
    code,
    status: 'playing',
    hostId: ids[0],
    members: ids.map((id) => ({ id, name: id })),
    memberIds: ids,
    createdAt: 0,
    updatedAt: 0,
    emptySince: null,
    game: { narratorId: narrator.uid, dead: [dead.uid] },
  });
  await seed(`rooms/${code}/roles/${mafia.uid}`, { role: 'mafia', partners: [] });
  await seed(`rooms/${code}/roles/${villager.uid}`, { role: 'villager', partners: [] });
  await seed(`rooms/${code}/narrator/view`, { roles: { [mafia.uid!]: 'mafia' }, ballots: {} });
  await seed(`rooms/${code}/private/state`, { secret: true });
});

const canRead = (p: Phone, path: string) =>
  getDoc(doc(p.db, path)).then(
    () => true,
    () => false,
  );

describe('Room doc', () => {
  it('members can read it; outsiders cannot', async () => {
    expect(await canRead(villager, `rooms/${code}`)).toBe(true);
    expect(await canRead(outsider, `rooms/${code}`)).toBe(false);
  });

  it('nobody writes it from a phone', async () => {
    await expect(setDoc(doc(narrator.db, `rooms/${code}`), { status: 'closed' }, { merge: true })).rejects.toThrow();
  });
});

describe('Roles', () => {
  it('a player can read only their own role', async () => {
    expect(await canRead(villager, `rooms/${code}/roles/${villager.uid}`)).toBe(true);
    expect(await canRead(villager, `rooms/${code}/roles/${mafia.uid}`)).toBe(false);
    expect(await canRead(mafia, `rooms/${code}/roles/${villager.uid}`)).toBe(false);
  });

  it('only the narrator can read every role and who voted whom', async () => {
    expect(await canRead(narrator, `rooms/${code}/roles/${mafia.uid}`)).toBe(true);
    expect(await canRead(narrator, `rooms/${code}/narrator/view`)).toBe(true);
    expect(await canRead(mafia, `rooms/${code}/narrator/view`)).toBe(false);
    expect(await canRead(villager, `rooms/${code}/narrator/view`)).toBe(false);
  });

  it('the full engine state is server-only, even for the narrator', async () => {
    expect(await canRead(narrator, `rooms/${code}/private/state`)).toBe(false);
  });
});

describe('Dead chat', () => {
  it('only eliminated players can read it', async () => {
    await expect(getDocs(collection(dead.db, `rooms/${code}/deadChat`))).resolves.toBeTruthy();
    await expect(getDocs(collection(villager.db, `rooms/${code}/deadChat`))).rejects.toThrow();
    await expect(getDocs(collection(narrator.db, `rooms/${code}/deadChat`))).rejects.toThrow();
  });

  it('only eliminated players can write, as themselves', async () => {
    const chat = (p: Phone) => collection(p.db, `rooms/${code}/deadChat`);
    await expect(
      addDoc(chat(dead), { authorId: dead.uid, authorName: deadName, text: 'It was Isha, I think.', sentAt: serverTimestamp() }),
    ).resolves.toBeTruthy();
    await expect(
      addDoc(chat(villager), { authorId: villager.uid, authorName: 'x', text: 'hello', sentAt: serverTimestamp() }),
    ).rejects.toThrow();
    // Cannot pretend to be someone else.
    await expect(
      addDoc(chat(dead), { authorId: dead.uid, authorName: 'someone_else', text: 'hi', sentAt: serverTimestamp() }),
    ).rejects.toThrow();
    await expect(
      addDoc(chat(dead), { authorId: villager.uid, authorName: deadName, text: 'hi', sentAt: serverTimestamp() }),
    ).rejects.toThrow();
  });
});

describe('Accounts', () => {
  it('signed-in users can read usernames; signed-out cannot; nobody writes', async () => {
    expect(await canRead(villager, `users/${mafia.uid}`)).toBe(true);
    expect(await canRead(newPhone(), `users/${mafia.uid}`)).toBe(false);
    await expect(setDoc(doc(villager.db, `users/${villager.uid}`), { username: 'hacker' })).rejects.toThrow();
  });

  it('login codes are never readable', async () => {
    expect(await canRead(villager, 'otpRequests/anything')).toBe(false);
  });
});
