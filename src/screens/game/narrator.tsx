import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  AnnouncementCard,
  Button,
  InstructionCard,
  Notice,
  PlayerRow,
  RoleCard,
  Screen,
  Spacer,
  StepBar,
  Text,
  Timer,
  TopBar,
  VoteProgress,
  type NarratorActions,
} from '@/components';
import { useCountdown } from '@/firebase/hooks';
import { ROLE_CHECK_GRACE_MS, MAX_EXTENSIONS, DISCUSSION_MS } from '@/game/config';
import { KEY_STRINGS, LAST_WORDS, NIGHT_SCRIPT, ROLE_NAME, narratorDawnDetail, voteAnnouncement, winCheckLine } from '@/game/copy';
import { NIGHT_ORDER, stepStates, type NightRole } from '@/game/night';
import type { Player } from '@/game/types';
import { NONE } from '@/game/vote';
import { colors, radius, spacing } from '@/theme';
import { useGame } from './context';
import { deathDetail, nameOf, statusOf, totalsLine } from './helpers';
import { LeaveChip } from './LeaveChip';
import { DealAgain } from './player';

// Narrator control panel: N1–N9. Every screen listing roles has Hide roles; all have Pause.

export type NarratorChrome = { hideRoles: boolean; setHideRoles: (v: boolean) => void };

// Figma shows Hide roles on every narrator screen, so it is always there.
function useNarratorActions({ hideRoles, setHideRoles }: NarratorChrome): NarratorActions {
  const { game, act } = useGame();
  return {
    paused: !!game.pause,
    onTogglePause: () => act({ type: game.pause ? 'resume' : 'pause' }),
    rolesHidden: hideRoles,
    onToggleHideRoles: () => setHideRoles(!hideRoles),
  };
}

function PausedNotice() {
  const { game } = useGame();
  if (!game.pause) return null;
  return <Notice title="Paused" body="Timers are stopped. Tap Resume to carry on." />;
}

/** Engine-shaped players (for copy helpers) from the public view + the narrator's roles. */
function usePlayers(): Player[] {
  const { game, narrator } = useGame();
  return game.players.map((p) => ({
    id: p.id,
    name: p.name,
    role: narrator?.roles[p.id] ?? 'villager',
    alive: p.alive,
    death: p.deathCause ? { cause: p.deathCause, round: p.deathRound ?? 0 } : null,
  }));
}

// N1 · Narrator reveal --------------------------------------------------------------------------

export function NarratorReveal({ onOpen }: { onOpen: () => void }) {
  const { room, code } = useGame();
  const dealOnly = room.mode === 'B';
  const [revealed, setRevealed] = useState(false); // starts hidden, like the players' card
  return (
    <Screen gap={14}>
      <TopBar
        eyebrow={`Game ${room.gameNumber ?? 1} · Room ${code}`}
        title={revealed ? 'You were picked' : 'Your role'}
        onBack={() => router.replace('/home')} // Home, still in the game ("Back to room" returns)
      />
      <Pressable onPress={() => setRevealed(true)} disabled={revealed} accessibilityRole="button" accessibilityLabel="Tap to reveal your role">
        {revealed ? <RoleCard role="narrator" /> : <RoleCard role="hidden" hiddenLabel="Tap to reveal" />}
      </Pressable>
      <Spacer />
      {revealed ? (
        <Button label={dealOnly ? "See everyone's role" : 'Open control panel'} onPress={onOpen} />
      ) : (
        <Button label="Tap to reveal" variant="secondary" onPress={() => setRevealed(true)} />
      )}
    </Screen>
  );
}

// Mode B · Everyone's role (the narrator runs the rest of the game out loud, no phones) ---------------

export function DealtRoles() {
  const { game, narrator, room, code } = useGame();
  const players = game.players.filter((p) => p.deathCause !== 'left');
  return (
    <Screen scroll gap={14}>
      <TopBar
        eyebrow={`Game ${room.gameNumber ?? 1} · Room ${code}`}
        title="Everyone's role"
        subtitle="Only you see this. Run the game out loud."
        onBack={() => router.replace('/home')} // Home, still in the room ("Back to room" returns)
        right={<LeaveChip />}
      />
      {players.map((p) => (
        <PlayerRow key={p.id} name={p.name} role={narrator?.roles[p.id]} />
      ))}
      <Spacer />
      <DealAgain />
    </Screen>
  );
}

// N2 · Role check ---------------------------------------------------------------------------------

