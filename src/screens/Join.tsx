import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Button, DividerDeco, Input, Screen, Spacer, Text, TopBar, goBack } from '@/components';
import { api, readError } from '@/firebase/api';
import { normalizeRoomCode } from '@/game/room';
import { colors, radius, spacing } from '@/theme';

// P1 · Join game (35:927). Scan the host's QR or type the 4-character code.

/** QR holds "https://<project>.web.app/join/4F7K"; a plain code also works. */
function codeFromScan(data: string): string | null {
  const m = data.match(/join\/([A-Za-z0-9]{4})\b/) ?? data.match(/^\s*([A-Za-z0-9]{4})\s*$/);
  return m ? normalizeRoomCode(m[1]) : null;
}

/** `initialCode`: opened from a room link (QR scanned by the phone's camera); joins straight away. */
export function Join({ initialCode }: { initialCode?: string }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [code, setCode] = useState(() => (initialCode ? normalizeRoomCode(initialCode).slice(0, 4) : ''));
  const [error, setError] = useState<{ reason: string | null; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const scanned = useRef(false);

  async function join(value = code) {
    const c = normalizeRoomCode(value);
    if (c.length !== 4) {
      setError({ reason: 'badCode', message: 'Room codes are 4 letters and numbers.' });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.joinRoom({ code: c });
      router.replace(`/room/${c}`);
    } catch (e) {
      setError(readError(e));
      scanned.current = false;
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (initialCode) join();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canScan = Platform.OS !== 'web' && permission?.granted;

  return (
    <Screen avoidKeyboard gap={14}>
      <TopBar onBack={() => goBack('/home')} eyebrow="Join a game" title="Scan the code" subtitle="Point your camera at the host's QR." />

      <View style={styles.camera}>
        {canScan ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => {
              const c = codeFromScan(data);
              if (!c || scanned.current || busy) return;
              scanned.current = true;
              setCode(c);
              join(c);
            }}
          />
        ) : null}
        <View style={styles.viewfinder} />
        {!canScan && Platform.OS !== 'web' && permission && !permission.granted ? (
          <View style={styles.permission}>
            <Button label="Allow camera" variant="secondary" onPress={requestPermission} />
          </View>
        ) : null}
      </View>

      <DividerDeco />
      <Input
        label="Or type the room code"
        placeholder="4F7K"
        value={code}
        onChangeText={(t) => {
          setCode(t.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4));
          setError(null);
        }}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={4}
        state={error ? 'error' : 'default'}
        helper={error?.message}
        returnKeyType="go"
        onSubmitEditing={() => join()}
      />
      {error?.reason === 'nameTaken' ? <Button label="Change name" variant="secondary" onPress={() => router.push('/name?edit=1')} /> : null}
      {busy ? (
        <Text variant="bodyS" color={colors.text.muted}>
          Joining…
        </Text>
      ) : null}
      <Spacer />
      <Button label="Join room" onPress={() => join()} disabled={busy || code.length !== 4} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  camera: {
    height: 280,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.raised,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  viewfinder: {
    width: 180,
    height: 180,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.highlight.default,
    borderRadius: 12,
  },
  permission: { position: 'absolute', left: spacing['2xl'], right: spacing['2xl'], bottom: spacing.lg },
});
