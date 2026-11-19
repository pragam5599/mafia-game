import { useEffect, useState } from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { colors, layout, radius, spacing, withAlpha } from '@/theme';

// "Are you sure?" dialogs. Phones use the system alert. On the web we draw our own dialog:
// browser pop-ups (window.confirm) are blocked in some browsers and in-app views, and then
// silently answer "no".

type Dialog = { title: string; message: string; actionLabel?: string; onConfirm?: () => void };

let show: ((d: Dialog) => void) | null = null;

/** "Are you sure?" with a destructive action. */
export function confirm(title: string, message: string, actionLabel: string, onConfirm: () => void) {
  if (Platform.OS === 'web' && show) return show({ title, message, actionLabel, onConfirm });
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: actionLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

/** A one-button message. */
export function notify(title: string, message: string) {
  if (Platform.OS === 'web' && show) return show({ title, message });
  Alert.alert(title, message);
}

/** Mounted once in app/_layout.tsx; draws the web dialogs. */
export function DialogHost() {
  const [dialog, setDialog] = useState<Dialog | null>(null);
  useEffect(() => {
    show = setDialog;
    return () => {
      show = null;
    };
  }, []);
  if (!dialog) return null;
  const close = () => setDialog(null);
  return (
    <Modal transparent animationType="fade" visible onRequestClose={close}>
      <Pressable style={styles.scrim} onPress={close} accessibilityLabel="Close">
        <Pressable style={styles.card} accessibilityRole="alert" onPress={() => undefined}>
          <Text variant="headingS">{dialog.title}</Text>
          <Text variant="bodyM" color={colors.text.secondary}>
            {dialog.message}
          </Text>
          <View style={styles.buttons}>
            {dialog.onConfirm ? (
              <>
                <Button
                  label={dialog.actionLabel ?? 'OK'}
                  onPress={() => {
                    close();
                    dialog.onConfirm?.();
                  }}
                />
                <Button label="Cancel" variant="secondary" onPress={close} />
              </>
            ) : (
              <Button label="OK" variant="secondary" onPress={close} />
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: layout.gutter,
    backgroundColor: withAlpha(colors.bg.base, 0.8),
  },
  card: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 390 - layout.gutter * 2,
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.lg,
  },
  buttons: { gap: spacing.sm, marginTop: spacing.sm },
});
