import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, Input, Screen, Spacer, TopBar, goBack } from '@/components';
import { readError, saveName, savedName } from '@/firebase/api';
import { useSession } from '@/firebase/hooks';
import { KEY_STRINGS } from '@/game/copy';
import { checkName, cleanName } from '@/game/username';

// Name (replaces login A1–A4). First screen, and "change name" from the Home chip.
// `edit=1`: came from Home, go back after saving. `next`: a join link that opened the app.

export default function Name() {
  const { edit, next } = useLocalSearchParams<{ edit?: string; next?: string }>();
  const session = useSession();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Prefill: the name on the server, else the one saved on this device.
  const current = session.status === 'ready' ? session.profile.username : null;
  useEffect(() => {
    if (current) setName((n) => n || current);
    else savedName().then((saved) => setName((n) => n || saved));
  }, [current]);

  async function submit() {
    if (checkName(name)) return;
    setBusy(true);
    setError(null);
    try {
      await saveName(name);
      if (edit) goBack('/home');
      else router.replace((next as Href) ?? '/mode');
    } catch (e) {
      setError(readError(e).message);
    } finally {
      setBusy(false);
    }
  }

  const tooLong = checkName(name) === 'tooLong';
  return (
    <Screen avoidKeyboard>
      <TopBar
        onBack={edit ? () => goBack('/home') : undefined}
        eyebrow={edit ? 'Your name' : 'Welcome'}
        title="What's your name?"
        subtitle={KEY_STRINGS.nameIntro}
      />
      <Input
        label="Name"
        placeholder="Your name"
        value={name}
        onChangeText={(t) => {
          setName(t);
          setError(null);
        }}
        autoCapitalize="words"
        autoCorrect={false}
        autoFocus
        maxLength={24}
        state={error || tooLong ? 'error' : 'default'}
        helper={error ?? (tooLong ? 'Use 16 characters or fewer.' : '1 to 16 characters.')}
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      <Spacer />
      <Button label={busy ? 'Saving…' : 'Continue'} onPress={submit} disabled={busy || !!checkName(cleanName(name))} />
    </Screen>
  );
}
