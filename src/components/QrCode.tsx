import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors, radius } from '@/theme';

// Figma: QR Code (30:39). The app renders the real code (room code inside) at the design size.
type Props = {
  value: string;
  size?: number;
};

export function QrCode({ value, size = 184 }: Props) {
  // Figma placeholder keeps a quiet zone of ~4.35% around the modules.
  const quiet = Math.round(size * 0.0435);
  return (
    <View style={[styles.root, { width: size, height: size, padding: quiet }]}>
      <QRCode
        value={value}
        size={size - quiet * 2}
        color={colors.text.inverse}
        backgroundColor={colors.bg.inverse}
        ecl="M"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.bg.inverse, borderRadius: radius.md, overflow: 'hidden' },
});
