import { useEffect, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ActionChip,
  AnnouncementCard,
  Button,
  ChatBubble,
  DividerDeco,
  Icon,
  Illustration,
  InstructionCard,
  Input,
  ModeCard,
  ModeSelectCard,
  OtpCell,
  PagerDots,
  PlayerRow,
  QrCode,
  RoleCard,
  RoleTag,
  Screen,
  Seal,
  StatusTag,
  StepBar,
  Text,
  Timer,
  TopBar,
  VoteProgress,
  Wordmark,
  type RoleCardRole,
  type Status,
} from '@/components';
import { colors, radius, spacing, type TypeVariant } from '@/theme';

// Phase 1 preview: every design-system component with its variants, built only from tokens.

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <DividerDeco />
      <Text variant="displayM">{title}</Text>
      {note ? (
        <Text variant="bodyS" color={colors.text.muted}>
          {note}
        </Text>
      ) : null}
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const swatches: [string, string][] = [
  ['bg/base', colors.bg.base],
  ['bg/surface', colors.bg.surface],
  ['bg/raised', colors.bg.raised],
  ['bg/overlay', colors.bg.overlay],
  ['bg/inverse', colors.bg.inverse],
  ['border/subtle', colors.border.subtle],
  ['border/strong', colors.border.strong],
  ['accent/default', colors.accent.default],
  ['accent/hover', colors.accent.hover],
  ['accent/subtle', colors.accent.subtle],
  ['highlight/default', colors.highlight.default],
  ['highlight/subtle', colors.highlight.subtle],
  ['success/default', colors.success.default],
  ['success/subtle', colors.success.subtle],
  ['text/primary', colors.text.primary],
  ['text/secondary', colors.text.secondary],
  ['text/muted', colors.text.muted],
  ['role/mafia', colors.role.mafia],
  ['role/doctor', colors.role.doctor],
  ['role/detective', colors.role.detective],
  ['role/villager', colors.role.villager],
  ['disabled/bg', colors.disabled.bg],
  ['disabled/text', colors.disabled.text],
];

const typeSamples: [TypeVariant, string, string][] = [
  ['displayXL', 'Display/XL', 'Mafia wins'],
  ['displayL', 'Display/L', 'Night 1 · Mafia'],
  ['displayM', 'Display/M', 'Isha was killed'],
  ['numericTimer', 'Numeric/Timer', '03:00'],
  ['headingS', 'Heading/S', 'Players joined'],
  ['bodyM', 'Body/M', 'Each night, save one person.'],
  ['bodyMStrong', 'Body/M Strong', 'Aarav'],
  ['bodyS', 'Body/S', 'Votes are secret.'],
  ['labelM', 'Label/M', 'Confirm and go to step 2'],
  ['labelS', 'Label/S', 'Night 1 · Step 1 of 3'],
];

const players = ['Aarav', 'Isha', 'Rohan', 'Tara', 'Zoya'];
const allStatuses: Status[] = ['alive', 'dead', 'eliminated', 'target', 'saved', 'checked', 'seen', 'waiting'];
const roleCards: RoleCardRole[] = ['hidden', 'mafia', 'doctor', 'detective', 'villager', 'narrator'];

