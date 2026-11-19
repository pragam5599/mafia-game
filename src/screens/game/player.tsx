import { router } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActionChip,
  AnnouncementCard,
  Button,
  ChatBubble,
  DividerDeco,
  Illustration,
  Input,
  PlayerRow,
  RoleCard,
  Screen,
  Spacer,
  Text,
  Timer,
  TopBar,
  VoteProgress,
  roleCardDescription,
} from '@/components';
import { api, readError } from '@/firebase/api';
import { db, usingEmulators } from '@/firebase/config';
import { useCountdown, useDeadChat } from '@/firebase/hooks';
import { KEY_STRINGS } from '@/game/copy';
import { NONE, type VoteChoice } from '@/game/vote';
import { colors, layout, radius, spacing, withAlpha } from '@/theme';
import { useGame } from './context';
import { LeaveChip } from './LeaveChip';
import { mafiaDescription, statusOf } from './helpers';
import { confirm, notify } from '@/ui/confirm';

// Player phones: P3–P10. (P11 lives in GameOver.tsx, shared with the narrator's N10.)

// P3a / P3 · Role reveal --------------------------------------------------------------------------

export function RoleReveal() {
  const { game, role, uid, act, busy, room, isHost } = useGame();
  const [holding, setHolding] = useState(false);
  const [seenOnce, setSeenOnce] = useState(false);
  const acked = game.acknowledged.includes(uid);
  const myRole = role && role.role !== 'narrator' ? role.role : null;
  const description = myRole === 'mafia' ? mafiaDescription(role!.partners.map((p) => p.name)) : myRole ? roleCardDescription[myRole] : undefined;

  // Hold shows the card; release hides it. A plain tap also counts as having peeked.
  const hold = {
    onPressIn: () => {
      setHolding(true);
      setSeenOnce(true);
    },
    onPressOut: () => setHolding(false),
    onPress: () => setSeenOnce(true),
    delayLongPress: 60_000,
    onLongPress: () => undefined,
  };

  return (
    <Screen gap={14} glow={seenOnce ? 'amber' : 'grey'}>
      <TopBar
        eyebrow={seenOnce ? 'Private' : 'Private · Role assigned'}
        title="Your role" right={<LeaveChip />}
        onBack={() => router.replace('/home')} // Home, still in the game ("Back to room" returns)
        subtitle={seenOnce ? 'Do not show anyone.' : 'Hold the card to see your role. Release to hide it.'}
      />
      <Pressable {...hold} accessibilityRole="button" accessibilityLabel="Hold to reveal your role">
        {holding && myRole ? (
          <RoleCard role={myRole} description={description} />
        ) : (
          <RoleCard role="hidden" description={seenOnce ? description : undefined} />
        )}
      </Pressable>
      <Spacer />
      {!seenOnce ? (
        <Pressable {...hold} style={styles.holdButton} accessibilityRole="button">
          <Text variant="labelM">Hold to reveal</Text>
        </Pressable>
      ) : room.mode === 'B' ? (
        // Test build only: a fake narrator cannot tap Deal again, so the host may do it for them.
        usingEmulators && isHost && game.narratorId.startsWith('fake_') ? <DealAgain dev /> : null
      ) : acked ? (
        <Button label="Waiting for the narrator" disabled />
      ) : (
        <Button label="I have seen my role" onPress={() => act({ type: 'ackRole' })} disabled={busy} />
      )}
    </Screen>
  );
}

/** Mode B, narrator only: new roles and a new narrator for the same people (after a confirm). */
export function DealAgain({ dev = false }: { dev?: boolean }) {
  const { code } = useGame();
  const [busy, setBusy] = useState(false);
  const deal = () =>
    confirm('Deal again?', 'Everyone gets a new role and a new narrator is picked.', 'Deal again', async () => {
      setBusy(true);
      try {
        await api.playAgain({ code });
      } catch (e) {
        notify('Could not deal again', readError(e).message);
      } finally {
        setBusy(false);
      }
    });
  if (dev) return <ActionChip label={busy ? 'Dealing…' : 'Dev: deal for fake narrator'} onPress={busy ? undefined : deal} />;
  return <Button label={busy ? 'Dealing…' : 'Deal again'} variant="secondary" disabled={busy} onPress={deal} />;
}

// P4 · Night (identical for everyone) -------------------------------------------------------------

