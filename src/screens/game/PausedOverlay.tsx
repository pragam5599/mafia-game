import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from '@/components';
import { NARRATOR_OFFLINE_END_MS } from '@/game/config';
import { colors, radius, spacing, withAlpha } from '@/theme';
import { confirm } from '@/ui/confirm';
import { useGame } from './context';

// Players' view while the game is paused (on purpose, or because the narrator is offline).
// Not designed in Figma; built in the same style. The host can end the game after 2 minutes offline.
export function PausedOverlay() {
  const { game, isHost, act } = useGame();
  const [now, setNow] = useState(Date.now());
  const [received] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!game.pause) return null;

  const offline = game.pause.reason === 'narratorOffline';
  const offlineFor = game.stampedAt - game.pause.since + (now - received);
  const canEnd = offline && isHost && offlineFor >= NARRATOR_OFFLINE_END_MS;
  const wait = Math.max(0, Math.ceil((NARRATOR_OFFLINE_END_MS - offlineFor) / 1000));

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Text variant="labelS" color={colors.highlight.default} align="center">
          Paused
        </Text>
        <Text variant="displayM" align="center">
          {offline ? 'The narrator is offline' : 'The narrator paused the game'}
        </Text>
        <Text variant="bodyS" color={colors.text.secondary} align="center">
          {offline ? 'The game carries on when they are back. Timers are stopped.' : 'Timers are stopped until they resume.'}
        </Text>
        {offline && isHost ? (
          canEnd ? (
            <Button
              label="End game"
              variant="secondary"
              onPress={() => confirm('End the game?', 'Everyone sees the final roles.', 'End game', () => act({ type: 'endGame' }))}
            />
          ) : (
            <Text variant="bodyS" color={colors.text.muted} align="center">
              {`As host, you can end the game in ${Math.floor(wait / 60)}:${String(wait % 60).padStart(2, '0')}.`}
            </Text>
          )
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: withAlpha(colors.bg.base, 0.85),
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  card: {
    gap: spacing.md,
    padding: spacing['2xl'],
    backgroundColor: colors.bg.surface,
    borderWidth: 1.5,
    borderColor: colors.border.highlight,
    borderRadius: radius.lg,
  },
});
