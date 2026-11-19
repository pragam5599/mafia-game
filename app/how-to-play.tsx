import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, DividerDeco, RoleTag, Screen, Text, TopBar, goBack } from '@/components';
import type { Role } from '@/game/types';
import { colors, spacing } from '@/theme';

// How to play (linked from H1). Not designed in Figma; built in the same style from RULES.md.

const ROLES: [Role, string][] = [
  ['mafia', 'Each night, agree with your partners on one person to kill.'],
  ['doctor', 'Each night, save one person. You can save yourself.'],
  ['detective', 'Each night, check one person. The narrator answers yes or no.'],
  ['villager', 'No night action. Find the Mafia and vote them out.'],
];

const STEPS: [string, string][] = [
  ['Night', 'Close your eyes. The narrator wakes each role in turn: Mafia, Doctor, Detective.'],
  ['Dawn', 'The narrator reveals who died, or that no one did.'],
  ['Discussion', 'Three minutes to talk it out, in person.'],
  ['Vote', '30 seconds, secret. The top player is out with at least 2 votes and no tie.'],
];

export default function HowToPlay() {
  return (
    <Screen scroll gap={spacing.xl}>
      <TopBar onBack={() => goBack('/home')} eyebrow="How to play" title="A game of lies" subtitle="One of you is the narrator. Everyone else gets a secret role on their phone." />

      <View style={styles.block}>
        {ROLES.map(([role, text]) => (
          <View key={role} style={styles.roleRow}>
            <RoleTag role={role} />
            <Text variant="bodyS" color={colors.text.secondary} style={styles.flex}>
              {text}
            </Text>
          </View>
        ))}
      </View>

      <DividerDeco />

      <View style={styles.block}>
        {STEPS.map(([title, text]) => (
          <View key={title} style={styles.step}>
            <Text variant="labelS" color={colors.highlight.default}>
              {title}
            </Text>
            <Text variant="bodyM">{text}</Text>
          </View>
        ))}
      </View>

      <DividerDeco />

      <View style={styles.block}>
        <Text variant="headingS">Who wins</Text>
        <Text variant="bodyM" color={colors.text.secondary}>
          Town wins when every Mafia is out. Mafia wins when they match the Town.
        </Text>
      </View>

      <Button label="Back" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.md },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  step: { gap: spacing.xs },
  flex: { flex: 1 },
});