export function Night() {
  const { game } = useGame();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.night}>
      <Illustration name="scene" style={styles.nightArt} />
      <LinearGradient colors={[colors.bg.base, withAlpha(colors.bg.base, 0)]} style={styles.nightFadeTop} />
      <LinearGradient
        colors={[withAlpha(colors.bg.base, 0), withAlpha(colors.bg.base, 0.85), colors.bg.base]}
        locations={[0, 0.55, 1]}
        style={styles.nightFadeBottom}
      />
      <View
        style={[
          styles.nightContent,
          { paddingTop: Math.max(layout.topInset, insets.top + spacing.md), paddingBottom: Math.max(insets.bottom, spacing['2xl']) },
        ]}
      >
        <View style={styles.centerChip}>
          <ActionChip label={`Night ${game.round}`} />
        </View>
        <Spacer />
        <Text variant="displayL" align="center">
          Night has fallen
        </Text>
        <Text variant="bodyM" color={colors.text.secondary} align="center">
          {KEY_STRINGS.nightPlayers}
        </Text>
        <Spacer />
        <Text variant="bodyS" color={colors.text.muted} align="center">
          This screen is the same for everyone, so no one is given away.
        </Text>
      </View>
    </View>
  );
}

// P5 / P9 · Announcements -------------------------------------------------------------------------

function WhoIsLeft() {
  const { game, uid } = useGame();
  const alive = game.players.filter((p) => p.alive);
  return (
    <>
      <Text variant="headingS">{`Who is left (${alive.length})`}</Text>
      {alive.map((p) => (
        <PlayerRow key={p.id} name={p.name} detail={p.id === uid ? 'You' : undefined} />
      ))}
    </>
  );
}

export function DawnAnnouncement() {
  const { game } = useGame();
  const a = game.announcement;
  return (
    <Screen scroll gap={14}>
      <TopBar eyebrow={`Dawn · Night ${game.round}`} title="Morning" right={<LeaveChip />} />
      {a ? <AnnouncementCard kind={a.kind} eyebrow={a.eyebrow} title={a.title} detail={a.detail} lastWords={a.lastWords} /> : null}
      <WhoIsLeft />
      <Text variant="bodyS" color={colors.text.muted} align="center">
        Waiting for the narrator to start the discussion.
      </Text>
    </Screen>
  );
}

export function VoteResult() {
  const { game } = useGame();
  const a = game.announcement;
  return (
    <Screen scroll gap={14}>
      <TopBar eyebrow={`Day ${game.round} · Result`} title="The vote" right={<LeaveChip />} />
      {a ? <AnnouncementCard kind={a.kind} eyebrow={a.eyebrow} title={a.title} detail={a.detail} lastWords={a.lastWords} /> : null}
      <WhoIsLeft />
      <Text variant="bodyS" color={colors.text.muted} align="center">
        {`Night ${game.round + 1} starts soon.`}
      </Text>
    </Screen>
  );
}

// P6 · Day discussion -----------------------------------------------------------------------------

export function DayDiscussion() {
  const { game, uid } = useGame();
  const d = game.discussion;
  const seconds = useCountdown(d, game.stampedAt);
  const alive = game.players.filter((p) => p.alive);
  return (
    <Screen gap={14}>
      <TopBar eyebrow={`Day ${game.round}`} title="Discussion" subtitle="Talk it out in person." right={<LeaveChip />} />
      <Timer label="Discussion" secondsLeft={seconds} progress={d ? (seconds * 1000) / d.totalMs : 0} caption="Set by the narrator" />
      <Text variant="headingS">{`Alive (${alive.length})`}</Text>
      <View style={styles.chips}>
        {alive.map((p) => (
          <ActionChip key={p.id} label={p.id === uid ? `${p.name} (you)` : p.name} />
        ))}
      </View>
      <Spacer />
      <Text variant="bodyS" color={colors.text.muted} align="center">
        Voting opens when the narrator starts it.
      </Text>
    </Screen>
  );
}

// P7 · Vote ---------------------------------------------------------------------------------------

export function Vote() {
  const { game, uid, act, busy } = useGame();
  const [choice, setChoice] = useState<VoteChoice | null>(null);
  const seconds = useCountdown(game.vote, game.stampedAt);
  const others = game.players.filter((p) => p.alive && p.id !== uid);

  return (
    <Screen scroll gap={14}>
      <TopBar eyebrow={`Day ${game.round} · Vote`} title="Who is Mafia?" right={<LeaveChip />} subtitle="Votes are secret. No vote in 30 s counts as None." />
      <Timer label="Vote ends" size="compact" secondsLeft={seconds} />
      <VoteProgress done={game.vote?.voted ?? 0} total={game.vote?.total ?? 0} />
      {others.map((p) => (
        <PlayerRow
          key={p.id}
          name={p.name}
          detail={choice === p.id ? 'Your vote' : undefined}
          state={choice === p.id ? 'selected' : 'default'}
          onPress={() => setChoice(p.id)}
        />
      ))}
      <PlayerRow
        name="None"
        initial="-"
        detail="Skip this vote"
        state={choice === NONE ? 'selected' : 'default'}
        onPress={() => setChoice(NONE)}
      />
      <Spacer />
      <Button
        label="Confirm vote"
        onPress={() => choice && act({ type: 'castVote', choice })}
        disabled={busy || choice === null || !!game.pause || seconds <= 0}
      />
    </Screen>
  );
}