export function RoleCheck(chrome: NarratorChrome) {
  const { game, narrator, act, busy } = useGame();
  const actions = useNarratorActions(chrome);
  const [now, setNow] = useState(Date.now());
  const [received] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const players = game.players.filter((p) => p.deathCause !== 'left');
  const seen = players.filter((p) => game.acknowledged.includes(p.id)).length;
  const elapsed = game.stampedAt - game.roleCheckStartedAt + (now - received);
  const canStart = seen === players.length || elapsed >= ROLE_CHECK_GRACE_MS;

  return (
    <Screen scroll gap={14}>
      <TopBar eyebrow="Before Night 1" title="Role check" subtitle="Players confirm their role on their phones." narrator={actions} />
      <PausedNotice />
      <VoteProgress label="Seen" done={seen} total={players.length} />
      {players.map((p) => (
        <PlayerRow
          key={p.id}
          name={p.name}
          role={chrome.hideRoles ? undefined : narrator?.roles[p.id]}
          status={game.acknowledged.includes(p.id) ? 'seen' : 'waiting'}
        />
      ))}
      <Text variant="bodyS" color={colors.text.muted}>
        You can start after 30 s if someone has not confirmed.
      </Text>
      <Spacer />
      <Button label="Start game" onPress={() => act({ type: 'startGame' })} disabled={busy || !canStart || !!game.pause} />
    </Screen>
  );
}

// N3–N5 · Night steps -----------------------------------------------------------------------------

const STEP_TITLE: Record<NightRole, [string, string]> = {
  mafia: ['The Mafia', 'The Mafia'],
  doctor: ['The Doctor', 'The Doctors'],
  detective: ['The Detective', 'The Detectives'],
};

function script(step: NightRole, plural: boolean): string {
  const s = NIGHT_SCRIPT[step];
  // 13+ players: both Doctors (or Detectives) wake together.
  const wake = plural ? s.wake.replace(/^Doctor,/, 'Doctors,').replace(/^Detective,/, 'Detectives,') : s.wake;
  const sleep = plural ? s.sleep.replace(/^Doctor,/, 'Doctors,').replace(/^Detective,/, 'Detectives,') : s.sleep;
  return `"${wake}"\n…\n"${sleep}"`;
}

const STEP_HINT: Record<NightRole, string | undefined> = {
  mafia: KEY_STRINGS.nightHint,
  doctor: 'Tap who they point at. Say the last line, then confirm. Back returns to step 1.',
  detective: undefined,
};

