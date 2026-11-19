import { doc, getDoc } from 'firebase/firestore';
import { afterAll, describe, expect, it } from 'vitest';
import { cleanup, signedInPhone, uniqueName, type Phone } from './helpers';

// A whole game through the Cloud Functions: lobby → start → role check → night → dawn → vote → …
// Three real test logins plus fake players (emulator-only helper), like testing with a few phones.

afterAll(cleanup);

type Game = Record<string, any>;

async function roomGame(p: Phone, code: string): Promise<Game> {
  return (await getDoc(doc(p.db, 'rooms', code))).data()!.game;
}

describe('Full game on the emulators', () => {
  it('plays from Start to Game over, with privacy holding at every step', async () => {
    const phones = await Promise.all([1, 2, 3].map((i) => signedInPhone(uniqueName(`real${i}`))));
    const [host] = phones;
    const { code } = await host.call<{ code: string }>('createRoom');
    for (const p of phones.slice(1)) await p.call('joinRoom', { code });
    await host.call('devAddFakePlayers', { code, count: 6 }); // 9 people → 8 players + narrator

    await host.call('startGame', { code });
    let game = await roomGame(host, code);
    expect(game.phase).toBe('roleCheck');

    // The narrator is always one of the real phones (fake players never narrate).
    const narrator = phones.find((p) => p.uid === game.narratorId)!;
    expect(narrator).toBeTruthy();
    const players = phones.filter((p) => p !== narrator);

    // Privacy: each real player reads only their own role doc; the narrator reads the control panel.
    for (const p of players) {
      const mine = await getDoc(doc(p.db, `rooms/${code}/roles/${p.uid}`));
      expect(['mafia', 'doctor', 'detective', 'villager']).toContain(mine.data()!.role);
      const other = players.find((o) => o !== p)!;
      await expect(getDoc(doc(p.db, `rooms/${code}/roles/${other.uid}`))).rejects.toThrow();
      await expect(getDoc(doc(p.db, `rooms/${code}/narrator/view`))).rejects.toThrow();
    }
    const panel = (await getDoc(doc(narrator.db, `rooms/${code}/narrator/view`))).data()!;
    expect(Object.keys(panel.roles)).toHaveLength(8);

    // Only real players still need to acknowledge (fakes did at once).
    for (const p of players) await p.call('gameAction', { code, action: { type: 'ackRole' } });
    await narrator.call('gameAction', { code, action: { type: 'startGame' } });
    game = await roomGame(host, code);
    expect(game.phase).toBe('night');
    expect(game.players.every((p: { role: unknown }) => p.role === null)).toBe(true);

    // Players cannot act for the narrator.
    await expect(players[0].call('gameAction', { code, action: { type: 'nightConfirm' } })).rejects.toMatchObject({
      details: { reason: 'notNarrator' },
    });

    // Play nights and votes until someone wins (votes all None → nobody voted out; nights kill).
    for (let guard = 0; guard < 100 && game.phase !== 'gameOver'; guard++) {
      const view = (await getDoc(doc(narrator.db, `rooms/${code}/narrator/view`))).data()!;
      if (game.phase === 'night') {
        const step = view.night.step as 'mafia' | 'doctor' | 'detective';
        if (view.night.picks[step] === null) {
          const alive = game.players.filter((p: { alive: boolean }) => p.alive).map((p: { id: string }) => p.id);
          const ok = alive.filter((id: string) =>
            step === 'mafia' ? view.roles[id] !== 'mafia' : step === 'detective' ? view.roles[id] !== 'detective' : true,
          );
          // Doctor saves someone other than the target so the night has a death.
          const choice = step === 'doctor' ? (ok.find((id: string) => id !== view.night.picks.mafia) ?? ok[0]) : ok[0];
          await narrator.call('gameAction', { code, action: { type: 'nightPick', targetId: choice } });
        } else {
          await narrator.call('gameAction', { code, action: { type: 'nightConfirm' } });
        }
      } else if (game.phase === 'dawn') {
        await narrator.call('gameAction', { code, action: { type: 'announceDawn' } });
      } else if (game.phase === 'discussion') {
        expect(game.discussion.remainingMs).toBeGreaterThan(170_000);
        await narrator.call('gameAction', { code, action: { type: 'startVoting' } });
      } else if (game.phase === 'vote') {
        for (const p of players) {
          const me = game.players.find((x: { id: string }) => x.id === p.uid);
          if (me?.alive) await p.call('gameAction', { code, action: { type: 'castVote', choice: 'none' } });
        }
        game = await roomGame(host, code);
        expect(game.phase).toBe('vote'); // everyone voted, but the vote runs the full 30 s
        // Wait it out like real phones do: each says "still here" every 15 s (else the game pauses).
        for (let left = game.vote.remainingMs + 500; left > 0; left -= 10_000) {
          await new Promise((r) => setTimeout(r, Math.min(left, 10_000)));
          await Promise.all(phones.map((p) => p.call('gameAction', { code, action: { type: 'heartbeat' } })));
        }
        await narrator.call('gameAction', { code, action: { type: 'tick' } }); // what the narrator's phone sends at 0
        game = await roomGame(host, code);
        expect(game.phase).toBe('reveal');
        expect(JSON.stringify(game)).not.toContain('ballots');
      } else if (game.phase === 'reveal') {
        await narrator.call('gameAction', { code, action: { type: 'revealVote' } });
      } else if (game.phase === 'roundStatus') {
        await narrator.call('gameAction', { code, action: { type: 'startNextNight' } });
      }
      game = await roomGame(host, code);
    }

    expect(game.phase).toBe('gameOver');
    expect(['town', 'mafia']).toContain(game.winner);
    expect(game.players.every((p: { role: unknown }) => p.role !== null)).toBe(true); // all revealed

    // Play again: host only; narrator and roles re-picked, same people.
    const notHost = phones.find((p) => p !== host)!;
    await expect(notHost.call('playAgain', { code })).rejects.toThrow();
    await host.call('playAgain', { code });
    const again = (await getDoc(doc(host.db, 'rooms', code))).data()!;
    expect(again.game.phase).toBe('roleCheck');
    expect(again.gameNumber).toBe(2);
    expect(again.members).toHaveLength(9);
  }, 480_000); // each vote runs a real 30 s

  it('Mode B deals roles only: one narrator, same role mix, narrator deals again any time', async () => {
    const host = await signedInPhone(uniqueName('mb'));
    const { code } = await host.call<{ code: string }>('createRoom', { mode: 'B' });
    await host.call('devAddFakePlayers', { code, count: 6 });
    await host.call('startGame', { code });
    let room = (await getDoc(doc(host.db, 'rooms', code))).data()!;
    expect(room.mode).toBe('B');
    expect(room.game.phase).toBe('roleCheck');
    expect(room.members.map((m: { id: string }) => m.id)).toContain(room.game.narratorId); // anyone, fakes too
    expect(room.game.players).toHaveLength(6); // 7 people: 1 narrator + 6 players
    await host.call('playAgain', { code }); // no game to finish first
    room = (await getDoc(doc(host.db, 'rooms', code))).data()!;
    expect(room.gameNumber).toBe(2);
    expect(room.game.phase).toBe('roleCheck');
  });

  it('only the host can start, and only with 5 people', async () => {
    const host = await signedInPhone(uniqueName('h5'));
    const other = await signedInPhone(uniqueName('o5'));
    const { code } = await host.call<{ code: string }>('createRoom');
    await other.call('joinRoom', { code });
    await expect(host.call('startGame', { code })).rejects.toMatchObject({ details: { reason: 'notEnoughPeople' } });
    await host.call('devAddFakePlayers', { code, count: 3 });
    await expect(other.call('startGame', { code })).rejects.toMatchObject({ details: { reason: 'notHost' } });
    await host.call('startGame', { code });
    // Nobody can join after Start.
    const late = await signedInPhone(uniqueName('late'));
    await expect(late.call('joinRoom', { code })).rejects.toMatchObject({ details: { reason: 'started' } });
  });
});