// P8 · Vote locked --------------------------------------------------------------------------------

export function VoteLocked() {
  const { game } = useGame();
  const seconds = useCountdown(game.vote, game.stampedAt);
  const open = game.phase === 'vote';
  return (
    <Screen gap={14} contentStyle={styles.center}>
      <Spacer />
      <Text variant="displayL" align="center">
        Vote locked
      </Text>
      <Text variant="bodyM" color={colors.text.secondary} align="center">
        {open ? 'Your vote is in. Waiting for everyone, or the timer.' : 'Voting is closed. The narrator will reveal the result.'}
      </Text>
      {open ? <Timer label="Vote ends" size="compact" secondsLeft={seconds} /> : null}
      {open ? <VoteProgress done={game.vote?.voted ?? 0} total={game.vote?.total ?? 0} /> : null}
      <Text variant="bodyS" color={colors.text.muted} align="center">
        Votes are secret. Only the narrator sees who voted whom.
      </Text>
      <Spacer />
    </Screen>
  );
}

// P10 · You are out (+ dead chat) -----------------------------------------------------------------

export function YouAreOut() {
  const { game, uid, role, code, room } = useGame();
  const me = game.players.find((p) => p.id === uid)!;
  const messages = useDeadChat(code, true);
  const [text, setText] = useState('');
  const list = useRef<ScrollView>(null);
  const myName = room.members.find((m) => m.id === uid)?.name ?? me.name;
  const when = me.deathCause === 'night' ? `Night ${me.deathRound}` : `Day ${me.deathRound}`;

  useEffect(() => {
    list.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  async function send() {
    const t = text.trim();
    if (!t) return;
    setText('');
    await addDoc(collection(db, `rooms/${code}/deadChat`), { authorId: uid, authorName: myName, text: t.slice(0, 300), sentAt: serverTimestamp() });
  }

  return (
    <Screen gap={14} avoidKeyboard>
      <TopBar eyebrow={`Eliminated · ${when}`} title="You are out" right={<LeaveChip />} subtitle="Only you see your role. Only the dead see this chat." />
      <PlayerRow
        name={me.name}
        detail="You"
        role={role && role.role !== 'narrator' ? role.role : undefined}
        status={statusOf(me)}
        state="eliminated"
      />
      <DividerDeco />
      <Text variant="headingS">Dead chat</Text>
      <ScrollView ref={list} style={styles.flex} contentContainerStyle={styles.chat} keyboardShouldPersistTaps="handled">
        {messages.length === 0 ? (
          <Text variant="bodyS" color={colors.text.muted}>
            No messages yet. Only eliminated players can read this.
          </Text>
        ) : (
          messages.map((m) => <ChatBubble key={m.id} sender={m.authorName} message={m.text} mine={m.authorId === uid} />)
        )}
      </ScrollView>
      <Input
        label="Message"
        placeholder="Write to the dead..."
        value={text}
        onChangeText={setText}
        maxLength={300}
        returnKeyType="send"
        onSubmitEditing={send}
        blurOnSubmit={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  holdButton: {
    height: 52,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radius.sm,
  },
  night: { flex: 1, backgroundColor: colors.bg.base, overflow: 'hidden' },
  // Figma P4 Key art: Scene at 55% opacity, 390 × 693 from y 150.
  nightArt: { position: 'absolute', left: 0, right: 0, top: 150, height: 693.33, opacity: 0.55 },
  nightFadeTop: { position: 'absolute', left: 0, right: 0, top: 150, height: 170 },
  nightFadeBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 144 },
  nightContent: { flex: 1, alignItems: 'center', gap: 14, paddingHorizontal: layout.gutter },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  centerChip: { alignSelf: 'center' },
  center: { alignItems: 'stretch', justifyContent: 'center' },
  flex: { flex: 1 },
  chat: { gap: 14, paddingBottom: spacing.sm },
});
