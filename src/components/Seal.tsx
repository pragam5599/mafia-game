import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme';
import { Text } from './Text';

// Figma: Seal (45:1365). Wax seal stamp shown when a mode is locked in. 96×96.
export function Seal({ letter = 'A' }: { letter?: string }) {
  return (
    <View style={styles.root}>
      <Image source={require('../../assets/icons/seal-wax.svg')} style={styles.wax} contentFit="fill" />
      <Image source={require('../../assets/icons/seal-ring.svg')} style={styles.ring} contentFit="fill" />
      <Image source={require('../../assets/icons/seal-ring-light.svg')} style={styles.ringLight} contentFit="fill" />
      <View style={styles.letterBox}>
        <Text variant="displayXL" color={colors.text.primary} align="center">
          {letter}
        </Text>
      </View>
    </View>
  );
}

// Insets converted from the Figma percentages on a 96px frame.
const styles = StyleSheet.create({
  root: { width: 96, height: 96, overflow: 'hidden' },
  wax: { position: 'absolute', top: 1, left: 1, right: 1, bottom: 1 },
  ring: { position: 'absolute', top: 13, left: 13, right: 13, bottom: 13 },
  ringLight: { position: 'absolute', top: 16.5, left: 16.5, right: 16.5, bottom: 16.5 },
  letterBox: { position: 'absolute', top: 21, bottom: 23, left: 0, right: 0, justifyContent: 'center' },
});
