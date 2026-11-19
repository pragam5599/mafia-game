import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionChip, BackChip, Button, Illustration, Loading, Spacer, Text, Wordmark } from '@/components';
import { api, readError, savedMode } from '@/firebase/api';
import type { RoomMode } from '@/game/model';
import { useCurrentRoomCode, useRoom, useSession } from '@/firebase/hooks';
import { colors, layout, spacing, withAlpha } from '@/theme';
import { notify } from '@/ui/confirm';

// H1 · Home (32:108). Create room (host) or Join room.
export default function Home() {
  const session = useSession();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<RoomMode>('A');
  useEffect(() => {
    savedMode().then(setMode);
  }, []);
  const currentCode = useCurrentRoomCode(session.status === 'ready' ? session.user.uid : null);
  const currentRoom = useRoom(currentCode ?? undefined);
  const canReturn = !!currentCode && !!currentRoom && currentRoom.status !== 'closed';

  if (session.status === 'loading') return <Loading />;
  if (session.status === 'needsName') return <Redirect href="/name" />;

  async function createRoom() {
    setBusy(true);
    try {
      const { code } = await api.createRoom({ mode });
      router.push(`/room/${code}`);
    } catch (e) {
      notify('Could not create a room', readError(e).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.root}>
      {/* Key art: Scene at 390 × 693, top −170, fading into the background. */}
      <Illustration name="scene" style={styles.keyArt} />
      <LinearGradient
        colors={[withAlpha(colors.bg.base, 0), withAlpha(colors.bg.base, 0.9), colors.bg.base]}
        locations={[0, 0.7, 1]}
        style={styles.fade}
      />
      <View style={styles.below} />

      <View
        style={[
          styles.content,
          { paddingTop: Math.max(layout.topInset, insets.top + spacing.md), paddingBottom: Math.max(insets.bottom, spacing['2xl']) },
        ]}
      >
        <View style={styles.back}>
          <BackChip onPress={() => router.replace('/mode')} />
        </View>
        <View style={styles.chip}>
          <ActionChip
            label={`${session.profile.username} · Mode ${mode}`}
            active
            onPress={() => router.push('/name?edit=1')}
          />
        </View>
        <Spacer />
        <Wordmark />
        <Text variant="bodyM" color={colors.text.secondary} align="center" style={styles.tagline}>
          A game of lies, played in one room.
        </Text>
        {canReturn ? (
          // Not in Figma: shown only after a dropped phone or closed app, to get back in.
          <Button label={`Back to room ${currentCode}`} onPress={() => router.push(`/room/${currentCode}`)} />
        ) : null}
        <Button label={busy ? 'Creating…' : 'Create room'} onPress={createRoom} disabled={busy} variant={canReturn ? 'secondary' : 'primary'} />
        <Button label="Join room" variant="secondary" onPress={() => router.push('/join')} />
        <Button label="How to play" variant="ghost" onPress={() => router.push('/how-to-play')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base, overflow: 'hidden' },
  keyArt: { position: 'absolute', left: 0, right: 0, top: -170, height: 693.33 },
  fade: { position: 'absolute', left: 0, right: 0, top: 323.33, height: 210 },
  below: { position: 'absolute', left: 0, right: 0, top: 533.33, bottom: 0, backgroundColor: colors.bg.base },
  content: { flex: 1, alignItems: 'center', gap: spacing.lg, paddingHorizontal: layout.gutter },
  tagline: { alignSelf: 'stretch' },
  chip: { alignSelf: 'center' },
  back: { alignSelf: 'flex-start' },
});
