import { doc, getDoc } from 'firebase/firestore';
import { afterAll, describe, expect, it } from 'vitest';
import { cleanup, newPhone, signedInPhone, uniqueName } from './helpers';

// Cloud Functions against the local emulators: names (anonymous sign-in), rooms.

afterAll(cleanup);

async function expectError(p: Promise<unknown>, reason: string) {
  await expect(p).rejects.toMatchObject({ details: { reason } });
}

describe('Name (no login)', () => {
  it('anonymous sign-in + a name; stored tidied, nothing else', async () => {
    const p = await signedInPhone();
    expect(await p.call('setName', { name: '  Isha   K ' })).toEqual({ name: 'Isha K' });
    expect((await getDoc(doc(p.db, 'users', p.uid!))).data()).toEqual({ username: 'Isha K' });
  });

  it('1–16 characters; can be changed', async () => {
    const p = await signedInPhone('Tara');
    await expectError(p.call('setName', { name: '   ' }), 'empty');
    await expectError(p.call('setName', { name: 'a'.repeat(17) }), 'tooLong');
    await p.call('setName', { name: 'Tara M' });
    expect((await getDoc(doc(p.db, 'users', p.uid!))).data()!.username).toBe('Tara M');
  });

  it('the same name is fine in different rooms', async () => {
    const a = await signedInPhone('Isha');
    const b = await signedInPhone('Isha');
    await a.call('createRoom');
    await b.call('createRoom');
  });

  it('needs sign-in', async () => {
    await expect(newPhone().call('setName', { name: 'whoever' })).rejects.toMatchObject({ code: 'functions/unauthenticated' });
  });
});

describe('Rooms', () => {
  it('create → 4-character code, creator is host; others join by code; lobby syncs', async () => {
    const host = await signedInPhone(uniqueName('host'));
    const { code } = await host.call<{ code: string }>('createRoom');
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{4}$/);

    const guests = await Promise.all([1, 2, 3, 4].map((i) => signedInPhone(uniqueName(`g${i}`))));
    for (const g of guests) await g.call('joinRoom', { code: code.toLowerCase() }); // typed codes are normalised

    const room = (await getDoc(doc(guests[0].db, 'rooms', code))).data()!;
    expect(room.hostId).toBe(host.uid);
    expect(room.members).toHaveLength(5);
    expect(room.memberIds[0]).toBe(host.uid); // join order
    expect(room.status).toBe('lobby');
  });

  it('joining twice is harmless; unknown codes are refused', async () => {
    const host = await signedInPhone(uniqueName('h'));
    const { code } = await host.call<{ code: string }>('createRoom');
    await host.call('joinRoom', { code });
    expect((await getDoc(doc(host.db, 'rooms', code))).data()!.members).toHaveLength(1);
    await expectError(host.call('joinRoom', { code: 'ZZZZ' === code ? 'YYYY' : 'ZZZZ' }), 'noRoom');
    await expectError(host.call('joinRoom', { code: 'AB' }), 'badCode');
  });

  it('a room holds at most 21 people', async () => {
    const host = await signedInPhone(uniqueName('big'));
    const { code } = await host.call<{ code: string }>('createRoom');
    const people = await Promise.all(Array.from({ length: 21 }, (_, i) => signedInPhone(uniqueName(`p${i}`))));
    for (const p of people.slice(0, 20)) await p.call('joinRoom', { code });
    await expectError(people[20].call('joinRoom', { code }), 'full');
  });

  it('host leaving the lobby passes host to the next in join order', async () => {
    const host = await signedInPhone(uniqueName('lh'));
    const { code } = await host.call<{ code: string }>('createRoom');
    const next = await signedInPhone(uniqueName('ln'));
    await next.call('joinRoom', { code });
    await host.call('leaveRoom', { code });
    const room = (await getDoc(doc(next.db, 'rooms', code))).data()!;
    expect(room.hostId).toBe(next.uid);
    expect(room.memberIds).toEqual([next.uid]);
  });

  it('the host can remove a player from the lobby; nobody else can', async () => {
    const host = await signedInPhone(uniqueName('rh'));
    const { code } = await host.call<{ code: string }>('createRoom');
    const a = await signedInPhone(uniqueName('ra'));
    const b = await signedInPhone(uniqueName('rb'));
    await a.call('joinRoom', { code });
    await b.call('joinRoom', { code });
    await expectError(a.call('removePlayer', { code, playerId: b.uid }), 'notHost');
    await expectError(host.call('removePlayer', { code, playerId: host.uid }), 'self');
    await host.call('removePlayer', { code, playerId: a.uid });
    const room = (await getDoc(doc(host.db, 'rooms', code))).data()!;
    expect(room.memberIds).toEqual([host.uid, b.uid]);
    await expect(getDoc(doc(a.db, 'rooms', code))).rejects.toThrow(); // removed: can no longer read the room
  });

  it('needs a name first', async () => {
    const p = await signedInPhone();
    await expectError(p.call('createRoom'), 'noName');
  });

  it('a name already in the room is refused ("Isha" = "isha"); renaming in the lobby renames there', async () => {
    const host = await signedInPhone('Isha');
    const { code } = await host.call<{ code: string }>('createRoom');
    const guest = await signedInPhone('isha');
    const err = (await guest.call('joinRoom', { code }).catch((e) => e)) as { message: string; details: { reason: string } };
    expect(err.details.reason).toBe('nameTaken');
    expect(err.message).toMatch(/^isha is already in this room. Add a letter or pick another\./);
    await guest.call('setName', { name: 'Isha2' });
    await guest.call('joinRoom', { code });
    await expectError(guest.call('setName', { name: 'ISHA' }), 'nameTaken');
    await guest.call('setName', { name: 'Rohan' });
    const room = (await getDoc(doc(host.db, 'rooms', code))).data()!;
    expect(room.members.map((m: { name: string }) => m.name)).toEqual(['Isha', 'Rohan']);
  });
});