export function NightStep(chrome: NarratorChrome) {
  const { game, narrator, act, busy } = useGame();
  const actions = useNarratorActions(chrome);
  const draft = narrator?.night;
  if (!draft) return <Screen glow="red"><TopBar title="Night" eyebrow={`Night ${game.round}`} /></Screen>;

  const step = draft.step;
  const roles = narrator.roles;
  const alive = game.players.filter((p) => p.alive);
  const sameRole = alive.filter((p) => roles[p.id] === step).length;
  const states = stepStates(draft);
  const active = NIGHT_ORDER.filter((r) => !draft.skipped.includes(r));
  const next = active[active.indexOf(step) + 1];
  const pick = draft.picks[step];
  const target = draft.picks.mafia;
  const doctorSkipped = draft.skipped.includes('doctor');
  const saved = doctorSkipped ? null : draft.picks.doctor;

  const primary = !next ? 'Finish night' : step === 'mafia' ? `Confirm and go to step ${NIGHT_ORDER.indexOf(next) + 1}` : 'Confirm';

  function rowFor(p: (typeof alive)[number]) {
    const role = chrome.hideRoles ? undefined : roles[p.id];
    const selected = pick === p.id;
    if (step === 'mafia') {
      if (roles[p.id] === 'mafia') return <PlayerRow key={p.id} name={p.name} detail="Partner · not selectable" role={role} status="alive" state="disabled" />;
      return (
        <PlayerRow
          key={p.id}
          name={p.name}
          detail={selected ? 'Picked by the Mafia' : undefined}
          role={role}
          status={selected ? 'target' : 'alive'}
          state={selected ? 'selected' : 'default'}
          onPress={() => act({ type: 'nightPick', targetId: p.id })}
        />
      );
    }
    if (step === 'doctor') {
      const isTarget = target === p.id;
      return (
        <PlayerRow
          key={p.id}
          name={p.name}
          detail={isTarget ? (selected ? 'Mafia target · Doctor' : 'Mafia target') : selected ? "Doctor's pick" : undefined}
          role={role}
          status={selected ? 'saved' : isTarget ? 'target' : 'alive'}
          state={selected ? 'selected' : 'default'}
          onPress={() => act({ type: 'nightPick', targetId: p.id })}
        />
      );
    }
    // Detective
    if (roles[p.id] === 'detective') {
      return <PlayerRow key={p.id} name={p.name} detail="Cannot check themselves" role={role} status="alive" state="disabled" />;
    }
    const isTarget = target === p.id;
    const savedTarget = isTarget && saved === p.id;
    return (
      <PlayerRow
        key={p.id}
        name={p.name}
        detail={selected ? 'Checked by the Detective' : isTarget ? (savedTarget ? 'Target · saved' : 'Target') : undefined}
        role={role}
        status={selected ? 'checked' : savedTarget ? 'saved' : isTarget ? 'target' : 'alive'}
        state={selected ? 'selected' : 'default'}
        onPress={() => act({ type: 'nightPick', targetId: p.id })}
      />
    );
  }

  const isMafia = draft.checkedIsMafia;
  return (
    <Screen scroll glow="red" gap={14}>
      <TopBar
        eyebrow={`Night ${game.round} · Step ${NIGHT_ORDER.indexOf(step) + 1} of 3`}
        title={STEP_TITLE[step][sameRole > 1 ? 1 : 0]}
        narrator={actions}
      />
      <StepBar steps={NIGHT_ORDER.map((r) => ({ name: ROLE_NAME[r], state: states[r] }))} />
      <PausedNotice />
      <InstructionCard quote={script(step, sameRole > 1)} hint={STEP_HINT[step]} />
      {alive.map(rowFor)}
      {step === 'detective' && pick ? (
        <View style={[styles.result, isMafia ? styles.resultYes : styles.resultNo]}>
          <Text variant="labelS" color={isMafia ? colors.role.mafia : colors.role.doctor}>
            Detective result
          </Text>
          <Text variant="displayM">{`${nameOf(game.players, pick)} is ${isMafia ? 'Mafia' : 'not Mafia'}`}</Text>
          <Text variant="bodyS" color={colors.text.secondary}>
            {isMafia
              ? 'Show the Detective YES (thumbs up), then say the last line.'
              : 'Show the Detective NO (thumbs down), then say the last line.'}
          </Text>
        </View>
      ) : null}
      {step === 'mafia' ? (
        <Button label={primary} onPress={() => act({ type: 'nightConfirm' })} disabled={busy || !pick || !!game.pause} />
      ) : (
        <View style={styles.buttons}>
          <View style={styles.back}>
            <Button label="Back" variant="secondary" onPress={() => act({ type: 'nightBack' })} disabled={busy || !!game.pause} />
          </View>
          <View style={styles.fill}>
            <Button label={primary} onPress={() => act({ type: 'nightConfirm' })} disabled={busy || !pick || !!game.pause} />
          </View>
        </View>
      )}
    </Screen>
  );
}

// N6 · Dawn ---------------------------------------------------------------------------------------

export function Dawn(chrome: NarratorChrome) {
  const { game, narrator, act, busy } = useGame();
  const actions = useNarratorActions(chrome);
  const players = usePlayers();
  const result = narrator?.lastNight;
  const alive = game.players.filter((p) => p.alive);
  const anyoneOut = game.players.some((p) => !p.alive);

  return (
    <Screen scroll gap={14}>
      <TopBar eyebrow={`Dawn · Night ${game.round}`} title="Morning" subtitle="Say aloud: everyone wake up." narrator={actions} />
      <PausedNotice />
      {result ? (
        result.killedId ? (
          <AnnouncementCard
            kind="death"
            eyebrow={`Dawn · Night ${result.round}`}
            title={`${nameOf(game.players, result.killedId)} was killed`}
            detail={`Role: ${ROLE_NAME[narrator.roles[result.killedId]]}`}
            lastWords={result.lastWords}
          />
        ) : (
          <AnnouncementCard
            kind="saved"
            eyebrow={`Dawn · Night ${result.round}`}
            title="No one died tonight"
            detail={narratorDawnDetail(result, players) ?? ''}
            lastWords={result.lastWords}
          />
        )
      ) : null}
      <Text variant="headingS">{anyoneOut ? `Who is left (${alive.length})` : `Everyone is alive (${alive.length})`}</Text>
      {alive.map((p) => (
        <PlayerRow key={p.id} name={p.name} role={chrome.hideRoles ? undefined : narrator?.roles[p.id]} status="alive" />
      ))}
      <Button label="Announce to all" onPress={() => act({ type: 'announceDawn' })} disabled={busy || !!game.pause} />
    </Screen>
  );
}

// N7 · Discussion ---------------------------------------------------------------------------------