describe('Edge cases on the emulators', () => {
  it('"back to your game": the server remembers my room privately; leaving clears it', async () => {
    const host = await signedInPhone(uniqueName('bk'));
    const other = await signedInPhone(uniqueName('bo'));
    const { code } = await host.call<{ code: string }>('createRoom');
    await other.call('joinRoom', { code });
    expect((await getDoc(doc(other.db, `users/${other.uid}/private/current`))).data()).toEqual({ code });
    // Private: nobody else can read it.
    await expect(getDoc(doc(host.db, `users/${other.uid}/private/current`))).rejects.toThrow();

    await host.call('devAddFakePlayers', { code, count: 4 });
    await host.call('startGame', { code });
    const game = (await getDoc(doc(host.db, 'rooms', code))).data()!.game;
    const player = game.narratorId === host.uid ? other : host;
    await player.call('gameAction', { code, action: { type: 'leave' } });
    expect((await getDoc(doc(player.db, `users/${player.uid}/private/current`))).exists()).toBe(false);
    const after = (await getDoc(doc(player.db, 'rooms', code))).data()!.game;
    const me = after.players.find((p: { id: string }) => p.id === player.uid);
    expect(me).toMatchObject({ alive: false, deathCause: 'left', role: null }); // role stays hidden
  });

  it('heartbeats do not rewrite the room for everyone', async () => {
    const host = await signedInPhone(uniqueName('hb'));
    const { code } = await host.call<{ code: string }>('createRoom');
    await host.call('devAddFakePlayers', { code, count: 4 });
    await host.call('startGame', { code });
    const before = (await getDoc(doc(host.db, 'rooms', code))).data()!.updatedAt;
    const res = await host.call<{ changed: boolean }>('gameAction', { code, action: { type: 'heartbeat' } });
    expect(res.changed).toBe(false);
    expect((await getDoc(doc(host.db, 'rooms', code))).data()!.updatedAt).toBe(before);
  });

  it('fake players and the dev narrator option only exist in the emulator build', async () => {
    // (In production FUNCTIONS_EMULATOR is unset, so devAddFakePlayers refuses and devNarratorId is ignored.)
    const host = await signedInPhone(uniqueName('dv'));
    const { code } = await host.call<{ code: string }>('createRoom');
    await expect(host.call('devAddFakePlayers', { code, count: 2 })).resolves.toBeTruthy();
  });
});
