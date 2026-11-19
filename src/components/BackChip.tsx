import { router, type Href } from 'expo-router';
import { ActionChip } from './ActionChip';

// Back button for the screens before a game starts. Same chip style as Leave / Pause.
type Props = {
  /** Custom action (e.g. leave the room). Default: go back, or to `fallback` if there is no history. */
  onPress?: () => void;
  fallback?: Href;
};

export function goBack(fallback: Href = '/home') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}

export function BackChip({ onPress, fallback }: Props) {
  return <ActionChip label="‹ Back" onPress={onPress ?? (() => goBack(fallback))} />;
}
