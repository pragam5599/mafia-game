import { router } from 'expo-router';
import { ActionChip, Button, Screen, Spacer, TopBar } from '@/components';
import { confirm } from '@/ui/confirm';
import { useGame } from './context';

// Leave the game for good (not designed in Figma; same chip as the lobby's Leave).
// RULES.md: a player who leaves is eliminated and their role stays hidden until the game ends.
export function LeaveChip() {
  const { act, game } = useGame();
  const over = game.phase === 'gameOver';
  return (
    <ActionChip
      label="Leave"
      onPress={() =>
        confirm(
          over ? 'Leave the room?' : 'Leave the game?',
          over ? 'You will not be in the next game.' : 'You will be out of this game. You cannot come back in.',
          'Leave',
          async () => {
            if (await act({ type: 'leave' })) router.replace('/home');
          },
        )
      }
    />
  );
}

/** Shown if someone who left opens the room again. */
export function LeftGame() {
  const { code } = useGame();
  return (
    <Screen>
      <TopBar eyebrow={`Room ${code}`} title="You left this game" subtitle="Your role stays hidden until the game ends." />
      <Spacer />
      <Button label="Back to home" onPress={() => router.replace('/home')} />
    </Screen>
  );
}
