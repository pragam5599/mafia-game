import { dawnAnnouncement, voteAnnouncement, winAnnouncement, type Announcement } from './copy';
import type { GameState } from './engine';
import type { NarratorView, PublicGame, PublicPlayer, RoleDoc } from './model';
import { detectiveAnswer } from './night';
import { timeLeft, type Timer } from './timer';
import type { PlayerId } from './types';
import { eligibleVoters } from './vote';
import { checkWinner, teamCounts } from './win';

// Splits one engine state into what each phone may see (see model.ts). Pure, so it is unit-tested.

const publicTimer = (t: Timer, now: number) => ({ remainingMs: timeLeft(t, now), totalMs: t.totalMs, running: t.endsAt !== null });

function announcementFor(s: GameState): Announcement | null {
  if (s.phase === 'discussion' && s.lastNight?.round === s.round) return dawnAnnouncement(s.lastNight, s.players);
  if (s.phase === 'roundStatus' && s.lastVote) return voteAnnouncement(s.lastVote, s.players);
  if (s.phase === 'gameOver') {
    if (s.winner) return winAnnouncement(s.winner);
    return { kind: 'noElimination', eyebrow: 'Game over', title: 'Game ended', detail: 'The host ended the game.', lastWords: '' };
  }
  return null;
}

export function publicView(s: GameState, now: number): PublicGame {
  const over = s.phase === 'gameOver';
  const players: PublicPlayer[] = s.players.map((p) => ({
    id: p.id,
    name: p.name,
    alive: p.alive,
    deathCause: p.death?.cause ?? null,
    deathRound: p.death?.round ?? null,
    role: over || (!p.alive && p.death?.cause !== 'left') ? p.role : null,
  }));
  return {
    narratorId: s.narratorId,
    hostId: s.hostId,
    dead: s.players.filter((p) => !p.alive).map((p) => p.id),
    phase: s.phase,
    round: s.round,
    players,
    acknowledged: s.acknowledged,
    roleCheckStartedAt: s.roleCheckStartedAt,
    announcement: announcementFor(s),
    discussion: s.discussion ? { ...publicTimer(s.discussion.timer, now), extensionsUsed: s.discussion.extensionsUsed } : null,
    vote: s.vote
      ? { ...publicTimer(s.vote.timer, now), voted: Object.keys(s.vote.ballots).length, total: eligibleVoters(s.players).length }
      : null,
    pause: s.pause ? { reason: s.pause.reason, since: s.pause.since } : null,
    winner: s.winner,
    endedBy: s.endedBy,
    stampedAt: now,
  };
}

/** One doc per member: the narrator gets "narrator"; Mafia get their partners. */
export function roleDocs(s: GameState): Record<PlayerId, RoleDoc> {
  const out: Record<PlayerId, RoleDoc> = {};
  const mafia = s.players.filter((p) => p.role === 'mafia');
  for (const p of s.players) {
    out[p.id] = {
      role: p.role,
      partners: p.role === 'mafia' ? mafia.filter((m) => m.id !== p.id).map((m) => ({ id: m.id, name: m.name })) : [],
      myVote: s.vote?.ballots[p.id] ?? (s.phase === 'reveal' ? (s.lastVote?.ballots[p.id] ?? null) : null),
    };
  }
  out[s.narratorId] = { role: 'narrator', partners: [], myVote: null };
  return out;
}

export function narratorView(s: GameState, now: number): NarratorView {
  return {
    roles: Object.fromEntries(s.players.map((p) => [p.id, p.role])),
    night: s.night
      ? {
          ...s.night,
          checkedIsMafia: s.night.picks.detective ? detectiveAnswer(s.players, s.night.picks.detective) : null,
        }
      : null,
    lastNight: s.lastNight,
    ballots: s.vote ? { ...s.vote.ballots } : null,
    lastVote: s.lastVote,
    teamCounts: teamCounts(s.players),
    winnerIfChecked: checkWinner(s.players),
    stampedAt: now,
  };
}
