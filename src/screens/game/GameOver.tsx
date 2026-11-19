import { useState } from 'react';
import { AnnouncementCard, Button, PlayerRow, Screen, Text, TopBar } from '@/components';
import { api, readError } from '@/firebase/api';
import { colors } from '@/theme';
import { notify } from '@/ui/confirm';
import { useGame } from './context';
import { gameOverEyebrow, statusOf } from './helpers';
import { LeaveChip } from './LeaveChip';

// N10 · Game over (narrator) and P11 · Game over (players). Winner + final roles; host gets Play again.
export function GameOver() {
  const { game, code, isHost, uid } = useGame();
  const [busy, setBusy] = useState(false);
  const a = game.announcement;

  async function again() {
    setBusy(true);
    try {
      await api.playAgain({ code });
    } catch (e) {
      notify('Could not start a new game', readError(e).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen scroll gap={14}>
      <TopBar eyebrow={gameOverEyebrow(game.players, game.round)} title="The case is closed" right={<LeaveChip />} />
      {a ? <AnnouncementCard kind={a.kind} eyebrow={a.eyebrow} title={a.title} detail={a.detail} lastWords={a.lastWords || undefined} /> : null}
      <Text variant="headingS">Final roles</Text>
      {game.players.map((p) => (
        <PlayerRow
          key={p.id}
          name={p.name}
          detail={p.id === uid ? 'You' : undefined}
          role={p.role ?? undefined}
          status={statusOf(p)}
          state={p.alive ? 'default' : 'eliminated'}
        />
      ))}
      {isHost ? (
        <>
          <Button label={busy ? 'Starting…' : 'Play again'} onPress={again} disabled={busy} />
          <Text variant="bodyS" color={colors.text.muted} align="center">
            Only the host sees Play again. A new narrator is picked.
          </Text>
        </>
      ) : (
        <Text variant="labelM" color={colors.text.secondary} align="center">
          Waiting for the host to play again
        </Text>
      )}
    </Screen>
  );
}
