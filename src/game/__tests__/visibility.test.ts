import { describe, expect, it } from 'vitest';
import { dawnAnnouncement, lastWordsFor, LAST_WORDS, ROLE_NAME, voteAnnouncement, winAnnouncement, winCheckLine } from '../copy';
import { seededRng } from '../rng';
import { extendTimer, isExpired, pauseTimer, resumeTimer, startTimer, timeLeft } from '../timer';
import { canSeeRole, visibleRoles } from '../visibility';
import { N, playNight, run, toNight1 } from './fixture';

describe('Who sees which role', () => {
  const s = toNight1();

  it('a player sees only their own role', () => {
    expect(visibleRoles(s, 'zoya')).toEqual({ zoya: 'villager' });
    expect(visibleRoles(s, 'isha')).toEqual({ isha: 'doctor' });
  });

  it('Mafia also see their partners', () => {
    expect(visibleRoles(s, 'aarav')).toEqual({ aarav: 'mafia', tara: 'mafia' });
  });

  it('the narrator sees every role', () => {
    expect(Object.keys(visibleRoles(s, N))).toHaveLength(9);
  });

  it('a death reveals the role to everyone', () => {
    const after = playNight(s, 'zoya', 'isha', 'aarav');
    expect(canSeeRole(after, 'kabir', 'zoya')).toBe(true);
  });

  it('eliminated players see only their own role on top of what is public', () => {
    const dead = playNight(toNight1(), 'kabir', 'isha', 'aarav');
    expect(visibleRoles(dead, 'kabir')).toEqual({ kabir: 'villager' });
  });

  it('a Mafia who dies loses the partner view', () => {
    let st = toNight1();
    st.players = st.players.map((p) => (p.id === 'tara' ? { ...p, alive: false, death: { cause: 'vote', round: 1 } } : p));
    // Tara's role is public now (revealed on death); Aarav is hidden from her.
    expect(canSeeRole(st, 'tara', 'aarav')).toBe(false);
    st = run(st, []);
    expect(canSeeRole(st, 'zoya', 'tara')).toBe(true);
  });
});

describe('Copy', () => {
  it('last words never mention a role', () => {
    const roleWords = Object.values(ROLE_NAME).map((r) => r.toLowerCase());
    for (const line of [...LAST_WORDS.night, ...LAST_WORDS.vote, LAST_WORDS.saved, LAST_WORDS.noElimination]) {
      for (const r of roleWords.filter((w) => w !== 'mafia')) expect(line.toLowerCase()).not.toContain(r);
    }
    expect(LAST_WORDS.night).toContain(lastWordsFor('night', seededRng(1)));
    expect(LAST_WORDS.vote).toContain(lastWordsFor('vote', seededRng(1)));
  });

  it('dawn and vote announcements read like the Announcement Card', () => {
    const night = playNight(toNight1(), 'zoya', 'isha', 'aarav');
    expect(dawnAnnouncement(night.lastNight!, night.players)).toMatchObject({
      kind: 'death',
      eyebrow: 'Dawn · Night 1',
      title: 'Zoya was killed',
      detail: 'Role: Villager',
    });
    const saved = playNight(toNight1(), 'zoya', 'zoya', 'aarav');
    expect(dawnAnnouncement(saved.lastNight!, saved.players)).toMatchObject({
      kind: 'saved',
      title: 'No one died tonight',
      detail: 'Everyone made it through the night.',
    });
    expect(voteAnnouncement({ eliminatedId: 'aarav', round: 1, lastWords: 'The room chose.' }, night.players)).toMatchObject({
      eyebrow: 'Day 1 · Vote result',
      title: 'Aarav is eliminated',
      detail: 'Role: Mafia',
    });
    expect(voteAnnouncement({ eliminatedId: null, round: 2, lastWords: LAST_WORDS.noElimination }, night.players)).toMatchObject({
      title: 'No one was eliminated',
      detail: 'Tie, or fewer than 2 votes.',
    });
    expect(winAnnouncement('town').title).toBe('Town wins');
    expect(winAnnouncement('mafia').detail).toBe('The Mafia now match the Town.');
  });

  it('N9 win check line', () => {
    expect(winCheckLine({ mafia: 1, town: 4 }, null)).toBe('Mafia 1 vs Town 4. The game continues.');
  });
});

describe('Timer', () => {
  it('counts down, pauses, resumes and extends', () => {
    let t = startTimer(30_000, 0);
    expect(timeLeft(t, 10_000)).toBe(20_000);
    t = pauseTimer(t, 10_000);
    expect(timeLeft(t, 99_000)).toBe(20_000);
    t = resumeTimer(t, 100_000);
    expect(timeLeft(t, 110_000)).toBe(10_000);
    t = extendTimer(t, 60_000, 110_000);
    expect(timeLeft(t, 110_000)).toBe(70_000);
    expect(isExpired(t, 180_000)).toBe(true);
    expect(timeLeft(t, 999_999)).toBe(0);
  });
});