export default function ComponentPreview() {
  const [paused, setPaused] = useState(false);
  const [rolesHidden, setRolesHidden] = useState(false);
  const [pick, setPick] = useState('Isha');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [seconds, setSeconds] = useState(180);
  const [voteSeconds, setVoteSeconds] = useState(30);
  const [votes, setVotes] = useState(3);
  const [roleIndex, setRoleIndex] = useState(1);
  const [focusMode, setFocusMode] = useState<'A' | 'B'>('A');

  // Demo countdowns so the timers move.
  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((s) => (s <= 0 ? 180 : s - 1));
      setVoteSeconds((s) => (s <= 0 ? 30 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const usernameState = username.length === 0 ? 'default' : username.toLowerCase() === 'aarav' ? 'error' : 'success';
  const usernameHelper =
    usernameState === 'error'
      ? `${username} is already taken. Pick another.`
      : usernameState === 'success'
        ? `${username} is available`
        : 'Try typing "aarav" to see the taken state.';

  return (
    <Screen scroll gap={spacing['2xl']}>
      <TopBar
        eyebrow="Phase 1 · Design system"
        title="Components"
        subtitle="Every component from the Figma design system, built from the Noir tokens. Tap things: chips, rows and buttons respond."
      />

      <Section title="Wordmark">
        <Wordmark />
      </Section>

      <Section title="Color tokens" note="Semantic tokens only. Screens never use raw hex.">
        <View style={styles.swatchGrid}>
          {swatches.map(([name, value]) => (
            <View key={name} style={styles.swatch}>
              <View style={[styles.chip, { backgroundColor: value }]} />
              <Text variant="bodyS" color={colors.text.secondary} numberOfLines={1}>
                {name}
              </Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Typography" note="Spectral, DM Sans and Barlow Condensed. Text shows exactly as written.">
        {typeSamples.map(([variant, label, sample]) => (
          <View key={variant} style={styles.typeRow}>
            <Text variant="labelS" color={colors.highlight.default}>
              {label}
            </Text>
            <Text variant={variant}>{sample}</Text>
          </View>
        ))}
      </Section>

      <Section title="Button" note="Primary moves the game on. Secondary = alternative or Back. Ghost = low emphasis.">
        <Button label="Continue" />
        <Button label="Continue" disabled />
        <Button label="Back" variant="secondary" />
        <Button label="Back" variant="secondary" disabled />
        <Button label="Wrong number? Go back" variant="ghost" />
        <Button label="Wrong number? Go back" variant="ghost" disabled />
        <View style={styles.row}>
          <View style={styles.backButton}>
            <Button label="Back" variant="secondary" />
          </View>
          <View style={styles.fill}>
            <Button label="Confirm" />
          </View>
        </View>
      </Section>

      <Section title="Action chip" note="Tap to toggle.">
        <View style={styles.row}>
          <ActionChip label={paused ? 'Resume' : 'Pause'} active={paused} onPress={() => setPaused(!paused)} />
          <ActionChip label="Hide roles" active={rolesHidden} onPress={() => setRolesHidden(!rolesHidden)} />
        </View>
      </Section>

      <Section title="Top bar">
        <TopBar eyebrow="Step 2 of 3" title="Enter the code" subtitle="Sent to +91 98xxxxxx10" />
        <TopBar
          eyebrow="Night 1 · Step 1 of 3"
          title="Night 1 · Mafia"
          subtitle="Waiting for the Mafia to pick a target"
          narrator={{
            paused,
            onTogglePause: () => setPaused(!paused),
            rolesHidden,
            onToggleHideRoles: () => setRolesHidden(!rolesHidden),
          }}
        />
      </Section>

      <Section title="Input" note="Focus = typing. Error = invalid or taken. Success = live check passed.">
        <Input
          label="Phone number"
          placeholder="Enter phone number"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          helper="Your number is private. Other players never see it."
        />
        <Input
          label="Username"
          placeholder="Choose a username"
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
          state={usernameState}
          helper={usernameHelper}
        />
        <Input label="Username" value="pragam_" forceFocus helper="Checking availability..." editable={false} />
      </Section>

      <Section title="OTP cell">
        <View style={styles.otpRow}>
          <OtpCell digit="4" state="filled" />
          <OtpCell digit="7" state="filled" />
          <OtpCell digit="2" state="filled" />
          <OtpCell state="active" />
          <OtpCell />
          <OtpCell />
        </View>
      </Section>

      <Section title="Role tag and status tag">
        <View style={styles.wrap}>
          <RoleTag role="mafia" />
          <RoleTag role="doctor" />
          <RoleTag role="detective" />
          <RoleTag role="villager" />
          <RoleTag role="narrator" />
        </View>
        <View style={styles.wrap}>
          {allStatuses.map((s) => (
            <StatusTag key={s} status={s} />
          ))}
        </View>
      </Section>

      <Section title="Player row" note="Tap a row to pick it. Tara is a Mafia partner (disabled); Zoya is out.">
        {players.map((name) => {
          const disabled = name === 'Tara';
          const out = name === 'Zoya';
          const selected = pick === name;
          return (
            <PlayerRow
              key={name}
              name={name}
              detail={out ? 'Voted out on day 1' : 'Alive'}
              role={rolesHidden ? undefined : name === 'Aarav' || name === 'Tara' ? 'mafia' : 'villager'}
              status={out ? 'eliminated' : selected ? 'target' : 'alive'}
              state={out ? 'eliminated' : disabled ? 'disabled' : selected ? 'selected' : 'default'}
              onPress={() => setPick(name)}
            />
          );
        })}
      </Section>

      <Section title="Step bar">
        <StepBar
          steps={[
            { name: 'Mafia', state: 'now' },
            { name: 'Doctor', state: 'upcoming' },
            { name: 'Detective', state: 'upcoming' },
          ]}
        />
        <StepBar
          steps={[
            { name: 'Mafia', state: 'done' },
            { name: 'Doctor', state: 'now' },
            { name: 'Detective', state: 'upcoming' },
          ]}
        />
        <StepBar
          steps={[
            { name: 'Mafia', state: 'done' },
            { name: 'Doctor', state: 'skipped' },
            { name: 'Detective', state: 'now' },
          ]}
        />
      </Section>

      <Section title="Instruction card">
        <InstructionCard
          quote={'"Mafia, wake up. Point at one person to kill." … "Mafia, close your eyes."'}
          hint="Tap who they point at. Once they agree, say the last line, then confirm."
        />
      </Section>

      <Section title="Timer" note="Large = discussion. Compact = 30-second vote.">
        <Timer label="Discussion" secondsLeft={seconds} progress={seconds / 180} caption="+1 min used: 1 of 3" />
        <Timer label="Voting" size="compact" secondsLeft={voteSeconds} />
      </Section>

      <Section title="Vote progress" note="Tap to add a vote.">
        <VoteProgress done={votes} total={5} />
        <Button label="Add a vote" variant="secondary" onPress={() => setVotes((v) => (v >= 5 ? 0 : v + 1))} />
      </Section>

      <Section title="Announcement card">
        <AnnouncementCard
          kind="death"
          eyebrow="Dawn · Night 1"
          title="Isha was killed"
          detail="Role: Villager"
          lastWords="Found at first light."
        />
        <AnnouncementCard
          kind="saved"
          eyebrow="Dawn · Night 1"
          title="No one died tonight"
          detail="The Doctor got there first."
          lastWords="Not tonight."
        />
        <AnnouncementCard
          kind="eliminated"
          eyebrow="Day 1 · Vote result"
          title="Rohan is eliminated"
          detail="Role: Mafia"
          lastWords="The town has spoken."
        />
        <AnnouncementCard
          kind="noElimination"
          eyebrow="Day 1 · Vote result"
          title="No one was eliminated"
          detail="Tie, or fewer than 2 votes."
          lastWords="The town is divided."
        />
        <AnnouncementCard
          kind="townWins"
          eyebrow="Game over"
          title="Town wins"
          detail="Every Mafia player is out."
          lastWords="The streets are quiet again."
        />
        <AnnouncementCard
          kind="mafiaWins"
          eyebrow="Game over"
          title="Mafia wins"
          detail="The Mafia now match the Town."
          lastWords="The city belongs to the family."
        />
      </Section>

      <Section title="Role card" note="Tap Next role to flip through all six.">
        <RoleCard
          role={roleCards[roleIndex]}
          description={
            roleCards[roleIndex] === 'mafia'
              ? 'Each night, agree with your partners on one person to kill. Partners: Aarav, Tara.'
              : undefined
          }
        />
        <Button label="Next role" variant="secondary" onPress={() => setRoleIndex((i) => (i + 1) % roleCards.length)} />
      </Section>

      <Section title="Mode select card" note="Tap a button to focus a mode. The other card shows idle.">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
          <ModeSelectCard mode="A" focused={focusMode === 'A'} />
          <ModeSelectCard mode="B" focused={focusMode === 'B'} />
        </ScrollView>
        <PagerDots count={2} active={focusMode === 'A' ? 0 : 1} />
        <View style={styles.row}>
          <View style={styles.fill}>
            <Button label="Focus Mode I" variant="secondary" onPress={() => setFocusMode('A')} />
          </View>
          <View style={styles.fill}>
            <Button label="Focus Mode II" variant="secondary" onPress={() => setFocusMode('B')} />
          </View>
        </View>
      </Section>

      <Section title="Mode card">
        <ModeCard
          modeLabel="Mode A"
          title="Human narrator"
          description="One player is picked at random to run the game out loud. Everyone uses their phone for roles and votes."
          meta={['5–21 players', 'In person']}
          state="selected"
        />
        <ModeCard
          modeLabel="Mode B"
          title="App narrator"
          description="The app runs the night, the timers and the votes."
          meta={['Coming soon']}
          state="disabled"
        />
      </Section>

      <Section title="Chat bubble">
        <ChatBubble sender="Zoya" message="It was Isha, I think." />
        <ChatBubble sender="You" message="No idea. Watch Tara." mine />
      </Section>

      <Section title="QR code" note="Real, scannable code. This one holds the room code 4F7K.">
        <View style={styles.center}>
          <QrCode value="mafia://join/4F7K" size={132} />
        </View>
      </Section>

      <Section title="Seal, icons, pager dots">
        <View style={[styles.row, styles.centerRow]}>
          <Seal letter="A" />
          <Icon name="lock" />
          <Icon name="check" />
          <PagerDots count={2} active={0} />
        </View>
      </Section>

      <Section title="Illustrations" note="Exported from Figma as PNG @3x.">
        <View style={styles.wrap}>
          <Illustration name="duo" style={[styles.thumb, styles.duo]} />
          <Illustration name="doctor" style={styles.thumb} />
          <Illustration name="detective" style={styles.thumb} />
          <Illustration name="villager" style={styles.thumb} />
          <Illustration name="narrator" style={styles.thumb} />
          <Illustration name="hidden" style={styles.thumb} />
          <Illustration name="radio" style={styles.radioThumb} />
          <Illustration name="scene" style={styles.sceneThumb} />
        </View>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  sectionBody: { gap: spacing.md },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  centerRow: { justifyContent: 'space-around' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  fill: { flex: 1 },
  backButton: { width: 128 },
  center: { alignItems: 'center' },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between' },
  swatchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  swatch: { width: '31%', gap: spacing.xs },
  chip: { height: 40, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border.subtle },
  typeRow: { gap: 2 },
  carousel: { gap: spacing.lg, paddingVertical: spacing['2xl'], paddingHorizontal: spacing.xs },
  thumb: { width: 162, height: 125 },
  duo: { borderRadius: 10 },
  radioThumb: { width: 162, height: 145 },
  sceneThumb: { width: 162, height: 288 },
});
