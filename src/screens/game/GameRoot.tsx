import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { Loading } from '@/components';
import { useNarratorView, useRoleDoc } from '@/firebase/hooks';
import { HEARTBEAT_MS } from '@/game/config';
import type { RoomDoc } from '@/game/model';
import { notify } from '@/ui/confirm';
import { GameProvider, useGame } from './context';
import { GameOver } from './GameOver';
import { Dawn, DealtRoles, Discussion, NarratorReveal, NightStep, RoleCheck, RoundStatus, Votes } from './narrator';
import { LeftGame } from './LeaveChip';
import { PausedOverlay } from './PausedOverlay';
import { DawnAnnouncement, DayDiscussion, Night, RoleReveal, Vote, VoteLocked, VoteResult, YouAreOut } from './player';

// Picks the screen for this phone from the live game. Narrator: N1–N10. Players: P3–P11.

const ANNOUNCEMENT_MS = 7000; // P5 shows the dawn news, then moves on to the discussion (P6)

export function GameRoot({ room, uid }: { room: RoomDoc; uid: string }) {
  const game = room.game;
  const isNarrator = game?.narratorId === uid;
  const role = useRoleDoc(room.code, uid);
  const narrator = useNarratorView(room.code, isNarrator);
  if (!game) return <Loading />;
  return (
    <GameProvider
      code={room.code}
      room={room}
      game={game}
      uid={uid}
      me={game.players.find((p) => p.id === uid) ?? null}
      isNarrator={isNarrator}
      isHost={room.hostId === uid}
      role={role}
      narrator={narrator}
    >
      <Ticker />
      <Heartbeat />
      <HostNotice />
      {isNarrator ? <NarratorScreens /> : <PlayerScreens />}
    </GameProvider>
  );
}

/** When the vote timer runs out, ask the server to close it (the server checks the time itself). */
function Ticker() {
  const { game, isNarrator, act } = useGame();
  const v = game.vote;
  useEffect(() => {
    if (game.phase !== 'vote' || !v?.running) return;
    // The narrator's phone asks first; everyone else is a fallback if the narrator is slow.
    const delay = v.remainingMs + (isNarrator ? 300 : 3000);
    const id = setTimeout(() => act({ type: 'tick' }), delay);
    return () => clearTimeout(id);
  }, [game.phase, v?.running, v?.remainingMs, game.stampedAt, isNarrator, act]);
  return null;
}

/**
 * "Still here" every 15 s (and when the app comes back to the front). A phone that goes quiet is
 * marked offline by the server; a silent narrator pauses the game. The narrator's screen stays awake.
 */
function Heartbeat() {
  const { act, isNarrator, game } = useGame();
  const over = game.phase === 'gameOver';
  useEffect(() => {
    if (over) return;
    const beat = () => act({ type: 'heartbeat' });
    beat();
    const id = setInterval(beat, HEARTBEAT_MS);
    const sub = AppState.addEventListener('change', (state) => state === 'active' && beat());
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [act, over]);
  useEffect(() => {
    if (!isNarrator || over) return;
    activateKeepAwakeAsync('narrator').catch(() => undefined);
    return () => {
      // Throws if the lock never switched on (e.g. a browser without it), so ignore that.
      Promise.resolve()
        .then(() => deactivateKeepAwake('narrator'))
        .catch(() => undefined);
    };
  }, [isNarrator, over]);
  return null;
}

/** Host handover notice: the room passes to you when the host has been offline 2 minutes. */
function HostNotice() {
  const { room, uid } = useGame();
  const previous = useRef(room.hostId);
  useEffect(() => {
    if (previous.current !== room.hostId && room.hostId === uid) {
      notify('You are now the host', 'The host went offline, so the room passed to you. You can start a new game when this one ends.');
    }
    previous.current = room.hostId;
  }, [room.hostId, uid]);
  return null;
}

function NarratorScreens() {
  const { game, room } = useGame();
  const [opened, setOpened] = useState<number | null>(null); // game number whose control panel is open
  const [hideRoles, setHideRoles] = useState(false);
  const chrome = { hideRoles, setHideRoles };
  const gameNo = room.gameNumber ?? 1;

  if (game.phase === 'gameOver') return <GameOver />;
  if (opened !== gameNo && game.phase === 'roleCheck') return <NarratorReveal onOpen={() => setOpened(gameNo)} />;
  if (room.mode === 'B') return <DealtRoles />; // deal only: roles, nothing else
  switch (game.phase) {
    case 'roleCheck':
      return <RoleCheck {...chrome} />;
    case 'night':
      return <NightStep {...chrome} />;
    case 'dawn':
      return <Dawn {...chrome} />;
    case 'discussion':
      return <Discussion {...chrome} />;
    case 'vote':
    case 'reveal':
      return <Votes {...chrome} />;
    case 'roundStatus':
      return <RoundStatus {...chrome} />;
  }
}

/** Shows an announcement for a few seconds the first time this phone sees it. */
function useFreshAnnouncement(key: string | null): boolean {
  const [shownUntil, setShownUntil] = useState<{ key: string; until: number } | null>(null);
  const [, force] = useState(0);
  const seen = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!key || seen.current.has(key)) return;
    seen.current.add(key);
    setShownUntil({ key, until: Date.now() + ANNOUNCEMENT_MS });
    const id = setTimeout(() => force((n) => n + 1), ANNOUNCEMENT_MS + 50);
    return () => clearTimeout(id);
  }, [key]);
  return !!key && shownUntil?.key === key && Date.now() < shownUntil.until;
}

function PlayerScreens() {
  const { game, me, role, room } = useGame();
  const dawnKey = game.phase === 'discussion' && game.announcement ? `dawn-${game.round}` : null;
  const freshDawn = useFreshAnnouncement(dawnKey);

  if (!me || role === undefined) return <Loading />;

  let screen: ReactNode;
  if (me.deathCause === 'left' && game.phase !== 'gameOver') return <LeftGame />;
  if (game.phase === 'gameOver') screen = <GameOver />;
  else if (room.mode === 'B') return <RoleReveal />; // deal only: no pause, no game screens
  else if (game.phase === 'roleCheck') screen = <RoleReveal />;
  // The night victim first sees the dawn news, then "You are out"; the voted-out player sees P9 first.
  else if (!me.alive && !(freshDawn && me.deathCause === 'night' && me.deathRound === game.round) && !(game.phase === 'roundStatus' && me.deathRound === game.round && me.deathCause === 'vote'))
    screen = <YouAreOut />;
  else if (game.phase === 'night' || game.phase === 'dawn') screen = <Night />;
  else if (game.phase === 'discussion') screen = freshDawn ? <DawnAnnouncement /> : <DayDiscussion />;
  else if (game.phase === 'vote') screen = role?.myVote ? <VoteLocked /> : <Vote />;
  else if (game.phase === 'reveal') screen = <VoteLocked />;
  else screen = <VoteResult />;

  return (
    <View style={styles.fill}>
      {screen}
      <PausedOverlay />
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