export function Discussion(chrome: NarratorChrome) {
  const { game, act, busy } = useGame();
  const actions = useNarratorActions(chrome);
  const d = game.discussion;
  const seconds = useCountdown(d, game.stampedAt);
  const used = d?.extensionsUsed ?? 0;
  const left = MAX_EXTENSIONS - used;
  const alive = game.players.filter((p) => p.alive).length;

  return (
    <Screen gap={14}>
      <TopBar eyebrow={`Day ${game.round}`} title="Discussion" subtitle={`Players talk in person. ${alive} alive.`} narrator={actions} />
      <PausedNotice />
      <Timer
        label="Discussion"
        secondsLeft={seconds}
        progress={d ? (seconds * 1000) / Math.max(d.totalMs, DISCUSSION_MS) : 0}
        caption={`+1 min used: ${used} of ${MAX_EXTENSIONS}`}
      />
      <Button label={`+1 min (${left} left)`} variant="secondary" onPress={() => act({ type: 'addMinute' })} disabled={busy || left <= 0 || !!game.pause} />
      <Text variant="bodyS" color={colors.text.muted} align="center">
        The cap of 3 resets every round.
      </Text>
      <Spacer />
      <Button label="Start voting (30 s)" onPress={() => act({ type: 'startVoting' })} disabled={busy || !!game.pause} />
    </Screen>
  );
}

// N8 · Vote results -------------------------------------------------------------------------------

export function Votes(chrome: NarratorChrome) {
  const { game, narrator, act, busy } = useGame();
  const actions = useNarratorActions(chrome);
  const players = usePlayers();
  const seconds = useCountdown(game.vote, game.stampedAt);
  const closed = game.phase === 'reveal';
  const ballots = (closed ? narrator?.lastVote?.ballots : narrator?.ballots) ?? {};
  const voters = game.players.filter((p) => p.alive);
  const voted = closed ? voters.length : Object.keys(ballots).length;
  const result = closed ? narrator?.lastVote : null;
  const preview = result ? voteAnnouncement(result, players) : null;

  return (
    <Screen scroll gap={14}>
      <TopBar eyebrow={`Day ${game.round} · Voting`} title="Votes" subtitle="Only you can see who voted whom." narrator={actions} />
      <PausedNotice />
      <Timer label="Closes in" size="compact" secondsLeft={closed ? 0 : seconds} />
      <VoteProgress done={voted} total={voters.length} />
      {voters.map((p) => {
        const choice = ballots[p.id];
        const detail = choice === undefined ? 'Not voted yet' : choice === NONE ? 'voted None' : `voted ${nameOf(game.players, choice)}`;
        return <PlayerRow key={p.id} name={p.name} detail={detail} />;
      })}
      <Text variant="labelM" color={colors.highlight.default}>
        {totalsLine(game.players, ballots)}
      </Text>
      {preview ? (
        <AnnouncementCard
          kind={preview.kind}
          eyebrow="Result · only you see this"
          title={preview.title}
          detail={preview.detail}
          lastWords={preview.lastWords || LAST_WORDS.noElimination}
        />
      ) : null}
      <Button label="Reveal to all" onPress={() => act({ type: 'revealVote' })} disabled={busy || !closed || !!game.pause} />
    </Screen>
  );
}

// N9 · Round status -------------------------------------------------------------------------------

export function RoundStatus(chrome: NarratorChrome) {
  const { game, narrator, act, busy } = useGame();
  const actions = useNarratorActions(chrome);
  const counts = narrator?.teamCounts ?? { mafia: 0, town: 0 };

  return (
    <Screen scroll gap={14}>
      <TopBar eyebrow={`After Day ${game.round}`} title="Round status" narrator={actions} />
      <PausedNotice />
      <Notice title="Win check" body={winCheckLine(counts, narrator?.winnerIfChecked ?? null)} />
      {game.players.map((p) => (
        <PlayerRow
          key={p.id}
          name={p.name}
          detail={deathDetail(p)}
          role={chrome.hideRoles ? undefined : narrator?.roles[p.id]}
          status={statusOf(p)}
          state={p.alive ? 'default' : 'eliminated'}
        />
      ))}
      <Spacer />
      <Button label={`Start night ${game.round + 1}`} onPress={() => act({ type: 'startNextNight' })} disabled={busy || !!game.pause} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  buttons: { flexDirection: 'row', gap: 10 },
  back: { width: 128 },
  fill: { flex: 1 },
  result: { gap: spacing.xs, padding: spacing.lg, borderWidth: 1, borderRadius: radius.md },
  resultYes: { backgroundColor: colors.accent.subtle, borderColor: colors.border.accent },
  resultNo: { backgroundColor: colors.success.subtle, borderColor: colors.success.default },
});
