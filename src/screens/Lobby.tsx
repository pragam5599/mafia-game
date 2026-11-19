import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActionChip, Button, Notice, PlayerRow, QrCode, Screen, Text, TopBar } from '@/components';
import { api, readError } from '@/firebase/api';
import { joinLink, usingEmulators } from '@/firebase/config';
import { MAX_PEOPLE, MIN_PEOPLE } from '@/game/config';
import type { RoomDoc } from '@/game/model';
import { canStart } from '@/game/room';
import { colors, radius } from '@/theme';
import { confirm, notify } from '@/ui/confirm';

// H2 · Host lobby (32:136) and P2 · Lobby waiting (35:950). Live: every join syncs to every phone.

type Props = { room: RoomDoc; uid: string };

function useLeave(code: string) {
  return () =>
    confirm('Leave the room?', 'You can join again with the code while the game has not started.', 'Leave', async () => {
      try {
        await api.leaveRoom({ code });
      } finally {
        router.replace('/home');
      }
    });
}

/** Test helper, only with the local emulators: fills the room with fake players. */
function DevFill({ room }: { room: RoomDoc }) {
  const [busy, setBusy] = useState(false);
  if (!usingEmulators) return null;
  return (
    <ActionChip
      label={busy ? 'Adding…' : 'Dev: add fake players'}
      onPress={async () => {
        setBusy(true);
        try {
          await api.devAddFakePlayers({ code: room.code, count: Math.max(1, Math.min(5, MAX_PEOPLE - room.members.length)) });
        } catch (e) {
          notify('Could not add players', readError(e).message);
        } finally {
          setBusy(false);
        }
      }}
    />
  );
}

export function HostLobby({ room, uid }: Props) {
  const leave = useLeave(room.code);
  const [busy, setBusy] = useState(false);
  const n = room.members.length;
  const needs = `Needs ${MIN_PEOPLE} joined (${MIN_PEOPLE - 1} players + narrator). The narrator is picked at random, host included.`;

  async function start() {
    setBusy(true);
    try {
      await api.startGame({ code: room.code });
    } catch (e) {
      notify('Could not start', readError(e).message);
    } finally {
      setBusy(false);
    }
  }

  function remove(m: { id: string; name: string }) {
    confirm(`Remove ${m.name}?`, 'They leave the room. They can join again with the code.', 'Remove', async () => {
      try {
        await api.removePlayer({ code: room.code, playerId: m.id });
      } catch (e) {
        notify('Could not remove', readError(e).message);
      }
    });
  }

  return (
    <Screen gap={14}>
      <TopBar
        eyebrow={`Host · Room ${room.code}`}
        title="Gather the family"
        subtitle="Players scan the code to join."
        onBack={leave}
      />
      <View style={styles.qrCard}>
        <QrCode value={joinLink(room.code)} size={132} />
        <Text variant="displayM" align="center">
          {room.code}
        </Text>
      </View>
      <View style={styles.joinedHeader}>
        <Text variant="headingS">Players joined</Text>
        <Text variant="labelM" color={colors.highlight.default}>
          {`${n} of ${MAX_PEOPLE}`}
        </Text>
      </View>
      {/* Every player, so the host can remove anyone (tap a row). */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {room.members.map((m) =>
          m.id === room.hostId ? (
            <PlayerRow key={m.id} name={m.name} detail="Host" />
          ) : (
            <PlayerRow key={m.id} name={m.name} detail="Joined · Tap to remove" onPress={() => remove(m)} />
          ),
        )}
      </ScrollView>
      <Text variant="bodyS" color={colors.text.muted}>
        {needs}
      </Text>
      <DevFill room={room} />
      <Button
        label={busy ? 'Starting…' : room.mode === 'B' ? 'Proceed' : 'Start game'}
        onPress={start}
        disabled={busy || !canStart(n)}
      />
    </Screen>
  );
}

export function PlayerLobby({ room, uid }: Props) {
  const leave = useLeave(room.code);
  const me = room.members.find((m) => m.id === uid);
  return (
    <Screen gap={14}>
      <TopBar
        eyebrow={`Room ${room.code}`}
        title="You're in"
        subtitle={me ? `Signed in as ${me.name}` : undefined}
        onBack={leave}
      />
      <Text variant="headingS">{`Players (${room.members.length})`}</Text>
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {room.members.map((m) => (
          <PlayerRow
            key={m.id}
            name={m.name}
            detail={m.id === uid ? 'You' : m.id === room.hostId ? 'Host' : 'Joined'}
            state={m.id === uid ? 'selected' : 'default'}
          />
        ))}
      </ScrollView>
      <Notice kind="waiting" title="Waiting for the host to start" body="The narrator is picked at random when the game starts." />
    </Screen>
  );
}

const styles = StyleSheet.create({
  qrCard: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 18,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.lg,
  },
  joinedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  list: { flex: 1 },
  listContent: { gap: 14 },
});
